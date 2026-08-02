"use client";

import Link from "next/link";

export default function TeamPage() {
  return (
    <main className="p-8">

      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-3xl font-bold">
            Team Members
          </h1>

          <p className="text-gray-500 mt-2">
            Manage everyone in your company.
          </p>
        </div>

        <Link
          href="/team/invite"
          className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
        >
          + Invite Member
        </Link>

      </div>

      <div className="bg-white rounded-xl shadow">

        <table className="w-full">

          <thead className="border-b">

            <tr>

              <th className="text-left p-4">Name</th>

              <th className="text-left p-4">Email</th>

              <th className="text-left p-4">Role</th>

              <th className="text-left p-4">Status</th>

            </tr>

          </thead>

          <tbody>

            <tr>

              <td className="p-4 text-gray-400" colSpan={4}>
                No team members yet.
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </main>
  );
}