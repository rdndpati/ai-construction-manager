import Link from "next/link";
import { redirect } from "next/navigation";
import ProjectsClient from "@/components/ProjectsClient";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const supabase = await createClient();

  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">
          Company not found
        </h1>
      </main>
    );
  }

  // Load ONLY this company's projects
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

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