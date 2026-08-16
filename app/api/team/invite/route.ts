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

    const normalizedName =
      full_name.trim();

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
          .toLowerCase() ===
        "admin";
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
    // 7. CHECK FOR EXISTING PENDING INVITATION
    // ============================================================

    const {
      data: existingInvitation,
      error: existingInvitationError,
    } =
      await supabaseAdmin
        .from("invitations")
        .select(
          "id, status, company_id, email"
        )
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
    // 8. CHECK WHETHER AUTH USER ALREADY EXISTS
    // ============================================================
    //
    // IMPORTANT:
    //
    // We ONLY CHECK whether the user exists.
    //
    // We DO NOT create an Auth user.
    //
    // This is the key change for Option A.
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
    // 9. EXISTING USER ALREADY IN THIS COMPANY
    // ============================================================

    if (existingAuthUser) {
      const {
        data: existingProfile,
        error: existingProfileError,
      } =
        await supabaseAdmin
          .from("profiles")
          .select(
            "id, company_id, email, full_name, role_id, is_owner"
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
              "Unable to check the existing user's company profile.",
          },
          { status: 500 }
        );
      }

      if (
        existingProfile?.company_id ===
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

      // ----------------------------------------------------------
      // User belongs to another company
      // ----------------------------------------------------------

      if (
        existingProfile?.company_id &&
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
    }

    // ============================================================
    // 10. CREATE PENDING INVITATION
    // ============================================================

    const {
      data: invitation,
      error: inviteError,
    } =
      await supabaseAdmin
        .from("invitations")
        .insert({
          full_name:
            normalizedName,
          company_id:
            companyId,
          email:
            normalizedEmail,
          role_id:
            role_id,
          invited_by:
            user.id,
          status:
            "Pending",
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
            inviteError.message ||
            "Unable to create invitation.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 11. BUILD INVITATION URL
    // ============================================================

    const appUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const invitationUrl =
      `${appUrl}/app/accept-invitation?invitation_id=${encodeURIComponent(
        invitation.id
      )}`;

    console.log(
      "===================================="
    );

    console.log(
      "INVITATION CREATED"
    );

    console.log(
      "INVITATION ID:",
      invitation.id
    );

    console.log(
      "RECIPIENT:",
      normalizedEmail
    );

    console.log(
      "COMPANY:",
      companyId
    );

    console.log(
      "ROLE:",
      role.name
    );

    console.log(
      "INVITATION URL:",
      invitationUrl
    );

    console.log(
      "EXISTING AUTH USER:",
      Boolean(existingAuthUser)
    );

    console.log(
      "===================================="
    );

    // ============================================================
    // 12. CHECK EMAIL CONFIGURATION
    // ============================================================

    const resendApiKey =
      process.env.RESEND_API_KEY;

    const fromEmail =
      process.env.RESEND_FROM_EMAIL;

    if (
      !resendApiKey ||
      !fromEmail
    ) {
      console.error(
        "EMAIL CONFIGURATION MISSING"
      );

      // Remove invitation because we cannot
      // complete the invitation process.

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
            "Invitation email service is not configured. Please configure RESEND_API_KEY and RESEND_FROM_EMAIL.",
        },
        { status: 500 }
      );
    }

    // ============================================================
    // 13. SEND INVITATION EMAIL WITH RESEND
    // ============================================================

    const emailResponse =
      await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${resendApiKey}`,
          },

          body: JSON.stringify({
            from:
              fromEmail,

            to: [
              normalizedEmail,
            ],

            subject:
              `You're invited to join ${role.name} on ConstructIQ`,

            html: `
<!DOCTYPE html>

<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">

  <div style="max-width:600px; margin:40px auto; padding:20px;">

    <div style="background:#ffffff; border-radius:16px; padding:40px; border:1px solid #e5e7eb;">

      <div style="text-align:center; margin-bottom:30px;">

        <div style="
          width:64px;
          height:64px;
          margin:0 auto 16px;
          background:#2563eb;
          border-radius:16px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:30px;
          line-height:64px;
        ">
          🏗️
        </div>

        <h1 style="
          margin:0;
          color:#111827;
          font-size:28px;
        ">
          ConstructIQ
        </h1>

        <p style="
          margin:8px 0 0;
          color:#6b7280;
          font-size:14px;
        ">
          Engineering Project Management Platform
        </p>

      </div>

      <h2 style="
        color:#111827;
        font-size:22px;
        margin-bottom:10px;
      ">
        You're invited to join ConstructIQ
      </h2>

      <p style="
        color:#4b5563;
        font-size:16px;
        line-height:1.6;
      ">
        Hello ${escapeHtml(normalizedName)},
      </p>

      <p style="
        color:#4b5563;
        font-size:16px;
        line-height:1.6;
      ">
        You have been invited to join a company on ConstructIQ as:
      </p>

      <div style="
        background:#eff6ff;
        border:1px solid #bfdbfe;
        border-radius:12px;
        padding:18px;
        margin:24px 0;
      ">

        <p style="
          margin:0 0 6px;
          color:#6b7280;
          font-size:13px;
        ">
          Your role
        </p>

        <p style="
          margin:0;
          color:#1d4ed8;
          font-size:18px;
          font-weight:bold;
        ">
          ${escapeHtml(role.name)}
        </p>

      </div>

      <p style="
        color:#4b5563;
        font-size:16px;
        line-height:1.6;
      ">
        Click the button below to accept your invitation and create or access your ConstructIQ account.
      </p>

      <div style="text-align:center; margin:32px 0;">

        <a
          href="${invitationUrl}"
          style="
            display:inline-block;
            background:#2563eb;
            color:#ffffff;
            text-decoration:none;
            padding:14px 28px;
            border-radius:10px;
            font-size:16px;
            font-weight:bold;
          "
        >
          Accept Invitation
        </a>

      </div>

      <p style="
        color:#9ca3af;
        font-size:13px;
        line-height:1.5;
      ">
        If you did not expect this invitation, you can safely ignore this email.
      </p>

      <hr style="
        border:none;
        border-top:1px solid #e5e7eb;
        margin:30px 0;
      " />

      <p style="
        color:#9ca3af;
        font-size:12px;
        text-align:center;
        margin:0;
      ">
        © 2026 ConstructIQ
      </p>

    </div>

  </div>

</body>
</html>
            `,
          }),
        }
      );

    const emailResult =
      await emailResponse.json();

    // ============================================================
    // 14. EMAIL FAILED
    // ============================================================

    if (!emailResponse.ok) {
      console.error(
        "RESEND EMAIL ERROR:",
        emailResult
      );

      // Remove pending invitation if email
      // could not be sent.

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
            emailResult?.message ||
            emailResult?.error ||
            "Invitation email could not be sent.",
        },
        { status: 500 }
      );
    }

    // ============================================================
    // 15. SUCCESS
    // ============================================================

    console.log(
      "INVITATION EMAIL SENT"
    );

    console.log(
      "RESEND RESULT:",
      emailResult
    );

    return NextResponse.json({
      success: true,

      existing_user:
        Boolean(existingAuthUser),

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

// ============================================================
// SIMPLE HTML ESCAPING
// ============================================================

function escapeHtml(
  value: string
): string {
  return value
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}