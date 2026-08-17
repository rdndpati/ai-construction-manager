"use client";

import {
  Suspense,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

function SignupPageContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const invitationId =
    searchParams.get(
      "invitation_id"
    );

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // ============================================================
  // HANDLE SIGNUP
  // ============================================================

  async function handleSignup(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    // ----------------------------------------------------------
    // Validate passwords
    // ----------------------------------------------------------

    if (
      password !==
      confirmPassword
    ) {
      setErrorMessage(
        "Passwords do not match."
      );

      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "Password must be at least 6 characters."
      );

      return;
    }

    // ----------------------------------------------------------
    // Normalize email
    // ----------------------------------------------------------

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    // ----------------------------------------------------------
    // Start loading
    // ----------------------------------------------------------

    setLoading(true);

    try {
      console.log(
        "===================================="
      );

      console.log(
        "SIGNUP START"
      );

      console.log(
        "INVITATION ID:",
        invitationId
      );

      console.log(
        "EMAIL:",
        normalizedEmail
      );

      console.log(
        "===================================="
      );

      // ========================================================
      // CREATE SUPABASE ACCOUNT
      // ========================================================

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email:
            normalizedEmail,

          password,

          options: {
            data: {
              full_name:
                fullName.trim(),
            },
          },
        });

      console.log(
        "SIGNUP DATA:",
        data
      );

      console.log(
        "SIGNUP ERROR:",
        error
      );

      // ========================================================
      // SIGNUP ERROR
      // ========================================================

      if (error) {
        console.error(
          "SIGNUP ERROR:",
          error
        );

        const errorText =
          error.message
            .toLowerCase();

        // ------------------------------------------------------
        // EXISTING USER
        // ------------------------------------------------------

        if (
          errorText.includes(
            "already registered"
          ) ||
          errorText.includes(
            "already exists"
          ) ||
          errorText.includes(
            "user already registered"
          )
        ) {
          if (invitationId) {
            setErrorMessage(
              "An account already exists for this email. Please sign in using this email to continue with the invitation."
            );
          } else {
            setErrorMessage(
              "An account already exists for this email. Please sign in instead."
            );
          }

          return;
        }

        setErrorMessage(
          error.message
        );

        return;
      }

      // ========================================================
      // USER WAS NOT CREATED
      // ========================================================

      if (!data.user) {
        setErrorMessage(
          "Unable to create your account. Please try again."
        );

        return;
      }

      console.log(
        "ACCOUNT CREATED:",
        data.user.id
      );

      // ========================================================
      // INVITED USER
      // ========================================================
      //
      // If invitation_id exists:
      //
      // NEVER send the user to /create-company.
      //
      // They must continue through the invitation flow.
      // ========================================================

      if (invitationId) {
        // ------------------------------------------------------
        // CASE 1:
        // Supabase created a session immediately.
        // ------------------------------------------------------

        if (data.session) {
          console.log(
            "INVITED USER HAS SESSION"
          );

          console.log(
            "GOING TO ACCEPT INVITATION"
          );

          router.replace(
            `/app/accept-invitation?invitation_id=${encodeURIComponent(
              invitationId
            )}`
          );

          router.refresh();

          return;
        }

        // ------------------------------------------------------
        // CASE 2:
        // Email confirmation required.
        // ------------------------------------------------------

        console.log(
          "INVITED USER NEEDS EMAIL CONFIRMATION"
        );

        setSuccessMessage(
          "Your account has been created. Please verify your email, then return to the invitation link to join the company."
        );

        return;
      }

      // ========================================================
      // NORMAL USER
      // ========================================================
      //
      // No invitation_id means this is a normal signup.
      //
      // Normal users can create their own company.
      // ========================================================

      if (data.session) {
        console.log(
          "NORMAL USER SIGNUP"
        );

        router.replace(
          "/create-company"
        );

        router.refresh();

        return;
      }

      // ========================================================
      // NORMAL USER WITH EMAIL CONFIRMATION
      // ========================================================

      setSuccessMessage(
        "Account created successfully! Please check your email to verify your account."
      );

    } catch (err) {
      console.error(
        "SIGNUP ERROR:",
        err
      );

      setErrorMessage(
        "Something went wrong while creating your account. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // GO TO LOGIN
  // ============================================================

  function goToLogin() {
    if (invitationId) {
      router.push(
        `/login?invitation_id=${encodeURIComponent(
          invitationId
        )}`
      );

      return;
    }

    router.push(
      "/login"
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md">

        {/* ====================================================
            BRAND
        ==================================================== */}

        <div className="text-center mb-8">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl shadow-lg">
            🏗️
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            ConstructIQ
          </h1>

          <p className="text-gray-500 mt-2">
            Engineering Project Management Platform
          </p>

        </div>

        {/* ====================================================
            INVITATION NOTICE
        ==================================================== */}

        {invitationId && (
          <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">

            <p className="font-semibold text-blue-800">
              You&apos;ve been invited to join a company
            </p>

            <p className="text-sm text-blue-700 mt-1">
              Create your account below. After
              signup, you&apos;ll automatically be
              connected to the company that invited
              you.
            </p>

          </div>
        )}

        {/* ====================================================
            SIGNUP CARD
        ==================================================== */}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          <div className="mb-7">

            <h2 className="text-2xl font-bold text-gray-900">
              Create Your Account
            </h2>

            <p className="text-gray-500 mt-1">
              {invitationId
                ? "Create your account to accept the invitation."
                : "Start managing your construction projects."}
            </p>

          </div>

          {/* ==================================================
              FORM
          ================================================== */}

          <form
            onSubmit={
              handleSignup
            }
            className="space-y-5"
          >

            {/* ==================================================
                FULL NAME
            ================================================== */}

            <div>

              <label
                htmlFor="fullName"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) =>
                  setFullName(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* ==================================================
                EMAIL
            ================================================== */}

            <div>

              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

              {invitationId && (
                <p className="text-xs text-blue-600 mt-2">
                  Use the email address that received
                  the invitation.
                </p>
              )}

            </div>

            {/* ==================================================
                PASSWORD
            ================================================== */}

            <div>

              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Password
              </label>

              <div className="relative">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-20 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 hover:text-gray-800"
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 characters.
              </p>

            </div>

            {/* ==================================================
                CONFIRM PASSWORD
            ================================================== */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Confirm Password
              </label>

              <div className="relative">

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  required
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  value={
                    confirmPassword
                  }
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-20 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 hover:text-gray-800"
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>

            {/* ==================================================
                ERROR
            ================================================== */}

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">

                <p>
                  {errorMessage}
                </p>

                {invitationId &&
                  errorMessage
                    .toLowerCase()
                    .includes(
                      "account already exists"
                    ) && (
                    <button
                      type="button"
                      onClick={
                        goToLogin
                      }
                      className="mt-3 font-semibold text-red-700 underline hover:text-red-900"
                    >
                      Sign in to continue with your invitation →
                    </button>
                  )}

              </div>
            )}

            {/* ==================================================
                SUCCESS
            ================================================== */}

            {successMessage && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-700">

                {successMessage}

                {invitationId && (
                  <button
                    type="button"
                    onClick={() => {
                      router.push(
                        `/login?invitation_id=${encodeURIComponent(
                          invitationId
                        )}`
                      );
                    }}
                    className="block mt-3 font-semibold underline"
                  >
                    Continue to Sign In →
                  </button>
                )}

              </div>
            )}

            {/* ==================================================
                CREATE ACCOUNT
            ================================================== */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating Account..."
                : invitationId
                ? "Create Account & Join Company"
                : "Create Account"}
            </button>

          </form>

          {/* ====================================================
              DIVIDER
          ==================================================== */}

          <div className="flex items-center gap-3 my-7">

            <div className="h-px flex-1 bg-gray-200" />

            <span className="text-sm text-gray-400">
              Already have an account?
            </span>

            <div className="h-px flex-1 bg-gray-200" />

          </div>

          {/* ====================================================
              SIGN IN
          ==================================================== */}

          <button
            type="button"
            onClick={
              goToLogin
            }
            className="w-full rounded-lg border border-blue-600 bg-white px-4 py-3 text-center font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Sign In
          </button>

        </div>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <p className="text-center text-sm text-gray-400 mt-6">
          © 2026 ConstructIQ
        </p>

      </div>

    </main>
  );
}

// ============================================================
// PAGE WRAPPER
//
// Next.js requires useSearchParams() to be rendered inside
// a Suspense boundary during production builds.
// ============================================================

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

          <div className="text-center">

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>

            <p className="text-gray-500">
              Loading...
            </p>

          </div>

        </main>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}