"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";

type Project = {
  id: string;
  name: string;
};

type RFI = {
  id: string;
  project_id: string;
  rfi_number: string | null;
  title: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  question: string | null;
  description: string | null;
  response: string | null;
  drawing_id: string | null;
  markup_id: string | null;
  created_at: string | null;

  // New RFI workflow fields
  submitted_by_name: string | null;
  submitted_to_name: string | null;
  ball_in_court_name: string | null;
  ball_in_court_role: string | null;
};

export default function RFIsPage() {
  const router = useRouter();

  // =========================================================
  // DATA
  // =========================================================

  const [rfis, setRFIs] = useState<RFI[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =========================================================
  // FILTERS
  // =========================================================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [ballInCourtFilter, setBallInCourtFilter] = useState("All");

  const [selectedProject, setSelectedProject] =
    useState<string>("");

  // =========================================================
  // PDF
  // =========================================================

  const [downloadingId, setDownloadingId] =
    useState<string | null>(null);

  // =========================================================
  // LOAD
  // =========================================================

  useEffect(() => {
    loadRFIs();
  }, []);

  // =========================================================
  // LOAD RFIs BASED ON USER PROJECT ACCESS
  // =========================================================

  async function loadRFIs() {
    try {
      setLoading(true);

      // -----------------------------------------------------
      // CURRENT USER
      // -----------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("USER ERROR:", userError);

        setProjects([]);
        setRFIs([]);
        return;
      }

      // -----------------------------------------------------
      // USER PROFILE
      // -----------------------------------------------------

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(`
          company_id,
          is_owner,
          roles (
            name
          )
        `)
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error(
          "PROFILE ERROR:",
          profileError
        );

        setProjects([]);
        setRFIs([]);
        return;
      }

      if (!profile.company_id) {
        console.error(
          "USER HAS NO COMPANY:",
          user.id
        );

        setProjects([]);
        setRFIs([]);
        return;
      }

      // -----------------------------------------------------
      // ROLE
      // -----------------------------------------------------

      const roleData = profile.roles as
        | { name: string }
        | { name: string }[]
        | null;

      const roleName = Array.isArray(roleData)
        ? roleData[0]?.name ?? null
        : roleData?.name ?? null;

      const isOwner =
        profile.is_owner === true;

      const isAdmin =
        roleName === "Admin";

      const hasFullAccess =
        isOwner || isAdmin;

      // -----------------------------------------------------
      // PROJECTS
      // -----------------------------------------------------

      let projectData: Project[] = [];

      if (hasFullAccess) {
        const {
          data,
          error: projectError,
        } = await supabase
          .from("projects")
          .select("id,name")
          .eq(
            "company_id",
            profile.company_id
          )
          .order("name");

        if (projectError) {
          console.error(
            "PROJECT ERROR:",
            projectError
          );

          setProjects([]);
          setRFIs([]);
          return;
        }

        projectData =
          (data as Project[]) ?? [];
      } else {
        // ---------------------------------------------------
        // TEAM MEMBER PROJECT ACCESS
        // ---------------------------------------------------

        const {
          data: memberships,
          error: membershipError,
        } = await supabase
          .from("project_members")
          .select("project_id")
          .eq(
            "profile_id",
            user.id
          );

        if (membershipError) {
          console.error(
            "PROJECT MEMBERS ERROR:",
            membershipError
          );

          setProjects([]);
          setRFIs([]);
          return;
        }

        const assignedProjectIds =
          (memberships ?? [])
            .map(
              (member) =>
                member.project_id
            )
            .filter(Boolean);

        if (
          assignedProjectIds.length === 0
        ) {
          setProjects([]);
          setRFIs([]);
          setSelectedProject("");
          return;
        }

        const {
          data,
          error: projectError,
        } = await supabase
          .from("projects")
          .select("id,name")
          .eq(
            "company_id",
            profile.company_id
          )
          .in(
            "id",
            assignedProjectIds
          )
          .order("name");

        if (projectError) {
          console.error(
            "ASSIGNED PROJECT ERROR:",
            projectError
          );

          setProjects([]);
          setRFIs([]);
          return;
        }

        projectData =
          (data as Project[]) ?? [];
      }

      // -----------------------------------------------------
      // NO PROJECTS
      // -----------------------------------------------------

      if (
        projectData.length === 0
      ) {
        setProjects([]);
        setRFIs([]);
        setSelectedProject("");
        return;
      }

      // -----------------------------------------------------
      // PROJECT IDS
      // -----------------------------------------------------

      const projectIds =
        projectData.map(
          (project) =>
            project.id
        );

      // -----------------------------------------------------
      // LOAD RFIs
      // -----------------------------------------------------

      const {
        data: rfiData,
        error: rfiError,
      } = await supabase
        .from("rfis")
        .select("*")
        .in(
          "project_id",
          projectIds
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (rfiError) {
        console.error(
          "RFI ERROR:",
          rfiError
        );

        setRFIs([]);
      } else {
        setRFIs(
          (rfiData as RFI[]) ?? []
        );
      }

      setProjects(projectData);

      // Keep current project if still available
      setSelectedProject(
        (current) => {
          const exists =
            projectData.some(
              (project) =>
                project.id === current
            );

          return exists
            ? current
            : projectData[0]?.id ?? "";
        }
      );
    } catch (error) {
      console.error(
        "RFI MANAGEMENT ERROR:",
        error
      );

      setProjects([]);
      setRFIs([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // REFRESH
  // =========================================================

  async function refreshRFIs() {
    try {
      setRefreshing(true);
      await loadRFIs();
    } finally {
      setRefreshing(false);
    }
  }

  // =========================================================
  // PROJECT NAME
  // =========================================================

  function getProjectName(
    projectId: string
  ) {
    return (
      projects.find(
        (project) =>
          project.id === projectId
      )?.name ??
      "Construction Project"
    );
  }

  // =========================================================
  // OPEN RFI
  // =========================================================

  function openRFI(rfi: RFI) {
    router.push(
      `/app/projects/${rfi.project_id}/rfis/${rfi.id}`
    );
  }

  // =========================================================
  // DATE HELPERS
  // =========================================================

  function getTodayStart() {
    const date = new Date();

    date.setHours(
      0,
      0,
      0,
      0
    );

    return date;
  }

  function getDueDate(
    dueDate: string | null
  ) {
    if (!dueDate) {
      return null;
    }

    const date =
      new Date(dueDate);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    date.setHours(
      0,
      0,
      0,
      0
    );

    return date;
  }

  // =========================================================
  // OVERDUE
  // =========================================================

  function isOverdue(
    rfi: RFI
  ) {
    if (
      rfi.status === "Closed"
    ) {
      return false;
    }

    const dueDate =
      getDueDate(
        rfi.due_date
      );

    if (!dueDate) {
      return false;
    }

    return (
      dueDate <
      getTodayStart()
    );
  }

  // =========================================================
  // DAYS INFORMATION
  // =========================================================

  function getDaysText(
    rfi: RFI
  ) {
    if (!rfi.due_date) {
      return "No due date";
    }

    const dueDate =
      getDueDate(
        rfi.due_date
      );

    if (!dueDate) {
      return "No due date";
    }

    const today =
      getTodayStart();

    const difference =
      dueDate.getTime() -
      today.getTime();

    const days = Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );

    if (
      rfi.status !== "Closed" &&
      days < 0
    ) {
      const overdueDays =
        Math.abs(days);

      return `${overdueDays} day${
        overdueDays === 1
          ? ""
          : "s"
      } overdue`;
    }

    if (days === 0) {
      return "Due today";
    }

    if (days === 1) {
      return "Due tomorrow";
    }

    return `${days} days remaining`;
  }

  // =========================================================
  // STATUS CLASS
  // =========================================================

  function getStatusClass(
    status: string | null
  ) {
    switch (status) {
      case "Closed":
        return "bg-green-100 text-green-700";

      case "In Review":
        return "bg-purple-100 text-purple-700";

      case "Answered":
        return "bg-teal-100 text-teal-700";

      case "Draft":
        return "bg-gray-100 text-gray-700";

      case "Open":
      default:
        return "bg-blue-100 text-blue-700";
    }
  }

  // =========================================================
  // PRIORITY CLASS
  // =========================================================

  function getPriorityClass(
    priority: string | null
  ) {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-700";

      case "High":
        return "bg-orange-100 text-orange-700";

      case "Medium":
        return "bg-yellow-100 text-yellow-700";

      case "Low":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  // =========================================================
  // BALL IN COURT CLASS
  // =========================================================

  function getBallCourtClass(
    rfi: RFI
  ) {
    if (
      rfi.status === "Closed"
    ) {
      return "bg-green-100 text-green-700";
    }

    if (
      rfi.ball_in_court_role
        ?.toLowerCase()
        .includes("engineer")
    ) {
      return "bg-purple-100 text-purple-700";
    }

    if (
      rfi.ball_in_court_role
        ?.toLowerCase()
        .includes("owner")
    ) {
      return "bg-orange-100 text-orange-700";
    }

    return "bg-blue-100 text-blue-700";
  }

  // =========================================================
  // FILTERED RFIs
  // =========================================================

  const filteredRFIs =
    useMemo(() => {
      return rfis.filter(
        (rfi) => {
          const matchesProject =
            selectedProject === "" ||
            rfi.project_id ===
              selectedProject;

          const searchText =
            search
              .trim()
              .toLowerCase();

          const matchesSearch =
            searchText === "" ||
            rfi.rfi_number
              ?.toLowerCase()
              .includes(searchText) ||
            rfi.title
              ?.toLowerCase()
              .includes(searchText) ||
            rfi.submitted_by_name
              ?.toLowerCase()
              .includes(searchText) ||
            rfi.submitted_to_name
              ?.toLowerCase()
              .includes(searchText) ||
            rfi.ball_in_court_name
              ?.toLowerCase()
              .includes(searchText);

          const matchesStatus =
            statusFilter === "All" ||
            rfi.status ===
              statusFilter;

          const matchesPriority =
            priorityFilter === "All" ||
            rfi.priority ===
              priorityFilter;

          const matchesBallCourt =
            ballInCourtFilter ===
              "All" ||
            rfi.ball_in_court_role ===
              ballInCourtFilter;

          return (
            matchesProject &&
            matchesSearch &&
            matchesStatus &&
            matchesPriority &&
            matchesBallCourt
          );
        }
      );
    }, [
      rfis,
      selectedProject,
      search,
      statusFilter,
      priorityFilter,
      ballInCourtFilter,
    ]);

  // =========================================================
  // CURRENT PROJECT RFIs
  // =========================================================

  const projectRFIs =
    useMemo(() => {
      return rfis.filter(
        (rfi) =>
          selectedProject === "" ||
          rfi.project_id ===
            selectedProject
      );
    }, [
      rfis,
      selectedProject,
    ]);

  // =========================================================
  // KPI
  // =========================================================

  const totalRFIs =
    projectRFIs.length;

  const openRFIs =
    projectRFIs.filter(
      (rfi) =>
        rfi.status === "Open"
    ).length;

  const reviewRFIs =
    projectRFIs.filter(
      (rfi) =>
        rfi.status ===
        "In Review"
    ).length;

  const closedRFIs =
    projectRFIs.filter(
      (rfi) =>
        rfi.status === "Closed"
    ).length;

  const overdueRFIs =
    projectRFIs.filter(
      (rfi) =>
        isOverdue(rfi)
    ).length;

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setBallInCourtFilter("All");
  }

  // =========================================================
  // DOWNLOAD RFI PDF
  // =========================================================

  async function downloadRFI(
    rfi: RFI
  ) {
    try {
      setDownloadingId(rfi.id);

      const projectName =
        getProjectName(
          rfi.project_id
        );

      const doc =
        new jsPDF();

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const pageHeight =
        doc.internal.pageSize.getHeight();

      const margin = 20;

      const contentWidth =
        pageWidth -
        margin * 2;

      let y = 20;

      // -----------------------------------------------------
      // HEADER
      // -----------------------------------------------------

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(18);

      doc.text(
        "AI CONSTRUCTION MANAGER",
        margin,
        y
      );

      y += 10;

      doc.setFontSize(11);

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.text(
        "REQUEST FOR INFORMATION",
        margin,
        y
      );

      y += 8;

      doc.line(
        margin,
        y,
        pageWidth - margin,
        y
      );

      y += 15;

      // -----------------------------------------------------
      // RFI NUMBER
      // -----------------------------------------------------

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(16);

      doc.text(
        rfi.rfi_number ||
          "RFI",
        margin,
        y
      );

      y += 12;

      // -----------------------------------------------------
      // PROJECT
      // -----------------------------------------------------

      doc.setFontSize(10);

      doc.text(
        "PROJECT INFORMATION",
        margin,
        y
      );

      y += 7;

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.text(
        `Project: ${projectName}`,
        margin,
        y
      );

      y += 6;

      doc.text(
        `RFI Number: ${
          rfi.rfi_number ||
          "—"
        }`,
        margin,
        y
      );

      y += 6;

      doc.text(
        `Created: ${
          rfi.created_at
            ? new Date(
                rfi.created_at
              ).toLocaleDateString()
            : "—"
        }`,
        margin,
        y
      );

      y += 12;

      // -----------------------------------------------------
      // STATUS
      // -----------------------------------------------------

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "STATUS",
        margin,
        y
      );

      doc.text(
        "PRIORITY",
        margin + 55,
        y
      );

      doc.text(
        "DUE DATE",
        margin + 110,
        y
      );

      y += 7;

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.text(
        rfi.status ||
          "Open",
        margin,
        y
      );

      doc.text(
        rfi.priority ||
          "Medium",
        margin + 55,
        y
      );

      doc.text(
        rfi.due_date ||
          "—",
        margin + 110,
        y
      );

      y += 15;

      // -----------------------------------------------------
      // RFI ROUTING
      // -----------------------------------------------------

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "RFI ROUTING",
        margin,
        y
      );

      y += 7;

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.text(
        `Submitted By: ${
          rfi.submitted_by_name ||
          "Not specified"
        }`,
        margin,
        y
      );

      y += 6;

      doc.text(
        `Sent To: ${
          rfi.submitted_to_name ||
          "Not specified"
        }`,
        margin,
        y
      );

      y += 6;

      doc.text(
        `Ball in Court: ${
          rfi.ball_in_court_name ||
          "Not assigned"
        }`,
        margin,
        y
      );

      y += 6;

      doc.text(
        `Ball in Court Role: ${
          rfi.ball_in_court_role ||
          "Not specified"
        }`,
        margin,
        y
      );

      y += 15;

      // -----------------------------------------------------
      // SUBJECT
      // -----------------------------------------------------

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "SUBJECT",
        margin,
        y
      );

      y += 7;

      doc.setFont(
        "helvetica",
        "normal"
      );

      const subjectLines =
        doc.splitTextToSize(
          rfi.title ||
            "No subject provided",
          contentWidth
        );

      doc.text(
        subjectLines,
        margin,
        y
      );

      y +=
        subjectLines.length *
          6 +
        10;

      // -----------------------------------------------------
      // QUESTION
      // -----------------------------------------------------

      if (
        y >
        pageHeight - 60
      ) {
        doc.addPage();
        y = 20;
      }

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "QUESTION / INFORMATION REQUESTED",
        margin,
        y
      );

      y += 7;

      doc.setFont(
        "helvetica",
        "normal"
      );

      const questionText =
        rfi.question ||
        rfi.description ||
        "No question provided.";

      const questionLines =
        doc.splitTextToSize(
          questionText,
          contentWidth
        );

      doc.text(
        questionLines,
        margin,
        y
      );

      y +=
        questionLines.length *
          6 +
        12;

      // -----------------------------------------------------
      // RESPONSE
      // -----------------------------------------------------

      if (
        y >
        pageHeight - 60
      ) {
        doc.addPage();
        y = 20;
      }

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "RESPONSE",
        margin,
        y
      );

      y += 7;

      doc.setFont(
        "helvetica",
        "normal"
      );

      const responseText =
        rfi.response ||
        "No response has been provided.";

      const responseLines =
        doc.splitTextToSize(
          responseText,
          contentWidth
        );

      doc.text(
        responseLines,
        margin,
        y
      );

      y +=
        responseLines.length *
          6 +
        12;

      // -----------------------------------------------------
      // DRAWING / MARKUP
      // -----------------------------------------------------

      if (
        y >
        pageHeight - 50
      ) {
        doc.addPage();
        y = 20;
      }

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "DRAWING / MARKUP",
        margin,
        y
      );

      y += 7;

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.text(
        `Drawing: ${
          rfi.drawing_id ||
          "Not linked"
        }`,
        margin,
        y
      );

      y += 6;

      doc.text(
        `Markup: ${
          rfi.markup_id ||
          "Not linked"
        }`,
        margin,
        y
      );

      // -----------------------------------------------------
      // FOOTER
      // -----------------------------------------------------

      const totalPages =
        doc.getNumberOfPages();

      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        doc.setPage(i);

        doc.setFontSize(8);

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.text(
          "Generated by AI Construction Manager",
          margin,
          pageHeight - 10
        );

        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth -
            margin -
            25,
          pageHeight - 10
        );
      }

      // -----------------------------------------------------
      // FILE NAME
      // -----------------------------------------------------

      const safeTitle =
        (
          rfi.title ||
          "RFI"
        )
          .replace(
            /[^a-z0-9]+/gi,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          );

      const fileName =
        `${
          rfi.rfi_number ||
          "RFI"
        }-${
          safeTitle ||
          "Document"
        }.pdf`;

      doc.save(
        fileName
      );
    } catch (error) {
      console.error(
        "RFI PDF DOWNLOAD ERROR:",
        error
      );

      alert(
        "Unable to generate the RFI PDF."
      );
    } finally {
      setDownloadingId(null);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border rounded-xl p-8">
            Loading RFI Management...
          </div>
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
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border rounded-xl p-10 text-center shadow-sm">

            <div className="text-5xl">
              📁
            </div>

            <h1 className="text-2xl font-bold mt-4">
              No Projects Available
            </h1>

            <p className="text-gray-500 mt-2">
              You currently do not
              have access to any
              projects.
            </p>

          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8">

      <div className="max-w-[1600px] mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

          <div>

            <div className="flex items-center gap-3">

              <h1 className="text-3xl font-bold text-gray-900">
                RFI Management
              </h1>

              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                {totalRFIs} RFIs
              </span>

            </div>

            <p className="text-gray-500 mt-1">
              Manage project questions,
              responses, routing, and
              information requests.
            </p>

          </div>

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={refreshRFIs}
              disabled={refreshing}
              className="border bg-white hover:bg-gray-50 px-4 py-2.5 rounded-lg font-medium disabled:opacity-50"
            >
              {refreshing
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  selectedProject
                ) {
                  router.push(
                    `/app/projects/${selectedProject}/rfis/new`
                  );
                }
              }}
              disabled={
                !selectedProject
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold disabled:bg-gray-300"
            >
              + New RFI
            </button>

          </div>

        </div>

        {/* =================================================
            PROJECT SELECTOR
        ================================================= */}

        <div className="bg-white border rounded-xl p-4 mb-6 shadow-sm">

          <div className="flex flex-col md:flex-row md:items-center gap-3">

            <div>

              <label className="text-sm font-medium text-gray-600">
                Project
              </label>

            </div>

            <select
              value={
                selectedProject
              }
              onChange={(e) =>
                setSelectedProject(
                  e.target.value
                )
              }
              className="border rounded-lg px-4 py-2.5 bg-white min-w-[280px] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            KPI CARDS
        ================================================= */}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

          <KpiCard
            title="Total RFIs"
            value={totalRFIs}
            icon="📋"
            className="bg-blue-50"
          />

          <KpiCard
            title="Open"
            value={openRFIs}
            icon="🔵"
            className="bg-yellow-50"
          />

          <KpiCard
            title="In Review"
            value={reviewRFIs}
            icon="🔎"
            className="bg-purple-50"
          />

          <KpiCard
            title="Closed"
            value={closedRFIs}
            icon="✅"
            className="bg-green-50"
          />

          <KpiCard
            title="Overdue"
            value={overdueRFIs}
            icon="⚠️"
            className={
              overdueRFIs > 0
                ? "bg-red-50"
                : "bg-gray-50"
            }
          />

        </div>

        {/* =================================================
            OVERDUE ALERT
        ================================================= */}

        {overdueRFIs > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">

            <div className="flex items-start gap-3">

              <div className="text-xl">
                ⚠️
              </div>

              <div>

                <h2 className="font-semibold text-red-800">
                  RFIs Need Attention
                </h2>

                <p className="text-sm text-red-700 mt-1">
                  {overdueRFIs} open or
                  in-review RFI
                  {overdueRFIs === 1
                    ? ""
                    : "s"}{" "}
                  {overdueRFIs === 1
                    ? "is"
                    : "are"}{" "}
                  past the due date.
                </p>

              </div>

            </div>

          </div>
        )}

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="bg-white border rounded-xl p-5 mb-6 shadow-sm">

          <div className="flex flex-col xl:flex-row gap-3">

            <input
              type="text"
              placeholder="Search RFI number, subject, sender, receiver..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="flex-1 border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="border rounded-lg px-4 py-2.5 bg-white"
            >
              <option value="All">
                All Statuses
              </option>
              <option value="Draft">
                Draft
              </option>
              <option value="Open">
                Open
              </option>
              <option value="In Review">
                In Review
              </option>
              <option value="Answered">
                Answered
              </option>
              <option value="Closed">
                Closed
              </option>
            </select>

            <select
              value={
                priorityFilter
              }
              onChange={(e) =>
                setPriorityFilter(
                  e.target.value
                )
              }
              className="border rounded-lg px-4 py-2.5 bg-white"
            >
              <option value="All">
                All Priorities
              </option>
              <option value="Low">
                Low
              </option>
              <option value="Medium">
                Medium
              </option>
              <option value="High">
                High
              </option>
              <option value="Critical">
                Critical
              </option>
            </select>

            <select
              value={
                ballInCourtFilter
              }
              onChange={(e) =>
                setBallInCourtFilter(
                  e.target.value
                )
              }
              className="border rounded-lg px-4 py-2.5 bg-white"
            >
              <option value="All">
                All Ball in Court
              </option>
              <option value="Contractor">
                Contractor
              </option>
              <option value="Engineer / EOR">
                Engineer / EOR
              </option>
              <option value="Owner">
                Owner
              </option>
              <option value="Architect">
                Architect
              </option>
              <option value="Subcontractor">
                Subcontractor
              </option>
              <option value="Vendor">
                Vendor
              </option>
              <option value="Other">
                Other
              </option>
            </select>

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="border rounded-lg px-4 py-2.5 hover:bg-gray-50 font-medium whitespace-nowrap"
            >
              Clear Filters
            </button>

          </div>

          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">

            <span>
              Showing{" "}
              <strong>
                {filteredRFIs.length}
              </strong>{" "}
              of{" "}
              <strong>
                {totalRFIs}
              </strong>{" "}
              RFIs
            </span>

            <span>
              Project:{" "}
              <strong>
                {getProjectName(
                  selectedProject
                )}
              </strong>
            </span>

          </div>

        </div>

        {/* =================================================
            MAIN LAYOUT
        ================================================= */}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* =================================================
              PROJECTS
          ================================================= */}

          <aside className="xl:col-span-3">

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">

              <div className="p-5 border-b">

                <h2 className="font-bold text-lg">
                  Projects
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Select a project
                </p>

              </div>

              <div className="max-h-[500px] overflow-y-auto">

                {projects.map(
                  (project) => {

                    const count =
                      rfis.filter(
                        (rfi) =>
                          rfi.project_id ===
                          project.id
                      ).length;

                    const selected =
                      selectedProject ===
                      project.id;

                    return (
                      <button
                        key={
                          project.id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedProject(
                            project.id
                          )
                        }
                        className={`w-full flex items-center justify-between gap-3 p-4 border-b text-left transition ${
                          selected
                            ? "bg-blue-50 border-l-4 border-l-blue-600"
                            : "hover:bg-gray-50"
                        }`}
                      >

                        <span className="flex items-center gap-2 min-w-0">

                          <span>
                            📁
                          </span>

                          <span className="truncate">
                            {
                              project.name
                            }
                          </span>

                        </span>

                        <span
                          className={`text-xs font-bold rounded-full px-2.5 py-1 ${
                            selected
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {count}
                        </span>

                      </button>
                    );
                  }
                )}

              </div>

            </div>

          </aside>

          {/* =================================================
              RFI TABLE
          ================================================= */}

          <section className="xl:col-span-9">

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">

              <div className="p-5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                <div>

                  <h2 className="text-lg font-bold">
                    RFIs
                  </h2>

                  <p className="text-sm text-gray-500">
                    Click any RFI row to open
                    the full RFI.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      selectedProject
                    ) {
                      router.push(
                        `/app/projects/${selectedProject}/rfis/new`
                      );
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  + New RFI
                </button>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1200px]">

                  <thead className="bg-gray-50 border-b">

                    <tr>

                      <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">
                        RFI #
                      </th>

                      <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">
                        Subject
                      </th>

                      <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">
                        Submitted By
                      </th>

                      <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">
                        Sent To
                      </th>

                      <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">
                        Ball in Court
                      </th>

                      <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">
                        Status
                      </th>

                      <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">
                        Priority
                      </th>

                      <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">
                        Due
                      </th>

                      <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredRFIs.map(
                      (rfi) => {

                        const overdue =
                          isOverdue(
                            rfi
                          );

                        return (
                          <tr
                            key={
                              rfi.id
                            }
                            onClick={() =>
                              openRFI(
                                rfi
                              )
                            }
                            className="border-b last:border-b-0 hover:bg-blue-50 cursor-pointer transition"
                          >

                            {/* RFI NUMBER */}

                            <td className="p-4">

                              <span className="font-bold text-blue-600 hover:text-blue-800">
                                {rfi.rfi_number ||
                                  "—"}
                              </span>

                            </td>

                            {/* SUBJECT */}

                            <td className="p-4">

                              <div className="font-medium text-gray-900">
                                {rfi.title ||
                                  "No subject"}
                              </div>

                              <div className="text-xs text-gray-400 mt-1">
                                Click to view
                                details
                              </div>

                            </td>

                            {/* SUBMITTED BY */}

                            <td className="p-4">

                              <div className="font-medium text-gray-800">
                                {rfi.submitted_by_name ||
                                  "Not specified"}
                              </div>

                              <div className="text-xs text-gray-400">
                                RFI originator
                              </div>

                            </td>

                            {/* SENT TO */}

                            <td className="p-4">

                              <div className="font-medium text-gray-800">
                                {rfi.submitted_to_name ||
                                  "Not specified"}
                              </div>

                              <div className="text-xs text-gray-400">
                                Receiving party
                              </div>

                            </td>

                            {/* BALL IN COURT */}

                            <td className="p-4">

                              {rfi.status ===
                              "Closed" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                  ✓ Closed
                                </span>
                              ) : (
                                <div>

                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getBallCourtClass(
                                      rfi
                                    )}`}
                                  >
                                    ●{" "}
                                    {rfi.ball_in_court_name ||
                                      "Not assigned"}
                                  </span>

                                  {rfi.ball_in_court_role && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {
                                        rfi.ball_in_court_role
                                      }
                                    </div>
                                  )}

                                </div>
                              )}

                            </td>

                            {/* STATUS */}

                            <td className="p-4">

                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                                  rfi.status
                                )}`}
                              >
                                {rfi.status ||
                                  "Open"}
                              </span>

                            </td>

                            {/* PRIORITY */}

                            <td className="p-4">

                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityClass(
                                  rfi.priority
                                )}`}
                              >
                                {rfi.priority ||
                                  "Medium"}
                              </span>

                            </td>

                            {/* DUE */}

                            <td className="p-4">

                              <div
                                className={
                                  overdue
                                    ? "text-red-600 font-semibold"
                                    : "text-gray-700"
                                }
                              >
                                {rfi.due_date ||
                                  "—"}
                              </div>

                              {rfi.due_date && (
                                <div
                                  className={`text-xs mt-1 ${
                                    overdue
                                      ? "text-red-500"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {getDaysText(
                                    rfi
                                  )}
                                </div>
                              )}

                            </td>

                            {/* ACTIONS */}

                            <td
                              className="p-4"
                              onClick={(e) =>
                                e.stopPropagation()
                              }
                            >

                              <div className="flex items-center gap-3">

                                <button
                                  type="button"
                                  onClick={() =>
                                    openRFI(
                                      rfi
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-800 font-semibold"
                                >
                                  View
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadRFI(
                                      rfi
                                    )
                                  }
                                  disabled={
                                    downloadingId ===
                                    rfi.id
                                  }
                                  className="text-green-600 hover:text-green-800 font-semibold disabled:text-gray-400"
                                >
                                  {downloadingId ===
                                  rfi.id
                                    ? "Generating..."
                                    : "↓ PDF"}
                                </button>

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                    {filteredRFIs.length ===
                      0 && (
                      <tr>

                        <td
                          colSpan={9}
                          className="p-12 text-center"
                        >

                          <div className="text-4xl mb-3">
                            📋
                          </div>

                          <h3 className="font-semibold text-gray-800">
                            No RFIs found
                          </h3>

                          <p className="text-sm text-gray-500 mt-1">
                            Try changing your
                            filters or create
                            a new RFI.
                          </p>

                          <button
                            type="button"
                            onClick={
                              clearFilters
                            }
                            className="mt-4 text-blue-600 hover:underline text-sm font-medium"
                          >
                            Clear Filters
                          </button>

                        </td>

                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </section>

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
  icon,
  className,
}: {
  title: string;
  value: number;
  icon: string;
  className?: string;
}) {
  return (
    <div
      className={`border rounded-xl p-5 shadow-sm ${
        className ||
        "bg-white"
      }`}
    >

      <div className="flex items-center justify-between">

        <p className="text-sm text-gray-500">
          {title}
        </p>

        <span className="text-lg">
          {icon}
        </span>

      </div>

      <p className="text-3xl font-bold mt-2 text-gray-900">
        {value}
      </p>

    </div>
  );
}