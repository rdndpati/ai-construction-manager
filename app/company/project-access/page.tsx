"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProjectAccessPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProjects();
    loadMembers();
  }, []);
  useEffect(() => {
  if (selectedProject) {
    loadAssignments();
  }
}, [selectedProject]);

  async function loadProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("name");
  console.log("Projects Data:", data);
  console.log("Projects Error:", error);

    console.log("Projects:", data);
    console.log(error);

    if (data) {
      setProjects(data);

      if (data.length > 0) {
        setSelectedProject(data[0].id);
      }
    }
  }

  async function loadMembers() {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        roles(name)
      `)
      .order("full_name");

    console.log("Members:", data);
    console.log(error);

    if (data) {
      setMembers(data);
    }
  }
  async function loadAssignments() {
  const { data, error } = await supabase
    .from("project_members")
    .select("profile_id")
    .eq("project_id", selectedProject);

  if (error) {
    console.log(error);
    return;
  }

  setAssignedUsers(data.map((x) => x.profile_id));
}
async function toggleProject(member: any) {

  const assigned = assignedUsers.includes(member.id);

  if (assigned) {

    await supabase
      .from("project_members")
      .delete()
      .eq("project_id", selectedProject)
      .eq("profile_id", member.id);

  } else {

    await supabase
      .from("project_members")
      .insert({
        project_id: selectedProject,
        profile_id: member.id,
        role: member.roles?.name,
      });

  }

  loadAssignments();
}
async function grantAllAccess() {
  for (const member of members) {
    if (!assignedUsers.includes(member.id)) {
      const { error } = await supabase
        .from("project_members")
        .insert({
          project_id: selectedProject,
          profile_id: member.id,
          role: member.roles?.name,
        });

      if (error) {
        console.log(error);
      }
    }
  }

  loadAssignments();
}
async function removeAllAccess() {
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", selectedProject);

  if (error) {
    console.log(error);
    return;
  }

  loadAssignments();
}


  return (
    <main className="max-w-7xl mx-auto p-8">

      <h1 className="text-4xl font-bold mb-8">
        Project Access
      </h1>

      <div className="mb-8">

        <label className="font-semibold mr-4">
          Project
        </label>

        <select
          className="border rounded-lg px-4 py-2"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
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
        <div className="mt-4 mb-6">
  <input
    type="text"
    placeholder="Search team members..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="border rounded-lg px-4 py-2 w-80"
  />
  <div className="grid grid-cols-3 gap-6 mb-8">

<div className="bg-white rounded-xl shadow p-5">

<h3 className="text-gray-500">
Assigned Users
</h3>

<p className="text-4xl font-bold">
  {assignedUsers.length}
</p>
</div>

<div className="bg-white rounded-xl shadow p-5">

<h3 className="text-gray-500">
Available Users
</h3>

<p className="text-4xl font-bold">

{members.length - assignedUsers.length}

</p>

</div>

<div className="bg-white rounded-xl shadow p-5">

<h3 className="text-gray-500">
Project
</h3>

<p className="font-semibold">

{
projects.find(
p=>p.id===selectedProject
)?.name
}

</p>

</div>

</div>
</div>

      </div>
      <div className="mb-5">

  <button
    className="bg-blue-600 text-white px-4 py-2 rounded"
    onClick={grantAllAccess}
  >
    Grant Access to All
  </button>

  <button
    className="ml-3 bg-red-600 text-white px-4 py-2 rounded"
    onClick={removeAllAccess}
  >
    Remove All Access
  </button>

</div>

      <div className="bg-white rounded-xl shadow">

        <table className="w-full">

          <thead className="border-b bg-gray-100">

            <tr>

              <th className="text-left p-4">Name</th>

              <th className="text-left p-4">Email</th>

              <th className="text-left p-4">Role</th>

              <th className="text-center p-4">
                Has Access
              </th>

            </tr>

          </thead>

          <tbody>

{members
  .filter((member) =>
    member.full_name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  )
  .map((member) => (

    <tr
      key={member.id}
      className="border-b"
    >

      <td className="p-4">
        {member.full_name}
      </td>

      <td className="p-4">
        {member.email}
      </td>

      <td className="p-4">

        <span
          className={`px-3 py-1 rounded-full text-white
          ${
            member.roles?.name === "Admin"
              ? "bg-red-600"
              : member.roles?.name === "Project Manager"
              ? "bg-green-600"
              : member.roles?.name === "Project Engineer"
              ? "bg-blue-600"
              : member.roles?.name === "Engineer of Record"
              ? "bg-purple-600"
              : member.roles?.name === "QA/QC"
              ? "bg-yellow-500"
              : "bg-gray-600"
          }`}
        >
          {member.roles?.name}
        </span>

      </td>

      <td className="text-center">

        <input
          type="checkbox"
          checked={assignedUsers.includes(member.id)}
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