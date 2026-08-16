"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
  email: email.trim(),
  password,
});

console.log("LOGIN DATA:", data);
console.log("LOGIN ERROR:", error);

if (error) {
  setErrorMessage(error.message);
  setLoading(false);
  return;
}

      if (!data.user) {
        setErrorMessage("Unable to sign in. Please try again.");
        return;
      }

      // Load the user's profile and company
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);
      }

      // User does not have a company yet
      if (!profile?.company_id) {
        router.replace("/create-company");
        return;
      }

      // User has a company
      router.replace("/app/dashboard");
      router.refresh();
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
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

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome Back 👋
            </h2>

            <p className="text-gray-500 mt-1">
              Sign in to manage your construction projects.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

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
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Password */}
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
                  onClick={() => router.push("/forgot-password")}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-20 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 hover:text-gray-800"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error */}
            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Sign In */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm text-gray-400">
              New to ConstructIQ?
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Create Account */}
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="w-full rounded-lg border border-blue-600 bg-white px-4 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Create Account
          </button>

        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          © 2026 ConstructIQ
        </p>

      </div>
    </main>
  );
}