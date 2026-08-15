import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    // ============================================================
    // 1. Get logged-in user
    // ============================================================

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in to invite a team member.",
        },
        { status: 401 }
      );
    }

    // ============================================================
    // 2. Read request
    // ============================================================

    const body = await request.json();

    const {
      full_name,
      email,
      role_id,
    } = body;

    if (!full_name || !email || !role_id) {
      return NextResponse.json(
        {
          error: "Full name, email, and role are required.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ============================================================
    // 3. Get inviter's company
    // IMPORTANT:
    // Do not trust company_id sent from browser.
    // ============================================================

    const {
      data: inviterProfile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("company_id, is_owner, role_id")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !inviterProfile?.company_id
    ) {
      console.error(
        "INVITER PROFILE ERROR:",
        profileError
      );

      return NextResponse.json(
        {
          error:
            "Your account is not connected to a company.",
        },
        { status: 400 }
      );
    }

    const companyId = inviterProfile.company_id;

    console.log("====================================");
    console.log("TEAM INVITATION");
    console.log("INVITER:", user.id);
    console.log("INVITER EMAIL:", user.email);
    console.log("COMPANY:", companyId);
    console.log("RECIPIENT:", normalizedEmail);
    console.log("ROLE:", role_id);
    console.log("====================================");

    // ============================================================
    // 4. Verify role
    // ============================================================

    const {
      data: role,
      error: roleError,
    } = await supabase
      .from("roles")
      .select("id, name")
      .eq("id", role_id)
      .single();

    if (roleError || !role) {
      console.error(
        "ROLE ERROR:",
        roleError
      );

      return NextResponse.json(
        {
          error: "Selected role does not exist.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 5. Prevent inviting yourself
    // ============================================================

    if (
      user.email &&
      user.email.toLowerCase() === normalizedEmail
    ) {
      return NextResponse.json(
        {
          error: "You cannot invite yourself.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 6. Check Supabase Auth for existing user
    //
    // IMPORTANT:
    // We check Auth directly because profiles.email may not
    // always be populated.
    // ============================================================

    let existingAuthUser = null;

    const {
      data: authUsers,
      error: authUsersError,
    } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (authUsersError) {
      console.error(
        "AUTH USER LOOKUP ERROR:",
        authUsersError
      );

      return NextResponse.json(
        {
          error:
            "Unable to check existing user accounts.",
        },
        { status: 500 }
      );
    }

    existingAuthUser =
      authUsers.users.find(
        (authUser) =>
          authUser.email?.toLowerCase() ===
          normalizedEmail
      ) || null;

    console.log(
      "EXISTING AUTH USER:",
      existingAuthUser?.id || "NONE"
    );

    // ============================================================
    // 7. EXISTING USER
    //
    // If the user already has a Supabase account:
    // - Find their profile
    // - If they have another company -> reject
    // - If they are already in this company -> reject
    // - If they have no company -> add them immediately
    //
    // No inviteUserByEmail() is called for existing users.
    // ============================================================

    if (existingAuthUser) {
      console.log(
        "EXISTING USER FOUND:",
        existingAuthUser.id
      );

      const {
        data: existingProfile,
        error: existingProfileError,
      } = await supabaseAdmin
        .from("profiles")
        .select(
          "id, email, company_id, full_name, role_id"
        )
        .eq("id", existingAuthUser.id)
        .maybeSingle();

      if (existingProfileError) {
        console.error(
          "EXISTING PROFILE ERROR:",
          existingProfileError
        );

        return NextResponse.json(
          {
            error:
              "The user exists, but their company profile could not be loaded.",
          },
          { status: 400 }
        );
      }

      // ----------------------------------------------------------
      // Profile doesn't exist
      // ----------------------------------------------------------

      if (!existingProfile) {
        console.error(
          "AUTH USER HAS NO PROFILE:",
          existingAuthUser.id
        );

        return NextResponse.json(
          {
            error:
              "This user has an account but does not have a company profile yet.",
          },
          { status: 400 }
        );
      }

      // ----------------------------------------------------------
      // Already belongs to this company
      // ----------------------------------------------------------

      if (
        existingProfile.company_id === companyId
      ) {
        return NextResponse.json(
          {
            error:
              "This user is already a member of your company.",
          },
          { status: 400 }
        );
      }

      // ----------------------------------------------------------
      // Belongs to another company
      // ----------------------------------------------------------

      if (
        existingProfile.company_id &&
        existingProfile.company_id !== companyId
      ) {
        return NextResponse.json(
          {
            error:
              "This user already belongs to another company.",
          },
          { status: 400 }
        );
      }

      // ----------------------------------------------------------
      // Existing user with no company
      // Add them immediately
      // ----------------------------------------------------------

      const {
        error: updateError,
      } = await supabaseAdmin
        .from("profiles")
        .update({
          company_id: companyId,
          role_id: role_id,
          full_name:
            full_name.trim() ||
            existingProfile.full_name ||
            null,
          is_owner: false,
        })
        .eq("id", existingAuthUser.id);

      if (updateError) {
        console.error(
          "EXISTING USER COMPANY UPDATE ERROR:",
          updateError
        );

        return NextResponse.json(
          {
            error: updateError.message,
          },
          { status: 400 }
        );
      }

      // ----------------------------------------------------------
      // Mark pending invitations as accepted
      // ----------------------------------------------------------

      const {
        error: invitationUpdateError,
      } = await supabaseAdmin
        .from("invitations")
        .update({
          status: "Accepted",
        })
        .eq("company_id", companyId)
        .eq("email", normalizedEmail)
        .eq("status", "Pending");

      if (invitationUpdateError) {
        console.error(
          "INVITATION STATUS UPDATE ERROR:",
          invitationUpdateError
        );
      }

      console.log(
        "EXISTING USER ADDED TO COMPANY:",
        existingAuthUser.id
      );

      return NextResponse.json({
        success: true,
        existing_user: true,
        message:
          `${normalizedEmail} already had an account and has been added to your company successfully.`,
      });
    }

    // ============================================================
    // 8. NEW USER
    //
    // The email does not exist in Supabase Auth.
    // Create invitation and send invitation email.
    // ============================================================

    console.log(
      "NEW USER - CREATING INVITATION"
    );

    // ------------------------------------------------------------
    // Check for existing pending invitation
    // ------------------------------------------------------------

    const {
      data: existingInvitation,
      error: existingInvitationError,
    } = await supabaseAdmin
      .from("invitations")
      .select("id, status")
      .eq("company_id", companyId)
      .eq("email", normalizedEmail)
      .eq("status", "Pending")
      .maybeSingle();

    if (existingInvitationError) {
      console.error(
        "EXISTING INVITATION CHECK ERROR:",
        existingInvitationError
      );

      return NextResponse.json(
        {
          error:
            "Unable to check existing invitations.",
        },
        { status: 500 }
      );
    }

    if (existingInvitation) {
      return NextResponse.json(
        {
          error:
            "An invitation is already pending for this email address.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // Create invitation
    // ------------------------------------------------------------

    const {
      data: invitation,
      error: inviteError,
    } = await supabaseAdmin
      .from("invitations")
      .insert({
        full_name: full_name.trim(),
        company_id: companyId,
        email: normalizedEmail,
        role_id: role_id,
        invited_by: user.id,
        status: "Pending",
      })
      .select()
      .single();

    if (inviteError) {
      console.error(
        "INVITATION INSERT ERROR:",
        inviteError
      );

      return NextResponse.json(
        {
          error: inviteError.message,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 9. Send Supabase invitation email
    // ============================================================

    const appUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const redirectUrl =
      `${appUrl}/auth/callback?next=/app/accept-invitation&invitation_id=${invitation.id}`;

    console.log(
      "INVITATION REDIRECT:",
      redirectUrl
    );

    const {
      data: invitedUser,
      error: emailError,
    } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(
        normalizedEmail,
        {
          redirectTo: redirectUrl,

          data: {
            invitation_id: invitation.id,
            company_id: companyId,
            role_id: role_id,
            full_name: full_name.trim(),
          },
        }
      );

    // ============================================================
    // 10. Email failed
    // ============================================================

    if (emailError) {
      console.error(
        "SUPABASE INVITATION EMAIL ERROR:",
        emailError
      );

      // Delete invitation because email was not sent
      await supabaseAdmin
        .from("invitations")
        .delete()
        .eq("id", invitation.id);

      return NextResponse.json(
        {
          error:
            emailError.message ||
            "Invitation email could not be sent.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 11. New invitation successful
    // ============================================================

    console.log(
      "NEW USER INVITATION SENT:",
      invitedUser?.user?.email
    );

    return NextResponse.json({
      success: true,
      existing_user: false,
      message:
        `Invitation sent successfully to ${normalizedEmail}.`,
      invitation_id: invitation.id,
    });

  } catch (error) {
    console.error(
      "TEAM INVITATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process team invitation.",
      },
      {
        status: 500,
      }
    );
  }
}