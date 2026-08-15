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

type CostCode = {
  id: string;
  code: string;
  description: string;
};

type Commitment = {
  id: string;
  project_id: string;
  cost_code_id: string | null;

  commitment_number: string;
  commitment_type: string;

  vendor: string;

  description: string | null;

  original_amount: number;
  approved_changes: number;

  status: string;

  start_date: string | null;
  end_date: string | null;

  notes: string | null;

  deleted_at: string | null;

  created_at?: string;
  updated_at?: string;

  cost_codes?: {
    code: string;
    description: string;
  } | null;
};

type CommitmentPermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  manage: boolean;
};

// =========================================================
// CONSTANTS
// =========================================================

const COMMITMENT_TYPES = [
  "Purchase Order",
  "Subcontract",
  "Contract",
  "Service Agreement",
  "Other",
];

const STATUSES = [
  "Pending",
  "Approved",
  "Active",
  "Completed",
  "Closed",
  "Cancelled",
];

// =========================================================
// PAGE
// =========================================================

export default function CommitmentsPage() {
  // =======================================================
  // PROJECTS
  // =======================================================

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [selectedProject, setSelectedProject] =
    useState("");

  // =======================================================
  // COST CODES
  // =======================================================

  const [costCodes, setCostCodes] =
    useState<CostCode[]>([]);

  // =======================================================
  // COMMITMENTS
  // =======================================================

  const [commitments, setCommitments] =
    useState<Commitment[]>([]);

  const [deletedCommitments, setDeletedCommitments] =
    useState<Commitment[]>([]);

  // =======================================================
  // SELECTED COMMITMENT
  // =======================================================

  const [selectedCommitment, setSelectedCommitment] =
    useState<Commitment | null>(null);

  // =======================================================
  // PERMISSIONS
  // =======================================================

  const [permissions, setPermissions] =
    useState<CommitmentPermissions>({
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
  // FILTERS
  // =======================================================

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [typeFilter, setTypeFilter] =
    useState("All");

  // =======================================================
  // PAGE STATE
  // =======================================================

  const [loading, setLoading] =
    useState(true);

  const [loadingData, setLoadingData] =
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

  const [form, setForm] = useState({
    commitment_number: "",
    commitment_type: "Purchase Order",
    vendor: "",
    description: "",
    cost_code_id: "",
    original_amount: "",
    approved_changes: "0",
    status: "Pending",
    start_date: "",
    end_date: "",
    notes: "",
  });

  // =========================================================
  // MODAL SCROLL LOCK
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
  // LOAD PAGE
  // =========================================================

  async function loadPage() {
    try {
      setLoading(true);

      const result =
        await getAccessibleProjects();

      console.log(
        "COMMITMENT ACCESSIBLE PROJECTS:",
        result
      );

      const projectData =
        (result.projects as Project[]) ?? [];

      setProjects(projectData);

      if (projectData.length > 0) {
        setSelectedProject(
          (currentProject) => {
            const stillAccessible =
              currentProject &&
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

      const [
        view,
        create,
        edit,
        deletePermission,
        manage,
      ] = await Promise.all([
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
          "manage"
        ),
      ]);

      console.log(
        "COMMITMENT PERMISSIONS:",
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
        "LOAD COMMITMENT PAGE ERROR:",
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
      setCostCodes([]);
      setCommitments([]);
      setDeletedCommitments([]);
      setSelectedCommitment(null);
      return;
    }

    if (!canView) {
      setCostCodes([]);
      setCommitments([]);
      setDeletedCommitments([]);
      setSelectedCommitment(null);
      return;
    }

    setSelectedCommitment(null);

    loadProjectData();
  }, [
    selectedProject,
    canView,
  ]);

  // =========================================================
  // LOAD ALL PROJECT DATA
  // =========================================================

  async function loadProjectData() {
    try {
      setLoadingData(true);

      await Promise.all([
        loadCostCodes(),
        loadCommitments(
          selectedProject
        ),
        loadDeletedCommitments(
          selectedProject
        ),
      ]);
    } finally {
      setLoadingData(false);
    }
  }

  // =========================================================
  // LOAD COST CODES
  // =========================================================

  async function loadCostCodes() {
    if (!selectedProject) {
      return;
    }

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
        selectedProject
      )
      .is(
        "deleted_at",
        null
      )
      .order("code");

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

  // =========================================================
  // LOAD ACTIVE COMMITMENTS
  // =========================================================

  async function loadCommitments(
    projectId: string
  ) {
    if (!projectId) {
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("commitments")
      .select(`
        *,
        cost_codes (
          code,
          description
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
        "created_at",
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        "COMMITMENT LOAD ERROR:",
        error
      );

      setCommitments([]);
      return;
    }

    setCommitments(
      (data as Commitment[]) ?? []
    );
  }

  // =========================================================
  // LOAD DELETED COMMITMENTS
  // =========================================================

  async function loadDeletedCommitments(
    projectId: string
  ) {
    if (!projectId) {
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("commitments")
      .select(`
        *,
        cost_codes (
          code,
          description
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
        "DELETED COMMITMENT LOAD ERROR:",
        error
      );

      setDeletedCommitments([]);
      return;
    }

    setDeletedCommitments(
      (data as Commitment[]) ?? []
    );
  }

  // =========================================================
  // SELECT COMMITMENT
  // =========================================================

  function selectCommitment(
    item: Commitment
  ) {
    setSelectedCommitment(
      item
    );
  }

  // =========================================================
  // OPEN VIEW
  // =========================================================

  function openViewSelected() {
    if (!canView) {
      alert(
        "You do not have permission to view Commitments."
      );
      return;
    }

    if (!selectedCommitment) {
      alert(
        "Please select a Commitment first."
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
        "You do not have permission to create Commitments."
      );

      return;
    }

    setEditingId(null);

    setForm({
      commitment_number: "",
      commitment_type:
        "Purchase Order",
      vendor: "",
      description: "",
      cost_code_id: "",
      original_amount: "",
      approved_changes: "0",
      status: "Pending",
      start_date: "",
      end_date: "",
      notes: "",
    });

    setShowForm(true);
  }

  // =========================================================
  // OPEN EDIT
  // =========================================================

  function openEditForm(
    item?: Commitment
  ) {
    const target =
      item ??
      selectedCommitment;

    if (!canEdit) {
      alert(
        "You do not have permission to edit Commitments."
      );

      return;
    }

    if (!target) {
      alert(
        "Please select a Commitment first."
      );

      return;
    }

    if (target.deleted_at) {
      alert(
        "Deleted Commitments cannot be edited. Restore the Commitment first."
      );

      return;
    }

    setSelectedCommitment(
      target
    );

    setEditingId(
      target.id
    );

    setForm({
      commitment_number:
        target.commitment_number,

      commitment_type:
        target.commitment_type,

      vendor:
        target.vendor,

      description:
        target.description ?? "",

      cost_code_id:
        target.cost_code_id ?? "",

      original_amount:
        String(
          target.original_amount ??
            0
        ),

      approved_changes:
        String(
          target.approved_changes ??
            0
        ),

      status:
        target.status,

      start_date:
        target.start_date ?? "",

      end_date:
        target.end_date ?? "",

      notes:
        target.notes ?? "",
    });

    setShowForm(true);
  }

  // =========================================================
  // SAVE COMMITMENT
  // =========================================================

  async function saveCommitment() {
    if (editingId) {
      if (!canEdit) {
        alert(
          "You do not have permission to edit Commitments."
        );

        return;
      }
    } else {
      if (!canCreate) {
        alert(
          "You do not have permission to create Commitments."
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
      !form.commitment_number.trim()
    ) {
      alert(
        "Please enter a commitment number."
      );

      return;
    }

    if (!form.vendor.trim()) {
      alert(
        "Please enter a vendor."
      );

      return;
    }

    if (
      form.original_amount === ""
    ) {
      alert(
        "Please enter the original amount."
      );

      return;
    }

    const originalAmount =
      Number(
        form.original_amount
      );

    const approvedChanges =
      Number(
        form.approved_changes ||
          0
      );

    if (
      Number.isNaN(
        originalAmount
      ) ||
      originalAmount < 0
    ) {
      alert(
        "Please enter a valid original amount."
      );

      return;
    }

    if (
      Number.isNaN(
        approvedChanges
      )
    ) {
      alert(
        "Please enter a valid approved changes amount."
      );

      return;
    }

    if (
      form.start_date &&
      form.end_date &&
      form.end_date <
        form.start_date
    ) {
      alert(
        "End Date cannot be before Start Date."
      );

      return;
    }

    try {
      setSaving(true);

      // =====================================================
      // UPDATE
      // =====================================================

      if (editingId) {
        const {
          error,
        } = await supabase
          .from("commitments")
          .update({
            commitment_number:
              form.commitment_number.trim(),

            commitment_type:
              form.commitment_type,

            vendor:
              form.vendor.trim(),

            description:
              form.description.trim() ||
              null,

            cost_code_id:
              form.cost_code_id ||
              null,

            original_amount:
              originalAmount,

            approved_changes:
              approvedChanges,

            status:
              form.status,

            start_date:
              form.start_date ||
              null,

            end_date:
              form.end_date ||
              null,

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
            "UPDATE COMMITMENT ERROR:",
            error
          );

          alert(
            error.message
          );

          return;
        }
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
          .from("commitments")
          .insert({
            project_id:
              selectedProject,

            commitment_number:
              form.commitment_number.trim(),

            commitment_type:
              form.commitment_type,

            vendor:
              form.vendor.trim(),

            description:
              form.description.trim() ||
              null,

            cost_code_id:
              form.cost_code_id ||
              null,

            original_amount:
              originalAmount,

            approved_changes:
              approvedChanges,

            status:
              form.status,

            start_date:
              form.start_date ||
              null,

            end_date:
              form.end_date ||
              null,

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
            "INSERT COMMITMENT ERROR:",
            error
          );

          if (
            error.code ===
            "23505"
          ) {
            alert(
              "This commitment number already exists for this project."
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

      setSelectedCommitment(
        null
      );

      await loadProjectData();
    } catch (error: any) {
      console.error(
        "SAVE COMMITMENT ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to save commitment."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // DELETE
  // =========================================================

  async function deleteCommitment(
    id?: string
  ) {
    if (!canDelete) {
      alert(
        "You do not have permission to delete Commitments."
      );

      return;
    }

    const target =
      id
        ? commitments.find(
            (item) =>
              item.id === id
          )
        : selectedCommitment;

    if (!target) {
      alert(
        "Please select a Commitment first."
      );

      return;
    }

    if (target.deleted_at) {
      await restoreCommitment(
        target.id
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete commitment "${target.commitment_number}"? It will be moved to the Deleted list and can be restored later.`
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        data,
        error,
      } = await supabase
        .from("commitments")
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
          "id,deleted_at"
        )
        .maybeSingle();

      if (error) {
        console.error(
          "DELETE COMMITMENT ERROR:",
          error
        );

        alert(
          error.message
        );

        return;
      }

      if (!data) {
        alert(
          "The Commitment was not deleted. Check your Supabase Row Level Security policies."
        );

        return;
      }

      setCommitments(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              target.id
          )
      );

      setSelectedCommitment(
        null
      );

      await loadDeletedCommitments(
        selectedProject
      );
    } catch (error: any) {
      console.error(
        "DELETE COMMITMENT ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to delete commitment."
      );
    }
  }

  // =========================================================
  // RESTORE
  // =========================================================

  async function restoreCommitment(
    id?: string
  ) {
    if (!canDelete) {
      alert(
        "You do not have permission to restore Commitments."
      );

      return;
    }

    const target =
      id
        ? deletedCommitments.find(
            (item) =>
              item.id === id
          )
        : selectedCommitment;

    if (!target) {
      alert(
        "Please select a deleted Commitment first."
      );

      return;
    }

    if (!target.deleted_at) {
      alert(
        "This Commitment is already active."
      );

      return;
    }

    if (restoringId) {
      return;
    }

    const confirmed =
      window.confirm(
        `Restore commitment "${target.commitment_number}"?`
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
        .from("commitments")
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
          "id,project_id,commitment_number,commitment_type,vendor,description,cost_code_id,original_amount,approved_changes,status,start_date,end_date,notes,deleted_at"
        )
        .maybeSingle();

      if (error) {
        console.error(
          "RESTORE COMMITMENT ERROR:",
          error
        );

        alert(
          error.message
        );

        return;
      }

      if (!data) {
        alert(
          "Restore did not update the record. Check your Supabase Row Level Security policies."
        );

        return;
      }

      await Promise.all([
        loadCommitments(
          selectedProject
        ),
        loadDeletedCommitments(
          selectedProject
        ),
      ]);

      setSelectedCommitment(
        null
      );

      setShowDeleted(
        false
      );

      alert(
        "Commitment restored successfully."
      );
    } catch (error: any) {
      console.error(
        "RESTORE COMMITMENT ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to restore commitment."
      );
    } finally {
      setRestoringId(
        null
      );
    }
  }

  // =========================================================
  // DELETE / RESTORE SELECTED
  // =========================================================

  function handleDeleteRestore() {
    if (!selectedCommitment) {
      alert(
        "Please select a Commitment first."
      );

      return;
    }

    if (
      selectedCommitment.deleted_at
    ) {
      restoreCommitment(
        selectedCommitment.id
      );
    } else {
      deleteCommitment(
        selectedCommitment.id
      );
    }
  }

  // =========================================================
  // MANAGE
  // =========================================================

  function openManage() {
    if (!canManage) {
      alert(
        "You do not have permission to manage Commitments."
      );

      return;
    }

    setShowManage(true);
  }

  // =========================================================
  // FILTER
  // =========================================================

  const filteredCommitments =
    useMemo(() => {
      return commitments.filter(
        (item) => {
          const searchText =
            `${item.commitment_number} ${
              item.vendor
            } ${
              item.description ??
              ""
            } ${
              item.cost_codes
                ?.code ?? ""
            } ${
              item.cost_codes
                ?.description ?? ""
            }`.toLowerCase();

          const matchesSearch =
            searchText.includes(
              search.toLowerCase()
            );

          const matchesStatus =
            statusFilter ===
              "All" ||
            item.status ===
              statusFilter;

          const matchesType =
            typeFilter ===
              "All" ||
            item.commitment_type ===
              typeFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesType
          );
        }
      );
    }, [
      commitments,
      search,
      statusFilter,
      typeFilter,
    ]);

  // =========================================================
  // TOTALS
  // =========================================================

  const totalOriginal =
    commitments.reduce(
      (total, item) =>
        total +
        Number(
          item.original_amount ||
            0
        ),
      0
    );

  const totalChanges =
    commitments.reduce(
      (total, item) =>
        total +
        Number(
          item.approved_changes ||
            0
        ),
      0
    );

  const totalCommitted =
    totalOriginal +
    totalChanges;

  const activeCommitted =
    commitments
      .filter(
        (item) =>
          item.status ===
            "Approved" ||
          item.status ===
            "Active"
      )
      .reduce(
        (total, item) =>
          total +
          Number(
            item.original_amount ||
              0
          ) +
          Number(
            item.approved_changes ||
              0
          ),
        0
      );

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
  // SELECTED STATUS
  // =========================================================

  const selectedIsDeleted =
    Boolean(
      selectedCommitment?.deleted_at
    );

  // =========================================================
  // EXPORT CSV
  // =========================================================

  function exportCSV() {
    if (
      filteredCommitments.length ===
      0
    ) {
      alert(
        "There are no commitments to export."
      );

      return;
    }

    const headers = [
      "Commitment Number",
      "Type",
      "Vendor",
      "Description",
      "Cost Code",
      "Status",
      "Original Amount",
      "Approved Changes",
      "Total Committed",
      "Start Date",
      "End Date",
      "Notes",
    ];

    const rows =
      filteredCommitments.map(
        (item) => [
          item.commitment_number,
          item.commitment_type,
          item.vendor,
          item.description ??
            "",
          item.cost_codes
            ?.code ?? "",
          item.status,
          item.original_amount,
          item.approved_changes,
          Number(
            item.original_amount ||
              0
          ) +
            Number(
              item.approved_changes ||
                0
            ),
          item.start_date ??
            "",
          item.end_date ??
            "",
          item.notes ??
            "",
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
      `${selectedProjectName.replace(
        /\s+/g,
        "_"
      )}_Commitments.csv`;

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
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">

        <div className="bg-white border rounded-xl p-8">
          Loading Commitments...
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
            Commitment Access Restricted
          </h1>

          <p className="text-gray-500 mt-3">
            You do not have permission
            to view Commitments.
          </p>

          <p className="text-sm text-gray-400 mt-2">
            Contact your company
            administrator if you need
            access.
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
        href="/app/cost-management"
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
            Commitments
          </h1>

          <p className="text-gray-500 mt-2">
            Track purchase orders,
            subcontracts, contracts,
            and other committed costs.
          </p>

          {/* ACTION BUTTONS */}

          <div className="flex gap-2 flex-wrap mt-4">

            {/* VIEW */}

            {canView && (
              <button
                type="button"
                onClick={
                  openViewSelected
                }
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  selectedCommitment
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
                  selectedCommitment &&
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
                  selectedCommitment
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
            PROJECT SELECTOR
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

              setSelectedCommitment(
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
          {commitments.length} commitment
          {commitments.length ===
          1
            ? ""
            : "s"}
        </p>

      </div>

      {/* =====================================================
          SELECTED COMMITMENT
      ===================================================== */}

      {selectedCommitment && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex justify-between items-center">

          <div>

            <p className="text-xs text-blue-600 font-semibold uppercase">
              Selected Commitment
            </p>

            <p className="font-bold text-blue-900 mt-1">
              {
                selectedCommitment.commitment_number
              }
              {" — "}
              {
                selectedCommitment.vendor
              }
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setSelectedCommitment(
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
          KPI CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Total Commitments
          </p>

          <p className="text-3xl font-bold mt-2">
            {commitments.length}
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Original Amount
          </p>

          <p className="text-3xl font-bold mt-2">
            {money(
              totalOriginal
            )}
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Approved Changes
          </p>

          <p className="text-3xl font-bold mt-2">
            {money(
              totalChanges
            )}
          </p>

        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Total Committed
          </p>

          <p className="text-3xl font-bold text-blue-600 mt-2">
            {money(
              totalCommitted
            )}
          </p>

        </div>

      </div>

      {/* =====================================================
          ACTIVE / APPROVED
      ===================================================== */}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">

        <div className="flex justify-between items-center">

          <div>

            <p className="text-sm text-blue-700 font-medium">
              Active / Approved Commitments
            </p>

            <p className="text-3xl font-bold text-blue-800 mt-1">
              {money(
                activeCommitted
              )}
            </p>

          </div>

          <div className="text-4xl">
            📑
          </div>

        </div>

      </div>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="flex justify-between items-center mb-5 gap-4 flex-wrap">

        <div className="flex gap-3 flex-wrap">

          <input
            type="text"
            placeholder="Search commitments..."
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
              All Types
            </option>

            {COMMITMENT_TYPES.map(
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
                deletedCommitments.length
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
              + New Commitment
            </button>
          )}

        </div>

      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loadingData && (
        <div className="mb-4 text-sm text-blue-600">
          Loading project commitment data...
        </div>
      )}

      {/* =====================================================
          ACTIVE TABLE
      ===================================================== */}

      <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">

        <table className="w-full min-w-[1150px]">

          <thead className="bg-gray-100 border-b">

            <tr>

              <th className="text-left p-4 w-12">
                Select
              </th>

              <th className="text-left p-4">
                Commitment #
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
                Status
              </th>

              <th className="text-right p-4">
                Original
              </th>

              <th className="text-right p-4">
                Changes
              </th>

              <th className="text-right p-4">
                Committed
              </th>

              <th className="text-right p-4">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredCommitments.length ===
              0 && (
              <tr>

                <td
                  colSpan={10}
                  className="p-12 text-center"
                >

                  <div className="text-4xl mb-3">
                    📑
                  </div>

                  <p className="font-semibold">
                    No commitments found
                  </p>

                  <p className="text-gray-500 text-sm mt-1">
                    {canCreate
                      ? "Create your first purchase order, subcontract, or other commitment."
                      : "There are no commitments available for this project."}
                  </p>

                  {canCreate && (
                    <button
                      type="button"
                      onClick={
                        openAddForm
                      }
                      className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                    >
                      + New Commitment
                    </button>
                  )}

                </td>

              </tr>
            )}

            {filteredCommitments.map(
              (item) => {

                const committed =
                  Number(
                    item.original_amount ||
                      0
                  ) +
                  Number(
                    item.approved_changes ||
                      0
                  );

                const isSelected =
                  selectedCommitment?.id ===
                  item.id;

                return (
                  <tr
                    key={
                      item.id
                    }
                    onClick={() =>
                      selectCommitment(
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
                        name="selected-commitment"
                        checked={
                          isSelected
                        }
                        onChange={() =>
                          selectCommitment(
                            item
                          )
                        }
                        className="h-4 w-4"
                      />

                    </td>

                    {/* NUMBER */}

                    <td className="p-4 font-semibold text-blue-700">
                      {
                        item.commitment_number
                      }
                    </td>

                    {/* TYPE */}

                    <td className="p-4">
                      {
                        item.commitment_type
                      }
                    </td>

                    {/* VENDOR */}

                    <td className="p-4">

                      <p className="font-semibold">
                        {
                          item.vendor
                        }
                      </p>

                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                          {
                            item.description
                          }
                        </p>
                      )}

                    </td>

                    {/* COST CODE */}

                    <td className="p-4">

                      {item.cost_codes ? (
                        <div>

                          <p className="font-semibold">
                            {
                              item.cost_codes
                                .code
                            }
                          </p>

                          <p className="text-xs text-gray-500">
                            {
                              item.cost_codes
                                .description
                            }
                          </p>

                        </div>
                      ) : (
                        <span className="text-gray-400">
                          Not assigned
                        </span>
                      )}

                    </td>

                    {/* STATUS */}

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.status ===
                          "Active"
                            ? "bg-green-100 text-green-700"
                            : item.status ===
                              "Approved"
                            ? "bg-blue-100 text-blue-700"
                            : item.status ===
                              "Completed"
                            ? "bg-purple-100 text-purple-700"
                            : item.status ===
                              "Cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {
                          item.status
                        }
                      </span>

                    </td>

                    {/* ORIGINAL */}

                    <td className="p-4 text-right">
                      {money(
                        Number(
                          item.original_amount ||
                            0
                        )
                      )}
                    </td>

                    {/* CHANGES */}

                    <td className="p-4 text-right">
                      {money(
                        Number(
                          item.approved_changes ||
                            0
                        )
                      )}
                    </td>

                    {/* COMMITTED */}

                    <td className="p-4 text-right font-semibold">
                      {money(
                        committed
                      )}
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
                              setSelectedCommitment(
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
                              deleteCommitment(
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
        selectedCommitment && (
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="flex justify-between items-center border-b p-6 sticky top-0 bg-white z-10">

                <div>

                  <h2 className="text-2xl font-bold">
                    View Commitment
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Read-only commitment information
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

              {/* BODY */}

              <div className="p-6 space-y-5">

                <InfoField
                  label="Project"
                  value={
                    selectedProjectName
                  }
                />

                <div className="grid grid-cols-2 gap-5">

                  <InfoField
                    label="Commitment Number"
                    value={
                      selectedCommitment.commitment_number
                    }
                  />

                  <InfoField
                    label="Commitment Type"
                    value={
                      selectedCommitment.commitment_type
                    }
                  />

                </div>

                <InfoField
                  label="Vendor"
                  value={
                    selectedCommitment.vendor
                  }
                />

                <InfoField
                  label="Description"
                  value={
                    selectedCommitment.description ||
                    "—"
                  }
                />

                <InfoField
                  label="Cost Code"
                  value={
                    selectedCommitment
                      .cost_codes
                      ? `${selectedCommitment.cost_codes.code} — ${selectedCommitment.cost_codes.description}`
                      : "Not assigned"
                  }
                />

                <div className="grid grid-cols-3 gap-5">

                  <InfoField
                    label="Original Amount"
                    value={money(
                      Number(
                        selectedCommitment.original_amount ||
                          0
                      )
                    )}
                  />

                  <InfoField
                    label="Approved Changes"
                    value={money(
                      Number(
                        selectedCommitment.approved_changes ||
                          0
                      )
                    )}
                  />

                  <InfoField
                    label="Total Committed"
                    value={money(
                      Number(
                        selectedCommitment.original_amount ||
                          0
                      ) +
                        Number(
                          selectedCommitment.approved_changes ||
                            0
                        )
                    )}
                  />

                </div>

                <div className="grid grid-cols-2 gap-5">

                  <InfoField
                    label="Status"
                    value={
                      selectedCommitment.status
                    }
                  />

                  <InfoField
                    label="Start Date"
                    value={
                      selectedCommitment.start_date ||
                      "—"
                    }
                  />

                </div>

                <InfoField
                  label="End Date"
                  value={
                    selectedCommitment.end_date ||
                    "—"
                  }
                />

                <InfoField
                  label="Notes"
                  value={
                    selectedCommitment.notes ||
                    "—"
                  }
                />

                <InfoField
                  label="Record Status"
                  value={
                    selectedCommitment.deleted_at
                      ? "Deleted"
                      : "Active"
                  }
                />

                {selectedCommitment.created_at && (
                  <InfoField
                    label="Created"
                    value={new Date(
                      selectedCommitment.created_at
                    ).toLocaleString()}
                  />
                )}

                {selectedCommitment.updated_at && (
                  <InfoField
                    label="Last Updated"
                    value={new Date(
                      selectedCommitment.updated_at
                    ).toLocaleString()}
                  />
                )}

              </div>

              {/* FOOTER */}

              <div className="border-t p-6 flex justify-end gap-3">

                {canEdit &&
                  !selectedCommitment.deleted_at && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowView(
                        false
                      );

                      openEditForm(
                        selectedCommitment
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="flex justify-between items-center border-b p-6 sticky top-0 bg-white z-10">

                <div>

                  <h2 className="text-2xl font-bold">
                    {editingId
                      ? "Edit Commitment"
                      : "New Commitment"}
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

                {/* NUMBER + TYPE */}

                <div className="grid grid-cols-2 gap-5">

                  <FormInput
                    label="Commitment Number *"
                    placeholder="PO-001"
                    value={
                      form.commitment_number
                    }
                    onChange={(value) =>
                      setForm({
                        ...form,
                        commitment_number:
                          value,
                      })
                    }
                  />

                  <div>

                    <label className="block text-sm font-semibold mb-2">
                      Commitment Type *
                    </label>

                    <select
                      value={
                        form.commitment_type
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          commitment_type:
                            e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3 bg-white"
                    >

                      {COMMITMENT_TYPES.map(
                        (type) => (
                          <option
                            key={
                              type
                            }
                            value={
                              type
                            }
                          >
                            {type}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

                {/* VENDOR + COST CODE */}

                <div className="grid grid-cols-2 gap-5">

                  <FormInput
                    label="Vendor *"
                    placeholder="ABC Electrical"
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
                  />

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
                            }{" "}
                            —{" "}
                            {
                              code.description
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

                {/* DESCRIPTION */}

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Description
                  </label>

                  <textarea
                    rows={3}
                    placeholder="Describe the commitment..."
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
                    className="w-full border rounded-lg px-4 py-3 resize-y"
                  />

                </div>

                {/* AMOUNTS */}

                <div className="grid grid-cols-2 gap-5">

                  <div>

                    <label className="block text-sm font-semibold mb-2">
                      Original Amount *
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={
                        form.original_amount
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          original_amount:
                            e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-semibold mb-2">
                      Approved Changes
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={
                        form.approved_changes
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          approved_changes:
                            e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                </div>

                {/* TOTAL PREVIEW */}

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">

                  <p className="text-sm text-blue-700 font-semibold">
                    Total Committed
                  </p>

                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {money(
                      Number(
                        form.original_amount ||
                          0
                      ) +
                        Number(
                          form.approved_changes ||
                            0
                        )
                    )}
                  </p>

                </div>

                {/* STATUS + START DATE */}

                <div className="grid grid-cols-2 gap-5">

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
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {status}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-semibold mb-2">
                      Start Date
                    </label>

                    <input
                      type="date"
                      value={
                        form.start_date
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          start_date:
                            e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                </div>

                {/* END DATE */}

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={
                      form.end_date
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        end_date:
                          e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  />

                </div>

                {/* NOTES */}

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Notes
                  </label>

                  <textarea
                    rows={4}
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
                    saveCommitment
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
                    : "Create Commitment"}
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="flex justify-between items-center border-b p-6 sticky top-0 bg-red-50 z-10">

                <div>

                  <h2 className="text-2xl font-bold text-red-800">
                    Deleted Commitments
                  </h2>

                  <p className="text-sm text-red-600 mt-1">
                    Deleted commitments can be restored.
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

              {deletedCommitments.length ===
              0 ? (

                <div className="p-12 text-center">

                  <div className="text-4xl mb-3">
                    🗑️
                  </div>

                  <p className="font-semibold">
                    No deleted commitments
                  </p>

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[1150px]">

                    <thead className="bg-gray-50 border-b">

                      <tr>

                        <th className="text-left p-4 w-12">
                          Select
                        </th>

                        <th className="text-left p-4">
                          Commitment #
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
                          Status
                        </th>

                        <th className="text-right p-4">
                          Original
                        </th>

                        <th className="text-right p-4">
                          Changes
                        </th>

                        <th className="text-right p-4">
                          Committed
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

                      {deletedCommitments.map(
                        (item) => {

                          const committed =
                            Number(
                              item.original_amount ||
                                0
                            ) +
                            Number(
                              item.approved_changes ||
                                0
                            );

                          const isSelected =
                            selectedCommitment?.id ===
                            item.id;

                          return (
                            <tr
                              key={
                                item.id
                              }
                              onClick={() =>
                                selectCommitment(
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
                                  name="selected-deleted-commitment"
                                  checked={
                                    isSelected
                                  }
                                  onChange={() =>
                                    selectCommitment(
                                      item
                                    )
                                  }
                                  className="h-4 w-4"
                                />

                              </td>

                              <td className="p-4 font-semibold text-gray-600">
                                {
                                  item.commitment_number
                                }
                              </td>

                              <td className="p-4">
                                {
                                  item.commitment_type
                                }
                              </td>

                              <td className="p-4">
                                {
                                  item.vendor
                                }
                              </td>

                              <td className="p-4">

                                {item.cost_codes
                                  ? `${item.cost_codes.code} — ${item.cost_codes.description}`
                                  : "Not assigned"}

                              </td>

                              <td className="p-4">

                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                  {
                                    item.status
                                  }
                                </span>

                              </td>

                              <td className="p-4 text-right">
                                {money(
                                  Number(
                                    item.original_amount ||
                                      0
                                  )
                                )}
                              </td>

                              <td className="p-4 text-right">
                                {money(
                                  Number(
                                    item.approved_changes ||
                                      0
                                  )
                                )}
                              </td>

                              <td className="p-4 text-right font-semibold">
                                {money(
                                  committed
                                )}
                              </td>

                              <td className="p-4 text-sm text-gray-500">
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
                                    restoreCommitment(
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

              {/* FOOTER */}

              <div className="border-t p-6 flex justify-end gap-3 sticky bottom-0 bg-white">

                {selectedCommitment?.deleted_at &&
                  canDelete && (
                    <button
                      type="button"
                      onClick={() =>
                        restoreCommitment(
                          selectedCommitment.id
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="flex justify-between items-center border-b p-6 sticky top-0 bg-white z-10">

                <div>

                  <h2 className="text-2xl font-bold">
                    Manage Commitments
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Administrative Commitment controls
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

              {/* BODY */}

              <div className="p-6 space-y-5">

                {/* PROJECT */}

                <div className="bg-gray-50 border rounded-xl p-5">

                  <p className="text-sm text-gray-500">
                    Project
                  </p>

                  <p className="text-lg font-bold mt-1">
                    {selectedProjectName}
                  </p>

                </div>

                {/* ACTIONS */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <ManageAction
                    title="Create Commitment"
                    description="Add a new purchase order, contract, or subcontract."
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
                    description="Open the selected Commitment details."
                    icon="👁️"
                    disabled={
                      !selectedCommitment
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
                    description="Modify the selected active Commitment."
                    icon="✏️"
                    disabled={
                      !selectedCommitment ||
                      Boolean(
                        selectedCommitment.deleted_at
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
                    description="Soft-delete or restore the selected Commitment."
                    icon={
                      selectedIsDeleted
                        ? "♻️"
                        : "🗑️"
                    }
                    disabled={
                      !selectedCommitment
                    }
                    onClick={() => {
                      setShowManage(
                        false
                      );

                      handleDeleteRestore();
                    }}
                  />

                  <ManageAction
                    title="Deleted Commitments"
                    description="View and restore deleted records."
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
                    description="Export the currently filtered commitments."
                    icon="⬇️"
                    onClick={() => {
                      exportCSV();
                    }}
                  />

                  <ManageAction
                    title="Refresh Data"
                    description="Reload Commitments and Cost Codes from Supabase."
                    icon="🔄"
                    onClick={async () => {
                      await loadProjectData();
                    }}
                  />

                </div>

                {/* SELECTED */}

                <div className="border rounded-xl p-5">

                  <h3 className="font-bold">
                    Current Selection
                  </h3>

                  {selectedCommitment ? (

                    <div className="mt-3 text-sm space-y-1">

                      <p>
                        <span className="font-semibold">
                          Commitment:
                        </span>{" "}
                        {
                          selectedCommitment.commitment_number
                        }
                      </p>

                      <p>
                        <span className="font-semibold">
                          Vendor:
                        </span>{" "}
                        {
                          selectedCommitment.vendor
                        }
                      </p>

                      <p>
                        <span className="font-semibold">
                          Type:
                        </span>{" "}
                        {
                          selectedCommitment.commitment_type
                        }
                      </p>

                      <p>
                        <span className="font-semibold">
                          Status:
                        </span>{" "}
                        {
                          selectedCommitment.status
                        }
                      </p>

                      <p>
                        <span className="font-semibold">
                          Total:
                        </span>{" "}
                        {money(
                          Number(
                            selectedCommitment.original_amount ||
                              0
                          ) +
                            Number(
                              selectedCommitment.approved_changes ||
                                0
                            )
                        )}
                      </p>

                      <p>
                        <span className="font-semibold">
                          Record:
                        </span>{" "}
                        {selectedCommitment.deleted_at
                          ? "Deleted"
                          : "Active"}
                      </p>

                    </div>

                  ) : (

                    <p className="text-sm text-gray-500 mt-2">
                      No Commitment is currently selected.
                    </p>

                  )}

                </div>

              </div>

              {/* FOOTER */}

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
// FORM INPUT
// =========================================================

function FormInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>

      <label className="block text-sm font-semibold mb-2">
        {label}
      </label>

      <input
        type="text"
        placeholder={
          placeholder
        }
        value={value}
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