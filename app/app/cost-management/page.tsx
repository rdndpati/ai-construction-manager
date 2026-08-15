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

type BudgetRow = {
  original_budget: number | null;
};

type CommitmentRow = {
  original_amount: number | null;
  approved_changes: number | null;
};

type ActualCostRow = {
  amount: number | null;
};

type ChangeOrderRow = {
  status: string | null;
  approved_amount: number | null;
};

type ForecastRow = {
  estimate_to_complete: number | null;
};

type ModulePermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  manage: boolean;
};

type CostPermissions = {
  dashboard: ModulePermissions;

  budget: ModulePermissions;

  costCodes: ModulePermissions;

  commitments: ModulePermissions;

  actualCosts: ModulePermissions;

  forecast: ModulePermissions;

  changeOrders: ModulePermissions;

  contingency: ModulePermissions;

  earnedValue: ModulePermissions;

  costReports: ModulePermissions;
};

// =========================================================
// MAIN PAGE
// =========================================================

export default function CostManagementPage() {

  // =======================================================
  // PROJECTS
  // =======================================================

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [selectedProject, setSelectedProject] =
    useState("");

  // =======================================================
  // LOADING
  // =======================================================

  const [loading, setLoading] =
    useState(true);

  const [loadingPermissions, setLoadingPermissions] =
    useState(true);

  const [loadingCosts, setLoadingCosts] =
    useState(false);

  // =======================================================
  // PERMISSIONS
  // =======================================================

  const [permissions, setPermissions] =
    useState<CostPermissions | null>(null);

  // =======================================================
  // COST DATA
  // =======================================================

  const [budgetRows, setBudgetRows] =
    useState<BudgetRow[]>([]);

  const [commitmentRows, setCommitmentRows] =
    useState<CommitmentRow[]>([]);

  const [actualRows, setActualRows] =
    useState<ActualCostRow[]>([]);

  const [changeOrderRows, setChangeOrderRows] =
    useState<ChangeOrderRow[]>([]);

  const [forecastRows, setForecastRows] =
    useState<ForecastRow[]>([]);

  // =======================================================
  // LOAD PAGE ACCESS
  // =======================================================

  useEffect(() => {
    loadPageAccess();
  }, []);

  async function loadPageAccess() {

    setLoading(true);

    setLoadingPermissions(true);

    try {

      // =====================================================
      // 1. PROJECT ACCESS
      // =====================================================

      const result =
        await getAccessibleProjects();

      if (result.error) {

        console.error(
          "PROJECT ACCESS ERROR:",
          result.error
        );

      }

      const projectData =
        (result.projects as Project[]) ?? [];

      setProjects(projectData);

      // =====================================================
      // SELECT PROJECT
      // =====================================================

      if (projectData.length > 0) {

        setSelectedProject(
          (currentProject) => {

            const currentStillExists =
              projectData.some(
                (project) =>
                  project.id ===
                  currentProject
              );

            if (currentStillExists) {
              return currentProject;
            }

            return projectData[0].id;
          }
        );

      } else {

        setSelectedProject("");

      }

      // =====================================================
      // 2. LOAD COST MANAGEMENT PERMISSIONS
      // =====================================================

      const [

        // Dashboard
        dashboardView,

        // Budget
        budgetView,
        budgetCreate,
        budgetEdit,
        budgetDelete,
        budgetApprove,
        budgetManage,

        // Cost Codes
        costCodesView,
        costCodesCreate,
        costCodesEdit,
        costCodesDelete,
        costCodesApprove,
        costCodesManage,

        // Commitments
        commitmentsView,
        commitmentsCreate,
        commitmentsEdit,
        commitmentsDelete,
        commitmentsApprove,
        commitmentsManage,

        // Actual Costs
        actualCostsView,
        actualCostsCreate,
        actualCostsEdit,
        actualCostsDelete,
        actualCostsApprove,
        actualCostsManage,

        // Forecast
        forecastView,
        forecastCreate,
        forecastEdit,
        forecastDelete,
        forecastApprove,
        forecastManage,

        // Change Orders
        changeOrdersView,
        changeOrdersCreate,
        changeOrdersEdit,
        changeOrdersDelete,
        changeOrdersApprove,
        changeOrdersManage,

        // Contingency
        contingencyView,
        contingencyCreate,
        contingencyEdit,
        contingencyDelete,
        contingencyApprove,
        contingencyManage,

        // Earned Value
        earnedValueView,
        earnedValueCreate,
        earnedValueEdit,
        earnedValueDelete,
        earnedValueApprove,
        earnedValueManage,

        // Cost Reports
        costReportsView,
        costReportsCreate,
        costReportsEdit,
        costReportsDelete,
        costReportsApprove,
        costReportsManage,

      ] = await Promise.all([

        // ===================================================
        // COST DASHBOARD
        // ===================================================

        hasPermission(
          "Cost Dashboard",
          "view"
        ),

        // ===================================================
        // BUDGET
        // ===================================================

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
          "approve"
        ),

        hasPermission(
          "Budget",
          "manage"
        ),

        // ===================================================
        // COST CODES
        // ===================================================

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
          "approve"
        ),

        hasPermission(
          "Cost Codes",
          "manage"
        ),

        // ===================================================
        // COMMITMENTS
        // ===================================================

        hasPermission(
          "Commitments",
          "view"
        ),

        hasPermission(
          "Commitments",
          "create"
        ),

        hasPermission(
          "Commitments",
          "edit"
        ),

        hasPermission(
          "Commitments",
          "delete"
        ),

        hasPermission(
          "Commitments",
          "approve"
        ),

        hasPermission(
          "Commitments",
          "manage"
        ),

        // ===================================================
        // ACTUAL COSTS
        // ===================================================

        hasPermission(
          "Actual Costs",
          "view"
        ),

        hasPermission(
          "Actual Costs",
          "create"
        ),

        hasPermission(
          "Actual Costs",
          "edit"
        ),

        hasPermission(
          "Actual Costs",
          "delete"
        ),

        hasPermission(
          "Actual Costs",
          "approve"
        ),

        hasPermission(
          "Actual Costs",
          "manage"
        ),

        // ===================================================
        // FORECAST
        // ===================================================

        hasPermission(
          "Forecast",
          "view"
        ),

        hasPermission(
          "Forecast",
          "create"
        ),

        hasPermission(
          "Forecast",
          "edit"
        ),

        hasPermission(
          "Forecast",
          "delete"
        ),

        hasPermission(
          "Forecast",
          "approve"
        ),

        hasPermission(
          "Forecast",
          "manage"
        ),

        // ===================================================
        // CHANGE ORDERS
        // ===================================================

        hasPermission(
          "Change Orders",
          "view"
        ),

        hasPermission(
          "Change Orders",
          "create"
        ),

        hasPermission(
          "Change Orders",
          "edit"
        ),

        hasPermission(
          "Change Orders",
          "delete"
        ),

        hasPermission(
          "Change Orders",
          "approve"
        ),

        hasPermission(
          "Change Orders",
          "manage"
        ),

        // ===================================================
        // CONTINGENCY
        // ===================================================

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
          "approve"
        ),

        hasPermission(
          "Contingency",
          "manage"
        ),

        // ===================================================
        // EARNED VALUE
        // ===================================================

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
          "approve"
        ),

        hasPermission(
          "Earned Value",
          "manage"
        ),

        // ===================================================
        // COST REPORTS
        // ===================================================

        hasPermission(
          "Cost Reports",
          "view"
        ),

        hasPermission(
          "Cost Reports",
          "create"
        ),

        hasPermission(
          "Cost Reports",
          "edit"
        ),

        hasPermission(
          "Cost Reports",
          "delete"
        ),

        hasPermission(
          "Cost Reports",
          "approve"
        ),

        hasPermission(
          "Cost Reports",
          "manage"
        ),
      ]);

      // =====================================================
      // SAVE PERMISSIONS
      // =====================================================

      setPermissions({

        // ===================================================
        // DASHBOARD
        // ===================================================

        dashboard: {

          view:
            dashboardView,

          create: false,

          edit: false,

          delete: false,

          approve: false,

          manage: false,
        },

        // ===================================================
        // BUDGET
        // ===================================================

        budget: {

          view:
            budgetView,

          create:
            budgetCreate,

          edit:
            budgetEdit,

          delete:
            budgetDelete,

          approve:
            budgetApprove,

          manage:
            budgetManage,
        },

        // ===================================================
        // COST CODES
        // ===================================================

        costCodes: {

          view:
            costCodesView,

          create:
            costCodesCreate,

          edit:
            costCodesEdit,

          delete:
            costCodesDelete,

          approve:
            costCodesApprove,

          manage:
            costCodesManage,
        },

        // ===================================================
        // COMMITMENTS
        // ===================================================

        commitments: {

          view:
            commitmentsView,

          create:
            commitmentsCreate,

          edit:
            commitmentsEdit,

          delete:
            commitmentsDelete,

          approve:
            commitmentsApprove,

          manage:
            commitmentsManage,
        },

        // ===================================================
        // ACTUAL COSTS
        // ===================================================

        actualCosts: {

          view:
            actualCostsView,

          create:
            actualCostsCreate,

          edit:
            actualCostsEdit,

          delete:
            actualCostsDelete,

          approve:
            actualCostsApprove,

          manage:
            actualCostsManage,
        },

        // ===================================================
        // FORECAST
        // ===================================================

        forecast: {

          view:
            forecastView,

          create:
            forecastCreate,

          edit:
            forecastEdit,

          delete:
            forecastDelete,

          approve:
            forecastApprove,

          manage:
            forecastManage,
        },

        // ===================================================
        // CHANGE ORDERS
        // ===================================================

        changeOrders: {

          view:
            changeOrdersView,

          create:
            changeOrdersCreate,

          edit:
            changeOrdersEdit,

          delete:
            changeOrdersDelete,

          approve:
            changeOrdersApprove,

          manage:
            changeOrdersManage,
        },

        // ===================================================
        // CONTINGENCY
        // ===================================================

        contingency: {

          view:
            contingencyView,

          create:
            contingencyCreate,

          edit:
            contingencyEdit,

          delete:
            contingencyDelete,

          approve:
            contingencyApprove,

          manage:
            contingencyManage,
        },

        // ===================================================
        // EARNED VALUE
        // ===================================================

        earnedValue: {

          view:
            earnedValueView,

          create:
            earnedValueCreate,

          edit:
            earnedValueEdit,

          delete:
            earnedValueDelete,

          approve:
            earnedValueApprove,

          manage:
            earnedValueManage,
        },

        // ===================================================
        // COST REPORTS
        // ===================================================

        costReports: {

          view:
            costReportsView,

          create:
            costReportsCreate,

          edit:
            costReportsEdit,

          delete:
            costReportsDelete,

          approve:
            costReportsApprove,

          manage:
            costReportsManage,
        },
      });

    } catch (error) {

      console.error(
        "COST MANAGEMENT ACCESS ERROR:",
        error
      );

      setProjects([]);

      setSelectedProject("");

      setPermissions(null);

    } finally {

      setLoading(false);

      setLoadingPermissions(false);

    }
  }

  // =========================================================
  // LOAD COST DATA
  //
  // IMPORTANT:
  // Only active records are loaded.
  // Soft-deleted records have deleted_at != NULL
  // and are excluded.
  // =========================================================

  useEffect(() => {

    if (!selectedProject) {

      clearCostData();

      return;
    }

    if (!permissions) {

      return;
    }

    if (!permissions.dashboard.view) {

      clearCostData();

      return;
    }

    loadCostData(
      selectedProject
    );

  }, [
    selectedProject,
    permissions,
  ]);

  // =========================================================
  // CLEAR COST DATA
  // =========================================================

  function clearCostData() {

    setBudgetRows([]);

    setCommitmentRows([]);

    setActualRows([]);

    setChangeOrderRows([]);

    setForecastRows([]);
  }

  // =========================================================
  // LOAD COST DATA
  // =========================================================

  async function loadCostData(
    projectId: string
  ) {

    if (
      !permissions?.dashboard.view
    ) {

      clearCostData();

      return;
    }

    setLoadingCosts(true);

    try {

      const [

        budgetResult,

        commitmentResult,

        actualResult,

        changeOrderResult,

        forecastResult,

      ] = await Promise.all([

        // ===================================================
        // BUDGET
        // ACTIVE RECORDS ONLY
        // ===================================================

        supabase
          .from("budget_lines")
          .select(
            "original_budget"
          )
          .eq(
            "project_id",
            projectId
          )
          .is(
            "deleted_at",
            null
          ),

        // ===================================================
        // COMMITMENTS
        // ACTIVE RECORDS ONLY
        // ===================================================

        supabase
          .from("commitments")
          .select(
            "original_amount, approved_changes"
          )
          .eq(
            "project_id",
            projectId
          )
          .is(
            "deleted_at",
            null
          ),

        // ===================================================
        // ACTUAL COSTS
        // ACTIVE RECORDS ONLY
        // ===================================================

        supabase
          .from("actual_costs")
          .select(
            "amount"
          )
          .eq(
            "project_id",
            projectId
          )
          .is(
            "deleted_at",
            null
          ),

        // ===================================================
        // CHANGE ORDERS
        // ACTIVE RECORDS ONLY
        // ===================================================

        supabase
          .from("change_orders")
          .select(
            "status, approved_amount"
          )
          .eq(
            "project_id",
            projectId
          )
          .is(
            "deleted_at",
            null
          ),

        // ===================================================
        // FORECAST
        // ACTIVE RECORDS ONLY
        // ===================================================

        supabase
          .from("forecast_lines")
          .select(
            "estimate_to_complete"
          )
          .eq(
            "project_id",
            projectId
          )
          .is(
            "deleted_at",
            null
          ),
      ]);

      // =====================================================
      // ERRORS
      // =====================================================

      if (budgetResult.error) {

        console.error(
          "BUDGET ERROR:",
          budgetResult.error
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

      if (changeOrderResult.error) {

        console.error(
          "CHANGE ORDER ERROR:",
          changeOrderResult.error
        );

      }

      if (forecastResult.error) {

        console.error(
          "FORECAST ERROR:",
          forecastResult.error
        );

      }

      // =====================================================
      // SET DATA
      // =====================================================

      setBudgetRows(
        (budgetResult.data as BudgetRow[]) ??
          []
      );

      setCommitmentRows(
        (commitmentResult.data as CommitmentRow[]) ??
          []
      );

      setActualRows(
        (actualResult.data as ActualCostRow[]) ??
          []
      );

      setChangeOrderRows(
        (changeOrderResult.data as ChangeOrderRow[]) ??
          []
      );

      setForecastRows(
        (forecastResult.data as ForecastRow[]) ??
          []
      );

    } catch (error) {

      console.error(
        "COST DATA ERROR:",
        error
      );

      clearCostData();

    } finally {

      setLoadingCosts(false);

    }
  }

  // =========================================================
  // ORIGINAL BUDGET
  // =========================================================

  const originalBudget =
    useMemo(() => {

      return budgetRows.reduce(
        (
          total,
          row
        ) => {

          return (
            total +
            Number(
              row.original_budget ?? 0
            )
          );

        },
        0
      );

    }, [budgetRows]);

  // =========================================================
  // APPROVED CHANGES
  // =========================================================

  const approvedChanges =
    useMemo(() => {

      return changeOrderRows

        .filter(
          (row) =>

            String(
              row.status ?? ""
            ).toLowerCase() ===
            "approved"
        )

        .reduce(
          (
            total,
            row
          ) => {

            return (
              total +
              Number(
                row.approved_amount ?? 0
              )
            );

          },
          0
        );

    }, [
      changeOrderRows,
    ]);

  // =========================================================
  // CURRENT BUDGET
  // =========================================================

  const currentBudget =
    originalBudget +
    approvedChanges;

  // =========================================================
  // COMMITTED COST
  // =========================================================

  const commitments =
    useMemo(() => {

      return commitmentRows.reduce(
        (
          total,
          row
        ) => {

          return (
            total +

            Number(
              row.original_amount ?? 0
            ) +

            Number(
              row.approved_changes ?? 0
            )
          );

        },
        0
      );

    }, [
      commitmentRows,
    ]);

  // =========================================================
  // ACTUAL COST
  // =========================================================

  const actualCost =
    useMemo(() => {

      return actualRows.reduce(
        (
          total,
          row
        ) => {

          return (
            total +
            Number(
              row.amount ?? 0
            )
          );

        },
        0
      );

    }, [
      actualRows,
    ]);

  // =========================================================
  // ESTIMATE TO COMPLETE
  // =========================================================

  const costToComplete =
    useMemo(() => {

      return forecastRows.reduce(
        (
          total,
          row
        ) => {

          return (
            total +
            Number(
              row.estimate_to_complete ?? 0
            )
          );

        },
        0
      );

    }, [
      forecastRows,
    ]);

  // =========================================================
  // FORECAST AT COMPLETION
  //
  // EAC = Actual Cost + ETC
  // =========================================================

  const forecastAtCompletion =
    actualCost +
    costToComplete;

  // =========================================================
  // VARIANCE
  // =========================================================

  const variance =
    currentBudget -
    forecastAtCompletion;

  // =========================================================
  // AVAILABLE BUDGET
  // =========================================================

  const availableBudget =
    Math.max(
      currentBudget -
        actualCost -
        commitments,
      0
    );

  // =========================================================
  // % SPENT
  // =========================================================

  const percentSpent =
    currentBudget > 0

      ? (
          actualCost /
          currentBudget
        ) *
        100

      : 0;

  // =========================================================
  // % COMMITTED
  // =========================================================

  const percentCommitted =
    currentBudget > 0

      ? (
          commitments /
          currentBudget
        ) *
        100

      : 0;

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
  // SELECTED PROJECT NAME
  // =========================================================

  const selectedProjectName =
    projects.find(
      (project) =>
        project.id ===
        selectedProject
    )?.name ??
    "Select Project";

  // =========================================================
  // LOADING
  // =========================================================

  if (
    loading ||
    loadingPermissions
  ) {

    return (

      <main className="p-8 bg-gray-50 min-h-screen">

        <div className="bg-white border rounded-xl p-8">

          Loading Cost Management...

        </div>

      </main>

    );

  }

  // =========================================================
  // NO DASHBOARD PERMISSION
  // =========================================================

  if (
    !permissions?.dashboard.view
  ) {

    return (

      <main className="p-8 bg-gray-50 min-h-screen">

        <div className="max-w-xl mx-auto bg-white border rounded-xl p-10 text-center shadow-sm">

          <div className="text-5xl mb-4">
            🔒
          </div>

          <h1 className="text-2xl font-bold text-gray-900">

            Cost Management Access Restricted

          </h1>

          <p className="text-gray-500 mt-3">

            You do not have permission to
            view the Cost Management dashboard.

          </p>

          <p className="text-sm text-gray-400 mt-2">

            Contact your company administrator
            if you need access.

          </p>

          <Link
            href="/app/projects"
            className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg"
          >

            Back to Projects

          </Link>

        </div>

      </main>

    );

  }

  // =========================================================
  // NO PROJECTS
  // =========================================================

  if (
    projects.length === 0
  ) {

    return (

      <main className="p-8 bg-gray-50 min-h-screen">

        <div className="bg-white border rounded-xl p-10 text-center">

          <div className="text-5xl">
            📁
          </div>

          <h1 className="text-2xl font-bold mt-4">

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
  // DASHBOARD
  // =========================================================

  return (

    <main className="p-8 bg-gray-50 min-h-screen">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex justify-between items-start mb-6">

        <div>

          <h1 className="text-3xl font-bold text-gray-900">

            Cost Management

          </h1>

          <p className="text-gray-500 mt-1">

            Monitor project budget,
            commitments, actual costs,
            forecasts, and financial
            performance.

          </p>

        </div>

        {/* PROJECT SELECTOR */}

        <div>

          <label className="block text-sm font-medium text-gray-600 mb-1">

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
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white min-w-[220px]"
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

      <div className="mb-5">

        <h2 className="text-xl font-bold">

          {selectedProjectName}

        </h2>

      </div>

      {/* =====================================================
          ACTIVE DATA NOTICE
      ===================================================== */}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">

        <div className="flex items-start gap-3">

          <div className="text-xl">
            ℹ️
          </div>

          <div>

            <p className="font-semibold text-blue-900">

              Dashboard uses active records only

            </p>

            <p className="text-sm text-blue-800 mt-1">

              Records that have been soft-deleted
              from Budget, Commitments, Actual Costs,
              Change Orders, or Forecast are excluded
              automatically from these calculations.

            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div className="bg-white border rounded-xl p-4 mb-6">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="font-semibold text-gray-900">

              Cost Actions

            </h2>

            <p className="text-sm text-gray-500">

              Actions available based on
              your Cost Management permissions.

            </p>

          </div>

          <div className="flex gap-2 flex-wrap">

            {/* =================================================
                BUDGET CREATE
            ================================================= */}

            {permissions?.budget.create && (

              <Link
                href={`/app/cost-management/budget?project=${selectedProject}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >

                + Budget

              </Link>

            )}

            {/* =================================================
                COMMITMENT CREATE
            ================================================= */}

            {permissions?.commitments.create && (

              <Link
                href={`/app/cost-management/commitments?project=${selectedProject}`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >

                + Commitment

              </Link>

            )}

            {/* =================================================
                ACTUAL COST CREATE
            ================================================= */}

            {permissions?.actualCosts.create && (

              <Link
                href={`/app/cost-management/actual-costs?project=${selectedProject}`}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >

                + Actual Cost

              </Link>

            )}

            {/* =================================================
                CHANGE ORDER CREATE
            ================================================= */}

            {permissions?.changeOrders.create && (

              <Link
                href={`/app/cost-management/change-orders?project=${selectedProject}`}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >

                + Change Order

              </Link>

            )}

            {/* =================================================
                FORECAST CREATE
            ================================================= */}

            {permissions?.forecast.create && (

              <Link
                href={`/app/cost-management/forecast?project=${selectedProject}`}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >

                + Forecast

              </Link>

            )}

          </div>

        </div>

      </div>

      {/* =====================================================
          LOADING COST DATA
      ===================================================== */}

      {loadingCosts && (

        <div className="mb-4 text-sm text-blue-600">

          Updating project cost data...

        </div>

      )}

      {/* =====================================================
          TOP KPI CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">

        <KpiCard
          title="Original Budget"
          value={money(
            originalBudget
          )}
          description="Owner-approved baseline"
        />

        <KpiCard
          title="Approved Changes"
          value={money(
            approvedChanges
          )}
          description="Approved Change Orders"
        />

        <KpiCard
          title="Current Budget"
          value={money(
            currentBudget
          )}
          description="Original + approved changes"
        />

        <KpiCard
          title="Actual Cost"
          value={money(
            actualCost
          )}
          description="Costs incurred to date"
        />

      </div>

      {/* =====================================================
          SECONDARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        {/* ===================================================
            FORECAST AT COMPLETION
        =================================================== */}

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">

            Forecast at Completion

          </p>

          <p className="text-3xl font-bold mt-2">

            {money(
              forecastAtCompletion
            )}

          </p>

          <p className="text-xs text-gray-400 mt-2">

            Actual + ETC

          </p>

        </div>

        {/* ===================================================
            COMMITTED COST
        =================================================== */}

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <div className="flex justify-between">

            <div>

              <p className="text-sm text-gray-500">

                Committed Cost

              </p>

              <p className="text-2xl font-bold mt-2">

                {money(
                  commitments
                )}

              </p>

            </div>

            <div className="text-xl">
              📑
            </div>

          </div>

          <div className="mt-4">

            <div className="flex justify-between text-xs text-gray-500">

              <span>

                Budget committed

              </span>

              <span>

                {percentCommitted.toFixed(
                  1
                )}
                %

              </span>

            </div>

            <div className="h-2 bg-gray-100 rounded-full mt-2">

              <div
                className="h-2 bg-blue-500 rounded-full"
                style={{
                  width: `${Math.min(
                    percentCommitted,
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

        </div>

        {/* ===================================================
            ETC
        =================================================== */}

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <div className="flex justify-between">

            <div>

              <p className="text-sm text-gray-500">

                Estimate to Complete

              </p>

              <p className="text-2xl font-bold mt-2">

                {money(
                  costToComplete
                )}

              </p>

            </div>

            <div className="text-xl">
              📈
            </div>

          </div>

          <p className="text-xs text-gray-400 mt-4">

            From saved forecast lines

          </p>

        </div>

        {/* ===================================================
            AVAILABLE BUDGET
        =================================================== */}

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <div className="flex justify-between">

            <div>

              <p className="text-sm text-gray-500">

                Available Budget

              </p>

              <p className="text-2xl font-bold mt-2">

                {money(
                  availableBudget
                )}

              </p>

            </div>

            <div className="text-xl">
              💰
            </div>

          </div>

          <p className="text-xs text-gray-400 mt-4">

            Current budget − actual − commitments

          </p>

        </div>

      </div>

      {/* =====================================================
          BUDGET VS FORECAST
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white border rounded-xl p-6">

          <div className="flex justify-between items-center">

            <div>

              <h2 className="text-lg font-bold">

                Budget vs Forecast

              </h2>

              <p className="text-sm text-gray-500 mt-1">

                Projected final cost compared
                with current approved budget.

              </p>

            </div>

            {/* FORECAST LINK */}

            {permissions?.forecast.view && (

              <Link
                href={`/app/cost-management/forecast?project=${selectedProject}`}
                className="text-blue-600 text-sm hover:underline"
              >

                View Forecast →

              </Link>

            )}

          </div>

          {/* =================================================
              CURRENT BUDGET
          ================================================= */}

          <div className="mt-6">

            <div className="flex justify-between mb-2">

              <span className="text-sm text-gray-600">

                Current Budget

              </span>

              <span className="font-semibold">

                {money(
                  currentBudget
                )}

              </span>

            </div>

            <div className="h-3 bg-gray-100 rounded-full">

              <div
                className="h-3 bg-blue-500 rounded-full"
                style={{
                  width:
                    currentBudget > 0
                      ? "100%"
                      : "0%",
                }}
              />

            </div>

          </div>

          {/* =================================================
              FORECAST
          ================================================= */}

          <div className="mt-5">

            <div className="flex justify-between mb-2">

              <span className="text-sm text-gray-600">

                Forecast at Completion

              </span>

              <span className="font-semibold">

                {money(
                  forecastAtCompletion
                )}

              </span>

            </div>

            <div className="h-3 bg-gray-100 rounded-full">

              <div
                className={`h-3 rounded-full ${
                  forecastAtCompletion >
                  currentBudget
                    ? "bg-red-500"
                    : "bg-green-500"
                }`}
                style={{
                  width:
                    currentBudget > 0
                      ? `${Math.min(
                          (
                            forecastAtCompletion /
                            currentBudget
                          ) *
                            100,
                          100
                        )}%`
                      : "0%",
                }}
              />

            </div>

          </div>

        </div>

        {/* ===================================================
            COST STATUS
        =================================================== */}

        <div className="bg-white border rounded-xl p-6">

          <h2 className="text-lg font-bold">

            Cost Status

          </h2>

          <p className="text-sm text-gray-500 mt-1">

            Current project financial position.

          </p>

          <div className="grid grid-cols-2 gap-6 mt-7">

            {/* VARIANCE */}

            <div>

              <p className="text-sm text-gray-500">

                Variance

              </p>

              <p
                className={`text-2xl font-bold mt-1 ${
                  variance < 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >

                {money(
                  variance
                )}

              </p>

              <p className="text-xs text-gray-400 mt-1">

                Current budget − forecast

              </p>

            </div>

            {/* SPENT */}

            <div>

              <p className="text-sm text-gray-500">

                % Spent

              </p>

              <p className="text-2xl font-bold mt-1">

                {percentSpent.toFixed(
                  1
                )}
                %

              </p>

              <p className="text-xs text-gray-400 mt-1">

                Actual / current budget

              </p>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          COST MANAGEMENT MODULES
      ===================================================== */}

      <div className="bg-white border rounded-xl p-6 mt-6">

        <h2 className="text-lg font-bold">

          Cost Management Modules

        </h2>

        <p className="text-sm text-gray-500 mt-1 mb-5">

          Only modules you have permission to
          view are displayed.

        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* =================================================
              BUDGET
          ================================================= */}

          {permissions?.budget.view && (

            <ModuleLink
              href={`/app/cost-management/budget?project=${selectedProject}`}
              title="Budget"
              description="Manage owner-approved budget"
              icon="💰"
            />

          )}

          {/* =================================================
              COST CODES
          ================================================= */}

          {permissions?.costCodes.view && (

            <ModuleLink
              href={`/app/cost-management/cost-codes?project=${selectedProject}`}
              title="Cost Codes"
              description="Manage cost structure"
              icon="🏷️"
            />

          )}

          {/* =================================================
              COMMITMENTS
          ================================================= */}

          {permissions?.commitments.view && (

            <ModuleLink
              href={`/app/cost-management/commitments?project=${selectedProject}`}
              title="Commitments"
              description="Contracts and purchase orders"
              icon="📑"
            />

          )}

          {/* =================================================
              ACTUAL COSTS
          ================================================= */}

          {permissions?.actualCosts.view && (

            <ModuleLink
              href={`/app/cost-management/actual-costs?project=${selectedProject}`}
              title="Actual Costs"
              description="Record costs incurred"
              icon="💵"
            />

          )}

          {/* =================================================
              FORECAST
          ================================================= */}

          {permissions?.forecast.view && (

            <ModuleLink
              href={`/app/cost-management/forecast?project=${selectedProject}`}
              title="Forecast"
              description="Estimate final project cost"
              icon="📊"
            />

          )}

          {/* =================================================
              CHANGE ORDERS
          ================================================= */}

          {permissions?.changeOrders.view && (

            <ModuleLink
              href={`/app/cost-management/change-orders?project=${selectedProject}`}
              title="Change Orders"
              description="Manage approved cost changes"
              icon="🔄"
            />

          )}

          {/* =================================================
              CONTINGENCY
          ================================================= */}

          {permissions?.contingency.view && (

            <ModuleLink
              href={`/app/cost-management/contingency?project=${selectedProject}`}
              title="Contingency"
              description="Track contingency usage"
              icon="🛡️"
            />

          )}

          {/* =================================================
              EARNED VALUE
          ================================================= */}

          {permissions?.earnedValue.view && (

            <ModuleLink
              href={`/app/cost-management/earned-value?project=${selectedProject}`}
              title="Earned Value"
              description="Track project performance"
              icon="📈"
            />

          )}

          {/* =================================================
              COST REPORTS
          ================================================= */}

          {permissions?.costReports.view && (

            <ModuleLink
              href={`/app/cost-management/cost-reports?project=${selectedProject}`}
              title="Cost Reports"
              description="Generate financial reports"
              icon="📄"
            />

          )}

        </div>

      </div>

    </main>

  );
}

// =========================================================
// KPI CARD
// =========================================================

function KpiCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {

  return (

    <div className="bg-white border rounded-xl p-5 shadow-sm">

      <p className="text-sm text-gray-500">

        {title}

      </p>

      <p className="text-3xl font-bold mt-2">

        {value}

      </p>

      <p className="text-xs text-gray-400 mt-2">

        {description}

      </p>

    </div>

  );
}

// =========================================================
// MODULE LINK
// =========================================================

function ModuleLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {

  return (

    <Link
      href={href}
      className="border rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition"
    >

      <div className="text-2xl">

        {icon}

      </div>

      <h3 className="font-semibold mt-3">

        {title}

      </h3>

      <p className="text-xs text-gray-500 mt-1">

        {description}

      </p>

      <p className="text-blue-600 text-sm font-medium mt-3">

        Open →

      </p>

    </Link>

  );

}