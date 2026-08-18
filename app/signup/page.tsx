"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

const INVITATION_STORAGE_KEY =
  "constructiq_invitation_id";

function SignupContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const invitationId =
    searchParams.get(
      "invitation_id"
    );

  // ============================================================
  // FORM
  // ============================================================

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [
    invitationLoading,
    setInvitationLoading,
  ] = useState(
    !!invitationId
  );

  const [
    invitationEmail,
    setInvitationEmail,
  ] = useState("");

  // ============================================================
  // SAVE INVITATION
  // ============================================================

  function saveInvitationId(
    id: string
  ) {
    try {
      sessionStorage.setItem(
        INVITATION_STORAGE_KEY,
        id
      );

      localStorage.setItem(
        INVITATION_STORAGE_KEY,
        id
      );
    } catch {}
  }

  // ============================================================
  // CLEAR INVITATION
  // ============================================================

  function clearInvitationId() {
    try {
      sessionStorage.removeItem(
        INVITATION_STORAGE_KEY
      );

      localStorage.removeItem(
        INVITATION_STORAGE_KEY
      );
    } catch {}
  }

  // ============================================================
  // LOAD INVITATION USER
  // ============================================================

  useEffect(() => {
    if (!invitationId) {
      return;
    }

    saveInvitationId(
      invitationId
    );

    loadInvitationUser(
      invitationId
    );
  }, [invitationId]);

  // ============================================================
  // LOAD INVITATION
  // ============================================================

  async function loadInvitationUser(
    id: string
  ) {
    try {
      setInvitationLoading(
        true
      );

      setErrorMessage("");

      console.log(
        "===================================="
      );

      console.log(
        "INVITATION SIGNUP"
      );

      console.log(
        "INVITATION ID:",
        id
      );

      console.log(
        "===================================="
      );

      // ========================================================
      // LOAD INVITATION
      // ========================================================

      const response =
        await fetch(
          `/api/team/invite?invitation_id=${encodeURIComponent(
            id
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const result =
        await response.json();

      console.log(
        "INVITATION RESULT:",
        result
      );

      if (!response.ok) {
        setErrorMessage(
          result?.error ||
            "Unable to load invitation."
        );

        return;
      }

      const invitation =
        result?.invitation;

      if (
        !invitation
      ) {
        setErrorMessage(
          "Invitation not found."
        );

        return;
      }

      if (
        invitation.status !==
        "Pending"
      ) {
        setErrorMessage(
          "This invitation has already been accepted or is no longer available."
        );

        return;
      }

      const invitedEmail =
        invitation.email
          ?.trim()
          .toLowerCase();

      setInvitationEmail(
        invitedEmail
      );

      // ========================================================
      // CHECK CURRENT AUTH USER
      // ========================================================

      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      console.log(
        "CURRENT USER:",
        user?.email ||
          "NOT LOGGED IN"
      );

      if (
        userError ||
        !user
      ) {
        setErrorMessage(
          "Please open the invitation email again to activate your account."
        );

        return;
      }

      const currentEmail =
        user.email
          ?.trim()
          .toLowerCase();

      console.log(
        "CURRENT EMAIL:",
        currentEmail
      );

      console.log(
        "INVITED EMAIL:",
        invitedEmail
      );

      // ========================================================
      // EMAIL MUST MATCH
      // ========================================================

      if (
        currentEmail !==
        invitedEmail
      ) {
        setErrorMessage(
          `This invitation belongs to ${invitedEmail}. Please sign out and open the invitation using that email address.`
        );

        return;
      }

      // ========================================================
      // PRE-FILL USER INFORMATION
      // ========================================================

      setEmail(
        invitedEmail
      );

      if (
        user.user_metadata
          ?.full_name
      ) {
        setFullName(
          user.user_metadata
            .full_name
        );
      } else if (
        invitation.full_name
      ) {
        setFullName(
          invitation.full_name
        );
      }

      console.log(
        "INVITED USER READY TO SET PASSWORD."
      );

    } catch (error) {
      console.error(
        "LOAD INVITATION SIGNUP ERROR:",
        error
      );

      setErrorMessage(
        "Unable to load the invitation."
      );

    } finally {
      setInvitationLoading(
        false
      );
    }
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleSignup(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    // ==========================================================
    // INVITED USER
    // ==========================================================

    if (invitationId) {
      await handleInvitedSignup();

      return;
    }

    // ==========================================================
    // NORMAL USER
    // ==========================================================

    await handleNormalSignup();
  }

  // ============================================================
  // INVITED USER
  // ============================================================

  async function handleInvitedSignup() {
    // ==========================================================
    // VALIDATE PASSWORD
    // ==========================================================

    if (
      password !==
      confirmPassword
    ) {
      setErrorMessage(
        "Passwords do not match."
      );

      return;
    }

    if (
      password.length < 6
    ) {
      setErrorMessage(
        "Password must be at least 6 characters."
      );

      return;
    }

    setLoading(true);

    try {
      console.log(
        "===================================="
      );

      console.log(
        "INVITED USER PASSWORD SETUP"
      );

      console.log(
        "INVITATION ID:",
        invitationId
      );

      console.log(
        "EMAIL:",
        email
      );

      console.log(
        "===================================="
      );

      // ========================================================
      // GET CURRENT USER
      // ========================================================

      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        setErrorMessage(
          "Your invitation session has expired. Please open the invitation email again."
        );

        return;
      }

      const currentEmail =
        user.email
          ?.trim()
          .toLowerCase();

      const expectedEmail =
        invitationEmail
          .trim()
          .toLowerCase();

      // ========================================================
      // SECURITY CHECK
      // ========================================================

      if (
        currentEmail !==
        expectedEmail
      ) {
        setErrorMessage(
          "The signed-in email does not match the invitation."
        );

        return;
      }

      // ========================================================
      // SET PASSWORD
      // ========================================================

      console.log(
        "SETTING PASSWORD..."
      );

      const {
        data: updatedUser,
        error:
          updateError,
      } =
        await supabase.auth.updateUser(
          {
            password,
            data: {
              full_name:
                fullName.trim(),
            },
          }
        );

      if (updateError) {
        console.error(
          "PASSWORD UPDATE ERROR:",
          updateError
        );

        setErrorMessage(
          updateError.message
        );

        return;
      }

      console.log(
        "PASSWORD SET SUCCESSFULLY"
      );

      console.log(
        "USER:",
        updatedUser.user?.email
      );

      // ========================================================
      // ACCEPT INVITATION
      // ========================================================

      console.log(
        "ACCEPTING INVITATION..."
      );

      const response =
        await fetch(
          "/api/team/accept-invitation",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              invitation_id:
                invitationId,
            }),
          }
        );

      let result: any = null;

      try {
        result =
          await response.json();
      } catch {
        result = null;
      }

      console.log(
        "ACCEPT INVITATION RESPONSE:",
        result
      );

      if (!response.ok) {
        setErrorMessage(
          result?.error ||
            "Your password was created, but the invitation could not be accepted."
        );

        return;
      }

      if (
        !result?.success
      ) {
        setErrorMessage(
          "The invitation could not be accepted."
        );

        return;
      }

      // ========================================================
      // SUCCESS
      // ========================================================

      console.log(
        "===================================="
      );

      console.log(
        "INVITED USER SETUP COMPLETE"
      );

      console.log(
        "COMPANY:",
        result.company_id
      );

      console.log(
        "ROLE:",
        result.role_id
      );

      console.log(
        "===================================="
      );

      clearInvitationId();

      setSuccessMessage(
        "Your account is ready. Opening your company dashboard..."
      );

      // ========================================================
      // GO TO DASHBOARD
      // ========================================================

      setTimeout(() => {
        router.replace(
          "/app/dashboard"
        );

        router.refresh();
      }, 700);

    } catch (error: any) {
      console.error(
        "INVITED SIGNUP ERROR:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Something went wrong while creating your account."
      );

    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // NORMAL USER
  // ============================================================

  async function handleNormalSignup() {
    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (!fullName.trim()) {
      setErrorMessage(
        "Please enter your full name."
      );

      return;
    }

    if (!email.trim()) {
      setErrorMessage(
        "Please enter your email address."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setErrorMessage(
        "Passwords do not match."
      );

      return;
    }

    if (
      password.length < 6
    ) {
      setErrorMessage(
        "Password must be at least 6 characters."
      );

      return;
    }

    setLoading(true);

    try {
      console.log(
        "===================================="
      );

      console.log(
        "NORMAL USER SIGNUP"
      );

      console.log(
        "EMAIL:",
        email
      );

      console.log(
        "===================================="
      );

      const {
        data,
        error,
      } =
        await supabase.auth.signUp(
          {
            email:
              email
                .trim()
                .toLowerCase(),

            password,

            options: {
              data: {
                full_name:
                  fullName.trim(),

                invitation_id:
                  null,
              },

              emailRedirectTo:
                `${window.location.origin}/auth/callback`,
            },
          }
        );

      if (error) {
        console.error(
          "NORMAL SIGNUP ERROR:",
          error
        );

        setErrorMessage(
          error.message
        );

        return;
      }

      console.log(
        "NORMAL SIGNUP SUCCESS:",
        data.user
      );

      // ========================================================
      // SESSION CREATED
      // ========================================================

      if (data.session) {
        clearInvitationId();

        router.replace(
          "/create-company"
        );

        router.refresh();

        return;
      }

      // ========================================================
      // EMAIL CONFIRMATION
      // ========================================================

      setSuccessMessage(
        "Account created successfully. Please check your email to verify your account."
      );

    } catch (error: any) {
      console.error(
        "NORMAL SIGNUP ERROR:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Something went wrong. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // INVITED USER UI
  // ============================================================

  if (invitationId) {
    if (
      invitationLoading
    ) {
      return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl">
              🏗️
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Preparing Your Account
            </h1>

            <p className="mt-3 text-gray-500">
              Verifying your invitation...
            </p>

            <div className="mt-6 flex justify-center">

              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            </div>

          </div>

        </main>
      );
    }

    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">

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
              Complete Your Account
            </p>

          </div>

          {/* CARD */}

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

            <div className="mb-7">

              <h2 className="text-2xl font-bold text-gray-900">
                Create Your Password
              </h2>

              <p className="text-gray-500 mt-2">
                You&apos;ve been invited to join a ConstructIQ company. Set your password to finish creating your account.
              </p>

            </div>

            {/* EMAIL */}

            <div className="mb-5">

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={
                  email
                }
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-600"
              />

            </div>

            {/* FULL NAME */}

            <div className="mb-5">

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>

              <input
                type="text"
                value={
                  fullName
                }
                onChange={(e) =>
                  setFullName(
                    e.target.value
                  )
                }
                placeholder="Your full name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            <form
              onSubmit={
                handleSignup
              }
              className="space-y-5"
            >

              {/* PASSWORD */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Create Password
                </label>

                <div className="relative">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    required
                    minLength={
                      6
                    }
                    value={
                      password
                    }
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Create a password"
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

              {/* CONFIRM PASSWORD */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>

                <div className="relative">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    required
                    value={
                      confirmPassword
                    }
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm your password"
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

              {/* ERROR */}

              {errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* SUCCESS */}

              {successMessage && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              )}

              {/* BUTTON */}

              <button
                type="submit"
                disabled={
                  loading
                }
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Setting Up Account..."
                  : "Create Account & Join Company"}
              </button>

            </form>

            <div className="mt-6 rounded-xl bg-blue-50 border border-blue-100 p-4">

              <p className="text-sm text-blue-800">
                Your email address is already verified through your invitation. After you set your password, you can use this email and password to log in normally.
              </p>

            </div>

          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            © 2026 ConstructIQ
          </p>

        </div>

      </main>
    );
  }

  // ============================================================
  // NORMAL SIGNUP UI
  // ============================================================

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md">

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

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          <div className="mb-7">

            <h2 className="text-2xl font-bold text-gray-900">
              Create Your Account
            </h2>

            <p className="text-gray-500 mt-1">
              Start managing your construction projects.
            </p>

          </div>

          <form
            onSubmit={
              handleSignup
            }
            className="space-y-5"
          >

            {/* FULL NAME */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>

              <input
                type="text"
                required
                value={
                  fullName
                }
                onChange={(e) =>
                  setFullName(
                    e.target.value
                  )
                }
                placeholder="John Smith"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* EMAIL */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                required
                value={
                  email
                }
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="you@company.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* PASSWORD */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>

              <div className="relative">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  minLength={
                    6
                  }
                  value={
                    password
                  }
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Create a password"
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

            {/* CONFIRM */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>

              <div className="relative">

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  required
                  value={
                    confirmPassword
                  }
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm your password"
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

            {/* ERROR */}

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* SUCCESS */}

            {successMessage && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading
              }
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </form>

          <div className="flex items-center gap-3 my-7">

            <div className="h-px flex-1 bg-gray-200" />

            <span className="text-sm text-gray-400">
              Already have an account?
            </span>

            <div className="h-px flex-1 bg-gray-200" />

          </div>

          <Link
            href="/login"
            className="block w-full rounded-lg border border-blue-600 bg-white px-4 py-3 text-center font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Sign In
          </Link>

        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          © 2026 ConstructIQ
        </p>

      </div>

    </main>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">

          <div className="text-gray-500">
            Loading...
          </div>

        </main>
      }
    >
      <SignupContent />
    </Suspense>
  );
}