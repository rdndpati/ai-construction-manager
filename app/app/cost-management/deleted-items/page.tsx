"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getAccessibleProjects } from "@/lib/projectAccess";
import { hasPermission } from "@/lib/permissions";

type Project = {
  id: string;
  name: string;
};

type DeletedItem = {
  id: string;
  module: string;
  tableName: string;
  project_id: string | null;
  projectName: string;
  deleted_at: string | null;
  description: string;
  code: string;
  amount: number | null;
};

const MODULES = [
  {
    name: "Budget",
    table: "budget_lines",
    permission: "Budget",
  },
  {
    name: "Cost Codes",
    table: "cost_codes",
    permission: "Cost Codes",
  },
  {
    name: "Commitments",
    table: "commitments",
    permission: "Commitments",
  },
  {
    name: "Actual Costs",
    table: "actual_costs",
    permission: "Actual Costs",
  },
  {
    name: "Change Orders",
    table: "change_orders",
    permission: "Change Orders",
  },
  {
    name: "Forecast",
    table: "forecast_lines",
    permission: "Forecast",
  },
  {
    name: "Contingency",
    table: "contingency_entries",
    permission: "Contingency",
  },
  {
    name: "Earned Value",
    table: "earned_value_entries",
    permission: "Earned Value",
  },
];

