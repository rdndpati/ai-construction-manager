"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Project = {
  id: string;
  name: string;
  status: string;
  company_id: string;
  archived: boolean;
  progress?: number | null;
};

type Profile = {
  id: string;
  company_id: string | null;
  is_owner: boolean | null;
  roles:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

export default function Home() {
  const router = useRouter();

  // =========================================================
  // DASHBOARD STATE
  // =========================================================

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");

  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // =========================================================
  // WHITEBOARD STATE
  // =========================================================

  const [whiteboard, setWhiteboard] = useState("");

  const [whiteboardLoading, setWhiteboardLoading] =
    useState(true);

  const [savingWhiteboard, setSavingWhiteboard] =
    useState(false);

  const [whiteboardSaved, setWhiteboardSaved] =
    useState(false);

  const [whiteboardError, setWhiteboardError] =
    useState("");

  const [editingWhiteboard, setEditingWhiteboard] =
    useState(false);

  const [whiteboardUpdatedAt, setWhiteboardUpdatedAt] =
    useState<string | null>(null);

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      // =====================================================
      // 1. GET LOGGED-IN USER
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      console.log("=================================");
      console.log("DASHBOARD SECURITY CHECK");
      console.log("USER:", user.id);
      console.log("=================================");

      // =====================================================
      // 2. GET USER PROFILE
      // =====================================================

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          company_id,
          is_owner,
          roles (
            name
          )
        `)
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        console.error(
          "PROFILE ERROR:",
          profileError
        );

        setError(
          "Unable to load your profile."
        );

        return;
      }

      const profile =
        profileData as Profile;

      console.log(
  "================================="
);

console.log(
  "INVITED USER PROFILE CHECK"
);

console.log(
  "USER ID:",
  user.id
);

console.log(
  "USER EMAIL:",
  user.email
);

console.log(
  "PROFILE ID:",
  profile.id
);

console.log(
  "PROFILE COMPANY ID:",
  profile.company_id
);

console.log(
  "PROFILE OWNER:",
  profile.is_owner
);

console.log(
  "PROFILE ROLE:",
  profile.roles
);

console.log(
  "================================="
);

      // =====================================================
      // 3. MAKE SURE USER HAS COMPANY
      // =====================================================

      if (!profile.company_id) {
        router.replace("/create-company");
        return;
      }

      // =====================================================
      // 4. DETERMINE USER ROLE
      // =====================================================

      const roleData =
        profile.roles;

      const roleName =
        Array.isArray(roleData)
          ? roleData[0]?.name
          : roleData?.name;

      const owner =
        profile.is_owner === true;

      const admin =
        roleName?.toLowerCase() === "admin";

      setIsOwner(owner);
      setIsAdmin(admin);

      console.log(
        "COMPANY:",
        profile.company_id
      );

      console.log(
        "ROLE:",
        roleName
      );

      console.log(
        "OWNER:",
        owner
      );

      console.log(
        "ADMIN:",
        admin
      );

      // =====================================================
      // 5. GET COMPANY NAME
      // =====================================================

      const {
        data: company,
        error: companyError,
      } = await supabase
        .from("companies")
        .select("name")
        .eq(
          "id",
          profile.company_id
        )
        .single();

      if (companyError) {
        console.error(
          "COMPANY ERROR:",
          companyError
        );
      }

      if (company) {
        setCompanyName(
          company.name
        );
      }

      // =====================================================
      // 6. OWNER / ADMIN
      //
      // Owner and Admin can see all active projects
      // belonging to THEIR company.
      // =====================================================

      if (owner || admin) {
        console.log(
          "ACCESS MODE: COMPANY-WIDE"
        );

        const {
          data: companyProjects,
          error: companyProjectsError,
        } = await supabase
          .from("projects")
          .select("*")
          .eq(
            "company_id",
            profile.company_id
          )
          .eq(
            "archived",
            false
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (companyProjectsError) {
          console.error(
            "COMPANY PROJECT ERROR:",
            companyProjectsError
          );

          setError(
            companyProjectsError.message
          );

          return;
        }

        console.log(
          "COMPANY PROJECTS:",
          companyProjects
        );

        setProjects(
          companyProjects ?? []
        );

        await loadWhiteboard(
          user.id
        );

        return;
      }

      // =====================================================
      // 7. EMPLOYEE / REGULAR USER
      //
      // Employees only see projects assigned to them.
      // =====================================================

      console.log(
        "ACCESS MODE: ASSIGNED PROJECTS ONLY"
      );

      const {
        data: memberships,
        error: membershipError,
      } = await supabase
        .from("project_members")
        .select(
          "project_id"
        )
        .eq(
          "profile_id",
          user.id
        );

      if (membershipError) {
        console.error(
          "PROJECT MEMBERSHIP ERROR:",
          membershipError
        );

        setError(
          membershipError.message
        );

        return;
      }

      // =====================================================
      // 8. NO PROJECTS ASSIGNED
      // =====================================================

      if (
        !memberships ||
        memberships.length === 0
      ) {
        console.log(
          "EMPLOYEE HAS NO PROJECT ASSIGNMENTS"
        );

        setProjects([]);

        await loadWhiteboard(
          user.id
        );

        return;
      }

      // =====================================================
      // 9. GET ASSIGNED PROJECT IDS
      // =====================================================

      const projectIds =
        memberships
          .map(
            (membership) =>
              membership.project_id
          )
          .filter(Boolean);

      console.log(
        "ASSIGNED PROJECT IDS:",
        projectIds
      );

      if (
        projectIds.length === 0
      ) {
        setProjects([]);

        await loadWhiteboard(
          user.id
        );

        return;
      }

      // =====================================================
      // 10. GET ONLY ASSIGNED PROJECTS
      // =====================================================

      const {
        data: assignedProjects,
        error: assignedProjectsError,
      } = await supabase
        .from("projects")
        .select("*")
        .in(
          "id",
          projectIds
        )
        .eq(
          "company_id",
          profile.company_id
        )
        .eq(
          "archived",
          false
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (assignedProjectsError) {
        console.error(
          "ASSIGNED PROJECT ERROR:",
          assignedProjectsError
        );

        setError(
          assignedProjectsError.message
        );

        return;
      }

      console.log(
        "EMPLOYEE ASSIGNED PROJECTS:",
        assignedProjects
      );

      setProjects(
        assignedProjects ?? []
      );

      // =====================================================
      // 11. LOAD PERSONAL WHITEBOARD
      // =====================================================

      await loadWhiteboard(
        user.id
      );

    } catch (err) {
      console.error(
        "DASHBOARD ERROR:",
        err
      );

      setError(
        "Unable to load dashboard."
      );

    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOAD PERSONAL WHITEBOARD
  // =========================================================

  async function loadWhiteboard(
    userId: string
  ) {
    setWhiteboardLoading(true);
    setWhiteboardError("");

    try {
      const {
        data,
        error: loadError,
      } = await supabase
        .from("user_whiteboards")
        .select(
          "content, updated_at"
        )
        .eq(
          "profile_id",
          userId
        )
        .maybeSingle();

      if (loadError) {
        console.error(
          "WHITEBOARD LOAD ERROR:",
          loadError
        );

        setWhiteboardError(
          "Unable to load your whiteboard."
        );

        return;
      }

      setWhiteboard(
        data?.content ?? ""
      );

      setWhiteboardUpdatedAt(
        data?.updated_at ?? null
      );

    } catch (err) {
      console.error(
        "WHITEBOARD LOAD ERROR:",
        err
      );

      setWhiteboardError(
        "Unable to load your whiteboard."
      );

    } finally {
      setWhiteboardLoading(false);
    }
  }

  // =========================================================
  // SAVE PERSONAL WHITEBOARD
  // =========================================================

  async function saveWhiteboard(
    contentToSave?: string
  ) {
    setSavingWhiteboard(true);
    setWhiteboardSaved(false);
    setWhiteboardError("");

    try {
      // -----------------------------------------------------
      // Get logged-in user
      // -----------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setWhiteboardError(
          "Your session has expired. Please log in again."
        );

        return false;
      }

      // -----------------------------------------------------
      // Use provided content or current whiteboard
      // -----------------------------------------------------

      const content =
        contentToSave !== undefined
          ? contentToSave
          : whiteboard;

      const updatedAt =
        new Date().toISOString();

      // -----------------------------------------------------
      // Save
      // -----------------------------------------------------

      const {
        error: saveError,
      } = await supabase
        .from("user_whiteboards")
        .upsert(
          {
            profile_id:
              user.id,

            content:
              content,

            updated_at:
              updatedAt,
          },
          {
            onConflict:
              "profile_id",
          }
        );

      if (saveError) {
        console.error(
          "WHITEBOARD SAVE ERROR:",
          saveError
        );

        setWhiteboardError(
          saveError.message
        );

        return false;
      }

      // -----------------------------------------------------
      // Update UI
      // -----------------------------------------------------

      setWhiteboard(
        content
      );

      setWhiteboardUpdatedAt(
        updatedAt
      );

      setWhiteboardSaved(
        true
      );

      return true;

    } catch (err) {
      console.error(
        "WHITEBOARD SAVE ERROR:",
        err
      );

      setWhiteboardError(
        "Unable to save your notes."
      );

      return false;

    } finally {
      setSavingWhiteboard(false);
    }
  }

  // =========================================================
  // SAVE AND EXIT EDIT MODE
  // =========================================================

  async function handleSaveWhiteboard() {
    const success =
      await saveWhiteboard();

    if (success) {
      setEditingWhiteboard(
        false
      );

      setTimeout(() => {
        setWhiteboardSaved(
          false
        );
      }, 3000);
    }
  }

  // =========================================================
  // CLEAR WHITEBOARD
  // =========================================================

  async function clearWhiteboard() {
    const confirmed =
      window.confirm(
        "Are you sure you want to clear your whiteboard?"
      );

    if (!confirmed) {
      return;
    }

    // Save an actual empty value.
    // This avoids the React state timing problem
    // where setWhiteboard("") would not immediately
    // update the value used by saveWhiteboard().

    const success =
      await saveWhiteboard("");

    if (success) {
      setEditingWhiteboard(
        false
      );

      setTimeout(() => {
        setWhiteboardSaved(
          false
        );
      }, 3000);
    }
  }

  // =========================================================
  // FORMAT WHITEBOARD DATE
  // =========================================================

  function formatWhiteboardDate(
    date: string | null
  ) {
    if (!date) {
      return "Not saved yet";
    }

    try {
      return new Date(
        date
      ).toLocaleString(
        undefined,
        {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      );
    } catch {
      return "Recently updated";
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-50">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="bg-blue-700 text-white px-8 py-6 shadow">

        <h1 className="text-3xl font-bold">
          ConstructIQ
        </h1>

        <p className="text-blue-100 mt-1">
          Engineering Project Management Platform
        </p>

      </header>


      <div className="max-w-7xl mx-auto p-8 space-y-8">


        {/* ===================================================
            WELCOME
        =================================================== */}

        <div className="bg-white rounded-xl shadow p-8">

          <h2 className="text-4xl font-bold">
            Welcome Back 👋
          </h2>

          <p className="text-gray-600 mt-2">

            {isOwner || isAdmin
              ? "Monitor your company's construction projects."
              : "Monitor your assigned construction projects."}

          </p>

          {companyName && (

            <p className="text-blue-600 font-semibold mt-4">
              Company: {companyName}
            </p>

          )}


          {/* ACCESS INDICATOR */}

          {!loading && (

            <div className="mt-4">

              {isOwner ? (

                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  👑 Company Owner
                </span>

              ) : isAdmin ? (

                <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700">
                  🛡️ Administrator
                </span>

              ) : (

                <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                  👤 Assigned Projects
                </span>

              )}

            </div>

          )}

        </div>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (

          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-5">

            <p className="font-semibold">
              Dashboard Error
            </p>

            <p className="mt-1">
              {error}
            </p>

          </div>

        )}


        {/* ===================================================
            PROJECT SUMMARY
        =================================================== */}

        <Link
          href="/app/projects"
          className="block bg-white rounded-xl shadow p-8 hover:shadow-lg hover:border-blue-300 border border-transparent transition"
        >

          <div className="flex justify-between items-center">

            <div>

              <h2 className="text-3xl font-bold">
                📁 Projects
              </h2>

              <p className="text-6xl font-bold text-blue-600 mt-4">

                {loading
                  ? "..."
                  : projects.length}

              </p>

              <p className="text-gray-500 mt-2">

                {isOwner || isAdmin
                  ? "Active projects for your company"
                  : "Projects assigned to you"}

              </p>

            </div>


            <div className="text-blue-600 font-semibold">
              View Projects →
            </div>

          </div>

        </Link>


        {/* ===================================================
            PERSONAL WHITEBOARD
        =================================================== */}

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">


          {/* =================================================
              WHITEBOARD HEADER
          ================================================= */}

          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">


              <div>

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                    📝
                  </div>


                  <div>

                    <h2 className="text-2xl font-bold text-gray-900">
                      My Whiteboard
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Personal notes and workspace
                    </p>

                  </div>

                </div>

              </div>


              {/* SAVED INDICATOR */}

              {whiteboardSaved && (

                <span className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-2 text-sm font-semibold text-green-700">

                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-xs">
                    ✓
                  </span>

                  Saved successfully

                </span>

              )}

            </div>

          </div>


          {/* =================================================
              WHITEBOARD BODY
          ================================================= */}

          <div className="p-8">


            {/* =================================================
                LOADING
            ================================================= */}

            {whiteboardLoading ? (

              <div className="min-h-[300px] flex items-center justify-center">

                <div className="text-center">

                  <div className="text-3xl mb-3">
                    📝
                  </div>

                  <p className="text-gray-500">
                    Loading your whiteboard...
                  </p>

                </div>

              </div>


            ) : editingWhiteboard ? (


              /* =================================================
                 EDIT MODE
              ================================================= */

              <div>

                <div className="mb-3">

                  <label
                    htmlFor="whiteboard"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Your Notes
                  </label>

                </div>


                <textarea
                  id="whiteboard"
                  value={whiteboard}
                  onChange={(e) =>
                    setWhiteboard(
                      e.target.value
                    )
                  }
                  autoFocus
                  placeholder={
                    "Write anything here...\n\n" +
                    "Examples:\n" +
                    "RFI-15\n" +
                    "Submittal-15\n" +
                    "Follow up with contractor\n" +
                    "Meeting notes"
                  }
                  className="w-full min-h-[320px] resize-y rounded-xl border border-gray-300 bg-white px-5 py-5 text-gray-800 text-base leading-7 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />


                {whiteboardError && (

                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                    {whiteboardError}

                  </div>

                )}


                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-5">


                  {/* CANCEL */}

                  <button
                    type="button"
                    onClick={() => {

                      // Reload saved version so unsaved
                      // edits are discarded.

                      supabase.auth
                        .getUser()
                        .then(
                          ({
                            data,
                          }) => {

                            if (
                              data.user
                            ) {

                              loadWhiteboard(
                                data.user.id
                              );

                            }

                          }
                        );

                      setEditingWhiteboard(
                        false
                      );

                    }}
                    disabled={
                      savingWhiteboard
                    }
                    className="px-5 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>


                  {/* SAVE */}

                  <button
                    type="button"
                    onClick={
                      handleSaveWhiteboard
                    }
                    disabled={
                      savingWhiteboard
                    }
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >

                    {savingWhiteboard
                      ? "Saving..."
                      : "Save Changes"}

                  </button>

                </div>

              </div>


            ) : (


              /* =================================================
                 VIEW MODE
              ================================================= */

              <div>


                {whiteboard.trim() ? (


                  /* =================================================
                     SAVED NOTE
                  ================================================= */

                  <div>


                    {/* NOTE CARD */}

                    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">


                      {/* NOTE HEADER */}

                      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">


                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                            📝
                          </div>


                          <div>

                            <h3 className="font-semibold text-gray-900">
                              My Notes
                            </h3>

                            <p className="text-xs text-gray-500">
                              Last updated{" "}
                              {formatWhiteboardDate(
                                whiteboardUpdatedAt
                              )}
                            </p>

                          </div>

                        </div>


                        <span className="text-xs font-medium text-gray-400">
                          Private
                        </span>

                      </div>


                      {/* NOTE CONTENT */}

                      <div className="p-6 min-h-[220px]">

                        <div className="whitespace-pre-wrap text-gray-800 leading-7 text-base">
                          {whiteboard}
                        </div>

                      </div>

                    </div>


                    {/* ACTION BUTTONS */}

                    <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-5">


                      {/* EDIT */}

                      <button
                        type="button"
                        onClick={() => {

                          setWhiteboardError(
                            ""
                          );

                          setWhiteboardSaved(
                            false
                          );

                          setEditingWhiteboard(
                            true
                          );

                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition"
                      >
                        ✏️ Edit Notes
                      </button>


                      {/* CLEAR */}

                      <button
                        type="button"
                        onClick={
                          clearWhiteboard
                        }
                        disabled={
                          savingWhiteboard
                        }
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-red-200 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition disabled:opacity-50"
                      >
                        🗑 Clear
                      </button>

                    </div>


                  </div>


                ) : (


                  /* =================================================
                     EMPTY WHITEBOARD
                  ================================================= */

                  <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center">


                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
                      📝
                    </div>


                    <h3 className="text-xl font-bold text-gray-900 mt-5">
                      Your whiteboard is empty
                    </h3>


                    <p className="text-gray-500 mt-2 max-w-md mx-auto">
                      Use this space for personal notes,
                      reminders, meeting notes,
                      follow-ups, or anything you
                      want to keep handy.
                    </p>


                    <button
                      type="button"
                      onClick={() => {

                        setWhiteboardError(
                          ""
                        );

                        setEditingWhiteboard(
                          true
                        );

                      }}
                      className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                    >
                      ✏️ Start Writing
                    </button>

                  </div>

                )}

              </div>

            )}

          </div>

        </section>


        {/* ===================================================
            PROJECT ACCESS
        =================================================== */}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">

          <div className="flex items-start gap-3">

            <div className="text-xl">
              🔐
            </div>


            <div>

              <h3 className="font-bold text-blue-900">
                Project Access
              </h3>

              <p className="text-sm text-blue-700 mt-2">

                {isOwner || isAdmin
                  ? "You have company-wide project access."
                  : "You can only access projects assigned to your account."}

              </p>

            </div>

          </div>

        </div>


      </div>

    </main>
  );
}