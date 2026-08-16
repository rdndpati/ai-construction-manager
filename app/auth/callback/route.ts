import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");

  const next =
    requestUrl.searchParams.get("next") ||
    "/app/accept-invitation";

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/login?error=missing_code",
        requestUrl.origin
      )
    );
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(
      code
    );

  if (error) {
    console.error(
      "AUTH CALLBACK ERROR:",
      error
    );

    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          error.message
        )}`,
        requestUrl.origin
      )
    );
  }

  // ------------------------------------------------
  // Preserve the complete next path including:
  //
  // /app/accept-invitation?invitation_id=123
  //
  // ------------------------------------------------

  let destination = "/app/dashboard";

  if (next.startsWith("/")) {
    destination = next;
  }

  return NextResponse.redirect(
    new URL(
      destination,
      requestUrl.origin
    )
  );
}