"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Role = {
  id: string;
  name: string;
  description?: string | null;
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    try {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("roles")
        .select("*")
        .order("name");

      if (error) {
        console.error(
          "Error loading roles:",
          error
        );

        setRoles([]);
        return;
      }

      setRoles(
        (data as Role[]) ?? []
      );
    } catch (error) {
      console.error(
        "LOAD ROLES ERROR:",
        error
      );

      setRoles([]);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // ROLE DESCRIPTION
  // ============================================================

  function getRoleDescription(
    roleName: string
  ) {
    const name =
      roleName.toLowerCase();

    if (name === "admin") {
      return "Full company administration and project access.";
    }

    if (name === "project manager") {
      return "Manage assigned projects, including project cost and financial activities.";
    }

    if (name === "project controls") {
      return "Manage cost management, budget, commitments, actual costs, forecasts, and cost reporting for assigned projects.";
    }

    if (name === "project engineer") {
      return "Engineering and project-level access for assigned projects.";
    }

    if (name === "engineer of record") {
      return "Engineering review and project access for assigned projects.";
    }

    if (name === "client") {
      return "View project information for assigned projects.";
    }

    if (name === "qa/qc") {
      return "Quality assurance and quality control access for assigned projects.";
    }

    return "Company role with permissions controlled by the administrator.";
  }


  // ============================================================
  // COST MANAGEMENT ACCESS LABEL
  // ============================================================

  function getCostManagementAccess(
    roleName: string
  ) {
    const name =
      roleName.toLowerCase();

    if (
      name === "admin"
    ) {
      return {
        label: "Full Access",
        className:
          "bg-green-100 text-green-700",
      };
    }

    if (
      name === "project manager"
    ) {
      return {
        label: "Full Access",
        className:
          "bg-green-100 text-green-700",
      };
    }

    if (
      name === "project controls"
    ) {
      return {
        label: "Full Access",
        className:
          "bg-green-100 text-green-700",
      };
    }

    if (
      name === "project engineer"
    ) {
      return {
        label: "Limited Access",
        className:
          "bg-blue-100 text-blue-700",
      };
    }

    if (
      name === "client" ||
      name === "engineer of record"
    ) {
      return {
        label: "View Only",
        className:
          "bg-gray-100 text-gray-700",
      };
    }

    if (
      name === "qa/qc"
    ) {
      return {
        label: "No Access",
        className:
          "bg-red-100 text-red-700",
      };
    }

    return {
      label: "Configure",
      className:
        "bg-yellow-100 text-yellow-700",
    };
  }


  return (
    <main className="p-8 bg-gray-50 min-h-screen">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>

          <h1 className="text-4xl font-bold text-gray-900">
            Roles & Permissions
          </h1>

          <p className="text-gray-500 mt-2">
            Manage what each role can do and control
            project access separately for each team member.
          </p>

        </div>


        <div className="flex gap-3">

          <button
            onClick={loadRoles}
            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-xl font-semibold"
          >
            ↻ Refresh
          </button>

          <Link
            href="/app/company/project-access"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
          >
            Project Access
          </Link>

        </div>

      </div>


      {/* ======================================================
          IMPORTANT INFORMATION
      ====================================================== */}

      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-5">

        <h2 className="font-semibold text-blue-900 text-lg">
          Roles vs. Project Access
        </h2>

        <p className="text-blue-800 mt-2 text-sm leading-6">
          A role controls what a team member is allowed to
          do. Project Access controls which projects that
          team member can access.
        </p>


        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ROLE */}

          <div className="bg-white rounded-lg p-4 border border-blue-100">

            <div className="flex items-center gap-2">

              <div className="text-xl">
                🔐
              </div>

              <p className="font-semibold text-gray-900">
                Role & Permissions
              </p>

            </div>

            <p className="text-sm text-gray-500 mt-2 leading-5">
              Determines whether a user can view, create,
              edit, delete, approve, or manage information.
            </p>

            <p className="text-xs text-blue-600 mt-3 font-medium">
              Example: Project Controls → Cost Management
            </p>

          </div>


          {/* PROJECT ACCESS */}

          <div className="bg-white rounded-lg p-4 border border-blue-100">

            <div className="flex items-center gap-2">

              <div className="text-xl">
                📁
              </div>

              <p className="font-semibold text-gray-900">
                Project Access
              </p>

            </div>

            <p className="text-sm text-gray-500 mt-2 leading-5">
              Determines which individual projects a team
              member can see and access.
            </p>

            <p className="text-xs text-blue-600 mt-3 font-medium">
              Example: John → Hillsboro Solar only
            </p>

          </div>

        </div>

      </div>


      {/* ======================================================
          ACCESS RULE
      ====================================================== */}

      <div className="mb-8 bg-white border rounded-xl p-5 shadow-sm">

        <h2 className="text-lg font-bold text-gray-900">
          Access Rule
        </h2>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* OWNER */}

          <div className="border rounded-lg p-4">

            <div className="font-semibold text-gray-900">
              👑 Owner
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Full access to all company projects and
              modules.
            </p>

          </div>


          {/* ADMIN */}

          <div className="border rounded-lg p-4">

            <div className="font-semibold text-gray-900">
              🛡️ Admin
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Full company access. Admin does not need
              individual project assignments.
            </p>

          </div>


          {/* OTHER USERS */}

          <div className="border rounded-lg p-4">

            <div className="font-semibold text-gray-900">
              👤 Other Roles
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Access is based on both role permissions
              and assigned projects.
            </p>

          </div>

        </div>

      </div>


      {/* ======================================================
          ROLES TABLE
      ====================================================== */}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

        <div className="px-6 py-5 border-b">

          <h2 className="text-xl font-bold text-gray-900">
            Company Roles
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Configure permissions for each role.
            Project assignments are managed separately.
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-100 border-b">

              <tr>

                <th className="text-left p-4">
                  Role
                </th>

                <th className="text-left p-4">
                  Description
                </th>

                <th className="text-left p-4">
                  Cost Management
                </th>

                <th className="text-left p-4">
                  Project Access
                </th>

                <th className="text-left p-4">
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {/* LOADING */}

              {loading && (

                <tr>

                  <td
                    colSpan={5}
                    className="p-10 text-center text-gray-500"
                  >
                    Loading roles...
                  </td>

                </tr>

              )}


              {/* EMPTY */}

              {!loading &&
                roles.length === 0 && (

                  <tr>

                    <td
                      colSpan={5}
                      className="p-10 text-center text-gray-500"
                    >

                      <div className="text-4xl mb-3">
                        👥
                      </div>

                      <p className="font-semibold">
                        No roles found
                      </p>

                      <p className="text-sm mt-1">
                        Create roles before assigning
                        permissions.
                      </p>

                    </td>

                  </tr>

                )}


              {/* ROLES */}

              {!loading &&
                roles.map((role) => {

                  const costAccess =
                    getCostManagementAccess(
                      role.name
                    );

                  return (

                    <tr
                      key={role.id}
                      className="border-t hover:bg-gray-50"
                    >

                      {/* ROLE */}

                      <td className="p-4">

                        <div className="font-semibold text-gray-900">
                          {role.name}
                        </div>

                      </td>


                      {/* DESCRIPTION */}

                      <td className="p-4 max-w-md">

                        <p className="text-sm text-gray-600">
                          {role.description ||
                            getRoleDescription(
                              role.name
                            )}
                        </p>

                      </td>


                      {/* COST MANAGEMENT */}

                      <td className="p-4">

                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${costAccess.className}`}
                        >
                          {costAccess.label}
                        </span>

                      </td>


                      {/* PROJECT ACCESS */}

                      <td className="p-4">

                        {role.name
                          .toLowerCase() ===
                          "admin" ? (

                          <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 px-3 py-1 text-sm font-medium">
                            All Company Projects
                          </span>

                        ) : (

                          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-sm font-medium">
                            Assigned Per User
                          </span>

                        )}

                      </td>


                      {/* ACTION */}

                      <td className="p-4">

                        <Link
                          href={`/app/company/roles/${role.id}`}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Edit Permissions →
                        </Link>

                      </td>

                    </tr>

                  );

                })}

            </tbody>

          </table>

        </div>

      </div>


      {/* ======================================================
          PROJECT CONTROLS INFORMATION
      ====================================================== */}

      <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">

        <div className="flex items-start gap-4">

          <div className="text-2xl">
            📊
          </div>

          <div>

            <h2 className="text-lg font-bold text-purple-900">
              Project Controls
            </h2>

            <p className="text-sm text-purple-800 mt-2 leading-6">
              Project Controls is intended to manage
              project cost information such as budgets,
              commitments, actual costs, forecasts,
              change orders, cost reports, and earned value
              for assigned projects.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">

              {[
                "Budget",
                "Commitments",
                "Actual Costs",
                "Forecast",
                "Change Orders",
                "Cost Reports",
                "Earned Value",
              ].map((module) => (

                <span
                  key={module}
                  className="bg-white border border-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-medium"
                >
                  {module}
                </span>

              ))}

            </div>

          </div>

        </div>

      </div>


      {/* ======================================================
          PROJECT ACCESS SECTION
      ====================================================== */}

      <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

          <div>

            <h2 className="text-xl font-bold text-gray-900">
              Control Project Visibility
            </h2>

            <p className="text-gray-500 mt-2 max-w-2xl">
              Assign specific projects to individual team
              members. Project Managers, Project Controls,
              Project Engineers, Clients, EORs, and other
              users will only see projects assigned to them.
            </p>

            <div className="mt-4 bg-gray-50 border rounded-lg p-4">

              <p className="text-sm font-semibold text-gray-800">
                Example
              </p>

              <p className="text-sm text-gray-600 mt-1">
                Project Controls + Hillsboro Solar =
                Cost Management access for Hillsboro Solar.
              </p>

              <p className="text-sm text-gray-600 mt-1">
                The same person will not automatically have
                access to Memphis Substation unless that
                project is assigned.
              </p>

            </div>

          </div>


          <Link
            href="/app/company/project-access"
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold text-center whitespace-nowrap"
          >
            Manage Project Access
          </Link>

        </div>

      </div>

    </main>
  );
}