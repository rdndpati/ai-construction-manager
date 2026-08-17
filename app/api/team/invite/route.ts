import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

function buildInvitationUrl(invitationId: string) {
  return `${SITE_URL}/app/accept-invitation?invitation_id=${encodeURIComponent(
    invitationId
  )}`;
}

async function getCurrentUserAndCompany() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "You must be logged in.",
      status: 401,
    };
  }

  const { data: profile, error: profileError } =
    await supabaseAdmin
      .from("profiles")
      .select(
        "id, company_id, role_id, is_owner"
      )
      .eq("id", user.id)
      .single();

  if (
    profileError ||
    !profile?.company_id
  ) {
    return {
      error:
        "Your account is not connected to a company.",
      status: 400,
    };
  }

  let isAdmin = false;

  if (profile.role_id) {
    const { data: role } =
      await supabaseAdmin
        .from("roles")
        .select("name")
        .eq("id", profile.role_id)
        .maybeSingle();

    isAdmin =
      role?.name?.trim().toLowerCase() ===
      "admin";
  }

  if (
    profile.is_owner !== true &&
    !isAdmin
  ) {
    return {
      error:
        "Only company owners and administrators can manage invitations.",
      status: 403,
    };
  }

  return {
    user,
    profile,
    companyId: profile.company_id,
  };
}

/**
 * GET
 *
 * Loads pending/accepted invitations for the
 * current user's company.
 */
