import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProjectTabs from "@/components/ProjectTabs";
import DashboardCard from "@/components/DashboardCard";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDetails({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // ============================================================
  // 1. GET LOGGED-IN USER
  // ============================================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("====================================");
  console.log("PROJECT DETAILS ACCESS CHECK");
  console.log("USER:", user?.email);
  console.log("USER ID:", user?.id);
  console.log("USER ERROR:", userError);
  console.log("PROJECT ID:", id);
  console.log("====================================");

  if (userError || !user) {
    redirect("/login");
  }

  // ============================================================
  // 2. GET USER PROFILE
  // ============================================================

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(`
      company_id,
      role_id,
      is_owner
    `)
    .eq("id", user.id)
    .single();

  console.log("PROFILE:", profile);
  console.log("PROFILE ERROR:", profileError);

  if (profileError || !profile?.company_id) {
    redirect("/create-company");
  }

  const companyId = profile.company_id;
  const roleId = profile.role_id;
  const isOwner = profile.is_owner === true;

  // ============================================================
  // 3. GET ROLE NAME
  // ============================================================

  let roleName = "";

  if (roleId) {
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("name")
      .eq("id", roleId)
      .maybeSingle();

    console.log("ROLE:", role);
    console.log("ROLE ERROR:", roleError);

    roleName = role?.name || "";
  }

  console.log("ROLE NAME:", roleName);
  console.log("IS OWNER:", isOwner);

  // ============================================================
  // 4. CHECK PROJECT VIEW PERMISSION
  // ============================================================

  const isAdmin = roleName.toLowerCase() === "admin";

  let hasProjectViewPermission = false;

  if (isOwner || isAdmin) {
    // Owners and Admins have access
    hasProjectViewPermission = true;
  } else if (roleId) {
    const { data: permission, error: permissionError } =
      await supabase
        .from("permissions")
        .select("id")
        .eq("role_id", roleId)
        .eq("module", "Projects")
        .eq("permission", "view")
        .maybeSingle();

    console.log("PROJECT VIEW PERMISSION:", permission);
    console.log(
      "PROJECT PERMISSION ERROR:",
      permissionError
    );

    hasProjectViewPermission = !!permission;
  }

  console.log(
    "HAS PROJECT VIEW PERMISSION:",
    hasProjectViewPermission
  );

  // ============================================================
  // 5. DENY ACCESS IF ROLE CANNOT VIEW PROJECTS
  // ============================================================

  if (!hasProjectViewPermission) {
    return (
      <main className="p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8 text-center">

          <div className="text-5xl mb-4">
            🔒
          </div>

          <h1 className="text-3xl font-bold text-red-600">
            Access Denied
          </h1>

          <p className="mt-3 text-gray-600">
            You do not have permission to view projects.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Your role does not have the
            <strong> Projects → View </strong>
            permission.
          </p>

          <Link
            href="/app/dashboard"
            className="inline-block mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            ← Back to Dashboard
          </Link>

        </div>
      </main>
    );
  }

  // ============================================================
  // 6. CHECK PROJECT BELONGS TO USER'S COMPANY
  // ============================================================

  const {
    data: project,
    error: projectError,
  } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();

  console.log("PROJECT:", project);
  console.log("PROJECT ERROR:", projectError);

  if (projectError || !project) {
    return (
      <main className="p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8 text-center">

          <div className="text-5xl mb-4">
            🔍
          </div>

          <h1 className="text-3xl font-bold">
            Project Not Found
          </h1>

          <p className="mt-3 text-gray-600">
            This project does not exist or does not belong to
            your company.
          </p>

          <Link
            href="/app/projects"
            className="inline-block mt-6 text-blue-600 hover:underline"
          >
            ← Back to Projects
          </Link>

        </div>
      </main>
    );
  }

  // ============================================================
  // 7. CHECK PROJECT ASSIGNMENT
  // ============================================================
  //
  // Owners and Admins can access all company projects.
  //
  // Other users MUST be assigned to this project.
  //
  // ============================================================

  let hasProjectAccess = false;

  if (isOwner || isAdmin) {
    hasProjectAccess = true;
  } else {
    const {
      data: assignment,
      error: assignmentError,
    } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", id)
      .eq("profile_id", user.id)
      .maybeSingle();

    console.log("PROJECT ASSIGNMENT:", assignment);
    console.log(
      "PROJECT ASSIGNMENT ERROR:",
      assignmentError
    );

    hasProjectAccess = !!assignment;
  }

  console.log(
    "HAS PROJECT ACCESS:",
    hasProjectAccess
  );

  // ============================================================
  // 8. DENY IF USER IS NOT ASSIGNED TO THIS PROJECT
  // ============================================================

  if (!hasProjectAccess) {
    return (
      <main className="p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8 text-center">

          <div className="text-5xl mb-4">
            🚫
          </div>

          <h1 className="text-3xl font-bold text-red-600">
            Project Access Denied
          </h1>

          <p className="mt-3 text-gray-600">
            You are not assigned to this project.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Contact your company administrator if you
            need access to this project.
          </p>

          <Link
            href="/app/projects"
            className="inline-block mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            ← Back to My Projects
          </Link>

        </div>
      </main>
    );
  }

  // ============================================================
  // 9. LOAD PROJECT DASHBOARD STATISTICS
  // ============================================================

  const [
    drawings,
    rfis,
    submittals,
    specifications,
    compliance,
  ] = await Promise.all([
    supabase
      .from("drawings")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),

    supabase
      .from("rfis")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),

    supabase
      .from("submittals")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),

    supabase
      .from("specifications")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),

    supabase
      .from("compliance_reports")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),
  ]);

  // ============================================================
  // 10. DISPLAY PROJECT
  // ============================================================

  return (
    <main className="p-8">

      {/* Back */}
      <Link
        href="/app/projects"
        className="text-blue-600 hover:underline"
      >
        ← Back to Projects
      </Link>

      {/* Project Header */}
      <h1 className="text-4xl font-bold mt-4">
        {project.name}
      </h1>

      <div className="flex gap-6 mt-3 text-gray-600">

        <span>
          👤 {project.client}
        </span>

        <span>
          📍 {project.location}
        </span>

        <span className="font-semibold text-green-600">
          🟢 {project.status}
        </span>

      </div>

      {/* Project Tabs */}
      <ProjectTabs
        projectId={project.id}
      />

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">

        <DashboardCard
          title="Drawings"
          value={drawings.count ?? 0}
        />

        <DashboardCard
          title="RFIs"
          value={rfis.count ?? 0}
        />

        <DashboardCard
          title="Submittals"
          value={submittals.count ?? 0}
        />

        <DashboardCard
          title="Specifications"
          value={specifications.count ?? 0}
        />

        <DashboardCard
          title="Compliance"
          value={compliance.count ?? 0}
        />

        <DashboardCard
          title="Status"
          value={project.status}
        />

        <DashboardCard
          title="Client"
          value={project.client}
        />

        <DashboardCard
          title="Location"
          value={project.location}
        />

      </div>

      {/* Project Information */}
      <div className="mt-10 bg-white rounded-xl shadow p-6">

        <h2 className="text-2xl font-bold mb-6">
          Project Information
        </h2>

        <div className="grid grid-cols-2 gap-8">

          <div>
            <strong>Client</strong>
            <p>{project.client}</p>
          </div>

          <div>
            <strong>Location</strong>
            <p>{project.location}</p>
          </div>

          <div>
            <strong>Status</strong>
            <p>{project.status}</p>
          </div>

          <div>
            <strong>Project ID</strong>
            <p>{project.id}</p>
          </div>

        </div>

      </div>

    </main>
  );
}