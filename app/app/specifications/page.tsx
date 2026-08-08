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
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadRequirements();
    }
  }, [selectedProject]);

  async function loadProjects() {
    // Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.company_id) {
      console.error(profileError);
      return;
    }

    // Load only this company's projects
    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .eq("company_id", profile.company_id)
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setProjects(data ?? []);

    if (data && data.length > 0) {
      setSelectedProject(data[0].id);
    }
  }

  async function loadRequirements() {
    if (!selectedProject) return;

    const { data, error } = await supabase
      .from("specifications")
      .select("*")
      .eq("project_id", selectedProject)
      .order("created_at");

    if (error) {
      console.error(error);
      return;
    }

    setRequirements(data ?? []);
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

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Project
        </label>

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="border rounded-lg p-2 w-80"
        >
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

      <div className="mb-6">
        <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">

          {uploading
            ? "Uploading..."
            : "Upload Specification PDF"}

          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={uploadSpecification}
            disabled={uploading}
          />

        </label>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="p-4 text-left">
                Section
              </th>

              <th className="p-4 text-left">
                Title
              </th>

              <th className="p-4 text-left">
                Category
              </th>

              <th className="p-4 text-left">
                Requirement
              </th>

            </tr>

          </thead>

          <tbody>

            {requirements.length > 0 ? (

              requirements.map((item) => (

                <tr
                  key={item.id}
                  className="border-t hover:bg-gray-50"
                >

                  <td className="p-4">
                    {item.section_number}
                  </td>

                  <td className="p-4">
                    {item.title}
                  </td>

                  <td className="p-4">
                    {item.category}
                  </td>

                  <td className="p-4">
                    {item.requirement}
                  </td>

                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan={4}
                  className="text-center p-8 text-gray-500"
                >
                  No specifications found for this project.
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </main>
  );
}