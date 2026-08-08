"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Project = {
  id: string;
  name: string;
  status: string;
  company_id: string;
  archived: boolean;
  progress?: number | null;
};

export default function Home() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      // 1. Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      // 2. Get user's company
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);
        setError("Unable to load your company.");
        return;
      }

      // 3. Make sure user has a company
      if (!profile?.company_id) {
        router.replace("/create-company");
        return;
      }

      console.log("=================================");
      console.log("DASHBOARD SECURITY CHECK");
      console.log("USER:", user.id);
      console.log("COMPANY:", profile.company_id);
      console.log("=================================");

      // 4. Get company name
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", profile.company_id)
        .single();

      if (company) {
        setCompanyName(company.name);
      }

      // 5. Get ONLY this company's active projects
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("archived", false)
        .order("created_at", { ascending: false });

      if (projectError) {
        console.error("PROJECT ERROR:", projectError);
        setError(projectError.message);
        return;
      }

      console.log("COMPANY PROJECTS:", projectData);

      setProjects(projectData ?? []);
    } catch (err) {
      console.error("DASHBOARD ERROR:", err);
      setError("Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  function getProgress(project: Project) {
    if (typeof project.progress === "number") {
      return Math.max(0, Math.min(100, project.progress));
    }

    // Temporary progress based on project status
    switch (project.status) {
      case "Planning":
        return 10;

      case "Engineering":
        return 40;

      case "Construction":
        return 67;

      case "Commissioning":
        return 90;

      case "Completed":
        return 100;

      default:
        return 0;
    }
  }

  function getProgressLabel(progress: number) {
    if (progress >= 100) return "Completed";
    if (progress >= 75) return "Near Completion";
    if (progress >= 50) return "In Progress";
    if (progress > 0) return "Started";
    return "Not Started";
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-blue-700 text-white px-8 py-6 shadow">
        <h1 className="text-3xl font-bold">
          AI Construction Manager
        </h1>

        <p className="text-blue-100 mt-1">
          Engineering Project Management Platform
        </p>
      </header>

      <div className="max-w-7xl mx-auto p-8 space-y-8">

        {/* Welcome */}
        <div className="bg-white rounded-xl shadow p-8">
          <h2 className="text-4xl font-bold">
            Welcome Back 👋
          </h2>

          <p className="text-gray-600 mt-2">
            Monitor your construction projects.
          </p>

          {companyName && (
            <p className="text-blue-600 font-semibold mt-4">
              Company: {companyName}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-5">
            {error}
          </div>
        )}

        {/* Projects Summary */}
        <Link
          href="/app/projects"
          className="block bg-white rounded-xl shadow p-8 hover:shadow-lg hover:border-blue-300 border border-transparent transition"
        >
          <div className="flex justify-between items-center">

            <div>
              <h2 className="text-3xl font-bold">
                📁 Projects
              </h2>

              <p className="text-6xl font-bold text-blue-600 mt-4">
                {loading ? "..." : projects.length}
              </p>

              <p className="text-gray-500 mt-2">
                Active projects for your company
              </p>
            </div>

            <div className="text-blue-600 font-semibold">
              View Projects →
            </div>

          </div>
        </Link>

        {/* Project Progress */}
        <div className="bg-white rounded-xl shadow p-8">

          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">
                Project Progress
              </h2>

              <p className="text-gray-500 mt-1">
                Progress for your company's active projects
              </p>
            </div>

            <Link
              href="/app/projects"
              className="text-blue-600 font-semibold hover:underline"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <p className="text-gray-500">
              Loading projects...
            </p>
          ) : projects.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">
                No active projects yet.
              </p>

              <Link
                href="/app/projects"
                className="inline-block mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Project
              </Link>
            </div>
          ) : (
            <div className="space-y-8">

              {projects.map((project) => {
                const progress = getProgress(project);

                return (
                  <div key={project.id}>

                    <div className="flex justify-between items-center mb-2">

                      <div>
                        <span className="font-semibold">
                          {project.name}
                        </span>

                        <span className="ml-3 text-sm text-gray-500">
                          {project.status}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-semibold">
                          {progress}%
                        </span>

                        <p className="text-xs text-gray-500">
                          {getProgressLabel(progress)}
                        </p>
                      </div>

                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">

                      <div
                        className={`h-4 rounded-full transition-all ${
                          progress >= 100
                            ? "bg-green-600"
                            : progress >= 75
                            ? "bg-green-500"
                            : progress >= 50
                            ? "bg-blue-600"
                            : "bg-yellow-500"
                        }`}
                        style={{
                          width: `${progress}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </div>

    </main>
  );
}