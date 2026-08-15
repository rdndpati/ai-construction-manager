"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase";
import { getAccessibleProjects } from "@/lib/projectAccess";
import { hasPermission } from "@/lib/permissions";

// =====================================================
// TYPES
// =====================================================

type Project = {
  id: string;
  name: string;
};

type CostCode = {
  id: string;
  code: string;
  description: string;
};

type Commitment = {
  id: string;
  commitment_number: string;
  vendor: string;
};

type ActualCost = {
  id: string;
  project_id: string;

  cost_code_id: string | null;
  commitment_id: string | null;

  transaction_number: string;
  cost_type: string;

  vendor: string | null;
  description: string | null;

  amount: number;

  transaction_date: string;

  invoice_number: string | null;

  status: string;

  notes: string | null;

  deleted_at: string | null;

  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  cost_codes?: {
    code: string;
    description: string;
  } | null;

  commitments?: {
    commitment_number: string;
    vendor: string;
  } | null;
};

// =====================================================
// CONSTANTS
// =====================================================

const COST_TYPES = [
  "Labor",
  "Material",
  "Equipment",
  "Subcontract",
  "Purchase Order",
  "Expense",
  "Other",
];

const STATUSES = [
  "Draft",
  "Posted",
  "Void",
];

// =====================================================
// MAIN PAGE
// =====================================================

