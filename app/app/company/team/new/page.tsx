"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function InviteMemberPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Project Engineer");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // ----------------------------------------
      // 1. Get logged-in user
      // ----------------------------------------
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You are not logged in. Please sign in again.");
        return;
      }

      // ----------------------------------------
      // 2. Get user's company
      // ----------------------------------------
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        setError("Unable to load your company information.");
        return;
      }

      if (!profile?.company_id) {
        setError(
          "You are not connected to a company. Please create or join a company first."
        );
        return;
      }

      // ----------------------------------------
      // 3. Get selected role
      // ----------------------------------------
      const { data: roles, error: roleError } = await supabase
        .from("roles")
        .select("id, name");

      if (roleError) {
        console.error("Role error:", roleError);
        setError("Unable to load available roles.");
        return;
      }

      const selectedRole = roles?.find(
        (item) => item.name === role
      );

      if (!selectedRole) {
        setError("Selected role was not found.");
        return;
      }

      // ----------------------------------------
      // 4. Prevent inviting yourself
      // ----------------------------------------
      if (
        user.email &&
        user.email.toLowerCase() === email.trim().toLowerCase()
      ) {
        setError("You cannot invite yourself.");
        return;
      }

      // ----------------------------------------
      // 5. Send invitation
      // ----------------------------------------
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          role_id: selectedRole.id,

          // Keep these because your existing API expects them.
          company_id: profile.company_id,
          invited_by: user.id,
        }),
      });

      const result = await response.json();

      

console.log("====================================");
console.log("INVITATION API RESPONSE");
console.log("STATUS:", response.status);
console.log("OK:", response.ok);
console.log("RESULT:", result);
console.log("RESULT JSON:", JSON.stringify(result, null, 2));
console.log("====================================");

if (!response.ok) {
  console.error(
    "Invitation API error:",
    result?.error || result
  );

  setError(
    result?.error ||
      "Failed to send invitation."
  );

  setLoading(false);
  return;
}

      // ----------------------------------------
      // 6. Success
      // ----------------------------------------
      setSuccess(
        `Invitation sent successfully to ${email.trim().toLowerCase()}.`
      );

      setFullName("");
      setEmail("");
      setRole("Project Engineer");

    } catch (err) {
      console.error("Invitation error:", err);

      setError(
        "Something went wrong while sending the invitation."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <Link
          href="/app/company/team"
          className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-6"
        >
          ← Back to Team Members
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Invite Team Member
          </h1>

          <p className="text-gray-500 mt-2">
            Add a team member to your company and assign their role.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border p-8">

          <form
            onSubmit={inviteMember}
            className="space-y-6"
          >

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>

              <input
                type="text"
                className="w-full border border-gray-300 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                className="w-full border border-gray-300 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <p className="text-xs text-gray-500 mt-2">
                An invitation email will be sent to this address.
              </p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role
              </label>

              <select
                className="w-full border border-gray-300 rounded-xl p-3.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex gap-3">
                  <div className="text-red-600 font-bold">
                    !
                  </div>

                  <div>
                    <p className="font-semibold text-red-700">
                      Invitation failed
                    </p>

                    <p className="text-sm text-red-600 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex gap-3">
                  <div className="text-green-600 font-bold">
                    ✓
                  </div>

                  <div>
                    <p className="font-semibold text-green-700">
                      Invitation sent
                    </p>

                    <p className="text-sm text-green-600 mt-1">
                      {success}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">

              <button
                type="button"
                onClick={() => router.push("/app/company/team")}
                className="flex-1 border border-gray-300 text-gray-700 rounded-xl p-3.5 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Sending Invitation..."
                  : "Send Invitation"}
              </button>

            </div>

          </form>
        </div>

      </div>
    </main>
  );
}