"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  id: string;
  full_name: string | null;
  company_id: string | null;
};

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  async function loadUser() {
    setLoading(true);
    setError("");

    try {
      // ============================================
      // 1. Get logged-in user
      // ============================================

      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !currentUser) {
        router.replace("/login");
        return;
      }

      console.log("CURRENT USER:", currentUser.id);

      // ============================================
      // 2. Get current user's company
      // ============================================

      const {
        data: currentProfile,
        error: currentProfileError,
      } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", currentUser.id)
        .single();

      if (currentProfileError) {
        console.error(
          "CURRENT PROFILE ERROR:",
          currentProfileError
        );

        setError(
          `Unable to load your company: ${
            currentProfileError.message
          }`
        );

        return;
      }

      if (!currentProfile?.company_id) {
        setError(
          "Your account is not connected to a company."
        );

        return;
      }

      console.log(
        "CURRENT COMPANY:",
        currentProfile.company_id
      );

      // ============================================
      // 3. Load selected team member
      // ============================================

      const {
        data: member,
        error: memberError,
      } = await supabase
        .from("profiles")
        .select("id, full_name, company_id")
        .eq("id", id)
        .single();

      if (memberError) {
        console.error(
          "MEMBER ERROR:",
          memberError
        );

        setError(
          `Unable to load this team member: ${
            memberError.message
          }`
        );

        return;
      }

      if (!member) {
        setError("Team member was not found.");
        return;
      }

      // ============================================
      // 4. SECURITY CHECK
      // ============================================

      if (
        member.company_id !==
        currentProfile.company_id
      ) {
        console.error(
          "COMPANY SECURITY CHECK FAILED"
        );

        setError(
          "You cannot edit a member from another company."
        );

        return;
      }

      // ============================================
      // 5. Set user
      // ============================================

      setUser(member);

      // We can display the current user's email
      // only if this is the logged-in account.
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

  async function saveUser() {
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const {
        data: { currentUser },
      } = {
        data: { currentUser: null },
      };

      // Get logged-in user again
      const {
        data: { user: loggedInUser },
      } = await supabase.auth.getUser();

      if (!loggedInUser) {
        router.replace("/login");
        return;
      }

      // Get logged-in user's company
      const {
        data: currentProfile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("company_id")
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

      // Security check
      if (
        user.company_id !==
        currentProfile.company_id
      ) {
        setError(
          "You cannot edit a member from another company."
        );
        return;
      }

      // Update
      const { error: updateError } =
        await supabase
          .from("profiles")
          .update({
            full_name: user.full_name,
          })
          .eq("id", user.id)
          .eq(
            "company_id",
            currentProfile.company_id
          );

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
        router.push("/app/company/team");
        router.refresh();
      }, 1000);

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

  // ============================================
  // Loading
  // ============================================

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

  // ============================================
  // Error
  // ============================================

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

  // ============================================
  // Page
  // ============================================

  return (
    <main className="min-h-screen bg-gray-50 p-8">

      <div className="max-w-3xl mx-auto">

        <Link
          href="/app/company/team"
          className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-6"
        >
          ← Back to Team Members
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Edit Team Member
          </h1>

          <p className="text-gray-500 mt-2">
            Update team member information.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8">

          <div className="space-y-6">

            {/* Name */}

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
              />
            </div>

            {/* Email */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>

              <input
                disabled
                className="w-full border border-gray-200 rounded-xl p-3.5 bg-gray-100 text-gray-500"
                value={email || "Email managed by authentication"}
              />

              <p className="text-xs text-gray-500 mt-2">
                Email addresses are managed through authentication.
              </p>
            </div>

            {/* Error */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-700">
                  Update failed
                </p>

                <p className="text-sm text-red-600 mt-1">
                  {error}
                </p>
              </div>
            )}

            {/* Success */}

            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="font-semibold text-green-700">
                  ✓ {success}
                </p>
              </div>
            )}

            {/* Buttons */}

            <div className="flex gap-3 pt-2">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/app/company/team"
                  )
                }
                className="flex-1 border border-gray-300 text-gray-700 rounded-xl p-3.5 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveUser}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3.5 font-semibold disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </div>
        </div>

      </div>

    </main>
  );
}