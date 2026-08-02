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
};

export default function DashboardOverview({
  stats,
}: DashboardProps) {
  return (
    <div className="p-8 space-y-8">

      {/* Header */}

      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-2xl shadow-lg p-8">

        <h1 className="text-4xl font-bold">
          Welcome Back 👋
        </h1>

        <p className="mt-3 text-blue-100 text-lg">
          Monitor Projects, Drawings, RFIs, Submittals and AI Reviews.
        </p>

      </div>

      {/* KPI Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        <DashboardCard
          title="Projects"
          value={stats.projects}
          icon="📁"
          href="/projects"
        />

        <DashboardCard
          title="Drawings"
          value={stats.drawings}
          icon="📄"
          href="/drawings"
        />

        <DashboardCard
          title="RFIs"
          value={stats.rfis}
          icon="❓"
          href="/rfis"
        />

        <DashboardCard
          title="Submittals"
          value={stats.submittals}
          icon="📑"
          href="/submittals"
        />

        <DashboardCard
          title="Specifications"
          value={stats.specifications}
          icon="📚"
          href="/specifications"
        />

        <DashboardCard
          title="Compliance"
          value={stats.compliance}
          icon="✅"
          href="/compliance"
        />

      </div>

      {/* Bottom */}

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="text-2xl font-bold mb-5">
            Recent Activity
          </h2>

          <div className="space-y-4">

            <div>📄 Drawing uploaded</div>

            <div>❓ New RFI created</div>

            <div>📑 Submittal submitted</div>

            <div>🤖 AI reviewed specification</div>

          </div>

        </div>

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="text-2xl font-bold mb-5">
            AI Insights
          </h2>

          <div className="space-y-4">

            <div>✅ Drawings ready for review</div>

            <div>✅ RFIs pending response</div>

            <div>✅ Specifications updated</div>

            <div>✅ Compliance reports generated</div>

          </div>

        </div>

      </div>

    </div>
  );
}

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