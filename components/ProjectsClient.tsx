import Link from "next/link";
import { redirect } from "next/navigation";
import ProjectsClient from "@/components/ProjectsClient";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const supabase = await createClient();

  // Get logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("======================================");
  console.log("SERVER USER:", user);
  console.log("USER ERROR:", userError);
  console.log("======================================");

  if (userError || !user) {
    console.log("❌ No logged in user");
    redirect("/login");
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  console.log("======================================");
  console.log("SERVER PROFILE:", profile);
  console.log("PROFILE ERROR:", profileError);
  console.log("======================================");

  if (profileError || !profile || !profile.company_id) {
    console.log("❌ Company not found");

    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">
          Company not found
        </h1>

        <pre className="mt-4 text-red-600">
          {JSON.stringify(profileError, null, 2)}
        </pre>
      </main>
    );
  }

  console.log("Current Company:", profile.company_id);

  // Load only this company's projects
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  console.log("======================================");
  console.log("PROJECT QUERY COMPANY:", profile.company_id);
  console.log("PROJECTS:", projects);
  console.log("PROJECT ERROR:", error);
  console.log("PROJECT COUNT:", projects?.length);
  console.log("======================================");

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">
          Error Loading Projects
        </h1>

        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">
          Projects
        </h1>

        <Link
          href="/"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          Dashboard
        </Link>
      </div>

      <div className="mt-8">
        <ProjectsClient initialProjects={projects ?? []} />
      </div>
    </main>
  );
}