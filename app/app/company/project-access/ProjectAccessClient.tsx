"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

/* =========================================================
   TYPES
========================================================= */

type Project = {
  id: string;
  name: string;
  client?: string | null;
  location?: string | null;
  status?: string | null;
  company_id?: string | null;
};

type Role = {
  name: string;
};

type Member = {
  id: string;
  email: string;
  full_name: string | null;
  company_id: string | null;
  roles?: Role | Role[] | null;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ProjectAccessClient() {
  /* =======================================================
     STATE
  ======================================================= */

  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [selectedProject, setSelectedProject] = useState("");

  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);

  const [search, setSearch] = useState("");

  const [loadingProjects, setLoadingProjects] =
    useState(true);

  const [loadingMembers, setLoadingMembers] =
    useState(true);

  const [loadingAssignments, setLoadingAssignments] =
    useState(false);

  const [savingUser, setSavingUser] =
    useState<string | null>(null);

  const [savingAll, setSavingAll] =
    useState(false);

  const [removingAll, setRemovingAll] =
    useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadProjects();
    loadMembers();
  }, []);

  /* =======================================================
     LOAD ASSIGNMENTS WHEN PROJECT CHANGES
  ======================================================= */

  useEffect(() => {
    if (selectedProject) {
      loadAssignments(selectedProject);
    } else {
      setAssignedUsers([]);
    }
  }, [selectedProject]);

  /* =======================================================
     GET CURRENT COMPANY
  ======================================================= */

  async function getCurrentCompanyId() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "USER ERROR:",
        userError
      );

      return null;
    }

    if (!user) {
      console.error(
        "NO LOGGED-IN USER"
      );

      return null;
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(
        "PROFILE ERROR:",
        profileError
      );

      return null;
    }

    return profile?.company_id || null;
  }

  /* =======================================================
     LOAD PROJECTS
  ======================================================= */

  async function loadProjects() {
    setLoadingProjects(true);
    setError("");

    const companyId =
      await getCurrentCompanyId();

    if (!companyId) {
      setError(
        "Unable to determine your company."
      );

      setLoadingProjects(false);

      return;
    }

    const {
      data,
      error: projectsError,
    } = await supabase
      .from("projects")
      .select(
        `
          id,
          name,
          client,
          location,
          status,
          company_id
        `
      )
      .eq(
        "company_id",
        companyId
      )
      .order("name");

    if (projectsError) {
      console.error(
        "PROJECTS ERROR:",
        projectsError
      );

      setError(
        projectsError.message
      );

      setLoadingProjects(false);

      return;
    }

    const projectData =
      data || [];

    setProjects(
      projectData
    );

    /*
      Automatically select the first project
      when no project has been selected yet.
    */

    if (
      projectData.length > 0
    ) {
      setSelectedProject(
        (current) =>
          current ||
          projectData[0].id
      );
    }

    setLoadingProjects(false);
  }

  /* =======================================================
     NORMALIZE ROLE
  ======================================================= */

  function getMemberRole(
    member: Member
  ): string | null {
    if (
      Array.isArray(member.roles)
    ) {
      return (
        member.roles[0]?.name ||
        null
      );
    }

    return (
      member.roles?.name ||
      null
    );
  }

  /* =======================================================
     LOAD COMPANY TEAM MEMBERS
  ======================================================= */

  async function loadMembers() {
    setLoadingMembers(true);
    setError("");

    const companyId =
      await getCurrentCompanyId();

    if (!companyId) {
      setError(
        "Unable to determine your company."
      );

      setLoadingMembers(false);

      return;
    }

    const {
      data,
      error: membersError,
    } = await supabase
      .from("profiles")
      .select(
        `
          id,
          email,
          full_name,
          company_id,
          roles (
            name
          )
        `
      )
      .eq(
        "company_id",
        companyId
      )
      .order("full_name");

    if (membersError) {
      console.error(
        "MEMBERS ERROR:",
        membersError
      );

      setError(
        membersError.message
      );

      setLoadingMembers(false);

      return;
    }

    const normalizedMembers: Member[] =
      (data || []).map(
        (member: any) => ({
          id: member.id,
          email: member.email,
          full_name:
            member.full_name,
          company_id:
            member.company_id,

          roles:
            Array.isArray(
              member.roles
            )
              ? member.roles[0] ||
                null
              : member.roles ||
                null,
        })
      );

    setMembers(
      normalizedMembers
    );

    setLoadingMembers(false);
  }

  /* =======================================================
     LOAD PROJECT ASSIGNMENTS
  ======================================================= */

  async function loadAssignments(
    projectId: string
  ) {
    setLoadingAssignments(
      true
    );

    const {
      data,
      error: assignmentError,
    } = await supabase
      .from("project_members")
      .select(
        "profile_id"
      )
      .eq(
        "project_id",
        projectId
      );

    if (assignmentError) {
      console.error(
        "ASSIGNMENTS ERROR:",
        assignmentError
      );

      setAssignedUsers([]);

      setError(
        assignmentError.message
      );

      setLoadingAssignments(
        false
      );

      return;
    }

    const profileIds =
      (data || [])
        .map(
          (item) =>
            item.profile_id
        )
        .filter(Boolean);

    setAssignedUsers(
      profileIds
    );

    setLoadingAssignments(
      false
    );
  }

  /* =======================================================
     TOGGLE ONE USER
  ======================================================= */

  async function toggleProject(
    member: Member
  ) {
    if (!selectedProject) {
      return;
    }

    setSavingUser(
      member.id
    );

    setError("");

    const hasAccess =
      assignedUsers.includes(
        member.id
      );

    /* =====================================================
       REMOVE ACCESS
    ===================================================== */

    if (hasAccess) {
      const {
        error: deleteError,
      } = await supabase
        .from("project_members")
        .delete()
        .eq(
          "project_id",
          selectedProject
        )
        .eq(
          "profile_id",
          member.id
        );

      if (deleteError) {
        console.error(
          "REMOVE ACCESS ERROR:",
          deleteError
        );

        setError(
          deleteError.message
        );

        setSavingUser(null);

        return;
      }

      setAssignedUsers(
        (current) =>
          current.filter(
            (id) =>
              id !== member.id
          )
      );

      setSavingUser(null);

      return;
    }

    /* =====================================================
       GRANT ACCESS
    ===================================================== */

    /*
      IMPORTANT:

      project_members controls PROJECT ACCESS.

      The user's actual role continues to come from:

          profiles -> roles

      We do not use project_members.role
      for authorization.

      If your project_members table still has
      a nullable "role" column, you can keep it
      as a snapshot. It is NOT the source of truth.
    */

    const roleName =
      getMemberRole(
        member
      );

    const {
      error: insertError,
    } = await supabase
      .from("project_members")
      .upsert(
        {
          project_id:
            selectedProject,

          profile_id:
            member.id,

          /*
            Keep this only if the role column
            exists and allows NULL.

            Authorization should NOT depend
            on this field.
          */
          role:
            roleName || null,
        },
        {
          onConflict:
            "project_id,profile_id",
        }
      );

    if (insertError) {
      console.error(
        "GRANT ACCESS ERROR:",
        insertError
      );

      setError(
        insertError.message
      );

      setSavingUser(null);

      return;
    }

    setAssignedUsers(
      (current) => {
        if (
          current.includes(
            member.id
          )
        ) {
          return current;
        }

        return [
          ...current,
          member.id,
        ];
      }
    );

    setSavingUser(null);
  }

  /* =======================================================
     GRANT ALL ACCESS
  ======================================================= */

  async function grantAllAccess() {
    if (!selectedProject) {
      return;
    }

    setSavingAll(true);
    setError("");

    const usersWithoutAccess =
      members.filter(
        (member) =>
          !assignedUsers.includes(
            member.id
          )
      );

    if (
      usersWithoutAccess.length ===
      0
    ) {
      setSavingAll(false);

      return;
    }

    const rows =
      usersWithoutAccess.map(
        (member) => ({
          project_id:
            selectedProject,

          profile_id:
            member.id,

          role:
            getMemberRole(
              member
            ) || null,
        })
      );

    const {
      error: insertError,
    } = await supabase
      .from("project_members")
      .upsert(
        rows,
        {
          onConflict:
            "project_id,profile_id",
        }
      );

    if (insertError) {
      console.error(
        "GRANT ALL ERROR:",
        insertError
      );

      setError(
        insertError.message
      );

      setSavingAll(false);

      return;
    }

    await loadAssignments(
      selectedProject
    );

    setSavingAll(false);
  }

  /* =======================================================
     REMOVE ALL ACCESS
  ======================================================= */

  async function removeAllAccess() {
    if (!selectedProject) {
      return;
    }

    const confirmed =
      window.confirm(
        "Remove project access from all team members for this project?"
      );

    if (!confirmed) {
      return;
    }

    setRemovingAll(true);
    setError("");

    const {
      error: deleteError,
    } = await supabase
      .from("project_members")
      .delete()
      .eq(
        "project_id",
        selectedProject
      );

    if (deleteError) {
      console.error(
        "REMOVE ALL ERROR:",
        deleteError
      );

      setError(
        deleteError.message
      );

      setRemovingAll(false);

      return;
    }

    setAssignedUsers([]);

    setRemovingAll(false);
  }

  /* =======================================================
     SEARCH MEMBERS
  ======================================================= */

  const filteredMembers =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      if (!searchText) {
        return members;
      }

      return members.filter(
        (member) => {
          const name =
            member.full_name?.toLowerCase() ||
            "";

          const email =
            member.email?.toLowerCase() ||
            "";

          const role =
            (
              getMemberRole(
                member
              ) || ""
            ).toLowerCase();

          return (
            name.includes(
              searchText
            ) ||
            email.includes(
              searchText
            ) ||
            role.includes(
              searchText
            )
          );
        }
      );
    }, [
      members,
      search,
    ]);

  /* =======================================================
     SELECTED PROJECT
  ======================================================= */

  const selectedProjectData =
    projects.find(
      (project) =>
        project.id ===
        selectedProject
    );

  /* =======================================================
     COUNTERS
  ======================================================= */

  const assignedCount =
    assignedUsers.length;

  const unassignedCount =
    Math.max(
      members.length -
        assignedCount,
      0
    );

  /* =======================================================
     ROLE COLORS
  ======================================================= */

  function getRoleClass(
    role?: string | null
  ) {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-700";

      case "Project Manager":
        return "bg-green-100 text-green-700";

      case "Project Controls":
        return "bg-purple-100 text-purple-700";

      case "Project Engineer":
        return "bg-blue-100 text-blue-700";

      case "Engineer of Record":
        return "bg-indigo-100 text-indigo-700";

      case "QA/QC":
        return "bg-yellow-100 text-yellow-700";

      case "Client":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="p-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-gray-900">
          Project Access
        </h1>

        <p className="text-gray-500 mt-2">
          Control which projects each
          team member can access.
        </p>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">

          <p className="text-red-700 font-medium">
            {error}
          </p>

        </div>
      )}

      {/* =================================================
          PROJECT SELECTOR
      ================================================= */}

      <div className="bg-white rounded-xl shadow p-6 mb-6">

        <div className="flex flex-col md:flex-row md:items-end gap-5">

          <div className="flex-1">

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Project
            </label>

            {loadingProjects ? (

              <div className="border rounded-lg px-4 py-3 text-gray-500">
                Loading projects...
              </div>

            ) : projects.length === 0 ? (

              <div className="border rounded-lg px-4 py-3 text-gray-500">
                No projects found.
              </div>

            ) : (

              <select
                className="border border-gray-300 rounded-lg px-4 py-3 w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={
                  selectedProject
                }
                onChange={(e) =>
                  setSelectedProject(
                    e.target.value
                  )
                }
              >

                {projects.map(
                  (project) => (
                    <option
                      key={
                        project.id
                      }
                      value={
                        project.id
                      }
                    >
                      {
                        project.name
                      }
                    </option>
                  )
                )}

              </select>

            )}

          </div>

          {/* =================================================
              PROJECT DETAILS
          ================================================= */}

          {selectedProjectData && (

            <div className="flex-1 bg-gray-50 rounded-lg p-4">

              <div className="text-sm text-gray-500">
                Client
              </div>

              <div className="font-semibold text-gray-900">
                {
                  selectedProjectData.client ||
                  "—"
                }
              </div>

              <div className="text-sm text-gray-500 mt-2">
                Location
              </div>

              <div className="font-semibold text-gray-900">
                {
                  selectedProjectData.location ||
                  "—"
                }
              </div>

              {selectedProjectData.status && (
                <div className="mt-2">

                  <span className="text-sm text-gray-500">
                    Status:
                  </span>

                  <span className="ml-2 font-semibold text-gray-900">
                    {
                      selectedProjectData.status
                    }
                  </span>

                </div>
              )}

            </div>

          )}

        </div>

      </div>

      {/* =================================================
          ACCESS SUMMARY
      ================================================= */}

      {selectedProject && (

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

          {/* TOTAL */}

          <div className="bg-white rounded-xl shadow p-5">

            <p className="text-sm text-gray-500">
              Total Team Members
            </p>

            <p className="text-3xl font-bold mt-2 text-gray-900">
              {
                members.length
              }
            </p>

          </div>

          {/* ACCESS */}

          <div className="bg-green-50 rounded-xl border border-green-200 p-5">

            <p className="text-sm text-green-700">
              Has Project Access
            </p>

            <p className="text-3xl font-bold text-green-700 mt-2">

              {
                loadingAssignments
                  ? "..."
                  : assignedCount
              }

            </p>

          </div>

          {/* NO ACCESS */}

          <div className="bg-orange-50 rounded-xl border border-orange-200 p-5">

            <p className="text-sm text-orange-700">
              No Project Access
            </p>

            <p className="text-3xl font-bold text-orange-700 mt-2">

              {
                loadingAssignments
                  ? "..."
                  : unassignedCount
              }

            </p>

          </div>

        </div>

      )}

      {/* =================================================
          SEARCH + ACTIONS
      ================================================= */}

      <div className="bg-white rounded-xl shadow p-5 mb-6">

        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">

          {/* SEARCH */}

          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="border border-gray-300 rounded-lg px-4 py-3 w-full lg:w-96 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* ACTION BUTTONS */}

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={
                grantAllAccess
              }
              disabled={
                !selectedProject ||
                savingAll ||
                loadingMembers
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold transition"
            >

              {savingAll
                ? "Granting..."
                : "Grant Access to All"}

            </button>

            <button
              type="button"
              onClick={
                removeAllAccess
              }
              disabled={
                !selectedProject ||
                removingAll ||
                loadingMembers
              }
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold transition"
            >

              {removingAll
                ? "Removing..."
                : "Remove All Access"}

            </button>

          </div>

        </div>

      </div>

      {/* =================================================
          TEAM MEMBER TABLE
      ================================================= */}

      <div className="bg-white rounded-xl shadow overflow-hidden">

        {/* TABLE HEADER */}

        <div className="p-5 border-b">

          <h2 className="text-xl font-bold text-gray-900">
            Team Member Access
          </h2>

          {selectedProjectData && (

            <p className="text-gray-500 mt-1">
              Project:{" "}
              <span className="font-semibold">
                {
                  selectedProjectData.name
                }
              </span>
            </p>

          )}

        </div>

        {/* LOADING MEMBERS */}

        {loadingMembers ? (

          <div className="p-10 text-center text-gray-500">
            Loading team members...
          </div>

        ) : filteredMembers.length === 0 ? (

          <div className="p-10 text-center text-gray-500">
            No team members found.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="border-b bg-gray-100">

                <tr>

                  <th className="text-left p-4">
                    Name
                  </th>

                  <th className="text-left p-4">
                    Email
                  </th>

                  <th className="text-left p-4">
                    Role
                  </th>

                  <th className="text-center p-4">
                    Project Access
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredMembers.map(
                  (member) => {

                    const hasAccess =
                      assignedUsers.includes(
                        member.id
                      );

                    const isSaving =
                      savingUser ===
                      member.id;

                    const role =
                      getMemberRole(
                        member
                      );

                    return (

                      <tr
                        key={
                          member.id
                        }
                        className="border-b hover:bg-gray-50"
                      >

                        {/* NAME */}

                        <td className="p-4">

                          <div className="font-semibold text-gray-900">
                            {
                              member.full_name ||
                              "Unnamed User"
                            }
                          </div>

                        </td>

                        {/* EMAIL */}

                        <td className="p-4 text-gray-600">
                          {
                            member.email
                          }
                        </td>

                        {/* ROLE */}

                        <td className="p-4">

                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getRoleClass(
                              role
                            )}`}
                          >
                            {
                              role ||
                              "No Role"
                            }
                          </span>

                        </td>

                        {/* PROJECT ACCESS */}

                        <td className="p-4">

                          <div className="flex justify-center">

                            <label className="relative inline-flex items-center cursor-pointer">

                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={
                                  hasAccess
                                }
                                disabled={
                                  isSaving ||
                                  loadingAssignments
                                }
                                onChange={() =>
                                  toggleProject(
                                    member
                                  )
                                }
                              />

                              <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-disabled:opacity-50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full">
                              </div>

                            </label>

                          </div>

                          <div className="text-center mt-2 text-xs">

                            {isSaving ? (

                              <span className="text-gray-400">
                                Saving...
                              </span>

                            ) : hasAccess ? (

                              <span className="text-green-600 font-medium">
                                Has Access
                              </span>

                            ) : (

                              <span className="text-gray-400">
                                No Access
                              </span>

                            )}

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =================================================
          EXPLANATION
      ================================================= */}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">

        <h2 className="font-semibold text-blue-900 text-lg">
          How Access Works
        </h2>

        <div className="mt-3 space-y-2 text-sm text-blue-800">

          <p>
            <strong>Role:</strong>{" "}
            Determines what the user
            can do in the application.
          </p>

          <p>
            <strong>Project Access:</strong>{" "}
            Determines which projects
            the user can access.
          </p>

          <p>
            <strong>Example:</strong>{" "}
            A Project Controls user
            can have full Cost Management
            permissions but only access
            Hillsboro Solar.
          </p>

        </div>

      </div>

    </main>
  );
}