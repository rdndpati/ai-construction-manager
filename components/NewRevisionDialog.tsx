"use client";
import { useState } from "react";
import { uploadDrawingFile } from "@/lib/drawings";

type Props = {
  drawingId: string;
  onSave: (revision: any) => void;
  onClose: () => void;
};

export default function NewRevisionDialog({
  drawingId,
  onSave,
  onClose,
}: Props) {
  const [form, setForm] = useState({
    drawing_id: drawingId,
    revision_number: "",
    revision_date: "",
    uploaded_by: "Rakesh",
    notes: "",
    pdf_url: "",
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl w-[600px] p-6">

        <h2 className="text-2xl font-bold mb-6">
          Upload Drawing Revision
        </h2>

        <input
          className="border w-full p-3 mb-4 rounded"
          placeholder="Revision Number (Rev 3)"
          value={form.revision_number}
          onChange={(e) =>
            setForm({
              ...form,
              revision_number: e.target.value,
            })
          }
        />

        <input
          type="date"
          className="border w-full p-3 mb-4 rounded"
          value={form.revision_date}
          onChange={(e) =>
            setForm({
              ...form,
              revision_date: e.target.value,
            })
          }
        />

        <textarea
          rows={5}
          className="border w-full p-3 mb-4 rounded"
          placeholder="Revision Notes"
          value={form.notes}
          onChange={(e) =>
            setForm({
              ...form,
              notes: e.target.value,
            })
          }
        />

        <input
  type="file"
  accept=".pdf"
  className="mb-6"
  onChange={async (e) => {
    if (!e.target.files?.[0]) return;

    const url = await uploadDrawingFile(e.target.files[0]);

    if (url) {
      setForm({
        ...form,
        pdf_url: url,
      });
    }
  }}
/>

        <div className="flex justify-end gap-3">

          <button
            onClick={onClose}
            className="border px-5 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={() => onSave(form)}
            className="bg-blue-600 text-white px-5 py-2 rounded"
          >
            Save Revision
          </button>

        </div>

      </div>

    </div>
  );
}