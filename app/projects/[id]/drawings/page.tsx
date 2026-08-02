import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProjectTabs from "@/components/ProjectTabs";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDrawings({ params }: Props) {
  const { id } = await params;

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  const { data: drawings } = await supabase
    .from("drawings")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <Link
        href={`/projects/${id}`}
        className="text-blue-600 hover:underline"
      >
        ← Back to Project
      </Link>

      <h1 className="text-4xl font-bold mt-4">
        {project?.name} Drawings
      </h1>

      <ProjectTabs projectId={id} />

      <div className="flex justify-between items-center mt-8">

        <h2 className="text-2xl font-bold">
          Drawings
        </h2>

        <Link
  href={`/projects/${id}/drawings/new`}
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

            {drawings?.length ? (
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
      href={`/projects/${id}/drawings/${drawing.id}`}
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
                  colSpan={3}
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