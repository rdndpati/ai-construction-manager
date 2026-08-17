"use client";

import { useEffect, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AcceptInvitationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const invitationId =
    searchParams.get("invitation_id");

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [redirecting, setRedirecting] =
    useState(false);

  // ============================================================
  // START INVITATION FLOW
  // ============================================================

  useEffect(() => {
    if (!invitationId) {
      setError(
        "Invitation ID is missing from this invitation link."
      );

      setLoading(false);

      return;
    }

    acceptInvitation(invitationId);
  }, [invitationId]);

  // ============================================================
  // ACCEPT INVITATION
  // ============================================================

  async function acceptInvitation(
    id: string
  ) {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      // ========================================================
      // 1. CHECK LOGGED-IN USER
      // ========================================================

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      console.log(
        "===================================="
      );

      console.log(
        "ACCEPT INVITATION FLOW"
      );

      console.log(
        "INVITATION ID:",
        id
      );

      console.log(
        "USER:",
        user?.email || "NOT LOGGED IN"
      );

      console.log(
        "===================================="
      );

      // ========================================================
      // 2. USER IS NOT LOGGED IN
      // ========================================================
      //
      // IMPORTANT:
      //
      // Keep invitation_id when sending the user to login.
      //
      // Login will then know this is an invited user and
      // will NOT send them to Create Company.
      // ========================================================

      if (userError || !user) {
        router.replace(
          `/login?invitation_id=${encodeURIComponent(
            id
          )}`
        );

        return;
      }

      // ========================================================
      // 3. ACCEPT INVITATION THROUGH SERVER
      // ========================================================

      const response =
        await fetch(
          "/api/team/accept-invitation",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              invitation_id: id,
            }),
          }
        );

      // ========================================================
      // 4. READ API RESPONSE
      // ========================================================

      let result: any = null;

      try {
        result =
          await response.json();
      } catch {
        result = null;
      }

      console.log(
        "ACCEPT API STATUS:",
        response.status
      );

      console.log(
        "ACCEPT API RESULT:",
        result
      );

      // ========================================================
      // 5. API ERROR
      // ========================================================

      if (!response.ok) {
        setError(
          result?.error ||
            "Unable to accept this invitation."
        );

        setLoading(false);

        return;
      }

      // ========================================================
      // 6. VERIFY SUCCESS RESPONSE
      // ========================================================

      if (!result?.success) {
        setError(
          "The invitation could not be accepted."
        );

        setLoading(false);

        return;
      }

      // ========================================================
      // 7. INVITATION ACCEPTED
      // ========================================================

      console.log(
        "===================================="
      );

      console.log(
        "INVITATION ACCEPTED"
      );

      console.log(
        "COMPANY ID:",
        result.company_id
      );

      console.log(
        "ROLE ID:",
        result.role_id
      );

      console.log(
        "USER ID:",
        result.user_id
      );

      console.log(
        "===================================="
      );

      setMessage(
        "Invitation accepted successfully! You have been added to the company."
      );

      setRedirecting(true);

      // ========================================================
      // 8. GO TO DASHBOARD
      // ========================================================

      setTimeout(() => {
        router.replace(
          "/app/dashboard"
        );

        router.refresh();
      }, 1000);

    } catch (err: any) {
      console.error(
        "ACCEPT INVITATION ERROR:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while accepting the invitation."
      );

      setLoading(false);
    }
  }

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

        <div className="bg-white rounded-2xl shadow-lg border p-10 w-full max-w-md text-center">

          <div className="text-5xl mb-5">
            ✉️
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Accepting Invitation
          </h1>

          <p className="text-gray-500 mt-3">
            Please wait while we connect you to your company.
          </p>

          <div className="mt-6">

            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />

          </div>

        </div>

      </main>
    );
  }

  // ============================================================
  // ERROR SCREEN
  // ============================================================

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

        <div className="bg-white rounded-2xl shadow-lg border p-10 w-full max-w-md">

          <div className="text-center">

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

            {/* ==================================================
                CONTINUE TO LOGIN
            ================================================== */}

            <button
              onClick={() => {
                if (invitationId) {
                  router.push(
                    `/login?invitation_id=${encodeURIComponent(
                      invitationId
                    )}`
                  );
                } else {
                  router.push(
                    "/login"
                  );
                }
              }}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3 font-semibold"
            >
              Continue to Sign In
            </button>

            {/* ==================================================
                BACK TO HOME
            ================================================== */}

            <button
              onClick={() =>
                router.push("/")
              }
              className="mt-3 w-full border border-gray-300 text-gray-700 rounded-xl p-3 font-semibold hover:bg-gray-50"
            >
              Back to Home
            </button>

          </div>

        </div>

      </main>
    );
  }

  // ============================================================
  // SUCCESS SCREEN
  // ============================================================

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

      <div className="bg-white rounded-2xl shadow-lg border p-10 w-full max-w-md text-center">

        <div className="text-5xl mb-5">
          ✅
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Invitation Accepted
        </h1>

        <p className="text-gray-500 mt-3">
          {message}
        </p>

        {redirecting && (
          <div className="mt-6">

            <div className="animate-spin h-7 w-7 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />

            <p className="text-sm text-gray-500 mt-3">
              Taking you to your dashboard...
            </p>

          </div>
        )}

      </div>

    </main>
  );
}