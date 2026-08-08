"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CompliancePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

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

  if (data) {
    setProjects(data);

    if (data.length > 0) {
      setSelectedProject(data[0].id);
    }
  }
}
  async function uploadSubmittal(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("projectId", selectedProject);

      const response = await fetch(
        "/api/ai/compliance",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      setReport(result.report);

    } catch (err) {
      console.error(err);
      alert("Compliance check failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">
        🤖 AI Compliance Checker
      </h1>

      <div className="mb-6">

        <label className="block mb-2 font-medium">
          Project
        </label>

        <select
          value={selectedProject}
          onChange={(e) =>
            setSelectedProject(e.target.value)
          }
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

      <div className="mb-8">

        <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">

          {uploading
            ? "Analyzing..."
            : "Upload Equipment Submittal"}

          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={uploadSubmittal}
          />

        </label>

      </div>

      <div className="border rounded-lg p-6 bg-white">

        <h2 className="text-xl font-semibold mb-4">
          AI Compliance Report
        </h2>

        <pre className="whitespace-pre-wrap">
          {report}
        </pre>

      </div>

    </main>
  );
}