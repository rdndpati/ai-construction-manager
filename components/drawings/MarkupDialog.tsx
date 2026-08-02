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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [savingRFI, setSavingRFI] = useState(false);

  async function generateAIRFI() {
    try {
      setAiLoading(true);

      const response = await fetch("/api/generate-rfi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          drawingId: markup.drawing_id,
        }),
      });

      const data = await response.json();

      setAiResult(data.result);
    } catch (err) {
      console.error(err);
      setAiResult("Failed to generate AI RFI.");
    } finally {
      setAiLoading(false);
    }
  }
  console.log("Markup being sent:", markup);
  async function saveGeneratedRFI() {
  try {
    setSavingRFI(true);
    console.log("Markup being sent:", markup);
    const response = await fetch("/api/save-generated-rfi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        markup,
        aiResult,
      }),
    });
    

    const data = await response.json();

    alert(data.message);

  } catch (err) {
    console.error(err);
    alert("Failed to save RFI.");
  } finally {
    setSavingRFI(false);
  }
}
async function handleDelete() {
  const confirmed = window.confirm(
    "Are you sure you want to delete this markup?"
  );

  if (!confirmed) return;

  try {
    const res = await fetch(`/api/markups/${markup.id}`, {
      method: "DELETE",
    });

    const result = await res.json();

    if (!result.success) {
      alert(result.message);
      return;
    }

    alert("Markup deleted successfully.");

    onClose();

    window.location.reload();
  } catch (err) {
    console.error(err);
    alert("Failed to delete markup.");
  }
}
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      
        <div className="relative bg-white rounded-xl w-[550px] max-h-[90vh] overflow-y-auto p-6 shadow-2xl">

        {/* Close */}
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
            value={form.description ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
          />
        </div>

        {/* AI Button */}
        <button
          onClick={generateAIRFI}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          {aiLoading ? "Generating..." : "🤖 Generate AI RFI"}
        </button>

        {/* AI Result */}
        {aiResult && (
  <div className="mt-4 border rounded-lg p-4 bg-gray-50 whitespace-pre-wrap">

    <h3 className="font-semibold mb-2">
      AI Generated RFI
    </h3>

    {aiResult}

    <button
      onClick={saveGeneratedRFI}
      disabled={savingRFI}
      className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg"
    >
      {savingRFI ? "Saving..." : "💾 Save as RFI"}
    </button>

  </div>
)}

        {/* Status */}
        <div className="mt-6 mb-4">
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

        {/* Footer */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded border hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
  onClick={handleDelete}
  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
>
  🗑 Delete Markup
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