"use client";

import { useState } from "react";

type Props = {
  markup: any;
  onSave: (markup: any) => void;
  onClose: () => void;
};

export default function MarkupDialog({
  markup,
  onSave,
  onClose,
}: Props) {

  const [form, setForm] = useState(markup);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="relative bg-white rounded-xl w-[500px] p-6 shadow-2xl">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xl text-gray-500 hover:text-black"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-6">
          Edit Markup
        </h2>

        {/* Title */}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Title
          </label>

          <input
            className="border rounded w-full p-2"
            placeholder="Enter title"
            value={form.title ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            }
          />
        </div>

        {/* Description */}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Description
          </label>

          <textarea
            className="border rounded w-full p-2"
            rows={5}
            placeholder="Describe the issue..."
            value={form.description ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
          />
        </div>

        {/* Status */}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Status
          </label>

          <select
            className="border rounded w-full p-2"
            value={form.status ?? "Open"}
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

        {/* Priority */}

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Priority
          </label>

          <select
            className="border rounded w-full p-2"
            value={form.priority ?? "Medium"}
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

        {/* Buttons */}

        <div className="flex justify-end gap-3">

          <button
            onClick={onClose}
            className="px-5 py-2 rounded border hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={() => onSave(form)}
            className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save Changes
          </button>

        </div>

      </div>

    </div>
  );
}