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

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

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

      <p className="text-gray-600 mt-2">
        {project.client} • {project.location} • {project.status}
      </p>

      <ProjectTabs projectId={project.id} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
        <DashboardCard title="Engineering" value="72%" />
        <DashboardCard title="Drawings" value="1" />
        <DashboardCard title="RFIs" value="0" />
        <DashboardCard title="TBPs" value="0" />
        <DashboardCard title="Submittals" value="0" />
        <DashboardCard title="IFC Revisions" value="0" />
        <DashboardCard title="Reports" value="0" />
        <DashboardCard title="AI Assistant" value="Ready" />
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