"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function RFIsPage() {
  const [rfis, setRFIs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");

  useEffect(() => {
    loadRFIs();
  }, []);

  async function loadRFIs() {
  const [{ data: rfiData }, { data: projectData }] =
    await Promise.all([
      supabase
        .from("rfis")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("projects")
        .select("id,name")
        .order("name"),
    ]);

  setRFIs(rfiData ?? []);
  setProjects(projectData ?? []);

  if (projectData?.length) {
    setSelectedProject(projectData[0].id);
  }

  setLoading(false);
}

  if (loading) {
    return (
      <div className="p-8 text-lg">
        Loading RFIs...
      </div>
    );
  }
  const filteredRFIs = rfis.filter((rfi) => {
  const matchesProject =
    selectedProject === "" ||
    rfi.project_id === selectedProject;

  const matchesSearch =
    rfi.rfi_number?.toLowerCase().includes(search.toLowerCase()) ||
    rfi.title?.toLowerCase().includes(search.toLowerCase());

  const matchesStatus =
    statusFilter === "All" ||
    rfi.status === statusFilter;

  const matchesPriority =
    priorityFilter === "All" ||
    rfi.priority === priorityFilter;

  return (
    matchesProject &&
    matchesSearch &&
    matchesStatus &&
    matchesPriority
  );
});

  return (
  <div className="p-8">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold">
        RFI Management
      </h1>

      <span className="text-gray-500">
        Total RFIs: {rfis.length}
      </span>
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-50 border rounded-lg p-4">
        <p className="text-sm text-gray-500">Total RFIs</p>
        <p className="text-3xl font-bold">{rfis.length}</p>
      </div>

      <div className="bg-yellow-50 border rounded-lg p-4">
        <p className="text-sm text-gray-500">Open</p>
        <p className="text-3xl font-bold">
          {rfis.filter((r) => r.status === "Open").length}
        </p>
      </div>

      <div className="bg-orange-50 border rounded-lg p-4">
        <p className="text-sm text-gray-500">In Review</p>
        <p className="text-3xl font-bold">
          {rfis.filter((r) => r.status === "In Review").length}
        </p>
      </div>

      <div className="bg-green-50 border rounded-lg p-4">
        <p className="text-sm text-gray-500">Closed</p>
        <p className="text-3xl font-bold">
          {rfis.filter((r) => r.status === "Closed").length}
        </p>
      </div>
    </div>

    {/* Filters */}
    <div className="flex gap-4 mb-6">
      <input
        type="text"
        placeholder="Search RFI..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 border rounded-lg px-4 py-2"
      />

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border rounded-lg px-4 py-2"
      >
        <option>All</option>
        <option>Open</option>
        <option>In Review</option>
        <option>Closed</option>
      </select>

      <select
        value={priorityFilter}
        onChange={(e) => setPriorityFilter(e.target.value)}
        className="border rounded-lg px-4 py-2"
      >
        <option>All</option>
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
        <option>Critical</option>
      </select>
    </div>

    {/* Layout */}
    <div className="grid grid-cols-12 gap-6">

      {/* Left */}
      <div className="col-span-3 bg-white border rounded-xl">

        <h2 className="font-bold text-lg p-4 border-b">
          Projects
        </h2>

        {projects.map((project) => {
          const count = rfis.filter(
            (r) => r.project_id === project.id
          ).length;

          return (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project.id)}
              className={`w-full flex justify-between items-center p-4 border-b hover:bg-gray-100 ${
                selectedProject === project.id
                  ? "bg-blue-100 font-semibold"
                  : ""
              }`}
            >
              <span>📁 {project.name}</span>
              <span className="text-sm bg-blue-600 text-white rounded-full px-2">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right */}
      <div className="col-span-9">

        <div className="overflow-auto rounded-lg border bg-white">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>
                <th className="text-left p-3">RFI #</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Priority</th>
                <th className="text-left p-3">Due Date</th>
                <th className="text-left p-3">Action</th>
              </tr>

            </thead>

            <tbody>

              {filteredRFIs.map((rfi) => (

                <tr
                  key={rfi.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3">{rfi.rfi_number}</td>
                  <td className="p-3">{rfi.title}</td>
                  <td className="p-3">{rfi.status}</td>
                  <td className="p-3">{rfi.priority}</td>
                  <td className="p-3">{rfi.due_date}</td>

                  <td className="p-3">
                    <Link
                      href={`/projects/${rfi.project_id}/rfis/${rfi.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  </div>
);
}