"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

const INVITATION_STORAGE_KEY =
  "constructiq_invitation_id";

// ============================================================
// LOGIN CONTENT
// ============================================================

function LoginContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [invitationForUI, setInvitationForUI] =
    useState<string | null>(null);

  // ============================================================
  // GET INVITATION ID
  //
  // Priority:
  // 1. URL
  // 2. sessionStorage
  // ============================================================

  function getInvitationId() {
    if (
      typeof window ===
      "undefined"
    ) {
      return null;
    }

    const urlInvitationId =
      searchParams.get(
        "invitation_id"
      );

    if (urlInvitationId) {
      console.log(
        "LOGIN: INVITATION ID FROM URL:",
        urlInvitationId
      );

      sessionStorage.setItem(
        INVITATION_STORAGE_KEY,
        urlInvitationId
      );

      return urlInvitationId;
    }

    const storedInvitationId =
      sessionStorage.getItem(
        INVITATION_STORAGE_KEY
      );

    if (storedInvitationId) {
      console.log(
        "LOGIN: INVITATION ID FROM SESSION:",
        storedInvitationId
      );

      return storedInvitationId;
    }

    console.log(
      "LOGIN: NO INVITATION ID FOUND"
    );

    return null;
  }

  // ============================================================
  // LOAD INVITATION
  // ============================================================

  useEffect(() => {
    const invitationId =
      getInvitationId();

    setInvitationForUI(
      invitationId
    );
  }, [searchParams]);

  // ============================================================
  // SAVE INVITATION
  // ============================================================

  function saveInvitationId(
    invitationId: string
  ) {
    if (
      typeof window !==
      "undefined"
    ) {
      sessionStorage.setItem(
        INVITATION_STORAGE_KEY,
        invitationId
      );

      localStorage.setItem(
        INVITATION_STORAGE_KEY,
        invitationId
      );
    }

    setInvitationForUI(
      invitationId
    );
  }

  // ============================================================
  // FIND PENDING INVITATION
  // ============================================================

  async function findPendingInvitation(
    userEmail: string
  ) {
    try {
      const normalizedEmail =
        userEmail
          .trim()
          .toLowerCase();

      const {
        data: invitation,
        error,
      } =
        await supabase
          .from("invitations")
          .select(
            "id, email, company_id, role_id, status"
          )
          .eq(
            "email",
            normalizedEmail
          )
          .eq(
            "status",
            "Pending"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (error) {
        console.error(
          "PENDING INVITATION ERROR:",
          error
        );

        return null;
      }

      return invitation || null;

    } catch (err) {
      console.error(
        "FIND INVITATION ERROR:",
        err
      );

      return null;
    }
  }

  // ============================================================
  // GO TO ACCEPT INVITATION
  // ============================================================

  function goToInvitation(
    invitationId: string
  ) {
    console.log(
      "GOING TO ACCEPT INVITATION:",
      invitationId
    );

    saveInvitationId(
      invitationId
    );

    router.replace(
      `/app/accept-invitation?invitation_id=${encodeURIComponent(
        invitationId
      )}`
    );
  }

  // ============================================================
  // LOGIN
  // ============================================================

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    try {
      const invitationId =
        getInvitationId();

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      console.log(
        "===================================="
      );

      console.log(
        "LOGIN START"
      );

      console.log(
        "EMAIL:",
        normalizedEmail
      );

      console.log(
        "INVITATION ID:",
        invitationId ||
          "NONE"
      );

      console.log(
        "===================================="
      );

      // ========================================================
      // SIGN IN
      // ========================================================

      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              normalizedEmail,

            password,
          }
        );

      if (error) {
        console.error(
          "LOGIN ERROR:",
          error
        );

        setErrorMessage(
          error.message
        );

        return;
      }

      if (!data.user) {
        setErrorMessage(
          "Unable to sign in. Please try again."
        );

        return;
      }

      console.log(
        "LOGIN SUCCESS:",
        data.user.email
      );

      // ========================================================
      // INVITATION FLOW
      //
      // ALWAYS PROCESS INVITATION FIRST.
      // ========================================================

      if (invitationId) {
        console.log(
          "INVITATION ID FOUND."
        );

        console.log(
          "GOING TO ACCEPT INVITATION."
        );

        goToInvitation(
          invitationId
        );

        return;
      }

      // ========================================================
      // FALLBACK:
      // FIND PENDING INVITATION BY EMAIL
      // ========================================================

      console.log(
        "NO INVITATION ID."
      );

      console.log(
        "CHECKING EMAIL FOR PENDING INVITATION."
      );

      const pendingInvitation =
        await findPendingInvitation(
          normalizedEmail
        );

      if (
        pendingInvitation?.id
      ) {
        console.log(
          "PENDING INVITATION FOUND:",
          pendingInvitation.id
        );

        goToInvitation(
          pendingInvitation.id
        );

        return;
      }

      // ========================================================
      // NORMAL USER
      // ========================================================

      console.log(
        "NO INVITATION."
      );

      console.log(
        "CHECKING PROFILE."
      );

      const {
        data: profile,
        error:
          profileError,
      } =
        await supabase
          .from("profiles")
          .select(
            "id, company_id, role_id, is_owner"
          )
          .eq(
            "id",
            data.user.id
          )
          .maybeSingle();

      if (profileError) {
        console.error(
          "PROFILE ERROR:",
          profileError
        );

        setErrorMessage(
          "We couldn't load your company information. Please try again."
        );

        return;
      }

      // ========================================================
      // NO PROFILE
      // ========================================================

      if (!profile) {
        console.log(
          "NO PROFILE."
        );

        router.replace(
          "/create-company"
        );

        return;
      }

      // ========================================================
      // PROFILE WITHOUT COMPANY
      // ========================================================

      if (!profile.company_id) {
        console.log(
          "PROFILE HAS NO COMPANY."
        );

        router.replace(
          "/create-company"
        );

        return;
      }

      // ========================================================
      // NORMAL COMPANY USER
      // ========================================================

      console.log(
        "NORMAL COMPANY USER."
      );

      router.replace(
        "/app/dashboard"
      );

    } catch (err) {
      console.error(
        "LOGIN UNEXPECTED ERROR:",
        err
      );

      setErrorMessage(
        "Something went wrong while signing in. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // CREATE ACCOUNT
  // ============================================================

  function handleCreateAccount() {
    const invitationId =
      getInvitationId();

    console.log(
      "CREATE ACCOUNT - INVITATION ID:",
      invitationId ||
        "NONE"
    );

    if (invitationId) {
      saveInvitationId(
        invitationId
      );

      router.push(
        `/signup?invitation_id=${encodeURIComponent(
          invitationId
        )}`
      );

      return;
    }

    router.push(
      "/signup"
    );
  }

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  function handleForgotPassword() {
    const invitationId =
      getInvitationId();

    if (invitationId) {
      saveInvitationId(
        invitationId
      );

      router.push(
        `/forgot-password?invitation_id=${encodeURIComponent(
          invitationId
        )}`
      );

      return;
    }

    router.push(
      "/forgot-password"
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* BRAND */}

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

        {/* INVITATION NOTICE */}

        {invitationForUI && (
          <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">

            <p className="font-semibold text-blue-800">
              You&apos;ve been invited to join a company
            </p>

            <p className="text-sm text-blue-700 mt-1">
              Sign in or create an account using the email address that received the invitation.
            </p>

          </div>
        )}

        {/* LOGIN CARD */}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          <div className="mb-7">

            <h2 className="text-2xl font-bold text-gray-900">
              Welcome Back 👋
            </h2>

            <p className="text-gray-500 mt-1">
              {invitationForUI
                ? "Sign in to continue with your invitation."
                : "Sign in to manage your construction projects."}
            </p>

          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* EMAIL */}

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

            {/* PASSWORD */}

            <div>

              <div className="flex justify-between items-center mb-2">

                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={
                    handleForgotPassword
                  }
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </button>

              </div>

              <div className="relative">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
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

            </div>

            {/* ERROR */}

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* LOGIN */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>

          {/* DIVIDER */}

          <div className="flex items-center gap-3 my-7">

            <div className="h-px flex-1 bg-gray-200" />

            <span className="text-sm text-gray-400">
              New to ConstructIQ?
            </span>

            <div className="h-px flex-1 bg-gray-200" />

          </div>

          {/* CREATE ACCOUNT */}

          <button
            type="button"
            onClick={
              handleCreateAccount
            }
            className="w-full rounded-lg border border-blue-600 bg-white px-4 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            {invitationForUI
              ? "Create Account & Join Company"
              : "Create Account"}
          </button>

        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          © 2026 ConstructIQ
        </p>

      </div>

    </main>
  );
}

// ============================================================
// LOGIN PAGE
//
// Suspense is required because LoginContent uses
// useSearchParams().
// ============================================================

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

          <div className="bg-white rounded-2xl shadow-lg border p-10 w-full max-w-md text-center">

            <div className="text-4xl mb-4">
              🏗️
            </div>

            <h1 className="text-xl font-semibold text-gray-900">
              Loading...
            </h1>

            <p className="text-gray-500 mt-2">
              Please wait.
            </p>

          </div>

        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}