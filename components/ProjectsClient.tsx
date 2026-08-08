"use client";

import { useEffect, useState } from "react";
import { Archive } from "lucide-react";
import EditProjectDialog from "@/components/EditProjectDialog";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Project = {
  id: string;
  name: string;
  client: string;
  location: string;
  status: string;
  progress: number;
};

export default function ProjectsClient({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const [projects, setProjects] = useState(initialProjects);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("CLIENT USER:", user);
    }

    checkUser();
  }, []);

  async function deleteProject(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
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
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold">No Projects Found</h2>
        <p className="text-gray-500 mt-2">
          Create your first project.
        </p>
      </div>
    );
  }
async function archiveProject(id: string) {
  const confirmed = window.confirm(
    "Archive this project?"
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("projects")
    .update({
      archived: true,
    })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  setProjects((prev) =>
    prev.filter((p) => p.id !== id)
  );
}
  return (
    <div className="space-y-6">
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-white rounded-xl shadow p-6"
        >
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold">
              {project.name}
            </h2>

            <div className="flex items-center gap-2">

  <EditProjectDialog
    project={project}
    onUpdated={() => window.location.reload()}
  />

  <button
    onClick={() => archiveProject(project.id)}
    className="text-yellow-600 hover:text-yellow-800"
    title="Archive Project"
  >
    <Archive size={20} />
  </button>

  <button
    onClick={() => deleteProject(project.id)}
    className="text-red-600 hover:text-red-800"
    title="Delete Project"
  >
    <Trash2 size={20} />
  </button>

</div>
          </div>

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
              href={`/app/projects/${project.id}`}
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