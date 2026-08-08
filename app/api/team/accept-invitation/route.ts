import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    // ============================================
    // 1. Get logged-in user
    // ============================================

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
          error: "You must be logged in to accept this invitation.",
        },
        { status: 401 }
      );
    }

    // ============================================
    // 2. Get invitation ID
    // ============================================

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

    // ============================================
    // 3. Find exact invitation
    // ============================================

    const { data: invitation, error: invitationError } =
      await supabaseAdmin
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

    // ============================================
    // 4. Make sure invitation is still pending
    // ============================================

    if (invitation.status !== "Pending") {
      return NextResponse.json(
        {
          error: `This invitation has already been ${invitation.status.toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    // ============================================
    // 5. Verify email
    // ============================================

    const invitedEmail =
      invitation.email?.trim().toLowerCase();

    const currentEmail =
      user.email?.trim().toLowerCase();

    console.log("INVITED EMAIL:", invitedEmail);
    console.log("CURRENT USER EMAIL:", currentEmail);

    if (!currentEmail || currentEmail !== invitedEmail) {
      return NextResponse.json(
        {
          error:
            `This invitation was sent to ${invitedEmail}, ` +
            `but you are logged in as ${currentEmail || "unknown"}. ` +
            `Please log in using the invited email address.`,
        },
        { status: 403 }
      );
    }

    // ============================================
    // 6. Check if profile already exists
    // ============================================

    const { data: existingProfile } =
      await supabaseAdmin
        .from("profiles")
        .select("id, company_id")
        .eq("id", user.id)
        .maybeSingle();

    console.log(
      "EXISTING PROFILE:",
      existingProfile
    );

    // ============================================
    // 7. Create/update profile
    // ============================================

    const { error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: currentEmail,
            full_name: invitation.full_name,
            company_id: invitation.company_id,
            role_id: invitation.role_id,
            is_owner: false,
          },
          {
            onConflict: "id",
          }
        );

    if (profileError) {
      console.error(
        "PROFILE UPSERT ERROR:",
        profileError
      );

      return NextResponse.json(
        {
          error: profileError.message,
        },
        { status: 400 }
      );
    }

    // ============================================
    // 8. Mark invitation accepted
    // ============================================

    const { error: updateError } =
      await supabaseAdmin
        .from("invitations")
        .update({
          status: "Accepted",
        })
        .eq("id", invitation.id);

    if (updateError) {
      console.error(
        "INVITATION UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          error: updateError.message,
        },
        { status: 400 }
      );
    }

    // ============================================
    // 9. Success
    // ============================================

    console.log("====================================");
    console.log("INVITATION ACCEPTED SUCCESSFULLY");
    console.log("USER:", user.id);
    console.log("EMAIL:", currentEmail);
    console.log("COMPANY:", invitation.company_id);
    console.log("ROLE:", invitation.role_id);
    console.log("====================================");

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully.",
      company_id: invitation.company_id,
      role_id: invitation.role_id,
    });

  } catch (error) {
    console.error(
      "ACCEPT INVITATION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to accept invitation.",
      },
      { status: 500 }
    );
  }
}