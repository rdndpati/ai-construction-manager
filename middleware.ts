import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAppRoute = pathname.startsWith("/app");

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  const isCreateCompanyRoute =
    pathname === "/create-company";

  // Not logged in → protect /app
  if (isAppRoute && !user) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // Logged-in users don't need login/signup again
  if (user && isAuthRoute) {
    return NextResponse.redirect(
      new URL("/app/dashboard", request.url)
    );
  }

  // Create Company requires authentication
  if (isCreateCompanyRoute && !user) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  return response;
}

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