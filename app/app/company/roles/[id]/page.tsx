"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

/*
|--------------------------------------------------------------------------
| MODULES
|--------------------------------------------------------------------------
| These are the modules that can be controlled by role permissions.
|
| Cost Management has been broken into individual modules so that
| Project Controls / Project Managers can be given appropriate access.
|--------------------------------------------------------------------------
*/

const MODULES = [
  // Core project modules
  "Projects",
  "Drawings",
  "RFIs",
  "Submittals",
  "Specifications",

  // Company modules
  "Users",
  "Company",

  // Cost Management modules
  "Cost Dashboard",
  "Budget",
  "Cost Codes",
  "Commitments",
  "Actual Costs",
  "Forecast",
  "Change Orders",
  "Contingency",
  "Earned Value",
  "Cost Reports",
];

/*
|--------------------------------------------------------------------------
| PERMISSIONS
|--------------------------------------------------------------------------
*/

const PERMISSIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "manage",
];

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type Permission = {
  id: string;
  role_id: string;
  module: string;
  permission: string;
};

type Role = {
  id: string;
  name: string;
};

export default function EditRolePage() {
  const params = useParams();

  const roleId = params.id as string;

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [role, setRole] = useState<Role | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD ROLE + PERMISSIONS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (roleId) {
      loadRole();
      loadPermissions();
    }
  }, [roleId]);

  /*
  |--------------------------------------------------------------------------
  | LOAD ROLE
  |--------------------------------------------------------------------------
  */

  async function loadRole() {
    if (!roleId) return;

    const { data, error } = await supabase
      .from("roles")
      .select("id, name")
      .eq("id", roleId)
      .single();

    if (error) {
      console.error("ROLE ERROR:", error);
      setRole(null);
      return;
    }

    console.log("LOADED ROLE:", data);

    setRole(data);
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD PERMISSIONS
  |--------------------------------------------------------------------------
  */

  async function loadPermissions() {
    if (!roleId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .eq("role_id", roleId);

    if (error) {
      console.error(
        "PERMISSIONS ERROR:",
        error
      );

      setPermissions([]);
      setLoading(false);

      return;
    }

    console.log(
      "LOADED PERMISSIONS:",
      data
    );

    setPermissions(
      (data as Permission[]) || []
    );

    setLoading(false);
  }

  /*
  |--------------------------------------------------------------------------
  | CHECK PERMISSION
  |--------------------------------------------------------------------------
  */

  function hasPermission(
    module: string,
    permission: string
  ) {
    return permissions.some(
      (p) =>
        p.module === module &&
        p.permission === permission
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TOGGLE PERMISSION
  |--------------------------------------------------------------------------
  */

  async function togglePermission(
    module: string,
    permission: string
  ) {
    if (!roleId) return;

    console.log(
      "Clicked:",
      module,
      permission
    );

    setSaving(true);

    const exists =
      permissions.find(
        (p) =>
          p.module === module &&
          p.permission === permission
      );

    console.log(
      "Existing permission:",
      exists
    );

    /*
    |--------------------------------------------------------------------------
    | REMOVE PERMISSION
    |--------------------------------------------------------------------------
    */

    if (exists) {
      const { error } =
        await supabase
          .from("permissions")
          .delete()
          .eq("id", exists.id);

      console.log(
        "Delete Error:",
        error
      );

      if (error) {
        console.error(
          "Failed to delete permission:",
          error
        );

        alert(
          `Failed to remove permission: ${error.message}`
        );

        setSaving(false);

        return;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | ADD PERMISSION
    |--------------------------------------------------------------------------
    */

    else {
      const {
        data,
        error,
      } = await supabase
        .from("permissions")
        .insert({
          role_id: roleId,
          module,
          permission,
        })
        .select()
        .single();

      console.log(
        "Inserted permission:",
        data
      );

      console.log(
        "Insert Error:",
        error
      );

      if (error) {
        console.error(
          "Failed to add permission:",
          error
        );

        alert(
          `Failed to add permission: ${error.message}`
        );

        setSaving(false);

        return;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | REFRESH
    |--------------------------------------------------------------------------
    */

    await loadPermissions();

    setSaving(false);
  }

  /*
  |--------------------------------------------------------------------------
  | ENABLE ALL PERMISSIONS FOR A MODULE
  |--------------------------------------------------------------------------
  */

  async function enableModule(
    module: string
  ) {
    if (!roleId) return;

    setSaving(true);

    const rows = PERMISSIONS.map(
      (permission) => ({
        role_id: roleId,
        module,
        permission,
      })
    );

    /*
    | Delete existing permissions for
    | this module first.
    */

    const { error: deleteError } =
      await supabase
        .from("permissions")
        .delete()
        .eq("role_id", roleId)
        .eq("module", module);

    if (deleteError) {
      console.error(
        "MODULE DELETE ERROR:",
        deleteError
      );

      alert(
        deleteError.message
      );

      setSaving(false);

      return;
    }

    /*
    | Insert all permissions.
    */

    const { error: insertError } =
      await supabase
        .from("permissions")
        .insert(rows);

    if (insertError) {
      console.error(
        "MODULE INSERT ERROR:",
        insertError
      );

      alert(
        insertError.message
      );

      setSaving(false);

      return;
    }

    await loadPermissions();

    setSaving(false);
  }

  /*
  |--------------------------------------------------------------------------
  | REMOVE ALL PERMISSIONS FROM MODULE
  |--------------------------------------------------------------------------
  */

  async function disableModule(
    module: string
  ) {
    if (!roleId) return;

    setSaving(true);

    const { error } =
      await supabase
        .from("permissions")
        .delete()
        .eq("role_id", roleId)
        .eq("module", module);

    if (error) {
      console.error(
        "DISABLE MODULE ERROR:",
        error
      );

      alert(error.message);

      setSaving(false);

      return;
    }

    await loadPermissions();

    setSaving(false);
  }

  /*
  |--------------------------------------------------------------------------
  | CHECK WHETHER ALL PERMISSIONS ARE ENABLED
  |--------------------------------------------------------------------------
  */

  function moduleFullyEnabled(
    module: string
  ) {
    return PERMISSIONS.every(
      (permission) =>
        hasPermission(
          module,
          permission
        )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | COST MANAGEMENT MODULE?
  |--------------------------------------------------------------------------
  */

  function isCostManagementModule(
    module: string
  ) {
    return [
      "Cost Dashboard",
      "Budget",
      "Cost Codes",
      "Commitments",
      "Actual Costs",
      "Forecast",
      "Change Orders",
      "Contingency",
      "Earned Value",
      "Cost Reports",
    ].includes(module);
  }

  /*
  |--------------------------------------------------------------------------
  | ROLE DESCRIPTION
  |--------------------------------------------------------------------------
  */

  function getRoleDescription() {
    if (!role) {
      return "";
    }

    const name =
      role.name.toLowerCase();

    if (name === "admin") {
      return "Full company administration and project access.";
    }

    if (
      name === "project manager"
    ) {
      return "Manage assigned projects, including project cost and financial activities.";
    }

    if (
      name === "project controls"
    ) {
      return "Manage cost management, budgets, commitments, actual costs, forecasts, change orders, and cost reports for assigned projects.";
    }

    if (
      name === "project engineer"
    ) {
      return "Engineering and project-level access for assigned projects.";
    }

    if (
      name === "engineer of record"
    ) {
      return "Engineering review and project access for assigned projects.";
    }

    if (name === "client") {
      return "View project information for assigned projects.";
    }

    if (name === "qa/qc") {
      return "Quality assurance and quality control access for assigned projects.";
    }

    return "Configure the permissions for this role.";
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <main className="p-8 bg-gray-50 min-h-screen">

      {/* ============================================================
          HEADER
      ============================================================ */}

      <div className="mb-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <div className="flex items-center gap-3">

              <h1 className="text-3xl font-bold text-gray-900">
                Edit Permissions
              </h1>

              {role && (
                <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-semibold">
                  {role.name}
                </span>
              )}

            </div>

            <p className="text-gray-500 mt-2">
              Control what this role can view,
              create, edit, delete, approve,
              and manage.
            </p>

          </div>

          {saving && (
            <div className="text-sm text-blue-600 font-medium">
              Saving...
            </div>
          )}

        </div>


        {/* ROLE DESCRIPTION */}

        {role && (
          <div className="mt-5 bg-white border rounded-xl p-5">

            <p className="text-sm text-gray-600">
              {getRoleDescription()}
            </p>

          </div>
        )}

      </div>


      {/* ============================================================
          COST MANAGEMENT NOTICE
      ============================================================ */}

      <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-5">

        <div className="flex gap-3">

          <div className="text-2xl">
            📊
          </div>

          <div>

            <h2 className="font-bold text-purple-900">
              Cost Management Permissions
            </h2>

            <p className="text-sm text-purple-800 mt-2 leading-6">
              These permissions control access to project
              financial information. Project access is still
              controlled separately on the Project Access page.
            </p>

            <div className="mt-3 text-sm text-purple-800">

              <strong>
                Important:
              </strong>{" "}

              Giving a role permission to Budget or Forecast
              does not automatically give the user access to
              every project.

            </div>

          </div>

        </div>

      </div>


      {/* ============================================================
          PERMISSION TABLE
      ============================================================ */}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

        <div className="px-6 py-5 border-b">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            <div>

              <h2 className="text-xl font-bold text-gray-900">
                Role Permissions
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Select the permissions this role should have.
              </p>

            </div>

            {saving && (
              <span className="text-sm text-gray-500">
                Updating permissions...
              </span>
            )}

          </div>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full min-w-[1000px]">

            <thead className="bg-gray-100">

              <tr>

                <th className="p-4 text-left">
                  Module
                </th>

                {PERMISSIONS.map(
                  (permission) => (

                    <th
                      key={permission}
                      className="p-4 capitalize text-center"
                    >
                      {permission}
                    </th>

                  )
                )}

                <th className="p-4 text-center">
                  Quick Action
                </th>

              </tr>

            </thead>


            <tbody>

              {/* ====================================================
                  LOADING
              ==================================================== */}

              {loading && (

                <tr>

                  <td
                    colSpan={8}
                    className="p-10 text-center text-gray-500"
                  >
                    Loading permissions...
                  </td>

                </tr>

              )}


              {/* ====================================================
                  MODULES
              ==================================================== */}

              {!loading &&
                MODULES.map(
                  (module) => (

                    <tr
                      key={module}
                      className={`border-t hover:bg-gray-50 ${
                        isCostManagementModule(
                          module
                        )
                          ? "bg-purple-50/30"
                          : ""
                      }`}
                    >

                      {/* MODULE */}

                      <td className="p-4">

                        <div className="flex items-center gap-2">

                          {isCostManagementModule(
                            module
                          ) && (
                            <span className="text-purple-600">
                              $
                            </span>
                          )}

                          <span className="font-semibold text-gray-900">
                            {module}
                          </span>

                        </div>

                      </td>


                      {/* PERMISSIONS */}

                      {PERMISSIONS.map(
                        (permission) => (

                          <td
                            key={permission}
                            className="p-4 text-center"
                          >

                            <input
                              type="checkbox"
                              checked={hasPermission(
                                module,
                                permission
                              )}
                              onChange={() =>
                                togglePermission(
                                  module,
                                  permission
                                )
                              }
                              disabled={saving}
                              className="h-4 w-4 cursor-pointer accent-blue-600"
                            />

                          </td>

                        )
                      )}


                      {/* QUICK ACTION */}

                      <td className="p-4 text-center">

                        {moduleFullyEnabled(
                          module
                        ) ? (

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              disableModule(
                                module
                              )
                            }
                            className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            Remove All
                          </button>

                        ) : (

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              enableModule(
                                module
                              )
                            }
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          >
                            Enable All
                          </button>

                        )}

                      </td>

                    </tr>

                  )
                )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ============================================================
          COST MANAGEMENT EXPLANATION
      ============================================================ */}

      <div className="mt-8 bg-white border rounded-xl p-6">

        <h2 className="text-xl font-bold text-gray-900">
          Cost Management Access
        </h2>

        <p className="text-gray-500 mt-2">
          Recommended permissions for the Project Controls role:
        </p>


        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* BUDGET */}

          <div className="border rounded-lg p-4">

            <h3 className="font-semibold text-gray-900">
              Budget
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              View, create, edit, approve and manage
              project budgets.
            </p>

          </div>


          {/* COMMITMENTS */}

          <div className="border rounded-lg p-4">

            <h3 className="font-semibold text-gray-900">
              Commitments
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Manage purchase orders, contracts and
              committed project costs.
            </p>

          </div>


          {/* ACTUAL COST */}

          <div className="border rounded-lg p-4">

            <h3 className="font-semibold text-gray-900">
              Actual Costs
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              View and manage costs incurred against
              project budgets.
            </p>

          </div>


          {/* FORECAST */}

          <div className="border rounded-lg p-4">

            <h3 className="font-semibold text-gray-900">
              Forecast
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Manage ETC, EAC and forecast information.
            </p>

          </div>


          {/* CHANGE ORDERS */}

          <div className="border rounded-lg p-4">

            <h3 className="font-semibold text-gray-900">
              Change Orders
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Create, edit, review and approve project
              change orders.
            </p>

          </div>


          {/* COST REPORTS */}

          <div className="border rounded-lg p-4">

            <h3 className="font-semibold text-gray-900">
              Cost Reports
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              View and manage project financial reports.
            </p>

          </div>

        </div>

      </div>


      {/* ============================================================
          PERMISSION LEVELS
      ============================================================ */}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">

        <h2 className="font-semibold text-blue-900">
          Permission Levels
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm text-blue-800">

          <div>
            <strong>View:</strong>
            <br />
            See information
          </div>

          <div>
            <strong>Create:</strong>
            <br />
            Add new records
          </div>

          <div>
            <strong>Edit:</strong>
            <br />
            Modify records
          </div>

          <div>
            <strong>Delete:</strong>
            <br />
            Remove records
          </div>

          <div>
            <strong>Approve:</strong>
            <br />
            Approve records
          </div>

          <div>
            <strong>Manage:</strong>
            <br />
            Full module management
          </div>

        </div>

      </div>


      {/* ============================================================
          PROJECT ACCESS REMINDER
      ============================================================ */}

      <div className="mt-8 bg-gray-900 text-white rounded-xl p-6">

        <h2 className="text-xl font-bold">
          Project Access is Separate
        </h2>

        <p className="text-gray-300 mt-2 leading-6">
          Role permissions determine what a user can do.
          Project Access determines where they can do it.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="bg-white/10 rounded-lg p-4">

            <p className="font-semibold">
              Example 1
            </p>

            <p className="text-sm text-gray-300 mt-1">
              Project Controls + Budget permission +
              Hillsboro Solar access = can manage the
              Hillsboro Solar budget.
            </p>

          </div>


          <div className="bg-white/10 rounded-lg p-4">

            <p className="font-semibold">
              Example 2
            </p>

            <p className="text-sm text-gray-300 mt-1">
              Project Controls + Budget permission +
              no Memphis Substation access = cannot access
              the Memphis Substation budget.
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}