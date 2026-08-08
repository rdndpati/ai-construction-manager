"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;

  const links = [
    { name: "Dashboard", href: `/app/projects/${projectId}` },
    { name: "Drawings", href: `/app/projects/${projectId}/drawings` },
    { name: "RFIs", href: `/app/projects/${projectId}/rfis` },
    { name: "Activity", href: `/app/projects/${projectId}/activity` },
    { name: "Submittals", href: `/app/projects/${projectId}/submittals` },
    { name: "Punch List", href: `/app/projects/${projectId}/punchlist` },
    { name: "Documents", href: `/app/projects/${projectId}/documents` },
    { name: "Reports", href: `/app/projects/${projectId}/reports` },
    { name: "Settings", href: `/app/projects/${projectId}/settings` },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">

      <aside className="w-64 bg-slate-900 text-white p-6">

        <h1 className="text-2xl font-bold mb-8">
          AI Construction
        </h1>

        <nav className="space-y-2">

          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="block rounded-lg px-4 py-3 hover:bg-slate-700"
            >
              {link.name}
            </Link>
          ))}

        </nav>

      </aside>

      <main className="flex-1">
        {children}
      </main>

    </div>
  );
}