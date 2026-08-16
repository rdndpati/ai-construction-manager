import Link from "next/link";

import NewProjectDialog from "@/components/NewProjectDialog";
import { createClient } from "@/lib/supabase/server";
import ProjectsClient from "@/components/ProjectsClient";

export default async function ProjectsPage() {
  const supabase = await createClient();

  // ============================================
  // 1. GET LOGGED-IN USER
  // ============================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return (
      <main className="p-8">
        <div className="max-w-xl mx-auto text-center mt-20">
          <h1 className="text-3xl font-bold">
            Authentication Required
          </h1>

          <p className="mt-2 text-gray-600">
            Please log in to view your projects.
          </p>

          <Link
            href="/login"
            className="inline-block mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  // ============================================
  // 2. GET USER PROFILE
  // ============================================

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      company_id,
      role_id,
      is_owner
    `)
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("PROFILE ERROR:", profileError);

    return (
      <main className="p-8">
        <div className="max-w-xl mx-auto text-center mt-20">
          <h1 className="text-3xl font-bold">
            Profile Error
          </h1>

          <p className="mt-2 text-gray-600">
            Unable to load your profile.
          </p>

          <pre className="mt-4 bg-white p-4 rounded-lg overflow-auto text-left text-sm">
            {JSON.stringify(profileError, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  // ============================================
  // 3. CHECK COMPANY
  // ============================================

  if (!profile?.company_id) {
    return (
      <main className="p-8">
        <div className="max-w-xl mx-auto text-center mt-20">
          <h1 className="text-3xl font-bold">
            No Company Assigned
          </h1>

          <p className="mt-2 text-gray-600">
            Your account is not connected to a company yet.
          </p>

          <Link
            href="/create-company"
            className="inline-block mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Company
          </Link>
        </div>
      </main>
    );
  }

  const companyId = profile.company_id;

  // ============================================
  // 4. DETERMINE USER ROLE
  // ============================================

  let roleName = "";

  if (profile.role_id) {
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("name")
      .eq("id", profile.role_id)
      .maybeSingle();

    if (roleError) {
      console.error("ROLE ERROR:", roleError);
    }

    roleName = role?.name?.trim() || "";
  }

  const normalizedRole = roleName.toLowerCase();

  const isOwner = profile.is_owner === true;

  const isAdmin =
    normalizedRole === "admin" ||
    normalizedRole === "administrator";

  // Owner OR Admin gets full company project access
  const hasFullProjectAccess = isOwner || isAdmin;

  console.log("====================================");
  console.log("PROJECT ACCESS CHECK");
  console.log("USER:", user.email);
  console.log("USER ID:", user.id);
  console.log("COMPANY:", companyId);
  console.log("ROLE:", roleName);
  console.log("IS OWNER:", isOwner);
  console.log("IS ADMIN:", isAdmin);
  console.log(
    "FULL PROJECT ACCESS:",
    hasFullProjectAccess
  );
  console.log("====================================");

  // ============================================
  // 5. LOAD PROJECTS
  // ============================================

  let projects: any[] = [];

  // ============================================
  // OWNER / ADMIN
  // ============================================
  //
  // Company owners and admins can see
  // ALL active projects belonging to
  // THEIR company only.
  //
  // ============================================

  if (hasFullProjectAccess) {
    const { data, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("company_id", companyId)
      .eq("archived", false)
      .order("created_at", {
        ascending: false,
      });

    if (projectError) {
      console.error("PROJECT ERROR:", projectError);

      return (
        <main className="p-8">
          <div className="max-w-xl mx-auto text-center mt-20">
            <h1 className="text-3xl font-bold">
              Error Loading Projects
            </h1>

            <p className="mt-2 text-gray-600">
              We could not load your company projects.
            </p>

            <pre className="mt-6 bg-white p-4 rounded-lg overflow-auto text-left text-sm">
              {JSON.stringify(projectError, null, 2)}
            </pre>
          </div>
        </main>
      );
    }

    projects = data || [];
  }

  // ============================================
  // REGULAR EMPLOYEE
  // ============================================
  //
  // Employees can ONLY see projects assigned
  // to their profile through project_members.
  //
  // ============================================

  else {
    const {
      data: assignments,
      error: assignmentError,
    } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("profile_id", user.id);

    if (assignmentError) {
      console.error(
        "PROJECT ASSIGNMENT ERROR:",
        assignmentError
      );

      return (
        <main className="p-8">
          <div className="max-w-xl mx-auto text-center mt-20">
            <h1 className="text-3xl font-bold">
              Error Loading Project Access
            </h1>

            <p className="mt-2 text-gray-600">
              We could not determine your project assignments.
            </p>

            <pre className="mt-6 bg-white p-4 rounded-lg overflow-auto text-left text-sm">
              {JSON.stringify(
                assignmentError,
                null,
                2
              )}
            </pre>
          </div>
        </main>
      );
    }

    const projectIds =
      assignments?.map(
        (assignment) => assignment.project_id
      ) || [];

    // No assignments
    if (projectIds.length === 0) {
      projects = [];
    }

    // Load only assigned projects
    else {
      const {
        data,
        error: projectError,
      } = await supabase
        .from("projects")
        .select("*")
        .eq("company_id", companyId)
        .eq("archived", false)
        .in("id", projectIds)
        .order("created_at", {
          ascending: false,
        });

      if (projectError) {
        console.error(
          "EMPLOYEE PROJECT ERROR:",
          projectError
        );

        return (
          <main className="p-8">
            <div className="max-w-xl mx-auto text-center mt-20">
              <h1 className="text-3xl font-bold">
                Error Loading Projects
              </h1>

              <pre className="mt-6 bg-white p-4 rounded-lg overflow-auto text-left text-sm">
                {JSON.stringify(
                  projectError,
                  null,
                  2
                )}
              </pre>
            </div>
          </main>
        );
      }

      projects = data || [];
    }
  }

  // ============================================
  // PAGE
  // ============================================

  return (
    <main className="p-8">

      {/* ======================================== */}
      {/* HEADER */}
      {/* ======================================== */}

      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-4xl font-bold">
            Projects
          </h1>

          <p className="text-gray-500 mt-1">
            {hasFullProjectAccess
              ? "All projects for your company"
              : "Projects assigned to you"}
          </p>
        </div>

        <div className="flex items-center gap-3">

          {/* ==================================== */}
          {/* NEW PROJECT */}
          {/* ==================================== */}
          {/*
            Only company Owner or Admin can
            create projects.
          */}

          {hasFullProjectAccess && (
            <NewProjectDialog />
          )}

          {/* ==================================== */}
          {/* DASHBOARD */}
          {/* ==================================== */}

          <Link
            href="/app/dashboard"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Dashboard
          </Link>

        </div>
      </div>

      {/* ======================================== */}
      {/* EMPLOYEE EMPTY STATE */}
      {/* ======================================== */}

      {!hasFullProjectAccess &&
        projects.length === 0 && (
          <div className="bg-white rounded-xl shadow p-10 text-center">

            <div className="text-5xl mb-4">
              📁
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              No Projects Assigned
            </h2>

            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              You currently don't have access to any
              projects. Please contact your company
              administrator.
            </p>

          </div>
        )}

      {/* ======================================== */}
      {/* OWNER / ADMIN EMPTY STATE */}
      {/* ======================================== */}

      {hasFullProjectAccess &&
        projects.length === 0 && (
          <div className="bg-white rounded-xl shadow p-10 text-center">

            <div className="text-5xl mb-4">
              📁
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              No Projects Yet
            </h2>

            <p className="text-gray-500 mt-2">
              Your company does not have any active
              projects yet.
            </p>

            <p className="text-blue-600 mt-3 font-medium">
              Use the "+ New Project" button above
              to create your first project.
            </p>

          </div>
        )}

      {/* ======================================== */}
      {/* PROJECT LIST */}
      {/* ======================================== */}

      {projects.length > 0 && (
        <ProjectsClient
          initialProjects={projects}
        />
      )}

    </main>
  );
}