"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  id: string;
  full_name: string | null;
  company_id: string | null;
  is_owner: boolean;
  role_id: string | null;
};

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentIsOwner, setCurrentIsOwner] = useState(false);
  const [currentIsAdmin, setCurrentIsAdmin] = useState(false);

  // ============================================================
  // LOAD USER
  // ============================================================

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  async function loadUser() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // --------------------------------------------------------
      // 1. Get logged-in user
      // --------------------------------------------------------

      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !currentUser) {
        router.replace("/login");
        return;
      }

      setCurrentUserId(currentUser.id);

      // --------------------------------------------------------
      // 2. Get current user's profile
      // --------------------------------------------------------

      const {
        data: currentProfile,
        error: currentProfileError,
      } = await supabase
        .from("profiles")
        .select("id, company_id, is_owner, role_id")
        .eq("id", currentUser.id)
        .single();

      if (currentProfileError) {
        console.error(
          "CURRENT PROFILE ERROR:",
          currentProfileError
        );

        setError(
          `Unable to load your company: ${currentProfileError.message}`
        );

        return;
      }

      if (!currentProfile?.company_id) {
        setError(
          "Your account is not connected to a company."
        );

        return;
      }

      // --------------------------------------------------------
      // 3. Determine Owner / Admin
      // --------------------------------------------------------

      const isOwner =
        currentProfile.is_owner === true;

      let isAdmin = false;

      if (currentProfile.role_id) {
        const {
          data: currentRole,
          error: roleError,
        } = await supabase
          .from("roles")
          .select("name")
          .eq("id", currentProfile.role_id)
          .single();

        if (roleError) {
          console.error(
            "CURRENT ROLE ERROR:",
            roleError
          );
        }

        isAdmin =
          currentRole?.name?.toLowerCase() === "admin";
      }

      setCurrentIsOwner(isOwner);
      setCurrentIsAdmin(isAdmin);

      // --------------------------------------------------------
      // 4. Only Owner/Admin can manage members
      // --------------------------------------------------------

      if (!isOwner && !isAdmin) {
        setError(
          "Only company owners and administrators can manage team members."
        );

        return;
      }

      // --------------------------------------------------------
      // 5. Load selected team member
      // --------------------------------------------------------

      const {
        data: member,
        error: memberError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, company_id, is_owner, role_id"
        )
        .eq("id", id)
        .single();

      if (memberError) {
        console.error(
          "MEMBER ERROR:",
          memberError
        );

        setError(
          `Unable to load this team member: ${memberError.message}`
        );

        return;
      }

      if (!member) {
        setError("Team member was not found.");
        return;
      }

      // --------------------------------------------------------
      // 6. Company security check
      // --------------------------------------------------------

      if (
        member.company_id !==
        currentProfile.company_id
      ) {
        setError(
          "You cannot manage a member from another company."
        );

        return;
      }

      // --------------------------------------------------------
      // 7. Set selected user
      // --------------------------------------------------------

      setUser(member);

      if (member.id === currentUser.id) {
        setEmail(currentUser.email || "");
      } else {
        setEmail("");
      }

    } catch (err: any) {
      console.error(
        "LOAD USER ERROR:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while loading the user."
      );

    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // SAVE USER
  // ============================================================

  async function saveUser() {
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // --------------------------------------------------------
      // Get logged-in user
      // --------------------------------------------------------

      const {
        data: { user: loggedInUser },
      } = await supabase.auth.getUser();

      if (!loggedInUser) {
        router.replace("/login");
        return;
      }

      // --------------------------------------------------------
      // Get current profile
      // --------------------------------------------------------

      const {
        data: currentProfile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("company_id, is_owner, role_id")
        .eq("id", loggedInUser.id)
        .single();

      if (
        profileError ||
        !currentProfile?.company_id
      ) {
        setError(
          "Unable to verify your company."
        );

        return;
      }

      // --------------------------------------------------------
      // Verify Owner/Admin
      // --------------------------------------------------------

      const isOwner =
        currentProfile.is_owner === true;

      let isAdmin = false;

      if (currentProfile.role_id) {
        const {
          data: role,
        } = await supabase
          .from("roles")
          .select("name")
          .eq("id", currentProfile.role_id)
          .single();

        isAdmin =
          role?.name?.toLowerCase() === "admin";
      }

      if (!isOwner && !isAdmin) {
        setError(
          "Only owners and administrators can update team members."
        );

        return;
      }

      // --------------------------------------------------------
      // Security check
      // --------------------------------------------------------

      if (
        user.company_id !==
        currentProfile.company_id
      ) {
        setError(
          "You cannot edit a member from another company."
        );

        return;
      }

      // --------------------------------------------------------
      // Owner cannot be modified
      // --------------------------------------------------------

      if (user.is_owner) {
        setError(
          "The company owner cannot be modified from this page."
        );

        return;
      }

      // --------------------------------------------------------
      // Update
      // --------------------------------------------------------

      const {
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          full_name: user.full_name,
        })
        .eq("id", user.id)
        .eq(
          "company_id",
          currentProfile.company_id
        )
        .eq("is_owner", false);

      if (updateError) {
        console.error(
          "UPDATE ERROR:",
          updateError
        );

        setError(updateError.message);
        return;
      }

      setSuccess(
        "Team member updated successfully."
      );

      setTimeout(() => {
        router.replace("/app/company/team");
        router.refresh();
      }, 700);

    } catch (err: any) {
      console.error(
        "SAVE USER ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to save changes."
      );

    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // DELETE TEAM MEMBER
  // ============================================================

  async function deleteTeamMember() {
    if (!user) return;

    // ----------------------------------------------------------
    // Cannot delete yourself
    // ----------------------------------------------------------

    if (user.id === currentUserId) {
      setError(
        "You cannot delete your own account from this page."
      );

      return;
    }

    // ----------------------------------------------------------
    // Cannot delete owner
    // ----------------------------------------------------------

    if (user.is_owner) {
      setError(
        "The company owner cannot be deleted."
      );

      return;
    }

    // ----------------------------------------------------------
    // Owner/Admin check
    // ----------------------------------------------------------

    if (!currentIsOwner && !currentIsAdmin) {
      setError(
        "Only owners and administrators can delete team members."
      );

      return;
    }

    // ----------------------------------------------------------
    // Confirmation
    // ----------------------------------------------------------

    const confirmed = window.confirm(
      `Are you sure you want to remove ${
        user.full_name || "this team member"
      } from the company?\n\nThis will remove their company access.`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      // --------------------------------------------------------
      // 1. Re-check logged-in user
      // --------------------------------------------------------

      const {
        data: { user: loggedInUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !loggedInUser) {
        router.replace("/login");
        return;
      }

      // --------------------------------------------------------
      // 2. Get current profile
      // --------------------------------------------------------

      const {
        data: currentProfile,
        error: currentProfileError,
      } = await supabase
        .from("profiles")
        .select("company_id, is_owner, role_id")
        .eq("id", loggedInUser.id)
        .single();

      if (
        currentProfileError ||
        !currentProfile?.company_id
      ) {
        setError(
          "Unable to verify your company."
        );

        return;
      }

      // --------------------------------------------------------
      // 3. Re-check Owner/Admin
      // --------------------------------------------------------

      const isOwner =
        currentProfile.is_owner === true;

      let isAdmin = false;

      if (currentProfile.role_id) {
        const {
          data: role,
        } = await supabase
          .from("roles")
          .select("name")
          .eq("id", currentProfile.role_id)
          .single();

        isAdmin =
          role?.name?.toLowerCase() === "admin";
      }

      if (!isOwner && !isAdmin) {
        setError(
          "You do not have permission to delete team members."
        );

        return;
      }

      // --------------------------------------------------------
      // 4. Company security check
      // --------------------------------------------------------

      if (
        user.company_id !==
        currentProfile.company_id
      ) {
        setError(
          "You cannot delete a member from another company."
        );

        return;
      }

      // --------------------------------------------------------
      // 5. Cannot delete owner
      // --------------------------------------------------------

      if (user.is_owner) {
        setError(
          "The company owner cannot be deleted."
        );

        return;
      }

      // --------------------------------------------------------
      // 6. Cannot delete yourself
      // --------------------------------------------------------

      if (user.id === loggedInUser.id) {
        setError(
          "You cannot delete yourself."
        );

        return;
      }

      // --------------------------------------------------------
      // LOGGING
      // --------------------------------------------------------

      console.log(
        "===================================="
      );

      console.log(
        "DELETING TEAM MEMBER"
      );

      console.log(
        "MEMBER ID:",
        user.id
      );

      console.log(
        "MEMBER NAME:",
        user.full_name
      );

      console.log(
        "COMPANY:",
        currentProfile.company_id
      );

      console.log(
        "CURRENT USER:",
        loggedInUser.id
      );

      console.log(
        "CURRENT USER OWNER:",
        isOwner
      );

      console.log(
        "CURRENT USER ADMIN:",
        isAdmin
      );

      console.log(
        "===================================="
      );

      // --------------------------------------------------------
      // 7. DELETE PROFILE
      //
      // select("id") makes Supabase return the deleted row.
      // This lets us know whether a row was actually deleted.
      // --------------------------------------------------------

      const {
        data: deletedRows,
        error: deleteError,
      } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id)
        .eq(
          "company_id",
          currentProfile.company_id
        )
        .eq("is_owner", false)
        .select("id");

      console.log(
        "DELETE RESULT:",
        deletedRows
      );

      console.log(
        "DELETE ERROR:",
        deleteError
      );

      // --------------------------------------------------------
      // 8. Database returned an actual error
      // --------------------------------------------------------

      if (deleteError) {
        console.error(
          "DELETE ERROR:",
          deleteError
        );

        setError(
          `Unable to remove team member: ${deleteError.message}`
        );

        return;
      }

      // --------------------------------------------------------
      // 9. Check whether anything was deleted
      // --------------------------------------------------------

      if (
        !deletedRows ||
        deletedRows.length === 0
      ) {
        console.error(
          "DELETE AFFECTED 0 ROWS"
        );

        setError(
          "The team member was not removed. Please check your database permissions or RLS policies."
        );

        return;
      }

      // --------------------------------------------------------
      // 10. SUCCESS
      // --------------------------------------------------------

      console.log(
        "===================================="
      );

      console.log(
        "TEAM MEMBER DELETED SUCCESSFULLY"
      );

      console.log(
        "DELETED ID:",
        deletedRows[0].id
      );

      console.log(
        "===================================="
      );

      // Clear local state immediately
      setUser(null);

      setSuccess(
        "Team member removed successfully."
      );

      // --------------------------------------------------------
      // 11. Return to Team Members
      // --------------------------------------------------------

      setTimeout(() => {
        router.replace("/app/company/team");
        router.refresh();
      }, 400);

    } catch (err: any) {
      console.error(
        "DELETE TEAM MEMBER ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to delete team member."
      );

    } finally {
      setDeleting(false);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border p-8">
            <p className="text-gray-500">
              Loading team member...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // ERROR BEFORE USER LOAD
  // ============================================================

  if (error && !user) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">

        <div className="max-w-3xl mx-auto">

          <Link
            href="/app/company/team"
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            ← Back to Team Members
          </Link>

          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6">

            <h1 className="text-xl font-bold text-red-700">
              Unable to Load User
            </h1>

            <p className="text-red-600 mt-2">
              {error}
            </p>

          </div>

        </div>

      </main>
    );
  }

  if (!user) {
    return null;
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main className="min-h-screen bg-gray-50 p-8">

      <div className="max-w-3xl mx-auto">

        {/* BACK */}

        <Link
          href="/app/company/team"
          className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-6"
        >
          ← Back to Team Members
        </Link>

        {/* HEADER */}

        <div className="mb-8">

          <h1 className="text-4xl font-bold text-gray-900">
            Edit Team Member
          </h1>

          <p className="text-gray-500 mt-2">
            Update team member information.
          </p>

        </div>

        {/* MAIN CARD */}

        <div className="bg-white rounded-2xl shadow-sm border p-8">

          <div className="space-y-6">

            {/* NAME */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>

              <input
                className="w-full border border-gray-300 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                value={user.full_name || ""}
                onChange={(e) =>
                  setUser({
                    ...user,
                    full_name: e.target.value,
                  })
                }
                disabled={
                  user.is_owner ||
                  saving ||
                  deleting
                }
              />

            </div>

            {/* EMAIL */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>

              <input
                disabled
                className="w-full border border-gray-200 rounded-xl p-3.5 bg-gray-100 text-gray-500"
                value={
                  email ||
                  "Email managed by authentication"
                }
              />

              <p className="text-xs text-gray-500 mt-2">
                Email addresses are managed through authentication.
              </p>

            </div>

            {/* OWNER */}

            {user.is_owner && (
              <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">

                <p className="font-semibold text-purple-800">
                  👑 Company Owner
                </p>

                <p className="text-sm text-purple-700 mt-1">
                  The company owner cannot be deleted or modified from this page.
                </p>

              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                <p className="font-semibold text-red-700">
                  Action failed
                </p>

                <p className="text-sm text-red-600 mt-1">
                  {error}
                </p>

              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">

                <p className="font-semibold text-green-700">
                  ✓ {success}
                </p>

              </div>
            )}

            {/* BUTTONS */}

            <div className="flex gap-3 pt-2">

              <button
                type="button"
                onClick={() =>
                  router.replace(
                    "/app/company/team"
                  )
                }
                disabled={
                  saving ||
                  deleting
                }
                className="flex-1 border border-gray-300 text-gray-700 rounded-xl p-3.5 font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              {!user.is_owner && (
                <button
                  type="button"
                  onClick={saveUser}
                  disabled={
                    saving ||
                    deleting
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3.5 font-semibold disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              )}

            </div>

          </div>

        </div>

        {/* ====================================================
            DANGER ZONE
        ==================================================== */}

        {!user.is_owner &&
          user.id !== currentUserId &&
          (currentIsOwner ||
            currentIsAdmin) && (

          <div className="mt-8 bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">

            {/* HEADER */}

            <div className="px-8 py-6 bg-red-50 border-b border-red-200">

              <h2 className="text-lg font-bold text-red-800">
                Danger Zone
              </h2>

              <p className="text-sm text-red-600 mt-1">
                Removing this team member will revoke their access to this company.
              </p>

            </div>

            {/* ACTION */}

            <div className="p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div>

                <p className="font-semibold text-gray-900">
                  Remove Team Member
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  This action cannot be undone from this page.
                </p>

              </div>

              <button
                type="button"
                onClick={deleteTeamMember}
                disabled={
                  deleting ||
                  saving
                }
                className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting
                  ? "Removing..."
                  : "Delete Team Member"}
              </button>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}