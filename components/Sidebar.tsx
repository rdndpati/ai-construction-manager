import Link from "next/link";

export default function Sidebar() {
  const menu = [
    { name: "Dashboard", href: "/" },
    { name: "Projects", href: "/projects" },
    { name: "Drawings", href: "/drawings" },
    { name: "RFIs", href: "/rfis" },
    { name: "TBPs", href: "/tbps" },
    { name: "Submittals", href: "/submittals" },
    { name: "IFC Revisions", href: "/ifc-revisions" },
    { name: "AI Assistant", href: "/ai" },
    { name: "Reports", href: "/reports" },
    { name: "Settings", href: "/settings" },
  ];

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-8">
        AI Construction Manager
      </h1>

      <nav className="space-y-2">
        {menu.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="block px-4 py-3 rounded-lg hover:bg-slate-700 transition"
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}