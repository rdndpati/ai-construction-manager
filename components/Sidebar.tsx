import Link from "next/link";

export default function Sidebar() {
  const menu = [
  { name: "🏠 Dashboard", href: "/" },
  { name: "📁 Projects", href: "/app/projects" },
  { name: "👥 Company", href: "/app/company" },
  { name: "📋 RFI Management", href: "/app/rfis" },
  { name: "📦 TBPs", href: "/tbps" },
  { name: "📄 Submittals", href: "/app/submittals" },

  // 👇 Add this
  { name: "📚 Specifications", href: "/app/specifications" },
  {name: "✅ Compliance Checker",href: "/app/compliance",},
  

  
  { name: "🤖 AI Assistant", href: "/ai" },
  
  { name: "⚙️ Settings", href: "/settings" },
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