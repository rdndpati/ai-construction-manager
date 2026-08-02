"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function InviteMemberPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Project Engineer");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/team/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        role,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    setSuccess("Invitation sent successfully.");

    setName("");
    setEmail("");
    setRole("Project Engineer");

    setLoading(false);

    setTimeout(() => {
      router.push("/team");
    }, 1500);
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">
        Invite Team Member
      </h1>

      <p className="text-gray-500 mb-8">
        Invite a new member to your company.
      </p>

      <form onSubmit={handleInvite} className="space-y-5">

        <input
          className="w-full border rounded-lg p-3"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          className="w-full border rounded-lg p-3"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <select
          className="w-full border rounded-lg p-3"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option>Project Engineer</option>
          <option>Project Manager</option>
          <option>Engineer of Record</option>
          <option>QA/QC</option>
          <option>Client</option>
          <option>Admin</option>
          <option>Super Admin</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 disabled:opacity-50"
        >
          {loading ? "Sending Invitation..." : "Send Invitation"}
        </button>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded-lg">
            {success}
          </div>
        )}

      </form>
    </main>
  );
}