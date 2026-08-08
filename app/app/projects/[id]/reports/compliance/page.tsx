import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ComplianceReport({
  params,
}: Props) {
  const { id } = await params;

  const { data } = await supabase
    .from("compliance_reports")
    .select("*")
    .eq("project_id", id);

  return (
    <main className="p-8">

      <h1 className="text-4xl font-bold mb-8">
        Compliance Report
      </h1>

      <div className="grid grid-cols-3 gap-6">

        <Card
          title="Total Reports"
          value={data?.length ?? 0}
        />

      </div>

      <div className="mt-8 bg-white rounded-xl shadow">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>
              <th className="p-4 text-left">
                Report
              </th>

              <th className="p-4 text-left">
                Status
              </th>

              <th className="p-4 text-left">
                Date
              </th>
            </tr>

          </thead>

          <tbody>

            {data?.map((item) => (

              <tr
                key={item.id}
                className="border-t"
              >

                <td className="p-4">
                  {item.title}
                </td>

                <td className="p-4">
                  {item.status}
                </td>

                <td className="p-4">
                  {item.created_at}
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
      <p>{title}</p>
      <h2 className="text-4xl font-bold">{value}</h2>
    </div>
  );
}