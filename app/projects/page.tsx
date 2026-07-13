import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProjectCard from "@/components/ProjectCard";

export default async function ProjectsPage() {
  const { data: projects, error } = await supabase
  .from("projects")
  .select("*");

console.log("Projects:", projects);
console.log("Error:", error);

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">
          Error Loading Projects
        </h1>

        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <div className="flex justify-between items-center">

        <h1 className="text-4xl font-bold">
          Projects
        </h1>

        <Link
          href="/"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          Dashboard
        </Link>

      </div>

      <div className="grid gap-6 mt-8">

        {projects?.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
          />
        ))}

      </div>

    </main>
  );
}