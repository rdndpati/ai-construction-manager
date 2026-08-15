"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Project = {
  id: string;
  name: string;
};

type Requirement = {
  id: string;
  project_id: string;
  section_number: string | null;
  title: string | null;
  category: string | null;
  requirement: string | null;
  created_at?: string;
};

type SpecificationDocument = {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  uploaded_by: string | null;
  created_at: string;
};

type RequirementForm = {
  section_number: string;
  title: string;
  category: string;
  requirement: string;
};

const STORAGE_BUCKET = "specifications";

const CATEGORIES = [
  "General",
  "Civil",
  "Structural",
  "Electrical",
  "Mechanical",
  "Grounding",
  "Safety",
  "Fire Protection",
  "Environmental",
  "Other",
];

export default function SpecificationsPage() {
  // =========================================================
  // STATE
  // =========================================================

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");

  const [requirements, setRequirements] = useState<
    Requirement[]
  >([]);

  const [documents, setDocuments] = useState<
    SpecificationDocument[]
  >([]);

  const [loadingProjects, setLoadingProjects] =
    useState(true);

  const [loadingRequirements, setLoadingRequirements] =
    useState(false);

  const [loadingDocuments, setLoadingDocuments] =
    useState(false);

  const [uploading, setUploading] = useState(false);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [selectedRequirement, setSelectedRequirement] =
    useState<Requirement | null>(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] =
    useState<RequirementForm>({
      section_number: "",
      title: "",
      category: "General",
      requirement: "",
    });

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadProjects();
  }, []);

  // =========================================================
  // LOAD PROJECT DATA
  // =========================================================

  useEffect(() => {
    if (!selectedProject) {
      setRequirements([]);
      setDocuments([]);
      return;
    }

    loadRequirements();
    loadDocuments();
  }, [selectedProject]);

  // =========================================================
  // LOAD PROJECTS
  // =========================================================

  async function loadProjects() {
    setLoadingProjects(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "USER ERROR:",
          userError
        );

        alert(
          "Unable to verify your login."
        );

        return;
      }

      if (!user) {
        alert(
          "Please log in before using Specifications."
        );

        return;
      }

      // Get user's company
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "PROFILE ERROR:",
          profileError
        );

        alert(
          "Unable to load your company information."
        );

        return;
      }

      if (!profile?.company_id) {
        alert(
          "Your account is not associated with a company."
        );

        return;
      }

      // Get company projects
      const {
        data,
        error,
      } = await supabase
        .from("projects")
        .select("id, name")
        .eq(
          "company_id",
          profile.company_id
        )
        .order("name", {
          ascending: true,
        });

      if (error) {
        console.error(
          "PROJECT LOAD ERROR:",
          error
        );

        alert(
          "Unable to load projects."
        );

        return;
      }

      const projectList =
        data ?? [];

      setProjects(projectList);

      if (projectList.length > 0) {
        setSelectedProject(
          projectList[0].id
        );
      } else {
        setSelectedProject("");
      }
    } finally {
      setLoadingProjects(false);
    }
  }

  // =========================================================
  // LOAD REQUIREMENTS
  // =========================================================

  async function loadRequirements() {
    if (!selectedProject) return;

    setLoadingRequirements(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("specifications")
        .select("*")
        .eq(
          "project_id",
          selectedProject
        )
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        console.error(
          "REQUIREMENTS LOAD ERROR:",
          error
        );

        alert(
          `Unable to load requirements:\n\n${error.message}`
        );

        return;
      }

      setRequirements(data ?? []);
    } finally {
      setLoadingRequirements(false);
    }
  }

  // =========================================================
  // LOAD PDF DOCUMENTS
  // =========================================================

  async function loadDocuments() {
    if (!selectedProject) return;

    setLoadingDocuments(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from(
          "specification_documents"
        )
        .select("*")
        .eq(
          "project_id",
          selectedProject
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "DOCUMENT LOAD ERROR:",
          error
        );

        alert(
          `Unable to load specification PDFs:\n\n${error.message}`
        );

        return;
      }

      setDocuments(data ?? []);
    } finally {
      setLoadingDocuments(false);
    }
  }

  // =========================================================
  // FILTER REQUIREMENTS
  // =========================================================

  const filteredRequirements =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return requirements.filter(
        (item) => {
          const matchesSearch =
            !searchValue ||
            (
              item.section_number ??
              ""
            )
              .toLowerCase()
              .includes(searchValue) ||
            (
              item.title ??
              ""
            )
              .toLowerCase()
              .includes(searchValue) ||
            (
              item.category ??
              ""
            )
              .toLowerCase()
              .includes(searchValue) ||
            (
              item.requirement ??
              ""
            )
              .toLowerCase()
              .includes(searchValue);

          const matchesCategory =
            categoryFilter ===
              "All" ||
            (
              item.category ??
              "General"
            ) === categoryFilter;

          return (
            matchesSearch &&
            matchesCategory
          );
        }
      );
    }, [
      requirements,
      search,
      categoryFilter,
    ]);

  // =========================================================
  // CATEGORY COUNTS
  // =========================================================

  const categoryCounts =
    requirements.reduce(
      (
        counts: Record<
          string,
          number
        >,
        item
      ) => {
        const category =
          item.category ||
          "General";

        counts[category] =
          (counts[category] || 0) +
          1;

        return counts;
      },
      {}
    );

  // =========================================================
  // PROJECT NAME
  // =========================================================

  const selectedProjectName =
    projects.find(
      (project) =>
        project.id ===
        selectedProject
    )?.name ||
    "No Project Selected";

  // =========================================================
  // ADD REQUIREMENT
  // =========================================================

  function openAddModal() {
    if (!selectedProject) {
      alert(
        "Please select a project first."
      );

      return;
    }

    setForm({
      section_number: "",
      title: "",
      category: "General",
      requirement: "",
    });

    setShowAddModal(true);
  }

  async function handleCreateRequirement() {
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

    if (!form.requirement.trim()) {
      alert(
        "Please enter the requirement."
      );

      return;
    }

    setSaving(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("specifications")
        .insert({
          project_id:
            selectedProject,

          section_number:
            form.section_number.trim() ||
            null,

          title:
            form.title.trim(),

          category:
            form.category ||
            "General",

          requirement:
            form.requirement.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error(
          "CREATE REQUIREMENT ERROR:",
          error
        );

        alert(
          `Failed to create requirement:\n\n${error.message}`
        );

        return;
      }

      if (data) {
        setRequirements(
          (previous) => [
            ...previous,
            data,
          ]
        );
      }

      setShowAddModal(false);

      alert(
        "Requirement created successfully."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // VIEW REQUIREMENT
  // =========================================================

  function openViewModal(
    requirement: Requirement
  ) {
    setSelectedRequirement(
      requirement
    );

    setShowViewModal(true);
  }

  // =========================================================
  // EDIT REQUIREMENT
  // =========================================================

  function openEditModal(
    requirement: Requirement
  ) {
    setSelectedRequirement(
      requirement
    );

    setForm({
      section_number:
        requirement.section_number ??
        "",

      title:
        requirement.title ??
        "",

      category:
        requirement.category ??
        "General",

      requirement:
        requirement.requirement ??
        "",
    });

    setShowEditModal(true);
  }

  async function handleUpdateRequirement() {
    if (!selectedRequirement) {
      return;
    }

    if (!form.title.trim()) {
      alert(
        "Please enter a title."
      );

      return;
    }

    if (!form.requirement.trim()) {
      alert(
        "Please enter the requirement."
      );

      return;
    }

    setSaving(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("specifications")
        .update({
          section_number:
            form.section_number.trim() ||
            null,

          title:
            form.title.trim(),

          category:
            form.category ||
            "General",

          requirement:
            form.requirement.trim(),
        })
        .eq(
          "id",
          selectedRequirement.id
        )
        .select()
        .single();

      if (error) {
        console.error(
          "UPDATE REQUIREMENT ERROR:",
          error
        );

        alert(
          `Failed to update requirement:\n\n${error.message}`
        );

        return;
      }

      if (data) {
        setRequirements(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                data.id
                  ? data
                  : item
            )
        );

        setSelectedRequirement(
          data
        );
      }

      setShowEditModal(false);

      alert(
        "Requirement updated successfully."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // DELETE REQUIREMENT
  // =========================================================

  async function handleDeleteRequirement(
    requirement: Requirement
  ) {
    const confirmed =
      window.confirm(
        `Delete "${requirement.title || "this requirement"}"?\n\nThis cannot be undone.`
      );

    if (!confirmed) return;

    const {
      error,
    } = await supabase
      .from("specifications")
      .delete()
      .eq(
        "id",
        requirement.id
      );

    if (error) {
      console.error(
        "DELETE REQUIREMENT ERROR:",
        error
      );

      alert(
        `Failed to delete requirement:\n\n${error.message}`
      );

      return;
    }

    setRequirements(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !==
            requirement.id
        )
    );

    alert(
      "Requirement deleted."
    );
  }

  // =========================================================
  // UPLOAD SPECIFICATION PDF
  // =========================================================

  async function uploadSpecification(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!selectedProject) {
      alert(
        "Please select a project first."
      );

      event.target.value = "";

      return;
    }

    if (
      file.type !==
        "application/pdf" &&
      !file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      alert(
        "Please upload a PDF file."
      );

      event.target.value = "";

      return;
    }

    setUploading(true);

    try {
      // -------------------------------------------------------
      // CHECK LOGIN
      // -------------------------------------------------------

      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        throw new Error(
          "You are not logged in. Please log in again."
        );
      }

      console.log(
        "Logged in user:",
        user.id
      );

      console.log(
        "Selected project:",
        selectedProject
      );

      // -------------------------------------------------------
      // SAFE FILE NAME
      // -------------------------------------------------------

      const safeFileName =
        file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

      const filePath =
        `${selectedProject}/${Date.now()}-${safeFileName}`;

      console.log(
        "Uploading PDF:",
        filePath
      );

      // -------------------------------------------------------
      // UPLOAD TO STORAGE
      // -------------------------------------------------------

      const {
        data: uploadData,
        error: uploadError,
      } =
        await supabase.storage
          .from(
            STORAGE_BUCKET
          )
          .upload(
            filePath,
            file,
            {
              cacheControl:
                "3600",

              upsert:
                false,

              contentType:
                "application/pdf",
            }
          );

      console.log(
        "Storage upload result:",
        uploadData
      );

      if (uploadError) {
        console.error(
          "STORAGE RLS / UPLOAD ERROR:",
          uploadError
        );

        throw new Error(
          `Storage upload failed: ${uploadError.message}`
        );
      }

      // -------------------------------------------------------
      // GET PUBLIC URL
      // -------------------------------------------------------

      const {
        data:
          publicUrlData,
      } =
        supabase.storage
          .from(
            STORAGE_BUCKET
          )
          .getPublicUrl(
            filePath
          );

      const fileUrl =
        publicUrlData.publicUrl;

      console.log(
        "PDF URL:",
        fileUrl
      );

      // -------------------------------------------------------
      // SAVE DATABASE RECORD
      // -------------------------------------------------------

      const {
        data:
          documentData,
        error:
          documentError,
      } =
        await supabase
          .from(
            "specification_documents"
          )
          .insert({
            project_id:
              selectedProject,

            file_name:
              file.name,

            file_path:
              filePath,

            file_url:
              fileUrl,

            uploaded_by:
              user.id,
          })
          .select()
          .single();

      if (documentError) {
        console.error(
          "DATABASE RLS ERROR:",
          documentError
        );

        // Remove uploaded PDF
        // because database record failed
        await supabase.storage
          .from(
            STORAGE_BUCKET
          )
          .remove([
            filePath,
          ]);

        throw new Error(
          `Database record failed: ${documentError.message}`
        );
      }

      console.log(
        "Document record:",
        documentData
      );

      if (documentData) {
        setDocuments(
          (previous) => [
            documentData,
            ...previous,
          ]
        );
      }

      alert(
        "Specification PDF uploaded successfully."
      );
    } catch (error: any) {
      console.error(
        "SPECIFICATION PDF ERROR:",
        error
      );

      alert(
        error?.message ||
          "Specification PDF upload failed."
      );
    } finally {
      setUploading(false);

      event.target.value = "";
    }
  }

  // =========================================================
  // DOWNLOAD PDF
  // =========================================================

  async function downloadDocument(
    document: SpecificationDocument
  ) {
    try {
      const {
        data,
        error,
      } =
        await supabase.storage
          .from(
            STORAGE_BUCKET
          )
          .download(
            document.file_path
          );

      if (error) {
        console.error(
          "DOWNLOAD ERROR:",
          error
        );

        alert(
          `Download failed:\n\n${error.message}`
        );

        return;
      }

      if (!data) {
        alert(
          "The PDF could not be downloaded."
        );

        return;
      }

      const blobUrl =
        window.URL.createObjectURL(
          data
        );

      const link =
        window.document.createElement(
          "a"
        );

      link.href =
        blobUrl;

      link.download =
        document.file_name;

      window.document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        blobUrl
      );
    } catch (error) {
      console.error(
        "DOWNLOAD ERROR:",
        error
      );

      alert(
        "Unable to download PDF."
      );
    }
  }

  // =========================================================
  // DELETE PDF
  // =========================================================

  async function deleteDocument(
    document: SpecificationDocument
  ) {
    const confirmed =
      window.confirm(
        `Delete "${document.file_name}"?\n\nThis will permanently delete the PDF.`
      );

    if (!confirmed) {
      return;
    }

    try {
      // Delete Storage file
      const {
        error:
          storageError,
      } =
        await supabase.storage
          .from(
            STORAGE_BUCKET
          )
          .remove([
            document.file_path,
          ]);

      if (storageError) {
        console.error(
          "STORAGE DELETE ERROR:",
          storageError
        );

        alert(
          `Unable to delete PDF:\n\n${storageError.message}`
        );

        return;
      }

      // Delete database record
      const {
        error:
          databaseError,
      } =
        await supabase
          .from(
            "specification_documents"
          )
          .delete()
          .eq(
            "id",
            document.id
          );

      if (databaseError) {
        console.error(
          "DATABASE DELETE ERROR:",
          databaseError
        );

        alert(
          `PDF removed from Storage, but database record could not be deleted:\n\n${databaseError.message}`
        );

        return;
      }

      setDocuments(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              document.id
          )
      );

      alert(
        "Specification PDF deleted successfully."
      );
    } catch (error) {
      console.error(
        "DELETE PDF ERROR:",
        error
      );

      alert(
        "Unable to delete specification PDF."
      );
    }
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================

  function formatDate(
    dateString: string
  ) {
    return new Date(
      dateString
    ).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

  // =========================================================
  // RESET
  // =========================================================

  function resetFilters() {
    setSearch("");
    setCategoryFilter("All");
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">

          <div>

            <div className="flex items-center gap-3">

              <span className="text-3xl">
                📚
              </span>

              <h1 className="text-3xl font-bold text-gray-900">
                Project Specifications
              </h1>

            </div>

            <p className="text-gray-500 mt-2">
              Manage technical requirements,
              standards, and project
              specification documents.
            </p>

          </div>

          {/* PROJECT */}

          <div className="w-full lg:w-80">

            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              disabled={
                loadingProjects ||
                projects.length ===
                  0
              }
              className="w-full border border-gray-300 rounded-lg bg-white px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >

              {projects.length ===
              0 ? (
                <option value="">
                  No projects available
                </option>
              ) : (
                projects.map(
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
                )
              )}

            </select>

          </div>

        </div>

        {/* ACTIONS */}

        <div className="bg-white border rounded-xl shadow-sm p-4 mb-6">

          <div className="flex flex-wrap gap-3">

            <button
              onClick={
                openAddModal
              }
              disabled={
                !selectedProject
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-5 py-2.5 rounded-lg font-semibold"
            >
              + Add Requirement
            </button>

            <label
              className={`px-5 py-2.5 rounded-lg font-semibold ${
                uploading ||
                !selectedProject
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              }`}
            >

              {uploading
                ? "Uploading..."
                : "📄 Upload Specification PDF"}

              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={
                  uploadSpecification
                }
                disabled={
                  uploading ||
                  !selectedProject
                }
              />

            </label>

            <button
              onClick={() => {
                loadRequirements();
                loadDocuments();
              }}
              disabled={
                !selectedProject
              }
              className="px-5 py-2.5 border rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              ↻ Refresh
            </button>

          </div>

        </div>

        {/* PROJECT INFO */}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">

          <div className="flex gap-3">

            <span className="text-xl">
              ℹ️
            </span>

            <div>

              <h2 className="font-bold">
                {
                  selectedProjectName
                }
              </h2>

              <p className="text-sm text-gray-600 mt-1">
                Technical requirements
                and specification
                documents for this
                project.
              </p>

            </div>

          </div>

        </div>

        {/* KPI */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Requirements
            </p>

            <p className="text-3xl font-bold mt-2">
              {
                requirements.length
              }
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Electrical
            </p>

            <p className="text-3xl font-bold mt-2">
              {
                categoryCounts[
                  "Electrical"
                ] || 0
              }
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Civil
            </p>

            <p className="text-3xl font-bold mt-2">
              {
                categoryCounts[
                  "Civil"
                ] || 0
              }
            </p>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Safety
            </p>

            <p className="text-3xl font-bold mt-2">
              {
                categoryCounts[
                  "Safety"
                ] || 0
              }
            </p>
          </div>

        </div>

        {/* SEARCH */}

        <div className="bg-white border rounded-xl shadow-sm p-4 mb-6">

          <div className="flex flex-col md:flex-row gap-3">

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search section, title, category, or requirement..."
              className="flex-1 border rounded-lg px-4 py-3"
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
              className="border rounded-lg px-4 py-3 bg-white"
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

            <button
              onClick={
                resetFilters
              }
              className="border rounded-lg px-5 py-3 hover:bg-gray-50"
            >
              Reset
            </button>

          </div>

          <p className="text-sm text-gray-500 mt-3">
            Showing{" "}
            {
              filteredRequirements.length
            }{" "}
            of{" "}
            {
              requirements.length
            }{" "}
            requirements
          </p>

        </div>

        {/* REQUIREMENTS TABLE */}

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

          <div className="px-5 py-4 border-b">

            <h2 className="font-bold text-lg">
              Specification Requirements
            </h2>

            <p className="text-sm text-gray-500">
              {
                selectedProjectName
              }
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50 border-b">

                <tr className="text-left">

                  <th className="px-5 py-4">
                    Section
                  </th>

                  <th className="px-5 py-4">
                    Title
                  </th>

                  <th className="px-5 py-4">
                    Category
                  </th>

                  <th className="px-5 py-4 min-w-[400px]">
                    Requirement
                  </th>

                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {loadingRequirements ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-10 text-center text-gray-500"
                    >
                      Loading requirements...
                    </td>
                  </tr>
                ) : filteredRequirements.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-10 text-center text-gray-500"
                    >
                      No specification
                      requirements found.
                    </td>
                  </tr>
                ) : (
                  filteredRequirements.map(
                    (item) => (
                      <tr
                        key={
                          item.id
                        }
                        className="border-b hover:bg-gray-50"
                      >

                        <td className="px-5 py-4">
                          {
                            item.section_number ||
                            "—"
                          }
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {
                            item.title ||
                            "Untitled"
                          }
                        </td>

                        <td className="px-5 py-4">

                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            {
                              item.category ||
                              "General"
                            }
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <p className="line-clamp-3 text-gray-700">
                            {
                              item.requirement ||
                              "No requirement."
                            }
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              onClick={() =>
                                openViewModal(
                                  item
                                )
                              }
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm"
                            >
                              View
                            </button>

                            <button
                              onClick={() =>
                                openEditModal(
                                  item
                                )
                              }
                              className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-sm"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                handleDeleteRequirement(
                                  item
                                )
                              }
                              className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* =====================================================
            PDF DOCUMENTS
        ===================================================== */}

        <div className="bg-white rounded-xl shadow-sm border mt-8 overflow-hidden">

          <div className="px-5 py-5 border-b">

            <div className="flex justify-between items-center">

              <div>

                <h2 className="text-xl font-bold">
                  📄 Specification Documents
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  PDFs uploaded for{" "}
                  {
                    selectedProjectName
                  }
                </p>

              </div>

              <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-semibold">
                {
                  documents.length
                }{" "}
                {documents.length ===
                1
                  ? "PDF"
                  : "PDFs"}
              </span>

            </div>

          </div>

          {loadingDocuments ? (
            <div className="p-10 text-center text-gray-500">
              Loading PDFs...
            </div>
          ) : documents.length ===
            0 ? (
            <div className="p-10 text-center">

              <div className="text-5xl mb-3">
                📄
              </div>

              <p className="font-semibold">
                No specification PDFs uploaded
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Upload your first PDF
                using the button above.
              </p>

            </div>
          ) : (
            <div className="divide-y">

              {documents.map(
                (document) => (
                  <div
                    key={
                      document.id
                    }
                    className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:bg-gray-50"
                  >

                    <div className="flex items-center gap-4">

                      <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-2xl">
                        📄
                      </div>

                      <div>

                        <p className="font-semibold">
                          {
                            document.file_name
                          }
                        </p>

                        <p className="text-sm text-gray-500">
                          Uploaded{" "}
                          {
                            document.created_at
                              ? formatDate(
                                  document.created_at
                                )
                              : "Recently"
                          }
                        </p>

                      </div>

                    </div>

                    <div className="flex flex-wrap gap-2">

                      {/* VIEW */}

                      <a
                        href={
                          document.file_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-sm"
                      >
                        👁 View
                      </a>

                      {/* DOWNLOAD */}

                      <button
                        onClick={() =>
                          downloadDocument(
                            document
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium text-sm"
                      >
                        ⬇ Download
                      </button>

                      {/* DELETE */}

                      <button
                        onClick={() =>
                          deleteDocument(
                            document
                          )
                        }
                        className="px-4 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium text-sm"
                      >
                        🗑 Delete
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

      </div>

      {/* =====================================================
          ADD MODAL
      ===================================================== */}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">

            <div className="p-6 border-b flex justify-between">

              <div>

                <h2 className="text-xl font-bold">
                  Add Specification Requirement
                </h2>

                <p className="text-sm text-gray-500">
                  {
                    selectedProjectName
                  }
                </p>

              </div>

              <button
                onClick={() =>
                  setShowAddModal(
                    false
                  )
                }
                className="text-gray-500 text-xl"
              >
                ✕
              </button>

            </div>

            <div className="p-6 space-y-5">

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Section Number
                  </label>

                  <input
                    value={
                      form.section_number
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        section_number:
                          e.target.value,
                      })
                    }
                    placeholder="Example: 26 05 00"
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
                          {
                            category
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Title *
                </label>

                <input
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
                  placeholder="Example: Grounding & Bonding"
                  className="w-full border rounded-lg px-4 py-3"
                />

              </div>

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Requirement *
                </label>

                <textarea
                  value={
                    form.requirement
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      requirement:
                        e.target.value,
                    })
                  }
                  rows={7}
                  placeholder="Enter the technical requirement..."
                  className="w-full border rounded-lg px-4 py-3"
                />

              </div>

            </div>

            <div className="p-6 border-t flex justify-end gap-3">

              <button
                onClick={() =>
                  setShowAddModal(
                    false
                  )
                }
                className="px-5 py-2.5 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={
                  handleCreateRequirement
                }
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {saving
                  ? "Creating..."
                  : "Create Requirement"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      {showViewModal &&
        selectedRequirement && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl">

              <div className="p-6 border-b flex justify-between">

                <div>

                  <p className="text-sm text-gray-500">
                    {
                      selectedProjectName
                    }
                  </p>

                  <h2 className="text-2xl font-bold">
                    {
                      selectedRequirement.title
                    }
                  </h2>

                </div>

                <button
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                  className="text-xl text-gray-500"
                >
                  ✕
                </button>

              </div>

              <div className="p-6">

                <div className="grid grid-cols-2 gap-4 mb-6">

                  <div className="bg-gray-50 p-4 rounded-lg">

                    <p className="text-sm text-gray-500">
                      Section
                    </p>

                    <p className="font-semibold">
                      {
                        selectedRequirement.section_number ||
                        "Not specified"
                      }
                    </p>

                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">

                    <p className="text-sm text-gray-500">
                      Category
                    </p>

                    <p className="font-semibold">
                      {
                        selectedRequirement.category ||
                        "General"
                      }
                    </p>

                  </div>

                </div>

                <h3 className="font-bold text-lg mb-3">
                  Requirement
                </h3>

                <div className="bg-gray-50 border rounded-xl p-5 whitespace-pre-wrap leading-7">
                  {
                    selectedRequirement.requirement ||
                    "No requirement."
                  }
                </div>

              </div>

              <div className="p-6 border-t flex justify-end gap-3">

                <button
                  onClick={() => {
                    setShowViewModal(
                      false
                    );

                    openEditModal(
                      selectedRequirement
                    );
                  }}
                  className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg"
                >
                  ✏️ Edit
                </button>

                <button
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                  className="px-5 py-2.5 border rounded-lg"
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}

      {/* =====================================================
          EDIT MODAL
      ===================================================== */}

      {showEditModal &&
        selectedRequirement && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">

              <div className="p-6 border-b flex justify-between">

                <div>

                  <h2 className="text-xl font-bold">
                    Edit Specification
                  </h2>

                  <p className="text-sm text-gray-500">
                    {
                      selectedProjectName
                    }
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowEditModal(
                      false
                    )
                  }
                  className="text-xl text-gray-500"
                >
                  ✕
                </button>

              </div>

              <div className="p-6 space-y-5">

                <div className="grid grid-cols-2 gap-4">

                  <input
                    value={
                      form.section_number
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        section_number:
                          e.target.value,
                      })
                    }
                    placeholder="Section Number"
                    className="border rounded-lg px-4 py-3"
                  />

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
                    className="border rounded-lg px-4 py-3 bg-white"
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
                          {
                            category
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

                <input
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
                  placeholder="Title"
                  className="w-full border rounded-lg px-4 py-3"
                />

                <textarea
                  value={
                    form.requirement
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      requirement:
                        e.target.value,
                    })
                  }
                  rows={8}
                  placeholder="Requirement"
                  className="w-full border rounded-lg px-4 py-3"
                />

              </div>

              <div className="p-6 border-t flex justify-end gap-3">

                <button
                  onClick={() =>
                    setShowEditModal(
                      false
                    )
                  }
                  className="px-5 py-2.5 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleUpdateRequirement
                  }
                  disabled={saving}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>

          </div>
        )}

    </main>
  );
}