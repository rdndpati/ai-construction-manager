"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SubmittalsPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const [submittals, setSubmittals] = useState<any[]>([]);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
});

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    loadSubmittals();
  }, [projectId]);

  async function loadSubmittals() {
    setLoading(true);

    let query = supabase
      .from("submittals")
      .select(`
  *,
  projects (
    name
  )
`)

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (!error && data) {
      setSubmittals(data);
    }
    if (data) {
  setStats({
    total: data.length,
    pending: data.filter(s => s.status === "Pending").length,
    approved: data.filter(s => s.status === "Approved").length,
    rejected: data.filter(s => s.status === "Rejected").length,
  });
}

    if (projectId) {
      const { data: project } = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();

      if (project) {
        setProjectName(project.name);
      }
    } else {
      setProjectName("");
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-8 text-lg">
        Loading Submittals...
      </div>
    );
  }

  return (
    <main className="p-8">

      <div className="flex justify-between items-center mb-6">

        <div>
          <h1 className="text-3xl font-bold">
            {projectName
              ? `${projectName} Submittals`
              : "Submittal Management"}
          </h1>

          {projectName && (
            <p className="text-gray-500 mt-1">
              Showing submittals for this project
            </p>
          )}
        </div>

        <Link
          href={
            projectId
              ? `/submittals/new?project=${projectId}`
              : "/submittals/new"
          }
          className="bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          + New Submittal
        </Link>

      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">

  <div className="bg-white rounded-lg shadow p-5">
    <p className="text-gray-500">Total</p>
    <h2 className="text-3xl font-bold">{stats.total}</h2>
  </div>

  <div className="bg-yellow-50 rounded-lg shadow p-5">
    <p className="text-gray-500">Pending</p>
    <h2 className="text-3xl font-bold">
      {stats.pending}
    </h2>
  </div>

  <div className="bg-green-50 rounded-lg shadow p-5">
    <p className="text-gray-500">Approved</p>
    <h2 className="text-3xl font-bold">
      {stats.approved}
    </h2>
  </div>

  <div className="bg-red-50 rounded-lg shadow p-5">
    <p className="text-gray-500">Rejected</p>
    <h2 className="text-3xl font-bold">
      {stats.rejected}
    </h2>
  </div>

</div>
<div className="flex gap-4 mb-6">

  <input
    type="text"
    placeholder="Search Submittals..."
    className="border rounded-lg p-3 flex-1"
    value={search}
    onChange={(e)=>setSearch(e.target.value)}
  />

  <select
    className="border rounded-lg p-3"
    value={statusFilter}
    onChange={(e)=>setStatusFilter(e.target.value)}
  >
    <option>All</option>
    <option>Pending</option>
    <option>Approved</option>
    <option>Rejected</option>
    <option>In Review</option>
  </select>

</div>

      <div className="overflow-auto rounded-lg border bg-white">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>
                <th className="text-left p-3">Project</th>
              <th className="text-left p-3">Submittal #</th>
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Vendor</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Reviewer</th>
              <th className="text-left p-3">Due Date</th>
              <th className="text-left p-3">Action</th>
            </tr>

          </thead>

          <tbody>

            {submittals.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-center p-8 text-gray-500"
                >
                  No submittals found.
                </td>
              </tr>
            )}

            {submittals
.filter((s)=>{

const matchesSearch =
s.title.toLowerCase().includes(search.toLowerCase()) ||
s.vendor.toLowerCase().includes(search.toLowerCase()) ||
s.submittal_number.toLowerCase().includes(search.toLowerCase());

const matchesStatus =
statusFilter==="All" ||
s.status===statusFilter;

return matchesSearch && matchesStatus;

})
.map((s)=>(

              <tr
                key={s.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-3">
    {s.projects?.name ?? "-"}
  </td>

                <td className="p-3">
                  {s.submittal_number}
                </td>

                <td className="p-3">
                  {s.title}
                </td>

                <td className="p-3">
                  {s.vendor}
                </td>

                <td className="p-3">
                  {s.status}
                </td>

                <td className="p-3">
                  {s.reviewer}
                </td>

                <td className="p-3">
                  {s.due_date}
                </td>

                <td className="p-3">
                 <Link
  href={
    projectId
      ? `/submittals/${s.id}?project=${projectId}`
      : `/submittals/${s.id}`
  }
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

    </main>
  );
}