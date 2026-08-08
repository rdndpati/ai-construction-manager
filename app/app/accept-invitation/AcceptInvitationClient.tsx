"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AcceptInvitationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const invitationId = searchParams.get("invitation_id");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!invitationId) {
      setError("Invitation ID is missing from this invitation link.");
      setLoading(false);
      return;
    }

    acceptInvitation();
  }, [invitationId]);

  async function acceptInvitation() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(
          "Your invitation link is valid, but you are not logged in."
        );
        setLoading(false);
        return;
      }

      const response = await fetch(
        "/api/team/accept-invitation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invitation_id: invitationId,
          }),
        }
      );

      const result = await response.json();

      console.log("ACCEPT API STATUS:", response.status);
      console.log("ACCEPT API RESULT:", result);

      if (!response.ok) {
        setError(
          result?.error ||
            "Unable to accept this invitation."
        );
        setLoading(false);
        return;
      }

      setMessage(
        "Invitation accepted successfully! Redirecting to your dashboard..."
      );

      setTimeout(() => {
        router.replace("/app/dashboard");
        router.refresh();
      }, 1500);

    } catch (err: any) {
      console.error("ACCEPT INVITATION ERROR:", err);

      setError(
        err?.message ||
          "Something went wrong while accepting the invitation."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg border p-10 w-full max-w-md text-center">
          <div className="text-5xl mb-5">✉️</div>

          <h1 className="text-2xl font-bold text-gray-900">
            Accepting Invitation
          </h1>

          <p className="text-gray-500 mt-3">
            Please wait while we connect you to the company.
          </p>

          <div className="mt-6">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg border p-10 w-full max-w-md">
          <div className="text-center">
            <div className="text-5xl mb-5">⚠️</div>

            <h1 className="text-2xl font-bold text-gray-900">
              Invitation Problem
            </h1>

            <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600">
                {error}
              </p>
            </div>

            <button
              onClick={() => router.push("/login")}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3 font-semibold"
            >
              Go to Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg border p-10 w-full max-w-md text-center">
        <div className="text-5xl mb-5">✅</div>

        <h1 className="text-2xl font-bold text-gray-900">
          Invitation Accepted
        </h1>

        <p className="text-gray-500 mt-3">
          {message}
        </p>
      </div>
    </main>
  );
}