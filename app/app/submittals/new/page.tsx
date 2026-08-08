"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function NewSubmittalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectId = searchParams.get("project");

  const [form, setForm] = useState({
    submittal_number: "",
    title: "",
    description: "",
    specification_section: "",
    vendor: "",
    manufacturer: "",
    reviewer: "",
    status: "Pending",
    priority: "Medium",
    due_date: "",
    created_by: "Rakesh",
  });

  async function handleCreate() {
    console.log("Project ID:", projectId);

    const { error } = await supabase
      .from("submittals")
      .insert([
        {
          ...form,
          project_id: projectId,
        },
      ]);

    if (error) {
      console.error(error);
      alert("Failed to create submittal.");
      return;
    }

    alert("Submittal created successfully.");

    if (projectId) {
      router.push(`/app/submittals?project=${projectId}`);
    } else {
      router.push("/app/submittals");
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">
        New Submittal
      </h1>

      <div className="grid grid-cols-2 gap-6">

        <input
          className="border rounded p-3"
          placeholder="Submittal Number"
          value={form.submittal_number}
          onChange={(e) =>
            setForm({ ...form, submittal_number: e.target.value })
          }
        />

        <input
          className="border rounded p-3"
          placeholder="Title"
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
        />

        <input
          className="border rounded p-3"
          placeholder="Vendor"
          value={form.vendor}
          onChange={(e) =>
            setForm({ ...form, vendor: e.target.value })
          }
        />

        <input
          className="border rounded p-3"
          placeholder="Manufacturer"
          value={form.manufacturer}
          onChange={(e) =>
            setForm({ ...form, manufacturer: e.target.value })
          }
        />

        <input
          className="border rounded p-3"
          placeholder="Specification Section"
          value={form.specification_section}
          onChange={(e) =>
            setForm({
              ...form,
              specification_section: e.target.value,
            })
          }
        />

        <input
          className="border rounded p-3"
          placeholder="Reviewer"
          value={form.reviewer}
          onChange={(e) =>
            setForm({
              ...form,
              reviewer: e.target.value,
            })
          }
        />

        <input
          type="date"
          className="border rounded p-3"
          value={form.due_date}
          onChange={(e) =>
            setForm({
              ...form,
              due_date: e.target.value,
            })
          }
        />

        <select
          className="border rounded p-3"
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

      <textarea
        className="border rounded w-full mt-6 p-4 min-h-[150px]"
        placeholder="Description"
        value={form.description}
        onChange={(e) =>
          setForm({
            ...form,
            description: e.target.value,
          })
        }
      />

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Create Submittal
        </button>
      </div>
    </main>
  );
}

export default function NewSubmittalPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <NewSubmittalContent />
    </Suspense>
  );
}