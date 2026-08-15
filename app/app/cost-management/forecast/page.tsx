"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

type BudgetLine = {
  id: string;
  project_id: string;
  cost_code: string;
  description: string;
  original_budget: number | null;
  deleted_at: string | null;
};

type CostCode = {
  id: string;
  code: string;
  description: string | null;
  deleted_at: string | null;
};

type ChangeOrder = {
  id: string;
  project_id: string;
  cost_code_id: string | null;
  approved_amount: number | null;
  status: string | null;
  deleted_at: string | null;
  cost_codes:
    | {
        code: string;
        description: string | null;
      }
    | {
        code: string;
        description: string | null;
      }[]
    | null;
};

type Commitment = {
  id: string;
  project_id: string;
  cost_code_id: string | null;
  original_amount: number | null;
  approved_changes: number | null;
  deleted_at: string | null;
};

type ActualCost = {
  id: string;
  project_id: string;
  cost_code_id: string | null;
  amount: number | null;
  deleted_at: string | null;
};

type ForecastLine = {
  id: string;
  project_id: string;
  cost_code_id: string | null;
  estimate_to_complete: number | null;
  notes: string | null;
  deleted_at: string | null;
  created_at?: string;
};

type ForecastPermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  manage: boolean;
};

type ForecastRow = {
  budgetLine: BudgetLine;
  costCodeId: string | null;
  approvedChanges: number;
  currentBudget: number;
  committed: number;
  actual: number;
  etc: number;
  eac: number;
  variance: number;
  notes: string;
};

// =========================================================
// MONEY
// =========================================================

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// =========================================================
// PAGE
// =========================================================