export default function ActualCostsPage() {

  // =====================================================
  // PROJECTS
  // =====================================================

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [selectedProject, setSelectedProject] =
    useState("");

  // =====================================================
  // DATA
  // =====================================================

  const [costCodes, setCostCodes] =
    useState<CostCode[]>([]);

  const [commitments, setCommitments] =
    useState<Commitment[]>([]);

  const [actualCosts, setActualCosts] =
    useState<ActualCost[]>([]);

  const [deletedCosts, setDeletedCosts] =
    useState<ActualCost[]>([]);

  // =====================================================
  // FILTERS
  // =====================================================

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  // =====================================================
  // LOADING
  // =====================================================

  const [loading, setLoading] =
    useState(true);

  const [loadingPermissions, setLoadingPermissions] =
    useState(true);

  const [loadingData, setLoadingData] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  // =====================================================
  // MODALS
  // =====================================================

  const [showForm, setShowForm] =
    useState(false);

  const [showView, setShowView] =
    useState(false);

  const [showDeleted, setShowDeleted] =
    useState(false);

  const [showManage, setShowManage] =
    useState(false);

  const [showEditSelector, setShowEditSelector] =
    useState(false);

  const [showApproveSelector, setShowApproveSelector] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [viewingCost, setViewingCost] =
    useState<ActualCost | null>(null);

  // =====================================================
  // FORM
  // =====================================================

  const [form, setForm] = useState({
    transaction_number: "",
    cost_type: "Material",
    vendor: "",
    description: "",
    cost_code_id: "",
    commitment_id: "",
    amount: "",
    transaction_date:
      new Date()
        .toISOString()
        .split("T")[0],
    invoice_number: "",
    status: "Posted",
    notes: "",
  });

  // =====================================================
  // PERMISSIONS
  // =====================================================

  const [canView, setCanView] =
    useState(false);

  const [canCreate, setCanCreate] =
    useState(false);

  const [canEdit, setCanEdit] =
    useState(false);

  const [canDelete, setCanDelete] =
    useState(false);

  const [canApprove, setCanApprove] =
    useState(false);

  const [canManage, setCanManage] =
    useState(false);

  // =====================================================
  // MODAL OPEN CHECK
  // =====================================================

  const modalOpen =
    showForm ||
    showView ||
    showDeleted ||
    showManage ||
    showEditSelector ||
    showApproveSelector;

  // =====================================================
  // LOCK BACKGROUND SCROLL
  // =====================================================

  useEffect(() => {

    if (!modalOpen) {

      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";

      return;

    }

    const previousBodyOverflow =
      document.body.style.overflow;

    const previousHtmlOverflow =
      document.documentElement.style.overflow;

    document.body.style.overflow =
      "hidden";

    document.documentElement.style.overflow =
      "hidden";

    return () => {

      document.body.style.overflow =
        previousBodyOverflow;

      document.documentElement.style.overflow =
        previousHtmlOverflow;

    };

  }, [modalOpen]);

  // =====================================================
  // LOAD ACCESS
  // =====================================================

  useEffect(() => {

    loadAccess();

  }, []);

  async function loadAccess() {

    setLoading(true);
    setLoadingPermissions(true);

    try {

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

      if (
        projectData.length > 0
      ) {

        setSelectedProject(
          (currentProject) => {

            const stillAvailable =
              projectData.some(
                (project) =>
                  project.id ===
                  currentProject
              );

            return stillAvailable
              ? currentProject
              : projectData[0].id;

          }
        );

      } else {

        setSelectedProject("");

      }

      const [
        viewPermission,
        createPermission,
        editPermission,
        deletePermission,
        approvePermission,
        managePermission,
      ] = await Promise.all([

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

      ]);

      setCanView(
        viewPermission
      );

      setCanCreate(
        createPermission
      );

      setCanEdit(
        editPermission
      );

      setCanDelete(
        deletePermission
      );

      setCanApprove(
        approvePermission
      );

      setCanManage(
        managePermission
      );

    } catch (error) {

      console.error(
        "ACTUAL COST ACCESS ERROR:",
        error
      );

      setProjects([]);
      setSelectedProject("");

      setCanView(false);
      setCanCreate(false);
      setCanEdit(false);
      setCanDelete(false);
      setCanApprove(false);
      setCanManage(false);

    } finally {

      setLoading(false);
      setLoadingPermissions(false);

    }

  }

  // =====================================================
  // LOAD PROJECT DATA
  // =====================================================

  useEffect(() => {

    if (!selectedProject) {

      setCostCodes([]);
      setCommitments([]);
      setActualCosts([]);
      setDeletedCosts([]);

      return;

    }

    if (
      !canView &&
      !canManage
    ) {

      setCostCodes([]);
      setCommitments([]);
      setActualCosts([]);
      setDeletedCosts([]);

      return;

    }

    loadProjectData(
      selectedProject
    );

  }, [
    selectedProject,
    canView,
    canManage,
  ]);

  // =====================================================
  // LOAD EVERYTHING
  // =====================================================

  async function loadProjectData(
    projectId: string
  ) {

    setLoadingData(true);

    try {

      await Promise.all([
        loadCostCodes(projectId),
        loadCommitments(projectId),
        loadActualCosts(projectId),
        loadDeletedCosts(projectId),
      ]);

    } finally {

      setLoadingData(false);

    }

  }

  // =====================================================
  // LOAD COST CODES
  // =====================================================

  async function loadCostCodes(
    projectId: string
  ) {

    const {
      data,
      error,
    } = await supabase
      .from("cost_codes")
      .select(
        "id,code,description"
      )
      .eq(
        "project_id",
        projectId
      )
      .is(
        "deleted_at",
        null
      )
      .order(
        "code"
      );

    if (error) {

      console.error(
        "COST CODE ERROR:",
        error
      );

      setCostCodes([]);

      return;

    }

    setCostCodes(
      (data as CostCode[]) ?? []
    );

  }

  // =====================================================
  // LOAD COMMITMENTS
  // =====================================================

  async function loadCommitments(
    projectId: string
  ) {

    const {
      data,
      error,
    } = await supabase
      .from("commitments")
      .select(
        "id,commitment_number,vendor"
      )
      .eq(
        "project_id",
        projectId
      )
      .is(
        "deleted_at",
        null
      )
      .order(
        "commitment_number"
      );

    if (error) {

      console.error(
        "COMMITMENT ERROR:",
        error
      );

      setCommitments([]);

      return;

    }

    setCommitments(
      (data as Commitment[]) ?? []
    );

  }

  // =====================================================
  // LOAD ACTIVE ACTUAL COSTS
  // =====================================================

  async function loadActualCosts(
    projectId: string
  ) {

    const {
      data,
      error,
    } = await supabase
      .from("actual_costs")
      .select(`
        *,
        cost_codes (
          code,
          description
        ),
        commitments (
          commitment_number,
          vendor
        )
      `)
      .eq(
        "project_id",
        projectId
      )
      .is(
        "deleted_at",
        null
      )
      .order(
        "transaction_date",
        {
          ascending: false,
        }
      );

    if (error) {

      console.error(
        "ACTUAL COST ERROR:",
        error
      );

      setActualCosts([]);

      return;

    }

    setActualCosts(
      (data as ActualCost[]) ?? []
    );

  }

  // =====================================================
  // LOAD DELETED
  // =====================================================

  async function loadDeletedCosts(
    projectId: string
  ) {

    const {
      data,
      error,
    } = await supabase
      .from("actual_costs")
      .select(`
        *,
        cost_codes (
          code,
          description
        ),
        commitments (
          commitment_number,
          vendor
        )
      `)
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
        "DELETED ACTUAL COST ERROR:",
        error
      );

      setDeletedCosts([]);

      return;

    }

    setDeletedCosts(
      (data as ActualCost[]) ?? []
    );

  }

  // =====================================================
  // CLOSE ALL MODALS
  // =====================================================

  function closeAllModals() {

    setShowForm(false);
    setShowView(false);
    setShowDeleted(false);
    setShowManage(false);
    setShowEditSelector(false);
    setShowApproveSelector(false);

    setEditingId(null);
    setViewingCost(null);

  }

  // =====================================================
  // RESET FORM
  // =====================================================

  function resetForm() {

    setForm({

      transaction_number: "",

      cost_type: "Material",

      vendor: "",

      description: "",

      cost_code_id: "",

      commitment_id: "",

      amount: "",

      transaction_date:
        new Date()
          .toISOString()
          .split("T")[0],

      invoice_number: "",

      status: "Posted",

      notes: "",

    });

    setEditingId(null);

  }

  // =====================================================
  // TOP VIEW BUTTON
  // =====================================================

  function handleTopView() {

    if (
      !canView &&
      !canManage
    ) {

      alert(
        "You do not have permission to view actual costs."
      );

      return;

    }

    closeAllModals();

    setTimeout(() => {

      document
        .getElementById(
          "actual-cost-table"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

    }, 50);

  }

  // =====================================================
  // OPEN ADD
  // =====================================================

  function openAddForm() {

    if (
      !canCreate &&
      !canManage
    ) {

      alert(
        "You do not have permission to create actual costs."
      );

      return;

    }

    resetForm();

    closeAllModals();

    setShowForm(true);

  }

  // =====================================================
  // TOP EDIT
  // =====================================================

  function handleTopEdit() {

    if (
      !canEdit &&
      !canManage
    ) {

      alert(
        "You do not have permission to edit actual costs."
      );

      return;

    }

    if (
      actualCosts.length === 0
    ) {

      alert(
        "There are no active actual costs to edit."
      );

      return;

    }

    closeAllModals();

    setShowEditSelector(true);

  }

  // =====================================================
  // OPEN EDIT
  // =====================================================

  function openEditForm(
    item: ActualCost
  ) {

    if (
      !canEdit &&
      !canManage
    ) {

      alert(
        "You do not have permission to edit actual costs."
      );

      return;

    }

    setEditingId(
      item.id
    );

    setForm({

      transaction_number:
        item.transaction_number,

      cost_type:
        item.cost_type,

      vendor:
        item.vendor ?? "",

      description:
        item.description ?? "",

      cost_code_id:
        item.cost_code_id ?? "",

      commitment_id:
        item.commitment_id ?? "",

      amount:
        String(
          item.amount
        ),

      transaction_date:
        item.transaction_date,

      invoice_number:
        item.invoice_number ?? "",

      status:
        item.status,

      notes:
        item.notes ?? "",

    });

    closeAllModals();

    setEditingId(
      item.id
    );

    setShowForm(true);

  }

  // =====================================================
  // OPEN VIEW
  // =====================================================

  function openView(
    item: ActualCost
  ) {

    if (
      !canView &&
      !canManage
    ) {

      alert(
        "You do not have permission to view actual costs."
      );

      return;

    }

    closeAllModals();

    setViewingCost(
      item
    );

    setShowView(true);

  }

  // =====================================================
  // TOP DELETE / RESTORE
  // =====================================================

  function handleTopDeleteRestore() {

    if (
      !canDelete &&
      !canManage
    ) {

      alert(
        "You do not have permission to delete or restore actual costs."
      );

      return;

    }

    closeAllModals();

    setShowDeleted(true);

  }

  // =====================================================
  // TOP APPROVE
  // =====================================================

  function handleTopApprove() {

    if (!canApprove) {

      alert(
        "You do not have permission to approve actual costs."
      );

      return;

    }

    const drafts =
      actualCosts.filter(
        (item) =>
          item.status === "Draft"
      );

    if (
      drafts.length === 0
    ) {

      alert(
        "There are no Draft actual costs waiting for approval."
      );

      return;

    }

    closeAllModals();

    setShowApproveSelector(true);

  }

  // =====================================================
  // APPROVE ACTUAL COST
  // =====================================================

  async function approveActualCost(
    item: ActualCost
  ) {

    if (!canApprove) {

      alert(
        "You do not have permission to approve actual costs."
      );

      return;

    }

    const confirmed =
      window.confirm(
        `Approve actual cost ${item.transaction_number}?\n\nThe status will change from Draft to Posted.`
      );

    if (!confirmed) {
      return;
    }

    try {

      setSaving(true);

      const {
        error,
      } = await supabase
        .from("actual_costs")
        .update({

          status:
            "Posted",

          updated_at:
            new Date().toISOString(),

        })
        .eq(
          "id",
          item.id
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
          "APPROVE ACTUAL COST ERROR:",
          error
        );

        alert(
          error.message
        );

        return;

      }

      setShowApproveSelector(false);

      await loadProjectData(
        selectedProject
      );

      alert(
        `${item.transaction_number} has been approved and posted.`
      );

    } catch (error) {

      console.error(
        "APPROVE ACTUAL COST ERROR:",
        error
      );

      alert(
        "Failed to approve actual cost."
      );

    } finally {

      setSaving(false);

    }

  }

  // =====================================================
  // SAVE ACTUAL COST
  // =====================================================

  async function saveActualCost() {

    if (editingId) {

      if (
        !canEdit &&
        !canManage
      ) {

        alert(
          "You do not have permission to edit actual costs."
        );

        return;

      }

    } else {

      if (
        !canCreate &&
        !canManage
      ) {

        alert(
          "You do not have permission to create actual costs."
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

    if (
      !form.transaction_number.trim()
    ) {

      alert(
        "Please enter a transaction number."
      );

      return;

    }

    if (
      form.amount === ""
    ) {

      alert(
        "Please enter an amount."
      );

      return;

    }

    const amount =
      Number(
        form.amount
      );

    if (
      Number.isNaN(amount) ||
      amount < 0
    ) {

      alert(
        "Please enter a valid amount."
      );

      return;

    }

    try {

      setSaving(true);

      const payload = {

        transaction_number:
          form.transaction_number.trim(),

        cost_type:
          form.cost_type,

        vendor:
          form.vendor.trim() ||
          null,

        description:
          form.description.trim() ||
          null,

        cost_code_id:
          form.cost_code_id ||
          null,

        commitment_id:
          form.commitment_id ||
          null,

        amount,

        transaction_date:
          form.transaction_date,

        invoice_number:
          form.invoice_number.trim() ||
          null,

        status:
          form.status,

        notes:
          form.notes.trim() ||
          null,

        updated_at:
          new Date().toISOString(),

      };

      // =================================================
      // UPDATE
      // =================================================

      if (editingId) {

        const {
          error,
        } = await supabase
          .from("actual_costs")
          .update(
            payload
          )
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
            "UPDATE ACTUAL COST ERROR:",
            error
          );

          alert(
            error.message
          );

          return;

        }

      }

      // =================================================
      // INSERT
      // =================================================

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
          .from("actual_costs")
          .insert({

            project_id:
              selectedProject,

            ...payload,

            created_by:
              user.id,

            deleted_at:
              null,

          });

        if (error) {

          console.error(
            "INSERT ACTUAL COST ERROR:",
            error
          );

          if (
            error.code ===
            "23505"
          ) {

            alert(
              "This transaction number already exists."
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

      resetForm();

      await loadProjectData(
        selectedProject
      );

    } catch (error) {

      console.error(
        "SAVE ACTUAL COST ERROR:",
        error
      );

      alert(
        "Failed to save actual cost."
      );

    } finally {

      setSaving(false);

    }

  }

  // =====================================================
  // DELETE
  // =====================================================

  async function deleteActualCost(
    id: string
  ) {

    if (
      !canDelete &&
      !canManage
    ) {

      alert(
        "You do not have permission to delete actual costs."
      );

      return;

    }

    const confirmed =
      window.confirm(
        "Move this actual cost to Deleted Items?\n\nIt will not be permanently deleted and can be restored later."
      );

    if (!confirmed) {
      return;
    }

    try {

      const {
        error,
      } = await supabase
        .from("actual_costs")
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
          "DELETE ACTUAL COST ERROR:",
          error
        );

        alert(
          error.message
        );

        return;

      }

      await loadProjectData(
        selectedProject
      );

    } catch (error) {

      console.error(
        "DELETE ACTUAL COST ERROR:",
        error
      );

      alert(
        "Failed to move actual cost to Deleted Items."
      );

    }

  }

  // =====================================================
  // RESTORE
  // =====================================================

  async function restoreActualCost(
    id: string
  ) {

    if (
      !canDelete &&
      !canManage
    ) {

      alert(
        "You do not have permission to restore actual costs."
      );

      return;

    }

    const confirmed =
      window.confirm(
        "Restore this actual cost?"
      );

    if (!confirmed) {
      return;
    }

    try {

      const {
        error,
      } = await supabase
        .from("actual_costs")
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
          "RESTORE ACTUAL COST ERROR:",
          error
        );

        alert(
          error.message
        );

        return;

      }

      await loadProjectData(
        selectedProject
      );

    } catch (error) {

      console.error(
        "RESTORE ACTUAL COST ERROR:",
        error
      );

      alert(
        "Failed to restore actual cost."
      );

    }

  }

  // =====================================================
  // REFRESH
  // =====================================================

  async function refreshData() {

    if (!selectedProject) {
      return;
    }

    await loadProjectData(
      selectedProject
    );

  }

  // =====================================================
  // EXPORT CSV
  // =====================================================

  function exportCSV() {

    const rows =
      filteredCosts;

    if (
      rows.length === 0
    ) {

      alert(
        "There is no actual cost data to export."
      );

      return;

    }

    const headers = [
      "Transaction Number",
      "Transaction Date",
      "Cost Type",
      "Vendor",
      "Description",
      "Cost Code",
      "Commitment",
      "Amount",
      "Invoice Number",
      "Status",
      "Notes",
    ];

    const csvRows =
      rows.map(
        (item) => {

          const values = [

            item.transaction_number,

            item.transaction_date,

            item.cost_type,

            item.vendor ?? "",

            item.description ?? "",

            item.cost_codes?.code ??
              "",

            item.commitments
              ?.commitment_number ??
              "",

            item.amount,

            item.invoice_number ??
              "",

            item.status,

            item.notes ?? "",

          ];

          return values
            .map(
              (value) =>
                `"${String(
                  value
                ).replace(
                  /"/g,
                  '""'
                )}"`
            )
            .join(",");

        }
      );

    const csv = [
      headers.join(","),
      ...csvRows,
    ].join("\n");

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

    link.href =
      url;

    link.download =
      `actual-costs-${selectedProjectName
        .replace(
          /\s+/g,
          "-"
        )
        .toLowerCase()}.csv`;

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

  // =====================================================
  // FILTER
  // =====================================================

  const filteredCosts =
    useMemo(() => {

      return actualCosts.filter(
        (item) => {

          const searchText =
            `${item.transaction_number} ${
              item.vendor ?? ""
            } ${
              item.description ?? ""
            } ${
              item.invoice_number ?? ""
            }`
              .toLowerCase();

          const matchesSearch =
            searchText.includes(
              search.toLowerCase()
            );

          const matchesType =
            typeFilter === "All" ||
            item.cost_type ===
              typeFilter;

          const matchesStatus =
            statusFilter === "All" ||
            item.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesType &&
            matchesStatus
          );

        }
      );

    }, [
      actualCosts,
      search,
      typeFilter,
      statusFilter,
    ]);

  // =====================================================
  // POSTED TOTALS
  // =====================================================

  const postedCosts =
    actualCosts.filter(
      (item) =>
        item.status ===
        "Posted"
    );

  const totalActual =
    postedCosts.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.amount || 0
        ),
      0
    );

  const totalLabor =
    postedCosts
      .filter(
        (item) =>
          item.cost_type ===
          "Labor"
      )
      .reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.amount || 0
          ),
        0
      );

  const totalMaterial =
    postedCosts
      .filter(
        (item) =>
          item.cost_type ===
          "Material"
      )
      .reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.amount || 0
          ),
        0
      );

  const totalEquipment =
    postedCosts
      .filter(
        (item) =>
          item.cost_type ===
          "Equipment"
      )
      .reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.amount || 0
          ),
        0
      );

  // =====================================================
  // PROJECT NAME
  // =====================================================

  const selectedProjectName =
    projects.find(
      (project) =>
        project.id ===
        selectedProject
    )?.name ?? "";

  // =====================================================
  // MONEY
  // =====================================================

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

  // =====================================================
  // LOADING
  // =====================================================

  if (
    loading ||
    loadingPermissions
  ) {

    return (

      <main className="p-8 bg-gray-50 min-h-screen">

        <div className="bg-white border rounded-xl p-8">

          Loading Actual Costs...

        </div>

      </main>

    );

  }

  // =====================================================
  // ACCESS
  // =====================================================

  if (
    !canView &&
    !canManage
  ) {

    return (

      <main className="p-8 bg-gray-50 min-h-screen">

        <div className="max-w-xl mx-auto bg-white border rounded-xl p-10 text-center shadow-sm">

          <div className="text-5xl mb-4">
            🔒
          </div>

          <h1 className="text-2xl font-bold text-gray-900">

            Actual Costs Access Restricted

          </h1>

          <p className="text-gray-500 mt-3">

            You do not have permission
            to view Actual Costs.

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

  // =====================================================
  // NO PROJECT
  // =====================================================

  if (
    projects.length === 0
  ) {

    return (

      <main className="p-8 bg-gray-50 min-h-screen">

        <div className="bg-white border rounded-xl p-10 text-center">

          <div className="text-5xl mb-4">
            💵
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

  // =====================================================
  // PAGE
  // =====================================================

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

      <div className="flex justify-between items-start mt-6 mb-8 gap-6">

        <div>

          <h1 className="text-4xl font-bold">

            Actual Costs

          </h1>

          <p className="text-gray-500 mt-2">

            Track labor, materials,
            equipment, invoices,
            expenses, and other
            incurred project costs.

          </p>

          {/* =================================================
              WORKING TOP BUTTONS
          ================================================= */}

          <div className="flex gap-2 mt-4 flex-wrap">

            {/* VIEW */}

            {canView && (

              <button
                type="button"
                onClick={
                  handleTopView
                }
                className="cursor-pointer inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 active:scale-95 transition"
              >

                👁️ View

              </button>

            )}

            {/* CREATE */}

            {(canCreate ||
              canManage) && (

              <button
                type="button"
                onClick={
                  openAddForm
                }
                className="cursor-pointer inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200 active:scale-95 transition"
              >

                + Create

              </button>

            )}

            {/* EDIT */}

            {(canEdit ||
              canManage) && (

              <button
                type="button"
                onClick={
                  handleTopEdit
                }
                className="cursor-pointer inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 active:scale-95 transition"
              >

                ✏️ Edit

              </button>

            )}

            {/* DELETE / RESTORE */}

            {(canDelete ||
              canManage) && (

              <button
                type="button"
                onClick={
                  handleTopDeleteRestore
                }
                className="cursor-pointer inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 active:scale-95 transition"
              >

                🗑️ Delete / Restore

              </button>

            )}

            {/* APPROVE */}

            {canApprove && (

              <button
                type="button"
                onClick={
                  handleTopApprove
                }
                className="cursor-pointer inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 active:scale-95 transition"
              >

                ✓ Approve

              </button>

            )}

            {/* MANAGE */}

            {canManage && (

              <button
                type="button"
                onClick={() => {

                  closeAllModals();

                  setShowManage(true);

                }}
                className="cursor-pointer inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gray-800 text-white hover:bg-gray-900 active:scale-95 transition"
              >

                ⚙️ Manage

              </button>

            )}

          </div>

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

      {/* =================================================
          PROJECT
      ================================================= */}

      <div className="mb-6">

        <h2 className="text-2xl font-bold">

          {selectedProjectName}

        </h2>

        <p className="text-gray-500">

          Active actual costs

        </p>

      </div>

      {/* =================================================
          KPI
      ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

        <KpiCard
          title="Total Actual Cost"
          value={money(totalActual)}
        />

        <KpiCard
          title="Labor"
          value={money(totalLabor)}
        />

        <KpiCard
          title="Materials"
          value={money(totalMaterial)}
        />

        <KpiCard
          title="Equipment"
          value={money(totalEquipment)}
        />

      </div>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="flex justify-between items-center mb-5 gap-4 flex-wrap">

        <div className="flex gap-3 flex-wrap">

          <input
            type="text"
            placeholder="Search actual costs..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="border rounded-lg bg-white px-4 py-2.5 w-80"
          />

          <select
            value={
              typeFilter
            }
            onChange={(e) =>
              setTypeFilter(
                e.target.value
              )
            }
            className="border rounded-lg bg-white px-4 py-2.5"
          >

            <option value="All">
              All Cost Types
            </option>

            {COST_TYPES.map(
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

          <select
            value={
              statusFilter
            }
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="border rounded-lg bg-white px-4 py-2.5"
          >

            <option value="All">
              All Statuses
            </option>

            {STATUSES.map(
              (status) => (

                <option
                  key={status}
                  value={status}
                >

                  {status}

                </option>

              )
            )}

          </select>

        </div>

        <div className="flex gap-2 flex-wrap">

          {/* REFRESH */}

          <button
            type="button"
            onClick={
              refreshData
            }
            disabled={
              loadingData
            }
            className="border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100 px-4 py-2.5 rounded-lg font-medium"
          >

            ↻ Refresh

          </button>

          {/* EXPORT */}

          <button
            type="button"
            onClick={
              exportCSV
            }
            className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-lg font-medium"
          >

            📄 Export

          </button>

          {/* DELETED */}

          {(canDelete ||
            canManage) && (

            <button
              type="button"
              onClick={
                handleTopDeleteRestore
              }
              className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2.5 rounded-lg font-medium"
            >

              🗑️ Deleted (
              {
                deletedCosts.length
              }
              )

            </button>

          )}

          {/* MANAGE */}

          {canManage && (

            <button
              type="button"
              onClick={() => {

                closeAllModals();

                setShowManage(true);

              }}
              className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded-lg font-semibold"
            >

              ⚙️ Manage

            </button>

          )}

          {/* CREATE */}

          {(canCreate ||
            canManage) && (

            <button
              type="button"
              onClick={
                openAddForm
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold"
            >

              + Add Actual Cost

            </button>

          )}

        </div>

      </div>

      {/* =================================================
          LOADING
      ================================================= */}

      {loadingData && (

        <div className="mb-4 text-sm text-blue-600">

          Updating actual cost data...

        </div>

      )}

      {/* =================================================
          TABLE
      ================================================= */}

      <div
        id="actual-cost-table"
        className="bg-white border rounded-xl shadow-sm overflow-hidden scroll-mt-6"
      >

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-100 border-b">

              <tr>

                <th className="text-left p-4">
                  Transaction #
                </th>

                <th className="text-left p-4">
                  Date
                </th>

                <th className="text-left p-4">
                  Type
                </th>

                <th className="text-left p-4">
                  Vendor
                </th>

                <th className="text-left p-4">
                  Cost Code
                </th>

                <th className="text-left p-4">
                  Commitment
                </th>

                <th className="text-right p-4">
                  Amount
                </th>

                <th className="text-left p-4">
                  Status
                </th>

                <th className="text-right p-4">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredCosts.length ===
                0 && (

                <tr>

                  <td
                    colSpan={9}
                    className="p-12 text-center"
                  >

                    <div className="text-4xl mb-3">
                      💵
                    </div>

                    <p className="font-semibold">
                      No actual costs found
                    </p>

                    <p className="text-gray-500 text-sm mt-1">

                      {canCreate ||
                      canManage
                        ? "Add an actual cost to begin tracking project spending."
                        : "There are no actual costs available for this project."}

                    </p>

                  </td>

                </tr>

              )}

              {filteredCosts.map(
                (item) => (

                  <tr
                    key={
                      item.id
                    }
                    className="border-b hover:bg-gray-50"
                  >

                    <td className="p-4">

                      <button
                        type="button"
                        onClick={() =>
                          openView(
                            item
                          )
                        }
                        className="font-semibold text-blue-700 hover:underline"
                      >

                        {
                          item.transaction_number
                        }

                      </button>

                    </td>

                    <td className="p-4">

                      {
                        item.transaction_date
                      }

                    </td>

                    <td className="p-4">

                      {
                        item.cost_type
                      }

                    </td>

                    <td className="p-4">

                      {
                        item.vendor ||
                        "—"
                      }

                    </td>

                    <td className="p-4">

                      {item.cost_codes ? (

                        <div>

                          <p className="font-semibold">

                            {
                              item
                                .cost_codes
                                .code
                            }

                          </p>

                          <p className="text-xs text-gray-500">

                            {
                              item
                                .cost_codes
                                .description
                            }

                          </p>

                        </div>

                      ) : (

                        "—"

                      )}

                    </td>

                    <td className="p-4">

                      {item.commitments ? (

                        <div>

                          <p className="font-semibold">

                            {
                              item
                                .commitments
                                .commitment_number
                            }

                          </p>

                          <p className="text-xs text-gray-500">

                            {
                              item
                                .commitments
                                .vendor
                            }

                          </p>

                        </div>

                      ) : (

                        "—"

                      )}

                    </td>

                    <td className="p-4 text-right font-semibold">

                      {money(
                        Number(
                          item.amount
                        )
                      )}

                    </td>

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.status ===
                          "Posted"
                            ? "bg-green-100 text-green-700"
                            : item.status ===
                              "Void"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >

                        {
                          item.status
                        }

                      </span>

                    </td>

                    <td className="p-4">

                      <div className="flex justify-end gap-4">

                        {canView && (

                          <button
                            type="button"
                            onClick={() =>
                              openView(
                                item
                              )
                            }
                            className="text-blue-600 hover:underline font-medium"
                          >

                            View

                          </button>

                        )}

                        {(canEdit ||
                          canManage) && (

                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                item
                              )
                            }
                            className="text-purple-600 hover:underline font-medium"
                          >

                            Edit

                          </button>

                        )}

                        {(canDelete ||
                          canManage) && (

                          <button
                            type="button"
                            onClick={() =>
                              deleteActualCost(
                                item.id
                              )
                            }
                            className="text-red-600 hover:underline font-medium"
                          >

                            Delete

                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

            {filteredCosts.length >
              0 && (

              <tfoot className="bg-gray-50 border-t">

                <tr>

                  <td
                    colSpan={6}
                    className="p-4 font-bold"
                  >

                    TOTAL

                  </td>

                  <td className="p-4 text-right font-bold">

                    {money(
                      filteredCosts.reduce(
                        (
                          total,
                          item
                        ) =>
                          total +
                          Number(
                            item.amount ||
                              0
                          ),
                        0
                      )
                    )}

                  </td>

                  <td />

                  <td />

                </tr>

              </tfoot>

            )}

          </table>

        </div>

      </div>

      {/* =====================================================
          EDIT SELECTOR
      ===================================================== */}

      {showEditSelector && (

        <ModalShell
          title="Select Actual Cost to Edit"
          subtitle="Choose the actual cost you want to modify."
          onClose={() =>
            setShowEditSelector(false)
          }
          maxWidth="max-w-3xl"
        >

          <div className="p-6 overflow-y-auto overscroll-contain max-h-[65vh]">

            <div className="space-y-3">

              {actualCosts.map(
                (item) => (

                  <button
                    key={
                      item.id
                    }
                    type="button"
                    onClick={() =>
                      openEditForm(
                        item
                      )
                    }
                    className="w-full text-left border rounded-xl p-4 hover:bg-purple-50 hover:border-purple-300 transition"
                  >

                    <div className="flex justify-between gap-4">

                      <div>

                        <p className="font-bold text-gray-900">

                          {
                            item.transaction_number
                          }

                        </p>

                        <p className="text-sm text-gray-500 mt-1">

                          {
                            item.vendor ||
                            "No vendor"
                          }

                          {" • "}

                          {
                            item.cost_type
                          }

                        </p>

                      </div>

                      <div className="text-right">

                        <p className="font-bold">

                          {money(
                            Number(
                              item.amount
                            )
                          )}

                        </p>

                        <p className="text-sm text-gray-500">

                          {
                            item.transaction_date
                          }

                        </p>

                      </div>

                    </div>

                  </button>

                )
              )}

            </div>

          </div>

        </ModalShell>

      )}

      {/* =====================================================
          APPROVE SELECTOR
      ===================================================== */}

      {showApproveSelector && (

        <ModalShell
          title="Approve Actual Costs"
          subtitle="Select a Draft actual cost to approve and post."
          onClose={() =>
            setShowApproveSelector(false)
          }
          maxWidth="max-w-3xl"
        >

          <div className="p-6 overflow-y-auto overscroll-contain max-h-[65vh]">

            <div className="space-y-3">

              {actualCosts
                .filter(
                  (item) =>
                    item.status ===
                    "Draft"
                )
                .map(
                  (item) => (

                    <div
                      key={
                        item.id
                      }
                      className="border rounded-xl p-4"
                    >

                      <div className="flex justify-between items-center gap-4">

                        <div>

                          <p className="font-bold">

                            {
                              item.transaction_number
                            }

                          </p>

                          <p className="text-sm text-gray-500">

                            {
                              item.vendor ||
                              "No vendor"
                            }

                            {" • "}

                            {
                              item.cost_type
                            }

                          </p>

                        </div>

                        <div className="flex items-center gap-4">

                          <p className="font-bold">

                            {money(
                              Number(
                                item.amount
                              )
                            )}

                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              approveActualCost(
                                item
                              )
                            }
                            disabled={
                              saving
                            }
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold"
                          >

                            {saving
                              ? "Approving..."
                              : "Approve"}

                          </button>

                        </div>

                      </div>

                    </div>

                  )
                )}

            </div>

          </div>

          <div className="border-t p-5 flex justify-end">

            <button
              type="button"
              onClick={() =>
                setShowApproveSelector(false)
              }
              className="border border-gray-300 bg-white hover:bg-gray-50 px-5 py-2.5 rounded-lg"
            >

              Close

            </button>

          </div>

        </ModalShell>

      )}

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showForm && (

        <ModalShell
          title={
            editingId
              ? "Edit Actual Cost"
              : "Add Actual Cost"
          }
          subtitle={
            selectedProjectName
          }
          onClose={() => {

            setShowForm(false);
            setEditingId(null);

          }}
          maxWidth="max-w-3xl"
        >

          <div className="p-6 space-y-5 overflow-y-auto overscroll-contain max-h-[70vh]">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <FormInput
                label="Transaction Number *"
                value={
                  form.transaction_number
                }
                onChange={(value) =>
                  setForm({
                    ...form,
                    transaction_number:
                      value,
                  })
                }
                placeholder="INV-001"
              />

              <div>

                <label className="block text-sm font-semibold mb-2">

                  Cost Type *

                </label>

                <select
                  value={
                    form.cost_type
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cost_type:
                        e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-3 bg-white"
                >

                  {COST_TYPES.map(
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

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <FormInput
                label="Vendor"
                value={
                  form.vendor
                }
                onChange={(value) =>
                  setForm({
                    ...form,
                    vendor:
                      value,
                  })
                }
                placeholder="Vendor / Supplier"
              />

              <FormInput
                label="Amount *"
                type="number"
                value={
                  form.amount
                }
                onChange={(value) =>
                  setForm({
                    ...form,
                    amount:
                      value,
                  })
                }
                placeholder="0.00"
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>

                <label className="block text-sm font-semibold mb-2">

                  Cost Code

                </label>

                <select
                  value={
                    form.cost_code_id
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cost_code_id:
                        e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-3 bg-white"
                >

                  <option value="">
                    No Cost Code
                  </option>

                  {costCodes.map(
                    (code) => (

                      <option
                        key={
                          code.id
                        }
                        value={
                          code.id
                        }
                      >

                        {
                          code.code
                        }

                        {" — "}

                        {
                          code.description
                        }

                      </option>

                    )
                  )}

                </select>

              </div>

              <div>

                <label className="block text-sm font-semibold mb-2">

                  Commitment

                </label>

                <select
                  value={
                    form.commitment_id
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      commitment_id:
                        e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-3 bg-white"
                >

                  <option value="">
                    No Commitment
                  </option>

                  {commitments.map(
                    (item) => (

                      <option
                        key={
                          item.id
                        }
                        value={
                          item.id
                        }
                      >

                        {
                          item.commitment_number
                        }

                        {" — "}

                        {
                          item.vendor
                        }

                      </option>

                    )
                  )}

                </select>

              </div>

            </div>

            <div>

              <label className="block text-sm font-semibold mb-2">

                Description

              </label>

              <textarea
                rows={4}
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
                placeholder="Describe the actual cost..."
                className="w-full border rounded-lg px-4 py-3 resize-y"
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>

                <label className="block text-sm font-semibold mb-2">

                  Transaction Date *

                </label>

                <input
                  type="date"
                  value={
                    form.transaction_date
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      transaction_date:
                        e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-3"
                />

              </div>

              <FormInput
                label="Invoice Number"
                value={
                  form.invoice_number
                }
                onChange={(value) =>
                  setForm({
                    ...form,
                    invoice_number:
                      value,
                  })
                }
                placeholder="Invoice number"
              />

            </div>

            <div>

              <label className="block text-sm font-semibold mb-2">

                Status

              </label>

              <select
                value={
                  form.status
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    status:
                      e.target.value,
                  })
                }
                className="w-full border rounded-lg px-4 py-3 bg-white"
              >

                {STATUSES.map(
                  (status) => (

                    <option
                      key={status}
                      value={status}
                    >

                      {status}

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
                rows={4}
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
                placeholder="Additional notes..."
                className="w-full border rounded-lg px-4 py-3 resize-y"
              />

            </div>

          </div>

          <div className="flex justify-end gap-3 border-t p-6 shrink-0 bg-white">

            <button
              type="button"
              onClick={() => {

                setShowForm(false);
                setEditingId(null);

              }}
              disabled={
                saving
              }
              className="border border-gray-300 bg-white hover:bg-gray-50 px-5 py-2.5 rounded-lg"
            >

              Cancel

            </button>

            <button
              type="button"
              onClick={
                saveActualCost
              }
              disabled={
                saving
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg font-semibold"
            >

              {saving
                ? "Saving..."
                : editingId
                ? "Update Actual Cost"
                : "Save Actual Cost"}

            </button>

          </div>

        </ModalShell>

      )}

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      {showView &&
        viewingCost && (

        <ModalShell
          title="Actual Cost Details"
          subtitle={
            selectedProjectName
          }
          onClose={() =>
            setShowView(false)
          }
          maxWidth="max-w-2xl"
        >

          <div className="p-6 overflow-y-auto overscroll-contain max-h-[70vh] space-y-4">

            <DetailRow
              label="Transaction Number"
              value={
                viewingCost.transaction_number
              }
            />

            <DetailRow
              label="Transaction Date"
              value={
                viewingCost.transaction_date
              }
            />

            <DetailRow
              label="Cost Type"
              value={
                viewingCost.cost_type
              }
            />

            <DetailRow
              label="Vendor"
              value={
                viewingCost.vendor ??
                "—"
              }
            />

            <DetailRow
              label="Description"
              value={
                viewingCost.description ??
                "—"
              }
            />

            <DetailRow
              label="Cost Code"
              value={
                viewingCost.cost_codes
                  ? `${viewingCost.cost_codes.code} — ${viewingCost.cost_codes.description}`
                  : "—"
              }
            />

            <DetailRow
              label="Commitment"
              value={
                viewingCost.commitments
                  ? `${viewingCost.commitments.commitment_number} — ${viewingCost.commitments.vendor}`
                  : "—"
              }
            />

            <DetailRow
              label="Amount"
              value={money(
                Number(
                  viewingCost.amount
                )
              )}
            />

            <DetailRow
              label="Invoice Number"
              value={
                viewingCost.invoice_number ??
                "—"
              }
            />

            <DetailRow
              label="Status"
              value={
                viewingCost.status
              }
            />

            <DetailRow
              label="Notes"
              value={
                viewingCost.notes ??
                "—"
              }
            />

            {viewingCost.created_at && (

              <DetailRow
                label="Created"
                value={formatDateTime(
                  viewingCost.created_at
                )}
              />

            )}

            {viewingCost.updated_at && (

              <DetailRow
                label="Last Updated"
                value={formatDateTime(
                  viewingCost.updated_at
                )}
              />

            )}

          </div>

          <div className="flex justify-end gap-3 border-t p-6 shrink-0">

            {(canEdit ||
              canManage) && (

              <button
                type="button"
                onClick={() =>
                  openEditForm(
                    viewingCost
                  )
                }
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-semibold"
              >

                Edit

              </button>

            )}

            {(canDelete ||
              canManage) && (

              <button
                type="button"
                onClick={async () => {

                  const id =
                    viewingCost.id;

                  setShowView(false);

                  await deleteActualCost(
                    id
                  );

                }}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold"
              >

                Delete

              </button>

            )}

            <button
              type="button"
              onClick={() =>
                setShowView(false)
              }
              className="border border-gray-300 bg-white hover:bg-gray-50 px-5 py-2.5 rounded-lg"
            >

              Close

            </button>

          </div>

        </ModalShell>

      )}

      {/* =====================================================
          DELETED ITEMS
      ===================================================== */}

      {showDeleted && (

        <ModalShell
          title="Deleted Actual Costs"
          subtitle="Deleted records remain in Supabase and can be restored."
          onClose={() =>
            setShowDeleted(false)
          }
          maxWidth="max-w-6xl"
        >

          <div className="p-6 overflow-y-auto overscroll-contain max-h-[70vh]">

            {deletedCosts.length ===
              0 ? (

              <div className="text-center py-12">

                <div className="text-5xl">
                  🗑️
                </div>

                <h3 className="font-semibold mt-4">
                  No Deleted Items
                </h3>

                <p className="text-gray-500 text-sm mt-1">
                  There are no deleted actual costs for this project.
                </p>

              </div>

            ) : (

              <div className="border rounded-xl overflow-hidden">

                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead className="bg-gray-100 border-b">

                      <tr>

                        <th className="text-left p-4">
                          Transaction #
                        </th>

                        <th className="text-left p-4">
                          Date
                        </th>

                        <th className="text-left p-4">
                          Type
                        </th>

                        <th className="text-left p-4">
                          Vendor
                        </th>

                        <th className="text-right p-4">
                          Amount
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

                      {deletedCosts.map(
                        (item) => (

                          <tr
                            key={
                              item.id
                            }
                            className="border-b hover:bg-gray-50"
                          >

                            <td className="p-4 font-semibold">

                              {
                                item.transaction_number
                              }

                            </td>

                            <td className="p-4">

                              {
                                item.transaction_date
                              }

                            </td>

                            <td className="p-4">

                              {
                                item.cost_type
                              }

                            </td>

                            <td className="p-4">

                              {
                                item.vendor ||
                                "—"
                              }

                            </td>

                            <td className="p-4 text-right font-semibold">

                              {money(
                                Number(
                                  item.amount
                                )
                              )}

                            </td>

                            <td className="p-4 text-sm text-gray-500">

                              {item.deleted_at
                                ? formatDateTime(
                                    item.deleted_at
                                  )
                                : "—"}

                            </td>

                            <td className="p-4 text-right">

                              <button
                                type="button"
                                onClick={() =>
                                  restoreActualCost(
                                    item.id
                                  )
                                }
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
                              >

                                Restore

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

          <div className="border-t p-6 flex justify-end">

            <button
              type="button"
              onClick={() =>
                setShowDeleted(false)
              }
              className="border border-gray-300 bg-white hover:bg-gray-50 px-5 py-2.5 rounded-lg"
            >

              Close

            </button>

          </div>

        </ModalShell>

      )}

      {/* =====================================================
          MANAGE
      ===================================================== */}

      {showManage &&
        canManage && (

        <ModalShell
          title="Manage Actual Costs"
          subtitle="Administrative controls"
          onClose={() =>
            setShowManage(false)
          }
          maxWidth="max-w-2xl"
        >

          <div className="p-6 overflow-y-auto overscroll-contain max-h-[70vh] space-y-5">

            <div className="grid grid-cols-2 gap-4">

              <ManageCard
                title="Active Records"
                value={
                  String(
                    actualCosts.length
                  )
                }
              />

              <ManageCard
                title="Deleted Records"
                value={
                  String(
                    deletedCosts.length
                  )
                }
              />

              <ManageCard
                title="Posted Cost"
                value={money(
                  totalActual
                )}
              />

              <ManageCard
                title="Filtered Records"
                value={
                  String(
                    filteredCosts.length
                  )
                }
              />

            </div>

            <div className="border rounded-xl p-5">

              <h3 className="font-bold">
                Management Actions
              </h3>

              <div className="flex gap-3 flex-wrap mt-4">

                <button
                  type="button"
                  onClick={
                    refreshData
                  }
                  className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-lg"
                >

                  ↻ Refresh Data

                </button>

                <button
                  type="button"
                  onClick={() => {

                    setShowManage(false);

                    setShowDeleted(true);

                  }}
                  className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2.5 rounded-lg"
                >

                  🗑️ Deleted Items

                </button>

                <button
                  type="button"
                  onClick={
                    exportCSV
                  }
                  className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-lg"
                >

                  📄 Export CSV

                </button>

                <button
                  type="button"
                  onClick={() => {

                    setShowManage(false);

                    openAddForm();

                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg"
                >

                  + Add Actual Cost

                </button>

              </div>

            </div>

            <div className="border rounded-xl p-5">

              <h3 className="font-bold mb-4">
                Current Permissions
              </h3>

              <div className="grid grid-cols-2 gap-3">

                <PermissionStatus
                  label="View"
                  enabled={
                    canView
                  }
                />

                <PermissionStatus
                  label="Create"
                  enabled={
                    canCreate
                  }
                />

                <PermissionStatus
                  label="Edit"
                  enabled={
                    canEdit
                  }
                />

                <PermissionStatus
                  label="Delete"
                  enabled={
                    canDelete
                  }
                />

                <PermissionStatus
                  label="Approve"
                  enabled={
                    canApprove
                  }
                />

                <PermissionStatus
                  label="Manage"
                  enabled={
                    canManage
                  }
                />

              </div>

            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">

              <p className="font-semibold text-yellow-800">

                Soft Delete

              </p>

              <p className="text-sm text-yellow-700 mt-1">

                Delete does not permanently remove
                the record. The record remains in
                Supabase with a deleted_at timestamp
                and can be restored.

              </p>

            </div>

          </div>

          <div className="border-t p-6 flex justify-end">

            <button
              type="button"
              onClick={() =>
                setShowManage(false)
              }
              className="border border-gray-300 bg-white hover:bg-gray-50 px-5 py-2.5 rounded-lg"
            >

              Close

            </button>

          </div>

        </ModalShell>

      )}

    </main>

  );

}

// =====================================================
// MODAL SHELL
// =====================================================

function ModalShell({
  title,
  subtitle,
  children,
  onClose,
  maxWidth = "max-w-3xl",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {

  return (

    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 overscroll-none"
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

        {/* HEADER */}

        <div className="flex justify-between items-center border-b p-6 shrink-0">

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
            onClick={
              onClose
            }
            className="text-gray-500 hover:text-gray-800 text-2xl w-10 h-10 rounded-lg hover:bg-gray-100"
          >

            ×

          </button>

        </div>

        {children}

      </div>

    </div>

  );

}

// =====================================================
// KPI CARD
// =====================================================

function KpiCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {

  return (

    <div className="bg-white border rounded-xl p-5 shadow-sm">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="text-3xl font-bold mt-2">
        {value}
      </p>

    </div>

  );

}

// =====================================================
// FORM INPUT
// =====================================================

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {

  return (

    <div>

      <label className="block text-sm font-semibold mb-2">

        {label}

      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full border rounded-lg px-4 py-3"
      />

    </div>

  );

}

// =====================================================
// DETAIL ROW
// =====================================================

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="border rounded-xl p-4">

      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">

        {label}

      </p>

      <p className="font-semibold text-gray-900 mt-1 whitespace-pre-wrap break-words">

        {value || "—"}

      </p>

    </div>

  );

}

// =====================================================
// PERMISSION STATUS
// =====================================================

function PermissionStatus({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {

  return (

    <div className="flex justify-between items-center border rounded-lg px-4 py-3">

      <span className="font-medium">
        {label}
      </span>

      <span
        className={
          enabled
            ? "text-green-600 font-semibold"
            : "text-gray-400"
        }
      >

        {enabled
          ? "Allowed"
          : "No Access"}

      </span>

    </div>

  );

}

// =====================================================
// MANAGE CARD
// =====================================================

function ManageCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {

  return (

    <div className="border rounded-xl p-4 bg-gray-50">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="text-xl font-bold mt-1">
        {value}
      </p>

    </div>

  );

}

// =====================================================
// DATE FORMAT
// =====================================================

function formatDateTime(
  value: string
) {

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return value;

  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);

}