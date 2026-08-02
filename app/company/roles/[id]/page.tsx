"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MODULES = [
  "Projects",
  "Drawings",
  "RFIs",
  "Submittals",
  "Specifications",
  "Users",
  "Company",
];

const PERMISSIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "manage",
];

export default function EditRolePage() {
  const params = useParams();

  const roleId = params.id as string;

  const [permissions, setPermissions] = useState<any[]>([]);

  useEffect(() => {
    loadPermissions();
  }, []);

  async function loadPermissions() {
    const { data } = await supabase
      .from("permissions")
      .select("*")
      .eq("role_id", roleId);

    setPermissions(data || []);
  }

  function hasPermission(module: string, permission: string) {
    return permissions.some(
      (p) =>
        p.module === module &&
        p.permission === permission
    );
  }

  async function togglePermission(module: string, permission: string) {

  console.log("Clicked:", module, permission);

  const exists = permissions.find(
    (p) =>
      p.module === module &&
      p.permission === permission
  );

  console.log("Exists:", exists);

  if (exists) {

    const { error } = await supabase
      .from("permissions")
      .delete()
      .eq("id", exists.id);

    console.log("Delete Error:", error);

  } else {

    const { data, error } = await supabase
      .from("permissions")
      .insert({
        role_id: roleId,
        module,
        permission,
      })
      .select();

    console.log("Insert:", data);
    console.log("Insert Error:", error);

  }

  loadPermissions();
}
  return (
    <main className="max-w-7xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-8">
        Edit Permissions
      </h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="p-4 text-left">
                Module
              </th>

              {PERMISSIONS.map((permission) => (
                <th
                  key={permission}
                  className="p-4 capitalize"
                >
                  {permission}
                </th>
              ))}

            </tr>

          </thead>

          <tbody>

            {MODULES.map((module) => (
              <tr key={module} className="border-t">

                <td className="p-4 font-semibold">
                  {module}
                </td>

                {PERMISSIONS.map((permission) => (
                  <td
                    key={permission}
                    className="text-center"
                  >
                    <input
                      type="checkbox"
                      checked={hasPermission(
                        module,
                        permission
                      )}
                      onChange={() =>
                        togglePermission(
                          module,
                          permission
                        )
                      }
                    />
                  </td>
                ))}

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}