import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProjectsClient from "@/components/ProjectsClient";

export default async function ProjectsPage() {
  const supabase = await createClient();

  // Get logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("SERVER USER:", user);

  if (userError || !user) {
    redirect("/login");
  }

  // Get user's company
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  console.log("SERVER PROFILE:", profile);

  if (profileError) {
    console.log(profileError);
  }

  if (!profile?.company_id) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">
          Company not found
        </h1>

        <p className="mt-4 text-gray-600">
          Your account is not assigned to a company.
        </p>
      </main>
    );
  }

  // Load ONLY this company's projects
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  console.log("PROJECTS:", projects);
  console.log("PROJECT ERROR:", error);

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
        <ProjectsClient
          initialProjects={projects ?? []}
        />
      </div>

    </main>
  );
}