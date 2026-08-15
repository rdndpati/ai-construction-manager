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

    console.log("====================================");
    console.log("ACCEPT INVITATION API");
    console.log("USER ID:", user?.id);
    console.log("USER EMAIL:", user?.email);
    console.log("USER ERROR:", userError);
    console.log("====================================");

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "You must be logged in to accept this invitation.",
        },
        { status: 401 }
      );
    }

    // ============================================================
    // 2. Get invitation ID
    // ============================================================

    const body = await request.json();

    const invitationId = body?.invitation_id;

    console.log("INVITATION ID:", invitationId);

    if (!invitationId) {
      return NextResponse.json(
        {
          error: "Invitation ID is missing.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 3. Find invitation
    // ============================================================

    const {
      data: invitation,
      error: invitationError,
    } = await supabaseAdmin
      .from("invitations")
      .select(
        "id, email, full_name, company_id, role_id, status"
      )
      .eq("id", invitationId)
      .maybeSingle();

    console.log("INVITATION:", invitation);
    console.log("INVITATION ERROR:", invitationError);

    if (invitationError) {
      return NextResponse.json(
        {
          error: invitationError.message,
        },
        { status: 400 }
      );
    }

    if (!invitation) {
      return NextResponse.json(
        {
          error: "Invitation was not found.",
        },
        { status: 404 }
      );
    }

    // ============================================================
    // 4. Check invitation status
    // ============================================================

    if (invitation.status !== "Pending") {
      return NextResponse.json(
        {
          error:
            `This invitation has already been ` +
            `${String(invitation.status).toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 5. Verify invited email
    // ============================================================

    const invitedEmail =
      invitation.email?.trim().toLowerCase();

    const currentEmail =
      user.email?.trim().toLowerCase();

    console.log("INVITED EMAIL:", invitedEmail);
    console.log("CURRENT USER EMAIL:", currentEmail);

    if (!currentEmail) {
      return NextResponse.json(
        {
          error:
            "Your account does not have an email address.",
        },
        { status: 400 }
      );
    }

    if (currentEmail !== invitedEmail) {
      return NextResponse.json(
        {
          error:
            `This invitation was sent to ${invitedEmail}, ` +
            `but you are logged in as ${currentEmail}. ` +
            `Please log in using the invited email address.`,
        },
        { status: 403 }
      );
    }

    // ============================================================
    // 6. Make sure invitation has company and role
    // ============================================================

    if (!invitation.company_id) {
      return NextResponse.json(
        {
          error:
            "This invitation is not connected to a company.",
        },
        { status: 400 }
      );
    }

    if (!invitation.role_id) {
      return NextResponse.json(
        {
          error:
            "This invitation does not have a role assigned.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 7. Check existing profile
    // ============================================================

    const {
      data: existingProfile,
      error: existingProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, email, full_name, company_id, role_id, is_owner"
      )
      .eq("id", user.id)
      .maybeSingle();

    console.log("EXISTING PROFILE:", existingProfile);
    console.log(
      "EXISTING PROFILE ERROR:",
      existingProfileError
    );

    if (existingProfileError) {
      return NextResponse.json(
        {
          error:
            `Unable to check your profile: ` +
            existingProfileError.message,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 8. Assign user to company
    // ============================================================

    if (existingProfile) {
      // ----------------------------------------------------------
      // Existing profile
      // ----------------------------------------------------------

      const {
        error: updateProfileError,
      } = await supabaseAdmin
        .from("profiles")
        .update({
          email: currentEmail,
          full_name:
            invitation.full_name ||
            existingProfile.full_name ||
            null,
          company_id: invitation.company_id,
          role_id: invitation.role_id,
          is_owner: false,
        })
        .eq("id", user.id);

      if (updateProfileError) {
        console.error(
          "PROFILE UPDATE ERROR:",
          updateProfileError
        );

        return NextResponse.json(
          {
            error:
              `Unable to assign your account to the company: ` +
              updateProfileError.message,
          },
          { status: 400 }
        );
      }

      console.log(
        "EXISTING PROFILE UPDATED SUCCESSFULLY"
      );
    } else {
      // ----------------------------------------------------------
      // No profile exists
      // ----------------------------------------------------------

      const {
        error: insertProfileError,
      } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: user.id,
          email: currentEmail,
          full_name: invitation.full_name,
          company_id: invitation.company_id,
          role_id: invitation.role_id,
          is_owner: false,
        });

      if (insertProfileError) {
        console.error(
          "PROFILE INSERT ERROR:",
          insertProfileError
        );

        return NextResponse.json(
          {
            error:
              `Unable to create your company profile: ` +
              insertProfileError.message,
          },
          { status: 400 }
        );
      }

      console.log(
        "NEW PROFILE CREATED SUCCESSFULLY"
      );
    }

    // ============================================================
    // 9. Verify profile was actually assigned
    // ============================================================

    const {
      data: verifiedProfile,
      error: verifyProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, email, full_name, company_id, role_id, is_owner"
      )
      .eq("id", user.id)
      .single();

    console.log(
      "VERIFIED PROFILE:",
      verifiedProfile
    );

    if (verifyProfileError || !verifiedProfile) {
      console.error(
        "PROFILE VERIFICATION ERROR:",
        verifyProfileError
      );

      return NextResponse.json(
        {
          error:
            "The profile could not be verified after accepting the invitation.",
        },
        { status: 500 }
      );
    }

    if (
      verifiedProfile.company_id !==
      invitation.company_id
    ) {
      console.error(
        "COMPANY ASSIGNMENT FAILED",
        {
          expected: invitation.company_id,
          actual: verifiedProfile.company_id,
        }
      );

      return NextResponse.json(
        {
          error:
            "Your account was not successfully connected to the company.",
        },
        { status: 500 }
      );
    }

    // ============================================================
    // 10. Mark invitation as accepted
    // ============================================================

    const {
      error: invitationUpdateError,
    } = await supabaseAdmin
      .from("invitations")
      .update({
        status: "Accepted",
      })
      .eq("id", invitation.id)
      .eq("status", "Pending");

    if (invitationUpdateError) {
      console.error(
        "INVITATION UPDATE ERROR:",
        invitationUpdateError
      );

      return NextResponse.json(
        {
          error:
            invitationUpdateError.message,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 11. Success
    // ============================================================

    console.log("====================================");
    console.log(
      "INVITATION ACCEPTED SUCCESSFULLY"
    );
    console.log("USER:", user.id);
    console.log("EMAIL:", currentEmail);
    console.log(
      "COMPANY:",
      verifiedProfile.company_id
    );
    console.log(
      "ROLE:",
      verifiedProfile.role_id
    );
    console.log("INVITATION:", invitation.id);
    console.log("====================================");

    return NextResponse.json({
      success: true,
      message:
        "Invitation accepted successfully.",
      company_id: verifiedProfile.company_id,
      role_id: verifiedProfile.role_id,
      user_id: verifiedProfile.id,
    });
  } catch (error: any) {
    console.error(
      "===================================="
    );
    console.error(
      "ACCEPT INVITATION API ERROR"
    );
    console.error("ERROR:", error);
    console.error(
      "MESSAGE:",
      error?.message
    );
    console.error(
      "===================================="
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to accept invitation.",
      },
      { status: 500 }
    );
  }
}