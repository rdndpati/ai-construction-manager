"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);
  async function addAuditLog(
  module: string,
  action: string,
  description: string
) {
  const { error } = await supabase
    .from("audit_logs")
    .insert({
      module,
      action,
      description,
    });

  if (error) {
    console.log(error);
    return;
  }

  loadLogs();
}
  async function loadLogs() {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("Audit Logs:", data);
  console.log("Audit Error:", error);

  if (data) {
    setLogs(data);
  }
}

  const filteredLogs = logs.filter(
  (log) =>
    log.module?.toLowerCase().includes(search.toLowerCase()) ||
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.description?.toLowerCase().includes(search.toLowerCase())
);


  return (
    <main className="max-w-7xl mx-auto p-8">

      <h1 className="text-4xl font-bold mb-8">
        Audit Log
      </h1>

      <input
        type="text"
        placeholder="Search activity..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded-lg px-4 py-2 w-96 mb-6"
      />

      <div className="grid grid-cols-3 gap-6 mb-8">

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-gray-500">
            Total Activities
          </h3>
          <p className="text-4xl font-bold">
            {logs.length}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-gray-500">
            Unique Users
          </h3>
          <p className="text-4xl font-bold">
            {new Set(logs.map((l) => l.profile_id)).size}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-gray-500">
            Security Events
          </h3>
          <p className="text-4xl font-bold">
            {
              logs.filter((l) =>
  l.module === "Security"
).length
            }
          </p>
        </div>

      </div>

      <div className="bg-white rounded-xl shadow">

        <table className="w-full">

          <thead className="bg-gray-100 border-b">

            <tr>

  <th className="p-4 text-left">Time</th>

  <th className="p-4 text-left">Module</th>

  <th className="p-4 text-left">Action</th>

  <th className="p-4 text-left">Description</th>

</tr>

          </thead>

          <tbody>

            {filteredLogs.map((log) => (

              <tr
                key={log.id}
                className="border-b"
              >

                <td className="p-4">
                  {new Date(log.created_at).toLocaleString()}
                </td>

                <td className="p-4">
  {log.module}
</td>

                <td className="p-4">

                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full">
                    {log.action}
                  </span>

                </td>

                <td className="p-4">
                  {log.description}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}