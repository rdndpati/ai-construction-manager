"use client";

import { useState } from "react";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
  client: string;
  location: string;
  status: string;
};

export default function ProjectsClient({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const [projects] = useState(initialProjects);

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <h2 className="text-2xl font-bold">
          No Projects Found
        </h2>

        <p className="text-gray-500 mt-2">
          Create your first project.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">

      {projects.map((project) => (

        <div
          key={project.id}
          className="bg-white rounded-xl shadow p-6"
        >

          <h2 className="text-2xl font-bold">
            {project.name}
          </h2>

          <p className="text-gray-600 mt-2">
            Client: {project.client}
          </p>

          <p className="text-gray-600">
            Location: {project.location}
          </p>

          <span className="inline-block mt-4 bg-blue-600 text-white px-3 py-1 rounded-full">
            {project.status}
          </span>

          <div className="mt-6">

            <Link
              href={`/projects/${project.id}`}
              className="text-blue-600 font-semibold"
            >
              Open Project →
            </Link>

          </div>

        </div>

      ))}

    </div>
  );
}