import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ArchivedProjectsClient from "@/components/ArchivedProjectsClient";

export default async function ArchivedProjectsPage() {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("archived", true)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="bg-white rounded-xl shadow p-8">
          <h1 className="text-3xl font-bold text-red-600">
            Error Loading Archived Projects
          </h1>

          <pre className="mt-6 bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-4xl font-bold">
          Archived Projects
        </h1>

        <Link
          href="/app/projects"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          ← Back to Projects
        </Link>

      </div>

      <ArchivedProjectsClient
        initialProjects={projects ?? []}
      />

    </main>
  );
}