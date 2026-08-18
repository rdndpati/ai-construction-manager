import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export async function middleware(
  request: NextRequest
) {
  let response =
    NextResponse.next({
      request: {
        headers:
          request.headers,
      },
    });

  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(
            cookiesToSet
          ) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value
                );
              }
            );

            response =
              NextResponse.next({
                request: {
                  headers:
                    request.headers,
                },
              });

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                response.cookies.set(
                  name,
                  value,
                  options
                );
              }
            );
          },
        },
      }
    );

  // ============================================================
  // GET CURRENT USER
  // ============================================================

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  const pathname =
    request.nextUrl.pathname;

  // ============================================================
  // ROUTES
  // ============================================================

  const isAppRoute =
    pathname.startsWith(
      "/app"
    );

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname ===
      "/forgot-password" ||
    pathname ===
      "/reset-password";

  const isCreateCompanyRoute =
    pathname ===
    "/create-company";

  // ============================================================
  // INVITATION ROUTES
  // ============================================================
  //
  // IMPORTANT:
  //
  // Supabase automatically creates a session when the invited
  // user clicks the invitation email.
  //
  // Therefore /signup?invitation_id=...
  // MUST be allowed even when the user is already logged in.
  //
  // Otherwise middleware sends them directly to dashboard
  // before they can create their password.
  //
  // ============================================================

  const invitationId =
    request.nextUrl.searchParams.get(
      "invitation_id"
    );

  const isInvitationSignup =
    pathname === "/signup" &&
    !!invitationId;

  const isInvitationLogin =
    pathname === "/login" &&
    !!invitationId;

  // ============================================================
  // NOT LOGGED IN → PROTECT /APP
  // ============================================================

  if (
    isAppRoute &&
    !user
  ) {
    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );
  }

  // ============================================================
  // LOGGED-IN USER → NORMAL AUTH ROUTES
  //
  // EXCEPTION:
  //
  // Invitation signup/login is allowed because the Supabase
  // invitation has already created a temporary authenticated
  // session.
  //
  // ============================================================

  if (
    user &&
    isAuthRoute &&
    !isInvitationSignup &&
    !isInvitationLogin
  ) {
    return NextResponse.redirect(
      new URL(
        "/app/dashboard",
        request.url
      )
    );
  }

  // ============================================================
  // CREATE COMPANY REQUIRES AUTHENTICATION
  // ============================================================

  if (
    isCreateCompanyRoute &&
    !user
  ) {
    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );
  }

  // ============================================================
  // ALLOW REQUEST
  // ============================================================

  return response;
}

// ============================================================
// MATCHER
// ============================================================

export const config = {
  matcher: [
    "/app/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/create-company",
  ],
};