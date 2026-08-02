"use client";

import Link from "next/link";

export default function CompanyPage() {
  return (
    <main className="p-8 bg-gray-100 min-h-screen">

      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Company Administration
        </h1>

        <p className="text-gray-600 mt-2">
          Manage your company, users, permissions and security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        <Link
          href="/company/profile"
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

        <Link
          href="/company/team"
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

        <Link
          href="/company/roles"
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

        <Link
          href="/company/project-access"
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

        <Link
          href="/company/security"
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

        <Link
          href="/company/audit"
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