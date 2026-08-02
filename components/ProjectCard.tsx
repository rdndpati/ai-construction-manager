"use client";

import Link from "next/link";
import DeleteProjectDialog from "./DeleteProjectDialog";
import { Project } from "@/types/project";
import EditProjectDialog from "./EditProjectDialog";

type Props = {
  project: Project;
};

export default function ProjectCard({ project }: Props) {
  function refreshPage() {
    window.location.reload();
  }

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition p-6">

      <h2 className="text-2xl font-bold">
        🏗 {project.name}
      </h2>

      <div className="mt-4 space-y-2 text-gray-600">
        <p>
          <strong>Client:</strong> {project.client}
        </p>

        <p>
          <strong>Location:</strong> {project.location}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          <span className="font-semibold text-blue-600">
            {project.status}
          </span>
        </p>
      </div>

      <div className="flex gap-3 mt-6">

        <Link
          href={`/projects/${project.id}`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          View Details
        </Link>

        <EditProjectDialog
          project={project}
          onUpdated={refreshPage}
        />
        <DeleteProjectDialog
  project={project}
  onDeleted={refreshPage}
/>

      </div>

    </div>
  );
}