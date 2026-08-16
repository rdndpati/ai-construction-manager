import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    // ============================================================
    // 1. GET LOGGED-IN USER
    // ============================================================

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "You must be logged in to invite a team member.",
        },
        { status: 401 }
      );
    }

    // ============================================================
    // 2. READ REQUEST
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
          error:
            "Full name, email, and role are required.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // ============================================================
    // 3. GET INVITER PROFILE
    // ============================================================

    const {
      data: inviterProfile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "company_id, is_owner, role_id"
      )
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

    const companyId =
      inviterProfile.company_id;

    // ============================================================
    // 4. VERIFY INVITER IS OWNER OR ADMIN
    // ============================================================

    let inviterIsAdmin = false;

    if (inviterProfile.role_id) {
      const {
        data: inviterRole,
        error: inviterRoleError,
      } = await supabase
        .from("roles")
        .select("name")
        .eq(
          "id",
          inviterProfile.role_id
        )
        .single();

      if (inviterRoleError) {
        console.error(
          "INVITER ROLE ERROR:",
          inviterRoleError
        );
      }

      inviterIsAdmin =
        inviterRole?.name
          ?.trim()
          .toLowerCase() === "admin";
    }

    const inviterIsOwner =
      inviterProfile.is_owner === true;

    if (
      !inviterIsOwner &&
      !inviterIsAdmin
    ) {
      return NextResponse.json(
        {
          error:
            "Only company owners and administrators can invite team members.",
        },
        { status: 403 }
      );
    }

    // ============================================================
    // 5. VERIFY SELECTED ROLE
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
          error:
            "Selected role does not exist.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 6. PREVENT INVITING YOURSELF
    // ============================================================

    if (
      user.email &&
      user.email.toLowerCase() ===
        normalizedEmail
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot invite yourself.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // LOG
    // ============================================================

    console.log(
      "===================================="
    );

    console.log(
      "TEAM INVITATION"
    );

    console.log(
      "INVITER:",
      user.id
    );

    console.log(
      "COMPANY:",
      companyId
    );

    console.log(
      "RECIPIENT:",
      normalizedEmail
    );

    console.log(
      "ROLE:",
      role.name
    );

    console.log(
      "===================================="
    );

    // ============================================================
    // 7. FIND EXISTING AUTH USER
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

    // ============================================================
    // 8. EXISTING AUTH USER
    // ============================================================

    if (existingAuthUser) {
      console.log(
        "EXISTING AUTH USER:",
        existingAuthUser.id
      );

      // ----------------------------------------------------------
      // Get profile
      // ----------------------------------------------------------

      const {
        data: existingProfile,
        error: existingProfileError,
      } = await supabaseAdmin
        .from("profiles")
        .select(
          "id, email, company_id, full_name, role_id, is_owner"
        )
        .eq(
          "id",
          existingAuthUser.id
        )
        .maybeSingle();

      if (existingProfileError) {
        console.error(
          "EXISTING PROFILE ERROR:",
          existingProfileError
        );

        return NextResponse.json(
          {
            error:
              "The existing user's profile could not be checked.",
          },
          { status: 500 }
        );
      }

      // ==========================================================
      // 8A. EXISTING AUTH USER BUT NO PROFILE
      // ==========================================================

      if (!existingProfile) {
        console.log(
          "AUTH USER HAS NO PROFILE."
        );

        console.log(
          "CREATING COMPANY PROFILE."
        );

        const {
          data: newProfile,
          error: createProfileError,
        } =
          await supabaseAdmin
            .from("profiles")
            .insert({
              id: existingAuthUser.id,
              company_id: companyId,
              full_name:
                full_name.trim(),
              role_id: role_id,
              is_owner: false,
              email:
                normalizedEmail,
            })
            .select()
            .single();

        if (createProfileError) {
          console.error(
            "CREATE PROFILE ERROR:",
            createProfileError
          );

          return NextResponse.json(
            {
              error:
                createProfileError.message ||
                "Unable to create the user's company profile.",
            },
            { status: 400 }
          );
        }

        console.log(
          "PROFILE CREATED:",
          newProfile
        );

        // --------------------------------------------------------
        // Create invitation record as accepted
        // --------------------------------------------------------

        const {
          error: invitationError,
        } = await supabaseAdmin
          .from("invitations")
          .insert({
            full_name:
              full_name.trim(),
            company_id: companyId,
            email: normalizedEmail,
            role_id: role_id,
            invited_by: user.id,
            status: "Accepted",
          });

        if (invitationError) {
          console.error(
            "INVITATION RECORD ERROR:",
            invitationError
          );

          // Do not remove the profile here.
          // The user has already been successfully
          // connected to the company.
        }

        return NextResponse.json({
          success: true,
          existing_user: true,
          profile_created: true,
          message:
            `${normalizedEmail} already had an account and has been added to your company successfully.`,
        });
      }

      // ==========================================================
      // 8B. USER ALREADY BELONGS TO THIS COMPANY
      // ==========================================================

      if (
        existingProfile.company_id ===
        companyId
      ) {
        return NextResponse.json(
          {
            error:
              "This user is already a member of your company.",
          },
          { status: 400 }
        );
      }

      // ==========================================================
      // 8C. USER BELONGS TO ANOTHER COMPANY
      // ==========================================================

      if (
        existingProfile.company_id &&
        existingProfile.company_id !==
          companyId
      ) {
        return NextResponse.json(
          {
            error:
              "This user already belongs to another company.",
          },
          { status: 400 }
        );
      }

      // ==========================================================
      // 8D. PROFILE EXISTS BUT HAS NO COMPANY
      // ==========================================================

      if (
        !existingProfile.company_id
      ) {
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
          .eq(
            "id",
            existingAuthUser.id
          );

        if (updateError) {
          console.error(
            "PROFILE COMPANY UPDATE ERROR:",
            updateError
          );

          return NextResponse.json(
            {
              error:
                updateError.message,
            },
            { status: 400 }
          );
        }

        // --------------------------------------------------------
        // Record invitation
        // --------------------------------------------------------

        const {
          error: invitationError,
        } = await supabaseAdmin
          .from("invitations")
          .insert({
            full_name:
              full_name.trim(),
            company_id: companyId,
            email: normalizedEmail,
            role_id: role_id,
            invited_by: user.id,
            status: "Accepted",
          });

        if (invitationError) {
          console.error(
            "INVITATION RECORD ERROR:",
            invitationError
          );
        }

        return NextResponse.json({
          success: true,
          existing_user: true,
          message:
            `${normalizedEmail} has been added to your company successfully.`,
        });
      }
    }

    // ============================================================
    // 9. NEW USER
    // ============================================================

    console.log(
      "NEW AUTH USER - CREATING INVITATION"
    );

    // ============================================================
    // 10. CHECK EXISTING PENDING INVITATION
    // ============================================================

    const {
      data: existingInvitation,
      error: existingInvitationError,
    } =
      await supabaseAdmin
        .from("invitations")
        .select("id, status")
        .eq(
          "company_id",
          companyId
        )
        .eq(
          "email",
          normalizedEmail
        )
        .eq(
          "status",
          "Pending"
        )
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

    // ============================================================
    // 11. CREATE INVITATION
    // ============================================================

    const {
      data: invitation,
      error: inviteError,
    } =
      await supabaseAdmin
        .from("invitations")
        .insert({
          full_name:
            full_name.trim(),
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
          error:
            inviteError.message,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 12. SEND SUPABASE INVITATION EMAIL
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
          redirectTo:
            redirectUrl,

          data: {
            invitation_id:
              invitation.id,
            company_id:
              companyId,
            role_id:
              role_id,
            full_name:
              full_name.trim(),
          },
        }
      );

    // ============================================================
    // 13. EMAIL FAILED
    // ============================================================

    if (emailError) {
      console.error(
        "SUPABASE INVITATION EMAIL ERROR:",
        emailError
      );

      await supabaseAdmin
        .from("invitations")
        .delete()
        .eq(
          "id",
          invitation.id
        );

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
    // 14. SUCCESS
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
      invitation_id:
        invitation.id,
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