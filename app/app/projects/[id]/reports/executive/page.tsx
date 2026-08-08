import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ExecutiveDashboard({ params }: Props) {
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
      <main className="p-8">
        <h1 className="text-3xl font-bold">
          Project not found
        </h1>
      </main>
    );
  }

  // Load project statistics
  const [
    rfis,
    submittals,
    drawings,
    specifications,
    compliance,
  ] = await Promise.all([
    supabase
      .from("rfis")
      .select("*")
      .eq("project_id", id),

    supabase
      .from("submittals")
      .select("*")
      .eq("project_id", id),

    supabase
      .from("drawings")
      .select("*")
      .eq("project_id", id),

    supabase
      .from("specifications")
      .select("*")
      .eq("project_id", id),

    supabase
      .from("compliance_reports")
      .select("*")
      .eq("project_id", id),
  ]);

  return (
    <main className="p-8">

      <h1 className="text-4xl font-bold mb-8">
        Executive Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-6">

        <Card title="Project">
          {project.name}
        </Card>

        <Card title="Client">
          {project.client}
        </Card>

        <Card title="Status">
          {project.status}
        </Card>

        <Card title="RFIs">
          {rfis.data?.length ?? 0}
        </Card>

        <Card title="Submittals">
          {submittals.data?.length ?? 0}
        </Card>

        <Card title="Drawings">
          {drawings.data?.length ?? 0}
        </Card>

        <Card title="Specifications">
          {specifications.data?.length ?? 0}
        </Card>

        <Card title="Compliance Reports">
          {compliance.data?.length ?? 0}
        </Card>

      </div>

    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <p className="text-gray-500">{title}</p>

      <h2 className="text-3xl font-bold mt-2">
        {children}
      </h2>
    </div>
  );
}