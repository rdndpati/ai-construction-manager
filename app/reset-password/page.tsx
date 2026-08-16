"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Check that the password recovery session exists
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setErrorMessage(
          "This password reset link is invalid or has expired. Please request a new reset link."
        );
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error("PASSWORD UPDATE ERROR:", error);
        setErrorMessage(error.message);
        return;
      }

      setSuccess(true);
      setMessage("Password updated successfully!");

      // Sign out after changing password
      await supabase.auth.signOut();

      // Send user back to login
      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Brand */}
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

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          {!success ? (
            <>
              <div className="mb-7">

                <h2 className="text-2xl font-bold text-gray-900">
                  Reset Password
                </h2>

                <p className="text-gray-500 mt-2">
                  Create a new password for your account.
                </p>

              </div>

              <form
                onSubmit={handleReset}
                className="space-y-5"
              >

                {/* New Password */}
                <div>

                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    New Password
                  </label>

                  <div className="relative">

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-20 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 hover:text-gray-800"
                    >
                      {showPassword ? "Hide" : "Show"}
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
                    Confirm New Password
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
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
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

                {/* Error */}
                {errorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                {/* Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Updating Password..."
                    : "Update Password"}
                </button>

              </form>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full mt-5 text-center text-blue-600 hover:text-blue-700 hover:underline"
              >
                ← Back to Sign In
              </button>
            </>
          ) : (
            <div className="text-center">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                ✓
              </div>

              <h2 className="text-2xl font-bold text-gray-900">
                Password Updated
              </h2>

              <p className="text-gray-500 mt-3">
                Your password has been successfully updated.
              </p>

              <p className="text-sm text-gray-400 mt-3">
                Redirecting you to the sign in page...
              </p>

              {message && (
                <p className="text-green-600 text-sm mt-4">
                  {message}
                </p>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          © 2026 ConstructIQ
        </p>

      </div>
    </main>
  );
}