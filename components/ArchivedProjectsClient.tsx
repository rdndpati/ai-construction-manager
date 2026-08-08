"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Project = {
  id: string;
  name: string;
  client: string;
  location: string;
};

export default function ArchivedProjectsClient({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const [projects, setProjects] = useState(initialProjects);

  async function restoreProject(id: string) {
    const confirmed = window.confirm(
      "Restore this project?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("projects")
      .update({
        archived: false,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  async function deleteProject(id: string) {
    const confirmed = window.confirm(
      "Permanently delete this project?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-bold">
          No Archived Projects
        </h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

          <div className="flex gap-3 mt-6">

            <button
              onClick={() => restoreProject(project.id)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Restore
            </button>

            <button
              onClick={() => deleteProject(project.id)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Delete
            </button>

          </div>
        </div>
      ))}
    </div>
  );
}