import Link from "next/link";
import NewProjectDialog from "@/components/NewProjectDialog";
import { projects } from "@/data/projects";

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-8">
        Projects
      </h1>

      <NewProjectDialog />

      <div className="space-y-6">
        {projects.map((project) => (
          <Link
            href={`/projects/${project.id}`}
            key={project.id}
          >
            <div className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 cursor-pointer">
              <h2 className="text-2xl font-bold">
                {project.name}
              </h2>

              <p className="mt-2 text-gray-600">
                <strong>Client:</strong> {project.client}
              </p>

              <p className="text-gray-600">
                <strong>Location:</strong> {project.location}
              </p>

              <p className="text-gray-600">
                <strong>Status:</strong> {project.status}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}