export default function ProjectsPage() {
  const projects = [
    {
      name: "Hillsboro Solar",
      status: "Construction",
      rfis: 18,
      drawings: 1248,
    },
    {
      name: "Texas Solar Farm",
      status: "Engineering",
      rfis: 9,
      drawings: 856,
    },
    {
      name: "Memphis Substation",
      status: "Design",
      rfis: 4,
      drawings: 310,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-8">
        Projects
      </h1>

      <div className="space-y-6">
        {projects.map((project) => (
          <div
            key={project.name}
            className="bg-white rounded-xl shadow p-6"
          >
            <h2 className="text-2xl font-bold">
              {project.name}
            </h2>

            <p className="text-gray-600 mt-2">
              Status: {project.status}
            </p>

            <div className="flex gap-10 mt-4">
              <p>📄 Drawings: {project.drawings}</p>
              <p>❓ RFIs: {project.rfis}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}