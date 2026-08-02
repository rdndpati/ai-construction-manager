"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
  e.preventDefault();

  setLoading(true);
  setErrorMessage("");

  console.log("1. Starting login");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log("2. Login finished");
  console.log("Data:", data);
  console.log("Error:", error);

  if (error) {
    setErrorMessage(error.message);
    setLoading(false);
    return;
  }

  const { data: profile } = await supabase
  .from("profiles")
  .select("company_id")
  .eq("user_id", data.user.id)
  .single();

if (!profile?.company_id) {
  router.push("/create-company");
} else {
  router.push("/");
}

router.refresh();
  setLoading(false);
}
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            AI Construction Manager
          </h1>

          <p className="text-gray-500 mt-2">
            Sign in to manage your construction projects.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium">
              Email
            </label>

            <input
              type="email"
              required
              placeholder="you@company.com"
              className="w-full border rounded-lg p-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Password
            </label>

            <input
              type="password"
              required
              placeholder="Enter password"
              className="w-full border rounded-lg p-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg p-3 font-semibold disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="text-blue-600 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <div className="mt-3 text-center text-gray-500">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="text-blue-600 hover:underline"
          >
            Create Account
          </button>
        </div>
      </div>
    </main>
  );
}