export async function GET() {
  try {
    const auth =
      await getCurrentUserAndCompany();

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("invitations")
        .select(
          `
          id,
          full_name,
          email,
          role_id,
          company_id,
          invited_by,
          status,
          created_at
        `
        )
        .eq(
          "company_id",
          auth.companyId
        )
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "LOAD INVITATIONS ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to load invitations.",
        },
        { status: 500 }
      );
    }

    const invitations = (data || []).map(
      (invitation) => ({
        ...invitation,
        invitation_url:
          buildInvitationUrl(
            invitation.id
          ),
      })
    );

    return NextResponse.json({
      success: true,
      invitations,
    });
  } catch (error) {
    console.error(
      "GET INVITATIONS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load invitations.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 *
 * Two operations:
 *
 * 1. Create a new invitation
 * 2. "Resend" a pending invitation by returning
 *    the invitation link again.
 *
 * No email service is used.
 */
export async function POST(
  request: Request
) {
  try {
    const auth =
      await getCurrentUserAndCompany();

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();

    /*
     * ============================================================
     * RESEND / RE-COPY EXISTING INVITATION
     * ============================================================
     */

    if (body?.action === "resend") {
      const invitationId =
        body?.invitation_id;

      if (!invitationId) {
        return NextResponse.json(
          {
            error:
              "Invitation ID is required.",
          },
          { status: 400 }
        );
      }

      const { data: invitation, error } =
        await supabaseAdmin
          .from("invitations")
          .select(
            "id, full_name, email, role_id, company_id, status"
          )
          .eq("id", invitationId)
          .eq(
            "company_id",
            auth.companyId
          )
          .maybeSingle();

      if (error) {
        console.error(
          "RESEND LOOKUP ERROR:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Unable to find invitation.",
          },
          { status: 500 }
        );
      }

      if (!invitation) {
        return NextResponse.json(
          {
            error:
              "Invitation was not found.",
          },
          { status: 404 }
        );
      }

      if (
        invitation.status !==
        "Pending"
      ) {
        return NextResponse.json(
          {
            error:
              "Only pending invitations can be resent.",
          },
          { status: 400 }
        );
      }

      const invitationUrl =
        buildInvitationUrl(
          invitation.id
        );

      return NextResponse.json({
        success: true,
        invitation_url:
          invitationUrl,
        message:
          "Invitation link is ready to send again.",
      });
    }

    /*
     * ============================================================
     * CREATE INVITATION
     * ============================================================
     */

    const {
      full_name,
      email,
      role_id,
    } = body;

    if (
      !full_name ||
      !email ||
      !role_id
    ) {
      return NextResponse.json(
        {
          error:
            "Full name, email, and role are required.",
        },
        { status: 400 }
      );
    }

    const normalizedName =
      String(full_name).trim();

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    if (
      !normalizedName ||
      !normalizedEmail
    ) {
      return NextResponse.json(
        {
          error:
            "Full name and email are required.",
        },
        { status: 400 }
      );
    }

    /*
     * Prevent self invitation
     */

    if (
      auth.user.email
        ?.trim()
        .toLowerCase() ===
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

    /*
     * Verify role
     */

    const { data: role, error: roleError } =
      await supabaseAdmin
        .from("roles")
        .select("id, name")
        .eq("id", role_id)
        .maybeSingle();

    if (roleError || !role) {
      return NextResponse.json(
        {
          error:
            "Selected role does not exist.",
        },
        { status: 400 }
      );
    }

    /*
     * Check existing pending invitation
     */

    const {
      data: existingInvitation,
      error:
        existingInvitationError,
    } = await supabaseAdmin
      .from("invitations")
      .select(
        "id, status, email, full_name, role_id"
      )
      .eq(
        "company_id",
        auth.companyId
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
        "PENDING INVITATION CHECK ERROR:",
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
            "A pending invitation already exists for this email address.",
          invitation_id:
            existingInvitation.id,
          invitation_url:
            buildInvitationUrl(
              existingInvitation.id
            ),
        },
        { status: 400 }
      );
    }

    /*
     * Check whether the user already has a profile.
     *
     * If they already belong to THIS company,
     * they don't need an invitation.
     *
     * If they belong to ANOTHER company,
     * do not silently move them between companies.
     */

    const {
      data: existingProfile,
      error: existingProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, email, company_id, is_owner"
      )
      .ilike(
        "email",
        normalizedEmail
      )
      .maybeSingle();

    if (existingProfileError) {
      console.error(
        "PROFILE CHECK ERROR:",
        existingProfileError
      );

      return NextResponse.json(
        {
          error:
            "Unable to check the existing user.",
        },
        { status: 500 }
      );
    }

    if (
      existingProfile?.company_id ===
      auth.companyId
    ) {
      return NextResponse.json(
        {
          error:
            "This user is already a member of your company.",
        },
        { status: 400 }
      );
    }

    if (
      existingProfile?.company_id &&
      existingProfile.company_id !==
        auth.companyId
    ) {
      return NextResponse.json(
        {
          error:
            "This user already belongs to another company.",
        },
        { status: 400 }
      );
    }

    /*
     * Create invitation ONLY.
     *
     * Do NOT create a profile here.
     * Do NOT add the user to the team here.
     */

    const {
      data: invitation,
      error: invitationError,
    } = await supabaseAdmin
      .from("invitations")
      .insert({
        full_name: normalizedName,
        company_id: auth.companyId,
        email: normalizedEmail,
        role_id: role.id,
        invited_by: auth.user.id,
        status: "Pending",
      })
      .select(
        "id, full_name, email, role_id, company_id, status, created_at"
      )
      .single();

    if (invitationError) {
      console.error(
        "INVITATION INSERT ERROR:",
        invitationError
      );

      return NextResponse.json(
        {
          error:
            invitationError.message ||
            "Unable to create invitation.",
        },
        { status: 400 }
      );
    }

    const invitationUrl =
      buildInvitationUrl(
        invitation.id
      );

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
      "EMAIL:",
      normalizedEmail
    );
    console.log(
      "COMPANY:",
      auth.companyId
    );
    console.log(
      "ROLE:",
      role.name
    );
    console.log(
      "URL:",
      invitationUrl
    );
    console.log(
      "===================================="
    );

    return NextResponse.json({
      success: true,
      email_sent: false,
      invitation_created: true,
      invitation_id:
        invitation.id,
      invitation_url:
        invitationUrl,
      status: "Pending",
      message:
        "Invitation created successfully. Copy the invitation link and send it to the team member.",
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
            : "Failed to process invitation.",
      },
      { status: 500 }
    );
  }
}