"use client";

import { useState } from "react";

export default function ProjectAccessPage() {
  const [projects] = useState<any[]>([]);
  const [members] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");

  function toggleProject(member: any) {
    console.log("Toggle project access:", member);
    // We'll connect this to Supabase next.
  }

  return (
    <main className="max-w-7xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">
        Project Access
      </h1>

      {/* Project Selector */}

      <div className="bg-white rounded-xl shadow p-6 mb-6">

        <label className="font-semibold mr-4">
          Select Project
        </label>

        <select
          className="border rounded-lg p-3"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">Choose Project</option>

          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.name}
            </option>
          ))}

        </select>

      </div>

      {/* Team Members */}

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="text-left p-4">
                User
              </th>

              <th className="text-left p-4">
                Role
              </th>

              <th className="text-left p-4">
                Access
              </th>

            </tr>

          </thead>

          <tbody>

            {members.length === 0 && (

              <tr>

                <td
                  colSpan={3}
                  className="text-center p-8 text-gray-500"
                >
                  No users found.
                </td>

              </tr>

            )}

            {members.map((member) => (

              <tr
                key={member.id}
                className="border-t"
              >

                <td className="p-4">
                  {member.full_name}
                </td>

                <td className="p-4">
                  {member.roles?.name}
                </td>

                <td className="p-4">

                  <input
                    type="checkbox"
                    checked={member.assigned || false}
                    onChange={() => toggleProject(member)}
                  />

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}