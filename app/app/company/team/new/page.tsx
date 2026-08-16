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

  // ----------------------------------------
  // Successful invitation information
  // ----------------------------------------
  const [invitationSent, setInvitationSent] = useState(false);
  const [sentName, setSentName] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [sentRole, setSentRole] = useState("");

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

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

        setError(
          "Unable to load your company information."
        );

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

        setError(
          "Unable to load available roles."
        );

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
        user.email.toLowerCase() ===
          email.trim().toLowerCase()
      ) {
        setError("You cannot invite yourself.");
        return;
      }

      // ----------------------------------------
      // 5. Send invitation
      // ----------------------------------------
      const response = await fetch(
        "/api/team/invite",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName.trim(),
            email: email.trim().toLowerCase(),
            role_id: selectedRole.id,

            // Existing API expects these
            company_id: profile.company_id,
            invited_by: user.id,
          }),
        }
      );

      const result = await response.json();

      console.log(
        "===================================="
      );

      console.log(
        "INVITATION API RESPONSE"
      );

      console.log(
        "STATUS:",
        response.status
      );

      console.log(
        "OK:",
        response.ok
      );

      console.log(
        "RESULT:",
        result
      );

      console.log(
        "RESULT JSON:",
        JSON.stringify(
          result,
          null,
          2
        )
      );

      console.log(
        "===================================="
      );

      // ----------------------------------------
      // 6. Handle API error
      // ----------------------------------------
      if (!response.ok) {
        console.error(
          "Invitation API error:",
          result?.error || result
        );

        setError(
          result?.error ||
            "Failed to send invitation."
        );

        return;
      }

      // ----------------------------------------
      // 7. Save successful invitation details
      // ----------------------------------------
      setSentName(fullName.trim());
      setSentEmail(
        email.trim().toLowerCase()
      );
      setSentRole(role);

      // ----------------------------------------
      // 8. Show professional success screen
      // ----------------------------------------
      setInvitationSent(true);

      // Clear form
      setFullName("");
      setEmail("");
      setRole("Project Engineer");

    } catch (err) {
      console.error(
        "Invitation error:",
        err
      );

      setError(
        "Something went wrong while sending the invitation."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // SUCCESS SCREEN
  // =====================================================

  if (invitationSent) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">

        <div className="max-w-3xl mx-auto">

          {/* Back */}
          <Link
            href="/app/company/team"
            className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-8 transition"
          >
            ← Back to Team Members
          </Link>

          {/* Success Card */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

            {/* Header */}
            <div className="px-8 pt-10 pb-8 text-center">

              {/* Success Icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              {/* Title */}
              <h1 className="mt-6 text-3xl font-bold text-gray-900">
                Invitation Sent
              </h1>

              <p className="mt-2 text-gray-500">
                The team member has been successfully invited
                to your company.
              </p>
            </div>

            {/* Invitation Details */}
            <div className="border-t border-gray-100 px-8 py-7">

              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
                Invitation Details
              </h2>

              <div className="rounded-xl border border-gray-200 bg-gray-50 divide-y divide-gray-200">

                {/* Name */}
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm text-gray-500">
                    Full Name
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {sentName}
                  </span>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm text-gray-500">
                    Email Address
                  </span>

                  <span className="text-sm font-semibold text-gray-900 break-all ml-6 text-right">
                    {sentEmail}
                  </span>
                </div>

                {/* Role */}
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm text-gray-500">
                    Role
                  </span>

                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    {sentRole}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm text-gray-500">
                    Status
                  </span>

                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-600">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Invitation Sent
                  </span>
                </div>

              </div>
            </div>

            {/* Information */}
            <div className="px-8 pb-7">

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                <div className="flex gap-3">

                  <div className="flex-shrink-0">

                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                      />
                    </svg>

                  </div>

                  <div>

                    <p className="text-sm font-semibold text-blue-800">
                      What happens next?
                    </p>

                    <p className="mt-1 text-sm text-blue-700">
                      An invitation email has been sent to{" "}
                      <span className="font-semibold">
                        {sentEmail}
                      </span>
                      . They can use the invitation to join
                      your company.
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 bg-gray-50 px-8 py-6">

              <div className="flex flex-col sm:flex-row gap-3">

                {/* Back */}
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/app/company/team"
                    )
                  }
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-5 py-3.5 font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Back to Team Members
                </button>

                {/* Invite Another */}
                <button
                  type="button"
                  onClick={() => {
                    setInvitationSent(false);
                    setSentName("");
                    setSentEmail("");
                    setSentRole("");
                    setError("");
                  }}
                  className="flex-1 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700"
                >
                  + Invite Another Member
                </button>

              </div>

            </div>

          </div>

        </div>

      </main>
    );
  }

  // =====================================================
  // INVITATION FORM
  // =====================================================

  return (
    <main className="min-h-screen bg-gray-50 p-8">

      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <Link
          href="/app/company/team"
          className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-6 transition"
        >
          ← Back to Team Members
        </Link>

        {/* Header */}
        <div className="mb-8">

          <h1 className="text-4xl font-bold text-gray-900">
            Invite Team Member
          </h1>

          <p className="text-gray-500 mt-2">
            Add a team member to your company and assign
            their role.
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
                onChange={(e) =>
                  setFullName(e.target.value)
                }
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
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

              <p className="text-xs text-gray-500 mt-2">
                An invitation email will be sent to this
                address.
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
                onChange={(e) =>
                  setRole(e.target.value)
                }
              >

                <option>
                  Project Engineer
                </option>

                <option>
                  Project Manager
                </option>

                <option>
                  Engineer of Record
                </option>

                <option>
                  QA/QC
                </option>

                <option>
                  Client
                </option>

                <option>
                  Admin
                </option>

                <option>
                  Super Admin
                </option>

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

            {/* Buttons */}
            <div className="flex gap-3 pt-2">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/app/company/team"
                  )
                }
                className="flex-1 border border-gray-300 text-gray-700 rounded-xl p-3.5 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
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