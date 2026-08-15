"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

import { getAccessibleProjects } from "@/lib/projectAccess";
import { hasPermission } from "@/lib/permissions";

import {
  getChangeOrderAttachments,
  uploadChangeOrderAttachment,
  deleteChangeOrderAttachment,
} from "@/lib/changeOrderAttachments";

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

type ChangeOrder = {
  id: string;
  project_id: string;
  cost_code_id: string | null;

  change_order_number: string;
  title: string;
  description: string | null;

  change_type: string;
  status: string;

  estimated_amount: number;
  proposed_amount: number;
  approved_amount: number;

  schedule_days: number;

  requested_by: string | null;

  submitted_date: string | null;
  approved_date: string | null;

  notes: string | null;

  deleted_at: string | null;

  created_at?: string;
  updated_at?: string;

  cost_codes?: {
    code: string;
    description: string;
  } | null;
};

type ChangeOrderAttachment = {
  id: string;
  change_order_id: string;
  file_name: string;
  file_url: string;
  uploaded_by: string | null;
  created_at: string;
};

type ChangeOrderPermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  manage: boolean;
};

// =====================================================
// CONSTANTS
// =====================================================

const CHANGE_TYPES = [
  "Owner Change",
  "Design Change",
  "Field Condition",
  "Client Request",
  "Design Error/Omission",
  "Regulatory",
  "Unforeseen Condition",
  "Other",
];

const STATUSES = [
  "Potential",
  "Pending",
  "Submitted",
  "Approved",
  "Rejected",
  "Void",
];

// =====================================================
// PAGE
// =====================================================

