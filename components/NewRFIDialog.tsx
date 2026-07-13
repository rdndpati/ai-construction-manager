"use client";

import { useState } from "react";

type Props = {
  onSave: (data: any) => void;
  onClose: () => void;
};

export default function NewRFIDialog({
  onSave,
  onClose,
}: Props) {

  const [form, setForm] = useState({
    rfi_number: "",
    title: "",
    description: "",
    priority: "Medium",
    status: "Open",
    due_date: "",
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl w-[600px] p-6">

        <h2 className="text-2xl font-bold mb-6">
          New RFI
        </h2>

        <input
          className="border w-full p-2 mb-3 rounded"
          placeholder="RFI Number"
          value={form.rfi_number}
          onChange={(e)=>
            setForm({...form,rfi_number:e.target.value})
          }
        />

        <input
          className="border w-full p-2 mb-3 rounded"
          placeholder="Title"
          value={form.title}
          onChange={(e)=>
            setForm({...form,title:e.target.value})
          }
        />

        <textarea
          className="border w-full p-2 mb-3 rounded"
          rows={5}
          placeholder="Description"
          value={form.description}
          onChange={(e)=>
            setForm({...form,description:e.target.value})
          }
        />

        <select
          className="border w-full p-2 mb-3 rounded"
          value={form.priority}
          onChange={(e)=>
            setForm({...form,priority:e.target.value})
          }
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>

        <input
          type="date"
          className="border w-full p-2 mb-5 rounded"
          value={form.due_date}
          onChange={(e)=>
            setForm({...form,due_date:e.target.value})
          }
        />

        <div className="flex justify-end gap-3">

          <button
            onClick={onClose}
            className="px-5 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={() => onSave(form)}
            className="px-5 py-2 bg-blue-600 text-white rounded"
          >
            Create RFI
          </button>

        </div>

      </div>

    </div>
  );
}