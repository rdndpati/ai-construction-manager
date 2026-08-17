"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
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
  is_owner: boolean;
};

type Invitation = {
  id: string;
  full_name: string | null;
  email: string;
  role_id: string | null;
  company_id: string;
  status: string;
  created_at: string;
  invitation_url: string;
};

export default function CompanyTeamPage() {
  const [members, setMembers] =
    useState<Member[]>([]);

  const [invitations, setInvitations] =
    useState<Invitation[]>([]);

  const [roles, setRoles] =
    useState<Role[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [companyId, setCompanyId] =
    useState<string | null>(null);

  const [updatingRole, setUpdatingRole] =
    useState<string | null>(null);

  const [resending, setResending] =
    useState<string | null>(null);

  const [copiedId, setCopiedId] =
    useState<string | null>(null);

  const loadPage = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        /*
         * Current user
         */

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
            "You are not logged in."
          );
          return;
        }

        /*
         * Profile
         */

        const {
          data: profile,
          error: profileError,
        } =
          await supabase
            .from("profiles")
            .select(
              "id, full_name, role_id, company_id, created_at, is_owner"
            )
            .eq("id", user.id)
            .single();

        if (profileError) {
          setError(
            profileError.message
          );
          return;
        }

        if (!profile?.company_id) {
          setError(
            "Your account is not connected to a company."
          );
          return;
        }

        setCompanyId(
          profile.company_id
        );

        /*
         * Check owner/admin
         */

        let isAdmin = false;

        if (profile.role_id) {
          const {
            data: currentRole,
          } =
            await supabase
              .from("roles")
              .select(
                "id, name"
              )
              .eq(
                "id",
                profile.role_id
              )
              .maybeSingle();

          isAdmin =
            currentRole?.name
              ?.trim()
              .toLowerCase() ===
            "admin";
        }

        if (
          profile.is_owner !== true &&
          !isAdmin
        ) {
          window.location.href =
            "/app/projects";
          return;
        }

        /*
         * Roles
         */

        const {
          data: rolesData,
          error: rolesError,
        } =
          await supabase
            .from("roles")
            .select(
              "id, name"
            )
            .order("name");

        if (rolesError) {
          setError(
            rolesError.message
          );
          return;
        }

        setRoles(
          rolesData || []
        );

        /*
         * Active members ONLY
         */

        const {
          data: membersData,
          error: membersError,
        } =
          await supabase
            .from("profiles")
            .select(
              "id, full_name, role_id, company_id, created_at, is_owner"
            )
            .eq(
              "company_id",
              profile.company_id
            )
            .order(
              "created_at",
              {
                ascending: true,
              }
            );

        if (membersError) {
          setError(
            membersError.message
          );
          return;
        }

        setMembers(
          membersData || []
        );

        /*
         * Pending invitations
         *
         * Loaded from server API because
         * invitations are managed securely
         * with the service role.
         */

        const invitationResponse =
          await fetch(
            "/api/team/invite",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const invitationResult =
          await invitationResponse.json();

        if (
          !invitationResponse.ok
        ) {
          setError(
            invitationResult?.error ||
              "Unable to load invitations."
          );
          return;
        }

        setInvitations(
          (invitationResult?.invitations ||
            []
          ).filter(
            (item: Invitation) =>
              item.status ===
              "Pending"
          )
        );
      } catch (err: any) {
        console.error(
          "TEAM PAGE ERROR:",
          err
        );

        setError(
          err?.message ||
            "Unable to load the team."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  /*
   * Refresh when returning to page
   */

  useEffect(() => {
    function handleFocus() {
      loadPage();
    }

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [loadPage]);

  /*
   * Role name
   */

  function getRoleName(
    roleId: string | null
  ) {
    if (!roleId) {
      return "No Role Assigned";
    }

    return (
      roles.find(
        (role) =>
          role.id === roleId
      )?.name ||
      "No Role Assigned"
    );
  }

  /*
   * Update role
   */

  async function updateRole(
    memberId: string,
    roleId: string
  ) {
    if (!companyId) {
      return;
    }

    setUpdatingRole(memberId);

    try {
      const {
        error: updateError,
      } =
        await supabase
          .from("profiles")
          .update({
            role_id: roleId,
          })
          .eq(
            "id",
            memberId
          )
          .eq(
            "company_id",
            companyId
          );

      if (updateError) {
        alert(
          updateError.message
        );
        return;
      }

      await loadPage();
    } finally {
      setUpdatingRole(null);
    }
  }

  /*
   * Copy / resend invitation
   */

  async function resendInvitation(
    invitationId: string
  ) {
    setResending(
      invitationId
    );

    try {
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
              action: "resend",
              invitation_id:
                invitationId,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        alert(
          result?.error ||
            "Unable to resend invitation."
        );
        return;
      }

      await navigator.clipboard.writeText(
        result.invitation_url
      );

      setCopiedId(
        invitationId
      );

      setTimeout(() => {
        setCopiedId(null);
      }, 2500);
    } catch (err) {
      console.error(
        "RESEND ERROR:",
        err
      );

      alert(
        "Unable to copy the invitation link."
      );
    } finally {
      setResending(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border p-10 text-center">
            Loading team members...
          </div>
        </div>
      </main>
    );
  }

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
              className="mt-5 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const totalMembers =
    members.length +
    invitations.length;

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
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
          >
            + Add Team Member
          </Link>

        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

          <div className="bg-white border rounded-2xl p-6">
            <p className="text-sm text-gray-500">
              Total Members
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {totalMembers}
            </p>
          </div>

          <div className="bg-white border rounded-2xl p-6">
            <p className="text-sm text-gray-500">
              Active Members
            </p>

            <p className="text-3xl font-bold text-green-600 mt-2">
              {members.length}
            </p>
          </div>

          <div className="bg-white border rounded-2xl p-6">
            <p className="text-sm text-gray-500">
              Pending Invitations
            </p>

            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {invitations.length}
            </p>
          </div>

          <div className="bg-white border rounded-2xl p-6">
            <p className="text-sm text-gray-500">
              Company
            </p>

            <p className="text-xs font-mono text-gray-700 mt-3 truncate">
              {companyId}
            </p>
          </div>

        </div>

        {/* ACTIVE MEMBERS */}

        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden mb-8">

          <div className="px-6 py-5 border-b flex items-center justify-between">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Active Members
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Users who have accepted their invitation.
              </p>
            </div>

            <button
              onClick={loadPage}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm"
            >
              Refresh
            </button>

          </div>

          {members.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No active members yet.
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

                  {members.map(
                    (member) => (
                      <tr
                        key={member.id}
                        className="border-b last:border-b-0"
                      >

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                              {(member.full_name ||
                                "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-semibold text-gray-900">
                                {member.full_name ||
                                  "No Name"}
                              </p>

                              <p className="text-xs text-gray-400">
                                Team Member
                              </p>
                            </div>

                          </div>

                        </td>

                        <td className="px-6 py-5">

                          {member.is_owner ? (
                            <span className="inline-flex px-3 py-2 rounded-lg bg-purple-100 text-purple-800 font-semibold text-sm">
                              👑 Owner
                            </span>
                          ) : (
                            <select
                              value={
                                member.role_id ||
                                ""
                              }
                              disabled={
                                updatingRole ===
                                member.id
                              }
                              onChange={(e) =>
                                updateRole(
                                  member.id,
                                  e.target.value
                                )
                              }
                              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm min-w-[180px]"
                            >
                              <option value="">
                                No Role Assigned
                              </option>

                              {roles.map(
                                (role) => (
                                  <option
                                    key={
                                      role.id
                                    }
                                    value={
                                      role.id
                                    }
                                  >
                                    {role.name}
                                  </option>
                                )
                              )}
                            </select>
                          )}

                        </td>

                        <td className="px-6 py-5">

                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Active
                          </span>

                        </td>

                        <td className="px-6 py-5">

                          <Link
                            href={`/app/company/team/${member.id}`}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                          >
                            Edit
                          </Link>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* PENDING INVITATIONS */}

        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b">

            <h2 className="text-xl font-bold text-gray-900">
              Pending Invitations
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              People who have been invited but have not joined yet.
            </p>

          </div>

          {invitations.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No pending invitations.
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
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {invitations.map(
                    (invitation) => (
                      <tr
                        key={
                          invitation.id
                        }
                        className="border-b last:border-b-0"
                      >

                        <td className="px-6 py-5">

                          <p className="font-semibold text-gray-900">
                            {invitation.full_name ||
                              "Invited User"}
                          </p>

                          <p className="text-sm text-gray-500">
                            {invitation.email}
                          </p>

                        </td>

                        <td className="px-6 py-5">

                          <span className="inline-flex px-3 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold text-sm">
                            {getRoleName(
                              invitation.role_id
                            )}
                          </span>

                        </td>

                        <td className="px-6 py-5">

                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-700 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-yellow-500" />
                            Pending
                          </span>

                        </td>

                        <td className="px-6 py-5">

                          <button
                            onClick={() =>
                              resendInvitation(
                                invitation.id
                              )
                            }
                            disabled={
                              resending ===
                              invitation.id
                            }
                            className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                          >
                            {resending ===
                            invitation.id
                              ? "Preparing..."
                              : copiedId ===
                                invitation.id
                              ? "✓ Link Copied"
                              : "Resend / Copy Link"}
                          </button>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </main>
  );
}