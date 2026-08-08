import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RFIReport({ params }: Props) {
  const { id } = await params;

  const { data } = await supabase
    .from("rfis")
    .select("*")
    .eq("project_id", id);

  const rfis = data ?? [];

  return (
    <main className="p-8">

      <h1 className="text-4xl font-bold mb-8">
        RFI Report
      </h1>

      <div className="grid grid-cols-4 gap-6">

        <Stat
          title="Total RFIs"
          value={rfis.length}
        />

        <Stat
          title="Open"
          value={rfis.filter(r=>r.status==="Open").length}
        />

        <Stat
          title="In Review"
          value={rfis.filter(r=>r.status==="In Review").length}
        />

        <Stat
          title="Closed"
          value={rfis.filter(r=>r.status==="Closed").length}
        />

      </div>

    </main>
  );
}

function Stat({
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