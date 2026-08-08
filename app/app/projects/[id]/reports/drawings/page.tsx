import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DrawingReport({ params }: Props) {
  const { id } = await params;

  const { data: drawings } = await supabase
    .from("drawings")
    .select("*")
    .eq("project_id", id);

  const total = drawings?.length ?? 0;

  const ifc =
    drawings?.filter((d) => d.status === "IFC").length ?? 0;

  const review =
    drawings?.filter((d) => d.status === "In Review").length ?? 0;

  const approved =
    drawings?.filter((d) => d.status === "Approved").length ?? 0;

  const revisions =
    drawings?.filter((d) => d.revision).length ?? 0;

  return (
    <main className="p-8">

      <h1 className="text-4xl font-bold mb-8">
        Drawing Report
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">

        <Card title="Total Drawings" value={total} />

        <Card title="IFC Drawings" value={ifc} />

        <Card title="In Review" value={review} />

        <Card title="Approved" value={approved} />

        <Card title="Revisions" value={revisions} />

      </div>

      <div className="mt-10 bg-white rounded-xl shadow">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="text-left p-4">
                Drawing No
              </th>

              <th className="text-left p-4">
                Title
              </th>

              <th className="text-left p-4">
                Revision
              </th>

              <th className="text-left p-4">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {drawings?.map((drawing) => (

              <tr
                key={drawing.id}
                className="border-t"
              >

                <td className="p-4">
                  {drawing.drawing_number}
                </td>

                <td className="p-4">
                  {drawing.title}
                </td>

                <td className="p-4">
                  {drawing.revision}
                </td>

                <td className="p-4">
                  {drawing.status}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6">

      <p className="text-gray-500">
        {title}
      </p>

      <h2 className="text-4xl font-bold mt-2">
        {value}
      </h2>

    </div>
  );
}