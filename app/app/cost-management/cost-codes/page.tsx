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

type CostCode = {
  id: string;
  project_id: string;
  code: string;
  description: string;
  category: string;
  notes: string | null;
  deleted_at: string | null;
  created_at?: string;
  updated_at?: string;
};

type CostCodePermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  manage: boolean;
};

// =========================================================
// CATEGORIES
// =========================================================

const CATEGORIES = [
  "General",
  "Civil",
  "Structural",
  "Architectural",
  "Electrical",
  "Mechanical",
  "Plumbing",
  "Communications",
  "Safety",
  "Other",
];

// =========================================================
// PAGE
// =========================================================

export default function CostCodesPage() {
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
  // COST CODES
  // =======================================================

  const [costCodes, setCostCodes] =
    useState<CostCode[]>([]);

  const [deletedCostCodes, setDeletedCostCodes] =
    useState<CostCode[]>([]);

  // =======================================================
  // SELECTED COST CODE
  // =======================================================

  const [selectedCostCode, setSelectedCostCode] =
    useState<CostCode | null>(null);

  // =======================================================
  // FILTERS
  // =======================================================

  const [search, setSearch] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  // =======================================================
  // PERMISSIONS
  // =======================================================

  const [permissions, setPermissions] =
    useState<CostCodePermissions>({
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

  const [loadingCodes, setLoadingCodes] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [restoringId, setRestoringId] =
    useState<string | null>(null);

  // =======================================================
  // MODALS
  // =======================================================

  const [showForm, setShowForm] =
    useState(false);

  const [showDeleted, setShowDeleted] =
    useState(false);

  const [showView, setShowView] =
    useState(false);

  const [showManage, setShowManage] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  // =======================================================
  // FORM
  // =======================================================

  const [form, setForm] =
    useState({
      code: "",
      description: "",
      category: "General",
      notes: "",
    });

  // =========================================================
  // MODAL SCROLL LOCK
  //
  // Prevent the background page from scrolling while
  // a modal is open.
  // =========================================================

  useEffect(() => {
    const modalOpen =
      showForm ||
      showDeleted ||
      showView ||
      showManage;

    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [
    showForm,
    showDeleted,
    showView,
    showManage,
  ]);

  // =========================================================
  // ESC KEY
  // =========================================================

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key !== "Escape") {
        return;
      }

      if (showForm) {
        setShowForm(false);
        setEditingId(null);
        return;
      }

      if (showView) {
        setShowView(false);
        return;
      }

      if (showManage) {
        setShowManage(false);
        return;
      }

      if (showDeleted) {
        setShowDeleted(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    showForm,
    showView,
    showManage,
    showDeleted,
  ]);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadPage();
  }, []);

  // =========================================================
  // LOAD PROJECTS + PERMISSIONS
  // =========================================================

  async function loadPage() {
    try {
      setLoading(true);

      // =====================================================
      // PROJECT ACCESS
      // =====================================================

      const result =
        await getAccessibleProjects();

      console.log(
        "COST CODE ACCESSIBLE PROJECTS:",
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
      // SELECT ACCESSIBLE PROJECT
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
          "Cost Codes",
          "view"
        ),

        hasPermission(
          "Cost Codes",
          "create"
        ),

        hasPermission(
          "Cost Codes",
          "edit"
        ),

        hasPermission(
          "Cost Codes",
          "delete"
        ),

        hasPermission(
          "Cost Codes",
          "manage"
        ),
      ]);

      console.log(
        "COST CODE PERMISSIONS:",
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
        "COST CODE PAGE LOAD ERROR:",
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
  // LOAD COST CODES WHEN PROJECT CHANGES
  // =========================================================

  useEffect(() => {
    if (!selectedProject) {
      setCostCodes([]);
      setDeletedCostCodes([]);
      setSelectedCostCode(null);
      return;
    }

    if (!canView) {
      setCostCodes([]);
      setDeletedCostCodes([]);
      setSelectedCostCode(null);
      return;
    }

    setSelectedCostCode(null);

    loadAllCostCodes();
  }, [
    selectedProject,
    canView,
  ]);

  // =========================================================
  // LOAD ACTIVE + DELETED
  // =========================================================

  async function loadAllCostCodes() {
    if (!selectedProject) {
      return;
    }

    try {
      setLoadingCodes(true);

      await Promise.all([
        loadCostCodes(
          selectedProject
        ),

        loadDeletedCostCodes(
          selectedProject
        ),
      ]);
    } finally {
      setLoadingCodes(false);
    }
  }

  // =========================================================
  // LOAD ACTIVE
  // =========================================================

  async function loadCostCodes(
    projectId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("cost_codes")
      .select("*")
      .eq(
        "project_id",
        projectId
      )
      .is(
        "deleted_at",
        null
      )
      .order("code");

    if (error) {
      console.error(
        "COST CODE LOAD ERROR:",
        error
      );

      setCostCodes([]);

      return;
    }

    setCostCodes(
      (data as CostCode[]) ??
        []
    );
  }

  // =========================================================
  // LOAD DELETED
  // =========================================================

  async function loadDeletedCostCodes(
    projectId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("cost_codes")
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
        "DELETED COST CODE LOAD ERROR:",
        error
      );

      setDeletedCostCodes([]);

      return;
    }

    setDeletedCostCodes(
      (data as CostCode[]) ??
        []
    );
  }

  // =========================================================
  // SELECT COST CODE
  // =========================================================

  function selectCostCode(
    costCode: CostCode
  ) {
    setSelectedCostCode(
      costCode
    );
  }

  // =========================================================
  // VIEW SELECTED
  // =========================================================

  function openViewSelected() {
    if (!canView) {
      alert(
        "You do not have permission to view Cost Codes."
      );
      return;
    }

    if (!selectedCostCode) {
      alert(
        "Please select a Cost Code first."
      );
      return;
    }

    setShowView(true);
  }

  // =========================================================
  // OPEN ADD
  // =========================================================

  function openAddForm() {
    if (!canCreate) {
      alert(
        "You do not have permission to create Cost Codes."
      );

      return;
    }

    setEditingId(null);

    setForm({
      code: "",
      description: "",
      category: "General",
      notes: "",
    });

    setShowForm(true);
  }

  // =========================================================
  // OPEN EDIT
  // =========================================================

  function openEditForm(
    costCode?: CostCode
  ) {
    const target =
      costCode ??
      selectedCostCode;

    if (!canEdit) {
      alert(
        "You do not have permission to edit Cost Codes."
      );

      return;
    }

    if (!target) {
      alert(
        "Please select a Cost Code first."
      );

      return;
    }

    if (target.deleted_at) {
      alert(
        "Deleted Cost Codes cannot be edited. Restore the Cost Code first."
      );

      return;
    }

    setSelectedCostCode(
      target
    );

    setEditingId(
      target.id
    );

    setForm({
      code:
        target.code,

      description:
        target.description,

      category:
        target.category,

      notes:
        target.notes ??
        "",
    });

    setShowForm(true);
  }

  // =========================================================
  // SAVE COST CODE
  // =========================================================

  async function saveCostCode() {
    if (editingId) {
      if (!canEdit) {
        alert(
          "You do not have permission to edit Cost Codes."
        );

        return;
      }
    } else {
      if (!canCreate) {
        alert(
          "You do not have permission to create Cost Codes."
        );

        return;
      }
    }

    if (!selectedProject) {
      alert(
        "Please select a project."
      );

      return;
    }

    if (!form.code.trim()) {
      alert(
        "Please enter a cost code."
      );

      return;
    }

    if (!form.description.trim()) {
      alert(
        "Please enter a description."
      );

      return;
    }

    try {
      setSaving(true);

      // ===================================================
      // EDIT
      // ===================================================

      if (editingId) {
        const {
          error,
        } = await supabase
          .from("cost_codes")
          .update({
            code:
              form.code.trim(),

            description:
              form.description.trim(),

            category:
              form.category,

            notes:
              form.notes.trim() ||
              null,

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
            "UPDATE COST CODE ERROR:",
            error
          );

          alert(
            error.message
          );

          return;
        }
      }

      // ===================================================
      // CREATE
      // ===================================================

      else {
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

        const {
          error,
        } = await supabase
          .from("cost_codes")
          .insert({
            project_id:
              selectedProject,

            code:
              form.code.trim(),

            description:
              form.description.trim(),

            category:
              form.category,

            notes:
              form.notes.trim() ||
              null,

            created_by:
              user.id,

            deleted_at:
              null,
          });

        if (error) {
          console.error(
            "INSERT COST CODE ERROR:",
            error
          );

          if (
            error.code ===
            "23505"
          ) {
            alert(
              "This cost code already exists for this project."
            );
          } else {
            alert(
              error.message
            );
          }

          return;
        }
      }

      setShowForm(false);
      setEditingId(null);

      setForm({
        code: "",
        description: "",
        category: "General",
        notes: "",
      });

      await loadAllCostCodes();
    } catch (error: any) {
      console.error(
        "SAVE COST CODE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to save cost code."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // DELETE
  // =========================================================

  async function deleteCostCode(
    id?: string
  ) {
    if (!canDelete) {
      alert(
        "You do not have permission to delete Cost Codes."
      );

      return;
    }

    const target =
      id
        ? costCodes.find(
            (item) =>
              item.id === id
          )
        : selectedCostCode;

    if (!target) {
      alert(
        "Please select a Cost Code first."
      );

      return;
    }

    if (target.deleted_at) {
      await restoreCostCode(
        target.id
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete cost code "${target.code}"? It will be moved to the Deleted list and can be restored later.`
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        data,
        error,
      } = await supabase
        .from("cost_codes")
        .update({
          deleted_at:
            new Date().toISOString(),

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          target.id
        )
        .eq(
          "project_id",
          selectedProject
        )
        .is(
          "deleted_at",
          null
        )
        .select(
          "id, deleted_at"
        )
        .maybeSingle();

      if (error) {
        console.error(
          "SOFT DELETE COST CODE ERROR:",
          error
        );

        alert(
          error.message
        );

        return;
      }

      if (!data) {
        alert(
          "The Cost Code was not deleted. Supabase did not update a record. Check your Row Level Security policies."
        );

        return;
      }

      setCostCodes(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              target.id
          )
      );

      setSelectedCostCode(
        null
      );

      await loadDeletedCostCodes(
        selectedProject
      );
    } catch (error: any) {
      console.error(
        "DELETE COST CODE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to delete cost code."
      );
    }
  }

  // =========================================================
  // RESTORE
  // =========================================================

  async function restoreCostCode(
    id?: string
  ) {
    if (!canDelete) {
      alert(
        "You do not have permission to restore Cost Codes."
      );

      return;
    }

    const target =
      id
        ? deletedCostCodes.find(
            (item) =>
              item.id === id
          )
        : selectedCostCode;

    if (!target) {
      alert(
        "Please select a deleted Cost Code first."
      );

      return;
    }

    if (!target.deleted_at) {
      alert(
        "This Cost Code is already active."
      );

      return;
    }

    if (restoringId) {
      return;
    }

    const confirmed =
      window.confirm(
        `Restore cost code "${target.code}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setRestoringId(
        target.id
      );

      const {
        data,
        error,
      } = await supabase
        .from("cost_codes")
        .update({
          deleted_at:
            null,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          target.id
        )
        .eq(
          "project_id",
          selectedProject
        )
        .not(
          "deleted_at",
          "is",
          null
        )
        .select(
          "id, project_id, code, description, category, notes, deleted_at"
        )
        .maybeSingle();

      if (error) {
        console.error(
          "RESTORE COST CODE ERROR:",
          error
        );

        alert(
          `Restore failed: ${error.message}`
        );

        return;
      }

      if (!data) {
        alert(
          "Restore did not update the record. The Cost Code may no longer be deleted, may belong to another project, or your Supabase Row Level Security policy may be blocking the update."
        );

        return;
      }

      setDeletedCostCodes(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              target.id
          )
      );

      await loadCostCodes(
        selectedProject
      );

      await loadDeletedCostCodes(
        selectedProject
      );

      setSelectedCostCode(
        null
      );

      setShowDeleted(false);

      alert(
        "Cost Code restored successfully."
      );
    } catch (error: any) {
      console.error(
        "RESTORE COST CODE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to restore cost code."
      );
    } finally {
      setRestoringId(null);
    }
  }

  // =========================================================
  // TOP DELETE / RESTORE
  // =========================================================

  function handleDeleteRestore() {
    if (!selectedCostCode) {
      alert(
        "Please select a Cost Code first."
      );

      return;
    }

    if (
      selectedCostCode.deleted_at
    ) {
      restoreCostCode(
        selectedCostCode.id
      );
    } else {
      deleteCostCode(
        selectedCostCode.id
      );
    }
  }

  // =========================================================
  // MANAGE
  // =========================================================

  function openManage() {
    if (!canManage) {
      alert(
        "You do not have permission to manage Cost Codes."
      );

      return;
    }

    setShowManage(true);
  }

  // =========================================================
  // EXPORT CSV
  // =========================================================

  function exportCSV() {
    if (
      filteredCodes.length ===
      0
    ) {
      alert(
        "There are no active cost codes to export."
      );

      return;
    }

    const headers = [
      "Cost Code",
      "Description",
      "Category",
      "Notes",
    ];

    const rows =
      filteredCodes.map(
        (item) => [
          item.code,
          item.description,
          item.category,
          item.notes ?? "",
        ]
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map(
        (row) =>
          row
            .map(
              (value) =>
                `"${String(
                  value
                ).replace(
                  /"/g,
                  '""'
                )}"`
            )
            .join(",")
      )
      .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `${selectedProjectName
        .replace(
          /\s+/g,
          "_"
        )}_Cost_Codes.csv`;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );
  }

  // =========================================================
  // FILTER
  // =========================================================

  const filteredCodes =
    useMemo(() => {
      return costCodes.filter(
        (item) => {
          const text =
            `${item.code} ${item.description} ${item.category} ${item.notes ?? ""}`
              .toLowerCase();

          const matchesSearch =
            text.includes(
              search.toLowerCase()
            );

          const matchesCategory =
            categoryFilter ===
              "All" ||
            item.category ===
              categoryFilter;

          return (
            matchesSearch &&
            matchesCategory
          );
        }
      );
    }, [
      costCodes,
      search,
      categoryFilter,
    ]);

  // =========================================================
  // PROJECT NAME
  // =========================================================

  const selectedProjectName =
    projects.find(
      (project) =>
        project.id ===
        selectedProject
    )?.name ?? "";

  // =========================================================
  // STATUS OF SELECTED
  // =========================================================

  const selectedIsDeleted =
    Boolean(
      selectedCostCode?.deleted_at
    );

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">
        <div className="bg-white border rounded-xl p-8">
          Loading Cost Codes...
        </div>
      </main>
    );
  }

  // =========================================================
  // NO VIEW PERMISSION
  // =========================================================

  if (!canView) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-xl mx-auto bg-white border rounded-xl p-10 text-center shadow-sm">

          <div className="text-5xl mb-4">
            🔒
          </div>

          <h1 className="text-2xl font-bold">
            Cost Codes Access Restricted
          </h1>

          <p className="text-gray-500 mt-3">
            You do not have permission
            to view Cost Codes.
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
            You currently don't
            have access to any
            projects.
          </p>

        </div>

      </main>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="p-8 bg-gray-50 min-h-screen">

      {/* =====================================================
          BACK
      ===================================================== */}

      <Link
        href={`/app/cost-management?project=${selectedProject}`}
        className="text-blue-600 hover:underline"
      >
        ← Back to Cost Management
      </Link>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex justify-between items-start mt-6 mb-8 gap-6">

        <div>

          <h1 className="text-4xl font-bold">
            Cost Codes
          </h1>

          <p className="text-gray-500 mt-2">
            Manage the cost structure
            for your projects.
          </p>

          {/* =================================================
              WORKING ACTION BUTTONS
          ================================================= */}

          <div className="flex gap-2 flex-wrap mt-4">

            {/* VIEW */}

            {canView && (
              <button
                type="button"
                onClick={
                  openViewSelected
                }
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  selectedCostCode
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-blue-50 text-blue-400"
                }`}
              >
                👁️ View
              </button>
            )}

            {/* CREATE */}

            {canCreate && (
              <button
                type="button"
                onClick={
                  openAddForm
                }
                className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-full text-sm font-semibold transition"
              >
                + Create
              </button>
            )}

            {/* EDIT */}

            {canEdit && (
              <button
                type="button"
                onClick={() =>
                  openEditForm()
                }
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  selectedCostCode &&
                  !selectedIsDeleted
                    ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    : "bg-purple-50 text-purple-400"
                }`}
              >
                ✏️ Edit
              </button>
            )}

            {/* DELETE / RESTORE */}

            {canDelete && (
              <button
                type="button"
                onClick={
                  handleDeleteRestore
                }
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  selectedCostCode
                    ? selectedIsDeleted
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-red-50 text-red-400"
                }`}
              >
                {selectedIsDeleted
                  ? "♻️ Restore"
                  : "🗑️ Delete / Restore"}
              </button>
            )}

            {/* MANAGE */}

            {canManage && (
              <button
                type="button"
                onClick={
                  openManage
                }
                className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-semibold transition"
              >
                ⚙️ Manage
              </button>
            )}

          </div>

        </div>

        {/* ===================================================
            PROJECT
        =================================================== */}

        <div>

          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Project
          </label>

          <select
            value={
              selectedProject
            }
            onChange={(e) => {
              setSelectedProject(
                e.target.value
              );
              setSelectedCostCode(
                null
              );
            }}
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
          PROJECT
      ===================================================== */}

      <div className="mb-6">

        <h2 className="text-2xl font-bold">
          {selectedProjectName}
        </h2>

        <p className="text-gray-500">
          {costCodes.length} active cost code
          {costCodes.length ===
          1
            ? ""
            : "s"}
        </p>

      </div>

      {/* =====================================================
          SELECTED COST CODE
      ===================================================== */}

      {selectedCostCode && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex justify-between items-center">

          <div>

            <p className="text-xs text-blue-600 font-semibold uppercase">
              Selected Cost Code
            </p>

            <p className="font-bold text-blue-900 mt-1">
              {selectedCostCode.code}
              {" — "}
              {selectedCostCode.description}
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setSelectedCostCode(
                null
              )
            }
            className="text-blue-600 hover:text-blue-900 text-sm font-semibold"
          >
            Clear Selection
          </button>

        </div>
      )}

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Active Cost Codes
          </p>

          <p className="text-3xl font-bold mt-2">
            {costCodes.length}
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Categories
          </p>

          <p className="text-3xl font-bold mt-2">
            {
              new Set(
                costCodes.map(
                  (item) =>
                    item.category
                )
              ).size
            }
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Deleted Cost Codes
          </p>

          <p className="text-3xl font-bold mt-2 text-gray-600">
            {
              deletedCostCodes.length
            }
          </p>

        </div>

      </div>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="flex justify-between items-center mb-5 gap-4 flex-wrap">

        <div className="flex gap-3 flex-wrap">

          <input
            type="text"
            placeholder="Search cost codes..."
            value={
              search
            }
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="border rounded-lg bg-white px-4 py-2.5 w-80"
          />

          <select
            value={
              categoryFilter
            }
            onChange={(e) =>
              setCategoryFilter(
                e.target.value
              )
            }
            className="border rounded-lg bg-white px-4 py-2.5"
          >

            <option value="All">
              All Categories
            </option>

            {CATEGORIES.map(
              (category) => (
                <option
                  key={
                    category
                  }
                  value={
                    category
                  }
                >
                  {category}
                </option>
              )
            )}

          </select>

        </div>

        <div className="flex gap-3 flex-wrap">

          {canDelete && (
            <button
              type="button"
              onClick={() =>
                setShowDeleted(
                  true
                )
              }
              className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-lg"
            >
              🗑️ Deleted (
              {
                deletedCostCodes.length
              }
              )
            </button>
          )}

          <button
            type="button"
            onClick={
              exportCSV
            }
            className="border bg-white px-4 py-2.5 rounded-lg hover:bg-gray-50"
          >
            ⬇️ Export CSV
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={
                openAddForm
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg"
            >
              + Add Cost Code
            </button>
          )}

        </div>

      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loadingCodes && (
        <div className="mb-4 text-sm text-blue-600">
          Loading cost codes...
        </div>
      )}

      {/* =====================================================
          ACTIVE TABLE
      ===================================================== */}

      <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">

        <table className="w-full min-w-[850px]">

          <thead className="bg-gray-100 border-b">

            <tr>

              <th className="text-left p-4 w-12">
                Select
              </th>

              <th className="text-left p-4">
                Cost Code
              </th>

              <th className="text-left p-4">
                Description
              </th>

              <th className="text-left p-4">
                Category
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

            {filteredCodes.length ===
              0 && (
              <tr>

                <td
                  colSpan={6}
                  className="p-12 text-center"
                >

                  <div className="text-4xl mb-3">
                    🏷️
                  </div>

                  <p className="font-semibold">
                    No active cost codes found
                  </p>

                  <p className="text-gray-500 text-sm mt-1">
                    {canCreate
                      ? "Create a cost code to start organizing project costs."
                      : "No cost codes are available for this project."}
                  </p>

                  {canCreate && (
                    <button
                      type="button"
                      onClick={
                        openAddForm
                      }
                      className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                    >
                      + Add Cost Code
                    </button>
                  )}

                </td>

              </tr>
            )}

            {filteredCodes.map(
              (item) => {

                const isSelected =
                  selectedCostCode?.id ===
                  item.id;

                return (
                  <tr
                    key={
                      item.id
                    }
                    onClick={() =>
                      selectCostCode(
                        item
                      )
                    }
                    className={`border-b cursor-pointer transition ${
                      isSelected
                        ? "bg-blue-50 ring-1 ring-inset ring-blue-300"
                        : "hover:bg-gray-50"
                    }`}
                  >

                    {/* SELECT */}

                    <td
                      className="p-4"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >

                      <input
                        type="radio"
                        name="selected-cost-code"
                        checked={
                          isSelected
                        }
                        onChange={() =>
                          selectCostCode(
                            item
                          )
                        }
                        className="h-4 w-4"
                      />

                    </td>

                    {/* CODE */}

                    <td className="p-4 font-semibold text-blue-700">

                      {item.code}

                    </td>

                    {/* DESCRIPTION */}

                    <td className="p-4">

                      {item.description}

                    </td>

                    {/* CATEGORY */}

                    <td className="p-4">

                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
                        {item.category}
                      </span>

                    </td>

                    {/* NOTES */}

                    <td className="p-4 text-gray-500">

                      {item.notes ||
                        "—"}

                    </td>

                    {/* ACTIONS */}

                    <td
                      className="p-4"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >

                      <div className="flex justify-end gap-4">

                        {canView && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCostCode(
                                item
                              );
                              setShowView(
                                true
                              );
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </button>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                item
                              )
                            }
                            className="text-purple-600 hover:underline"
                          >
                            Edit
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() =>
                              deleteCostCode(
                                item.id
                              )
                            }
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
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

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      {showView &&
        selectedCostCode && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 overflow-y-auto"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowView(false);
            }
          }}
        >

          <div className="min-h-screen flex items-center justify-center p-4">

            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              <div className="flex justify-between items-center border-b p-6 sticky top-0 bg-white z-10">

                <div>

                  <h2 className="text-2xl font-bold">
                    View Cost Code
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Read-only information
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowView(
                      false
                    )
                  }
                  className="text-gray-500 hover:text-gray-900 text-2xl"
                >
                  ×
                </button>

              </div>

              <div className="p-6 space-y-5">

                <InfoField
                  label="Project"
                  value={
                    selectedProjectName
                  }
                />

                <InfoField
                  label="Cost Code"
                  value={
                    selectedCostCode.code
                  }
                />

                <InfoField
                  label="Description"
                  value={
                    selectedCostCode.description
                  }
                />

                <InfoField
                  label="Category"
                  value={
                    selectedCostCode.category
                  }
                />

                <InfoField
                  label="Notes"
                  value={
                    selectedCostCode.notes ||
                    "—"
                  }
                />

                <InfoField
                  label="Status"
                  value={
                    selectedCostCode.deleted_at
                      ? "Deleted"
                      : "Active"
                  }
                />

                {selectedCostCode.created_at && (
                  <InfoField
                    label="Created"
                    value={new Date(
                      selectedCostCode.created_at
                    ).toLocaleString()}
                  />
                )}

                {selectedCostCode.updated_at && (
                  <InfoField
                    label="Last Updated"
                    value={new Date(
                      selectedCostCode.updated_at
                    ).toLocaleString()}
                  />
                )}

              </div>

              <div className="border-t p-6 flex justify-end gap-3">

                {canEdit &&
                  !selectedCostCode.deleted_at && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowView(
                        false
                      );
                      openEditForm(
                        selectedCostCode
                      );
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg"
                  >
                    Edit
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setShowView(
                      false
                    )
                  }
                  className="border px-5 py-2.5 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>

              </div>

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
          className="fixed inset-0 z-[100] bg-black/50 overflow-y-auto"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowForm(false);
              setEditingId(null);
            }
          }}
        >

          <div className="min-h-screen flex items-center justify-center p-4">

            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="flex justify-between items-center border-b p-6 sticky top-0 bg-white z-10">

                <div>

                  <h2 className="text-2xl font-bold">
                    {editingId
                      ? "Edit Cost Code"
                      : "Add Cost Code"}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {selectedProjectName}
                  </p>

                </div>

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
                  className="text-gray-500 hover:text-gray-800 text-2xl"
                >
                  ×
                </button>

              </div>

              {/* FORM */}

              <div className="p-6 space-y-5">

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Cost Code *
                  </label>

                  <input
                    type="text"
                    placeholder="Example: 03-300"
                    value={
                      form.code
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        code:
                          e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Description *
                  </label>

                  <input
                    type="text"
                    placeholder="Example: Concrete"
                    value={
                      form.description
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description:
                          e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Category
                  </label>

                  <select
                    value={
                      form.category
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category:
                          e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-4 py-3 bg-white"
                  >

                    {CATEGORIES.map(
                      (category) => (
                        <option
                          key={
                            category
                          }
                          value={
                            category
                          }
                        >
                          {category}
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Notes
                  </label>

                  <textarea
                    rows={5}
                    placeholder="Optional notes..."
                    value={
                      form.notes
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        notes:
                          e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-4 py-3 resize-y"
                  />

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t p-6 sticky bottom-0 bg-white">

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
                  className="border px-5 py-2.5 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    saveCostCode
                  }
                  disabled={
                    saving
                  }
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Create Cost Code"}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          DELETED MODAL
      ===================================================== */}

      {showDeleted &&
        canDelete && (

        <div
          className="fixed inset-0 z-[100] bg-black/50 overflow-y-auto"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowDeleted(false);
            }
          }}
        >

          <div className="min-h-screen flex items-center justify-center p-4">

            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              <div className="p-6 bg-red-50 border-b border-red-200 flex justify-between items-center sticky top-0 z-10">

                <div>

                  <h2 className="text-2xl font-bold text-red-800">
                    Deleted Cost Codes
                  </h2>

                  <p className="text-sm text-red-600 mt-1">
                    Deleted codes are retained
                    here and can be restored.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowDeleted(
                      false
                    )
                  }
                  className="text-gray-500 hover:text-gray-900 text-2xl"
                >
                  ×
                </button>

              </div>

              {deletedCostCodes.length ===
              0 ? (

                <div className="p-12 text-center">

                  <div className="text-4xl mb-3">
                    🗑️
                  </div>

                  <p className="font-semibold">
                    No deleted cost codes
                  </p>

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[900px]">

                    <thead className="bg-gray-50 border-b">

                      <tr>

                        <th className="text-left p-4">
                          Select
                        </th>

                        <th className="text-left p-4">
                          Cost Code
                        </th>

                        <th className="text-left p-4">
                          Description
                        </th>

                        <th className="text-left p-4">
                          Category
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

                      {deletedCostCodes.map(
                        (item) => {

                          const isSelected =
                            selectedCostCode?.id ===
                            item.id;

                          return (
                            <tr
                              key={
                                item.id
                              }
                              onClick={() =>
                                selectCostCode(
                                  item
                                )
                              }
                              className={`border-b cursor-pointer ${
                                isSelected
                                  ? "bg-blue-50"
                                  : "hover:bg-gray-50"
                              }`}
                            >

                              <td className="p-4">

                                <input
                                  type="radio"
                                  name="selected-deleted-cost-code"
                                  checked={
                                    isSelected
                                  }
                                  onChange={() =>
                                    selectCostCode(
                                      item
                                    )
                                  }
                                  className="h-4 w-4"
                                />

                              </td>

                              <td className="p-4 font-semibold text-gray-600">
                                {item.code}
                              </td>

                              <td className="p-4">
                                {item.description}
                              </td>

                              <td className="p-4">
                                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
                                  {item.category}
                                </span>
                              </td>

                              <td className="p-4 text-gray-500">
                                {item.notes ||
                                  "—"}
                              </td>

                              <td className="p-4 text-gray-500 text-sm">
                                {item.deleted_at
                                  ? new Date(
                                      item.deleted_at
                                    ).toLocaleString()
                                  : "—"}
                              </td>

                              <td
                                className="p-4 text-right"
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                              >

                                <button
                                  type="button"
                                  onClick={() =>
                                    restoreCostCode(
                                      item.id
                                    )
                                  }
                                  disabled={
                                    restoringId ===
                                    item.id
                                  }
                                  className="text-green-600 hover:text-green-800 font-semibold disabled:text-gray-400"
                                >
                                  {restoringId ===
                                  item.id
                                    ? "Restoring..."
                                    : "Restore"}
                                </button>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

              )}

              <div className="border-t p-6 flex justify-end gap-3 sticky bottom-0 bg-white">

                {selectedCostCode?.deleted_at &&
                  canDelete && (
                    <button
                      type="button"
                      onClick={() =>
                        restoreCostCode(
                          selectedCostCode.id
                        )
                      }
                      disabled={
                        Boolean(
                          restoringId
                        )
                      }
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg"
                    >
                      {restoringId
                        ? "Restoring..."
                        : "Restore Selected"}
                    </button>
                  )}

                <button
                  type="button"
                  onClick={() =>
                    setShowDeleted(
                      false
                    )
                  }
                  className="border px-5 py-2.5 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          MANAGE MODAL
      ===================================================== */}

      {showManage &&
        canManage && (

        <div
          className="fixed inset-0 z-[100] bg-black/50 overflow-y-auto"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowManage(false);
            }
          }}
        >

          <div className="min-h-screen flex items-center justify-center p-4">

            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              <div className="flex justify-between items-center border-b p-6 sticky top-0 bg-white z-10">

                <div>

                  <h2 className="text-2xl font-bold">
                    Manage Cost Codes
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Administrative Cost Code controls
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowManage(
                      false
                    )
                  }
                  className="text-gray-500 hover:text-gray-900 text-2xl"
                >
                  ×
                </button>

              </div>

              <div className="p-6 space-y-4">

                <div className="bg-gray-50 border rounded-xl p-5">

                  <p className="text-sm text-gray-500">
                    Project
                  </p>

                  <p className="text-lg font-bold mt-1">
                    {selectedProjectName}
                  </p>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <ManageAction
                    title="Create Cost Code"
                    description="Add a new cost code."
                    icon="➕"
                    onClick={() => {
                      setShowManage(
                        false
                      );
                      openAddForm();
                    }}
                  />

                  <ManageAction
                    title="View Selected"
                    description="Open selected code details."
                    icon="👁️"
                    disabled={
                      !selectedCostCode
                    }
                    onClick={() => {
                      setShowManage(
                        false
                      );
                      openViewSelected();
                    }}
                  />

                  <ManageAction
                    title="Edit Selected"
                    description="Modify the selected active code."
                    icon="✏️"
                    disabled={
                      !selectedCostCode ||
                      Boolean(
                        selectedCostCode.deleted_at
                      )
                    }
                    onClick={() => {
                      setShowManage(
                        false
                      );
                      openEditForm();
                    }}
                  />

                  <ManageAction
                    title="Delete / Restore"
                    description="Move a code to Deleted or restore it."
                    icon={
                      selectedIsDeleted
                        ? "♻️"
                        : "🗑️"
                    }
                    disabled={
                      !selectedCostCode
                    }
                    onClick={() => {
                      setShowManage(
                        false
                      );
                      handleDeleteRestore();
                    }}
                  />

                  <ManageAction
                    title="Deleted Items"
                    description="View and restore deleted codes."
                    icon="🗑️"
                    onClick={() => {
                      setShowManage(
                        false
                      );
                      setShowDeleted(
                        true
                      );
                    }}
                  />

                  <ManageAction
                    title="Export CSV"
                    description="Export active Cost Codes."
                    icon="⬇️"
                    onClick={() => {
                      exportCSV();
                    }}
                  />

                  <ManageAction
                    title="Refresh Data"
                    description="Reload Cost Codes from Supabase."
                    icon="🔄"
                    onClick={async () => {
                      await loadAllCostCodes();
                    }}
                  />

                </div>

                <div className="border rounded-xl p-5">

                  <h3 className="font-bold">
                    Current Selection
                  </h3>

                  {selectedCostCode ? (
                    <div className="mt-3 text-sm">

                      <p>
                        <span className="font-semibold">
                          Code:
                        </span>{" "}
                        {selectedCostCode.code}
                      </p>

                      <p className="mt-1">
                        <span className="font-semibold">
                          Description:
                        </span>{" "}
                        {selectedCostCode.description}
                      </p>

                      <p className="mt-1">
                        <span className="font-semibold">
                          Status:
                        </span>{" "}
                        {selectedCostCode.deleted_at
                          ? "Deleted"
                          : "Active"}
                      </p>

                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">
                      No Cost Code is currently selected.
                    </p>
                  )}

                </div>

              </div>

              <div className="border-t p-6 flex justify-end">

                <button
                  type="button"
                  onClick={() =>
                    setShowManage(
                      false
                    )
                  }
                  className="border px-5 py-2.5 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}

// =========================================================
// INFO FIELD
// =========================================================

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-sm font-semibold text-gray-500">
        {label}
      </p>

      <div className="mt-1 border rounded-lg bg-gray-50 px-4 py-3 text-gray-900">
        {value}
      </div>

    </div>
  );
}

// =========================================================
// MANAGE ACTION
// =========================================================

function ManageAction({
  title,
  description,
  icon,
  onClick,
  disabled = false,
}: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`text-left border rounded-xl p-4 transition ${
        disabled
          ? "opacity-40 cursor-not-allowed bg-gray-50"
          : "hover:border-blue-400 hover:bg-blue-50"
      }`}
    >

      <div className="text-2xl">
        {icon}
      </div>

      <h3 className="font-semibold mt-2">
        {title}
      </h3>

      <p className="text-xs text-gray-500 mt-1">
        {description}
      </p>

    </button>
  );
}