"use client";

import { useState } from "react";
import { Project } from "@/types/project";
import ProjectCard from "./ProjectCard";
import NewProjectDialog from "./NewProjectDialog";

type Props = {
  initialProjects: Project[];
};

export default function ProjectsClient({
  initialProjects,
}: Props) {
  const [projects, setProjects] = useState(initialProjects);

  function refreshProjects() {
    window.location.reload();
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <NewProjectDialog
          onCreated={refreshProjects}
        />
      </div>

      <div className="grid gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
          />
        ))}
      </div>
    </>
  );
}