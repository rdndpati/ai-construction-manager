"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import UploadDrawingDialog from "@/components/UploadDrawingDialog";
import DrawingsTable from "@/components/drawings/DrawingsTable";

import {
  getDrawings,
  updateDrawing,
  deleteDrawing,
} from "@/lib/drawings";

type Drawing = {
  id: string;
  project_id: string;
  number: string;
  name: string;
  revision: string;
  status: string;
  file_url?: string;
};

export default function DrawingsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadDrawings();
  }, []);

  async function loadDrawings() {
    const data = await getDrawings(projectId);
    setDrawings(data);
  }

  function addDrawing(drawing: Drawing) {
    setDrawings((prev) => [drawing, ...prev]);
  }

  async function handleDelete(id: string) {
    const ok = await deleteDrawing(id);

    if (!ok) return;

    setDrawings((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleEdit(updated: Drawing) {
    const saved = await updateDrawing(updated.id, {
      number: updated.number,
      name: updated.name,
      revision: updated.revision,
      status: updated.status,
      file_url: updated.file_url,
    });

    if (!saved) return;

    setDrawings((prev) =>
      prev.map((d) => (d.id === saved.id ? saved : d))
    );
  }

  const filtered = drawings.filter(
    (d) =>
      d.number.toLowerCase().includes(search.toLowerCase()) ||
      d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="p-8">

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Drawings</h1>
          <p className="text-gray-500">
            Project ID: {projectId}
          </p>
        </div>

        <UploadDrawingDialog
          projectId={projectId}
          addDrawing={addDrawing}
        />
      </div>

      <input
        className="border rounded-lg p-3 w-80"
        placeholder="Search drawings..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <DrawingsTable
        drawings={filtered}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

    </main>
  );
}