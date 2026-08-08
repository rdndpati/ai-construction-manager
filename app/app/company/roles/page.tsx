"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    setLoading(true);

    const { data } = await supabase
      .from("roles")
      .select("*")
      .order("name");

    setRoles(data || []);
    setLoading(false);
  }

  return (
    <main className="max-w-7xl mx-auto p-8">

      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-4xl font-bold">
            Roles & Permissions
          </h1>

          <p className="text-gray-500">
            Manage company security.
          </p>
        </div>

      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Permissions</th>
              <th className="text-left p-4">Action</th>
            </tr>

          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan={3} className="p-8 text-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              roles.map((role) => (
                <tr key={role.id} className="border-t">

                  <td className="p-4 font-semibold">
                    {role.name}
                  </td>

                  <td className="p-4">
                    Manage Permissions
                  </td>

                  <td className="p-4">

                    <Link
                      href={`/app/company/roles/${role.id}`}
                      className="text-blue-600"
                    >
                      Edit
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