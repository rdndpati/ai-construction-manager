"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { getAccessibleProjects } from "@/lib/projectAccess";
import { hasPermission } from "@/lib/permissions";

// ============================================================
// TYPES
// ============================================================

type Project = {
  id: string;
  name: string;
};

type EVMEntry = {
  id: string;
  project_id: string;
  period_date: string;
  planned_value: number;
  earned_value: number;
  actual_cost: number;
  notes: string | null;
  created_at: string;
  deleted_at: string | null;
  created_by?: string | null;
};

type EVMPermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  manage: boolean;
};

// ============================================================
// MONEY
// ============================================================

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

// ============================================================
// NUMBER
// ============================================================

function number(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value || 0);
}

// ============================================================
// PERCENTAGE
// ============================================================

function percentage(value: number) {
  return `${(value || 0).toFixed(1)}%`;
}

// ============================================================
// PAGE
// ============================================================

export default function EarnedValuePage() {
  const searchParams = useSearchParams();

  const projectFromUrl =
    searchParams.get("project");

  // ==========================================================
  // PROJECTS
  // ==========================================================

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [selectedProject, setSelectedProject] =
    useState(
      projectFromUrl || ""
    );

  // ==========================================================
  // ACTIVE EVM ENTRIES
  // ==========================================================

  const [entries, setEntries] =
    useState<EVMEntry[]>([]);

  // ==========================================================
  // DELETED EVM ENTRIES
  // ==========================================================

  const [deletedEntries, setDeletedEntries] =
    useState<EVMEntry[]>([]);

  // ==========================================================
  // PERMISSIONS
  // ==========================================================

  const [permissions, setPermissions] =
    useState<EVMPermissions>({
      view: false,
      create: false,
      edit: false,
      delete: false,
      manage: false,
    });

  const canView =
    permissions.view ||
    permissions.manage;

  const canCreate =
    permissions.create ||
    permissions.manage;

  const canEdit =
    permissions.edit ||
    permissions.manage;

  const canDelete =
    permissions.delete ||
    permissions.manage;

  const canManage =
    permissions.manage;

  // ==========================================================
  // LOADING
  // ==========================================================

  const [loading, setLoading] =
    useState(true);

  const [loadingEntries, setLoadingEntries] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [restoring, setRestoring] =
    useState(false);

  // ==========================================================
  // MODALS
  // ==========================================================

  const [showForm, setShowForm] =
    useState(false);

  const [showEditSelector, setShowEditSelector] =
    useState(false);

  const [showDeleted, setShowDeleted] =
    useState(false);

  const [showManage, setShowManage] =
    useState(false);

  // ==========================================================
  // EDITING
  // ==========================================================

  const [editingId, setEditingId] =
    useState<string | null>(null);

  // ==========================================================
  // FORM
  // ==========================================================

  const [periodDate, setPeriodDate] =
    useState("");

  const [plannedValue, setPlannedValue] =
    useState("");

  const [earnedValue, setEarnedValue] =
    useState("");

  const [actualCost, setActualCost] =
    useState("");

  const [notes, setNotes] =
    useState("");

  // ==========================================================
  // LOCK BACKGROUND SCROLLING
  // ==========================================================

  useEffect(() => {
    const modalOpen =
      showForm ||
      showEditSelector ||
      showDeleted ||
      showManage;

    if (!modalOpen) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      return;
    }

    const oldBodyOverflow =
      document.body.style.overflow;

    const oldHtmlOverflow =
      document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        oldBodyOverflow;

      document.documentElement.style.overflow =
        oldHtmlOverflow;
    };
  }, [
    showForm,
    showEditSelector,
    showDeleted,
    showManage,
  ]);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadPage();
  }, []);

  // ==========================================================
  // LOAD PROJECTS + PERMISSIONS
  // ==========================================================

  async function loadPage() {
    try {
      setLoading(true);

      const result =
        await getAccessibleProjects();

      console.log(
        "EARNED VALUE ACCESSIBLE PROJECTS:",
        result
      );

      if (result.error) {
        console.error(
          "PROJECT ACCESS ERROR:",
          result.error
        );
      }

      const projectList =
        (result.projects as Project[]) ??
        [];

      setProjects(projectList);

      // ======================================================
      // SELECT PROJECT
      // ======================================================

      if (
        projectList.length >
        0
      ) {
        setSelectedProject(
          (current) => {
            const currentStillAccessible =
              current &&
              projectList.some(
                (project) =>
                  project.id ===
                  current
              );

            return currentStillAccessible
              ? current
              : projectList[0].id;
          }
        );
      } else {
        setSelectedProject("");
      }

      // ======================================================
      // PERMISSIONS
      // ======================================================

      const [
        view,
        create,
        edit,
        deletePermission,
        manage,
      ] = await Promise.all([
        hasPermission(
          "Earned Value",
          "view"
        ),

        hasPermission(
          "Earned Value",
          "create"
        ),

        hasPermission(
          "Earned Value",
          "edit"
        ),

        hasPermission(
          "Earned Value",
          "delete"
        ),

        hasPermission(
          "Earned Value",
          "manage"
        ),
      ]);

      console.log(
        "EARNED VALUE PERMISSIONS:",
        {
          view,
          create,
          edit,
          deletePermission,
          manage,
        }
      );

      setPermissions({
        view,
        create,
        edit,
        delete:
          deletePermission,
        manage,
      });
    } catch (error) {
      console.error(
        "EARNED VALUE PAGE LOAD ERROR:",
        error
      );

      setProjects([]);
      setSelectedProject("");

      setPermissions({
        view: false,
        create: false,
        edit: false,
        delete: false,
        manage: false,
      });
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // LOAD PROJECT DATA
  // ==========================================================

  useEffect(() => {
    if (
      selectedProject &&
      canView
    ) {
      loadAllEntries(
        selectedProject
      );
    } else {
      setEntries([]);
      setDeletedEntries([]);
    }
  }, [
    selectedProject,
    canView,
  ]);

  // ==========================================================
  // LOAD ACTIVE + DELETED
  // ==========================================================

  async function loadAllEntries(
    projectId: string
  ) {
    try {
      setLoadingEntries(true);

      await Promise.all([
        loadEntries(projectId),
        loadDeletedEntries(projectId),
      ]);
    } finally {
      setLoadingEntries(false);
    }
  }

  // ==========================================================
  // LOAD ACTIVE ENTRIES
  // ==========================================================

  async function loadEntries(
    projectId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "earned_value_entries"
      )
      .select("*")
      .eq(
        "project_id",
        projectId
      )
      .is(
        "deleted_at",
        null
      )
      .order(
        "period_date",
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        "EARNED VALUE LOAD ERROR:",
        error
      );

      setEntries([]);
      return;
    }

    setEntries(
      (data as EVMEntry[]) ??
        []
    );
  }

  // ==========================================================
  // LOAD DELETED ENTRIES
  // ==========================================================

  async function loadDeletedEntries(
    projectId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "earned_value_entries"
      )
      .select("*")
      .eq(
        "project_id",
        projectId
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
        "DELETED EARNED VALUE LOAD ERROR:",
        error
      );

      setDeletedEntries([]);
      return;
    }

    setDeletedEntries(
      (data as EVMEntry[]) ??
        []
    );
  }

  // ==========================================================
  // CALCULATIONS
  // ==========================================================

  const calculations =
    useMemo(() => {
      const pv =
        entries.reduce(
          (sum, entry) =>
            sum +
            Number(
              entry.planned_value ||
                0
            ),
          0
        );

      const ev =
        entries.reduce(
          (sum, entry) =>
            sum +
            Number(
              entry.earned_value ||
                0
            ),
          0
        );

      const ac =
        entries.reduce(
          (sum, entry) =>
            sum +
            Number(
              entry.actual_cost ||
                0
            ),
          0
        );

      const bac = pv;

      const cv =
        ev - ac;

      const sv =
        ev - pv;

      const cpi =
        ac > 0
          ? ev / ac
          : 0;

      const spi =
        pv > 0
          ? ev / pv
          : 0;

      const eac =
        cpi > 0
          ? bac / cpi
          : bac;

      const etc =
        Math.max(
          eac - ac,
          0
        );

      const varianceAtCompletion =
        bac - eac;

      return {
        pv,
        ev,
        ac,
        bac,
        cv,
        sv,
        cpi,
        spi,
        eac,
        etc,
        varianceAtCompletion,
      };
    }, [entries]);

  // ==========================================================
  // VIEW BUTTON
  // ==========================================================

  function handleViewButton() {
    if (!canView) {
      alert(
        "You do not have permission to view Earned Value."
      );
      return;
    }

    setTimeout(() => {
      document
        .getElementById(
          "earned-value-table"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  // ==========================================================
  // CREATE BUTTON
  // ==========================================================

  function handleCreateButton() {
    if (!canCreate) {
      alert(
        "You do not have permission to create Earned Value entries."
      );
      return;
    }

    openAddForm();
  }

  // ==========================================================
  // OPEN ADD FORM
  // ==========================================================

  function openAddForm() {
    if (!canCreate) {
      alert(
        "You do not have permission to create Earned Value entries."
      );
      return;
    }

    setEditingId(null);

    setPeriodDate("");
    setPlannedValue("");
    setEarnedValue("");
    setActualCost("");
    setNotes("");

    setShowForm(true);
  }

  // ==========================================================
  // EDIT BUTTON
  // ==========================================================

  function handleEditButton() {
    if (!canEdit) {
      alert(
        "You do not have permission to edit Earned Value entries."
      );
      return;
    }

    if (entries.length === 0) {
      alert(
        "There are no active Earned Value entries to edit."
      );
      return;
    }

    setShowEditSelector(true);
  }

  // ==========================================================
  // OPEN EDIT FORM
  // ==========================================================

  function openEditForm(
    entry: EVMEntry
  ) {
    if (!canEdit) {
      alert(
        "You do not have permission to edit Earned Value entries."
      );
      return;
    }

    setEditingId(entry.id);

    setPeriodDate(
      entry.period_date
    );

    setPlannedValue(
      String(
        entry.planned_value ?? ""
      )
    );

    setEarnedValue(
      String(
        entry.earned_value ?? ""
      )
    );

    setActualCost(
      String(
        entry.actual_cost ?? ""
      )
    );

    setNotes(
      entry.notes ?? ""
    );

    setShowEditSelector(false);
    setShowForm(true);
  }

  // ==========================================================
  // DELETE / RESTORE BUTTON
  // ==========================================================

  function handleDeleteRestoreButton() {
    if (!canDelete) {
      alert(
        "You do not have permission to delete or restore Earned Value entries."
      );
      return;
    }

    setShowDeleted(true);
  }

  // ==========================================================
  // MANAGE BUTTON
  // ==========================================================

  function handleManageButton() {
    if (!canManage) {
      alert(
        "You do not have permission to manage Earned Value."
      );
      return;
    }

    setShowManage(true);
  }

  // ==========================================================
  // REFRESH
  // ==========================================================

  async function handleRefresh() {
    if (!canView || !selectedProject) {
      return;
    }

    await loadAllEntries(
      selectedProject
    );
  }

  // ==========================================================
  // SAVE / CREATE / UPDATE
  // ==========================================================

  async function handleSave(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (
      editingId &&
      !canEdit
    ) {
      alert(
        "You do not have permission to edit Earned Value entries."
      );
      return;
    }

    if (
      !editingId &&
      !canCreate
    ) {
      alert(
        "You do not have permission to create Earned Value entries."
      );
      return;
    }

    if (!selectedProject) {
      alert(
        "Please select a project."
      );
      return;
    }

    if (!periodDate) {
      alert(
        "Please select a period date."
      );
      return;
    }

    const pv =
      Number(
        plannedValue
      );

    const ev =
      Number(
        earnedValue
      );

    const ac =
      Number(
        actualCost
      );

    if (
      Number.isNaN(pv) ||
      pv < 0
    ) {
      alert(
        "Please enter a valid Planned Value."
      );
      return;
    }

    if (
      Number.isNaN(ev) ||
      ev < 0
    ) {
      alert(
        "Please enter a valid Earned Value."
      );
      return;
    }

    if (
      Number.isNaN(ac) ||
      ac < 0
    ) {
      alert(
        "Please enter a valid Actual Cost."
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        alert(
          "You are not logged in."
        );
        return;
      }

      // ======================================================
      // UPDATE EXISTING
      // ======================================================

      if (editingId) {
        const {
          error,
        } = await supabase
          .from(
            "earned_value_entries"
          )
          .update({
            period_date:
              periodDate,

            planned_value:
              pv,

            earned_value:
              ev,

            actual_cost:
              ac,

            notes:
              notes.trim() ||
              null,
          })
          .eq(
            "id",
            editingId
          )
          .eq(
            "project_id",
            selectedProject
          )
          .is(
            "deleted_at",
            null
          );

        if (error) {
          console.error(
            "EVM UPDATE ERROR:",
            error
          );

          alert(
            error.message
          );

          return;
        }

        alert(
          "Earned Value entry updated successfully."
        );
      }

      // ======================================================
      // CREATE NEW
      // ======================================================

      else {
        const {
          error,
        } = await supabase
          .from(
            "earned_value_entries"
          )
          .insert([
            {
              project_id:
                selectedProject,

              period_date:
                periodDate,

              planned_value:
                pv,

              earned_value:
                ev,

              actual_cost:
                ac,

              notes:
                notes.trim() ||
                null,

              created_by:
                user.id,

              deleted_at:
                null,
            },
          ]);

        if (error) {
          console.error(
            "EVM CREATE ERROR:",
            error
          );

          alert(
            error.message
          );

          return;
        }

        alert(
          "Earned Value entry created successfully."
        );
      }

      resetForm();

      await loadAllEntries(
        selectedProject
      );
    } catch (error: any) {
      console.error(
        "EVM SAVE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to save Earned Value entry."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  async function handleDeleteEntry(
    id: string
  ) {
    if (!canDelete) {
      alert(
        "You do not have permission to delete Earned Value entries."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this Earned Value entry? It will move to the Deleted list and can be restored later."
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const {
        error,
      } = await supabase
        .from(
          "earned_value_entries"
        )
        .update({
          deleted_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          id
        )
        .eq(
          "project_id",
          selectedProject
        )
        .is(
          "deleted_at",
          null
        );

      if (error) {
        console.error(
          "EVM DELETE ERROR:",
          error
        );

        alert(
          error.message
        );

        return;
      }

      await loadAllEntries(
        selectedProject
      );

      alert(
        "Earned Value entry moved to Deleted."
      );
    } catch (error: any) {
      console.error(
        "EVM DELETE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to delete Earned Value entry."
      );
    } finally {
      setDeleting(false);
    }
  }

  // ==========================================================
  // RESTORE
  // ==========================================================

  async function handleRestoreEntry(
    id: string
  ) {
    if (!canDelete) {
      alert(
        "You do not have permission to restore Earned Value entries."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Restore this Earned Value entry?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setRestoring(true);

      const {
        error,
      } = await supabase
        .from(
          "earned_value_entries"
        )
        .update({
          deleted_at:
            null,
        })
        .eq(
          "id",
          id
        )
        .eq(
          "project_id",
          selectedProject
        )
        .not(
          "deleted_at",
          "is",
          null
        );

      if (error) {
        console.error(
          "EVM RESTORE ERROR:",
          error
        );

        alert(
          error.message
        );

        return;
      }

      await loadAllEntries(
        selectedProject
      );

      alert(
        "Earned Value entry restored successfully."
      );
    } catch (error: any) {
      console.error(
        "EVM RESTORE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to restore Earned Value entry."
      );
    } finally {
      setRestoring(false);
    }
  }

  // ==========================================================
  // RESET FORM
  // ==========================================================

  function resetForm() {
    setEditingId(null);
    setPeriodDate("");
    setPlannedValue("");
    setEarnedValue("");
    setActualCost("");
    setNotes("");
    setShowForm(false);
  }

  // ==========================================================
  // CPI STATUS
  // ==========================================================

  function getCPIStatus(
    cpi: number
  ) {
    if (cpi === 0) {
      return {
        text: "No Data",
        className:
          "bg-gray-100 text-gray-700",
      };
    }

    if (cpi >= 1) {
      return {
        text: "Under Budget",
        className:
          "bg-green-100 text-green-700",
      };
    }

    return {
      text: "Over Budget",
      className:
        "bg-red-100 text-red-700",
    };
  }

  // ==========================================================
  // SPI STATUS
  // ==========================================================

  function getSPIStatus(
    spi: number
  ) {
    if (spi === 0) {
      return {
        text: "No Data",
        className:
          "bg-gray-100 text-gray-700",
      };
    }

    if (spi >= 1) {
      return {
        text: "On/Ahead",
        className:
          "bg-green-100 text-green-700",
      };
    }

    return {
      text: "Behind",
      className:
        "bg-red-100 text-red-700",
    };
  }

  const cpiStatus =
    getCPIStatus(
      calculations.cpi
    );

  const spiStatus =
    getSPIStatus(
      calculations.spi
    );

  // ==========================================================
  // PROJECT NAME
  // ==========================================================

  const selectedProjectName =
    projects.find(
      (project) =>
        project.id ===
        selectedProject
    )?.name ??
    "";

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">

        <div className="bg-white border rounded-xl p-8">
          Loading Earned Value...
        </div>

      </main>
    );
  }

  // ==========================================================
  // NO VIEW ACCESS
  // ==========================================================

  if (!canView) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">

        <div className="max-w-xl mx-auto bg-white border rounded-xl p-10 text-center shadow-sm">

          <div className="text-5xl mb-4">
            🔒
          </div>

          <h1 className="text-2xl font-bold">
            Earned Value Access Restricted
          </h1>

          <p className="text-gray-500 mt-3">
            You do not have permission
            to view Earned Value.
          </p>

          <p className="text-sm text-gray-400 mt-2">
            Contact your company
            administrator if you need
            access.
          </p>

          <Link
            href={`/app/cost-management?project=${selectedProject}`}
            className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg"
          >
            Back to Cost Management
          </Link>

        </div>

      </main>
    );
  }

  // ==========================================================
  // NO PROJECTS
  // ==========================================================

  if (
    projects.length ===
    0
  ) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">

        <div className="bg-white border rounded-xl p-10 text-center">

          <div className="text-5xl mb-4">
            📁
          </div>

          <h1 className="text-2xl font-bold">
            No Projects Available
          </h1>

          <p className="text-gray-500 mt-2">
            You currently don't have
            access to any projects.
          </p>

        </div>

      </main>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main className="p-8 bg-gray-50 min-h-screen">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex justify-between items-start mb-6">

        <div>

          <Link
            href={`/app/cost-management?project=${selectedProject}`}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Cost Management
          </Link>

          <h1 className="text-4xl font-bold mt-3">
            Earned Value
          </h1>

          <p className="text-gray-500 mt-2">
            Monitor planned value,
            earned value, actual cost,
            and project performance.
          </p>

        </div>

        {/* PROJECT */}

        <div>

          <label className="block text-sm font-semibold text-gray-600 mb-2">
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
            className="border rounded-lg bg-white px-4 py-2.5 min-w-[280px]"
          >

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
                  {
                    project.name
                  }
                </option>
              )
            )}

          </select>

        </div>

      </div>

      {/* =====================================================
          CLICKABLE ACTION BAR
      ===================================================== */}

      <div className="flex gap-3 flex-wrap mb-8">

        {/* VIEW */}

        {canView && (
          <button
            type="button"
            onClick={
              handleViewButton
            }
            className="cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200 px-5 py-2.5 rounded-full font-semibold active:scale-95 transition"
          >
            👁️ View
          </button>
        )}

        {/* CREATE */}

        {canCreate && (
          <button
            type="button"
            onClick={
              handleCreateButton
            }
            className="cursor-pointer bg-green-100 text-green-700 hover:bg-green-200 px-5 py-2.5 rounded-full font-semibold active:scale-95 transition"
          >
            ＋ Create
          </button>
        )}

        {/* EDIT */}

        {canEdit && (
          <button
            type="button"
            onClick={
              handleEditButton
            }
            className="cursor-pointer bg-purple-100 text-purple-700 hover:bg-purple-200 px-5 py-2.5 rounded-full font-semibold active:scale-95 transition"
          >
            ✏️ Edit
          </button>
        )}

        {/* DELETE / RESTORE */}

        {canDelete && (
          <button
            type="button"
            onClick={
              handleDeleteRestoreButton
            }
            className="cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 px-5 py-2.5 rounded-full font-semibold active:scale-95 transition"
          >
            🗑️ Delete / Restore
          </button>
        )}

        {/* MANAGE */}

        {canManage && (
          <button
            type="button"
            onClick={
              handleManageButton
            }
            className="cursor-pointer bg-gray-800 text-white hover:bg-gray-900 px-5 py-2.5 rounded-full font-semibold active:scale-95 transition"
          >
            ⚙️ Manage
          </button>
        )}

      </div>

      {/* =====================================================
          PROJECT
      ===================================================== */}

      <div className="bg-white border rounded-xl p-5 mb-6">

        <p className="text-sm text-gray-500">
          Project
        </p>

        <h2 className="text-2xl font-bold mt-1">
          {selectedProjectName}
        </h2>

      </div>

      {/* =====================================================
          REFRESH
      ===================================================== */}

      <div className="flex justify-end mb-4">

        <button
          type="button"
          onClick={
            handleRefresh
          }
          className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 rounded-lg font-medium"
        >
          ↻ Refresh
        </button>

      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loadingEntries && (
        <div className="mb-4 text-sm text-blue-600">
          Updating earned value data...
        </div>
      )}

      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Budget at Completion
          </p>

          <p className="text-3xl font-bold mt-2">
            {money(
              calculations.bac
            )}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Total planned value
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Planned Value
          </p>

          <p className="text-3xl font-bold mt-2">
            {money(
              calculations.pv
            )}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Work planned
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Earned Value
          </p>

          <p className="text-3xl font-bold mt-2">
            {money(
              calculations.ev
            )}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Work earned
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Actual Cost
          </p>

          <p className="text-3xl font-bold mt-2">
            {money(
              calculations.ac
            )}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Cost incurred
          </p>

        </div>

      </div>

      {/* =====================================================
          SECOND ROW
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Estimate at Completion
          </p>

          <p className="text-2xl font-bold mt-2">
            {money(
              calculations.eac
            )}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Projected final cost
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Estimate to Complete
          </p>

          <p className="text-2xl font-bold mt-2">
            {money(
              calculations.etc
            )}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Remaining projected cost
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Cost Variance
          </p>

          <p
            className={`text-2xl font-bold mt-2 ${
              calculations.cv >=
              0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {money(
              calculations.cv
            )}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            EV − AC
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Schedule Variance
          </p>

          <p
            className={`text-2xl font-bold mt-2 ${
              calculations.sv >=
              0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {money(
              calculations.sv
            )}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            EV − PV
          </p>

        </div>

      </div>

      {/* =====================================================
          PERFORMANCE
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        <div className="bg-white border rounded-xl shadow-sm p-6">

          <h2 className="text-xl font-bold mb-5">
            Cost Performance
          </h2>

          <div className="flex justify-between items-center">

            <div>

              <p className="text-gray-500 text-sm">
                Cost Performance Index
              </p>

              <p className="text-4xl font-bold mt-2">
                {calculations.cpi.toFixed(
                  2
                )}
              </p>

            </div>

            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${cpiStatus.className}`}
            >
              {
                cpiStatus.text
              }
            </span>

          </div>

          <div className="mt-6 text-sm text-gray-500">
            CPI = Earned Value ÷ Actual Cost
          </div>

        </div>

        <div className="bg-white border rounded-xl shadow-sm p-6">

          <h2 className="text-xl font-bold mb-5">
            Schedule Performance
          </h2>

          <div className="flex justify-between items-center">

            <div>

              <p className="text-gray-500 text-sm">
                Schedule Performance Index
              </p>

              <p className="text-4xl font-bold mt-2">
                {calculations.spi.toFixed(
                  2
                )}
              </p>

            </div>

            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${spiStatus.className}`}
            >
              {
                spiStatus.text
              }
            </span>

          </div>

          <div className="mt-6 text-sm text-gray-500">
            SPI = Earned Value ÷ Planned Value
          </div>

        </div>

      </div>

      {/* =====================================================
          EVM FORECAST
      ===================================================== */}

      <div className="bg-white border rounded-xl shadow-sm p-6 mb-8">

        <h2 className="text-xl font-bold mb-5">
          EVM Forecast
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div>

            <p className="text-sm text-gray-500">
              Budget at Completion
            </p>

            <p className="text-xl font-bold mt-1">
              {money(
                calculations.bac
              )}
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Estimate at Completion
            </p>

            <p className="text-xl font-bold mt-1">
              {money(
                calculations.eac
              )}
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Variance at Completion
            </p>

            <p
              className={`text-xl font-bold mt-1 ${
                calculations.varianceAtCompletion >=
                0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {money(
                calculations.varianceAtCompletion
              )}
            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          REPORTING PERIODS
      ===================================================== */}

      <div
        id="earned-value-table"
        className="bg-white border rounded-xl shadow-sm overflow-hidden"
      >

        <div className="p-6 border-b flex justify-between items-center">

          <div>

            <h2 className="text-xl font-bold">
              Reporting Periods
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Historical earned value data
              for the selected project.
            </p>

          </div>

          <div className="flex gap-3">

            {canDelete && (
              <button
                type="button"
                onClick={
                  handleDeleteRestoreButton
                }
                className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-lg"
              >
                🗑️ Deleted (
                {
                  deletedEntries.length
                }
                )
              </button>
            )}

            {canCreate && (
              <button
                type="button"
                onClick={
                  handleCreateButton
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium"
              >
                + Add EVM Entry
              </button>
            )}

          </div>

        </div>

        {/* ===================================================
            ACTIVE TABLE
        =================================================== */}

        {entries.length ===
        0 ? (

          <div className="p-12 text-center text-gray-500">

            <div className="text-4xl mb-3">
              📈
            </div>

            <p className="text-lg">
              No earned value entries yet.
            </p>

            {canCreate && (
              <button
                type="button"
                onClick={
                  openAddForm
                }
                className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg"
              >
                + Add EVM Entry
              </button>
            )}

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1200px]">

              <thead className="bg-gray-50">

                <tr>

                  <th className="text-left p-4">
                    Period
                  </th>

                  <th className="text-right p-4">
                    Planned Value
                  </th>

                  <th className="text-right p-4">
                    Earned Value
                  </th>

                  <th className="text-right p-4">
                    Actual Cost
                  </th>

                  <th className="text-right p-4">
                    CV
                  </th>

                  <th className="text-right p-4">
                    SV
                  </th>

                  <th className="text-right p-4">
                    CPI
                  </th>

                  <th className="text-right p-4">
                    SPI
                  </th>

                  <th className="text-left p-4">
                    Notes
                  </th>

                  <th className="text-right p-4">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {entries.map(
                  (entry) => {

                    const pv =
                      Number(
                        entry.planned_value ||
                          0
                      );

                    const ev =
                      Number(
                        entry.earned_value ||
                          0
                      );

                    const ac =
                      Number(
                        entry.actual_cost ||
                          0
                      );

                    const cv =
                      ev - ac;

                    const sv =
                      ev - pv;

                    const cpi =
                      ac > 0
                        ? ev / ac
                        : 0;

                    const spi =
                      pv > 0
                        ? ev / pv
                        : 0;

                    return (
                      <tr
                        key={
                          entry.id
                        }
                        className="border-t hover:bg-gray-50"
                      >

                        <td className="p-4 font-medium">
                          {
                            entry.period_date
                          }
                        </td>

                        <td className="p-4 text-right">
                          {money(
                            pv
                          )}
                        </td>

                        <td className="p-4 text-right">
                          {money(
                            ev
                          )}
                        </td>

                        <td className="p-4 text-right">
                          {money(
                            ac
                          )}
                        </td>

                        <td
                          className={`p-4 text-right font-medium ${
                            cv >=
                            0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {money(
                            cv
                          )}
                        </td>

                        <td
                          className={`p-4 text-right font-medium ${
                            sv >=
                            0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {money(
                            sv
                          )}
                        </td>

                        <td className="p-4 text-right">
                          {cpi.toFixed(
                            2
                          )}
                        </td>

                        <td className="p-4 text-right">
                          {spi.toFixed(
                            2
                          )}
                        </td>

                        <td className="p-4 max-w-[250px] truncate">
                          {
                            entry.notes ||
                            "—"
                          }
                        </td>

                        <td className="p-4">

                          <div className="flex justify-end gap-4">

                            {canEdit && (
                              <button
                                type="button"
                                onClick={() =>
                                  openEditForm(
                                    entry
                                  )
                                }
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Edit
                              </button>
                            )}

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteEntry(
                                    entry.id
                                  )
                                }
                                disabled={
                                  deleting
                                }
                                className="text-red-600 hover:text-red-800 font-medium disabled:text-gray-400"
                              >
                                {deleting
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            )}

                            {!canEdit &&
                              !canDelete && (
                                <span className="text-gray-400 text-sm">
                                  View only
                                </span>
                              )}

                          </div>

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

      {/* =====================================================
          EDIT SELECTOR MODAL
      ===================================================== */}

      {showEditSelector && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setShowEditSelector(false);
            }
          }}
        >

          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="p-6 border-b flex justify-between items-center shrink-0">

              <div>

                <h2 className="text-2xl font-bold">
                  Select EVM Entry to Edit
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Select the reporting period you want to modify.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowEditSelector(
                    false
                  )
                }
                className="text-gray-500 hover:text-gray-800 text-3xl"
              >
                ×
              </button>

            </div>

            <div className="p-6 overflow-y-auto overscroll-contain">

              <div className="space-y-3">

                {entries.map(
                  (entry) => (

                    <button
                      key={
                        entry.id
                      }
                      type="button"
                      onClick={() =>
                        openEditForm(
                          entry
                        )
                      }
                      className="w-full text-left border rounded-xl p-4 hover:bg-blue-50 hover:border-blue-300 transition"
                    >

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">

                        <div>

                          <p className="text-xs text-gray-500">
                            Period
                          </p>

                          <p className="font-bold mt-1">
                            {
                              entry.period_date
                            }
                          </p>

                        </div>

                        <div>

                          <p className="text-xs text-gray-500">
                            Planned Value
                          </p>

                          <p className="font-semibold mt-1">
                            {money(
                              Number(
                                entry.planned_value ||
                                  0
                              )
                            )}
                          </p>

                        </div>

                        <div>

                          <p className="text-xs text-gray-500">
                            Earned Value
                          </p>

                          <p className="font-semibold mt-1">
                            {money(
                              Number(
                                entry.earned_value ||
                                  0
                              )
                            )}
                          </p>

                        </div>

                        <div>

                          <p className="text-xs text-gray-500">
                            Actual Cost
                          </p>

                          <p className="font-semibold mt-1">
                            {money(
                              Number(
                                entry.actual_cost ||
                                  0
                              )
                            )}
                          </p>

                        </div>

                        <div className="md:text-right">

                          <p className="text-xs text-gray-500">
                            Notes
                          </p>

                          <p className="font-medium mt-1 truncate">
                            {
                              entry.notes ||
                              "No notes"
                            }
                          </p>

                        </div>

                      </div>

                    </button>

                  )
                )}

              </div>

            </div>

            <div className="border-t p-6 flex justify-end shrink-0">

              <button
                type="button"
                onClick={() =>
                  setShowEditSelector(
                    false
                  )
                }
                className="border px-5 py-2.5 rounded-lg"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          ADD / EDIT FORM MODAL
      ===================================================== */}

      {showForm &&
        (editingId
          ? canEdit
          : canCreate) && (

        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              resetForm();
            }
          }}
        >

          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="p-6 border-b flex justify-between items-center shrink-0">

              <div>

                <h2 className="text-2xl font-bold">
                  {editingId
                    ? "Edit Earned Value Entry"
                    : "Add Earned Value Entry"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {
                    selectedProjectName
                  }
                </p>

              </div>

              <button
                type="button"
                onClick={
                  resetForm
                }
                className="text-gray-500 hover:text-gray-900 text-3xl w-10 h-10 rounded-lg hover:bg-gray-100"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSave
              }
              className="flex flex-col min-h-0"
            >

              <div className="p-6 space-y-5 overflow-y-auto overscroll-contain">

                {/* PERIOD DATE */}

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Period Date
                  </label>

                  <input
                    type="date"
                    value={
                      periodDate
                    }
                    onChange={(e) =>
                      setPeriodDate(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg px-3 py-3"
                    required
                  />

                </div>

                {/* VALUES */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <div>

                    <label className="block text-sm font-medium mb-2">
                      Planned Value
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        plannedValue
                      }
                      onChange={(e) =>
                        setPlannedValue(
                          e.target.value
                        )
                      }
                      placeholder="0.00"
                      className="w-full border rounded-lg px-3 py-3"
                      required
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-2">
                      Earned Value
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        earnedValue
                      }
                      onChange={(e) =>
                        setEarnedValue(
                          e.target.value
                        )
                      }
                      placeholder="0.00"
                      className="w-full border rounded-lg px-3 py-3"
                      required
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-2">
                      Actual Cost
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        actualCost
                      }
                      onChange={(e) =>
                        setActualCost(
                          e.target.value
                        )
                      }
                      placeholder="0.00"
                      className="w-full border rounded-lg px-3 py-3"
                      required
                    />

                  </div>

                </div>

                {/* NOTES */}

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Notes
                  </label>

                  <textarea
                    value={
                      notes
                    }
                    onChange={(e) =>
                      setNotes(
                        e.target.value
                      )
                    }
                    rows={5}
                    placeholder="Optional notes..."
                    className="w-full border rounded-lg px-3 py-3 resize-y"
                  />

                </div>

              </div>

              {/* FOOTER */}

              <div className="p-6 border-t flex justify-end gap-3 shrink-0">

                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  className="border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg font-semibold"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Add Entry"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          DELETE / RESTORE MODAL
      ===================================================== */}

      {showDeleted && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setShowDeleted(false);
            }
          }}
        >

          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="p-6 border-b flex justify-between items-center shrink-0">

              <div>

                <h2 className="text-2xl font-bold">
                  Delete / Restore Earned Value
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Deleted entries can be restored from this list.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowDeleted(
                    false
                  )
                }
                className="text-gray-500 hover:text-gray-800 text-3xl"
              >
                ×
              </button>

            </div>

            <div className="p-6 overflow-y-auto overscroll-contain">

              {deletedEntries.length ===
              0 ? (

                <div className="text-center p-12">

                  <div className="text-5xl mb-4">
                    🗑️
                  </div>

                  <p className="font-semibold">
                    No deleted EVM entries
                  </p>

                  <p className="text-gray-500 text-sm mt-2">
                    Deleted records will appear here.
                  </p>

                </div>

              ) : (

                <div className="border rounded-xl overflow-hidden">

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[1100px]">

                      <thead className="bg-gray-100 border-b">

                        <tr>

                          <th className="text-left p-4">
                            Period
                          </th>

                          <th className="text-right p-4">
                            Planned Value
                          </th>

                          <th className="text-right p-4">
                            Earned Value
                          </th>

                          <th className="text-right p-4">
                            Actual Cost
                          </th>

                          <th className="text-left p-4">
                            Notes
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

                        {deletedEntries.map(
                          (entry) => (

                            <tr
                              key={
                                entry.id
                              }
                              className="border-b hover:bg-gray-50"
                            >

                              <td className="p-4 font-medium">
                                {
                                  entry.period_date
                                }
                              </td>

                              <td className="p-4 text-right">
                                {money(
                                  Number(
                                    entry.planned_value ||
                                      0
                                  )
                                )}
                              </td>

                              <td className="p-4 text-right">
                                {money(
                                  Number(
                                    entry.earned_value ||
                                      0
                                  )
                                )}
                              </td>

                              <td className="p-4 text-right">
                                {money(
                                  Number(
                                    entry.actual_cost ||
                                      0
                                  )
                                )}
                              </td>

                              <td className="p-4 text-gray-500">
                                {
                                  entry.notes ||
                                  "—"
                                }
                              </td>

                              <td className="p-4 text-sm text-gray-500">

                                {entry.deleted_at
                                  ? new Date(
                                      entry.deleted_at
                                    ).toLocaleString()
                                  : "—"}

                              </td>

                              <td className="p-4 text-right">

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRestoreEntry(
                                      entry.id
                                    )
                                  }
                                  disabled={
                                    restoring
                                  }
                                  className="text-green-600 hover:text-green-800 font-semibold disabled:text-gray-400"
                                >
                                  {restoring
                                    ? "Restoring..."
                                    : "Restore"}
                                </button>

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

              )}

            </div>

            <div className="border-t p-6 flex justify-end shrink-0">

              <button
                type="button"
                onClick={() =>
                  setShowDeleted(
                    false
                  )
                }
                className="border px-5 py-2.5 rounded-lg"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          MANAGE MODAL
      ===================================================== */}

      {showManage && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setShowManage(false);
            }
          }}
        >

          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="p-6 border-b flex justify-between items-center shrink-0">

              <div>

                <h2 className="text-2xl font-bold">
                  Earned Value Management
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Manage EVM records and access.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowManage(
                    false
                  )
                }
                className="text-gray-500 hover:text-gray-800 text-3xl"
              >
                ×
              </button>

            </div>

            <div className="p-6 overflow-y-auto overscroll-contain">

              {/* SUMMARY */}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div className="border rounded-xl p-5 bg-gray-50">

                  <p className="text-sm text-gray-500">
                    Active Entries
                  </p>

                  <p className="text-3xl font-bold mt-1">
                    {
                      entries.length
                    }
                  </p>

                </div>

                <div className="border rounded-xl p-5 bg-gray-50">

                  <p className="text-sm text-gray-500">
                    Deleted
                  </p>

                  <p className="text-3xl font-bold mt-1">
                    {
                      deletedEntries.length
                    }
                  </p>

                </div>

                <div className="border rounded-xl p-5 bg-gray-50">

                  <p className="text-sm text-gray-500">
                    CPI
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {calculations.cpi.toFixed(
                      2
                    )}
                  </p>

                </div>

                <div className="border rounded-xl p-5 bg-gray-50">

                  <p className="text-sm text-gray-500">
                    SPI
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {calculations.spi.toFixed(
                      2
                    )}
                  </p>

                </div>

              </div>

              {/* MANAGEMENT ACTIONS */}

              <div className="border rounded-xl p-5 mt-6">

                <h3 className="font-bold text-lg">
                  Management Actions
                </h3>

                <div className="flex flex-wrap gap-3 mt-4">

                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowManage(
                          false
                        );
                        openAddForm();
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg"
                    >
                      + Create Entry
                    </button>
                  )}

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowManage(
                          false
                        );
                        handleEditButton();
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg"
                    >
                      ✏️ Edit Entry
                    </button>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowManage(
                          false
                        );
                        setShowDeleted(
                          true
                        );
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg"
                    >
                      🗑️ Deleted / Restore
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={
                      handleRefresh
                    }
                    className="border border-gray-300 hover:bg-gray-50 px-4 py-2.5 rounded-lg"
                  >
                    ↻ Refresh Data
                  </button>

                </div>

              </div>

              {/* PERMISSIONS */}

              <div className="border rounded-xl p-5 mt-6">

                <h3 className="font-bold text-lg mb-4">
                  Permissions
                </h3>

                <div className="space-y-2">

                  {[
                    [
                      "View",
                      canView,
                    ],
                    [
                      "Create",
                      canCreate,
                    ],
                    [
                      "Edit",
                      canEdit,
                    ],
                    [
                      "Delete / Restore",
                      canDelete,
                    ],
                    [
                      "Manage",
                      canManage,
                    ],
                  ].map(
                    ([name, allowed]) => (

                      <div
                        key={
                          String(name)
                        }
                        className="flex justify-between border rounded-lg px-4 py-3"
                      >

                        <span>
                          {
                            String(
                              name
                            )
                          }
                        </span>

                        <span
                          className={
                            allowed
                              ? "text-green-600 font-semibold"
                              : "text-gray-400"
                          }
                        >
                          {allowed
                            ? "Allowed"
                            : "No Access"}
                        </span>

                      </div>

                    )
                  )}

                </div>

              </div>

            </div>

            <div className="border-t p-6 flex justify-end shrink-0">

              <button
                type="button"
                onClick={() =>
                  setShowManage(
                    false
                  )
                }
                className="border px-5 py-2.5 rounded-lg"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}