export default function ForecastPage() {
  // =======================================================
  // PROJECT
  // =======================================================

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");

  // =======================================================
  // DATA
  // =======================================================

  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [actualCosts, setActualCosts] = useState<ActualCost[]>([]);
  const [forecastLines, setForecastLines] = useState<ForecastLine[]>([]);
  const [deletedForecastLines, setDeletedForecastLines] =
    useState<ForecastLine[]>([]);

  // =======================================================
  // UI
  // =======================================================

  const [loading, setLoading] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // =======================================================
  // DELETED
  // =======================================================

  const [showDeleted, setShowDeleted] = useState(false);

  // =======================================================
  // TOP ACTION MODAL
  // =======================================================

  const [showActionModal, setShowActionModal] = useState(false);

  const [actionMode, setActionMode] = useState<
    "create" | "edit" | "manage" | null
  >(null);

  const [actionCostCodeId, setActionCostCodeId] = useState("");
  const [actionEtc, setActionEtc] = useState("");
  const [actionNotes, setActionNotes] = useState("");

  // =======================================================
  // ETC
  // =======================================================

  const [etcValues, setEtcValues] =
    useState<Record<string, string>>({});

  const [notesValues, setNotesValues] =
    useState<Record<string, string>>({});

  // =======================================================
  // PERMISSIONS
  // =======================================================

  const [permissions, setPermissions] =
    useState<ForecastPermissions>({
      view: false,
      create: false,
      edit: false,
      delete: false,
      manage: false,
    });

  const canView =
    permissions.view || permissions.manage;

  const canCreate =
    permissions.create || permissions.manage;

  const canEdit =
    permissions.edit || permissions.manage;

  const canDelete =
    permissions.delete || permissions.manage;

  const canManage =
    permissions.manage;

  // =======================================================
  // BODY SCROLL LOCK
  // =======================================================

  useEffect(() => {
    const locked =
      showActionModal || showDeleted;

    if (!locked) {
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
  }, [showActionModal, showDeleted]);

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    loadPage();
  }, []);

  // =======================================================
  // LOAD PAGE
  // =======================================================

  async function loadPage() {
    try {
      setLoading(true);

      const result =
        await getAccessibleProjects();

      if (result.error) {
        console.error(
          "PROJECT ACCESS ERROR:",
          result.error
        );
      }

      const projectList =
        (result.projects as Project[]) || [];

      setProjects(projectList);

      if (projectList.length > 0) {
        setSelectedProject((current) => {
          const valid =
            current &&
            projectList.some(
              (p) => p.id === current
            );

          return valid
            ? current
            : projectList[0].id;
        });
      } else {
        setSelectedProject("");
      }

      const [
        view,
        create,
        edit,
        deletePermission,
        manage,
      ] = await Promise.all([
        hasPermission("Forecast", "view"),
        hasPermission("Forecast", "create"),
        hasPermission("Forecast", "edit"),
        hasPermission("Forecast", "delete"),
        hasPermission("Forecast", "manage"),
      ]);

      setPermissions({
        view,
        create,
        edit,
        delete: deletePermission,
        manage,
      });
    } catch (error) {
      console.error(
        "FORECAST PAGE LOAD ERROR:",
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

  // =======================================================
  // LOAD WHEN PROJECT CHANGES
  // =======================================================

  useEffect(() => {
    if (selectedProject && canView) {
      loadForecast(selectedProject);
    } else {
      setBudgetLines([]);
      setCostCodes([]);
      setChangeOrders([]);
      setCommitments([]);
      setActualCosts([]);
      setForecastLines([]);
      setDeletedForecastLines([]);
    }
  }, [selectedProject, canView]);

  // =======================================================
  // LOAD FORECAST
  // =======================================================

  async function loadForecast(projectId: string) {
    try {
      setLoadingForecast(true);

      const [
        budgetResult,
        costCodeResult,
        changeOrderResult,
        commitmentResult,
        actualResult,
        forecastResult,
        deletedResult,
      ] = await Promise.all([
        supabase
          .from("budget_lines")
          .select(`
            id,
            project_id,
            cost_code,
            description,
            original_budget,
            deleted_at
          `)
          .eq("project_id", projectId)
          .is("deleted_at", null)
          .order("cost_code"),

        supabase
          .from("cost_codes")
          .select(
            "id,code,description,deleted_at"
          )
          .eq("project_id", projectId)
          .is("deleted_at", null)
          .order("code"),

        supabase
          .from("change_orders")
          .select(`
            id,
            project_id,
            cost_code_id,
            approved_amount,
            status,
            deleted_at,
            cost_codes (
              code,
              description
            )
          `)
          .eq("project_id", projectId)
          .eq("status", "Approved")
          .is("deleted_at", null),

        supabase
          .from("commitments")
          .select(`
            id,
            project_id,
            cost_code_id,
            original_amount,
            approved_changes,
            deleted_at
          `)
          .eq("project_id", projectId)
          .is("deleted_at", null),

        supabase
          .from("actual_costs")
          .select(`
            id,
            project_id,
            cost_code_id,
            amount,
            deleted_at
          `)
          .eq("project_id", projectId)
          .is("deleted_at", null),

        supabase
          .from("forecast_lines")
          .select(`
            id,
            project_id,
            cost_code_id,
            estimate_to_complete,
            notes,
            deleted_at,
            created_at
          `)
          .eq("project_id", projectId)
          .is("deleted_at", null)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("forecast_lines")
          .select(`
            id,
            project_id,
            cost_code_id,
            estimate_to_complete,
            notes,
            deleted_at,
            created_at
          `)
          .eq("project_id", projectId)
          .not("deleted_at", "is", null)
          .order("deleted_at", {
            ascending: false,
          }),
      ]);

      if (budgetResult.error) {
        console.error(
          "BUDGET ERROR:",
          budgetResult.error
        );
      }

      if (costCodeResult.error) {
        console.error(
          "COST CODE ERROR:",
          costCodeResult.error
        );
      }

      if (changeOrderResult.error) {
        console.error(
          "CHANGE ORDER ERROR:",
          changeOrderResult.error
        );
      }

      if (commitmentResult.error) {
        console.error(
          "COMMITMENT ERROR:",
          commitmentResult.error
        );
      }

      if (actualResult.error) {
        console.error(
          "ACTUAL COST ERROR:",
          actualResult.error
        );
      }

      if (forecastResult.error) {
        console.error(
          "FORECAST ERROR:",
          forecastResult.error
        );
      }

      if (deletedResult.error) {
        console.error(
          "DELETED FORECAST ERROR:",
          deletedResult.error
        );
      }

      const budgets =
        (budgetResult.data as BudgetLine[]) || [];

      const codes =
        (costCodeResult.data as CostCode[]) || [];

      const changes =
        (changeOrderResult.data as ChangeOrder[]) || [];

      const commits =
        (commitmentResult.data as Commitment[]) || [];

      const actuals =
        (actualResult.data as ActualCost[]) || [];

      const forecasts =
        (forecastResult.data as ForecastLine[]) || [];

      const deleted =
        (deletedResult.data as ForecastLine[]) || [];

      setBudgetLines(budgets);
      setCostCodes(codes);
      setChangeOrders(changes);
      setCommitments(commits);
      setActualCosts(actuals);
      setForecastLines(forecasts);
      setDeletedForecastLines(deleted);

      const etc: Record<string, string> = {};
      const notes: Record<string, string> = {};

      forecasts.forEach((line) => {
        if (line.cost_code_id) {
          etc[line.cost_code_id] =
            String(
              line.estimate_to_complete ?? 0
            );

          notes[line.cost_code_id] =
            line.notes || "";
        }
      });

      setEtcValues(etc);
      setNotesValues(notes);
    } catch (error) {
      console.error(
        "LOAD FORECAST ERROR:",
        error
      );

      setBudgetLines([]);
      setCostCodes([]);
      setChangeOrders([]);
      setCommitments([]);
      setActualCosts([]);
      setForecastLines([]);
      setDeletedForecastLines([]);
    } finally {
      setLoadingForecast(false);
    }
  }

  // =======================================================
  // HELPERS
  // =======================================================

  function getCostCodeId(
    code: string
  ): string | null {
    return (
      costCodes.find(
        (item) => item.code === code
      )?.id || null
    );
  }

  function getCostCodeName(
    id: string | null
  ) {
    if (!id) return "Unlinked";

    return (
      costCodes.find(
        (item) => item.id === id
      )?.code || "Unlinked"
    );
  }

  function getApprovedChanges(
    costCode: string
  ) {
    return changeOrders
      .filter((order) => {
        if (order.status !== "Approved") {
          return false;
        }

        const relation =
          order.cost_codes;

        if (!relation) return false;

        if (Array.isArray(relation)) {
          return relation.some(
            (item) =>
              item.code === costCode
          );
        }

        return (
          relation.code === costCode
        );
      })
      .reduce(
        (total, order) =>
          total +
          Number(
            order.approved_amount || 0
          ),
        0
      );
  }

  function getCommittedCost(
    costCodeId: string | null
  ) {
    if (!costCodeId) return 0;

    return commitments
      .filter(
        (item) =>
          item.cost_code_id ===
          costCodeId
      )
      .reduce(
        (total, item) =>
          total +
          Number(
            item.original_amount || 0
          ) +
          Number(
            item.approved_changes || 0
          ),
        0
      );
  }

  function getActualCost(
    costCodeId: string | null
  ) {
    if (!costCodeId) return 0;

    return actualCosts
      .filter(
        (item) =>
          item.cost_code_id ===
          costCodeId
      )
      .reduce(
        (total, item) =>
          total +
          Number(item.amount || 0),
        0
      );
  }

  function getETC(
    costCodeId: string | null
  ) {
    if (!costCodeId) return 0;

    return Number(
      etcValues[costCodeId] || 0
    );
  }

  function getNotes(
    costCodeId: string | null
  ) {
    if (!costCodeId) return "";

    return (
      notesValues[costCodeId] || ""
    );
  }

  function getStatus(
    variance: number
  ) {
    if (variance < -0.01) {
      return "Over Budget";
    }

    if (variance > 0.01) {
      return "Under Budget";
    }

    return "On Budget";
  }

  // =======================================================
  // FORECAST ROWS
  // =======================================================

  const forecastRows =
    useMemo<ForecastRow[]>(() => {
      return budgetLines.map(
        (budgetLine) => {
          const costCodeId =
            getCostCodeId(
              budgetLine.cost_code
            );

          const approvedChanges =
            getApprovedChanges(
              budgetLine.cost_code
            );

          const currentBudget =
            Number(
              budgetLine.original_budget || 0
            ) + approvedChanges;

          const committed =
            getCommittedCost(
              costCodeId
            );

          const actual =
            getActualCost(
              costCodeId
            );

          const etc =
            getETC(
              costCodeId
            );

          const eac =
            actual + etc;

          const variance =
            currentBudget - eac;

          return {
            budgetLine,
            costCodeId,
            approvedChanges,
            currentBudget,
            committed,
            actual,
            etc,
            eac,
            variance,
            notes: getNotes(
              costCodeId
            ),
          };
        }
      );
    }, [
      budgetLines,
      costCodes,
      changeOrders,
      commitments,
      actualCosts,
      etcValues,
      notesValues,
    ]);

  // =======================================================
  // FILTER
  // =======================================================

  const filteredRows =
    useMemo(() => {
      const text =
        search.trim().toLowerCase();

      return forecastRows.filter(
        (row) => {
          const matchesSearch =
            !text ||
            row.budgetLine.cost_code
              .toLowerCase()
              .includes(text) ||
            row.budgetLine.description
              .toLowerCase()
              .includes(text);

          const status =
            getStatus(
              row.variance
            );

          const matchesStatus =
            statusFilter === "All" ||
            statusFilter === status;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      forecastRows,
      search,
      statusFilter,
    ]);

  // =======================================================
  // TOTALS
  // =======================================================

  const originalBudget =
    useMemo(
      () =>
        budgetLines.reduce(
          (total, line) =>
            total +
            Number(
              line.original_budget || 0
            ),
          0
        ),
      [budgetLines]
    );

  const approvedChanges =
    useMemo(
      () =>
        changeOrders.reduce(
          (total, order) =>
            total +
            Number(
              order.approved_amount || 0
            ),
          0
        ),
      [changeOrders]
    );

  const currentBudget =
    originalBudget +
    approvedChanges;

  const committedCost =
    useMemo(
      () =>
        commitments.reduce(
          (total, item) =>
            total +
            Number(
              item.original_amount || 0
            ) +
            Number(
              item.approved_changes || 0
            ),
          0
        ),
      [commitments]
    );

  const actualCost =
    useMemo(
      () =>
        actualCosts.reduce(
          (total, item) =>
            total +
            Number(
              item.amount || 0
            ),
          0
        ),
      [actualCosts]
    );

  const estimateToComplete =
    useMemo(
      () =>
        forecastLines.reduce(
          (total, line) =>
            total +
            Number(
              line.estimate_to_complete || 0
            ),
          0
        ),
      [forecastLines]
    );

  const forecastAtCompletion =
    actualCost +
    estimateToComplete;

  const variance =
    currentBudget -
    forecastAtCompletion;

  const availableBudget =
    currentBudget -
    actualCost -
    committedCost;

  const percentSpent =
    currentBudget > 0
      ? (actualCost /
          currentBudget) *
        100
      : 0;

  const selectedProjectName =
    projects.find(
      (project) =>
        project.id === selectedProject
    )?.name || "";

  // =======================================================
  // SCROLL TO TABLE
  // =======================================================

  function scrollToTable() {
    setTimeout(() => {
      document
        .getElementById(
          "forecast-table"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  // =======================================================
  // CLOSE MODAL
  // =======================================================

  function closeActionModal() {
    setShowActionModal(false);
    setActionMode(null);
    setActionCostCodeId("");
    setActionEtc("");
    setActionNotes("");
  }

  // =======================================================
  // TOP BUTTON ACTIONS
  // =======================================================

  function handleViewButton() {
    if (!canView) {
      alert(
        "You do not have permission to view forecasts."
      );
      return;
    }

    scrollToTable();
  }

  function handleCreateButton() {
    if (!canCreate) {
      alert(
        "You do not have permission to create forecasts."
      );
      return;
    }

    setActionMode("create");
    setActionCostCodeId("");
    setActionEtc("");
    setActionNotes("");
    setShowActionModal(true);
  }

  function handleEditButton() {
    if (!canEdit) {
      alert(
        "You do not have permission to edit forecasts."
      );
      return;
    }

    setActionMode("edit");
    setActionCostCodeId("");
    setActionEtc("");
    setActionNotes("");
    setShowActionModal(true);
  }

  function handleDeleteButton() {
    if (!canDelete) {
      alert(
        "You do not have permission to delete or restore forecasts."
      );
      return;
    }

    setShowDeleted(true);
  }

  function handleManageButton() {
    if (!canManage) {
      alert(
        "You do not have permission to manage forecasts."
      );
      return;
    }

    setActionMode("manage");
    setShowActionModal(true);
  }

  // =======================================================
  // SAVE ONE FORECAST
  // =======================================================

  async function saveForecastLine(
    row: ForecastRow,
    overrideEtc?: number,
    overrideNotes?: string
  ) {
    if (!row.costCodeId) {
      alert(
        `Cost code ${row.budgetLine.cost_code} is not linked to a cost code record.`
      );
      return false;
    }

    const etc =
      overrideEtc !== undefined
        ? overrideEtc
        : Number(
            etcValues[
              row.costCodeId
            ] || 0
          );

    const notes =
      overrideNotes !== undefined
        ? overrideNotes
        : notesValues[
            row.costCodeId
          ] || "";

    if (
      Number.isNaN(etc) ||
      etc < 0
    ) {
      alert(
        "Please enter a valid ETC amount."
      );
      return false;
    }

    try {
      setSavingId(
        row.budgetLine.id
      );

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        alert(
          "You are not logged in."
        );
        return false;
      }

      const {
        data: existing,
        error: findError,
      } = await supabase
        .from("forecast_lines")
        .select("id")
        .eq(
          "project_id",
          selectedProject
        )
        .eq(
          "cost_code_id",
          row.costCodeId
        )
        .is(
          "deleted_at",
          null
        )
        .maybeSingle();

      if (findError) {
        console.error(
          findError
        );
        alert(
          findError.message
        );
        return false;
      }

      if (existing?.id) {
        if (!canEdit) {
          alert(
            "You need Edit permission to update this forecast."
          );
          return false;
        }

        const { error } =
          await supabase
            .from("forecast_lines")
            .update({
              estimate_to_complete:
                etc,
              notes:
                notes.trim() ||
                null,
            })
            .eq(
              "id",
              existing.id
            )
            .is(
              "deleted_at",
              null
            );

        if (error) {
          console.error(
            "UPDATE FORECAST ERROR:",
            error
          );
          alert(
            error.message
          );
          return false;
        }
      } else {
        if (!canCreate) {
          alert(
            "You need Create permission to create this forecast."
          );
          return false;
        }

        const { error } =
          await supabase
            .from("forecast_lines")
            .insert({
              project_id:
                selectedProject,
              cost_code_id:
                row.costCodeId,
              estimate_to_complete:
                etc,
              notes:
                notes.trim() ||
                null,
              created_by:
                user.id,
              deleted_at:
                null,
            });

        if (error) {
          console.error(
            "INSERT FORECAST ERROR:",
            error
          );
          alert(
            error.message
          );
          return false;
        }
      }

      await loadForecast(
        selectedProject
      );

      return true;
    } catch (error: any) {
      console.error(
        "SAVE FORECAST ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to save forecast."
      );

      return false;
    } finally {
      setSavingId(null);
    }
  }

  // =======================================================
  // SAVE ALL
  // =======================================================

  async function saveAllForecasts() {
    if (!canEdit && !canCreate) {
      alert(
        "You do not have permission to edit forecasts."
      );
      return;
    }

    try {
      setSavingAll(true);

      for (const row of forecastRows) {
        if (!row.costCodeId) {
          continue;
        }

        const value =
          Number(
            etcValues[
              row.costCodeId
            ] || 0
          );

        if (
          Number.isNaN(value) ||
          value < 0
        ) {
          continue;
        }

        await saveForecastLine(
          row,
          value,
          notesValues[
            row.costCodeId
          ] || ""
        );
      }

      await loadForecast(
        selectedProject
      );

      alert(
        "Forecasts saved successfully."
      );
    } catch (error: any) {
      console.error(
        error
      );

      alert(
        error?.message ||
          "Unable to save forecasts."
      );
    } finally {
      setSavingAll(false);
    }
  }

  // =======================================================
  // DELETE
  // =======================================================

  async function handleDeleteForecast(
    id: string
  ) {
    if (!canDelete) {
      alert(
        "You do not have permission to delete forecasts."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this forecast? It will be moved to the Deleted list and can be restored later."
      );

    if (!confirmed) return;

    try {
      const { error } =
        await supabase
          .from("forecast_lines")
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
          error
        );
        alert(
          error.message
        );
        return;
      }

      await loadForecast(
        selectedProject
      );

      alert(
        "Forecast moved to Deleted."
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to delete forecast."
      );
    }
  }

  // =======================================================
  // RESTORE
  // =======================================================

  async function handleRestoreForecast(
    id: string
  ) {
    if (!canDelete) {
      alert(
        "You do not have permission to restore forecasts."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Restore this forecast?"
      );

    if (!confirmed) return;

    try {
      setRestoringId(id);

      const { error } =
        await supabase
          .from("forecast_lines")
          .update({
            deleted_at: null,
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
          error
        );
        alert(
          error.message
        );
        return;
      }

      await loadForecast(
        selectedProject
      );

      alert(
        "Forecast restored successfully."
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to restore forecast."
      );
    } finally {
      setRestoringId(null);
    }
  }

  // =======================================================
  // TOP MODAL SAVE
  // =======================================================

  async function saveTopAction() {
    if (!actionCostCodeId) {
      alert(
        "Please select a cost code."
      );
      return;
    }

    const row =
      forecastRows.find(
        (item) =>
          item.costCodeId ===
          actionCostCodeId
      );

    if (!row) {
      alert(
        "Selected cost code was not found."
      );
      return;
    }

    const etc =
      Number(actionEtc);

    if (
      Number.isNaN(etc) ||
      etc < 0
    ) {
      alert(
        "Please enter a valid ETC amount."
      );
      return;
    }

    setEtcValues((prev) => ({
      ...prev,
      [actionCostCodeId]:
        String(etc),
    }));

    setNotesValues((prev) => ({
      ...prev,
      [actionCostCodeId]:
        actionNotes,
    }));

    const success =
      await saveForecastLine(
        row,
        etc,
        actionNotes
      );

    if (success) {
      closeActionModal();
    }
  }

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">
        <div className="bg-white border rounded-xl p-8">
          Loading Forecast...
        </div>
      </main>
    );
  }

  // =======================================================
  // NO ACCESS
  // =======================================================

  if (!canView) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-xl mx-auto bg-white border rounded-xl p-10 text-center shadow-sm">
          <div className="text-5xl mb-4">
            🔒
          </div>

          <h1 className="text-2xl font-bold">
            Forecast Access Restricted
          </h1>

          <p className="text-gray-500 mt-3">
            You do not have permission
            to view Forecast.
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

  // =======================================================
  // NO PROJECT
  // =======================================================

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

  // =======================================================
  // PAGE
  // =======================================================

  return (
    <main className="p-8 bg-gray-50 min-h-screen">

      {/* =================================================
          BACK
      ================================================= */}

      <Link
        href="/app/cost-management"
        className="text-blue-600 hover:underline"
      >
        ← Back to Cost Management
      </Link>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex justify-between items-start mt-6 mb-8">

        <div>
          <h1 className="text-4xl font-bold">
            Cost Forecast
          </h1>

          <p className="text-gray-500 mt-2">
            Forecast project final cost by
            cost code.
          </p>

          <h2 className="text-2xl font-bold mt-6">
            {selectedProjectName}
          </h2>

          <p className="text-gray-500">
            Cost Forecast
          </p>

          {/* =================================================
              WORKING TOP BUTTONS
          ================================================= */}

          <div className="flex gap-2 flex-wrap mt-4">

            {canView && (
              <button
                type="button"
                onClick={handleViewButton}
                className="cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-full text-sm font-semibold active:scale-95 transition"
              >
                👁️ View
              </button>
            )}

            {canCreate && (
              <button
                type="button"
                onClick={handleCreateButton}
                className="cursor-pointer bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-full text-sm font-semibold active:scale-95 transition"
              >
                + Create
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={handleEditButton}
                className="cursor-pointer bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-full text-sm font-semibold active:scale-95 transition"
              >
                ✏️ Edit
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={handleDeleteButton}
                className="cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-full text-sm font-semibold active:scale-95 transition"
              >
                🗑️ Delete / Restore
              </button>
            )}

            {canManage && (
              <button
                type="button"
                onClick={handleManageButton}
                className="cursor-pointer bg-gray-800 text-white hover:bg-gray-900 px-4 py-2 rounded-full text-sm font-semibold active:scale-95 transition"
              >
                ⚙️ Manage
              </button>
            )}

          </div>
        </div>

        {/* =================================================
            PROJECT SELECT
        ================================================= */}

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Project
          </label>

          <select
            value={selectedProject}
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
                  key={project.id}
                  value={project.id}
                >
                  {project.name}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* =================================================
          SAVE ALL
      ================================================= */}

      <div className="flex justify-end gap-3 mb-5">
        {(canEdit || canCreate) && (
          <button
            type="button"
            onClick={saveAllForecasts}
            disabled={
              savingAll ||
              loadingForecast
            }
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg font-semibold"
          >
            {savingAll
              ? "Saving..."
              : "💾 Save All Forecasts"}
          </button>
        )}
      </div>

      {/* =================================================
          KPI
      ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Original Budget
          </p>
          <p className="text-3xl font-bold mt-2">
            {money(originalBudget)}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Approved baseline
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Approved Changes
          </p>
          <p className="text-3xl font-bold mt-2">
            {money(approvedChanges)}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Approved change orders
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Current Budget
          </p>
          <p className="text-3xl font-bold mt-2">
            {money(currentBudget)}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Budget after approved changes
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Forecast at Completion
          </p>
          <p className="text-3xl font-bold mt-2">
            {money(forecastAtCompletion)}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Actual + ETC
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Committed
          </p>
          <p className="text-3xl font-bold mt-2">
            {money(committedCost)}
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Actual Cost
          </p>
          <p className="text-3xl font-bold mt-2">
            {money(actualCost)}
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Estimate to Complete
          </p>
          <p className="text-3xl font-bold mt-2">
            {money(estimateToComplete)}
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Variance
          </p>

          <p
            className={`text-3xl font-bold mt-2 ${
              variance < -0.01
                ? "text-red-600"
                : variance > 0.01
                ? "text-green-600"
                : "text-blue-600"
            }`}
          >
            {money(variance)}
          </p>
        </div>
      </div>

      {/* =================================================
          AVAILABLE + SPENT
      ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Available Budget
          </p>

          <p className="text-3xl font-bold mt-2">
            {money(availableBudget)}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Current Budget − Actual − Commitments
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            % Spent
          </p>

          <p className="text-3xl font-bold mt-2">
            {percentSpent.toFixed(1)}%
          </p>

          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{
                width: `${Math.min(
                  Math.max(
                    percentSpent,
                    0
                  ),
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* =================================================
          STATUS
      ================================================= */}

      <div className="bg-white border rounded-xl p-5 shadow-sm mb-8">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm text-gray-500">
              Forecast Status
            </p>

            <p className="text-lg font-semibold mt-1">
              Current Budget vs Forecast
            </p>
          </div>

          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              variance < -0.01
                ? "bg-red-100 text-red-700"
                : variance > 0.01
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {getStatus(variance)}
          </span>
        </div>
      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">

        <div className="flex flex-col md:flex-row gap-4">

          <input
            type="text"
            placeholder="Search cost code or description..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="flex-1 border rounded-lg px-4 py-3"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="border rounded-lg px-4 py-3 bg-white min-w-[180px]"
          >
            <option value="All">
              All
            </option>

            <option value="On Budget">
              On Budget
            </option>

            <option value="Under Budget">
              Under Budget
            </option>

            <option value="Over Budget">
              Over Budget
            </option>
          </select>
        </div>
      </div>

      {/* =================================================
          FORECAST TABLE
      ================================================= */}

      <div
        id="forecast-table"
        className="bg-white border rounded-xl shadow-sm overflow-hidden"
      >

        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">
            Cost Code Forecast
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {canEdit
              ? "Edit ETC for each cost code and save your forecast."
              : canCreate
              ? "Create forecast values for cost codes."
              : "View-only access to project forecasts."}
          </p>
        </div>

        {loadingForecast ? (
          <div className="p-12 text-center text-gray-500">
            Loading forecast...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">
              📊
            </div>

            <p className="font-semibold">
              No forecast lines found
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Add budget lines first or change
              your search/filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1650px]">

              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left p-4">
                    Cost Code
                  </th>

                  <th className="text-left p-4">
                    Description
                  </th>

                  <th className="text-right p-4">
                    Budget
                  </th>

                  <th className="text-right p-4">
                    Changes
                  </th>

                  <th className="text-right p-4">
                    Current Budget
                  </th>

                  <th className="text-right p-4">
                    Committed
                  </th>

                  <th className="text-right p-4">
                    Actual
                  </th>

                  <th className="text-right p-4">
                    ETC
                  </th>

                  <th className="text-right p-4">
                    EAC
                  </th>

                  <th className="text-right p-4">
                    Variance
                  </th>

                  <th className="text-center p-4">
                    Status
                  </th>

                  <th className="text-left p-4">
                    Notes
                  </th>

                  {(canEdit ||
                    canCreate) && (
                    <th className="text-right p-4">
                      Action
                    </th>
                  )}

                  {canDelete && (
                    <th className="text-right p-4">
                      Delete
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>

                {filteredRows.map(
                  (row) => {
                    const status =
                      getStatus(
                        row.variance
                      );

                    const existing =
                      forecastLines.find(
                        (line) =>
                          line.cost_code_id ===
                          row.costCodeId
                      );

                    const canSave =
                      row.costCodeId &&
                      (
                        existing
                          ? canEdit
                          : canCreate
                      );

                    return (
                      <tr
                        key={
                          row.budgetLine.id
                        }
                        className="border-b hover:bg-gray-50"
                      >

                        <td className="p-4 font-semibold text-blue-700">
                          {
                            row.budgetLine.cost_code
                          }
                        </td>

                        <td className="p-4">
                          {
                            row.budgetLine.description
                          }
                        </td>

                        <td className="p-4 text-right">
                          {money(
                            Number(
                              row.budgetLine
                                .original_budget ||
                                0
                            )
                          )}
                        </td>

                        <td className="p-4 text-right">
                          {money(
                            row.approvedChanges
                          )}
                        </td>

                        <td className="p-4 text-right font-semibold">
                          {money(
                            row.currentBudget
                          )}
                        </td>

                        <td className="p-4 text-right">
                          {money(
                            row.committed
                          )}
                        </td>

                        <td className="p-4 text-right">
                          {money(
                            row.actual
                          )}
                        </td>

                        <td className="p-4 text-right">

                          {(canEdit ||
                            canCreate) &&
                          row.costCodeId ? (
                            <div className="flex items-center justify-end">
                              <span className="text-gray-400 mr-1">
                                $
                              </span>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  etcValues[
                                    row.costCodeId
                                  ] ?? ""
                                }
                                onChange={(e) =>
                                  setEtcValues(
                                    (prev) => ({
                                      ...prev,
                                      [row.costCodeId!]:
                                        e.target.value,
                                    })
                                  )
                                }
                                className="w-28 border rounded-lg px-3 py-2 text-right"
                              />
                            </div>
                          ) : (
                            money(row.etc)
                          )}

                        </td>

                        <td className="p-4 text-right font-semibold">
                          {money(row.eac)}
                        </td>

                        <td
                          className={`p-4 text-right font-semibold ${
                            row.variance < -0.01
                              ? "text-red-600"
                              : row.variance > 0.01
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        >
                          {money(row.variance)}
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              status ===
                              "Over Budget"
                                ? "bg-red-100 text-red-700"
                                : status ===
                                  "Under Budget"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="p-4">

                          {(canEdit ||
                            canCreate) &&
                          row.costCodeId ? (
                            <input
                              type="text"
                              placeholder="Forecast notes..."
                              value={
                                notesValues[
                                  row.costCodeId
                                ] ?? ""
                              }
                              onChange={(e) =>
                                setNotesValues(
                                  (prev) => ({
                                    ...prev,
                                    [row.costCodeId!]:
                                      e.target.value,
                                  })
                                )
                              }
                              className="border rounded-lg px-3 py-2 w-48"
                            />
                          ) : (
                            <span className="text-gray-500">
                              {row.notes ||
                                "—"}
                            </span>
                          )}

                        </td>

                        {(canEdit ||
                          canCreate) && (
                          <td className="p-4 text-right">

                            {canSave ? (
                              <button
                                type="button"
                                onClick={() =>
                                  saveForecastLine(
                                    row
                                  )
                                }
                                disabled={
                                  savingId ===
                                  row.budgetLine.id
                                }
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
                              >
                                {savingId ===
                                row.budgetLine.id
                                  ? "Saving..."
                                  : existing
                                  ? "Update"
                                  : "Save"}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">
                                {row.costCodeId
                                  ? "Permission required"
                                  : "Cost code not linked"}
                              </span>
                            )}

                          </td>
                        )}

                        {canDelete && (
                          <td className="p-4 text-right">
                            {existing ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteForecast(
                                    existing.id
                                  )
                                }
                                className="text-red-600 hover:text-red-800 hover:underline font-medium"
                              >
                                Delete
                              </button>
                            ) : (
                              <span className="text-gray-400">
                                —
                              </span>
                            )}
                          </td>
                        )}

                      </tr>
                    );
                  }
                )}

              </tbody>

              <tfoot className="bg-gray-50 border-t">
                <tr>

                  <td
                    colSpan={2}
                    className="p-4 font-bold"
                  >
                    TOTAL
                  </td>

                  <td className="p-4 text-right font-bold">
                    {money(originalBudget)}
                  </td>

                  <td className="p-4 text-right font-bold">
                    {money(approvedChanges)}
                  </td>

                  <td className="p-4 text-right font-bold">
                    {money(currentBudget)}
                  </td>

                  <td className="p-4 text-right font-bold">
                    {money(committedCost)}
                  </td>

                  <td className="p-4 text-right font-bold">
                    {money(actualCost)}
                  </td>

                  <td className="p-4 text-right font-bold">
                    {money(estimateToComplete)}
                  </td>

                  <td className="p-4 text-right font-bold">
                    {money(forecastAtCompletion)}
                  </td>

                  <td
                    className={`p-4 text-right font-bold ${
                      variance < -0.01
                        ? "text-red-600"
                        : variance > 0.01
                        ? "text-green-600"
                        : "text-blue-600"
                    }`}
                  >
                    {money(variance)}
                  </td>

                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        variance < -0.01
                          ? "bg-red-100 text-red-700"
                          : variance > 0.01
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {getStatus(variance)}
                    </span>
                  </td>

                  <td />

                  {(canEdit ||
                    canCreate) && <td />}

                  {canDelete && <td />}

                </tr>
              </tfoot>

            </table>
          </div>
        )}
      </div>

      {/* =================================================
          METHODOLOGY
      ================================================= */}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-6">

        <h3 className="font-semibold text-blue-900">
          ℹ️ Forecast Methodology
        </h3>

        <div className="text-sm text-blue-800 mt-2 space-y-1">

          <p>
            <strong>
              Original Budget
            </strong>{" "}
            = Owner-approved budget from
            Budget Lines.
          </p>

          <p>
            <strong>
              Current Budget
            </strong>{" "}
            = Original Budget + Approved
            Change Orders.
          </p>

          <p>
            <strong>
              Forecast at Completion
            </strong>{" "}
            = Actual Cost + Estimate to
            Complete.
          </p>

          <p>
            <strong>
              Variance
            </strong>{" "}
            = Current Budget − Forecast at
            Completion.
          </p>

          <p>
            <strong>
              Deleted Forecasts
            </strong>{" "}
            = Soft-deleted forecast records
            that can be restored.
          </p>

        </div>
      </div>

      {/* =================================================
          ACTION MODAL
      ================================================= */}

      {showActionModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeActionModal();
            }
          }}
        >

          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="p-6 border-b flex justify-between items-center shrink-0">

              <div>
                <h2 className="text-2xl font-bold">
                  {actionMode ===
                  "create"
                    ? "Create Forecast"
                    : actionMode ===
                      "edit"
                    ? "Edit Forecast"
                    : "Forecast Management"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {selectedProjectName}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeActionModal
                }
                className="text-gray-500 hover:text-gray-800 text-2xl w-10 h-10 rounded-lg hover:bg-gray-100"
              >
                ×
              </button>

            </div>

            {/* CONTENT */}

            <div className="p-6 overflow-y-auto overscroll-contain">

              {actionMode ===
              "manage" ? (

                <div className="space-y-6">

                  <div className="grid grid-cols-2 gap-4">

                    <div className="border rounded-xl p-5 bg-gray-50">
                      <p className="text-sm text-gray-500">
                        Budget Lines
                      </p>

                      <p className="text-2xl font-bold mt-1">
                        {budgetLines.length}
                      </p>
                    </div>

                    <div className="border rounded-xl p-5 bg-gray-50">
                      <p className="text-sm text-gray-500">
                        Active Forecasts
                      </p>

                      <p className="text-2xl font-bold mt-1">
                        {forecastLines.length}
                      </p>
                    </div>

                    <div className="border rounded-xl p-5 bg-gray-50">
                      <p className="text-sm text-gray-500">
                        Deleted Forecasts
                      </p>

                      <p className="text-2xl font-bold mt-1">
                        {deletedForecastLines.length}
                      </p>
                    </div>

                    <div className="border rounded-xl p-5 bg-gray-50">
                      <p className="text-sm text-gray-500">
                        Forecast at Completion
                      </p>

                      <p className="text-2xl font-bold mt-1">
                        {money(
                          forecastAtCompletion
                        )}
                      </p>
                    </div>

                  </div>

                  <div className="border rounded-xl p-5">

                    <h3 className="font-bold">
                      Management Actions
                    </h3>

                    <div className="flex flex-wrap gap-3 mt-4">

                      <button
                        type="button"
                        onClick={() => {
                          closeActionModal();
                          setShowDeleted(true);
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2.5 rounded-lg font-semibold"
                      >
                        🗑️ Deleted Forecasts
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          closeActionModal();
                          saveAllForecasts();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold"
                      >
                        💾 Save All
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          closeActionModal();
                          scrollToTable();
                        }}
                        className="border border-gray-300 hover:bg-gray-50 px-4 py-2.5 rounded-lg font-semibold"
                      >
                        Open Forecast Table
                      </button>

                    </div>
                  </div>

                  <div className="border rounded-xl p-5">

                    <h3 className="font-bold mb-4">
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
                              {String(name)}
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

              ) : (

                <div className="space-y-5">

                  {/* COST CODE */}

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Cost Code
                    </label>

                    <select
                      value={
                        actionCostCodeId
                      }
                      onChange={(e) => {
                        const id =
                          e.target.value;

                        setActionCostCodeId(
                          id
                        );

                        if (!id) {
                          setActionEtc("");
                          setActionNotes("");
                          return;
                        }

                        const row =
                          forecastRows.find(
                            (item) =>
                              item.costCodeId ===
                              id
                          );

                        setActionEtc(
                          etcValues[id] ??
                            String(
                              row?.etc || 0
                            )
                        );

                        setActionNotes(
                          notesValues[id] ??
                            row?.notes ??
                            ""
                        );
                      }}
                      className="w-full border rounded-lg px-4 py-3 bg-white"
                    >

                      <option value="">
                        Select cost code
                      </option>

                      {forecastRows
                        .filter((row) => {
                          if (
                            !row.costCodeId
                          ) {
                            return false;
                          }

                          const existing =
                            forecastLines.some(
                              (line) =>
                                line.cost_code_id ===
                                row.costCodeId
                            );

                          if (
                            actionMode ===
                            "create"
                          ) {
                            return !existing;
                          }

                          return existing;
                        })
                        .map((row) => (
                          <option
                            key={
                              row.costCodeId!
                            }
                            value={
                              row.costCodeId!
                            }
                          >
                            {
                              row.budgetLine
                                .cost_code
                            }{" "}
                            —{" "}
                            {
                              row.budgetLine
                                .description
                            }
                          </option>
                        ))}

                    </select>
                  </div>

                  {/* ETC */}

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Estimate to Complete
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={actionEtc}
                      onChange={(e) =>
                        setActionEtc(
                          e.target.value
                        )
                      }
                      placeholder="0.00"
                      className="w-full border rounded-lg px-4 py-3"
                    />
                  </div>

                  {/* NOTES */}

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Forecast Notes
                    </label>

                    <textarea
                      rows={5}
                      value={actionNotes}
                      onChange={(e) =>
                        setActionNotes(
                          e.target.value
                        )
                      }
                      placeholder="Forecast notes..."
                      className="w-full border rounded-lg px-4 py-3 resize-y"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">

                    <p className="text-sm text-blue-800">

                      {actionMode ===
                      "create"
                        ? "Create a new forecast for a cost code that does not already have an active forecast."
                        : "Update the existing forecast for the selected cost code."}

                    </p>

                  </div>

                </div>
              )}

            </div>

            {/* FOOTER */}

            <div className="border-t p-6 flex justify-end gap-3 shrink-0">

              <button
                type="button"
                onClick={
                  closeActionModal
                }
                className="border border-gray-300 bg-white hover:bg-gray-50 px-5 py-2.5 rounded-lg"
              >
                Close
              </button>

              {actionMode !==
                "manage" && (
                <button
                  type="button"
                  onClick={
                    saveTopAction
                  }
                  disabled={
                    !actionCostCodeId ||
                    !actionEtc ||
                    savingId !== null
                  }
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg font-semibold"
                >
                  {actionMode ===
                  "create"
                    ? "Create Forecast"
                    : "Update Forecast"}
                </button>
              )}

            </div>

          </div>
        </div>
      )}

      {/* =================================================
          DELETED FORECAST MODAL
      ================================================= */}

      {showDeleted &&
        canDelete && (
          <div
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
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

              {/* HEADER */}

              <div className="p-6 border-b flex justify-between items-center shrink-0">

                <div>
                  <h2 className="text-2xl font-bold">
                    Deleted Forecasts
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Restore deleted forecast records.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowDeleted(
                      false
                    )
                  }
                  className="text-gray-500 hover:text-gray-800 text-2xl w-10 h-10 rounded-lg hover:bg-gray-100"
                >
                  ×
                </button>

              </div>

              {/* CONTENT */}

              <div className="p-6 overflow-y-auto overscroll-contain">

                {deletedForecastLines.length ===
                0 ? (

                  <div className="p-12 text-center">

                    <div className="text-5xl mb-4">
                      🗑️
                    </div>

                    <p className="font-semibold">
                      No deleted forecasts
                    </p>

                    <p className="text-sm text-gray-500 mt-2">
                      Deleted forecasts will appear here.
                    </p>

                  </div>

                ) : (

                  <div className="border rounded-xl overflow-hidden">

                    <div className="overflow-x-auto">

                      <table className="w-full min-w-[900px]">

                        <thead className="bg-gray-100 border-b">

                          <tr>

                            <th className="text-left p-4">
                              Cost Code
                            </th>

                            <th className="text-right p-4">
                              ETC
                            </th>

                            <th className="text-left p-4">
                              Notes
                            </th>

                            <th className="text-left p-4">
                              Deleted At
                            </th>

                            <th className="text-right p-4">
                              Action
                            </th>

                          </tr>

                        </thead>

                        <tbody>

                          {deletedForecastLines.map(
                            (line) => (
                              <tr
                                key={
                                  line.id
                                }
                                className="border-b hover:bg-gray-50"
                              >

                                <td className="p-4 font-semibold text-blue-700">
                                  {getCostCodeName(
                                    line.cost_code_id
                                  )}
                                </td>

                                <td className="p-4 text-right">
                                  {money(
                                    Number(
                                      line.estimate_to_complete ||
                                        0
                                    )
                                  )}
                                </td>

                                <td className="p-4">
                                  {line.notes ||
                                    "—"}
                                </td>

                                <td className="p-4 text-sm text-gray-500">
                                  {line.deleted_at
                                    ? new Date(
                                        line.deleted_at
                                      ).toLocaleString()
                                    : "—"}
                                </td>

                                <td className="p-4 text-right">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRestoreForecast(
                                        line.id
                                      )
                                    }
                                    disabled={
                                      restoringId ===
                                      line.id
                                    }
                                    className="text-green-600 hover:text-green-800 font-semibold disabled:text-gray-400"
                                  >
                                    {restoringId ===
                                    line.id
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

              {/* FOOTER */}

              <div className="border-t p-6 flex justify-end shrink-0">

                <button
                  type="button"
                  onClick={() =>
                    setShowDeleted(
                      false
                    )
                  }
                  className="border border-gray-300 bg-white hover:bg-gray-50 px-5 py-2.5 rounded-lg"
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