import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ============================================================
// GET CURRENT USER + COMPANY
// ============================================================

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

  if (profileError || !profile?.company_id) {
    console.error(
      "PROFILE LOOKUP ERROR:",
      profileError
    );

    return {
      error:
        "Your account is not connected to a company.",
      status: 400,
    };
  }

  // ==========================================================
  // CHECK ROLE
  // ==========================================================

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

  // ==========================================================
  // OWNER / ADMIN ONLY
  // ==========================================================

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

// ============================================================
// BUILD ACCEPT INVITATION URL
// ============================================================

function buildInvitationUrl(
  origin: string,
  invitationId: string
) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    origin;

  return `${appUrl}/app/accept-invitation?invitation_id=${encodeURIComponent(
    invitationId
  )}`;
}

// ============================================================
// GET
// ============================================================

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);

    const invitationId =
      requestUrl.searchParams.get(
        "invitation_id"
      );

    const origin = requestUrl.origin;

    // ==========================================================
    // PUBLIC INVITATION LOOKUP
    // ==========================================================

    if (invitationId) {
      console.log(
        "===================================="
      );

      console.log(
        "PUBLIC INVITATION LOOKUP"
      );

      console.log(
        "INVITATION ID:",
        invitationId
      );

      console.log(
        "===================================="
      );

      const {
        data: invitation,
        error,
      } = await supabaseAdmin
        .from("invitations")
        .select(
          `
          id,
          full_name,
          email,
          role_id,
          company_id,
          status,
          created_at
          `
        )
        .eq("id", invitationId)
        .maybeSingle();

      if (error) {
        console.error(
          "INVITATION LOOKUP ERROR:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Unable to load invitation.",
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
              "This invitation has already been accepted or is no longer available.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,

        invitation: {
          ...invitation,

          invitation_url:
            buildInvitationUrl(
              origin,
              invitation.id
            ),
        },
      });
    }

    // ==========================================================
    // NORMAL AUTHENTICATED REQUEST
    // ==========================================================

    const auth =
      await getCurrentUserAndCompany();

    if ("error" in auth) {
      return NextResponse.json(
        {
          error: auth.error,
        },
        {
          status: auth.status,
        }
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
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
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

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

    const invitations =
      (data || []).map(
        (invitation) => ({
          ...invitation,

          invitation_url:
            buildInvitationUrl(
              origin,
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

// ============================================================
// POST
// ============================================================

export async function POST(request: Request) {
  try {
    const auth =
      await getCurrentUserAndCompany();

    if ("error" in auth) {
      return NextResponse.json(
        {
          error: auth.error,
        },
        {
          status: auth.status,
        }
      );
    }

    const body =
      await request.json();

    const origin =
      new URL(request.url).origin;

    // ==========================================================
    // DELETE ONE INVITATION
    // ==========================================================

    if (
      body?.action === "delete"
    ) {
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

      const {
        data: invitation,
      } = await supabaseAdmin
        .from("invitations")
        .select("id")
        .eq(
          "id",
          invitationId
        )
        .eq(
          "company_id",
          auth.companyId
        )
        .eq(
          "status",
          "Pending"
        )
        .maybeSingle();

      if (!invitation) {
        return NextResponse.json(
          {
            error:
              "Pending invitation was not found.",
          },
          { status: 404 }
        );
      }

      const {
        error,
      } = await supabaseAdmin
        .from("invitations")
        .delete()
        .eq(
          "id",
          invitationId
        )
        .eq(
          "company_id",
          auth.companyId
        )
        .eq(
          "status",
          "Pending"
        );

      if (error) {
        return NextResponse.json(
          {
            error:
              error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        invitation_id:
          invitationId,
      });
    }

    // ==========================================================
    // DELETE ALL PENDING
    // ==========================================================

    if (
      body?.action ===
      "delete_all_pending"
    ) {
      const {
        data: pending,
      } = await supabaseAdmin
        .from("invitations")
        .select("id")
        .eq(
          "company_id",
          auth.companyId
        )
        .eq(
          "status",
          "Pending"
        );

      const { error } =
        await supabaseAdmin
          .from("invitations")
          .delete()
          .eq(
            "company_id",
            auth.companyId
          )
          .eq(
            "status",
            "Pending"
          );

      if (error) {
        return NextResponse.json(
          {
            error:
              error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,

        deleted_count:
          pending?.length || 0,
      });
    }

    // ==========================================================
    // RESEND
    // ==========================================================

    if (
      body?.action ===
      "resend"
    ) {
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

      const {
        data: invitation,
        error,
      } = await supabaseAdmin
        .from("invitations")
        .select(
          `
          id,
          full_name,
          email,
          role_id,
          company_id,
          status
          `
        )
        .eq(
          "id",
          invitationId
        )
        .eq(
          "company_id",
          auth.companyId
        )
        .maybeSingle();

      if (error || !invitation) {
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

      const {
        data: role,
      } = await supabaseAdmin
        .from("roles")
        .select("name")
        .eq(
          "id",
          invitation.role_id
        )
        .maybeSingle();

      // --------------------------------------------------------
      // SUPABASE AUTH INVITATION
      // --------------------------------------------------------

      const invitationUrl =
        buildInvitationUrl(
          origin,
          invitation.id
        );

      const {
        data: authInvite,
        error:
          authInviteError,
      } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(
          invitation.email,
          {
            data: {
              full_name:
                invitation.full_name,

              invitation_id:
                invitation.id,

              company_id:
                invitation.company_id,

              role_id:
                invitation.role_id,

              invited_role:
                role?.name ||
                "Team Member",
            },

            redirectTo:
              `${origin}/auth/callback?invitation_id=${encodeURIComponent(
                invitation.id
              )}`,
          }
        );

      if (authInviteError) {
        console.error(
          "SUPABASE RESEND INVITE ERROR:",
          authInviteError
        );

        return NextResponse.json(
          {
            error:
              authInviteError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        email_sent: true,
        invitation_id:
          invitation.id,
        invitation_url:
          invitationUrl,
      });
    }

    // ==========================================================
    // CREATE INVITATION
    // ==========================================================

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

    // ==========================================================
    // PREVENT SELF INVITATION
    // ==========================================================

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

    // ==========================================================
    // VERIFY ROLE
    // ==========================================================

    const {
      data: role,
      error: roleError,
    } =
      await supabaseAdmin
        .from("roles")
        .select(
          "id, name"
        )
        .eq(
          "id",
          role_id
        )
        .maybeSingle();

    if (
      roleError ||
      !role
    ) {
      return NextResponse.json(
        {
          error:
            "Selected role does not exist.",
        },
        { status: 400 }
      );
    }

    // ==========================================================
    // CHECK EXISTING PENDING INVITATION
    // ==========================================================

    const {
      data:
        existingInvitation,
    } =
      await supabaseAdmin
        .from("invitations")
        .select(
          `
          id,
          email,
          full_name,
          status,
          role_id
          `
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

    if (
      existingInvitation
    ) {
      return NextResponse.json(
        {
          error:
            "A pending invitation already exists for this email address.",

          invitation_id:
            existingInvitation.id,
        },
        { status: 400 }
      );
    }

    // ==========================================================
    // CHECK EXISTING PROFILE
    // ==========================================================

    const {
      data:
        existingProfile,
    } =
      await supabaseAdmin
        .from("profiles")
        .select(
          `
          id,
          email,
          company_id,
          is_owner
          `
        )
        .ilike(
          "email",
          normalizedEmail
        )
        .maybeSingle();

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

    // ==========================================================
    // CREATE CUSTOM INVITATION
    // ==========================================================

    const {
      data: invitation,
      error:
        invitationError,
    } =
      await supabaseAdmin
        .from("invitations")
        .insert({
          full_name:
            normalizedName,

          company_id:
            auth.companyId,

          email:
            normalizedEmail,

          role_id:
            role.id,

          invited_by:
            auth.user.id,

          status:
            "Pending",
        })
        .select(
          `
          id,
          full_name,
          email,
          role_id,
          company_id,
          status,
          created_at
          `
        )
        .single();

    if (
      invitationError
    ) {
      console.error(
        "INVITATION INSERT ERROR:",
        invitationError
      );

      return NextResponse.json(
        {
          error:
            invitationError.message,
        },
        { status: 400 }
      );
    }

    // ==========================================================
    // SUPABASE AUTH INVITATION
    // ==========================================================

    const invitationUrl =
      buildInvitationUrl(
        origin,
        invitation.id
      );

    console.log(
      "===================================="
    );

    console.log(
      "SUPABASE AUTH INVITATION"
    );

    console.log(
      "EMAIL:",
      normalizedEmail
    );

    console.log(
      "INVITATION ID:",
      invitation.id
    );

    console.log(
      "REDIRECT:",
      `${origin}/auth/callback?invitation_id=${invitation.id}`
    );

    console.log(
      "===================================="
    );

    const {
      data: authInvite,
      error:
        authInviteError,
    } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(
        normalizedEmail,
        {
          data: {
            full_name:
              normalizedName,

            invitation_id:
              invitation.id,

            company_id:
              auth.companyId,

            role_id:
              role.id,

            invited_role:
              role.name,
          },

          redirectTo:
            `${origin}/auth/callback?invitation_id=${encodeURIComponent(
              invitation.id
            )}`,
        }
      );

    // ==========================================================
    // SUPABASE INVITE FAILED
    // ==========================================================

    if (
      authInviteError
    ) {
      console.error(
        "SUPABASE AUTH INVITE ERROR:",
        authInviteError
      );

      // Remove custom invitation because
      // no email was successfully sent.
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
            authInviteError.message ||
            "Supabase could not send the invitation email.",
        },
        { status: 500 }
      );
    }

    // ==========================================================
    // SUCCESS
    // ==========================================================

    console.log(
      "===================================="
    );

    console.log(
      "INVITATION EMAIL SENT BY SUPABASE"
    );

    console.log(
      "AUTH USER:",
      authInvite?.user?.id
    );

    console.log(
      "EMAIL:",
      normalizedEmail
    );

    console.log(
      "INVITATION ID:",
      invitation.id
    );

    console.log(
      "===================================="
    );

    return NextResponse.json({
      success: true,

      invitation_created:
        true,

      email_sent:
        true,

      invitation_id:
        invitation.id,

      invitation_url:
        invitationUrl,

      email:
        normalizedEmail,

      status:
        "Pending",

      message:
        "Invitation created and Supabase invitation email sent successfully.",
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