export default function ChangeOrdersPage() {
  // =====================================================
  // PROJECT
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

  const [changeOrders, setChangeOrders] =
    useState<ChangeOrder[]>([]);

  const [deletedChangeOrders, setDeletedChangeOrders] =
    useState<ChangeOrder[]>([]);

  // =====================================================
  // PERMISSIONS
  // =====================================================

  const [permissions, setPermissions] =
    useState<ChangeOrderPermissions>({
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

  // =====================================================
  // FILTERS
  // =====================================================

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [typeFilter, setTypeFilter] =
    useState("All");

  // =====================================================
  // PAGE STATE
  // =====================================================

  const [loading, setLoading] =
    useState(true);

  const [loadingData, setLoadingData] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [restoring, setRestoring] =
    useState(false);

  // =====================================================
  // MODALS
  // =====================================================

  const [showForm, setShowForm] =
    useState(false);

  const [showDeleted, setShowDeleted] =
    useState(false);

  const [showApprove, setShowApprove] =
    useState(false);

  const [showManage, setShowManage] =
    useState(false);

  const [showEditSelector, setShowEditSelector] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  // =====================================================
  // DOCUMENTS
  // =====================================================

  const [attachments, setAttachments] =
    useState<ChangeOrderAttachment[]>([]);

  const [uploading, setUploading] =
    useState(false);

  const [selectedChangeOrder, setSelectedChangeOrder] =
    useState<ChangeOrder | null>(null);

  // =====================================================
  // APPROVE STATE
  // =====================================================

  const [approvingId, setApprovingId] =
    useState<string | null>(null);

  // =====================================================
  // FORM
  // =====================================================

  const [form, setForm] = useState({
    change_order_number: "",
    title: "",
    description: "",
    change_type: "Owner Change",
    status: "Pending",

    cost_code_id: "",

    estimated_amount: "",
    proposed_amount: "",
    approved_amount: "0",

    schedule_days: "0",

    requested_by: "",

    submitted_date: "",
    approved_date: "",

    notes: "",
  });

  // =====================================================
  // LOCK BACKGROUND WHEN MODAL IS OPEN
  // =====================================================

  useEffect(() => {
    const modalOpen =
      showForm ||
      showApprove ||
      showManage ||
      showEditSelector ||
      selectedChangeOrder !== null;

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
    showApprove,
    showManage,
    showEditSelector,
    selectedChangeOrder,
  ]);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadPage();
  }, []);

  // =====================================================
  // LOAD PAGE
  // =====================================================

  async function loadPage() {
    try {
      setLoading(true);

      const result =
        await getAccessibleProjects();

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

      const [
        view,
        create,
        edit,
        deletePermission,
        manage,
      ] = await Promise.all([
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
          "manage"
        ),
      ]);

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
        "LOAD CHANGE ORDER ACCESS ERROR:",
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

  // =====================================================
  // PROJECT DATA
  // =====================================================

  useEffect(() => {
    if (!selectedProject || !canView) {
      setCostCodes([]);
      setChangeOrders([]);
      setDeletedChangeOrders([]);
      return;
    }

    loadProjectData();
  }, [
    selectedProject,
    canView,
  ]);

  async function loadProjectData() {
    try {
      setLoadingData(true);

      await Promise.all([
        loadCostCodes(),
        loadChangeOrders(),
        loadDeletedChangeOrders(),
      ]);
    } finally {
      setLoadingData(false);
    }
  }

  // =====================================================
  // COST CODES
  // =====================================================

  async function loadCostCodes() {
    if (!selectedProject) return;

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

  // =====================================================
  // ACTIVE CHANGE ORDERS
  // =====================================================

  async function loadChangeOrders() {
    if (!selectedProject) return;

    const {
      data,
      error,
    } = await supabase
      .from("change_orders")
      .select(`
        *,
        cost_codes (
          code,
          description
        )
      `)
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
        "CHANGE ORDER LOAD ERROR:",
        error
      );

      setChangeOrders([]);
      return;
    }

    setChangeOrders(
      (data as ChangeOrder[]) ?? []
    );
  }

  // =====================================================
  // DELETED CHANGE ORDERS
  // =====================================================

  async function loadDeletedChangeOrders() {
    if (!selectedProject) return;

    const {
      data,
      error,
    } = await supabase
      .from("change_orders")
      .select(`
        *,
        cost_codes (
          code,
          description
        )
      `)
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
        "DELETED CHANGE ORDER LOAD ERROR:",
        error
      );

      setDeletedChangeOrders([]);
      return;
    }

    setDeletedChangeOrders(
      (data as ChangeOrder[]) ?? []
    );
  }

  // =====================================================
  // VIEW BUTTON
  // =====================================================

  function handleViewButton() {
    if (!canView) {
      alert(
        "You do not have permission to view Change Orders."
      );
      return;
    }

    setTimeout(() => {
      document
        .getElementById(
          "change-order-table"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  // =====================================================
  // CREATE BUTTON
  // =====================================================

  function openAddForm() {
    if (!canCreate) {
      alert(
        "You do not have permission to create Change Orders."
      );

      return;
    }

    setEditingId(null);

    setForm({
      change_order_number: "",
      title: "",
      description: "",
      change_type: "Owner Change",
      status: "Pending",

      cost_code_id: "",

      estimated_amount: "",
      proposed_amount: "",
      approved_amount: "0",

      schedule_days: "0",

      requested_by: "",

      submitted_date: "",
      approved_date: "",

      notes: "",
    });

    setShowForm(true);
  }

  // =====================================================
  // EDIT BUTTON
  // =====================================================

  function handleEditButton() {
    if (!canEdit) {
      alert(
        "You do not have permission to edit Change Orders."
      );

      return;
    }

    if (changeOrders.length === 0) {
      alert(
        "There are no Change Orders available to edit."
      );

      return;
    }

    setShowEditSelector(true);
  }

  function selectChangeOrderForEdit(
    item: ChangeOrder
  ) {
    setShowEditSelector(false);
    openEditForm(item);
  }

  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  function openEditForm(
    item: ChangeOrder
  ) {
    if (!canEdit) {
      alert(
        "You do not have permission to edit Change Orders."
      );

      return;
    }

    if (item.deleted_at) {
      alert(
        "Deleted Change Orders cannot be edited. Restore them first."
      );

      return;
    }

    setEditingId(item.id);

    setForm({
      change_order_number:
        item.change_order_number,

      title:
        item.title,

      description:
        item.description ?? "",

      change_type:
        item.change_type,

      status:
        item.status,

      cost_code_id:
        item.cost_code_id ?? "",

      estimated_amount:
        String(
          item.estimated_amount ?? 0
        ),

      proposed_amount:
        String(
          item.proposed_amount ?? 0
        ),

      approved_amount:
        String(
          item.approved_amount ?? 0
        ),

      schedule_days:
        String(
          item.schedule_days ?? 0
        ),

      requested_by:
        item.requested_by ?? "",

      submitted_date:
        item.submitted_date ?? "",

      approved_date:
        item.approved_date ?? "",

      notes:
        item.notes ?? "",
    });

    setShowForm(true);
  }

  // =====================================================
  // SAVE CHANGE ORDER
  // =====================================================

  async function saveChangeOrder() {
    if (
      editingId &&
      !canEdit
    ) {
      alert(
        "You do not have permission to edit Change Orders."
      );

      return;
    }

    if (
      !editingId &&
      !canCreate
    ) {
      alert(
        "You do not have permission to create Change Orders."
      );

      return;
    }

    if (!selectedProject) {
      alert(
        "Please select a project."
      );

      return;
    }

    if (!form.title.trim()) {
      alert(
        "Please enter a title."
      );

      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        alert(
          "You are not logged in."
        );

        return;
      }

      let changeOrderNumber =
        form.change_order_number.trim();

      // ===================================================
      // GENERATE NUMBER FOR NEW RECORD
      // ===================================================

      if (!editingId) {
        const {
          data: generatedNumber,
          error: numberError,
        } =
          await supabase.rpc(
            "get_next_change_order_number",
            {
              p_project_id:
                selectedProject,
            }
          );

        if (numberError) {
          console.error(
            "CHANGE ORDER NUMBER ERROR:",
            numberError
          );

          alert(
            "Unable to generate Change Order number: " +
              numberError.message
          );

          return;
        }

        changeOrderNumber =
          generatedNumber;
      }

      const payload = {
        change_order_number:
          changeOrderNumber,

        title:
          form.title.trim(),

        description:
          form.description.trim() ||
          null,

        change_type:
          form.change_type,

        status:
          form.status,

        cost_code_id:
          form.cost_code_id ||
          null,

        estimated_amount:
          Number(
            form.estimated_amount ||
              0
          ),

        proposed_amount:
          Number(
            form.proposed_amount ||
              0
          ),

        approved_amount:
          Number(
            form.approved_amount ||
              0
          ),

        schedule_days:
          Number(
            form.schedule_days ||
              0
          ),

        requested_by:
          form.requested_by.trim() ||
          null,

        submitted_date:
          form.submitted_date ||
          null,

        approved_date:
          form.approved_date ||
          null,

        notes:
          form.notes.trim() ||
          null,

        updated_at:
          new Date().toISOString(),
      };

      // ===================================================
      // UPDATE
      // ===================================================

      if (editingId) {
        const {
          error,
        } = await supabase
          .from("change_orders")
          .update(payload)
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
            "UPDATE CHANGE ORDER ERROR:",
            error
          );

          alert(error.message);
          return;
        }
      }

      // ===================================================
      // CREATE
      // ===================================================

      else {
        const {
          error,
        } = await supabase
          .from("change_orders")
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
            "CREATE CHANGE ORDER ERROR:",
            error
          );

          alert(error.message);
          return;
        }
      }

      setShowForm(false);
      setEditingId(null);

      await Promise.all([
        loadChangeOrders(),
        loadDeletedChangeOrders(),
      ]);

      alert(
        editingId
          ? "Change Order updated successfully."
          : "Change Order created successfully."
      );
    } catch (error: any) {
      console.error(
        "SAVE CHANGE ORDER ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to save Change Order."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // DELETE / RESTORE BUTTON
  // =====================================================

  function handleDeleteRestoreButton() {
    if (!canDelete) {
      alert(
        "You do not have permission to delete or restore Change Orders."
      );

      return;
    }

    setShowDeleted(true);
  }

  // =====================================================
  // SOFT DELETE
  // =====================================================

  async function deleteChangeOrder(
    id: string
  ) {
    if (!canDelete) {
      alert(
        "You do not have permission to delete Change Orders."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this Change Order? It will be moved to Deleted and can be restored later."
      );

    if (!confirmed) return;

    try {
      const {
        error,
      } = await supabase
        .from("change_orders")
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
          "DELETE ERROR:",
          error
        );

        alert(error.message);
        return;
      }

      setChangeOrders(
        (prev) =>
          prev.filter(
            (item) =>
              item.id !== id
          )
      );

      await loadDeletedChangeOrders();

      alert(
        "Change Order moved to Deleted."
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to delete Change Order."
      );
    }
  }

  // =====================================================
  // RESTORE
  // =====================================================

  async function restoreChangeOrder(
    id: string
  ) {
    if (!canDelete) {
      alert(
        "You do not have permission to restore Change Orders."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Restore this Change Order?"
      );

    if (!confirmed) return;

    try {
      setRestoring(true);

      const {
        error,
      } = await supabase
        .from("change_orders")
        .update({
          deleted_at: null,

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
          "RESTORE ERROR:",
          error
        );

        alert(error.message);
        return;
      }

      await Promise.all([
        loadChangeOrders(),
        loadDeletedChangeOrders(),
      ]);

      alert(
        "Change Order restored successfully."
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to restore Change Order."
      );
    } finally {
      setRestoring(false);
    }
  }

  // =====================================================
  // APPROVE BUTTON
  // =====================================================

  function handleApproveButton() {
    if (!canEdit && !canManage) {
      alert(
        "You do not have permission to approve Change Orders."
      );

      return;
    }

    setShowApprove(true);
  }

  // =====================================================
  // APPROVE CHANGE ORDER
  // =====================================================

  async function approveChangeOrder(
    item: ChangeOrder
  ) {
    if (!canEdit && !canManage) {
      alert(
        "You do not have permission to approve Change Orders."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Approve ${item.change_order_number} - ${item.title}?`
      );

    if (!confirmed) return;

    try {
      setApprovingId(item.id);

      const {
        error,
      } = await supabase
        .from("change_orders")
        .update({
          status: "Approved",

          approved_amount:
            Number(
              item.proposed_amount ||
                item.estimated_amount ||
                0
            ),

          approved_date:
            new Date()
              .toISOString()
              .slice(0, 10),

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
          "APPROVE ERROR:",
          error
        );

        alert(error.message);
        return;
      }

      await loadChangeOrders();

      alert(
        `${item.change_order_number} approved successfully.`
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "Unable to approve Change Order."
      );
    } finally {
      setApprovingId(null);
    }
  }

  // =====================================================
  // MANAGE BUTTON
  // =====================================================

  function handleManageButton() {
    if (!canManage) {
      alert(
        "You do not have permission to manage Change Orders."
      );

      return;
    }

    setShowManage(true);
  }

  // =====================================================
  // REFRESH
  // =====================================================

  async function refreshData() {
    await loadProjectData();
  }

  // =====================================================
  // ATTACHMENTS
  // =====================================================

  async function loadAttachments(
    changeOrderId: string
  ) {
    const files =
      await getChangeOrderAttachments(
        changeOrderId
      );

    setAttachments(
      files as ChangeOrderAttachment[]
    );
  }

  async function openDocuments(
    item: ChangeOrder
  ) {
    if (!canView) {
      alert(
        "You do not have permission to view documents."
      );

      return;
    }

    setSelectedChangeOrder(item);
    setAttachments([]);

    await loadAttachments(
      item.id
    );
  }

  async function handleAttachmentUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (
      !canCreate &&
      !canEdit
    ) {
      alert(
        "You do not have permission to upload documents."
      );

      e.target.value = "";
      return;
    }

    const file =
      e.target.files?.[0];

    if (!file) return;

    if (!selectedChangeOrder) {
      alert(
        "Please select a Change Order."
      );

      return;
    }

    if (
      selectedChangeOrder.deleted_at
    ) {
      alert(
        "Restore the Change Order before uploading documents."
      );

      e.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const uploaded =
        await uploadChangeOrderAttachment(
          file,
          selectedChangeOrder.id
        );

      if (uploaded) {
        setAttachments(
          (prev) => [
            uploaded as ChangeOrderAttachment,
            ...prev,
          ]
        );
      }
    } catch (error: any) {
      console.error(
        "UPLOAD ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to upload document."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleAttachmentDelete(
    id: string,
    fileUrl: string
  ) {
    if (!canDelete) {
      alert(
        "You do not have permission to delete documents."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Delete this supporting document?"
      );

    if (!confirmed) return;

    const deleted =
      await deleteChangeOrderAttachment(
        id,
        fileUrl
      );

    if (deleted) {
      setAttachments(
        (prev) =>
          prev.filter(
            (file) =>
              file.id !== id
          )
      );
    }
  }

  function closeDocuments() {
    setSelectedChangeOrder(null);
    setAttachments([]);
  }

  // =====================================================
  // FILTER
  // =====================================================

  const filteredOrders =
    useMemo(() => {
      return changeOrders.filter(
        (item) => {
          const searchText =
            `${item.change_order_number} ${item.title} ${
              item.description ?? ""
            } ${
              item.cost_codes?.code ?? ""
            }`.toLowerCase();

          const matchesSearch =
            searchText.includes(
              search.toLowerCase()
            );

          const matchesStatus =
            statusFilter === "All" ||
            item.status ===
              statusFilter;

          const matchesType =
            typeFilter === "All" ||
            item.change_type ===
              typeFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesType
          );
        }
      );
    }, [
      changeOrders,
      search,
      statusFilter,
      typeFilter,
    ]);

  // =====================================================
  // TOTALS
  // =====================================================

  const potentialAmount =
    changeOrders
      .filter(
        (item) =>
          item.status ===
            "Potential" ||
          item.status ===
            "Pending" ||
          item.status ===
            "Submitted"
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.proposed_amount ||
              item.estimated_amount ||
              0
          ),
        0
      );

  const approvedAmount =
    changeOrders
      .filter(
        (item) =>
          item.status ===
          "Approved"
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.approved_amount ||
              0
          ),
        0
      );

  const approvedCount =
    changeOrders.filter(
      (item) =>
        item.status ===
        "Approved"
    ).length;

  const pendingApproval =
    changeOrders.filter(
      (item) =>
        item.status ===
          "Pending" ||
        item.status ===
          "Submitted"
    );

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
    ).format(value || 0);
  }

  // =====================================================
  // STATUS CLASS
  // =====================================================

  function statusClass(
    status: string
  ) {
    if (
      status === "Approved"
    ) {
      return "bg-green-100 text-green-700";
    }

    if (
      status === "Rejected" ||
      status === "Void"
    ) {
      return "bg-red-100 text-red-700";
    }

    if (
      status === "Submitted"
    ) {
      return "bg-purple-100 text-purple-700";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">
        <div className="bg-white border rounded-xl p-8">
          Loading Change Orders...
        </div>
      </main>
    );
  }

  // =====================================================
  // NO VIEW
  // =====================================================

  if (!canView) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">

        <div className="max-w-xl mx-auto bg-white border rounded-xl p-10 text-center shadow-sm">

          <div className="text-5xl mb-4">
            🔒
          </div>

          <h1 className="text-2xl font-bold">
            Change Order Access Restricted
          </h1>

          <p className="text-gray-500 mt-3">
            You do not have permission
            to view Change Orders.
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

      <div className="flex justify-between items-start mt-6 mb-6">

        <div>

          <h1 className="text-4xl font-bold">
            Change Orders
          </h1>

          <p className="text-gray-500 mt-2">
            Track potential, pending,
            submitted, approved, and
            deleted project changes.
          </p>

        </div>

        {/* PROJECT SELECT */}

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
          PROJECT TITLE
      ================================================= */}

      <div className="mb-5">

        <h2 className="text-2xl font-bold">
          {selectedProjectName}
        </h2>

        <p className="text-gray-500">
          Active change orders
        </p>

      </div>

      {/* =================================================
          TOP ACTION BUTTONS
          THESE ARE ALL CLICKABLE
      ================================================= */}

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
              openAddForm
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

        {/* APPROVE */}

        {(canEdit ||
          canManage) && (
          <button
            type="button"
            onClick={
              handleApproveButton
            }
            className="cursor-pointer bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-5 py-2.5 rounded-full font-semibold active:scale-95 transition"
          >
            ✓ Approve
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

      {/* =================================================
          KPI CARDS
      ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

        <div className="bg-white border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Total Change Orders
          </p>

          <p className="text-3xl font-bold mt-2">
            {changeOrders.length}
          </p>

        </div>

        <div className="bg-yellow-50 border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-yellow-700">
            Pending / Potential
          </p>

          <p className="text-3xl font-bold mt-2">
            {money(
              potentialAmount
            )}
          </p>

        </div>

        <div className="bg-green-50 border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-green-700">
            Approved
          </p>

          <p className="text-3xl font-bold mt-2">
            {money(
              approvedAmount
            )}
          </p>

        </div>

        <div className="bg-blue-50 border rounded-xl p-5 shadow-sm">

          <p className="text-sm text-blue-700">
            Approved Count
          </p>

          <p className="text-3xl font-bold mt-2">
            {approvedCount}
          </p>

        </div>

      </div>

      {/* =================================================
          SEARCH / FILTER
      ================================================= */}

      <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">

        <div className="flex flex-col lg:flex-row gap-4">

          <input
            type="text"
            placeholder="Search change orders..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="flex-1 border rounded-lg bg-white px-4 py-3"
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
            className="border rounded-lg bg-white px-4 py-3 min-w-[180px]"
          >

            <option value="All">
              All Statuses
            </option>

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

          <select
            value={
              typeFilter
            }
            onChange={(e) =>
              setTypeFilter(
                e.target.value
              )
            }
            className="border rounded-lg bg-white px-4 py-3 min-w-[200px]"
          >

            <option value="All">
              All Change Types
            </option>

            {CHANGE_TYPES.map(
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

          <button
            type="button"
            onClick={
              refreshData
            }
            className="border border-gray-300 bg-white hover:bg-gray-50 px-5 py-3 rounded-lg font-medium"
          >
            ↻ Refresh
          </button>

        </div>

      </div>

      {/* =================================================
          ACTIVE TABLE
      ================================================= */}

      <div
        id="change-order-table"
        className="bg-white border rounded-xl shadow-sm overflow-x-auto"
      >

        <div className="p-6 border-b">

          <h2 className="text-2xl font-bold">
            Change Order Register
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {filteredOrders.length} active
            Change Order
            {filteredOrders.length ===
            1
              ? ""
              : "s"}
          </p>

        </div>

        {loadingData ? (
          <div className="p-12 text-center text-gray-500">
            Loading Change Orders...
          </div>
        ) : (
          <table className="w-full min-w-[1300px]">

            <thead className="bg-gray-100 border-b">

              <tr>

                <th className="text-left p-4">
                  CO #
                </th>

                <th className="text-left p-4">
                  Title
                </th>

                <th className="text-left p-4">
                  Type
                </th>

                <th className="text-left p-4">
                  Cost Code
                </th>

                <th className="text-left p-4">
                  Status
                </th>

                <th className="text-right p-4">
                  Proposed
                </th>

                <th className="text-right p-4">
                  Approved
                </th>

                <th className="text-right p-4">
                  Days
                </th>

                <th className="text-right p-4">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredOrders.length ===
                0 && (
                <tr>

                  <td
                    colSpan={9}
                    className="p-12 text-center"
                  >

                    <div className="text-4xl mb-3">
                      📋
                    </div>

                    <p className="font-semibold">
                      No Change Orders found
                    </p>

                    <p className="text-gray-500 text-sm mt-1">
                      {canCreate
                        ? "Create a Change Order to start tracking project changes."
                        : "There are no Change Orders for this project."}
                    </p>

                  </td>

                </tr>
              )}

              {filteredOrders.map(
                (item) => (
                  <tr
                    key={
                      item.id
                    }
                    className="border-b hover:bg-gray-50"
                  >

                    <td className="p-4 font-semibold text-blue-700">
                      {
                        item.change_order_number
                      }
                    </td>

                    <td className="p-4">

                      <p className="font-semibold">
                        {item.title}
                      </p>

                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1 max-w-xs">
                          {
                            item.description
                          }
                        </p>
                      )}

                    </td>

                    <td className="p-4">
                      {
                        item.change_type
                      }
                    </td>

                    <td className="p-4">

                      {item.cost_codes ? (
                        <div>

                          <p className="font-semibold">
                            {
                              item.cost_codes.code
                            }
                          </p>

                          <p className="text-xs text-gray-500">
                            {
                              item.cost_codes.description
                            }
                          </p>

                        </div>
                      ) : (
                        "—"
                      )}

                    </td>

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(
                          item.status
                        )}`}
                      >
                        {
                          item.status
                        }
                      </span>

                    </td>

                    <td className="p-4 text-right">
                      {money(
                        Number(
                          item.proposed_amount ||
                            item.estimated_amount ||
                            0
                        )
                      )}
                    </td>

                    <td className="p-4 text-right font-semibold">
                      {money(
                        Number(
                          item.approved_amount ||
                            0
                        )
                      )}
                    </td>

                    <td className="p-4 text-right">
                      {
                        item.schedule_days
                      }
                    </td>

                    <td className="p-4">

                      <div className="flex justify-end gap-3">

                        {canView && (
                          <button
                            type="button"
                            onClick={() =>
                              openDocuments(
                                item
                              )
                            }
                            className="text-purple-600 hover:text-purple-800 font-medium"
                          >
                            Documents
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
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                        )}

                        {canEdit &&
                          (
                            item.status ===
                              "Pending" ||
                            item.status ===
                              "Submitted"
                          ) && (
                            <button
                              type="button"
                              onClick={() =>
                                approveChangeOrder(
                                  item
                                )
                              }
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Approve
                            </button>
                          )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() =>
                              deleteChangeOrder(
                                item.id
                              )
                            }
                            className="text-red-600 hover:text-red-800 font-medium"
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

          </table>
        )}

      </div>

      {/* =================================================
          NEW / EDIT MODAL
      ================================================= */}

      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="flex justify-between items-center border-b p-6 shrink-0">

              <div>

                <h2 className="text-2xl font-bold">
                  {editingId
                    ? "Edit Change Order"
                    : "Create Change Order"}
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
                  setShowForm(false)
                }
                className="text-gray-500 hover:text-gray-800 text-3xl w-10 h-10 rounded-lg hover:bg-gray-100"
              >
                ×
              </button>

            </div>

            <div className="p-6 overflow-y-auto overscroll-contain">

              <div className="space-y-5">

                {/* NUMBER / TYPE */}

                <div className="grid grid-cols-2 gap-5">

                  <div>

                    <label className="block text-sm font-semibold mb-2">
                      Change Order Number
                    </label>

                    <div className="w-full border rounded-lg px-4 py-3 bg-gray-100 text-gray-600">
                      {editingId
                        ? form.change_order_number
                        : "Automatically generated"}
                    </div>

                  </div>

                  <div>

                    <label className="block text-sm font-semibold mb-2">
                      Change Type
                    </label>

                    <select
                      value={
                        form.change_type
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          change_type:
                            e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3 bg-white"
                    >

                      {CHANGE_TYPES.map(
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

                {/* TITLE */}

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Title *
                  </label>

                  <input
                    type="text"
                    value={
                      form.title
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title:
                          e.target.value,
                      })
                    }
                    placeholder="Enter change order title"
                    className="w-full border rounded-lg px-4 py-3"
                  />

                </div>

                {/* DESCRIPTION */}

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
                    placeholder="Describe the scope change..."
                    className="w-full border rounded-lg px-4 py-3 resize-y"
                  />

                </div>

                {/* COST CODE / STATUS */}

                <div className="grid grid-cols-2 gap-5">

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
                            {
                              status
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

                {/* AMOUNTS */}

                <div className="grid grid-cols-3 gap-5">

                  <div>

                    <label className="block text-sm font-semibold mb-2">
                      Estimated
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.estimated_amount
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          estimated_amount:
                            e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-semibold mb-2">
                      Proposed
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.proposed_amount
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          proposed_amount:
                            e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-semibold mb-2">
                      Approved
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.approved_amount
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          approved_amount:
                            e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                </div>

                {/* SCHEDULE / REQUESTED */}

                <div className="grid grid-cols-2 gap-5">

                  <div>

                    <label className="block text-sm font-semibold mb-2">
                      Schedule Impact (Days)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.schedule_days
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          schedule_days:
                            e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-semibold mb-2">
                      Requested By
                    </label>

                    <input
                      type="text"
                      value={
                        form.requested_by
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          requested_by:
                            e.target.value,
                        })
                      }
                      placeholder="Client / PM / Engineer"
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                </div>

                {/* DATES */}

                <div className="grid grid-cols-2 gap-5">

                  <div>

                    <label className="block text-sm font-semibold mb-2">
                      Submitted Date
                    </label>

                    <input
                      type="date"
                      value={
                        form.submitted_date
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          submitted_date:
                            e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-semibold mb-2">
                      Approved Date
                    </label>

                    <input
                      type="date"
                      value={
                        form.approved_date
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          approved_date:
                            e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-3"
                    />

                  </div>

                </div>

                {/* NOTES */}

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

            </div>

            <div className="flex justify-end gap-3 border-t p-6 shrink-0">

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-lg"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  saveChangeOrder
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
                  : "Create Change Order"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          EDIT SELECTOR
      ================================================= */}

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
                  Select Change Order to Edit
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Choose the Change Order you want to modify.
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

                {changeOrders.map(
                  (item) => (
                    <button
                      type="button"
                      key={
                        item.id
                      }
                      onClick={() =>
                        selectChangeOrderForEdit(
                          item
                        )
                      }
                      className="w-full text-left border rounded-xl p-4 hover:bg-blue-50 hover:border-blue-300 transition"
                    >

                      <div className="flex justify-between gap-5">

                        <div>

                          <p className="font-bold text-blue-700">
                            {
                              item.change_order_number
                            }
                          </p>

                          <p className="font-semibold mt-1">
                            {
                              item.title
                            }
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {
                              item.change_type
                            }
                          </p>

                        </div>

                        <div className="text-right">

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(
                              item.status
                            )}`}
                          >
                            {
                              item.status
                            }
                          </span>

                          <p className="font-semibold mt-2">
                            {money(
                              Number(
                                item.proposed_amount ||
                                  item.estimated_amount ||
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

      {/* =================================================
          DELETE / RESTORE MODAL
      ================================================= */}

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
                  Delete / Restore Change Orders
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Deleted Change Orders can be restored from here.
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

              {deletedChangeOrders.length ===
              0 ? (

                <div className="text-center p-12">

                  <div className="text-5xl mb-4">
                    🗑️
                  </div>

                  <p className="font-semibold">
                    No deleted Change Orders
                  </p>

                  <p className="text-gray-500 text-sm mt-2">
                    Deleted records will appear here.
                  </p>

                </div>

              ) : (

                <div className="border rounded-xl overflow-hidden">

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[1000px]">

                      <thead className="bg-gray-100 border-b">

                        <tr>

                          <th className="text-left p-4">
                            CO #
                          </th>

                          <th className="text-left p-4">
                            Title
                          </th>

                          <th className="text-left p-4">
                            Status
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

                        {deletedChangeOrders.map(
                          (item) => (
                            <tr
                              key={
                                item.id
                              }
                              className="border-b"
                            >

                              <td className="p-4 font-semibold text-gray-600">
                                {
                                  item.change_order_number
                                }
                              </td>

                              <td className="p-4">

                                <p className="font-semibold">
                                  {
                                    item.title
                                  }
                                </p>

                                <p className="text-xs text-gray-500">
                                  {
                                    item.change_type
                                  }
                                </p>

                              </td>

                              <td className="p-4">

                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(
                                    item.status
                                  )}`}
                                >
                                  {
                                    item.status
                                  }
                                </span>

                              </td>

                              <td className="p-4 text-right font-semibold">
                                {money(
                                  Number(
                                    item.approved_amount ||
                                      item.proposed_amount ||
                                      item.estimated_amount ||
                                      0
                                  )
                                )}
                              </td>

                              <td className="p-4 text-sm text-gray-500">
                                {item.deleted_at
                                  ? new Date(
                                      item.deleted_at
                                    ).toLocaleString()
                                  : "—"}
                              </td>

                              <td className="p-4 text-right">

                                <button
                                  type="button"
                                  onClick={() =>
                                    restoreChangeOrder(
                                      item.id
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
                  setShowDeleted(false)
                }
                className="border px-5 py-2.5 rounded-lg"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          APPROVE MODAL
      ================================================= */}

      {showApprove && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setShowApprove(false);
            }
          }}
        >

          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="flex justify-between items-center border-b p-6 shrink-0">

              <div>

                <h2 className="text-2xl font-bold">
                  Approve Change Orders
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Pending and submitted Change Orders requiring approval.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowApprove(false)
                }
                className="text-gray-500 hover:text-gray-800 text-3xl"
              >
                ×
              </button>

            </div>

            <div className="p-6 overflow-y-auto overscroll-contain">

              {pendingApproval.length ===
              0 ? (

                <div className="text-center p-12">

                  <div className="text-5xl mb-4">
                    ✓
                  </div>

                  <p className="font-semibold">
                    No Change Orders awaiting approval
                  </p>

                  <p className="text-gray-500 text-sm mt-2">
                    Pending and submitted Change Orders will appear here.
                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {pendingApproval.map(
                    (item) => (
                      <div
                        key={
                          item.id
                        }
                        className="border rounded-xl p-5"
                      >

                        <div className="flex justify-between gap-5">

                          <div>

                            <p className="text-blue-700 font-bold">
                              {
                                item.change_order_number
                              }
                            </p>

                            <h3 className="font-bold text-lg mt-1">
                              {
                                item.title
                              }
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                              {
                                item.change_type
                              }
                              {item.cost_codes
                                ? ` • ${item.cost_codes.code}`
                                : ""}
                            </p>

                            {item.description && (
                              <p className="text-sm text-gray-600 mt-3 max-w-2xl">
                                {
                                  item.description
                                }
                              </p>
                            )}

                          </div>

                          <div className="text-right shrink-0">

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(
                                item.status
                              )}`}
                            >
                              {
                                item.status
                              }
                            </span>

                            <p className="text-2xl font-bold mt-3">
                              {money(
                                Number(
                                  item.proposed_amount ||
                                    item.estimated_amount ||
                                    0
                                )
                              )}
                            </p>

                            <p className="text-xs text-gray-500">
                              Proposed Amount
                            </p>

                          </div>

                        </div>

                        <div className="flex justify-end gap-3 mt-5 pt-4 border-t">

                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                item
                              )
                            }
                            className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg"
                          >
                            Review / Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              approveChangeOrder(
                                item
                              )
                            }
                            disabled={
                              approvingId ===
                              item.id
                            }
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg font-semibold"
                          >
                            {approvingId ===
                            item.id
                              ? "Approving..."
                              : "✓ Approve"}
                          </button>

                        </div>

                      </div>
                    )
                  )}

                </div>

              )}

            </div>

            <div className="border-t p-6 flex justify-end shrink-0">

              <button
                type="button"
                onClick={() =>
                  setShowApprove(false)
                }
                className="border px-5 py-2.5 rounded-lg"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          MANAGE MODAL
      ================================================= */}

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
                  Change Order Management
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Manage Change Order data and access.
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

              {/* COUNTS */}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div className="border rounded-xl p-5 bg-gray-50">

                  <p className="text-sm text-gray-500">
                    Active
                  </p>

                  <p className="text-3xl font-bold mt-1">
                    {
                      changeOrders.length
                    }
                  </p>

                </div>

                <div className="border rounded-xl p-5 bg-gray-50">

                  <p className="text-sm text-gray-500">
                    Deleted
                  </p>

                  <p className="text-3xl font-bold mt-1">
                    {
                      deletedChangeOrders.length
                    }
                  </p>

                </div>

                <div className="border rounded-xl p-5 bg-gray-50">

                  <p className="text-sm text-gray-500">
                    Awaiting Approval
                  </p>

                  <p className="text-3xl font-bold mt-1">
                    {
                      pendingApproval.length
                    }
                  </p>

                </div>

                <div className="border rounded-xl p-5 bg-gray-50">

                  <p className="text-sm text-gray-500">
                    Approved
                  </p>

                  <p className="text-3xl font-bold mt-1">
                    {
                      approvedCount
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
                    onClick={() => {
                      setShowManage(
                        false
                      );
                      openAddForm();
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg"
                  >
                    + Create Change Order
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
                      setShowApprove(
                        true
                      );
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2.5 rounded-lg"
                  >
                    ✓ Approvals
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
                      refreshData
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

      {/* =================================================
          DOCUMENT MODAL
      ================================================= */}

      {selectedChangeOrder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeDocuments();
            }
          }}
        >

          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="flex justify-between items-center border-b p-6 shrink-0">

              <div>

                <h2 className="text-2xl font-bold">
                  Supporting Documents
                </h2>

                <p className="text-gray-500 mt-1">
                  {
                    selectedChangeOrder.change_order_number
                  }
                  {" — "}
                  {
                    selectedChangeOrder.title
                  }
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeDocuments
                }
                className="text-gray-500 hover:text-gray-800 text-3xl"
              >
                ×
              </button>

            </div>

            <div className="p-6 overflow-y-auto overscroll-contain">

              {(canCreate ||
                canEdit) &&
                !selectedChangeOrder.deleted_at && (
                  <label
                    className={`flex items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer ${
                      uploading
                        ? "bg-gray-100 border-gray-300"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >

                    <div className="text-center">

                      <div className="text-4xl mb-2">
                        📎
                      </div>

                      <p className="font-semibold">
                        {uploading
                          ? "Uploading..."
                          : "Upload Supporting Document"}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        Drawings, proposals,
                        estimates, photos,
                        PDFs and other documents
                      </p>

                    </div>

                    <input
                      type="file"
                      hidden
                      disabled={
                        uploading
                      }
                      onChange={
                        handleAttachmentUpload
                      }
                    />

                  </label>
                )}

              {!canCreate &&
                !canEdit && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">

                    <p className="text-sm text-blue-800">
                      👁️ You have view-only
                      access to Change
                      Order documents.
                    </p>

                  </div>
                )}

              <div className="mt-6">

                <div className="flex justify-between items-center mb-3">

                  <h3 className="font-semibold">
                    Documents
                  </h3>

                  <span className="text-sm text-gray-500">
                    {
                      attachments.length
                    }{" "}
                    file
                    {attachments.length ===
                    1
                      ? ""
                      : "s"}
                  </span>

                </div>

                {attachments.length ===
                0 ? (

                  <div className="text-center border rounded-lg p-8 text-gray-500">

                    <div className="text-3xl mb-2">
                      📄
                    </div>

                    <p>
                      No supporting
                      documents uploaded.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-3">

                    {attachments.map(
                      (file) => (
                        <div
                          key={
                            file.id
                          }
                          className="flex items-center justify-between border rounded-lg p-4"
                        >

                          <div className="flex items-center gap-3 min-w-0">

                            <div className="text-2xl">
                              📄
                            </div>

                            <div className="min-w-0">

                              <p className="font-medium truncate">
                                {
                                  file.file_name
                                }
                              </p>

                              <p className="text-xs text-gray-500">
                                {file.created_at
                                  ? new Date(
                                      file.created_at
                                    ).toLocaleString()
                                  : ""}
                              </p>

                            </div>

                          </div>

                          <div className="flex items-center gap-4 ml-4">

                            <a
                              href={
                                file.file_url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Open
                            </a>

                            <a
                              href={
                                file.file_url
                              }
                              download
                              className="text-green-600 hover:underline"
                            >
                              Download
                            </a>

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleAttachmentDelete(
                                    file.id,
                                    file.file_url
                                  )
                                }
                                className="text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            )}

                          </div>

                        </div>
                      )
                    )}

                  </div>

                )}

              </div>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}