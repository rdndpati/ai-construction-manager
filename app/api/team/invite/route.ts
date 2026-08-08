import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    // ============================================================
    // 1. Get logged-in user securely
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
    // 3. Get the inviter's company
    // IMPORTANT:
    // Do NOT trust company_id sent from the browser.
    // ============================================================

    const { data: inviterProfile, error: profileError } =
      await supabase
        .from("profiles")
        .select("company_id, is_owner, role_id")
        .eq("id", user.id)
        .single();

    if (profileError || !inviterProfile?.company_id) {
      console.error("INVITER PROFILE ERROR:", profileError);

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
    // 4. Make sure role exists
    // ============================================================

    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id, name")
      .eq("id", role_id)
      .single();

    if (roleError || !role) {
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
    // 6. Check for an existing pending invitation
    // ============================================================

    const { data: existingInvitation } = await supabaseAdmin
      .from("invitations")
      .select("id, status")
      .eq("company_id", companyId)
      .eq("email", normalizedEmail)
      .eq("status", "Pending")
      .maybeSingle();

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
    // 7. Save invitation
    // ============================================================

    const { data: invitation, error: inviteError } =
      await supabaseAdmin
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
      console.error("INVITATION INSERT ERROR:", inviteError);

      return NextResponse.json(
        {
          error: inviteError.message,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 8. Send Supabase invitation email
    // ============================================================

    const appUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

const redirectUrl =
  `${appUrl}/auth/callback?next=/accept-invitation&invitation_id=${invitation.id}`;
    const {
      data: invitedUser,
      error: emailError,
    } = await supabaseAdmin.auth.admin.inviteUserByEmail(
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
    // 9. Email failed
    // ============================================================

    if (emailError) {
      console.error(
        "SUPABASE INVITATION EMAIL ERROR:",
        emailError
      );

      // Remove the invitation because email was not sent.
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
    // 10. Success
    // ============================================================

    console.log(
      "INVITATION EMAIL SENT:",
      invitedUser?.user?.email
    );

    return NextResponse.json({
      success: true,
      message: `Invitation sent successfully to ${normalizedEmail}.`,
      invitation_id: invitation.id,
    });

  } catch (error) {
    console.error("TEAM INVITATION ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to send team invitation.",
      },
      {
        status: 500,
      }
    );
  }
}