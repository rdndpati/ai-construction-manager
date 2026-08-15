"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { getAccessibleProjects } from "@/lib/projectAccess";
import { hasPermission } from "@/lib/permissions";

type Project = {
  id: string;
  name: string;
};

type BudgetLine = {
  id: string;
  project_id: string;
  cost_code: string;
  description: string;
  original_budget: number;
  approved_changes: number;
  notes: string | null;

  is_locked?: boolean;
  locked_at?: string | null;
  locked_by?: string | null;

  deleted_at?: string | null;
};

type ApprovedChangeOrder = {
  id: string;
  cost_code_id: string | null;
  approved_amount: number | null;
  status: string | null;
  deleted_at?: string | null;

  cost_codes:
    | {
        code: string;
        description: string | null;
      }[]
    | null;
};

type BudgetPermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  manage: boolean;
};

export default function BudgetPage() {
  // =========================================================
  // PROJECTS
  // =========================================================

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [selectedProject, setSelectedProject] =
    useState("");

  // =========================================================
  // BUDGET DATA
  // =========================================================

  const [budgetLines, setBudgetLines] =
    useState<BudgetLine[]>([]);

  const [
    approvedChangeOrders,
    setApprovedChangeOrders,
  ] = useState<ApprovedChangeOrder[]>([]);

  // =========================================================
  // LOADING
  // =========================================================

  const [loading, setLoading] =
    useState(true);

  const [loadingBudget, setLoadingBudget] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [locking, setLocking] =
    useState(false);

  // =========================================================
  // FORM / MODAL
  // =========================================================

  const [showForm, setShowForm] =
    useState(false);

  const [editingLineId, setEditingLineId] =
    useState<string | null>(null);

  const [selectedLineId, setSelectedLineId] =
    useState<string | null>(null);

  const [form, setForm] = useState({
    cost_code: "",
    description: "",
    original_budget: "",
    notes: "",
  });

  // =========================================================
  // PERMISSIONS
  // =========================================================

  const [
    permissions,
    setPermissions,
  ] = useState<BudgetPermissions>({
    view: false,
    create: false,
    edit: false,
    delete: false,
    manage: false,
  });

  // =========================================================
  // PREVENT BACKGROUND PAGE SCROLL WHEN MODAL IS OPEN
  // =========================================================

  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showForm]);

  // =========================================================
  // LOAD ACCESS
  // =========================================================

  useEffect(() => {
    loadAccess();
  }, []);

  async function loadAccess() {
    setLoading(true);

    try {
      // =====================================================
      // PROJECT ACCESS
      // =====================================================

      const result =
        await getAccessibleProjects();

      console.log(
        "BUDGET ACCESSIBLE PROJECTS:",
        result
      );

      if (result.error) {
        console.error(
          "PROJECT ACCESS ERROR:",
          result.error
        );
      }

      const projectData =
        (result.projects as Project[]) ?? [];

      setProjects(projectData);

      if (projectData.length > 0) {
        setSelectedProject(
          (currentProject) => {
            const stillAccessible =
              projectData.some(
                (project) =>
                  project.id ===
                  currentProject
              );

            return stillAccessible
              ? currentProject
              : projectData[0].id;
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
          "Budget",
          "view"
        ),

        hasPermission(
          "Budget",
          "create"
        ),

        hasPermission(
          "Budget",
          "edit"
        ),

        hasPermission(
          "Budget",
          "delete"
        ),

        hasPermission(
          "Budget",
          "manage"
        ),
      ]);

      console.log(
        "BUDGET PERMISSIONS:",
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
        "BUDGET ACCESS ERROR:",
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
  // EFFECTIVE PERMISSIONS
  // =========================================================

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

  // =========================================================
  // LOAD BUDGET
  // =========================================================

  useEffect(() => {
    if (
      selectedProject &&
      canView
    ) {
      loadBudget(
        selectedProject
      );
    } else {
      setBudgetLines([]);
      setApprovedChangeOrders([]);
    }
  }, [
    selectedProject,
    canView,
  ]);

  async function loadBudget(
    projectId: string
  ) {
    setLoadingBudget(true);

    try {
      const [
        budgetResult,
        changeOrderResult,
      ] = await Promise.all([
        // ===================================================
        // ACTIVE BUDGET LINES ONLY
        // ===================================================

        supabase
          .from("budget_lines")
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
            "cost_code",
            {
              ascending: true,
            }
          ),

        // ===================================================
        // ACTIVE APPROVED CHANGE ORDERS ONLY
        // ===================================================

        supabase
          .from("change_orders")
          .select(`
            id,
            cost_code_id,
            approved_amount,
            status,
            deleted_at,
            cost_codes (
              code,
              description
            )
          `)
          .eq(
            "project_id",
            projectId
          )
          .eq(
            "status",
            "Approved"
          )
          .is(
            "deleted_at",
            null
          ),
      ]);

      // =====================================================
      // BUDGET RESULT
      // =====================================================

      if (
        budgetResult.error
      ) {
        console.error(
          "BUDGET LOAD ERROR:",
          budgetResult.error
        );

        setBudgetLines([]);
      } else {
        setBudgetLines(
          (budgetResult.data as BudgetLine[]) ??
            []
        );
      }

      // =====================================================
      // CHANGE ORDER RESULT
      // =====================================================

      if (
        changeOrderResult.error
      ) {
        console.error(
          "CHANGE ORDER LOAD ERROR:",
          changeOrderResult.error
        );

        setApprovedChangeOrders([]);
      } else {
        setApprovedChangeOrders(
          (changeOrderResult.data as ApprovedChangeOrder[]) ??
            []
        );
      }
    } catch (error) {
      console.error(
        "LOAD BUDGET DATA ERROR:",
        error
      );

      setBudgetLines([]);
      setApprovedChangeOrders([]);
    } finally {
      setLoadingBudget(false);
    }
  }

  // =========================================================
  // APPROVED CHANGES
  // =========================================================

  function getApprovedChangesForLine(
    costCode: string
  ): number {
    return approvedChangeOrders
      .filter((changeOrder) => {
        const changeOrderCostCode =
          changeOrder.cost_codes?.[0]?.code;

        return (
          changeOrder.status ===
            "Approved" &&
          changeOrderCostCode ===
            costCode
        );
      })
      .reduce(
        (total, changeOrder) =>
          total +
          Number(
            changeOrder.approved_amount ??
              0
          ),
        0
      );
  }

  // =========================================================
  // UNMATCHED CHANGE ORDERS
  // =========================================================

  const unmatchedApprovedChangeOrders =
    useMemo(() => {
      return approvedChangeOrders.filter(
        (changeOrder) => {
          const changeOrderCostCode =
            changeOrder.cost_codes?.[0]?.code;

          if (!changeOrderCostCode) {
            return true;
          }

          return !budgetLines.some(
            (line) =>
              line.cost_code ===
              changeOrderCostCode
          );
        }
      );
    }, [
      approvedChangeOrders,
      budgetLines,
    ]);

  const unallocatedApprovedChanges =
    useMemo(() => {
      return unmatchedApprovedChangeOrders.reduce(
        (total, changeOrder) =>
          total +
          Number(
            changeOrder.approved_amount ??
              0
          ),
        0
      );
    }, [
      unmatchedApprovedChangeOrders,
    ]);

  // =========================================================
  // BUDGET LOCKED
  // =========================================================

  const budgetLocked =
    useMemo(() => {
      return budgetLines.some(
        (line) =>
          line.is_locked === true
      );
    }, [budgetLines]);

  // =========================================================
  // CAN MODIFY
  // =========================================================

  const canModify =
    canEdit &&
    !budgetLocked;

  // =========================================================
  // RESET FORM
  // =========================================================

  function resetForm() {
    setForm({
      cost_code: "",
      description: "",
      original_budget: "",
      notes: "",
    });

    setEditingLineId(null);
    setShowForm(false);
  }

  // =========================================================
  // CREATE / UPDATE BUDGET LINE
  // =========================================================

  async function saveBudgetLine() {
    if (
      editingLineId &&
      !canEdit
    ) {
      alert(
        "You do not have permission to edit Budget lines."
      );
      return;
    }

    if (
      !editingLineId &&
      !canCreate
    ) {
      alert(
        "You do not have permission to create Budget lines."
      );
      return;
    }

    if (budgetLocked) {
      alert(
        "This budget is locked and cannot be modified."
      );
      return;
    }

    if (!selectedProject) {
      alert(
        "Please select a project."
      );
      return;
    }

    if (!form.cost_code.trim()) {
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

    if (!form.original_budget) {
      alert(
        "Please enter the original budget."
      );
      return;
    }

    const amount =
      Number(
        form.original_budget
      );

    if (
      Number.isNaN(amount) ||
      amount < 0
    ) {
      alert(
        "Please enter a valid budget amount."
      );
      return;
    }

    try {
      setSaving(true);

      // =====================================================
      // EDIT
      // =====================================================

      if (editingLineId) {
        const {
          error,
        } = await supabase
          .from("budget_lines")
          .update({
            cost_code:
              form.cost_code.trim(),

            description:
              form.description.trim(),

            original_budget:
              amount,

            notes:
              form.notes.trim() ||
              null,
          })
          .eq(
            "id",
            editingLineId
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
            "UPDATE BUDGET ERROR:",
            error
          );

          alert(
            `Failed to update budget line: ${error.message}`
          );

          return;
        }

        alert(
          "Budget line updated successfully."
        );
      }

      // =====================================================
      // CREATE
      // =====================================================

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
          .from("budget_lines")
          .insert({
            project_id:
              selectedProject,

            cost_code:
              form.cost_code.trim(),

            description:
              form.description.trim(),

            original_budget:
              amount,

            approved_changes: 0,

            notes:
              form.notes.trim() ||
              null,

            created_by:
              user.id,

            is_locked: false,

            locked_at: null,

            locked_by: null,

            deleted_at: null,
          });

        if (error) {
          console.error(
            "BUDGET INSERT ERROR:",
            error
          );

          alert(
            `Failed to create budget line: ${error.message}`
          );

          return;
        }

        alert(
          "Budget line created successfully."
        );
      }

      resetForm();

      await loadBudget(
        selectedProject
      );
    } catch (error) {
      console.error(
        "SAVE BUDGET ERROR:",
        error
      );

      alert(
        "Something went wrong while saving the budget line."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // OPEN CREATE
  // =========================================================

  function openCreate() {
    if (!canCreate) {
      alert(
        "You do not have Create permission for Budget."
      );
      return;
    }

    if (budgetLocked) {
      alert(
        "This budget is locked and cannot be modified."
      );
      return;
    }

    setEditingLineId(null);

    setForm({
      cost_code: "",
      description: "",
      original_budget: "",
      notes: "",
    });

    setShowForm(true);
  }

  // =========================================================
  // OPEN EDIT
  // =========================================================

  function openEdit(
    line?: BudgetLine
  ) {
    if (!canEdit) {
      alert(
        "You do not have Edit permission for Budget."
      );
      return;
    }

    if (budgetLocked) {
      alert(
        "This budget is locked and cannot be modified."
      );
      return;
    }

    const target =
      line ??
      budgetLines.find(
        (item) =>
          item.id ===
          selectedLineId
      );

    if (!target) {
      alert(
        "Please select a budget line first."
      );
      return;
    }

    setSelectedLineId(
      target.id
    );

    setEditingLineId(
      target.id
    );

    setForm({
      cost_code:
        target.cost_code,

      description:
        target.description,

      original_budget:
        String(
          target.original_budget ??
            ""
        ),

      notes:
        target.notes ??
        "",
    });

    setShowForm(true);
  }

  // =========================================================
  // SOFT DELETE
  // =========================================================

  async function deleteBudgetLine(
    id?: string
  ) {
    if (!canDelete) {
      alert(
        "You do not have Delete permission for Budget."
      );
      return;
    }

    if (budgetLocked) {
      alert(
        "This budget is locked and cannot be modified."
      );
      return;
    }

    const targetId =
      id ?? selectedLineId;

    if (!targetId) {
      alert(
        "Please select a budget line first."
      );
      return;
    }

    const target =
      budgetLines.find(
        (line) =>
          line.id ===
          targetId
      );

    if (!target) {
      alert(
        "Budget line could not be found."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Move budget line "${target.cost_code} - ${target.description}" to Deleted Items?\n\nThe record will not be permanently deleted and can be restored later.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      console.log(
        "SOFT DELETING BUDGET LINE:",
        {
          id: targetId,
          project:
            selectedProject,
        }
      );

      const {
        data,
        error,
      } = await supabase
        .from("budget_lines")
        .update({
          deleted_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          targetId
        )
        .eq(
          "project_id",
          selectedProject
        )
        .is(
          "deleted_at",
          null
        )
        .select("id");

      console.log(
        "SOFT DELETE RESULT:",
        {
          data,
          error,
        }
      );

      if (error) {
        console.error(
          "SOFT DELETE BUDGET ERROR:",
          error
        );

        alert(
          `Failed to move budget line to Deleted Items: ${error.message}`
        );

        return;
      }

      if (
        !data ||
        data.length === 0
      ) {
        alert(
          "The budget line was not moved to Deleted Items. This may be caused by Row Level Security or a database policy."
        );

        return;
      }

      setBudgetLines(
        (prev) =>
          prev.filter(
            (line) =>
              line.id !==
              targetId
          )
      );

      setSelectedLineId(
        null
      );

      alert(
        "Budget line moved to Deleted Items successfully."
      );

      await loadBudget(
        selectedProject
      );
    } catch (error) {
      console.error(
        "SOFT DELETE BUDGET ERROR:",
        error
      );

      alert(
        "Something went wrong while moving the budget line to Deleted Items."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // VIEW / REFRESH
  // =========================================================

  async function handleView() {
    if (!canView) {
      alert(
        "You do not have View permission for Budget."
      );
      return;
    }

    if (!selectedProject) {
      return;
    }

    setSelectedLineId(
      null
    );

    await loadBudget(
      selectedProject
    );
  }

  // =========================================================
  // LOCK
  // =========================================================

  async function lockBudget() {
    if (!canEdit) {
      alert(
        "You do not have permission to edit the Budget."
      );
      return;
    }

    if (
      budgetLines.length ===
      0
    ) {
      alert(
        "Add at least one budget line before locking."
      );
      return;
    }

    if (budgetLocked) {
      alert(
        "This budget is already locked."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Lock the Original Budget?\n\nAfter locking, the original budget cannot be modified until an authorized user unlocks it."
      );

    if (!confirmed) {
      return;
    }

    try {
      setLocking(true);

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
        .from("budget_lines")
        .update({
          is_locked: true,

          locked_at:
            new Date().toISOString(),

          locked_by:
            user.id,
        })
        .eq(
          "project_id",
          selectedProject
        )
        .eq(
          "is_locked",
          false
        )
        .is(
          "deleted_at",
          null
        );

      if (error) {
        console.error(
          "LOCK BUDGET ERROR:",
          error
        );

        alert(
          error.message
        );

        return;
      }

      await loadBudget(
        selectedProject
      );

      alert(
        "Original Budget has been locked."
      );
    } finally {
      setLocking(false);
    }
  }

  // =========================================================
  // UNLOCK
  // =========================================================

  async function unlockBudget() {
    if (!canManage) {
      alert(
        "Only users with Budget Manage permission can unlock the budget."
      );
      return;
    }

    if (!budgetLocked) {
      alert(
        "This budget is already unlocked."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Unlock the Original Budget?\n\nThis will allow authorized users to modify the budget again."
      );

    if (!confirmed) {
      return;
    }

    try {
      setLocking(true);

      const {
        error,
      } = await supabase
        .from("budget_lines")
        .update({
          is_locked: false,

          locked_at: null,

          locked_by: null,
        })
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
          "UNLOCK BUDGET ERROR:",
          error
        );

        alert(
          error.message
        );

        return;
      }

      await loadBudget(
        selectedProject
      );

      alert(
        "Budget has been unlocked."
      );
    } finally {
      setLocking(false);
    }
  }

  // =========================================================
  // MANAGE BUTTON
  // =========================================================

  async function handleManage() {
    if (!canManage) {
      alert(
        "You do not have Manage permission for Budget."
      );
      return;
    }

    if (budgetLocked) {
      await unlockBudget();
    } else {
      await lockBudget();
    }
  }

  // =========================================================
  // EXPORT CSV
  // =========================================================

  function exportCSV() {
    if (
      budgetLines.length ===
      0
    ) {
      alert(
        "There is no budget data to export."
      );
      return;
    }

    const headers = [
      "Cost Code",
      "Description",
      "Original Budget",
      "Approved Changes",
      "Current Budget",
      "Notes",
      "Status",
    ];

    const rows =
      budgetLines.map(
        (line) => {
          const lineApprovedChanges =
            getApprovedChangesForLine(
              line.cost_code
            );

          const current =
            Number(
              line.original_budget ??
                0
            ) +
            lineApprovedChanges;

          return [
            line.cost_code,
            line.description,
            Number(
              line.original_budget ??
                0
            ),
            lineApprovedChanges,
            current,
            line.notes ?? "",
            line.is_locked
              ? "Locked"
              : "Draft",
          ];
        }
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
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
      `${selectedProjectName.replace(
        /\s+/g,
        "_"
      )}_Budget.csv`;

    link.click();

    URL.revokeObjectURL(
      url
    );
  }

  // =========================================================
  // TOTALS
  // =========================================================

  const originalBudget =
    budgetLines.reduce(
      (total, line) =>
        total +
        Number(
          line.original_budget ??
            0
        ),
      0
    );

  const approvedChanges =
    approvedChangeOrders.reduce(
      (total, changeOrder) =>
        total +
        Number(
          changeOrder.approved_amount ??
            0
        ),
      0
    );

  const currentBudget =
    originalBudget +
    approvedChanges;

  const selectedProjectName =
    projects.find(
      (project) =>
        project.id ===
        selectedProject
    )?.name ?? "";

  // =========================================================
  // MONEY
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
    ).format(value);
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="p-8">
        <div className="bg-white border rounded-xl p-8">
          Loading Budget...
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

          <h1 className="text-2xl font-bold text-gray-900">
            Budget Access Restricted
          </h1>

          <p className="text-gray-500 mt-3">
            You do not have permission
            to view the project budget.
          </p>

          <Link
            href="/app/cost-management"
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
            You currently don't have
            access to any projects.
          </p>

          <Link
            href="/app/projects"
            className="inline-block mt-5 bg-blue-600 text-white px-5 py-2.5 rounded-lg"
          >
            Back to Projects
          </Link>

        </div>

      </main>
    );
  }

  // =========================================================
  // SELECTED LINE
  // =========================================================

  const selectedLine =
    budgetLines.find(
      (line) =>
        line.id ===
        selectedLineId
    );

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="p-8 bg-gray-50 min-h-screen">

      {/* BACK */}

      <Link
        href="/app/cost-management"
        className="text-blue-600 hover:underline"
      >
        ← Back to Cost Management
      </Link>

      {/* HEADER */}

      <div className="flex justify-between items-start mt-6 mb-8">

        <div>

          <h1 className="text-4xl font-bold">
            Project Budget
          </h1>

          <p className="text-gray-500 mt-2">
            Manage the Owner-approved
            original project budget.
          </p>

          {/* PERMISSION BUTTONS */}

          <div className="flex gap-2 flex-wrap mt-4">

            {/* VIEW */}

            <button
              type="button"
              onClick={
                handleView
              }
              disabled={
                !canView ||
                loadingBudget
              }
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                canView
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              👁️ View
            </button>

            {/* CREATE */}

            <button
              type="button"
              onClick={
                openCreate
              }
              disabled={
                !canCreate ||
                budgetLocked
              }
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                canCreate &&
                !budgetLocked
                  ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              + Create
            </button>

            {/* EDIT */}

            <button
              type="button"
              onClick={() =>
                openEdit()
              }
              disabled={
                !canEdit ||
                budgetLocked ||
                !selectedLineId
              }
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                canEdit &&
                !budgetLocked &&
                selectedLineId
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              ✏️ Edit
            </button>

            {/* DELETE */}

            <button
              type="button"
              onClick={() =>
                deleteBudgetLine()
              }
              disabled={
                !canDelete ||
                budgetLocked ||
                !selectedLineId ||
                saving
              }
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                canDelete &&
                !budgetLocked &&
                selectedLineId
                  ? "bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              🗑️ Delete
            </button>

            {/* MANAGE */}

            <button
              type="button"
              onClick={
                handleManage
              }
              disabled={
                !canManage ||
                locking
              }
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                canManage
                  ? "bg-gray-800 text-white hover:bg-gray-900 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              ⚙️{" "}
              {budgetLocked
                ? "Unlock"
                : "Manage"}
            </button>

          </div>

          <p className="text-xs text-gray-400 mt-2">
            {selectedLine
              ? `Selected: ${selectedLine.cost_code} - ${selectedLine.description}`
              : "Select a budget line below to use Edit or Delete."}
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
            onChange={(e) => {
              setSelectedProject(
                e.target.value
              );

              setSelectedLineId(
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

      {/* PROJECT NAME */}

      <div className="mb-6">

        <h2 className="text-2xl font-bold">
          {selectedProjectName}
        </h2>

      </div>

      {/* KPI */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Original Budget
          </p>

          <p className="text-3xl font-bold mt-2">
            {money(
              originalBudget
            )}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Owner-approved baseline
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Approved Changes
          </p>

          <p className="text-3xl font-bold mt-2">
            {money(
              approvedChanges
            )}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Approved Change Orders
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Current Budget
          </p>

          <p className="text-3xl font-bold mt-2 text-blue-600">
            {money(
              currentBudget
            )}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Original + approved changes
          </p>

        </div>

      </div>

      {/* UNMATCHED CHANGE ORDERS */}

      {unmatchedApprovedChangeOrders.length >
        0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">

          <div className="flex items-start gap-3">

            <div className="text-xl">
              ⚠️
            </div>

            <div>

              <p className="font-semibold text-yellow-800">
                Approved Change Orders Need Attention
              </p>

              <p className="text-sm text-yellow-700 mt-1">
                {
                  unmatchedApprovedChangeOrders.length
                }{" "}
                approved Change Order
                {unmatchedApprovedChangeOrders.length ===
                1
                  ? ""
                  : "s"}{" "}
                cannot be matched to a budget
                line by cost code.
              </p>

              <p className="text-sm font-semibold text-yellow-800 mt-2">
                Unallocated Amount:{" "}
                {money(
                  unallocatedApprovedChanges
                )}
              </p>

            </div>

          </div>

        </div>
      )}

      {/* ACTION BAR */}

      <div className="flex justify-between items-center mb-5">

        <div>

          <h2 className="text-2xl font-bold">
            Budget Lines
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {budgetLines.length} budget line
            {budgetLines.length ===
            1
              ? ""
              : "s"}
          </p>

        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={
              exportCSV
            }
            className="border bg-white px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            ⬇️ Export CSV
          </button>

          {canCreate &&
            !budgetLocked && (
              <button
                type="button"
                onClick={
                  openCreate
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
              >
                + Add Budget Line
              </button>
            )}

        </div>

      </div>

      {/* LOCK MESSAGE */}

      {budgetLocked && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">

          <div className="flex items-start gap-3">

            <div className="text-xl">
              🔒
            </div>

            <div>

              <p className="font-semibold text-green-800">
                Original Budget Locked
              </p>

              <p className="text-sm text-green-700 mt-1">
                The Owner-approved baseline
                cannot be modified.
                Approved budget changes
                should be processed through
                Change Orders.
              </p>

            </div>

          </div>

        </div>
      )}

      {/* TABLE */}

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">

        {loadingBudget ? (

          <div className="p-12 text-center text-gray-500">
            Loading budget...
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-100 border-b">

                <tr>

                  <th className="text-center p-4">
                    Select
                  </th>

                  <th className="text-left p-4">
                    Cost Code
                  </th>

                  <th className="text-left p-4">
                    Description
                  </th>

                  <th className="text-right p-4">
                    Original Budget
                  </th>

                  <th className="text-right p-4">
                    Approved Changes
                  </th>

                  <th className="text-right p-4">
                    Current Budget
                  </th>

                  <th className="text-left p-4">
                    Notes
                  </th>

                  <th className="text-center p-4">
                    Status
                  </th>

                  {(canEdit ||
                    canDelete) &&
                    !budgetLocked && (
                      <th className="text-right p-4">
                        Actions
                      </th>
                    )}

                </tr>

              </thead>

              <tbody>

                {budgetLines.length ===
                  0 && (
                  <tr>

                    <td
                      colSpan={
                        9
                      }
                      className="p-12 text-center"
                    >

                      <div className="text-4xl mb-3">
                        💰
                      </div>

                      <p className="font-semibold">
                        No budget lines yet
                      </p>

                      <p className="text-gray-500 text-sm mt-1">
                        {canCreate
                          ? "Add the Owner-approved project budget to begin."
                          : "No budget has been entered for this project yet."}
                      </p>

                    </td>

                  </tr>
                )}

                {budgetLines.map(
                  (line) => {

                    const lineApprovedChanges =
                      getApprovedChangesForLine(
                        line.cost_code
                      );

                    const current =
                      Number(
                        line.original_budget ??
                          0
                      ) +
                      lineApprovedChanges;

                    const isSelected =
                      selectedLineId ===
                      line.id;

                    return (
                      <tr
                        key={
                          line.id
                        }
                        className={`border-b transition ${
                          isSelected
                            ? "bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                      >

                        {/* SELECT */}

                        <td className="p-4 text-center">

                          <input
                            type="radio"
                            name="selectedBudgetLine"
                            checked={
                              isSelected
                            }
                            onChange={() =>
                              setSelectedLineId(
                                line.id
                              )
                            }
                            className="h-4 w-4 cursor-pointer"
                          />

                        </td>

                        {/* COST CODE */}

                        <td className="p-4 font-semibold">
                          {
                            line.cost_code
                          }
                        </td>

                        {/* DESCRIPTION */}

                        <td className="p-4">
                          {
                            line.description
                          }
                        </td>

                        {/* ORIGINAL */}

                        <td className="p-4 text-right">
                          {money(
                            Number(
                              line.original_budget ??
                                0
                            )
                          )}
                        </td>

                        {/* CHANGES */}

                        <td className="p-4 text-right">
                          {money(
                            lineApprovedChanges
                          )}
                        </td>

                        {/* CURRENT */}

                        <td className="p-4 text-right font-semibold">
                          {money(
                            current
                          )}
                        </td>

                        {/* NOTES */}

                        <td className="p-4 text-gray-500">
                          {
                            line.notes ||
                            "—"
                          }
                        </td>

                        {/* STATUS */}

                        <td className="p-4 text-center">

                          {line.is_locked ? (

                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                              🔒 Locked
                            </span>

                          ) : (

                            <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                              Draft
                            </span>

                          )}

                        </td>

                        {/* ACTIONS */}

                        {(canEdit ||
                          canDelete) &&
                          !budgetLocked && (

                          <td className="p-4 text-right">

                            <div className="flex justify-end gap-3">

                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(
                                      line
                                    )
                                  }
                                  className="text-purple-600 hover:underline font-medium"
                                >
                                  Edit
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteBudgetLine(
                                      line.id
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  className="text-red-600 hover:underline font-medium disabled:text-gray-400"
                                >
                                  Delete
                                </button>
                              )}

                            </div>

                          </td>

                        )}

                      </tr>
                    );
                  }
                )}

              </tbody>

              {/* TOTAL */}

              {budgetLines.length >
                0 && (

                <tfoot className="bg-gray-50 border-t">

                  <tr>

                    <td />

                    <td
                      colSpan={2}
                      className="p-4 font-bold"
                    >
                      TOTAL
                    </td>

                    <td className="p-4 text-right font-bold">
                      {money(
                        originalBudget
                      )}
                    </td>

                    <td className="p-4 text-right font-bold">
                      {money(
                        approvedChanges
                      )}
                    </td>

                    <td className="p-4 text-right font-bold text-blue-600">
                      {money(
                        currentBudget
                      )}
                    </td>

                    <td
                      colSpan={
                        3
                      }
                    />

                  </tr>

                </tfoot>
              )}

            </table>

          </div>

        )}

      </div>

      {/* =====================================================
          CREATE / EDIT MODAL
          FIXED:
          - Background cannot scroll
          - Modal has max height
          - Form area scrolls
          - Header stays fixed
          - Footer stays fixed
      ===================================================== */}

      {showForm &&
        (editingLineId
          ? canEdit
          : canCreate) &&
        !budgetLocked && (

        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onWheel={(e) => {
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
        >

          {/* MODAL */}

          <div
            className="
              relative
              z-50
              bg-white
              rounded-2xl
              shadow-xl
              w-full
              max-w-2xl
              max-h-[90vh]
              overflow-hidden
              flex
              flex-col
            "
            onWheel={(e) => {
              e.stopPropagation();
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
            }}
          >

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex justify-between items-center border-b p-6 shrink-0 bg-white">

              <div>

                <h2 className="text-2xl font-bold">
                  {editingLineId
                    ? "Edit Budget Line"
                    : "Add Budget Line"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingLineId
                    ? "Modify the budget line information."
                    : "Add an Owner-approved budget allocation."}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  resetForm
                }
                className="text-gray-500 hover:text-gray-800 text-2xl cursor-pointer"
              >
                ×
              </button>

            </div>

            {/* =================================================
                SCROLLABLE FORM AREA
            ================================================= */}

            <div
              className="
                flex-1
                overflow-y-auto
                overscroll-contain
                p-6
                space-y-5
              "
            >

              {/* INFORMATION */}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">

                <p className="text-sm text-blue-800">

                  <strong>
                    Original Budget:
                  </strong>{" "}
                  The original budget is the
                  Owner-approved baseline.
                  Approved changes come from
                  Change Orders.

                </p>

              </div>

              {/* COST CODE */}

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Cost Code *
                </label>

                <input
                  type="text"
                  placeholder="Example: 03-300"
                  value={
                    form.cost_code
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cost_code:
                        e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-3"
                />

              </div>

              {/* DESCRIPTION */}

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

              {/* AMOUNT */}

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Owner Original Budget *
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={
                      form.original_budget
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        original_budget:
                          e.target.value,
                      })
                    }
                    className="w-full border rounded-lg pl-9 pr-4 py-3"
                  />

                </div>

              </div>

              {/* NOTES */}

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

              {/* EXTRA SPACE FOR MOBILE SCROLLING */}

              <div className="h-2" />

            </div>

            {/* =================================================
                FOOTER
                STAYS FIXED WHILE FORM SCROLLS
            ================================================= */}

            <div className="flex justify-end gap-3 border-t p-6 shrink-0 bg-white">

              <button
                type="button"
                onClick={
                  resetForm
                }
                disabled={
                  saving
                }
                className="border px-5 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  saveBudgetLine
                }
                disabled={
                  saving
                }
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg"
              >
                {saving
                  ? "Saving..."
                  : editingLineId
                  ? "Update Budget Line"
                  : "Save Budget Line"}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}