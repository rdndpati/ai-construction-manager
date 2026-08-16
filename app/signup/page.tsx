"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ============================================================
  // Get invitation ID from URL
  // ============================================================

  function getInvitationId() {
    if (typeof window === "undefined") {
      return null;
    }

    return new URLSearchParams(
      window.location.search
    ).get("invitation_id");
  }

  // ============================================================
  // Handle Signup
  // ============================================================

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    // ----------------------------------------------------------
    // Preserve invitation ID before signup
    // ----------------------------------------------------------

    const invitationId = getInvitationId();

    console.log(
      "SIGNUP INVITATION ID:",
      invitationId
    );

    // ----------------------------------------------------------
    // Validate passwords
    // ----------------------------------------------------------

    if (password !== confirmPassword) {
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

    setLoading(true);

    try {
      // ========================================================
      // Create Supabase account
      // ========================================================

      const {
        data,
        error,
      } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
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
      // Signup error
      // ========================================================

      if (error) {
        console.error(
          "SIGNUP ERROR:",
          error
        );

        // ------------------------------------------------------
        // If this is an invitation and the Auth user already
        // exists, don't send them to Create Company.
        //
        // Their invitation still needs to be accepted.
        // ------------------------------------------------------

        if (
          invitationId &&
          (
            error.message
              .toLowerCase()
              .includes("already registered") ||
            error.message
              .toLowerCase()
              .includes("already exists") ||
            error.message
              .toLowerCase()
              .includes("user already registered")
          )
        ) {
          setErrorMessage(
            "An account already exists for this email address. Please sign in using this email and accept the invitation."
          );

          return;
        }

        setErrorMessage(
          error.message
        );

        return;
      }

      // ========================================================
      // No user returned
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
      // If signup created a session immediately, we can accept
      // the invitation right away.
      // ========================================================

      if (
        invitationId &&
        data.session
      ) {
        console.log(
          "INVITED USER SIGNUP SUCCESS"
        );

        console.log(
          "REDIRECTING TO ACCEPT INVITATION"
        );

        router.replace(
          `/app/accept-invitation?invitation_id=${encodeURIComponent(
            invitationId
          )}`
        );

        router.refresh();

        return;
      }

      // ========================================================
      // NORMAL USER WITH SESSION
      // ========================================================
      //
      // No invitation means this is a normal new account.
      // They can create their company.
      // ========================================================

      if (data.session) {
        console.log(
          "NORMAL SIGNUP SUCCESS"
        );

        router.replace(
          "/create-company"
        );

        router.refresh();

        return;
      }

      // ========================================================
      // EMAIL CONFIRMATION REQUIRED
      // ========================================================
      //
      // If Supabase requires email confirmation, don't pretend
      // the invitation has already been accepted.
      // ========================================================

      if (invitationId) {
        setSuccessMessage(
          "Your account has been created. Please check your email to verify your account. After verification, return to the invitation link to join the company."
        );
      } else {
        setSuccessMessage(
          "Account created successfully! Please check your email to verify your account."
        );
      }

    } catch (err) {
      console.error(
        "SIGNUP ERROR:",
        err
      );

      setErrorMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // Sign In
  // ============================================================

  function handleSignIn() {
    const invitationId =
      getInvitationId();

    if (invitationId) {
      router.push(
        `/login?invitation_id=${encodeURIComponent(
          invitationId
        )}`
      );

      return;
    }

    router.push("/login");
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md">

        {/* ====================================================
            Brand
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
            Signup Card
        ==================================================== */}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          <div className="mb-7">

            <h2 className="text-2xl font-bold text-gray-900">
              Create Your Account
            </h2>

            <p className="text-gray-500 mt-1">
              Start managing your construction projects.
            </p>

          </div>

          {/* ==================================================
              Signup Form
          ================================================== */}

          <form
            onSubmit={handleSignup}
            className="space-y-5"
          >

            {/* Full Name */}

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

            {/* Email */}

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

            </div>

            {/* Password */}

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

            {/* Confirm Password */}

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
                  value={confirmPassword}
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
                Error
            ================================================== */}

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                {errorMessage}

                {/* ------------------------------------------------
                    If invited user already has an Auth account,
                    give them a direct path back to Login.
                ------------------------------------------------ */}

                {getInvitationId() &&
                  errorMessage
                    .toLowerCase()
                    .includes(
                      "account already exists"
                    ) && (
                    <button
                      type="button"
                      onClick={handleSignIn}
                      className="block mt-3 font-semibold text-red-700 underline hover:text-red-900"
                    >
                      Sign in to continue with your invitation →
                    </button>
                  )}

              </div>
            )}

            {/* ==================================================
                Success
            ================================================== */}

            {successMessage && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

                {successMessage}

              </div>
            )}

            {/* ==================================================
                Create Account
            ================================================== */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </form>

          {/* ====================================================
              Divider
          ==================================================== */}

          <div className="flex items-center gap-3 my-7">

            <div className="h-px flex-1 bg-gray-200" />

            <span className="text-sm text-gray-400">
              Already have an account?
            </span>

            <div className="h-px flex-1 bg-gray-200" />

          </div>

          {/* ====================================================
              Sign In
          ==================================================== */}

          <button
            type="button"
            onClick={handleSignIn}
            className="w-full rounded-lg border border-blue-600 bg-white px-4 py-3 text-center font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Sign In
          </button>

        </div>

        {/* ====================================================
            Footer
        ==================================================== */}

        <p className="text-center text-sm text-gray-400 mt-6">
          © 2026 ConstructIQ
        </p>

      </div>

    </main>
  );
}