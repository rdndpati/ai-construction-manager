import Link from "next/link";

import NewProjectDialog from "@/components/NewProjectDialog";
import { createClient } from "@/lib/supabase/server";
import ProjectsClient from "@/components/ProjectsClient";

export default async function ProjectsPage() {
  const supabase = await createClient();

  console.log("====================================");
  console.log("PROJECTS PAGE");
  console.log("====================================");

  // ============================================
  // 1. GET LOGGED-IN USER
  // ============================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("AUTH CHECK");
  console.log("USER ID:", user?.id);
  console.log("USER EMAIL:", user?.email);
  console.log("USER ERROR:", userError);

  // ============================================
  // USER NOT LOGGED IN
  // ============================================

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

  console.log("====================================");
  console.log("PROFILE CHECK");
  console.log("PROFILE:", profile);
  console.log("PROFILE ERROR:", profileError);
  console.log("====================================");

  // ============================================
  // PROFILE ERROR
  // ============================================

  if (profileError) {
    return (
      <main className="p-8">
        <div className="max-w-xl mx-auto text-center mt-20">
          <h1 className="text-3xl font-bold">
            Profile Error
          </h1>

          <pre className="mt-4 bg-white p-4 rounded-lg overflow-auto text-left">
            {JSON.stringify(
              profileError,
              null,
              2
            )}
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

  // ============================================
// 4. DETERMINE USER ROLE
// ============================================

let roleName = "";

if (profile.role_id) {
  const {
    data: role,
    error: roleError,
  } = await supabase
    .from("roles")
    .select("name")
    .eq("id", profile.role_id)
    .maybeSingle();

  console.log("ROLE:", role);
  console.log("ROLE ERROR:", roleError);

  roleName = role?.name || "";
}

const isOwner = profile.is_owner === true;

const isAdmin = roleName === "Admin";

const hasFullProjectAccess =
  isAdmin || isOwner;

console.log("====================================");
console.log("ACCESS CHECK");
console.log("ROLE:", roleName);
console.log("ROLE ID:", profile.role_id);
console.log("IS OWNER:", isOwner);
console.log("IS ADMIN:", isAdmin);
console.log(
  "FULL PROJECT ACCESS:",
  hasFullProjectAccess
);
console.log("COMPANY:", companyId);
console.log("====================================");

  console.log("====================================");
  console.log("ACCESS CHECK");
  console.log("ROLE:", roleName);
  console.log("IS OWNER:", isOwner);
  console.log("IS ADMIN:", isAdmin);
  console.log("COMPANY:", companyId);
  console.log("====================================");

  // ============================================
  // 5. LOAD PROJECTS
  // ============================================

  let projects: any[] = [];

  // ============================================
  // ADMIN / OWNER
  // ============================================
  //
  // Admins and company owners can see
  // every project belonging to the company.
  //
  // ============================================

  if (hasFullProjectAccess) {
    console.log(
      "ADMIN /Owner ACCESS: Loading all company projects"
    );

    const {
      data,
      error: projectError,
    } = await supabase
      .from("projects")
      .select("*")
      .eq("company_id", companyId)
      .eq("archived", false)
      .order("created_at", {
        ascending: false,
      });

    console.log("ADMIN PROJECTS:", data);
    console.log(
      "ADMIN PROJECT ERROR:",
      projectError
    );

    if (projectError) {
      return (
        <main className="p-8">
          <div className="max-w-xl mx-auto text-center mt-20">
            <h1 className="text-3xl font-bold">
              Error Loading Projects
            </h1>

            <pre className="mt-6 bg-white p-4 rounded-lg overflow-auto text-left">
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

  // ============================================
  // NORMAL EMPLOYEE
  // ============================================
  //
  // Employees can ONLY see projects assigned
  // to them through project_members.
  //
  // ============================================

  else {
    console.log(
      "EMPLOYEE ACCESS: Loading assigned projects only"
    );

    // --------------------------------------------
    // Get project assignments
    // --------------------------------------------

    const {
      data: assignments,
      error: assignmentError,
    } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("profile_id", user.id);

    console.log(
      "PROJECT ASSIGNMENTS:",
      assignments
    );

    console.log(
      "ASSIGNMENT ERROR:",
      assignmentError
    );

    if (assignmentError) {
      return (
        <main className="p-8">
          <div className="max-w-xl mx-auto text-center mt-20">
            <h1 className="text-3xl font-bold">
              Error Loading Project Access
            </h1>

            <pre className="mt-6 bg-white p-4 rounded-lg overflow-auto text-left">
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

    // --------------------------------------------
    // Get project IDs
    // --------------------------------------------

    const projectIds =
      assignments?.map(
        (assignment) =>
          assignment.project_id
      ) || [];

    console.log(
      "ASSIGNED PROJECT IDS:",
      projectIds
    );

    // --------------------------------------------
    // No projects assigned
    // --------------------------------------------

    if (projectIds.length === 0) {
      projects = [];
    }

    // --------------------------------------------
    // Load ONLY assigned projects
    // --------------------------------------------

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

      console.log(
        "EMPLOYEE PROJECTS:",
        data
      );

      console.log(
        "EMPLOYEE PROJECT ERROR:",
        projectError
      );

      if (projectError) {
        return (
          <main className="p-8">
            <div className="max-w-xl mx-auto text-center mt-20">
              <h1 className="text-3xl font-bold">
                Error Loading Projects
              </h1>

              <pre className="mt-6 bg-white p-4 rounded-lg overflow-auto text-left">
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
  // FINAL LOG
  // ============================================

  console.log("====================================");
  console.log("FINAL PROJECT LIST");
  console.log("USER:", user.email);
  console.log("ROLE:", roleName);
  console.log("IS ADMIN:", isAdmin);
  console.log("PROJECT COUNT:", projects.length);
  console.log(
    "PROJECTS:",
    projects.map((project) => ({
      id: project.id,
      name: project.name,
      company_id: project.company_id,
    }))
  );
  console.log("====================================");

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
            {isAdmin
              ? "All projects for your company"
              : "Projects assigned to you"}
          </p>
        </div>

        <div className="flex items-center gap-3">

          {/* Only Admin / Owner can create projects */}

          {isAdmin && (
            <NewProjectDialog />
          )}

          <Link
            href="/app/dashboard"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            Dashboard
          </Link>

        </div>

      </div>

      {/* ======================================== */}
      {/* EMPLOYEE INFORMATION */}
      {/* ======================================== */}

      {!isAdmin && projects.length === 0 && (
        <div className="bg-white rounded-xl shadow p-10 text-center">

          <div className="text-5xl mb-4">
            📁
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            No Projects Assigned
          </h2>

          <p className="text-gray-500 mt-2">
            You currently don't have access to any
            projects. Please contact your company
            administrator.
          </p>

        </div>
      )}

      {/* ======================================== */}
      {/* PROJECTS */}
      {/* ======================================== */}

      {projects.length > 0 && (
        <ProjectsClient
          initialProjects={projects}
        />
      )}

    </main>
  );
}