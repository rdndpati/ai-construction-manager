"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

const INVITATION_STORAGE_KEY =
  "constructiq_invitation_id";

type Invitation = {
  id: string;
  email: string;
  full_name: string | null;
  company_id: string;
  role_id: string;
  status: string;
};

export default function AcceptInvitationClient() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const invitationId =
    searchParams.get(
      "invitation_id"
    );

  const [loading, setLoading] =
    useState(true);

  const [invitation, setInvitation] =
    useState<Invitation | null>(
      null
    );

  const [error, setError] =
    useState("");

  // ============================================================
  // SAVE INVITATION ID
  // ============================================================

  function saveInvitationId(
    id: string
  ) {
    try {
      sessionStorage.setItem(
        INVITATION_STORAGE_KEY,
        id
      );

      localStorage.setItem(
        INVITATION_STORAGE_KEY,
        id
      );
    } catch (error) {
      console.error(
        "Unable to save invitation ID:",
        error
      );
    }
  }

  // ============================================================
  // REMOVE INVITATION ID
  // ============================================================

  function removeInvitationId() {
    try {
      sessionStorage.removeItem(
        INVITATION_STORAGE_KEY
      );

      localStorage.removeItem(
        INVITATION_STORAGE_KEY
      );
    } catch {}
  }

  // ============================================================
  // LOAD INVITATION
  // ============================================================

  useEffect(() => {
    if (!invitationId) {
      setError(
        "Invitation ID is missing from this link."
      );

      setLoading(false);

      return;
    }

    saveInvitationId(
      invitationId
    );

    loadInvitation(
      invitationId
    );
  }, [invitationId]);

  // ============================================================
  // LOAD INVITATION
  // ============================================================

  async function loadInvitation(
    id: string
  ) {
    try {
      setLoading(true);
      setError("");

      console.log(
        "===================================="
      );

      console.log(
        "LOAD INVITATION"
      );

      console.log(
        "INVITATION ID:",
        id
      );

      console.log(
        "===================================="
      );

      const response =
        await fetch(
          `/api/team/invite?invitation_id=${encodeURIComponent(
            id
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      let result: any = null;

      try {
        result =
          await response.json();
      } catch {
        result = null;
      }

      console.log(
        "INVITATION RESULT:",
        result
      );

      if (!response.ok) {
        setError(
          result?.error ||
            "This invitation could not be found."
        );

        return;
      }

      const foundInvitation =
        result?.invitation;

      if (
        !foundInvitation
      ) {
        setError(
          "This invitation could not be found."
        );

        return;
      }

      if (
        foundInvitation.status !==
        "Pending"
      ) {
        setError(
          "This invitation has already been accepted or is no longer available."
        );

        return;
      }

      setInvitation(
        foundInvitation
      );

      // ========================================================
      // IMPORTANT
      //
      // DO NOT AUTOMATICALLY ACCEPT THE INVITATION.
      //
      // Even if Supabase has authenticated the invited user,
      // we want the user to go to signup and set their password.
      // ========================================================

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      console.log(
        "CURRENT USER:",
        user?.email ||
          "NOT LOGGED IN"
      );

      if (user) {
        const currentEmail =
          user.email
            ?.trim()
            .toLowerCase();

        const invitedEmail =
          foundInvitation.email
            ?.trim()
            .toLowerCase();

        console.log(
          "CURRENT EMAIL:",
          currentEmail
        );

        console.log(
          "INVITED EMAIL:",
          invitedEmail
        );

        if (
          currentEmail ===
          invitedEmail
        ) {
          console.log(
            "INVITED USER SESSION FOUND."
          );

          console.log(
            "WAITING FOR USER TO SET PASSWORD."
          );
        }
      }

    } catch (err: any) {
      console.error(
        "LOAD INVITATION ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to load this invitation."
      );

    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // CREATE ACCOUNT
  // ============================================================

  function createAccount() {
    if (!invitationId) {
      return;
    }

    saveInvitationId(
      invitationId
    );

    router.push(
      `/signup?invitation_id=${encodeURIComponent(
        invitationId
      )}`
    );
  }

  // ============================================================
  // EXISTING ACCOUNT
  // ============================================================

  function existingAccount() {
    if (!invitationId) {
      router.push(
        "/login"
      );

      return;
    }

    saveInvitationId(
      invitationId
    );

    router.push(
      `/login?invitation_id=${encodeURIComponent(
        invitationId
      )}`
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

        <div className="bg-white rounded-2xl shadow-lg border p-10 w-full max-w-md text-center">

          <div className="text-5xl mb-5">
            ✉️
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Loading Invitation
          </h1>

          <p className="text-gray-500 mt-3">
            Please wait...
          </p>

          <div className="mt-6">

            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />

          </div>

        </div>

      </main>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

        <div className="bg-white rounded-2xl shadow-lg border p-10 w-full max-w-md text-center">

          <div className="text-5xl mb-5">
            ⚠️
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Invitation Problem
          </h1>

          <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4">

            <p className="text-red-600 text-sm">
              {error}
            </p>

          </div>

          <button
            onClick={() =>
              router.push("/")
            }
            className="mt-6 w-full border border-gray-300 text-gray-700 rounded-xl p-3 font-semibold hover:bg-gray-50"
          >
            Back to Home
          </button>

        </div>

      </main>
    );
  }

  // ============================================================
  // INVITATION PAGE
  // ============================================================

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          {/* ICON */}

          <div className="text-center">

            <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl">
              ✉️
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mt-6">
              You&apos;re Invited!
            </h1>

            <p className="text-gray-500 mt-2">
              You have been invited to join a ConstructIQ company.
            </p>

          </div>

          {/* DETAILS */}

          <div className="mt-8 rounded-xl border bg-gray-50 p-5">

            <div className="mb-4">

              <p className="text-xs font-semibold uppercase text-gray-500">
                Invited Name
              </p>

              <p className="text-lg font-semibold text-gray-900 mt-1">
                {invitation?.full_name ||
                  "Team Member"}
              </p>

            </div>

            <div>

              <p className="text-xs font-semibold uppercase text-gray-500">
                Invitation Email
              </p>

              <p className="text-sm text-gray-700 mt-1 break-all">
                {invitation?.email}
              </p>

            </div>

          </div>

          {/* CREATE ACCOUNT */}

          <button
            onClick={
              createAccount
            }
            className="mt-7 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-3.5 font-semibold transition"
          >
            Create Account & Join Company
          </button>

          {/* EXISTING ACCOUNT */}

          <button
            onClick={
              existingAccount
            }
            className="mt-3 w-full border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl px-5 py-3.5 font-semibold transition"
          >
            I Already Have an Account
          </button>

          {/* NOTE */}

          <div className="mt-6 rounded-xl bg-blue-50 border border-blue-100 p-4">

            <p className="text-sm text-blue-800">
              <strong>
                New to ConstructIQ?
              </strong>{" "}
              Create your account above and set your password. You will then automatically be connected to the company that invited you.
            </p>

          </div>

        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          © 2026 ConstructIQ
        </p>

      </div>

    </main>
  );
}