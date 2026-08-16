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

  // Invitation result
  const [invitationSent, setInvitationSent] = useState(false);
  const [sentName, setSentName] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [sentRole, setSentRole] = useState("");

  // Email status
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Invitation URL
  const [invitationUrl, setInvitationUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setEmailError("");
    setCopied(false);

    try {
      // ----------------------------------------
      // 1. Get logged-in user
      // ----------------------------------------

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

      // ----------------------------------------
      // 2. Get user's company
      // ----------------------------------------

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "Profile error:",
          profileError
        );

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

      const {
        data: roles,
        error: roleError,
      } = await supabase
        .from("roles")
        .select("id, name");

      if (roleError) {
        console.error(
          "Role error:",
          roleError
        );

        setError(
          "Unable to load available roles."
        );

        return;
      }

      const selectedRole = roles?.find(
        (item) => item.name === role
      );

      if (!selectedRole) {
        setError(
          "Selected role was not found."
        );

        return;
      }

      // ----------------------------------------
      // 4. Prevent inviting yourself
      // ----------------------------------------

      const normalizedEmail =
        email.trim().toLowerCase();

      if (
        user.email &&
        user.email.toLowerCase() ===
          normalizedEmail
      ) {
        setError(
          "You cannot invite yourself."
        );

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
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            full_name:
              fullName.trim(),

            email:
              normalizedEmail,

            role_id:
              selectedRole.id,

            company_id:
              profile.company_id,

            invited_by:
              user.id,
          }),
        }
      );

      const result =
        await response.json();

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
      // 6. REAL API ERROR
      // ----------------------------------------

      if (!response.ok) {
        console.error(
          "Invitation API error:",
          result?.error || result
        );

        setError(
          result?.error ||
            "Failed to create invitation."
        );

        return;
      }

      // ----------------------------------------
      // 7. SAVE INVITATION INFORMATION
      // ----------------------------------------

      setSentName(
        fullName.trim()
      );

      setSentEmail(
        normalizedEmail
      );

      setSentRole(
        role
      );

      // ----------------------------------------
      // 8. SAVE EMAIL STATUS
      // ----------------------------------------

      setEmailSent(
        result?.email_sent === true
      );

      if (
        result?.email_sent === false
      ) {
        setEmailError(
          result?.email_error ||
            "The invitation was created, but the email could not be sent."
        );
      } else {
        setEmailError("");
      }

      // ----------------------------------------
      // 9. SAVE INVITATION LINK
      // ----------------------------------------

      if (
        result?.invitation_url
      ) {
        setInvitationUrl(
          result.invitation_url
        );
      } else {
        setInvitationUrl("");
      }

      // ----------------------------------------
      // 10. SHOW SUCCESS SCREEN
      // ----------------------------------------

      setInvitationSent(true);

      // Clear form
      setFullName("");
      setEmail("");
      setRole(
        "Project Engineer"
      );

    } catch (err) {
      console.error(
        "Invitation error:",
        err
      );

      setError(
        "Something went wrong while creating the invitation."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // COPY INVITATION LINK
  // =====================================================

  async function copyInvitationLink() {
    if (!invitationUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        invitationUrl
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2500);

    } catch (err) {
      console.error(
        "COPY ERROR:",
        err
      );

      setError(
        "Unable to copy the invitation link. Please copy it manually."
      );
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

          {/* Main Card */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

            {/* Header */}
            <div className="px-8 pt-10 pb-8 text-center">

              {/* Icon */}
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                  emailSent
                    ? "bg-green-100"
                    : "bg-blue-100"
                }`}
              >

                {emailSent ? (
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
                ) : (
                  <svg
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                )}

              </div>

              {/* Title */}
              <h1 className="mt-6 text-3xl font-bold text-gray-900">

                {emailSent
                  ? "Invitation Sent"
                  : "Invitation Created"}

              </h1>

              <p className="mt-2 text-gray-500">

                {emailSent
                  ? "The team member has been successfully invited to your company."
                  : "The team member invitation was created successfully."}

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

                  {emailSent ? (
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-600">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Email Sent
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Invitation Created
                    </span>
                  )}

                </div>

              </div>

            </div>

            {/* EMAIL SUCCESS */}
            {emailSent && (
              <div className="px-8 pb-7">

                <div className="rounded-xl border border-green-100 bg-green-50 p-4">

                  <div className="flex gap-3">

                    <div className="flex-shrink-0">

                      <svg
                        className="h-5 w-5 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>

                    </div>

                    <div>

                      <p className="text-sm font-semibold text-green-800">
                        Invitation email sent
                      </p>

                      <p className="mt-1 text-sm text-green-700">
                        An invitation email was sent to{" "}
                        <span className="font-semibold">
                          {sentEmail}
                        </span>
                        .
                      </p>

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* EMAIL NOT SENT */}
            {!emailSent && (
              <div className="px-8 pb-7">

                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">

                  <div className="flex gap-3">

                    <div className="flex-shrink-0">

                      <svg
                        className="h-5 w-5 text-yellow-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 003.84 21h16.32a2 2 0 001.73-3.14l-8.18-14a2 2 0 00-3.42 0z"
                        />
                      </svg>

                    </div>

                    <div className="flex-1">

                      <p className="text-sm font-semibold text-yellow-800">
                        Invitation created, but email was not sent
                      </p>

                      <p className="mt-1 text-sm text-yellow-700">
                        {emailError ||
                          "Your Resend email service cannot currently send this email."}
                      </p>

                      <p className="mt-3 text-sm text-yellow-700">
                        The invitation is still valid. Copy the invitation link below and send it to the team member manually.
                      </p>

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* INVITATION LINK */}
            {!emailSent &&
              invitationUrl && (
                <div className="border-t border-gray-100 px-8 py-7">

                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
                    Invitation Link
                  </h2>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">

                    <p className="text-xs text-gray-500 mb-2">
                      Send this link to{" "}
                      <span className="font-semibold">
                        {sentEmail}
                      </span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">

                      <input
                        type="text"
                        value={invitationUrl}
                        readOnly
                        className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 outline-none"
                      />

                      <button
                        type="button"
                        onClick={
                          copyInvitationLink
                        }
                        className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 transition"
                      >
                        {copied
                          ? "✓ Copied"
                          : "Copy Link"}
                      </button>

                    </div>

                    {copied && (
                      <p className="mt-2 text-sm text-green-600 font-medium">
                        Invitation link copied to your clipboard.
                      </p>
                    )}

                  </div>

                </div>
              )}

            {/* WHAT HAPPENS NEXT */}
            <div className="px-8 pb-7">

              <div
                className={`rounded-xl border p-4 ${
                  emailSent
                    ? "border-blue-100 bg-blue-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >

                <div className="flex gap-3">

                  <div className="flex-shrink-0">

                    <svg
                      className={`h-5 w-5 ${
                        emailSent
                          ? "text-blue-600"
                          : "text-gray-600"
                      }`}
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

                    <p
                      className={`text-sm font-semibold ${
                        emailSent
                          ? "text-blue-800"
                          : "text-gray-800"
                      }`}
                    >
                      What happens next?
                    </p>

                    <p
                      className={`mt-1 text-sm ${
                        emailSent
                          ? "text-blue-700"
                          : "text-gray-600"
                      }`}
                    >

                      {emailSent
                        ? `The team member can open the invitation email, create or sign in to their ConstructIQ account, and join your company.`
                        : `Send the invitation link to the team member. When they open it, they can create or sign in to their ConstructIQ account and join your company.`}

                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* ACTIONS */}
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
                    setInvitationSent(
                      false
                    );

                    setSentName("");
                    setSentEmail("");
                    setSentRole("");

                    setEmailSent(false);
                    setEmailError("");

                    setInvitationUrl("");
                    setCopied(false);

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
                address when email delivery is configured.
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