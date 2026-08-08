import Link from "next/link";

import NewProjectDialog from "@/components/NewProjectDialog";
import { createClient } from "@/lib/supabase/server";
import ProjectsClient from "@/components/ProjectsClient";

export default async function ProjectsPage() {
  const supabase = await createClient();

  console.log("====================================");
  console.log("PROJECTS PAGE");
  console.log("====================================");

  // 1. Get logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("====================================");
  console.log("AUTH CHECK");
  console.log("USER ID:", user?.id);
  console.log("USER EMAIL:", user?.email);
  console.log("USER ERROR:", userError);
  console.log("====================================");

  // User is not logged in
  if (userError || !user) {
    return (
      <main className="min-h-screen p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-red-600">
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

  // 2. Get user's company
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  console.log("====================================");
  console.log("COMPANY CHECK");
  console.log("USER ID:", user.id);
  console.log("USER EMAIL:", user.email);
  console.log("PROFILE:", profile);
  console.log("PROFILE ERROR:", profileError);
  console.log("CURRENT COMPANY ID:", profile?.company_id);
  console.log("====================================");

  // Profile error
  if (profileError) {
    return (
      <main className="min-h-screen p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-red-600">
            Profile Error
          </h1>

          <pre className="mt-4 bg-white p-4 rounded-lg overflow-auto">
            {JSON.stringify(profileError, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  // 3. User has no company
  if (!profile?.company_id) {
    return (
      <main className="min-h-screen p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-yellow-700">
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

  console.log("====================================");
  console.log("LOADING COMPANY PROJECTS");
  console.log("COMPANY ID:", profile.company_id);
  console.log("====================================");

  // 4. Load ONLY this company's active projects
  const {
    data: projects,
    error: projectError,
  } = await supabase
    .from("projects")
    .select("*")
    .eq("company_id", profile.company_id)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  console.log("====================================");
  console.log("PROJECT RESULTS");
  console.log("PROJECTS:", projects);
  console.log("PROJECT COUNT:", projects?.length);
  console.log("PROJECT ERROR:", projectError);

  console.log(
    "PROJECT COMPANY IDS:",
    projects?.map((project) => ({
      name: project.name,
      company_id: project.company_id,
    }))
  );

  console.log("====================================");

  // Project loading error
  if (projectError) {
    return (
      <main className="min-h-screen p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-red-600">
            Error Loading Projects
          </h1>

          <pre className="mt-6 bg-white p-4 rounded-lg overflow-auto">
            {JSON.stringify(projectError, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-4xl font-bold">
            Projects
          </h1>

          <p className="text-gray-500 mt-1">
            Projects for your company
          </p>
        </div>

        <div className="flex items-center gap-3">

          <NewProjectDialog />

          <Link
            href="/app/dashboard"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            Dashboard
          </Link>

        </div>

      </div>

      {/* Projects */}
      <ProjectsClient
        initialProjects={projects ?? []}
      />

    </main>
  );
}