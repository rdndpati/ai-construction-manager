"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <main className="max-w-xl mx-auto p-10">
        <h1 className="text-3xl font-bold">Invalid Invitation</h1>
        <p className="mt-4">Invitation token is missing.</p>
      </main>
    );
  }

  async function acceptInvitation() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first.");
      setLoading(false);
      return;
    }

    const { data: invitation, error: inviteError } = await supabase
      .from("invitations")
      .select("*")
      .eq("id", token)
      .single();

    console.log("Invitation:", invitation);
    console.log("Invite Error:", inviteError);

    if (inviteError || !invitation) {
      alert("Invitation not found.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        company_id: invitation.company_id,
        role_id: invitation.role_id,
      })
      .eq("id", user.id);

    console.log("Profile Error:", profileError);

    if (profileError) {
      alert(profileError.message);
      setLoading(false);
      return;
    }

    await supabase
      .from("invitations")
      .update({
        status: "Accepted",
      })
      .eq("id", invitation.id);

    alert("Welcome to the company!");

    router.push("/company/team");
  }

  return (
    <main className="max-w-xl mx-auto p-10">
      <h1 className="text-4xl font-bold mb-8">
        Join Company
      </h1>

      <div className="bg-white rounded-xl shadow p-8">
        <p className="mb-4">
          Invitation Token
        </p>

        <div className="bg-gray-100 rounded p-4 break-all">
          {token}
        </div>

        <button
          onClick={acceptInvitation}
          disabled={loading}
          className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          {loading ? "Joining..." : "Accept Invitation"}
        </button>
      </div>
    </main>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <AcceptInvitationContent />
    </Suspense>
  );
}