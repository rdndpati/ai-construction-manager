"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { getAccessibleProjects } from "@/lib/projectAccess";
import { hasPermission } from "@/lib/permissions";

// =========================================================
// TYPES
// =========================================================

type Project = {
  id: string;
  name: string;
};

type ContingencyEntry = {
  id: string;
  project_id: string;
  entry_type: string;
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
  deleted_at: string | null;
  created_by?: string | null;
  updated_at?: string | null;
};

type ContingencyPermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  manage: boolean;
};

// =========================================================
// PAGE
// =========================================================

export default function ContingencyPage() {
  const searchParams = useSearchParams();

  const projectFromUrl =
    searchParams.get("project");

  // =======================================================
  // PROJECTS
  // =======================================================

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [selectedProject, setSelectedProject] =
    useState(projectFromUrl || "");

  // =======================================================
  // DATA
  // =======================================================

  const [entries, setEntries] =
    useState<ContingencyEntry[]>([]);

  const [deletedEntries, setDeletedEntries] =
    useState<ContingencyEntry[]>([]);

  // =======================================================
  // PERMISSIONS
  // =======================================================

  const [permissions, setPermissions] =
    useState<ContingencyPermissions>({
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

  // =======================================================
  // PAGE STATE
  // =======================================================

  const [loading, setLoading] =
    useState(true);

  const [loadingEntries, setLoadingEntries] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [restoring, setRestoring] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  // =======================================================
  // MODALS
  // =======================================================

  const [showForm, setShowForm] =
    useState(false);

  const [showDeleted, setShowDeleted] =
    useState(false);

  const [showEditSelector, setShowEditSelector] =
    useState(false);

  const [showManage, setShowManage] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  // =======================================================
  // FORM
  // =======================================================

  const [entryType, setEntryType] =
    useState("Allocation");

  const [amount, setAmount] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState("Active");

  // =========================================================
  // LOCK BACKGROUND SCROLLING
  // =========================================================

  useEffect(() => {
    const modalOpen =
      showForm ||
      showDeleted ||
      showEditSelector ||
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
    showDeleted,
    showEditSelector,
    showManage,
  ]);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadPage();
  }, []);

  // =========================================================
  // LOAD PAGE
  // =========================================================

  async function loadPage() {
    try {
      setLoading(true);

      const result =
        await getAccessibleProjects();

      console.log(
        "CONTINGENCY ACCESSIBLE PROJECTS:",
        result
      );

      if (result.error) {
        console.error(
          "PROJECT ACCESS ERROR:",
          result.error
        );
      }

      const projectList =
        (result.projects as Project[]) ?? [];

      setProjects(projectList);

      // =====================================================
      // SELECT PROJECT
      // =====================================================

      if (projectList.length > 0) {
        setSelectedProject(
          (current) => {
            const currentStillAccessible =
              current &&
              projectList.some(
                (project) =>
                  project.id === current
              );

            return currentStillAccessible
              ? current
              : projectList[0].id;
          }
        );
      } else {
        setSelectedProject("");
      }

      // =====================================================
      // PERMISSIONS
      // =====================================================

      const [
        view,
        create,
        edit,
        deletePermission,
        manage,
      ] = await Promise.all([
        hasPermission(
          "Contingency",
          "view"
        ),

        hasPermission(
          "Contingency",
          "create"
        ),

        hasPermission(
          "Contingency",
          "edit"
        ),

        hasPermission(
          "Contingency",
          "delete"
        ),

        hasPermission(
          "Contingency",
          "manage"
        ),
      ]);

      console.log(
        "CONTINGENCY PERMISSIONS:",
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
        "CONTINGENCY PAGE LOAD ERROR:",
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

  // =========================================================
  // LOAD PROJECT DATA
  // =========================================================

  useEffect(() => {
    if (!selectedProject) {
      setEntries([]);
      setDeletedEntries([]);
      return;
    }

    if (!canView) {
      setEntries([]);
      setDeletedEntries([]);
      return;
    }

    loadProjectData();
  }, [
    selectedProject,
    canView,
  ]);

  // =========================================================
  // LOAD PROJECT DATA
  // =========================================================

  async function loadProjectData() {
    try {
      setLoadingEntries(true);

      await Promise.all([
        loadEntries(),
        loadDeletedEntries(),
      ]);
    } finally {
      setLoadingEntries(false);
    }
  }

  // =========================================================
  // LOAD ACTIVE ENTRIES
  // =========================================================

  async function loadEntries() {
    if (!selectedProject) {
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("contingency_entries")
      .select("*")
      .eq(
        "project_id",
        selectedProject
      )
      .is(
        "deleted_at",
        null
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        "CONTINGENCY LOAD ERROR:",
        error
      );

      setEntries([]);
      return;
    }

    setEntries(
      (data as ContingencyEntry[]) ??
        []
    );
  }

  // =========================================================
  // LOAD DELETED ENTRIES
  // =========================================================

  async function loadDeletedEntries() {
    if (!selectedProject) {
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("contingency_entries")
      .select("*")
      .eq(
        "project_id",
        selectedProject
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
        "DELETED CONTINGENCY LOAD ERROR:",
        error
      );

      setDeletedEntries([]);
      return;
    }

    setDeletedEntries(
      (data as ContingencyEntry[]) ??
        []
    );
  }

  // =========================================================
  // VIEW BUTTON
  // =========================================================

  function handleViewButton() {
    if (!canView) {
      alert(
        "You do not have permission to view Contingency."
      );

      return;
    }

    setTimeout(() => {
      document
        .getElementById(
          "contingency-table"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  // =========================================================
  // CREATE BUTTON
  // =========================================================

  function handleCreateButton() {
    openAddForm();
  }

  // =========================================================
  // EDIT BUTTON
  // =========================================================

  function handleEditButton() {
    if (!canEdit) {
      alert(
        "You do not have permission to edit Contingency entries."
      );

      return;
    }

    if (entries.length === 0) {
      alert(
        "There are no active Contingency entries to edit."
      );

      return;
    }

    setShowEditSelector(true);
  }

  // =========================================================
  // DELETE / RESTORE BUTTON
  // =========================================================

  function handleDeleteRestoreButton() {
    if (!canDelete) {
      alert(
        "You do not have permission to delete or restore Contingency entries."
      );

      return;
    }

    setShowDeleted(true);
  }

  // =========================================================
  // MANAGE BUTTON
  // =========================================================

  function handleManageButton() {
    if (!canManage) {
      alert(
        "You do not have permission to manage Contingency."
      );

      return;
    }

    setShowManage(true);
  }

  // =========================================================
  // REFRESH
  // =========================================================

  async function handleRefresh() {
    if (!canView) {
      return;
    }

    await loadProjectData();
  }

  // =========================================================
  // OPEN ADD FORM
  // =========================================================

  function openAddForm() {
    if (!canCreate) {
      alert(
        "You do not have permission to create Contingency entries."
      );

      return;
    }

    setEditingId(null);

    setEntryType(
      "Allocation"
    );

    setAmount("");

    setDescription("");

    setStatus("Active");

    setShowForm(true);
  }

  // =========================================================
  // OPEN EDIT FORM
  // =========================================================

  function openEditForm(
    entry: ContingencyEntry
  ) {
    if (!canEdit) {
      alert(
        "You do not have permission to edit Contingency entries."
      );

      return;
    }

    if (entry.deleted_at) {
      alert(
        "Deleted Contingency entries cannot be edited. Restore the entry first."
      );

      return;
    }

    setEditingId(
      entry.id
    );

    setEntryType(
      entry.entry_type
    );

    setAmount(
      String(
        entry.amount ?? 0
      )
    );

    setDescription(
      entry.description ?? ""
    );

    setStatus(
      entry.status
    );

    setShowForm(true);
  }

  // =========================================================
  // SELECT ENTRY FOR EDIT
  // =========================================================

  function selectEntryForEdit(
    entry: ContingencyEntry
  ) {
    setShowEditSelector(false);

    openEditForm(entry);
  }

  // =========================================================
  // SAVE
  // =========================================================

  async function handleSave() {
    if (
      editingId &&
      !canEdit
    ) {
      alert(
        "You do not have permission to edit Contingency entries."
      );

      return;
    }

    if (
      !editingId &&
      !canCreate
    ) {
      alert(
        "You do not have permission to create Contingency entries."
      );

      return;
    }

    if (!selectedProject) {
      alert(
        "Please select a project."
      );

      return;
    }

    if (
      !amount ||
      Number(amount) <= 0
    ) {
      alert(
        "Please enter a valid amount."
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

      // ===================================================
      // UPDATE
      // ===================================================

      if (editingId) {
        const {
          error,
        } = await supabase
          .from(
            "contingency_entries"
          )
          .update({
            entry_type:
              entryType,

            amount:
              Number(amount),

            description:
              description.trim() ||
              null,

            status,

            updated_at:
              new Date().toISOString(),
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
            "CONTINGENCY UPDATE ERROR:",
            error
          );

          alert(
            error.message
          );

          return;
        }

        alert(
          "Contingency entry updated successfully."
        );
      }

      // ===================================================
      // CREATE
      // ===================================================

      else {
        const {
          error,
        } = await supabase
          .from(
            "contingency_entries"
          )
          .insert({
            project_id:
              selectedProject,

            entry_type:
              entryType,

            amount:
              Number(amount),

            description:
              description.trim() ||
              null,

            status,

            created_by:
              user.id,

            deleted_at:
              null,
          });

        if (error) {
          console.error(
            "CONTINGENCY CREATE ERROR:",
            error
          );

          alert(
            error.message
          );

          return;
        }

        alert(
          "Contingency entry created successfully."
        );
      }

      setEditingId(null);

      setAmount("");

      setDescription("");

      setEntryType(
        "Allocation"
      );

      setStatus(
        "Active"
      );

      setShowForm(false);

      await Promise.all([
        loadEntries(),
        loadDeletedEntries(),
      ]);
    } catch (error: any) {
      console.error(
        "CONTINGENCY SAVE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to save contingency entry."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // DELETE
  // =========================================================

  async function handleDelete(
    id: string
  ) {
    if (!canDelete) {
      alert(
        "You do not have permission to delete Contingency entries."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this contingency entry? It will move to the Deleted list and can be restored later."
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
          "contingency_entries"
        )
        .update({
          deleted_at:
            new Date().toISOString(),

          updated_at:
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
          "CONTINGENCY DELETE ERROR:",
          error
        );

        alert(
          error.message
        );

        return;
      }

      setEntries(
        (previous) =>
          previous.filter(
            (entry) =>
              entry.id !== id
          )
      );

      await loadDeletedEntries();

      alert(
        "Contingency entry moved to Deleted."
      );
    } catch (error: any) {
      console.error(
        "CONTINGENCY DELETE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to delete contingency entry."
      );
    } finally {
      setDeleting(false);
    }
  }

  // =========================================================
  // RESTORE
  // =========================================================

  async function restoreEntry(
    id: string
  ) {
    if (!canDelete && !canManage) {
      alert(
        "You do not have permission to restore Contingency entries."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Restore this contingency entry?"
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
          "contingency_entries"
        )
        .update({
          deleted_at:
            null,

          updated_at:
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
        .not(
          "deleted_at",
          "is",
          null
        );

      if (error) {
        console.error(
          "CONTINGENCY RESTORE ERROR:",
          error
        );

        alert(
          error.message
        );

        return;
      }

      await Promise.all([
        loadEntries(),
        loadDeletedEntries(),
      ]);

      alert(
        "Contingency entry restored successfully."
      );
    } catch (error: any) {
      console.error(
        "CONTINGENCY RESTORE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to restore contingency entry."
      );
    } finally {
      setRestoring(false);
    }
  }

  // =========================================================
  // CALCULATIONS
  // =========================================================

  const allocated =
    useMemo(() => {
      return entries
        .filter(
          (entry) =>
            entry.entry_type ===
            "Allocation"
        )
        .reduce(
          (total, entry) =>
            total +
            Number(
              entry.amount || 0
            ),
          0
        );
    }, [entries]);

  const used =
    useMemo(() => {
      return entries
        .filter(
          (entry) =>
            entry.entry_type ===
            "Usage"
        )
        .reduce(
          (total, entry) =>
            total +
            Number(
              entry.amount || 0
            ),
          0
        );
    }, [entries]);

  const transfers =
    useMemo(() => {
      return entries
        .filter(
          (entry) =>
            entry.entry_type ===
            "Transfer"
        )
        .reduce(
          (total, entry) =>
            total +
            Number(
              entry.amount || 0
            ),
          0
        );
    }, [entries]);

  const adjustments =
    useMemo(() => {
      return entries
        .filter(
          (entry) =>
            entry.entry_type ===
            "Adjustment"
        )
        .reduce(
          (total, entry) =>
            total +
            Number(
              entry.amount || 0
            ),
          0
        );
    }, [entries]);

  const remaining =
    allocated -
    used -
    transfers +
    adjustments;

  const utilization =
    allocated > 0
      ? (used / allocated) * 100
      : 0;

  // =========================================================
  // CURRENCY
  // =========================================================

  function money(
    value: number
  ) {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }
    ).format(value || 0);
  }

  // =========================================================
  // STATUS STYLE
  // =========================================================

  function statusClass(
    currentStatus: string
  ) {
    if (
      currentStatus ===
      "Approved"
    ) {
      return "bg-green-100 text-green-700";
    }

    if (
      currentStatus ===
        "Closed"
    ) {
      return "bg-gray-100 text-gray-700";
    }

    if (
      currentStatus ===
      "Pending"
    ) {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-blue-100 text-blue-700";
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="p-8">

        <div className="bg-white border rounded-xl p-8">
          Loading Contingency...
        </div>

      </main>
    );
  }

  // =========================================================
  // NO VIEW
  // =========================================================

  if (!canView) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">

        <div className="max-w-xl mx-auto bg-white border rounded-xl p-10 text-center shadow-sm">

          <div className="text-5xl mb-4">
            🔒
          </div>

          <h1 className="text-2xl font-bold">
            Contingency Access Restricted
          </h1>

          <p className="text-gray-500 mt-3">
            You do not have permission
            to view Contingency.
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

  // =========================================================
  // NO PROJECTS
  // =========================================================

  if (projects.length === 0) {
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

  // =========================================================
  // PROJECT NAME
  // =========================================================

  const selectedProjectName =
    projects.find(
      (project) =>
        project.id ===
        selectedProject
    )?.name ||
    "Project";

  // =========================================================
  // PAGE
  // =========================================================

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
            Contingency
          </h1>

          <p className="text-gray-500 mt-2">
            Manage project contingency
            allocations, usage,
            transfers, and adjustments.
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
                  {project.name}
                </option>
              )
            )}

          </select>

        </div>

      </div>

      {/* =====================================================
          TOP ACTION BUTTONS
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
          Loading contingency data...
        </div>
      )}

      {/* =====================================================
          KPI
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Total Allocated
          </p>

          <p className="text-3xl font-bold mt-2">
            {money(
              allocated
            )}
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Used
          </p>

          <p className="text-3xl font-bold mt-2 text-orange-600">
            {money(
              used
            )}
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Remaining
          </p>

          <p
            className={`text-3xl font-bold mt-2 ${
              remaining < 0
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {money(
              remaining
            )}
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Utilization
          </p>

          <p className="text-3xl font-bold mt-2">
            {utilization.toFixed(
              1
            )}
            %
          </p>

          <div className="h-2 bg-gray-100 rounded-full mt-4">

            <div
              className={`h-2 rounded-full ${
                utilization > 90
                  ? "bg-red-500"
                  : utilization > 70
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{
                width: `${Math.min(
                  Math.max(
                    utilization,
                    0
                  ),
                  100
                )}%`,
              }}
            />

          </div>

        </div>

      </div>

      {/* =====================================================
          SECONDARY SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

        <div className="bg-white border rounded-xl p-5">

          <p className="text-sm text-gray-500">
            Transfers
          </p>

          <p className="text-2xl font-bold mt-2">
            {money(
              transfers
            )}
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5">

          <p className="text-sm text-gray-500">
            Adjustments
          </p>

          <p className="text-2xl font-bold mt-2">
            {money(
              adjustments
            )}
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5">

          <p className="text-sm text-gray-500">
            Active Entries
          </p>

          <p className="text-2xl font-bold mt-2">
            {
              entries.length
            }
          </p>

        </div>

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div
        id="contingency-table"
        className="bg-white border rounded-xl overflow-hidden"
      >

        <div className="p-5 border-b flex justify-between items-center">

          <div>

            <h2 className="text-xl font-bold">
              Contingency Transactions
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Active allocation and usage history.
            </p>

          </div>

          <div className="flex gap-3">

            {canDelete && (
              <button
                type="button"
                onClick={() =>
                  setShowDeleted(
                    true
                  )
                }
                className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium"
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
                  openAddForm
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                + Add Entry
              </button>
            )}

          </div>

        </div>

        {/* ===================================================
            ACTIVE TABLE
        =================================================== */}

        {entries.length ===
        0 ? (

          <div className="p-12 text-center">

            <div className="text-4xl mb-3">
              🛡️
            </div>

            <h3 className="font-semibold text-lg">
              No contingency entries
            </h3>

            <p className="text-gray-500 mt-1">
              {canCreate
                ? "Add an allocation or contingency usage to start tracking this project."
                : "There are no contingency entries available for this project."}
            </p>

            {canCreate && (
              <button
                type="button"
                onClick={
                  openAddForm
                }
                className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
              >
                + Add Contingency
              </button>
            )}

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px]">

              <thead className="bg-gray-50 border-b">

                <tr>

                  <th className="text-left p-4">
                    Type
                  </th>

                  <th className="text-left p-4">
                    Description
                  </th>

                  <th className="text-right p-4">
                    Amount
                  </th>

                  <th className="text-left p-4">
                    Status
                  </th>

                  <th className="text-left p-4">
                    Date
                  </th>

                  <th className="text-right p-4">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {entries.map(
                  (entry) => (

                    <tr
                      key={
                        entry.id
                      }
                      className="border-b hover:bg-gray-50"
                    >

                      <td className="p-4">

                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {
                            entry.entry_type
                          }
                        </span>

                      </td>

                      <td className="p-4">

                        {
                          entry.description ||
                          "—"
                        }

                      </td>

                      <td className="p-4 text-right font-semibold">

                        {money(
                          Number(
                            entry.amount ||
                              0
                          )
                        )}

                      </td>

                      <td className="p-4">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(
                            entry.status
                          )}`}
                        >
                          {
                            entry.status
                          }
                        </span>

                      </td>

                      <td className="p-4 text-gray-500">

                        {new Date(
                          entry.created_at
                        ).toLocaleDateString()}

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
                                handleDelete(
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

                  )
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="flex justify-between items-center border-b p-6 shrink-0">

              <div>

                <h2 className="text-2xl font-bold">
                  Select Entry to Edit
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Choose the contingency entry you want to modify.
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
                      type="button"
                      key={
                        entry.id
                      }
                      onClick={() =>
                        selectEntryForEdit(
                          entry
                        )
                      }
                      className="w-full text-left border rounded-xl p-4 hover:bg-blue-50 hover:border-blue-300 transition"
                    >

                      <div className="flex justify-between gap-5">

                        <div>

                          <p className="font-bold text-blue-700">
                            {
                              entry.entry_type
                            }
                          </p>

                          <p className="font-semibold mt-1">
                            {
                              entry.description ||
                              "No description"
                            }
                          </p>

                        </div>

                        <div className="text-right">

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(
                              entry.status
                            )}`}
                          >
                            {
                              entry.status
                            }
                          </span>

                          <p className="font-bold mt-2">
                            {money(
                              Number(
                                entry.amount ||
                                  0
                              )
                            )}
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

            <div className="flex justify-between items-center border-b p-6 shrink-0">

              <div>

                <h2 className="text-2xl font-bold">
                  Delete / Restore Contingency
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Deleted entries can be restored from this list.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowDeleted(false)
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
                    No deleted contingency entries
                  </p>

                  <p className="text-gray-500 text-sm mt-2">
                    Deleted records will appear here.
                  </p>

                </div>

              ) : (

                <div className="border rounded-xl overflow-hidden">

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[900px]">

                      <thead className="bg-gray-100 border-b">

                        <tr>

                          <th className="text-left p-4">
                            Type
                          </th>

                          <th className="text-left p-4">
                            Description
                          </th>

                          <th className="text-right p-4">
                            Amount
                          </th>

                          <th className="text-left p-4">
                            Status
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

                              <td className="p-4">

                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                  {
                                    entry.entry_type
                                  }
                                </span>

                              </td>

                              <td className="p-4">

                                {
                                  entry.description ||
                                  "—"
                                }

                              </td>

                              <td className="p-4 text-right font-semibold">

                                {money(
                                  Number(
                                    entry.amount ||
                                      0
                                  )
                                )}

                              </td>

                              <td className="p-4">

                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(
                                    entry.status
                                  )}`}
                                >
                                  {
                                    entry.status
                                  }
                                </span>

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
                                    restoreEntry(
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

            <div className="flex justify-between items-center border-b p-6 shrink-0">

              <div>

                <h2 className="text-2xl font-bold">
                  Contingency Management
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Manage contingency records and access.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowManage(false)
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
                    Active
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
                    Allocated
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {money(
                      allocated
                    )}
                  </p>

                </div>

                <div className="border rounded-xl p-5 bg-gray-50">

                  <p className="text-sm text-gray-500">
                    Remaining
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {money(
                      remaining
                    )}
                  </p>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="border rounded-xl p-5 mt-6">

                <h3 className="font-bold text-lg">
                  Management Actions
                </h3>

                <div className="flex flex-wrap gap-3 mt-4">

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
                    ✏️ Edit
                  </button>

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
                    🗑️ Deleted
                  </button>

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

      {/* =====================================================
          ADD / EDIT MODAL
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
              setShowForm(false);
            }
          }}
        >

          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="p-6 border-b flex justify-between items-center shrink-0">

              <div>

                <h2 className="text-2xl font-bold">
                  {editingId
                    ? "Edit Contingency Entry"
                    : "Add Contingency Entry"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {
                    selectedProjectName
                  }
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowForm(
                    false
                  )
                }
                className="text-gray-500 hover:text-gray-900 text-3xl w-10 h-10 rounded-lg hover:bg-gray-100"
              >
                ×
              </button>

            </div>

            {/* FORM BODY */}

            <div className="p-6 space-y-5 overflow-y-auto overscroll-contain">

              {/* ENTRY TYPE */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Entry Type
                </label>

                <select
                  value={
                    entryType
                  }
                  onChange={(e) =>
                    setEntryType(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg px-3 py-3 bg-white"
                >

                  <option value="Allocation">
                    Allocation
                  </option>

                  <option value="Usage">
                    Usage
                  </option>

                  <option value="Transfer">
                    Transfer
                  </option>

                  <option value="Adjustment">
                    Adjustment
                  </option>

                </select>

              </div>

              {/* AMOUNT */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Amount
                </label>

                <div className="relative">

                  <span className="absolute left-3 top-3 text-gray-500">
                    $
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      amount
                    }
                    onChange={(e) =>
                      setAmount(
                        e.target.value
                      )
                    }
                    placeholder="0.00"
                    className="w-full border rounded-lg pl-8 pr-3 py-3"
                  />

                </div>

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Description
                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows={5}
                  placeholder="Describe the contingency item..."
                  className="w-full border rounded-lg px-3 py-3 resize-y"
                />

              </div>

              {/* STATUS */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Status
                </label>

                <select
                  value={
                    status
                  }
                  onChange={(e) =>
                    setStatus(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg px-3 py-3 bg-white"
                >

                  <option value="Active">
                    Active
                  </option>

                  <option value="Approved">
                    Approved
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Closed">
                    Closed
                  </option>

                </select>

              </div>

            </div>

            {/* FOOTER */}

            <div className="p-6 border-t flex justify-end gap-3 shrink-0">

              <button
                type="button"
                onClick={() => {
                  setShowForm(
                    false
                  );

                  setEditingId(
                    null
                  );
                }}
                className="border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-lg"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleSave
                }
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

          </div>

        </div>
      )}

    </main>
  );
}