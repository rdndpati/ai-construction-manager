"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SpecificationsPage() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");

  useEffect(() => {
  loadProjects();
  loadRequirements();
}, []);
useEffect(() => {
  if (selectedProject) {
    loadRequirements();
  }
}, [selectedProject]);

  async function loadRequirements() {
    const { data, error } = await supabase
  .from("specifications")
  .select("*")
  .eq("project_id", selectedProject)
  .order("created_at");

    if (!error && data) {
      setRequirements(data);
    }
  }
  async function loadProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .order("name");

  if (!error && data) {
    setProjects(data);

    if (data.length > 0) {
      setSelectedProject(data[0].id);
    }
  }
}
  async function uploadSpecification(
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file = event.target.files?.[0];

  if (!file) return;

  setUploading(true);

  try {
    const formData = new FormData();

    formData.append("file", file);

    // Replace this with a real project ID later
    formData.append("projectId", selectedProject);

    const response = await fetch("/api/ai/specification", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    await loadRequirements();

    alert("Specification uploaded successfully!");

  } catch (err) {
    console.error(err);
    alert("Upload failed.");
  } finally {
    setUploading(false);
  }
}

  return (
    <main className="max-w-7xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">
        📚 Project Specifications
      </h1>
      <div className="mb-4">
  <label className="block text-sm font-medium mb-2">
    Project
  </label>

  <select
    value={selectedProject}
    onChange={(e) => setSelectedProject(e.target.value)}
    className="border rounded-lg p-2 w-80"
  >
    {projects.map((project) => (
      <option key={project.id} value={project.id}>
        {project.name}
      </option>
    ))}
  </select>
</div>
      <div className="mb-6">
  <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
    {uploading ? "Uploading..." : "Upload Specification PDF"}

    <input
      type="file"
      accept=".pdf"
      className="hidden"
      onChange={uploadSpecification}
      disabled={uploading}
    />
  </label>
</div>

      <div className="overflow-x-auto border rounded-lg">

        <table className="w-full">

          <tbody>
  {requirements.map((item) => (
    <tr key={item.id} className="border-t">
      <td className="p-3">
        {item.requirement}
      </td>
    </tr>
  ))}
</tbody>

          <tbody>

            {requirements.map((item) => (

              <tr key={item.id} className="border-t">

                <td className="p-3">
                  {item.section_number}
                </td>

                <td className="p-3">
                  {item.title}
                </td>

                <td className="p-3">
                  {item.category}
                </td>

                <td className="p-3">
                  {item.requirement}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}