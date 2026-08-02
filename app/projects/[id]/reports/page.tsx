import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ReportsPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="p-8">

      <h1 className="text-4xl font-bold mb-2">
        Reports
      </h1>

      <p className="text-gray-600 mb-8">
        Project Reports & Analytics
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        <ReportCard
          title="RFI Reports"
          href={`/projects/${id}/reports/rfis`}
          icon="❓"
        />

        <ReportCard
          title="Submittal Reports"
          href={`/projects/${id}/reports/submittals`}
          icon="📑"
        />

        <ReportCard
          title="Drawing Reports"
          href={`/projects/${id}/reports/drawings`}
          icon="📐"
        />

        <ReportCard
          title="Specification Reports"
          href={`/projects/${id}/reports/specifications`}
          icon="📚"
        />

        <ReportCard
          title="Compliance Reports"
          href={`/projects/${id}/reports/compliance`}
          icon="✅"
        />

        <ReportCard
          title="Procurement"
          href={`/projects/${id}/reports/procurement`}
          icon="🚚"
        />

        <ReportCard
          title="Schedule"
          href={`/projects/${id}/reports/schedule`}
          icon="📅"
        />

        <ReportCard
          title="Executive Dashboard"
          href={`/projects/${id}/reports/executive`}
          icon="📊"
        />

      </div>

    </main>
  );
}

function ReportCard({
  title,
  href,
  icon,
}: {
  title: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl shadow hover:shadow-lg transition p-6"
    >
      <div className="text-5xl">{icon}</div>

      <h2 className="text-xl font-bold mt-4">
        {title}
      </h2>
    </Link>
  );
}