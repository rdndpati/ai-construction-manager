import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CompanyPage() {
  const supabase = await createClient();

  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's profile and role
  const { data: profile, error } = await supabase
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

  if (error || !profile) {
    redirect("/app/projects");
  }

  // Handle Supabase relationship returning object or array
  const roleData = profile.roles as unknown as
  | { name: string }
  | { name: string }[]
  | null;

const roleName = Array.isArray(roleData)
  ? roleData[0]?.name
  : roleData?.name;

  const isOwner = profile.is_owner === true;
  const isAdmin = roleName === "Admin";

  // Only Owner or Admin can access Company Administration
  if (!isOwner && !isAdmin) {
    redirect("/app/projects");
  }

  return (
    <main>
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Company Administration
        </h1>

        <p className="text-gray-600 mt-2">
          Manage your company, users, permissions and security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Company Profile */}
        <Link
          href="/app/company/profile"
          className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
        >
          <div className="text-5xl">🏢</div>

          <h2 className="text-2xl font-bold mt-4">
            Company Profile
          </h2>

          <p className="text-gray-500 mt-2">
            Logo, address, phone, website and settings.
          </p>
        </Link>

        {/* Team Members */}
        <Link
          href="/app/company/team"
          className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
        >
          <div className="text-5xl">👥</div>

          <h2 className="text-2xl font-bold mt-4">
            Team Members
          </h2>

          <p className="text-gray-500 mt-2">
            Invite, edit and manage users.
          </p>
        </Link>

        {/* Roles & Permissions */}
        <Link
          href="/app/company/roles"
          className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
        >
          <div className="text-5xl">🔐</div>

          <h2 className="text-2xl font-bold mt-4">
            Roles & Permissions
          </h2>

          <p className="text-gray-500 mt-2">
            Control access for every user.
          </p>
        </Link>

        {/* Project Access */}
        <Link
          href="/app/company/project-access"
          className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
        >
          <div className="text-5xl">📁</div>

          <h2 className="text-2xl font-bold mt-4">
            Project Access
          </h2>

          <p className="text-gray-500 mt-2">
            Assign projects to users.
          </p>
        </Link>

        {/* Security */}
        <Link
          href="/app/company/security"
          className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
        >
          <div className="text-5xl">🛡️</div>

          <h2 className="text-2xl font-bold mt-4">
            Security
          </h2>

          <p className="text-gray-500 mt-2">
            Login, authentication and activity.
          </p>
        </Link>

        {/* Audit Log */}
        <Link
          href="/app/company/audit"
          className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
        >
          <div className="text-5xl">📜</div>

          <h2 className="text-2xl font-bold mt-4">
            Audit Log
          </h2>

          <p className="text-gray-500 mt-2">
            Track every change made in the company.
          </p>
        </Link>

      </div>
    </main>
  );
}