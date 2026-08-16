"use client";

import Link from "next/link";

type DashboardProps = {
  stats: {
    projects: number;
    drawings: number;
    rfis: number;
    submittals: number;
    specifications: number;
    compliance: number;
  };

  // "company" for Owner/Admin
  // "assigned" for regular employees
  scope?: "company" | "assigned";

  // Optional project progress information
  projectProgress?: {
    id: string;
    name: string;
    type?: string | null;
    progress: number;
  }[];
};

export default function DashboardOverview({
  stats,
  scope = "company",
  projectProgress = [],
}: DashboardProps) {
  const isEmployee = scope === "assigned";

  return (
    <div className="p-8 space-y-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-2xl shadow-lg p-8">

        <h1 className="text-4xl font-bold">
          Welcome Back 👋
        </h1>

        <p className="mt-3 text-blue-100 text-lg">
          {isEmployee
            ? "Monitor your assigned construction projects."
            : "Monitor your company's construction projects."}
        </p>

      </div>


      {/* =====================================================
          PROJECT SUMMARY
      ===================================================== */}

      <div className="bg-white rounded-2xl shadow p-7">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <div className="flex items-center gap-3">

              <span className="text-3xl">
                📁
              </span>

              <h2 className="text-2xl font-bold">
                Projects
              </h2>

            </div>

            <p className="text-gray-500 mt-2">

              {isEmployee
                ? "Projects assigned to you"
                : "Active projects for your company"}

            </p>

          </div>

          <Link
            href="/app/projects"
            className="text-blue-600 font-medium hover:underline"
          >
            View Projects →
          </Link>

        </div>


        <div className="mt-5">

          <p className="text-5xl font-bold text-blue-700">
            {stats.projects}
          </p>

          <p className="text-gray-500 mt-1">
            {isEmployee
              ? "Assigned projects"
              : "Active projects"}
          </p>

        </div>

      </div>


      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        <DashboardCard
          title="Projects"
          value={stats.projects}
          icon="📁"
          href="/app/projects"
        />

        <DashboardCard
          title="Drawings"
          value={stats.drawings}
          icon="📄"
          href="/app/projects"
        />

        <DashboardCard
          title="RFIs"
          value={stats.rfis}
          icon="❓"
          href="/app/rfis"
        />

        <DashboardCard
          title="Submittals"
          value={stats.submittals}
          icon="📑"
          href="/app/submittals"
        />

        <DashboardCard
          title="Specifications"
          value={stats.specifications}
          icon="📚"
          href="/app/specifications"
        />

        <DashboardCard
          title="Compliance"
          value={stats.compliance}
          icon="✅"
          href="/app/compliance"
        />

      </div>


      {/* =====================================================
          PROJECT PROGRESS
      ===================================================== */}

      <div className="bg-white rounded-2xl shadow p-7">

        <div className="flex items-center justify-between mb-6">

          <div>

            <h2 className="text-2xl font-bold">
              Project Progress
            </h2>

            <p className="text-gray-500 mt-1">
              {isEmployee
                ? "Progress for your assigned projects"
                : "Progress for your company's active projects"}
            </p>

          </div>

          <Link
            href="/app/projects"
            className="text-blue-600 font-medium hover:underline"
          >
            View All →
          </Link>

        </div>


        {projectProgress.length > 0 ? (

          <div className="space-y-6">

            {projectProgress.map((project) => (

              <Link
                key={project.id}
                href={`/app/projects/${project.id}`}
                className="block group"
              >

                <div className="flex items-center justify-between mb-2">

                  <div>

                    <span className="font-medium text-gray-900 group-hover:text-blue-600">
                      {project.name}
                    </span>

                    {project.type && (
                      <span className="ml-3 text-sm text-gray-500">
                        {project.type}
                      </span>
                    )}

                  </div>

                  <div className="text-right">

                    <span className="font-semibold text-gray-700">
                      {project.progress}%
                    </span>

                    <p className="text-xs text-gray-400">
                      {getProgressLabel(project.progress)}
                    </p>

                  </div>

                </div>


                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">

                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(
                      project.progress
                    )}`}
                    style={{
                      width: `${Math.min(
                        Math.max(project.progress, 0),
                        100
                      )}%`,
                    }}
                  />

                </div>

              </Link>

            ))}

          </div>

        ) : (

          <div className="py-10 text-center">

            <div className="text-4xl">
              📁
            </div>

            <p className="mt-3 font-medium text-gray-700">
              {isEmployee
                ? "No projects assigned to you"
                : "No active projects"}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              {isEmployee
                ? "Projects assigned to your account will appear here."
                : "Create a project to start managing construction work."}
            </p>

          </div>

        )}

      </div>


      {/* =====================================================
          RECENT ACTIVITY + AI INSIGHTS
      ===================================================== */}

      <div className="grid lg:grid-cols-2 gap-6">


        {/* Recent Activity */}

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="text-2xl font-bold mb-5">
            Recent Activity
          </h2>

          <div className="space-y-4 text-gray-700">

            <div className="flex items-center gap-3">
              <span>📄</span>
              <span>Drawing uploaded</span>
            </div>

            <div className="flex items-center gap-3">
              <span>❓</span>
              <span>New RFI created</span>
            </div>

            <div className="flex items-center gap-3">
              <span>📑</span>
              <span>Submittal submitted</span>
            </div>

            <div className="flex items-center gap-3">
              <span>🤖</span>
              <span>AI reviewed specification</span>
            </div>

          </div>

        </div>


        {/* AI Insights */}

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="text-2xl font-bold mb-5">
            AI Insights
          </h2>

          <div className="space-y-4 text-gray-700">

            <div className="flex items-center gap-3">
              <span>✅</span>
              <span>Drawings ready for review</span>
            </div>

            <div className="flex items-center gap-3">
              <span>✅</span>
              <span>RFIs pending response</span>
            </div>

            <div className="flex items-center gap-3">
              <span>✅</span>
              <span>Specifications updated</span>
            </div>

            <div className="flex items-center gap-3">
              <span>✅</span>
              <span>Compliance reports generated</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   DASHBOARD CARD
========================================================= */

function DashboardCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: number;
  icon: string;
  href: string;
}) {
  return (
    <Link href={href}>

      <div className="bg-white rounded-xl shadow hover:shadow-xl transition cursor-pointer p-6">

        <div className="text-5xl">
          {icon}
        </div>

        <h2 className="mt-5 text-xl font-semibold">
          {title}
        </h2>

        <p className="text-4xl font-bold mt-3 text-blue-700">
          {value}
        </p>

      </div>

    </Link>
  );
}


/* =========================================================
   PROGRESS LABEL
========================================================= */

function getProgressLabel(progress: number) {

  if (progress >= 90) {
    return "Near Completion";
  }

  if (progress >= 60) {
    return "In Progress";
  }

  if (progress >= 30) {
    return "In Progress";
  }

  return "Not Started";
}


/* =========================================================
   PROGRESS BAR COLOR
========================================================= */

function getProgressColor(progress: number) {

  if (progress >= 90) {
    return "bg-green-500";
  }

  if (progress >= 60) {
    return "bg-blue-600";
  }

  if (progress >= 30) {
    return "bg-yellow-500";
  }

  return "bg-gray-300";
}