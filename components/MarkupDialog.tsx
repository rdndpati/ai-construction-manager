"use client";

import { useState } from "react";

type Props = {
  markup: any;
  onSave: (markup: any) => void;
  onCreateRFI?: (markup: any) => void;
  onClose: () => void;
};

export default function MarkupDialog({
  markup,
  onSave,
  onCreateRFI,
  onClose,
}: Props) {
  const [form, setForm] = useState({
    title: markup?.title ?? "Pin",
    description: markup?.description ?? "",
    status: markup?.status ?? "Open",
    priority: markup?.priority ?? "Medium",
    ...markup,
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl shadow-xl w-[550px] p-6">

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-bold">
            Edit Markup
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-black"
          >
            ×
          </button>

        </div>

        <div className="space-y-4">

          <div>

            <label className="block text-sm font-medium mb-1">
              Title
            </label>

            <input
              className="border rounded w-full p-3"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
            />

          </div>

          <div>

            <label className="block text-sm font-medium mb-1">
              Description
            </label>

            <textarea
              rows={5}
              className="border rounded w-full p-3"
              placeholder="Describe the issue..."
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />

          </div>

          <div>

            <label className="block text-sm font-medium mb-1">
              Status
            </label>

            <select
              className="border rounded w-full p-3"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value,
                })
              }
            >
              <option>Open</option>
              <option>In Review</option>
              <option>Closed</option>
            </select>

          </div>

          <div>

            <label className="block text-sm font-medium mb-1">
              Priority
            </label>

            <select
              className="border rounded w-full p-3"
              value={form.priority}
              onChange={(e) =>
                setForm({
                  ...form,
                  priority: e.target.value,
                })
              }
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>

          </div>

        </div>

        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={onClose}
            className="px-5 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={() => onSave(form)}
            className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save Changes
          </button>

          <button
            onClick={() => onCreateRFI?.(form)}
            className="px-5 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            + Create RFI
          </button>

        </div>

      </div>

    </div>
  );
}