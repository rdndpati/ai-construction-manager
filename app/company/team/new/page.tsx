"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

   const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();

if (userError || !user) {
  setError("You are not logged in.");
  setLoading(false);
  return;
}
    if (!user) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    const { data: profiles, error: profileError } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id);

console.log("User:", user);
console.log("Profiles:", profiles);
console.log("Profile Error:", profileError);

const profile = profiles?.[0];

if (!profile || !profile.company_id) {
  setError("Company not found.");
  setLoading(false);
  return;
}

   // Look up the selected role
const { data: roleData, error: roleError } = await supabase
  .from("roles")
  .select("*");

console.log("All Roles:", roleData);
console.log("Role Error:", roleError);

const roleId = roleData?.find((r: any) => r.name === role)?.id;

console.log("Selected Role:", role);
console.log("Role ID:", roleId);

if (roleError || !roleId) {
  setError("Role not found.");
  setLoading(false);
  return;
}

// Call the secure API
const response = await fetch("/api/team/invite", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    full_name: fullName,
    email,
    role_id: roleId,
    company_id: profile.company_id,
    invited_by: user.id,
  }),
});

const result = await response.json();

if (!response.ok) {
  setError(result.error || "Failed to send invitation.");
  setLoading(false);
  return;
}

setSuccess("Invitation email sent successfully.");

setFullName("");
setEmail("");
setRole("Project Engineer");

setLoading(false);


  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">
        Invite Team Member
      </h1>

      <form onSubmit={inviteMember} className="space-y-5">

        <input
          className="w-full border rounded-lg p-3"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <input
          className="w-full border rounded-lg p-3"
          placeholder="Email Address"
          type="email"
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

        {error && (
          <div className="text-red-600">{error}</div>
        )}

        {success && (
          <div className="text-green-600">{success}</div>
        )}

        <button
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg w-full"
        >
          {loading ? "Inviting..." : "Send Invitation"}
        </button>

      </form>
    </main>
  );
}