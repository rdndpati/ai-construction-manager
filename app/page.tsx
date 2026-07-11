export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Top Bar */}
      <header className="bg-blue-700 text-white px-8 py-5 shadow">
        <h1 className="text-3xl font-bold">
          AI Construction Manager
        </h1>

        <p className="text-blue-100">
          Engineering Project Management Platform
        </p>
      </header>

      {/* Dashboard */}
      <div className="p-8">
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-2xl font-bold">
            Welcome Back 👋
          </h2>

          <p className="text-gray-600 mt-2">
            Monitor RFIs, Drawings, TBPs and Project Progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card title="Projects" value="12 Active" emoji="📁" />
          <Card title="Drawings" value="1,248 Files" emoji="📄" />
          <Card title="RFIs" value="18 Open" emoji="❓" />
          <Card title="TBPs" value="7 Packages" emoji="📦" />
          <Card title="IFC Revisions" value="24 Changes" emoji="🔄" />
          <Card title="AI Assistant" value="Ready" emoji="🤖" />
        </div>
      </div>
    </main>
  );
}

function Card({
  title,
  value,
  emoji,
}: {
  title: string;
  value: string;
  emoji: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition p-6">
      <div className="text-5xl">{emoji}</div>

      <h2 className="text-xl font-bold mt-4">{title}</h2>

      <p className="text-gray-600 mt-2">{value}</p>
    </div>
  );
}