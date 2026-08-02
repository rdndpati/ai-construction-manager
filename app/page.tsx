"use client";
import { hasPermission } from "@/lib/permissions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Home() {
  const [canCreateProject, setCanCreateProject] = useState(false);

useEffect(() => {
  async function checkPermission() {
    const allowed = await hasPermission("Projects", "create");
    setCanCreateProject(allowed);
  }

  checkPermission();
}, []);
  const router = useRouter();
  const [stats, setStats] = useState({
    projects: 0,
  });

  useEffect(() => {
  checkUser();
}, []);

async function checkUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    router.push("/login");
    return;
  }

  loadDashboard();
}
  async function loadDashboard() {
    const response = await fetch("/api/dashboard");
    const data = await response.json();

    setStats({
      projects: data.projects,
    });
  }

  return (
    <main className="min-h-screen bg-gray-100">

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
        </div>

        {/* Projects Card */}
        <div className="bg-white rounded-xl shadow p-8">

          <div className="flex justify-between items-center">

            <div>

              <h2 className="text-3xl font-bold">
                📁 Projects
              </h2>

              <p className="text-6xl font-bold text-blue-600 mt-4">
                {stats.projects}
              </p>

            </div>

            <div className="flex gap-3">

  <Link
    href="/projects"
    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
  >
    View Projects →
  </Link>

  {canCreateProject && (
    <Link
      href="/projects/new"
      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
    >
      + New Project
    </Link>
  )}

</div>

          </div>

        </div>

        {/* Project Progress */}
        <div className="bg-white rounded-xl shadow p-8">

          <h2 className="text-3xl font-bold mb-8">
            Project Progress
          </h2>

          <div className="space-y-8">

            <div>

              <div className="flex justify-between mb-2">

                <span className="font-semibold">
                  Hillsboro Solar
                </span>

                <span>67%</span>

              </div>

              <div className="w-full bg-gray-200 rounded-full h-4">

                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: "67%" }}
                />

              </div>

            </div>

            <div>

              <div className="flex justify-between mb-2">

                <span className="font-semibold">
                  Memphis Substation
                </span>

                <span>82%</span>

              </div>

              <div className="w-full bg-gray-200 rounded-full h-4">

                <div
                  className="bg-green-600 h-4 rounded-full"
                  style={{ width: "82%" }}
                />

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}