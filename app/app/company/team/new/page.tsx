"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function InviteMemberPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Project Engineer");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [sentName, setSentName] = useState("");
  const [sentRole, setSentRole] = useState("");

  // ============================================================
  // SEND INVITATION
  // ============================================================

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // ========================================================
      // 1. GET CURRENT USER
      // ========================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(
          "You are not logged in. Please sign in again."
        );

        return;
      }

      // ========================================================
      // 2. NORMALIZE EMAIL
      // ========================================================

      const normalizedEmail = email
        .trim()
        .toLowerCase();

      const normalizedName = fullName.trim();

      // ========================================================
      // 3. VALIDATION
      // ========================================================

      if (!normalizedName) {
        setError("Please enter the team member's name.");
        return;
      }

      if (!normalizedEmail) {
        setError("Please enter the team member's email address.");
        return;
      }

      // ========================================================
      // 4. PREVENT SELF INVITATION
      // ========================================================

      if (
        user.email?.trim().toLowerCase() ===
        normalizedEmail
      ) {
        setError("You cannot invite yourself.");
        return;
      }

      // ========================================================
      // 5. GET SELECTED ROLE
      // ========================================================

      const {
        data: selectedRole,
        error: roleError,
      } = await supabase
        .from("roles")
        .select("id, name")
        .eq("name", role)
        .single();

      if (roleError || !selectedRole) {
        console.error("ROLE ERROR:", roleError);

        setError(
          "The selected role could not be found."
        );

        return;
      }

      // ========================================================
      // 6. CREATE INVITATION + SEND EMAIL
      // ========================================================

      console.log("====================================");
      console.log("SENDING TEAM INVITATION");
      console.log("NAME:", normalizedName);
      console.log("EMAIL:", normalizedEmail);
      console.log("ROLE:", selectedRole.name);
      console.log("====================================");

      const response = await fetch(
        "/api/team/invite",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            full_name: normalizedName,
            email: normalizedEmail,
            role_id: selectedRole.id,
          }),
        }
      );

      // ========================================================
      // 7. READ RESPONSE
      // ========================================================

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      console.log(
        "INVITATION API STATUS:",
        response.status
      );

      console.log(
        "INVITATION API RESULT:",
        result
      );

      // ========================================================
      // 8. API ERROR
      // ========================================================

      if (!response.ok) {
        setError(
          result?.error ||
            "Unable to send the invitation."
        );

        return;
      }

      // ========================================================
      // 9. VERIFY EMAIL WAS SENT
      // ========================================================

      if (!result?.success) {
        setError(
          result?.error ||
            "The invitation could not be sent."
        );

        return;
      }

      // ========================================================
      // 10. SUCCESS
      // ========================================================

      console.log(
        "===================================="
      );

      console.log(
        "INVITATION SENT SUCCESSFULLY"
      );

      console.log(
        "EMAIL:",
        normalizedEmail
      );

      console.log(
        "===================================="
      );

      setSentName(normalizedName);
      setSentEmail(normalizedEmail);
      setSentRole(selectedRole.name);

      setSuccess(true);

      // Clear form
      setFullName("");
      setEmail("");
      setRole("Project Engineer");
    } catch (err) {
      console.error(
        "INVITATION ERROR:",
        err
      );

      setError(
        "Something went wrong while sending the invitation."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // SUCCESS SCREEN
  // ============================================================

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">

          {/* BACK */}

          <Link
            href="/app/company/team"
            className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-8"
          >
            ← Back to Team Members
          </Link>

          {/* SUCCESS CARD */}

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

            <div className="text-center px-8 py-12">

              {/* ICON */}

              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl">
                ✓
              </div>

              <h1 className="mt-6 text-3xl font-bold text-gray-900">
                Invitation Sent
              </h1>

              <p className="mt-3 text-gray-500">
                The invitation email has been sent successfully.
              </p>

            </div>

            {/* DETAILS */}

            <div className="border-t px-8 py-7">

              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
                Invitation Details
              </h2>

              <div className="rounded-xl border bg-gray-50 divide-y">

                <div className="flex justify-between px-5 py-4 gap-5">
                  <span className="text-sm text-gray-500">
                    Full Name
                  </span>

                  <span className="font-semibold text-gray-900">
                    {sentName}
                  </span>
                </div>

                <div className="flex justify-between px-5 py-4 gap-5">
                  <span className="text-sm text-gray-500">
                    Email
                  </span>

                  <span className="font-semibold text-gray-900 break-all text-right">
                    {sentEmail}
                  </span>
                </div>

                <div className="flex justify-between px-5 py-4 gap-5">
                  <span className="text-sm text-gray-500">
                    Role
                  </span>

                  <span className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold">
                    {sentRole}
                  </span>
                </div>

                <div className="flex justify-between px-5 py-4 gap-5">
                  <span className="text-sm text-gray-500">
                    Status
                  </span>

                  <span className="inline-flex items-center gap-2 text-green-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Email Sent
                  </span>
                </div>

              </div>

            </div>

            {/* INFORMATION */}

            <div className="px-8 pb-7">

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">

                <p className="font-semibold text-blue-800">
                  What happens next?
                </p>

                <p className="text-sm text-blue-700 mt-2">
                  {sentName} will receive an email containing
                  the invitation link. They can create their
                  ConstructIQ account using that link and will
                  automatically be connected to your company.
                </p>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="border-t bg-gray-50 px-8 py-6">

              <div className="flex flex-col sm:flex-row gap-3">

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/app/company/team"
                    )
                  }
                  className="flex-1 border border-gray-300 bg-white rounded-xl px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Back to Team Members
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setSentName("");
                    setSentEmail("");
                    setSentRole("");
                    setError("");
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-3 font-semibold"
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

  // ============================================================
  // INVITATION FORM
  // ============================================================

  return (
    <main className="min-h-screen bg-gray-50 p-8">

      <div className="max-w-3xl mx-auto">

        {/* BACK */}

        <Link
          href="/app/company/team"
          className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-6"
        >
          ← Back to Team Members
        </Link>

        {/* TITLE */}

        <div className="mb-8">

          <h1 className="text-4xl font-bold text-gray-900">
            Invite Team Member
          </h1>

          <p className="text-gray-500 mt-2">
            Send an invitation directly to their email address.
          </p>

        </div>

        {/* FORM */}

        <div className="bg-white rounded-2xl shadow-sm border p-8">

          <form
            onSubmit={inviteMember}
            className="space-y-6"
          >

            {/* FULL NAME */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>

              <input
                type="text"
                required
                placeholder="John Smith"
                value={fullName}
                onChange={(e) =>
                  setFullName(
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="john@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <p className="text-xs text-gray-500 mt-2">
                The invitation will be sent automatically to this email address.
              </p>

            </div>

            {/* ROLE */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role
              </label>

              <select
                value={role}
                onChange={(e) =>
                  setRole(
                    e.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-xl p-3.5 bg-white"
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

            {/* ERROR */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                <p className="font-semibold text-red-700">
                  Invitation failed
                </p>

                <p className="text-sm text-red-600 mt-1">
                  {error}
                </p>

              </div>
            )}

            {/* ACTIONS */}

            <div className="flex gap-3">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/app/company/team"
                  )
                }
                className="flex-1 border border-gray-300 text-gray-700 rounded-xl p-3.5 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3.5 font-semibold disabled:opacity-50"
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