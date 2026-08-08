import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProjectTabs from "@/components/ProjectTabs";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDrawings({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's company
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    redirect("/create-company");
  }

  // Verify project belongs to this company
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();

  if (projectError || !project) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">
          Project not found
        </h1>

        <Link
          href="/app/projects"
          className="text-blue-600 hover:underline"
        >
          ← Back to Projects
        </Link>
      </main>
    );
  }

  // Load drawings for this project
  const { data: drawings, error: drawingsError } = await supabase
    .from("drawings")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (drawingsError) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">
          Error loading drawings
        </h1>

        <p>{drawingsError.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <Link
        href={`/app/projects/${id}`}
        className="text-blue-600 hover:underline"
      >
        ← Back to Project
      </Link>

      <h1 className="text-4xl font-bold mt-4">
        {project.name} Drawings
      </h1>

      <ProjectTabs projectId={id} />

      <div className="flex justify-between items-center mt-8">

        <h2 className="text-2xl font-bold">
          Drawings
        </h2>

        <Link
          href={`/app/projects/${id}/drawings/new`}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          + Upload Drawing
        </Link>

      </div>

      <div className="mt-6 bg-white rounded-xl shadow">

        <table className="w-full">

          <thead className="border-b bg-gray-50">
            <tr className="text-left">
              <th className="p-4">Number</th>
              <th className="p-4">Name</th>
              <th className="p-4">Revision</th>
              <th className="p-4">Status</th>
              <th className="p-4">PDF</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>

          <tbody>

            {drawings && drawings.length > 0 ? (
              drawings.map((drawing) => (
                <tr
                  key={drawing.id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-4">{drawing.number}</td>

                  <td className="p-4">{drawing.name}</td>

                  <td className="p-4">{drawing.revision}</td>

                  <td className="p-4">{drawing.status}</td>

                  <td className="p-4">
                    <a
                      href={drawing.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View PDF
                    </a>
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/app/projects/${id}/drawings/${drawing.id}`}
                      className="text-green-600 hover:underline"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="text-center p-8 text-gray-500"
                >
                  No drawings found for this project.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

    </main>
  );
}