import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProjectTabs from "@/components/ProjectTabs";
import DashboardCard from "@/components/DashboardCard";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDetails({ params }: PageProps) {
  const { id } = await params;

  // Load project
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  // Load dashboard statistics
  const [
    drawings,
    rfis,
    submittals,
    specifications,
    compliance,
  ] = await Promise.all([
    supabase
      .from("drawings")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),

    supabase
      .from("rfis")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),

    supabase
      .from("submittals")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),

    supabase
      .from("specifications")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),

    supabase
      .from("compliance_reports")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),
  ]);

  if (error || !project) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">
          Project not found
        </h1>

        <Link
          href="/projects"
          className="text-blue-600 hover:underline"
        >
          ← Back to Projects
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <Link
        href="/projects"
        className="text-blue-600 hover:underline"
      >
        ← Back to Projects
      </Link>

      <h1 className="text-4xl font-bold mt-4">
        {project.name}
      </h1>

      <div className="flex gap-6 mt-3 text-gray-600">
        <span>👤 {project.client}</span>
        <span>📍 {project.location}</span>
        <span className="font-semibold text-green-600">
          🟢 {project.status}
        </span>
      </div>

      <ProjectTabs projectId={project.id} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
        <DashboardCard
          title="Drawings"
          value={drawings.count ?? 0}
        />

        <DashboardCard
          title="RFIs"
          value={rfis.count ?? 0}
        />

        <DashboardCard
          title="Submittals"
          value={submittals.count ?? 0}
        />

        <DashboardCard
          title="Specifications"
          value={specifications.count ?? 0}
        />

        <DashboardCard
          title="Compliance"
          value={compliance.count ?? 0}
        />

        <DashboardCard
          title="Status"
          value={project.status}
        />

        <DashboardCard
          title="Client"
          value={project.client}
        />

        <DashboardCard
          title="Location"
          value={project.location}
        />
      </div>

      <div className="mt-10 bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold mb-6">
          Project Information
        </h2>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <strong>Client</strong>
            <p>{project.client}</p>
          </div>

          <div>
            <strong>Location</strong>
            <p>{project.location}</p>
          </div>

          <div>
            <strong>Status</strong>
            <p>{project.status}</p>
          </div>

          <div>
            <strong>Project ID</strong>
            <p>{project.id}</p>
          </div>
        </div>
      </div>
    </main>
  );
}