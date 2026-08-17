import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    // ============================================================
    // 1. GET CURRENT USER
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
            "You must be logged in to accept this invitation.",
        },
        { status: 401 }
      );
    }

    // ============================================================
    // 2. GET INVITATION ID
    // ============================================================

    const body = await request.json();

    const invitationId =
      body?.invitation_id;

    if (!invitationId) {
      return NextResponse.json(
        {
          error:
            "Invitation ID is missing.",
        },
        { status: 400 }
      );
    }

    console.log(
      "===================================="
    );

    console.log(
      "ACCEPT INVITATION START"
    );

    console.log(
      "USER ID:",
      user.id
    );

    console.log(
      "USER EMAIL:",
      user.email
    );

    console.log(
      "INVITATION ID:",
      invitationId
    );

    console.log(
      "===================================="
    );

    // ============================================================
    // 3. GET INVITATION
    // ============================================================

    const {
      data: invitation,
      error: invitationError,
    } =
      await supabaseAdmin
        .from("invitations")
        .select(
          "id, email, full_name, company_id, role_id, status"
        )
        .eq("id", invitationId)
        .maybeSingle();

    if (invitationError) {
      console.error(
        "INVITATION ERROR:",
        invitationError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load the invitation.",
        },
        { status: 500 }
      );
    }

    if (!invitation) {
      return NextResponse.json(
        {
          error:
            "This invitation was not found.",
        },
        { status: 404 }
      );
    }

    // ============================================================
    // 4. CHECK INVITATION STATUS
    // ============================================================

    if (
      invitation.status !==
      "Pending"
    ) {
      return NextResponse.json(
        {
          error:
            "This invitation has already been accepted or is no longer valid.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 5. VERIFY INVITED EMAIL
    // ============================================================

    const invitedEmail =
      invitation.email
        ?.trim()
        .toLowerCase();

    const currentEmail =
      user.email
        ?.trim()
        .toLowerCase();

    if (!currentEmail) {
      return NextResponse.json(
        {
          error:
            "Your account does not have an email address.",
        },
        { status: 400 }
      );
    }

    if (!invitedEmail) {
      return NextResponse.json(
        {
          error:
            "This invitation does not contain an email address.",
        },
        { status: 400 }
      );
    }

    if (
      currentEmail !==
      invitedEmail
    ) {
      return NextResponse.json(
        {
          error:
            `This invitation was sent to ${invitedEmail}. Please sign in using that email address.`,
        },
        { status: 403 }
      );
    }

    // ============================================================
    // 6. VERIFY COMPANY
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

    // ============================================================
    // 7. VERIFY ROLE
    // ============================================================

    if (!invitation.role_id) {
      return NextResponse.json(
        {
          error:
            "This invitation does not have a role assigned.",
        },
        { status: 400 }
      );
    }

    const {
      data: role,
      error: roleError,
    } =
      await supabaseAdmin
        .from("roles")
        .select("id, name")
        .eq(
          "id",
          invitation.role_id
        )
        .maybeSingle();

    if (roleError) {
      console.error(
        "ROLE LOOKUP ERROR:",
        roleError
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify the assigned role.",
        },
        { status: 500 }
      );
    }

    if (!role) {
      return NextResponse.json(
        {
          error:
            "The role assigned to this invitation no longer exists.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 8. GET USER PROFILE
    // ============================================================

    const {
      data: existingProfile,
      error: profileError,
    } =
      await supabaseAdmin
        .from("profiles")
        .select(
          "id, email, full_name, company_id, role_id, is_owner"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (profileError) {
      console.error(
        "PROFILE LOOKUP ERROR:",
        profileError
      );

      return NextResponse.json(
        {
          error:
            `Unable to check your profile: ${profileError.message}`,
        },
        { status: 500 }
      );
    }

    console.log(
      "EXISTING PROFILE:",
      existingProfile
    );

    // ============================================================
    // 9. PREVENT JOINING A DIFFERENT COMPANY
    // ============================================================

    if (
      existingProfile?.company_id &&
      existingProfile.company_id !==
        invitation.company_id
    ) {
      return NextResponse.json(
        {
          error:
            "Your account already belongs to another company. You cannot join this company using this invitation.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 10. UPDATE OR CREATE PROFILE
    // ============================================================

    if (existingProfile) {
      // ----------------------------------------------------------
      // Existing profile but no company
      // OR existing profile already belongs to this company.
      // ----------------------------------------------------------

      const {
        error: updateError,
      } =
        await supabaseAdmin
          .from("profiles")
          .update({
            email:
              currentEmail,

            full_name:
              invitation.full_name ||
              existingProfile.full_name ||
              null,

            company_id:
              invitation.company_id,

            role_id:
              invitation.role_id,

            is_owner:
              false,
          })
          .eq(
            "id",
            user.id
          );

      if (updateError) {
        console.error(
          "PROFILE UPDATE ERROR:",
          updateError
        );

        return NextResponse.json(
          {
            error:
              `Unable to connect your account to the company: ${updateError.message}`,
          },
          { status: 500 }
        );
      }
    } else {
      // ----------------------------------------------------------
      // No profile exists.
      // Create it.
      // ----------------------------------------------------------

      const {
        error: insertError,
      } =
        await supabaseAdmin
          .from("profiles")
          .insert({
            id: user.id,

            email:
              currentEmail,

            full_name:
              invitation.full_name ||
              null,

            company_id:
              invitation.company_id,

            role_id:
              invitation.role_id,

            is_owner:
              false,
          });

      if (insertError) {
        console.error(
          "PROFILE INSERT ERROR:",
          insertError
        );

        return NextResponse.json(
          {
            error:
              `Unable to create your company membership: ${insertError.message}`,
          },
          { status: 500 }
        );
      }
    }

    // ============================================================
    // 11. VERIFY PROFILE AFTER UPDATE
    // ============================================================

    const {
      data: verifiedProfile,
      error: verifyError,
    } =
      await supabaseAdmin
        .from("profiles")
        .select(
          "id, email, full_name, company_id, role_id, is_owner"
        )
        .eq(
          "id",
          user.id
        )
        .single();

    if (
      verifyError ||
      !verifiedProfile
    ) {
      console.error(
        "PROFILE VERIFICATION ERROR:",
        verifyError
      );

      return NextResponse.json(
        {
          error:
            "Your company membership could not be verified.",
        },
        { status: 500 }
      );
    }

    // ============================================================
    // 12. VERIFY COMPANY ASSIGNMENT
    // ============================================================

    if (
      verifiedProfile.company_id !==
      invitation.company_id
    ) {
      console.error(
        "COMPANY ASSIGNMENT FAILED",
        {
          expected:
            invitation.company_id,

          actual:
            verifiedProfile.company_id,
        }
      );

      return NextResponse.json(
        {
          error:
            "Your account was not connected to the invited company.",
        },
        { status: 500 }
      );
    }

    // ============================================================
    // 13. VERIFY ROLE ASSIGNMENT
    // ============================================================

    if (
      verifiedProfile.role_id !==
      invitation.role_id
    ) {
      console.error(
        "ROLE ASSIGNMENT FAILED",
        {
          expected:
            invitation.role_id,

          actual:
            verifiedProfile.role_id,
        }
      );

      return NextResponse.json(
        {
          error:
            "Your account was connected to the company, but the assigned role could not be verified.",
        },
        { status: 500 }
      );
    }

    // ============================================================
    // 14. MARK INVITATION AS ACCEPTED
    // ============================================================

    const {
      data: updatedInvitation,
      error:
        invitationUpdateError,
    } =
      await supabaseAdmin
        .from("invitations")
        .update({
          status:
            "Accepted",
        })
        .eq(
          "id",
          invitation.id
        )
        .eq(
          "status",
          "Pending"
        )
        .select(
          "id, status"
        )
        .maybeSingle();

    if (invitationUpdateError) {
      console.error(
        "INVITATION UPDATE ERROR:",
        invitationUpdateError
      );

      return NextResponse.json(
        {
          error:
            `Your company membership was created, but the invitation status could not be updated: ${invitationUpdateError.message}`,
        },
        { status: 500 }
      );
    }

    if (!updatedInvitation) {
      return NextResponse.json(
        {
          error:
            "This invitation was already accepted.",
        },
        { status: 409 }
      );
    }

    // ============================================================
    // 15. SUCCESS
    // ============================================================

    console.log(
      "===================================="
    );

    console.log(
      "INVITATION ACCEPTED SUCCESSFULLY"
    );

    console.log(
      "USER ID:",
      verifiedProfile.id
    );

    console.log(
      "EMAIL:",
      verifiedProfile.email
    );

    console.log(
      "COMPANY ID:",
      verifiedProfile.company_id
    );

    console.log(
      "ROLE ID:",
      verifiedProfile.role_id
    );

    console.log(
      "INVITATION ID:",
      invitation.id
    );

    console.log(
      "INVITATION STATUS:",
      updatedInvitation.status
    );

    console.log(
      "===================================="
    );

    return NextResponse.json({
      success: true,

      message:
        "Invitation accepted successfully. You have been added to the company.",

      user_id:
        verifiedProfile.id,

      company_id:
        verifiedProfile.company_id,

      role_id:
        verifiedProfile.role_id,

      invitation_id:
        invitation.id,

      invitation_status:
        updatedInvitation.status,
    });

  } catch (error) {
    console.error(
      "ACCEPT INVITATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to accept invitation.",
      },
      { status: 500 }
    );
  }
}