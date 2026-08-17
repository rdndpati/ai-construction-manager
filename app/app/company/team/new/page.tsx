"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function InviteMemberPage() {
  const router = useRouter();

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState("Project Engineer");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [invitationCreated, setInvitationCreated] =
    useState(false);

  const [invitationUrl, setInvitationUrl] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [emailOpened, setEmailOpened] =
    useState(false);

  const [sentName, setSentName] =
    useState("");

  const [sentEmail, setSentEmail] =
    useState("");

  const [sentRole, setSentRole] =
    useState("");

  // ============================================================
  // CREATE INVITATION
  // ============================================================

  async function inviteMember(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setCopied(false);
    setEmailOpened(false);

    try {
      // ========================================================
      // GET CURRENT USER
      // ========================================================

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        setError(
          "You are not logged in. Please sign in again."
        );
        return;
      }

      // ========================================================
      // NORMALIZE EMAIL
      // ========================================================

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      // ========================================================
      // PREVENT SELF INVITATION
      // ========================================================

      if (
        user.email
          ?.trim()
          .toLowerCase() ===
        normalizedEmail
      ) {
        setError(
          "You cannot invite yourself."
        );
        return;
      }

      // ========================================================
      // GET ROLES
      // ========================================================

      const {
        data: roles,
        error: rolesError,
      } =
        await supabase
          .from("roles")
          .select(
            "id, name"
          );

      if (rolesError) {
        console.error(
          "ROLES ERROR:",
          rolesError
        );

        setError(
          "Unable to load roles."
        );

        return;
      }

      // ========================================================
      // FIND SELECTED ROLE
      // ========================================================

      const selectedRole =
        roles?.find(
          (item) =>
            item.name === role
        );

      if (!selectedRole) {
        setError(
          "Selected role was not found."
        );

        return;
      }

      // ========================================================
      // CREATE INVITATION
      // ========================================================

      const response =
        await fetch(
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
            }),
          }
        );

      const result =
        await response.json();

      console.log(
        "INVITATION API RESULT:",
        result
      );

      // ========================================================
      // API ERROR
      // ========================================================

      if (!response.ok) {
        setError(
          result?.error ||
            "Unable to create invitation."
        );

        return;
      }

      // ========================================================
      // VERIFY INVITATION URL
      // ========================================================

      if (
        !result?.invitation_url
      ) {
        setError(
          "Invitation was created, but the invitation link could not be generated."
        );

        return;
      }

      // ========================================================
      // SAVE INVITATION INFORMATION
      // ========================================================

      setSentName(
        fullName.trim()
      );

      setSentEmail(
        normalizedEmail
      );

      setSentRole(
        role
      );

      setInvitationUrl(
        result.invitation_url
      );

      setInvitationCreated(
        true
      );

      // ========================================================
      // CLEAR FORM
      // ========================================================

      setFullName("");
      setEmail("");
      setRole(
        "Project Engineer"
      );

    } catch (err) {
      console.error(
        "INVITATION ERROR:",
        err
      );

      setError(
        "Something went wrong while creating the invitation."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // COPY INVITATION LINK
  // ============================================================

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

    } catch {
      setError(
        "Unable to copy the invitation link."
      );
    }
  }

  // ============================================================
  // OPEN EMAIL CLIENT
  // ============================================================

  function sendInvitationEmail() {
    if (
      !invitationUrl ||
      !sentEmail
    ) {
      return;
    }

    const subject =
      "You're invited to join ConstructIQ";

    const body =
      `Hi ${sentName || "there"},

You have been invited to join our company on ConstructIQ.

Your assigned role: ${sentRole}

Please use the invitation link below to create your account or sign in and join the company:

${invitationUrl}

If you already have a ConstructIQ account, simply sign in using the email address that received this invitation.

Thank you.`;

    const mailto =
      `mailto:${encodeURIComponent(
        sentEmail
      )}` +
      `?subject=${encodeURIComponent(
        subject
      )}` +
      `&body=${encodeURIComponent(
        body
      )}`;

    // Open user's default email application.
    window.location.href =
      mailto;

    setEmailOpened(true);

    setTimeout(() => {
      setEmailOpened(false);
    }, 4000);
  }

  // ============================================================
  // RESET INVITATION PAGE
  // ============================================================

  function inviteAnotherMember() {
    setInvitationCreated(
      false
    );

    setInvitationUrl(
      ""
    );

    setSentName(
      ""
    );

    setSentEmail(
      ""
    );

    setSentRole(
      ""
    );

    setCopied(
      false
    );

    setEmailOpened(
      false
    );

    setError("");
  }

  // ============================================================
  // INVITATION CREATED SCREEN
  // ============================================================

  if (invitationCreated) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">

        <div className="max-w-3xl mx-auto">

          {/* BACK */}

          <Link
            href="/app/company/team"
            className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-8"
          >
            ← Back to Team Members
          </Link>

          {/* CARD */}

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

            {/* HEADER */}

            <div className="text-center px-8 pt-10 pb-8">

              <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center text-3xl">
                ✉️
              </div>

              <h1 className="mt-6 text-3xl font-bold text-gray-900">
                Invitation Created
              </h1>

              <p className="mt-2 text-gray-500">
                The invitation is waiting for the team member to accept.
              </p>

            </div>

            {/* DETAILS */}

            <div className="border-t px-8 py-7">

              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
                Invitation Details
              </h2>

              <div className="rounded-xl border bg-gray-50 divide-y">

                {/* NAME */}

                <div className="flex justify-between px-5 py-4">

                  <span className="text-sm text-gray-500">
                    Full Name
                  </span>

                  <span className="font-semibold text-gray-900">
                    {sentName}
                  </span>

                </div>

                {/* EMAIL */}

                <div className="flex justify-between px-5 py-4 gap-5">

                  <span className="text-sm text-gray-500">
                    Email
                  </span>

                  <span className="font-semibold text-gray-900 break-all text-right">
                    {sentEmail}
                  </span>

                </div>

                {/* ROLE */}

                <div className="flex justify-between px-5 py-4">

                  <span className="text-sm text-gray-500">
                    Role
                  </span>

                  <span className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold">
                    {sentRole}
                  </span>

                </div>

                {/* STATUS */}

                <div className="flex justify-between px-5 py-4">

                  <span className="text-sm text-gray-500">
                    Status
                  </span>

                  <span className="inline-flex items-center gap-2 text-yellow-700 font-semibold">

                    <span className="w-2 h-2 rounded-full bg-yellow-500" />

                    Pending

                  </span>

                </div>

              </div>

            </div>

            {/* ==================================================
                INVITATION LINK
            ================================================== */}

            <div className="border-t px-8 py-7">

              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
                Invitation Link
              </h2>

              <p className="text-sm text-gray-600 mb-3">
                Copy the link or open your email application to send the invitation.
              </p>

              {/* LINK */}

              <div className="flex flex-col gap-3">

                <input
                  type="text"
                  value={invitationUrl}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm"
                />

                {/* BUTTONS */}

                <div className="flex flex-col sm:flex-row gap-3">

                  {/* COPY */}

                  <button
                    type="button"
                    onClick={
                      copyInvitationLink
                    }
                    className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-semibold transition"
                  >
                    {copied
                      ? "✓ Copied"
                      : "Copy Link"}
                  </button>

                  {/* SEND EMAIL */}

                  <button
                    type="button"
                    onClick={
                      sendInvitationEmail
                    }
                    className="flex-1 rounded-lg border border-blue-600 bg-white hover:bg-blue-50 text-blue-600 px-6 py-3 font-semibold transition"
                  >
                    ✉️ Send Email
                  </button>

                </div>

              </div>

              {/* COPY MESSAGE */}

              {copied && (
                <p className="mt-3 text-sm text-green-600 font-medium">
                  ✓ Invitation link copied to your clipboard.
                </p>
              )}

              {/* EMAIL MESSAGE */}

              {emailOpened && (
                <p className="mt-3 text-sm text-green-600 font-medium">
                  ✓ Your email application should now open with the invitation message.
                </p>
              )}

            </div>

            {/* ==================================================
                NEXT STEPS
            ================================================== */}

            <div className="px-8 pb-7">

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">

                <p className="font-semibold text-blue-800">
                  What happens next?
                </p>

                <p className="text-sm text-blue-700 mt-2">
                  The team member opens the invitation link, creates an account or signs in, accepts the invitation, and is automatically connected to your company.
                </p>

              </div>

            </div>

            {/* ==================================================
                ACTIONS
            ================================================== */}

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
                  onClick={
                    inviteAnotherMember
                  }
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
            Invite a person to join your company.
          </p>

        </div>

        {/* FORM CARD */}

        <div className="bg-white rounded-2xl shadow-sm border p-8">

          <form
            onSubmit={
              inviteMember
            }
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
                You can copy the invitation link or send it through your email application after creating the invitation.
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
                  ? "Creating Invitation..."
                  : "Create Invitation"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </main>
  );
}