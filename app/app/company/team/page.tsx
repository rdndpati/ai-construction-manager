"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Role = {
  id: string;
  name: string;
};

type Member = {
  id: string;
  full_name: string | null;
  role_id: string | null;
  company_id: string | null;
  created_at: string;
};

export default function CompanyTeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);

  const [companyId, setCompanyId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    setError("");

    try {
      // =====================================================
      // 1. Get logged-in user
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log("USER:", user);
      console.log("USER ERROR:", userError);

      if (userError || !user) {
        setError("You are not logged in.");
        return;
      }

      // =====================================================
      // 2. Get user's company
      // =====================================================

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      console.log("PROFILE:", profile);
      console.log("PROFILE ERROR:", profileError);

      if (profileError) {
        setError(
          `Unable to load company information: ${profileError.message}`
        );
        return;
      }

      if (!profile?.company_id) {
        setError(
          "Your account is not connected to a company."
        );
        return;
      }

      setCompanyId(profile.company_id);

      console.log("====================================");
      console.log("TEAM SECURITY CHECK");
      console.log("USER ID:", user.id);
      console.log("USER EMAIL:", user.email);
      console.log("COMPANY ID:", profile.company_id);
      console.log("====================================");

      // =====================================================
      // 3. Load roles
      // =====================================================

      const {
        data: rolesData,
        error: rolesError,
      } = await supabase
        .from("roles")
        .select("id, name")
        .order("name");

      console.log("ROLES:", rolesData);
      console.log("ROLES ERROR:", rolesError);

      if (rolesError) {
        setError(
          `Unable to load roles: ${rolesError.message}`
        );
        return;
      }

      setRoles(rolesData || []);
      setRolesLoading(false);

      // =====================================================
      // 4. Load ONLY this company's members
      // =====================================================

      const {
        data: membersData,
        error: membersError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, role_id, company_id, created_at"
        )
        .eq("company_id", profile.company_id)
        .order("created_at", {
          ascending: true,
        });

      console.log("MEMBERS DATA:", membersData);
      console.log("MEMBERS ERROR:", membersError);

      if (membersError) {
        console.error(
          "MEMBERS QUERY FAILED:",
          membersError
        );

        setError(
          `Unable to load team members: ${membersError.message}`
        );

        return;
      }

      setMembers(membersData || []);
    } catch (err: any) {
      console.error(
        "===================================="
      );
      console.error("TEAM PAGE ERROR");
      console.error("ERROR:", err);
      console.error("MESSAGE:", err?.message);
      console.error("DETAILS:", err?.details);
      console.error("HINT:", err?.hint);
      console.error(
        "===================================="
      );

      setError(
        err?.message ||
          "Something went wrong while loading the team."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // UPDATE ROLE
  // =====================================================

  async function updateRole(
    profileId: string,
    roleId: string
  ) {
    if (!roleId || !companyId) {
      return;
    }

    setUpdatingRole(profileId);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in again.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          role_id: roleId,
        })
        .eq("id", profileId)
        .eq("company_id", companyId);

      if (error) {
        console.error(
          "ROLE UPDATE ERROR:",
          error
        );

        alert(error.message);
        return;
      }

      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.id === profileId
            ? {
                ...member,
                role_id: roleId,
              }
            : member
        )
      );
    } finally {
      setUpdatingRole(null);
    }
  }

  function getRoleName(roleId: string | null) {
    if (!roleId) {
      return "No Role Assigned";
    }

    const role = roles.find(
      (item) => item.id === roleId
    );

    return role?.name || "No Role Assigned";
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border p-10 text-center">
            <p className="text-gray-500">
              Loading team members...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">

          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">

            <h1 className="text-2xl font-bold text-red-700">
              Team Members
            </h1>

            <p className="mt-2 text-red-600">
              {error}
            </p>

            <button
              onClick={loadPage}
              className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold"
            >
              Try Again
            </button>

          </div>

        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-gray-50 p-8">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Team Members
            </h1>

            <p className="text-gray-500 mt-2">
              Manage users, roles, and access for your company.
            </p>
          </div>

          <Link
            href="/app/company/team/new"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm"
          >
            + Add Team Member
          </Link>

        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Members
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {members.length}
            </p>
          </div>

          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Active Members
            </p>

            <p className="text-3xl font-bold text-green-600 mt-2">
              {members.length}
            </p>
          </div>

          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Company
            </p>

            <p className="text-sm font-mono text-gray-700 mt-3 truncate">
              {companyId}
            </p>
          </div>

        </div>

        {/* TEAM TABLE */}

        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Company Team
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Members currently assigned to your company.
                </p>
              </div>

              <button
                onClick={loadPage}
                className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Refresh
              </button>

            </div>

          </div>

          {members.length === 0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl mb-4">
                👥
              </div>

              <h3 className="text-xl font-bold text-gray-900">
                No team members yet
              </h3>

              <p className="text-gray-500 mt-2">
                Invite your first team member to start collaborating.
              </p>

              <Link
                href="/app/company/team/new"
                className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
              >
                + Invite Team Member
              </Link>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-50 border-b">

                  <tr>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      Member
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      Role
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {members.map((member) => (

                    <tr
                      key={member.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >

                      {/* MEMBER */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            {(member.full_name || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <p className="font-semibold text-gray-900">
                              {member.full_name || "No Name"}
                            </p>

                            <p className="text-xs text-gray-400">
                              Team Member
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* ROLE */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <select
                            value={member.role_id ?? ""}
                            disabled={
                              updatingRole === member.id ||
                              rolesLoading
                            }
                            onChange={(e) =>
                              updateRole(
                                member.id,
                                e.target.value
                              )
                            }
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm min-w-[180px] focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                          >

                            <option value="">
                              No Role Assigned
                            </option>

                            {roles.map((role) => (
                              <option
                                key={role.id}
                                value={role.id}
                              >
                                {role.name}
                              </option>
                            ))}

                          </select>

                          {updatingRole === member.id && (
                            <span className="text-xs text-gray-500">
                              Saving...
                            </span>
                          )}

                        </div>

                        <p className="text-xs text-gray-400 mt-1">
                          {getRoleName(member.role_id)}
                        </p>

                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-5">

                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium">

                          <span className="w-2 h-2 rounded-full bg-green-500" />

                          Active

                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-5">

                        <Link
                          href={`/app/company/team/${member.id}`}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                        >
                          Edit
                        </Link>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

    </main>
  );
}