export default function DeletedItemsPage() {
  const [projects, setProjects] =
    useState<Project[]>([]);

  const [items, setItems] =
    useState<DeletedItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [restoringId, setRestoringId] =
    useState<string | null>(null);

  const [selectedModule, setSelectedModule] =
    useState("All");

  const [selectedProject, setSelectedProject] =
    useState("All");

  const [canRestore, setCanRestore] =
    useState(false);

  // =========================================================
  // LOAD
  // =========================================================

  useEffect(() => {
    loadDeletedItems();
  }, []);

  async function loadDeletedItems() {
    setLoading(true);

    try {
      // =====================================================
      // PROJECT ACCESS
      // =====================================================

      const result =
        await getAccessibleProjects();

      if (result.error) {
        console.error(
          "PROJECT ACCESS ERROR:",
          result.error
        );
      }

      const accessibleProjects =
        (result.projects as Project[]) ?? [];

      setProjects(
        accessibleProjects
      );

      const projectIds =
        accessibleProjects.map(
          (project) =>
            project.id
        );

      if (
        projectIds.length ===
        0
      ) {
        setItems([]);
        setCanRestore(false);
        return;
      }

      // =====================================================
      // RESTORE PERMISSION
      //
      // User needs delete OR manage permission
      // on at least one Cost Management module.
      // =====================================================

      const permissionResults =
        await Promise.all(
          MODULES.map(
            async (module) => {
              const [
                deletePermission,
                managePermission,
              ] = await Promise.all([
                hasPermission(
                  module.permission,
                  "delete"
                ),
                hasPermission(
                  module.permission,
                  "manage"
                ),
              ]);

              return (
                deletePermission ||
                managePermission
              );
            }
          )
        );

      setCanRestore(
        permissionResults.some(
          Boolean
        )
      );

      // =====================================================
      // LOAD DELETED ITEMS
      // =====================================================

      const allDeletedItems: DeletedItem[] =
        [];

      for (
        const module of MODULES
      ) {
        const {
          data,
          error,
        } = await supabase
          .from(module.table)
          .select("*")
          .in(
            "project_id",
            projectIds
          )
          .not(
            "deleted_at",
            "is",
            null
          )
          .order(
            "deleted_at",
            {
              ascending: false,
            }
          );

        if (error) {
          console.error(
            `${module.name} DELETED ITEMS ERROR:`,
            error
          );

          continue;
        }

        for (
          const row of data ?? []
        ) {
          const project =
            accessibleProjects.find(
              (project) =>
                project.id ===
                row.project_id
            );

          allDeletedItems.push({
            id: row.id,
            module:
              module.name,
            tableName:
              module.table,
            project_id:
              row.project_id ??
              null,
            projectName:
              project?.name ??
              "Unknown Project",
            deleted_at:
              row.deleted_at ??
              null,
            description:
              getDescription(row),
            code:
              getCode(row),
            amount:
              getAmount(row),
          });
        }
      }

      setItems(
        allDeletedItems
      );
    } catch (error) {
      console.error(
        "DELETED ITEMS ERROR:",
        error
      );

      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // RESTORE
  // =========================================================

  async function restoreItem(
    item: DeletedItem
  ) {
    if (!canRestore) {
      alert(
        "You do not have permission to restore deleted items."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Restore this ${item.module} item?\n\nIt will become active again in ${item.module}.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setRestoringId(
        `${item.tableName}:${item.id}`
      );

      const {
        error,
      } = await supabase
        .from(item.tableName)
        .update({
          deleted_at: null,
        })
        .eq(
          "id",
          item.id
        )
        .eq(
          "project_id",
          item.project_id
        );

      if (error) {
        console.error(
          "RESTORE ERROR:",
          error
        );

        alert(
          `Failed to restore item: ${error.message}`
        );

        return;
      }

      // Remove from Deleted Items list
      setItems(
        (previous) =>
          previous.filter(
            (existing) =>
              !(
                existing.id ===
                  item.id &&
                existing.tableName ===
                  item.tableName
              )
          )
      );

      alert(
        `${item.module} item restored successfully.`
      );
    } finally {
      setRestoringId(null);
    }
  }

  // =========================================================
  // FILTER
  // =========================================================

  const filteredItems =
    useMemo(() => {
      return items.filter(
        (item) => {
          const moduleMatch =
            selectedModule ===
              "All" ||
            item.module ===
              selectedModule;

          const projectMatch =
            selectedProject ===
              "All" ||
            item.project_id ===
              selectedProject;

          return (
            moduleMatch &&
            projectMatch
          );
        }
      );
    }, [
      items,
      selectedModule,
      selectedProject,
    ]);

  // =========================================================
  // MONEY
  // =========================================================

  function money(
    value: number | null
  ) {
    if (
      value === null ||
      Number.isNaN(value)
    ) {
      return "—";
    }

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }
    ).format(value);
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">
        <div className="bg-white border rounded-xl p-8">
          Loading Deleted Items...
        </div>
      </main>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="p-8 bg-gray-50 min-h-screen">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>

          <Link
            href="/app/cost-management"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Cost Management
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Deleted Items
          </h1>

          <p className="text-gray-500 mt-1">
            Restore deleted Cost Management
            records.
          </p>

        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3">

          <p className="text-sm font-semibold text-yellow-800">
            🗑️ Recycle Bin
          </p>

          <p className="text-xs text-yellow-700 mt-1">
            Deleted items can be restored.
          </p>

        </div>

      </div>

      {/* PERMISSION WARNING */}

      {!canRestore && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">

          <p className="text-sm text-blue-800">
            👁️ You can view deleted items,
            but you do not have permission
            to restore them.
          </p>

        </div>
      )}

      {/* FILTERS */}

      <div className="bg-white border rounded-xl p-5 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Module
            </label>

            <select
              value={
                selectedModule
              }
              onChange={(e) =>
                setSelectedModule(
                  e.target.value
                )
              }
              className="w-full border rounded-lg px-4 py-2.5 bg-white"
            >

              <option value="All">
                All Modules
              </option>

              {MODULES.map(
                (module) => (
                  <option
                    key={
                      module.name
                    }
                    value={
                      module.name
                    }
                  >
                    {module.name}
                  </option>
                )
              )}

            </select>

          </div>

          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Project
            </label>

            <select
              value={
                selectedProject
              }
              onChange={(e) =>
                setSelectedProject(
                  e.target.value
                )
              }
              className="w-full border rounded-lg px-4 py-2.5 bg-white"
            >

              <option value="All">
                All Projects
              </option>

              {projects.map(
                (project) => (
                  <option
                    key={
                      project.id
                    }
                    value={
                      project.id
                    }
                  >
                    {project.name}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <SummaryCard
          title="Deleted Items"
          value={String(
            items.length
          )}
          icon="🗑️"
        />

        <SummaryCard
          title="Showing"
          value={String(
            filteredItems.length
          )}
          icon="📋"
        />

        <SummaryCard
          title="Projects"
          value={String(
            new Set(
              items
                .map(
                  (item) =>
                    item.project_id
                )
                .filter(Boolean)
            ).size
          )}
          icon="📁"
        />

      </div>

      {/* TABLE */}

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">

        {filteredItems.length ===
        0 ? (
          <div className="p-12 text-center">

            <div className="text-5xl mb-4">
              🗑️
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              No Deleted Items
            </h2>

            <p className="text-gray-500 mt-2">
              There are no deleted Cost
              Management records matching
              your filters.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-100 border-b">

                <tr>

                  <th className="text-left p-4">
                    Module
                  </th>

                  <th className="text-left p-4">
                    Item
                  </th>

                  <th className="text-left p-4">
                    Project
                  </th>

                  <th className="text-right p-4">
                    Amount
                  </th>

                  <th className="text-left p-4">
                    Deleted
                  </th>

                  <th className="text-right p-4">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredItems.map(
                  (item) => {

                    const restoreKey =
                      `${item.tableName}:${item.id}`;

                    return (
                      <tr
                        key={
                          restoreKey
                        }
                        className="border-b hover:bg-gray-50"
                      >

                        {/* MODULE */}

                        <td className="p-4">

                          <span className="inline-flex bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                            {
                              item.module
                            }
                          </span>

                        </td>

                        {/* ITEM */}

                        <td className="p-4">

                          <p className="font-semibold text-gray-900">
                            {
                              item.description
                            }
                          </p>

                          {item.code && (
                            <p className="text-xs text-gray-500 mt-1">
                              Code:{" "}
                              {
                                item.code
                              }
                            </p>
                          )}

                        </td>

                        {/* PROJECT */}

                        <td className="p-4 text-gray-700">
                          {
                            item.projectName
                          }
                        </td>

                        {/* AMOUNT */}

                        <td className="p-4 text-right">

                          {money(
                            item.amount
                          )}

                        </td>

                        {/* DATE */}

                        <td className="p-4 text-gray-500 text-sm">

                          {item.deleted_at
                            ? new Date(
                                item.deleted_at
                              ).toLocaleString()
                            : "—"}

                        </td>

                        {/* RESTORE */}

                        <td className="p-4 text-right">

                          {canRestore ? (
                            <button
                              onClick={() =>
                                restoreItem(
                                  item
                                )
                              }
                              disabled={
                                restoringId ===
                                restoreKey
                              }
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                            >
                              {restoringId ===
                              restoreKey
                                ? "Restoring..."
                                : "↩ Restore"}
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              No access
                            </span>
                          )}

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </main>
  );
}

// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">

      <div className="flex justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="text-3xl font-bold mt-2">
            {value}
          </p>

        </div>

        <div className="text-2xl">
          {icon}
        </div>

      </div>

    </div>
  );
}

// =========================================================
// DESCRIPTION
// =========================================================

function getDescription(
  row: any
): string {
  return (
    row.description ??
    row.name ??
    row.title ??
    row.vendor_name ??
    row.contract_name ??
    row.cost_code ??
    row.code ??
    "Deleted Record"
  );
}

// =========================================================
// CODE
// =========================================================

function getCode(
  row: any
): string {
  return (
    row.cost_code ??
    row.code ??
    row.contract_number ??
    row.commitment_number ??
    row.change_order_number ??
    ""
  );
}

// =========================================================
// AMOUNT
// =========================================================

function getAmount(
  row: any
): number | null {
  const possibleAmounts = [
    row.original_budget,
    row.original_amount,
    row.amount,
    row.approved_amount,
    row.estimate_to_complete,
    row.contingency_amount,
    row.earned_value,
  ];

  for (
    const value of possibleAmounts
  ) {
    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      const number =
        Number(value);

      if (
        !Number.isNaN(number)
      ) {
        return number;
      }
    }
  }

  return null;
}