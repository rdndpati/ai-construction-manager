import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SpecificationsReport({
  params,
}: Props) {
  const { id } = await params;

  const { data: specifications } = await supabase
    .from("specifications")
    .select("*")
    .eq("project_id", id);

  const total = specifications?.length ?? 0;

  return (
    <main className="p-8">

      <h1 className="text-4xl font-bold mb-8">
        Specification Report
      </h1>

      <div className="grid grid-cols-4 gap-6">

        <Card
          title="Total Specifications"
          value={total}
        />

      </div>

      <div className="mt-8 bg-white rounded-xl shadow">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="p-4 text-left">
                Section
              </th>

              <th className="p-4 text-left">
                Title
              </th>

              <th className="p-4 text-left">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {specifications?.map((spec) => (

              <tr
                key={spec.id}
                className="border-t"
              >

                <td className="p-4">
                  {spec.section}
                </td>

                <td className="p-4">
                  {spec.title}
                </td>

                <td className="p-4">
                  {spec.status}
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
      <p className="text-gray-500">{title}</p>
      <h2 className="text-4xl font-bold mt-2">
        {value}
      </h2>
    </div>
  );
}