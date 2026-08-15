"use client";

import { useEffect, useMemo, useState } from "react";
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

type Row = Record<string, any>;

type ReportPermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  manage: boolean;
};

const REPORT_TYPES = [
  "Executive Cost Report",
  "Budget vs Actual",
  "Commitment Report",
  "Change Order Report",
  "Contingency Report",
  "Earned Value Report",
  "Cost Code Report",
];

// ============================================================
// MAIN PAGE
// ============================================================

export default function CostReportsPage() {
  // ============================================================
  // PROJECTS
  // ============================================================

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");

  // ============================================================
  // DATA
  // ============================================================

  const [budgetRows, setBudgetRows] = useState<Row[]>([]);
  const [commitmentRows, setCommitmentRows] = useState<Row[]>([]);
  const [actualRows, setActualRows] = useState<Row[]>([]);
  const [changeOrderRows, setChangeOrderRows] = useState<Row[]>([]);
  const [contingencyRows, setContingencyRows] = useState<Row[]>([]);
  const [evmRows, setEvmRows] = useState<Row[]>([]);

  // ============================================================
  // UI
  // ============================================================

  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  const [reportType, setReportType] = useState(
    "Executive Cost Report"
  );

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Temporary filter values used by Edit Filters modal
  const [draftReportType, setDraftReportType] = useState(
    "Executive Cost Report"
  );

  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");

  // ============================================================
  // MODALS
  // ============================================================

  const [showCreateReport, setShowCreateReport] =
    useState(false);

  const [showEditFilters, setShowEditFilters] =
    useState(false);

  const [showManage, setShowManage] =
    useState(false);

  const [showReportInfo, setShowReportInfo] =
    useState(false);

  // ============================================================
  // PERMISSIONS
  // ============================================================

  const [permissions, setPermissions] =
    useState<ReportPermissions>({
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

  // ============================================================
  // MODAL OPEN STATE
  // ============================================================

  const anyModalOpen =
    showCreateReport ||
    showEditFilters ||
    showManage ||
    showReportInfo;

  // ============================================================
  // LOCK BACKGROUND WHEN MODAL IS OPEN
  // ============================================================

  useEffect(() => {
    if (!anyModalOpen) {
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
  }, [anyModalOpen]);

  // ============================================================
  // ESCAPE KEY
  // ============================================================

  useEffect(() => {
    if (!anyModalOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setShowCreateReport(false);
      setShowEditFilters(false);
      setShowManage(false);
      setShowReportInfo(false);
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [anyModalOpen]);

  // ============================================================
  // LOAD PAGE
  // ============================================================

  useEffect(() => {
    loadPage();
  }, []);

  // ============================================================
  // LOAD PROJECTS + PERMISSIONS
  // ============================================================

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
        (result.projects as Project[]) ??
        [];

      setProjects(projectList);

      if (projectList.length > 0) {
        setSelectedProject((current) => {
          const stillAccessible =
            current &&
            projectList.some(
              (project) =>
                project.id === current
            );

          return stillAccessible
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
          "manage"
        ),
      ]);

      console.log(
        "COST REPORT PERMISSIONS:",
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
        "COST REPORT PAGE ERROR:",
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

  // ============================================================
  // LOAD REPORT DATA WHEN PROJECT CHANGES
  // ============================================================

  useEffect(() => {
    if (
      selectedProject &&
      canView
    ) {
      loadReportData();
    } else {
      clearReportData();
    }
  }, [
    selectedProject,
    canView,
  ]);

  // ============================================================
  // CLEAR DATA
  // ============================================================

  function clearReportData() {
    setBudgetRows([]);
    setCommitmentRows([]);
    setActualRows([]);
    setChangeOrderRows([]);
    setContingencyRows([]);
    setEvmRows([]);
  }

  // ============================================================
  // LOAD REPORT DATA
  // ============================================================

  async function loadReportData() {
    if (!selectedProject) {
      return;
    }

    setLoadingReport(true);

    try {
      const [
        budget,
        commitments,
        actuals,
        changes,
        contingency,
        evm,
      ] = await Promise.all([
        supabase
          .from("budget_lines")
          .select("*")
          .eq(
            "project_id",
            selectedProject
          )
          .is(
            "deleted_at",
            null
          ),

        supabase
          .from("commitments")
          .select("*")
          .eq(
            "project_id",
            selectedProject
          )
          .is(
            "deleted_at",
            null
          ),

        supabase
          .from("actual_costs")
          .select("*")
          .eq(
            "project_id",
            selectedProject
          )
          .is(
            "deleted_at",
            null
          ),

        supabase
          .from("change_orders")
          .select("*")
          .eq(
            "project_id",
            selectedProject
          )
          .is(
            "deleted_at",
            null
          ),

        supabase
          .from("contingency_entries")
          .select("*")
          .eq(
            "project_id",
            selectedProject
          )
          .is(
            "deleted_at",
            null
          ),

        supabase
          .from("earned_value_entries")
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
            "period_date",
            {
              ascending: true,
            }
          ),
      ]);

      if (budget.error) {
        console.error(
          "BUDGET ERROR:",
          budget.error
        );
      }

      if (commitments.error) {
        console.error(
          "COMMITMENTS ERROR:",
          commitments.error
        );
      }

      if (actuals.error) {
        console.error(
          "ACTUAL COST ERROR:",
          actuals.error
        );
      }

      if (changes.error) {
        console.error(
          "CHANGE ORDER ERROR:",
          changes.error
        );
      }

      if (contingency.error) {
        console.error(
          "CONTINGENCY ERROR:",
          contingency.error
        );
      }

      if (evm.error) {
        console.error(
          "EVM ERROR:",
          evm.error
        );
      }

      setBudgetRows(
        budget.data ?? []
      );

      setCommitmentRows(
        commitments.data ?? []
      );

      setActualRows(
        actuals.data ?? []
      );

      setChangeOrderRows(
        changes.data ?? []
      );

      setContingencyRows(
        contingency.data ?? []
      );

      setEvmRows(
        evm.data ?? []
      );
    } catch (error) {
      console.error(
        "LOAD REPORT DATA ERROR:",
        error
      );

      clearReportData();
    } finally {
      setLoadingReport(false);
    }
  }

  // ============================================================
  // AMOUNT HELPER
  // ============================================================

  function getAmount(
    row: Row,
    columns: string[]
  ) {
    for (
      const column of columns
    ) {
      const value =
        row?.[column];

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        const parsed =
          Number(value);

        if (
          !Number.isNaN(parsed)
        ) {
          return parsed;
        }
      }
    }

    return 0;
  }

  // ============================================================
  // TOTALS
  // ============================================================

  const originalBudget =
    useMemo(() => {
      return budgetRows.reduce(
        (
          sum,
          row
        ) =>
          sum +
          getAmount(
            row,
            [
              "amount",
              "budget_amount",
              "original_budget",
              "line_amount",
              "total_amount",
            ]
          ),
        0
      );
    }, [budgetRows]);

  const commitments =
    useMemo(() => {
      return commitmentRows.reduce(
        (
          sum,
          row
        ) =>
          sum +
          getAmount(
            row,
            [
              "amount",
              "committed_amount",
              "contract_amount",
              "commitment_amount",
              "total_amount",
              "original_amount",
              "approved_changes",
            ]
          ),
        0
      );
    }, [commitmentRows]);

  const actualCost =
    useMemo(() => {
      return actualRows.reduce(
        (
          sum,
          row
        ) =>
          sum +
          getAmount(
            row,
            [
              "amount",
              "actual_cost",
              "actual_amount",
              "cost",
              "total_amount",
            ]
          ),
        0
      );
    }, [actualRows]);

  const changeOrders =
    useMemo(() => {
      return changeOrderRows.reduce(
        (
          sum,
          row
        ) =>
          sum +
          getAmount(
            row,
            [
              "approved_amount",
              "change_amount",
              "amount",
              "total_amount",
            ]
          ),
        0
      );
    }, [changeOrderRows]);

  const contingencyAllocated =
    useMemo(() => {
      return contingencyRows
        .filter(
          (row) =>
            row.entry_type ===
            "Allocation"
        )
        .reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.amount || 0
            ),
          0
        );
    }, [
      contingencyRows,
    ]);

  const contingencyUsed =
    useMemo(() => {
      return contingencyRows
        .filter(
          (row) =>
            row.entry_type ===
            "Usage"
        )
        .reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.amount || 0
            ),
          0
        );
    }, [
      contingencyRows,
    ]);

  // ============================================================
  // EARNED VALUE
  // ============================================================

  const pv =
    useMemo(() => {
      return evmRows.reduce(
        (
          sum,
          row
        ) =>
          sum +
          Number(
            row.planned_value ||
              0
          ),
        0
      );
    }, [evmRows]);

  const ev =
    useMemo(() => {
      return evmRows.reduce(
        (
          sum,
          row
        ) =>
          sum +
          Number(
            row.earned_value ||
              0
          ),
        0
      );
    }, [evmRows]);

  const evmActualCost =
    useMemo(() => {
      return evmRows.reduce(
        (
          sum,
          row
        ) =>
          sum +
          Number(
            row.actual_cost ||
              0
          ),
        0
      );
    }, [evmRows]);

  // ============================================================
  // CURRENT BUDGET
  // ============================================================

  const currentBudget =
    originalBudget +
    changeOrders;

  // ============================================================
  // FORECAST
  // ============================================================

  const forecast =
    evmActualCost > 0 &&
    ev > 0
      ? evmActualCost +
        Math.max(
          currentBudget -
            ev,
          0
        )
      : actualCost +
        Math.max(
          currentBudget -
            actualCost,
          0
        );

  // ============================================================
  // VARIANCE
  // ============================================================

  const variance =
    currentBudget -
    forecast;

  // ============================================================
  // EVM
  // ============================================================

  const cpi =
    evmActualCost > 0
      ? ev /
        evmActualCost
      : 0;

  const spi =
    pv > 0
      ? ev / pv
      : 0;

  // ============================================================
  // CONTINGENCY
  // ============================================================

  const contingencyRemaining =
    contingencyAllocated -
    contingencyUsed;

  // ============================================================
  // COST CODE BREAKDOWN
  // ============================================================

  const costCodeBreakdown =
    useMemo(() => {
      const map: Record<
        string,
        {
          budget: number;
          actual: number;
          committed: number;
        }
      > = {};

      budgetRows.forEach(
        (row) => {
          const code =
            row.cost_code ||
            row.cost_code_id ||
            row.code ||
            "Unassigned";

          if (!map[code]) {
            map[code] = {
              budget: 0,
              actual: 0,
              committed: 0,
            };
          }

          map[code].budget +=
            getAmount(
              row,
              [
                "amount",
                "budget_amount",
                "original_budget",
                "line_amount",
                "total_amount",
              ]
            );
        }
      );

      commitmentRows.forEach(
        (row) => {
          const code =
            row.cost_code ||
            row.cost_code_id ||
            row.code ||
            "Unassigned";

          if (!map[code]) {
            map[code] = {
              budget: 0,
              actual: 0,
              committed: 0,
            };
          }

          map[code].committed +=
            getAmount(
              row,
              [
                "amount",
                "committed_amount",
                "contract_amount",
                "commitment_amount",
                "total_amount",
                "original_amount",
              ]
            ) +
            Number(
              row.approved_changes ||
                0
            );
        }
      );

      actualRows.forEach(
        (row) => {
          const code =
            row.cost_code ||
            row.cost_code_id ||
            row.code ||
            "Unassigned";

          if (!map[code]) {
            map[code] = {
              budget: 0,
              actual: 0,
              committed: 0,
            };
          }

          map[code].actual +=
            getAmount(
              row,
              [
                "amount",
                "actual_cost",
                "actual_amount",
                "cost",
                "total_amount",
              ]
            );
        }
      );

      return Object.entries(
        map
      ).map(
        ([
          code,
          values,
        ]) => ({
          code,
          ...values,
          variance:
            values.budget -
            values.actual -
            values.committed,
        })
      );
    }, [
      budgetRows,
      commitmentRows,
      actualRows,
    ]);

  // ============================================================
  // CURRENCY
  // ============================================================

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

  // ============================================================
  // PROJECT NAME
  // ============================================================

  const selectedProjectName =
    projects.find(
      (project) =>
        project.id ===
        selectedProject
    )?.name ||
    "Project";

  // ============================================================
  // VIEW REPORT
  // ============================================================

  function handleViewReport() {
    if (!canView) {
      alert(
        "You do not have permission to view Cost Reports."
      );
      return;
    }

    setShowReportInfo(true);
  }

  // ============================================================
  // OPEN EDIT FILTERS
  // ============================================================

  function handleEditFilters() {
    if (!canEdit) {
      alert(
        "You do not have permission to edit Cost Report filters."
      );
      return;
    }

    // Copy current values into modal
    setDraftReportType(
      reportType
    );

    setDraftStartDate(
      startDate
    );

    setDraftEndDate(
      endDate
    );

    setShowEditFilters(true);
  }

  // ============================================================
  // APPLY FILTERS
  // ============================================================

  function applyFilters() {
    if (!canEdit) {
      alert(
        "You do not have permission to edit Cost Report filters."
      );
      return;
    }

    if (
      draftStartDate &&
      draftEndDate &&
      draftStartDate >
        draftEndDate
    ) {
      alert(
        "Start Date cannot be after End Date."
      );
      return;
    }

    setReportType(
      draftReportType
    );

    setStartDate(
      draftStartDate
    );

    setEndDate(
      draftEndDate
    );

    setShowEditFilters(false);

    // Bring user back to report
    setTimeout(() => {
      document
        .getElementById(
          "cost-report-content"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  }

  // ============================================================
  // OPEN CREATE REPORT
  // ============================================================

  function handleCreateDownload() {
    if (!canCreate) {
      alert(
        "You do not have permission to generate or download reports."
      );
      return;
    }

    setDraftReportType(
      reportType
    );

    setDraftStartDate(
      startDate
    );

    setDraftEndDate(
      endDate
    );

    setShowCreateReport(true);
  }

  // ============================================================
  // GENERATE + DOWNLOAD
  // ============================================================

  function handleGenerateAndDownload() {
    if (!canCreate) {
      alert(
        "You do not have permission to generate or download reports."
      );
      return;
    }

    if (
      draftStartDate &&
      draftEndDate &&
      draftStartDate >
        draftEndDate
    ) {
      alert(
        "Start Date cannot be after End Date."
      );
      return;
    }

    // Apply selected settings first
    setReportType(
      draftReportType
    );

    setStartDate(
      draftStartDate
    );

    setEndDate(
      draftEndDate
    );

    setShowCreateReport(false);

    // Download using selected modal values
    downloadCSV({
      selectedReportType:
        draftReportType,
      selectedStartDate:
        draftStartDate,
      selectedEndDate:
        draftEndDate,
    });
  }

  // ============================================================
  // REFRESH
  // ============================================================

  async function handleRefresh() {
    if (!canView) {
      alert(
        "You do not have permission to view Cost Reports."
      );
      return;
    }

    await loadReportData();
  }

  // ============================================================
  // DOWNLOAD CSV
  // ============================================================

  function downloadCSV(options?: {
    selectedReportType?: string;
    selectedStartDate?: string;
    selectedEndDate?: string;
  }) {
    if (!canCreate) {
      alert(
        "You do not have permission to generate or download reports."
      );
      return;
    }

    const csvReportType =
      options?.selectedReportType ??
      reportType;

    const csvStartDate =
      options?.selectedStartDate ??
      startDate;

    const csvEndDate =
      options?.selectedEndDate ??
      endDate;

    const rows = [
      [
        "Project",
        "Report",
        "Start Date",
        "End Date",
        "Original Budget",
        "Change Orders",
        "Current Budget",
        "Commitments",
        "Actual Cost",
        "Forecast",
        "Variance",
        "Contingency Remaining",
        "PV",
        "EV",
        "EVM Actual Cost",
        "CPI",
        "SPI",
      ],

      [
        selectedProjectName,
        csvReportType,
        csvStartDate || "All",
        csvEndDate || "All",
        originalBudget,
        changeOrders,
        currentBudget,
        commitments,
        actualCost,
        forecast,
        variance,
        contingencyRemaining,
        pv,
        ev,
        evmActualCost,
        cpi.toFixed(2),
        spi.toFixed(2),
      ],
    ];

    const csv =
      rows
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
      `${selectedProjectName.replace(
        /\s+/g,
        "_"
      )}_Cost_Report.csv`;

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

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">
        <div className="bg-white border rounded-xl p-8">
          Loading Cost Reports...
        </div>
      </main>
    );
  }

  // ============================================================
  // NO VIEW PERMISSION
  // ============================================================

  if (!canView) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-xl mx-auto bg-white border rounded-xl p-10 text-center shadow-sm">
          <div className="text-5xl mb-4">
            🔒
          </div>

          <h1 className="text-2xl font-bold">
            Cost Reports Access Restricted
          </h1>

          <p className="text-gray-500 mt-3">
            You do not have permission
            to view Cost Reports.
          </p>

          <p className="text-sm text-gray-400 mt-2">
            Contact your company
            administrator if you need
            access.
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // NO PROJECTS
  // ============================================================

  if (
    projects.length ===
    0
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

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main className="p-8 bg-gray-50 min-h-screen">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex justify-between items-start mb-6">

        <div>
          <h1 className="text-3xl font-bold">
            Cost Reports
          </h1>

          <p className="text-gray-500 mt-1">
            Project cost reporting and
            financial performance analysis.
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">
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
            className="border rounded-lg px-4 py-2.5 bg-white min-w-[260px]"
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

      {/* ======================================================
          ACTION BAR
      ====================================================== */}

      <div className="flex gap-3 flex-wrap mb-6">

        {canView && (
          <button
            type="button"
            onClick={
              handleViewReport
            }
            className="cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200 px-5 py-2.5 rounded-full font-semibold active:scale-95 transition"
          >
            👁️ View Report
          </button>
        )}

        {canCreate && (
          <button
            type="button"
            onClick={
              handleCreateDownload
            }
            className="cursor-pointer bg-green-100 text-green-700 hover:bg-green-200 px-5 py-2.5 rounded-full font-semibold active:scale-95 transition"
          >
            ＋ Create / Download
          </button>
        )}

        {canEdit && (
          <button
            type="button"
            onClick={
              handleEditFilters
            }
            className="cursor-pointer bg-purple-100 text-purple-700 hover:bg-purple-200 px-5 py-2.5 rounded-full font-semibold active:scale-95 transition"
          >
            ✏️ Edit Filters
          </button>
        )}

        {canManage && (
          <button
            type="button"
            onClick={() =>
              setShowManage(
                true
              )
            }
            className="cursor-pointer bg-gray-800 text-white hover:bg-gray-900 px-5 py-2.5 rounded-full font-semibold active:scale-95 transition"
          >
            ⚙️ Manage
          </button>
        )}

        <button
          type="button"
          onClick={
            handleRefresh
          }
          className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-full font-semibold active:scale-95 transition"
        >
          ↻ Refresh
        </button>

      </div>

      {/* ======================================================
          PROJECT NOTICE
      ====================================================== */}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">

        <div className="flex items-start gap-3">

          <div className="text-xl">
            ℹ️
          </div>

          <div>
            <p className="font-semibold text-blue-900">
              {selectedProjectName}
            </p>

            <p className="text-sm text-blue-800 mt-1">
              Cost Reports use active records
              from Budget, Commitments, Actual
              Costs, Change Orders, Contingency,
              and Earned Value.
            </p>
          </div>

        </div>

      </div>

      {/* ======================================================
          REPORT FILTERS
      ====================================================== */}

      <div
        id="cost-report-filters"
        className="bg-white border rounded-xl p-5 mb-6"
      >

        <div className="flex justify-between items-center mb-5">

          <div>
            <h2 className="text-lg font-bold">
              Report Filters
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Configure the report before reviewing or downloading it.
            </p>
          </div>

          {!canEdit && (
            <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs font-semibold">
              View Only
            </span>
          )}

        </div>

        <div className="grid grid-cols-3 gap-4">

          <div>
            <label className="block text-sm font-medium mb-1">
              Report Type
            </label>

            <select
              value={
                reportType
              }
              onChange={(e) =>
                setReportType(
                  e.target.value
                )
              }
              disabled={
                !canEdit
              }
              className="w-full border rounded-lg p-3 disabled:bg-gray-100 disabled:text-gray-500"
            >
              {REPORT_TYPES.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Start Date
            </label>

            <input
              type="date"
              value={
                startDate
              }
              onChange={(e) =>
                setStartDate(
                  e.target.value
                )
              }
              disabled={
                !canEdit
              }
              className="w-full border rounded-lg p-3 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              End Date
            </label>

            <input
              type="date"
              value={
                endDate
              }
              onChange={(e) =>
                setEndDate(
                  e.target.value
                )
              }
              disabled={
                !canEdit
              }
              className="w-full border rounded-lg p-3 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

        </div>

      </div>

      {/* ======================================================
          REPORT CONTENT
      ====================================================== */}

      <div
        id="cost-report-content"
        className="scroll-mt-6"
      >

        {/* REPORT HEADER */}

        <div className="bg-white border rounded-xl p-6 mb-6">

          <div className="flex justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Project
              </p>

              <h2 className="text-2xl font-bold">
                {
                  selectedProjectName
                }
              </h2>
            </div>

            <div className="text-right">

              <p className="text-sm text-gray-500">
                Report
              </p>

              <p className="font-semibold">
                {reportType}
              </p>

              {(startDate ||
                endDate) && (
                <p className="text-xs text-gray-400 mt-1">
                  {startDate ||
                    "Beginning"}{" "}
                  →{" "}
                  {endDate ||
                    "Current"}
                </p>
              )}

            </div>

          </div>

        </div>

        {/* LOADING */}

        {loadingReport && (
          <div className="mb-5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-4">
            Updating report data...
          </div>
        )}

        {/* KPI */}

        <div className="grid grid-cols-4 gap-4 mb-6">

          <ReportCard
            title="Original Budget"
            value={money(
              originalBudget
            )}
          />

          <ReportCard
            title="Current Budget"
            value={money(
              currentBudget
            )}
          />

          <ReportCard
            title="Commitments"
            value={money(
              commitments
            )}
          />

          <ReportCard
            title="Actual Cost"
            value={money(
              actualCost
            )}
          />

          <ReportCard
            title="Forecast"
            value={money(
              forecast
            )}
          />

          <ReportCard
            title="Variance"
            value={money(
              variance
            )}
            valueClass={
              variance < 0
                ? "text-red-600"
                : "text-green-600"
            }
          />

          <ReportCard
            title="Contingency Remaining"
            value={money(
              contingencyRemaining
            )}
          />

          <ReportCard
            title="Change Orders"
            value={money(
              changeOrders
            )}
          />

        </div>

        {/* FINANCIAL POSITION + EVM */}

        <div className="grid grid-cols-2 gap-6 mb-6">

          <div className="bg-white border rounded-xl p-6">

            <h2 className="text-xl font-bold mb-5">
              Financial Position
            </h2>

            <ReportLine
              label="Original Budget"
              value={money(
                originalBudget
              )}
            />

            <ReportLine
              label="Approved Change Orders"
              value={money(
                changeOrders
              )}
            />

            <ReportLine
              label="Current Budget"
              value={money(
                currentBudget
              )}
              bold
            />

            <ReportLine
              label="Commitments"
              value={money(
                commitments
              )}
            />

            <ReportLine
              label="Actual Cost"
              value={money(
                actualCost
              )}
            />

            <ReportLine
              label="Forecast at Completion"
              value={money(
                forecast
              )}
              bold
            />

            <ReportLine
              label="Forecast Variance"
              value={money(
                variance
              )}
              bold
            />

          </div>

          <div className="bg-white border rounded-xl p-6">

            <h2 className="text-xl font-bold mb-5">
              Earned Value Summary
            </h2>

            <ReportLine
              label="Planned Value"
              value={money(pv)}
            />

            <ReportLine
              label="Earned Value"
              value={money(ev)}
            />

            <ReportLine
              label="Actual Cost"
              value={money(
                evmActualCost
              )}
            />

            <ReportLine
              label="Cost Performance Index"
              value={cpi.toFixed(2)}
            />

            <ReportLine
              label="Schedule Performance Index"
              value={spi.toFixed(2)}
            />

            <div className="mt-5 grid grid-cols-2 gap-4">

              <div className="bg-gray-50 rounded-lg p-4">

                <p className="text-sm text-gray-500">
                  Cost Status
                </p>

                <p
                  className={`font-bold mt-1 ${
                    cpi >= 1
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {cpi >= 1
                    ? "Under Budget"
                    : "Over Budget"}
                </p>

              </div>

              <div className="bg-gray-50 rounded-lg p-4">

                <p className="text-sm text-gray-500">
                  Schedule Status
                </p>

                <p
                  className={`font-bold mt-1 ${
                    spi >= 1
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {spi >= 1
                    ? "On / Ahead"
                    : "Behind"}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* COST CODE */}

        <div className="bg-white border rounded-xl overflow-hidden mb-6">

          <div className="p-6 border-b">

            <h2 className="text-xl font-bold">
              Cost Code Breakdown
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Budget, commitments, actual cost,
              and remaining variance by cost code.
            </p>

          </div>

          {costCodeBreakdown.length ===
          0 ? (

            <div className="p-10 text-center text-gray-500">
              No cost-code data available.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="text-left p-4">
                      Cost Code
                    </th>

                    <th className="text-right p-4">
                      Budget
                    </th>

                    <th className="text-right p-4">
                      Committed
                    </th>

                    <th className="text-right p-4">
                      Actual
                    </th>

                    <th className="text-right p-4">
                      Variance
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {costCodeBreakdown.map(
                    (row) => (

                      <tr
                        key={
                          row.code
                        }
                        className="border-t hover:bg-gray-50"
                      >

                        <td className="p-4 font-medium">
                          {
                            row.code
                          }
                        </td>

                        <td className="p-4 text-right">
                          {money(
                            row.budget
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

                        <td
                          className={`p-4 text-right font-semibold ${
                            row.variance <
                            0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {money(
                            row.variance
                          )}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* CHANGE ORDERS */}

        <div className="bg-white border rounded-xl overflow-hidden mb-6">

          <div className="p-6 border-b">

            <h2 className="text-xl font-bold">
              Change Order Summary
            </h2>

          </div>

          <div className="grid grid-cols-3 gap-6 p-6">

            <div>

              <p className="text-sm text-gray-500">
                Active Change Orders
              </p>

              <p className="text-2xl font-bold mt-1">
                {
                  changeOrderRows.length
                }
              </p>

            </div>

            <div>

              <p className="text-sm text-gray-500">
                Active Total Amount
              </p>

              <p className="text-2xl font-bold mt-1">
                {money(
                  changeOrders
                )}
              </p>

            </div>

            <div>

              <p className="text-sm text-gray-500">
                Current Budget Impact
              </p>

              <p className="text-2xl font-bold mt-1">
                {money(
                  changeOrders
                )}
              </p>

            </div>

          </div>

        </div>

        {/* CONTINGENCY */}

        <div className="bg-white border rounded-xl overflow-hidden mb-6">

          <div className="p-6 border-b">

            <h2 className="text-xl font-bold">
              Contingency Summary
            </h2>

          </div>

          <div className="grid grid-cols-3 gap-6 p-6">

            <div>

              <p className="text-sm text-gray-500">
                Allocated
              </p>

              <p className="text-2xl font-bold mt-1">
                {money(
                  contingencyAllocated
                )}
              </p>

            </div>

            <div>

              <p className="text-sm text-gray-500">
                Used
              </p>

              <p className="text-2xl font-bold mt-1">
                {money(
                  contingencyUsed
                )}
              </p>

            </div>

            <div>

              <p className="text-sm text-gray-500">
                Remaining
              </p>

              <p
                className={`text-2xl font-bold mt-1 ${
                  contingencyRemaining <
                  0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {money(
                  contingencyRemaining
                )}
              </p>

            </div>

          </div>

        </div>

        {/* REPORT ACTIONS */}

        <div className="bg-white border rounded-xl p-6 mb-6">

          <h2 className="text-xl font-bold">
            Report Actions
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Use these actions to review or export the current report.
          </p>

          <div className="flex flex-wrap gap-3 mt-5">

            <button
              type="button"
              onClick={
                handleViewReport
              }
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold active:scale-95 transition"
            >
              👁️ View Report
            </button>

            {canCreate && (
              <button
                type="button"
                onClick={
                  handleCreateDownload
                }
                className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold active:scale-95 transition"
              >
                ＋ Create / Download
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={
                  handleEditFilters
                }
                className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-semibold active:scale-95 transition"
              >
                ✏️ Edit Filters
              </button>
            )}

            <button
              type="button"
              onClick={
                handleRefresh
              }
              className="cursor-pointer border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-lg font-semibold active:scale-95 transition"
            >
              ↻ Refresh
            </button>

          </div>

        </div>

      </div>

      {/* FOOTER */}

      <div className="text-sm text-gray-400 text-center py-6">
        Cost report generated from current
        active project financial data.
      </div>

      {/* ======================================================
          CREATE / DOWNLOAD MODAL
      ====================================================== */}

      {showCreateReport && (
        <ModalOverlay
          onClose={() =>
            setShowCreateReport(
              false
            )
          }
        >

          <ModalHeader
            title="Create Cost Report"
            subtitle="Configure the report and download it as a CSV file."
            onClose={() =>
              setShowCreateReport(
                false
              )
            }
          />

          <div className="p-6 overflow-y-auto overscroll-contain">

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">

              <p className="font-semibold text-blue-900">
                {selectedProjectName}
              </p>

              <p className="text-sm text-blue-800 mt-1">
                Select the report settings before generating the download.
              </p>

            </div>

            <div className="space-y-5">

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Report Type
                </label>

                <select
                  value={
                    draftReportType
                  }
                  onChange={(e) =>
                    setDraftReportType(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-3 bg-white"
                >

                  {REPORT_TYPES.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={
                      draftStartDate
                    }
                    onChange={(e) =>
                      setDraftStartDate(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3"
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={
                      draftEndDate
                    }
                    onChange={(e) =>
                      setDraftEndDate(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3"
                  />

                </div>

              </div>

              <div className="bg-gray-50 border rounded-xl p-4">

                <p className="text-sm text-gray-500">
                  Current Report
                </p>

                <p className="font-semibold mt-1">
                  {draftReportType}
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  Date Range:{" "}
                  {draftStartDate ||
                    "Beginning"}{" "}
                  →{" "}
                  {draftEndDate ||
                    "Current"}
                </p>

              </div>

            </div>

          </div>

          <ModalFooter>

            <button
              type="button"
              onClick={() =>
                setShowCreateReport(
                  false
                )
              }
              className="cursor-pointer border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-lg font-semibold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                handleGenerateAndDownload
              }
              className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold"
            >
              ↓ Generate & Download
            </button>

          </ModalFooter>

        </ModalOverlay>
      )}

      {/* ======================================================
          EDIT FILTERS MODAL
      ====================================================== */}

      {showEditFilters && (
        <ModalOverlay
          onClose={() =>
            setShowEditFilters(
              false
            )
          }
        >

          <ModalHeader
            title="Edit Report Filters"
            subtitle="Update the filters used by the Cost Report."
            onClose={() =>
              setShowEditFilters(
                false
              )
            }
          />

          <div className="p-6 overflow-y-auto overscroll-contain">

            <div className="space-y-5">

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Report Type
                </label>

                <select
                  value={
                    draftReportType
                  }
                  onChange={(e) =>
                    setDraftReportType(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-3 bg-white"
                >

                  {REPORT_TYPES.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={
                      draftStartDate
                    }
                    onChange={(e) =>
                      setDraftStartDate(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3"
                  />

                </div>

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={
                      draftEndDate
                    }
                    onChange={(e) =>
                      setDraftEndDate(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3"
                  />

                </div>

              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">

                <p className="font-semibold text-blue-900">
                  Filter Preview
                </p>

                <p className="text-sm text-blue-800 mt-2">
                  Report:{" "}
                  {draftReportType}
                </p>

                <p className="text-sm text-blue-800 mt-1">
                  Start:{" "}
                  {draftStartDate ||
                    "Beginning"}
                </p>

                <p className="text-sm text-blue-800 mt-1">
                  End:{" "}
                  {draftEndDate ||
                    "Current"}
                </p>

              </div>

            </div>

          </div>

          <ModalFooter>

            <button
              type="button"
              onClick={() =>
                setShowEditFilters(
                  false
                )
              }
              className="cursor-pointer border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-lg font-semibold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                applyFilters
              }
              className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-semibold"
            >
              ✓ Apply Filters
            </button>

          </ModalFooter>

        </ModalOverlay>
      )}

      {/* ======================================================
          REPORT INFO MODAL
      ====================================================== */}

      {showReportInfo && (
        <ModalOverlay
          onClose={() =>
            setShowReportInfo(
              false
            )
          }
          maxWidth="max-w-2xl"
        >

          <ModalHeader
            title="Cost Report"
            subtitle="Current report details and summary."
            onClose={() =>
              setShowReportInfo(
                false
              )
            }
          />

          <div className="p-6 overflow-y-auto overscroll-contain">

            <div className="space-y-4">

              <InfoRow
                label="Project"
                value={
                  selectedProjectName
                }
              />

              <InfoRow
                label="Report Type"
                value={
                  reportType
                }
              />

              <InfoRow
                label="Start Date"
                value={
                  startDate ||
                  "All"
                }
              />

              <InfoRow
                label="End Date"
                value={
                  endDate ||
                  "All"
                }
              />

              <InfoRow
                label="Original Budget"
                value={money(
                  originalBudget
                )}
              />

              <InfoRow
                label="Current Budget"
                value={money(
                  currentBudget
                )}
              />

              <InfoRow
                label="Commitments"
                value={money(
                  commitments
                )}
              />

              <InfoRow
                label="Actual Cost"
                value={money(
                  actualCost
                )}
              />

              <InfoRow
                label="Forecast"
                value={money(
                  forecast
                )}
              />

              <InfoRow
                label="Variance"
                value={money(
                  variance
                )}
              />

              <InfoRow
                label="Budget Records"
                value={String(
                  budgetRows.length
                )}
              />

              <InfoRow
                label="Commitment Records"
                value={String(
                  commitmentRows.length
                )}
              />

              <InfoRow
                label="Actual Cost Records"
                value={String(
                  actualRows.length
                )}
              />

              <InfoRow
                label="Change Orders"
                value={String(
                  changeOrderRows.length
                )}
              />

              <InfoRow
                label="EVM Records"
                value={String(
                  evmRows.length
                )}
              />

            </div>

          </div>

          <ModalFooter>

            <button
              type="button"
              onClick={() =>
                setShowReportInfo(
                  false
                )
              }
              className="cursor-pointer border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-lg font-semibold"
            >
              Close
            </button>

            {canCreate && (
              <button
                type="button"
                onClick={() => {
                  setShowReportInfo(
                    false
                  );

                  setTimeout(() => {
                    handleCreateDownload();
                  }, 50);
                }}
                className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold"
              >
                ↓ Create / Download
              </button>
            )}

          </ModalFooter>

        </ModalOverlay>
      )}

      {/* ======================================================
          MANAGE MODAL
      ====================================================== */}

      {showManage && (
        <ModalOverlay
          onClose={() =>
            setShowManage(
              false
            )
          }
          maxWidth="max-w-4xl"
        >

          <ModalHeader
            title="Cost Reports Management"
            subtitle="Manage report access, data refresh, and report actions."
            onClose={() =>
              setShowManage(
                false
              )
            }
          />

          <div className="p-6 overflow-y-auto overscroll-contain">

            {/* SUMMARY */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              <div className="border rounded-xl p-5 bg-gray-50">

                <p className="text-sm text-gray-500">
                  Budget Records
                </p>

                <p className="text-3xl font-bold mt-1">
                  {
                    budgetRows.length
                  }
                </p>

              </div>

              <div className="border rounded-xl p-5 bg-gray-50">

                <p className="text-sm text-gray-500">
                  Commitment Records
                </p>

                <p className="text-3xl font-bold mt-1">
                  {
                    commitmentRows.length
                  }
                </p>

              </div>

              <div className="border rounded-xl p-5 bg-gray-50">

                <p className="text-sm text-gray-500">
                  Actual Records
                </p>

                <p className="text-3xl font-bold mt-1">
                  {
                    actualRows.length
                  }
                </p>

              </div>

              <div className="border rounded-xl p-5 bg-gray-50">

                <p className="text-sm text-gray-500">
                  EVM Records
                </p>

                <p className="text-3xl font-bold mt-1">
                  {
                    evmRows.length
                  }
                </p>

              </div>

            </div>

            {/* MANAGEMENT ACTIONS */}

            <div className="border rounded-xl p-5 mt-6">

              <h3 className="font-bold text-lg">
                Management Actions
              </h3>

              <div className="flex flex-wrap gap-3 mt-4">

                <button
                  type="button"
                  onClick={async () => {
                    await handleRefresh();
                  }}
                  className="cursor-pointer border border-gray-300 hover:bg-gray-50 px-4 py-2.5 rounded-lg font-semibold"
                >
                  ↻ Refresh Report Data
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowManage(
                      false
                    );

                    setTimeout(() => {
                      handleEditFilters();
                    }, 50);
                  }}
                  className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-semibold"
                >
                  ✏️ Configure Filters
                </button>

                {canCreate && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowManage(
                        false
                      );

                      setTimeout(() => {
                        handleCreateDownload();
                      }, 50);
                    }}
                    className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold"
                  >
                    ＋ Create / Download
                  </button>
                )}

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
                    "Create / Download",
                    canCreate,
                  ],
                  [
                    "Edit Filters",
                    canEdit,
                  ],
                  [
                    "Delete",
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

          <ModalFooter>

            <button
              type="button"
              onClick={() =>
                setShowManage(
                  false
                )
              }
              className="cursor-pointer border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-lg font-semibold"
            >
              Close
            </button>

          </ModalFooter>

        </ModalOverlay>
      )}

    </main>
  );
}

// ============================================================
// MODAL OVERLAY
// ============================================================

function ModalOverlay({
  children,
  onClose,
  maxWidth = "max-w-2xl",
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden`}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {children}

      </div>

    </div>
  );
}

// ============================================================
// MODAL HEADER
// ============================================================

function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div className="p-6 border-b flex justify-between items-start shrink-0">

      <div>
        <h2 className="text-2xl font-bold">
          {title}
        </h2>

        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="cursor-pointer text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full w-10 h-10 text-3xl leading-none flex items-center justify-center transition"
      >
        ×
      </button>

    </div>
  );
}

// ============================================================
// MODAL FOOTER
// ============================================================

function ModalFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="border-t p-6 flex justify-end gap-3 shrink-0 bg-white">
      {children}
    </div>
  );
}

// ============================================================
// REPORT CARD
// ============================================================

function ReportCard({
  title,
  value,
  valueClass =
    "text-gray-900",
}: {
  title: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p
        className={`text-2xl font-bold mt-2 ${valueClass}`}
      >
        {value}
      </p>

    </div>
  );
}

// ============================================================
// REPORT LINE
// ============================================================

function ReportLine({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-3 border-b ${
        bold
          ? "font-bold"
          : ""
      }`}
    >

      <span className="text-gray-600">
        {label}
      </span>

      <span>
        {value}
      </span>

    </div>
  );
}

// ============================================================
// INFO ROW
// ============================================================

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between items-center border rounded-lg px-4 py-3">

      <span className="text-gray-500">
        {label}
      </span>

      <span className="font-semibold text-right">
        {value}
      </span>

    </div>
  );
}