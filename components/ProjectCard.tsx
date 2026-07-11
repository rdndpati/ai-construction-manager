import Link from "next/link";
import { Project } from "@/types/project";

type Props = {
  project: Project;
};

export default function ProjectCard({ project }: Props) {
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 cursor-pointer">
        <h2 className="text-2xl font-bold">
          {project.name}
        </h2>

        <div className="mt-4 space-y-2 text-gray-600">
          <p>
            <strong>Client:</strong> {project.client}
          </p>

          <p>
            <strong>Location:</strong> {project.location}
          </p>

          <p>
            <strong>Status:</strong> {project.status}
          </p>
        </div>
      </div>
    </Link>
  );
}