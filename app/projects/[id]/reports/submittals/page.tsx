import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SubmittalReport({ params }: Props) {
  const { id } = await params;

  const { data } = await supabase
    .from("submittals")
    .select("*")
    .eq("project_id", id);

  const submittals = data ?? [];

  return (
    <main className="p-8">

      <h1 className="text-4xl font-bold mb-8">
        Submittal Report
      </h1>

      <div className="grid grid-cols-5 gap-6">

        <Stat
          title="Total"
          value={submittals.length}
        />

        <Stat
          title="Pending"
          value={submittals.filter(s=>s.status==="Pending").length}
        />

        <Stat
          title="In Review"
          value={submittals.filter(s=>s.status==="In Review").length}
        />

        <Stat
          title="Approved"
          value={submittals.filter(s=>s.status==="Approved").length}
        />

        <Stat
          title="Rejected"
          value={submittals.filter(s=>s.status==="Rejected").length}
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