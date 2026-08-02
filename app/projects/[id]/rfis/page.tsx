"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import NewRFIDialog from "@/components/NewRFIDialog";

export default function RFIPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [rfis, setRfis] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  async function loadRFIs() {
  const { data, error } = await supabase
    .from("rfis")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  setRfis(data ?? []);
}

  useEffect(() => {
  if (projectId) {
    loadRFIs();
  }
}, [projectId]);

  async function createRFI(form: any) {
  const { error } = await supabase
    .from("rfis")
    .insert([
      {
        ...form,
        project_id: projectId,
      },
    ]);

    if (!error) {
      setOpen(false);
      loadRFIs();
    } else {
      console.error(error);
      alert(error.message);
    }
  }

  return (
    <main className="p-8">

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-3xl font-bold">
          Requests For Information
        </h1>

        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white px-5 py-2 rounded"
        >
          + New RFI
        </button>

      </div>

      <div className="bg-white rounded-xl shadow">

        <table className="w-full">

          <thead className="border-b">

            <tr className="text-left">

              <th className="p-4">RFI</th>
              <th className="p-4">Title</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
              <th className="p-4">Due</th>

            </tr>

          </thead>

          <tbody>

            {rfis.map((rfi) => (

              <tr
  key={rfi.id}
  className="border-b hover:bg-gray-50 cursor-pointer"
  onClick={() =>
    window.location.href = `/projects/${projectId}/rfis/${rfi.id}`
  }
>

                <td className="p-4">
                  {rfi.rfi_number}
                </td>

                <td className="p-4">
                  {rfi.title}
                </td>

                <td className="p-4">
                  {rfi.priority}
                </td>

                <td className="p-4">
                  {rfi.status}
                </td>

                <td className="p-4">
                  {rfi.due_date}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {open && (
        <NewRFIDialog
          onSave={createRFI}
          onClose={() => setOpen(false)}
        />
      )}

    </main>
  );
}