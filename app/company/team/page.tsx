"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function CompanyTeamPage() {
  const [members, setMembers] = useState<any[]>([]);
const [roles, setRoles] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

  useEffect(() => {
  loadRoles();
  loadMembers();
}, []);
async function loadRoles() {
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .order("name");

  console.log("Roles:", data);
  console.log("Role Error:", error);

  setRoles(data || []);
}

  async function loadMembers() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("company_id")
  .eq("id", user.id)
  .single();

console.log(profile);
console.log(profileError);

    if (!profile?.company_id) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at");
    console.log(data);
    console.log("Members:", data);

    setMembers(data || []);
    setLoading(false);
  }
  async function updateRole(profileId: string, roleId: string) {
  console.log("Updating:", profileId);
  console.log("Role:", roleId);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      role_id: roleId,
    })
    .eq("id", profileId)
    .select();

  console.log("Update Data:", data);
  console.log("Update Error:", error);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Role updated!");

  loadMembers();
}

  return (
    <main className="p-8">

      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-4xl font-bold">
            Team Members
          </h1>

          <p className="text-gray-500">
            Manage users in your company.
          </p>
        </div>

        <Link
          href="/company/team/new"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          + Add User
        </Link>

      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="text-left p-4">Name</th>

              <th className="text-left p-4">Email</th>

              <th className="text-left p-4">Role</th>

              <th className="text-left p-4">Status</th>

              <th className="text-left p-4">Actions</th>

            </tr>

          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && members.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  No team members.
                </td>
              </tr>
            )}

            {members.map((member) => (
              <tr key={member.id} className="border-t">

                <td className="p-4">
  {member.full_name || member.name || "No Name"}
</td>

                <td className="p-4">
                  {member.email}
                </td>

                <td className="p-4">
  <select
  value={member.role_id ?? ""}
  onChange={(e) => {
    console.log("Selected:", e.target.value);
    updateRole(member.id, e.target.value);
  }}
  className="border rounded px-2 py-1"
>
  <option value="">Select Role</option>

  {roles.map((role) => (
    <option key={role.id} value={role.id}>
      {role.name}
    </option>
  ))}
</select>
</td>
                <td className="p-4">
                  Active
                </td>

                <td className="p-4">
                  <Link
  href={`/company/team/${member.id}`}
  className="text-blue-600"
>
  Edit
</Link>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}