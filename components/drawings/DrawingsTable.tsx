"use client";

import Link from "next/link";
import EditDrawingDialog from "./EditDrawingDialog";

type Drawing = {
  id: string;
  project_id: string;   // <-- Add this
  number: string;
  name: string;
  revision: string;
  status: string;
  file_url?: string;
};

type Props = {
  drawings: Drawing[];
  onDelete: (id: string) => void;
  onEdit: (drawing: Drawing) => void;
};

export default function DrawingsTable({
  drawings,
  onDelete,
  onEdit,
}: Props) {
  return (
    <div className="mt-8 bg-white rounded-xl shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-4 text-left">Drawing</th>
            <th className="p-4 text-left">Revision</th>
            <th className="p-4 text-left">Status</th>
            <th className="p-4 text-left">File</th>
            <th className="p-4 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {drawings.map((drawing) => (
            <tr key={drawing.id} className="border-t">
              <td className="p-4">
                <strong>{drawing.number}</strong>
                <br />
                {drawing.name}
              </td>

              <td className="p-4">{drawing.revision}</td>

              <td className="p-4">{drawing.status}</td>

              <td className="p-4">
                {drawing.file_url ? (
                  <Link
                    href={`/projects/${drawing.project_id}/drawings/${drawing.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    📄 Open Drawing
                  </Link>
                ) : (
                  <span className="text-gray-400">
                    No File
                  </span>
                )}
              </td>

              <td className="p-4 flex gap-2">
                <EditDrawingDialog
                  drawing={drawing}
                  onSave={onEdit}
                />

                <button
                  onClick={() => onDelete(drawing.id)}
                  className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}