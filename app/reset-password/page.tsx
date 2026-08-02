"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password updated successfully!");

    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={handleReset}
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md"
      >

        <h1 className="text-3xl font-bold mb-2">
          Reset Password
        </h1>

        <p className="text-gray-500 mb-6">
          Enter your new password.
        </p>

        <input
          type="password"
          placeholder="New Password"
          className="w-full border rounded-lg p-3 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full border rounded-lg p-3 mb-4"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg p-3"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

        {message && (
          <p className="text-center mt-4 text-blue-600">
            {message}
          </p>
        )}

      </form>

    </main>
  );
}