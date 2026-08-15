"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Project = {
  id: string;
  name: string;
};

export default function NewSubmittalPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [form, setForm] = useState({
    project_id: "",
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

  // =====================================================
  // LOAD PROJECTS
  // =====================================================

  useEffect(() => {
    async function loadProjects() {
      setLoadingProjects(true);

      const {
        data,
        error,
      } = await supabase
        .from("projects")
        .select("id, name")
        .order("name", {
          ascending: true,
        });

      if (error) {
        console.error(
          "PROJECT LOAD ERROR:",
          error
        );

        alert(
          `Unable to load projects:\n${error.message}`
        );

        setLoadingProjects(false);
        return;
      }

      setProjects(data ?? []);
      setLoadingProjects(false);
    }

    loadProjects();
  }, []);

  // =====================================================
  // CREATE SUBMITTAL
  // =====================================================

  async function handleCreate() {
    // ---------------------------------------------------
    // Validate project
    // ---------------------------------------------------

    if (!form.project_id) {
      alert(
        "Please select a project."
      );
      return;
    }

    // ---------------------------------------------------
    // Validate title
    // ---------------------------------------------------

    if (!form.title.trim()) {
      alert(
        "Please enter a submittal title."
      );
      return;
    }

    if (creating) {
      return;
    }

    setCreating(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("submittals")
        .insert([
          {
            project_id:
              form.project_id,

            submittal_number:
              form.submittal_number.trim() ||
              null,

            title:
              form.title.trim(),

            description:
              form.description.trim() ||
              null,

            specification_section:
              form.specification_section.trim() ||
              null,

            vendor:
              form.vendor.trim() ||
              null,

            manufacturer:
              form.manufacturer.trim() ||
              null,

            reviewer:
              form.reviewer.trim() ||
              null,

            status:
              form.status,

            priority:
              form.priority,

            due_date:
              form.due_date ||
              null,

            created_by:
              form.created_by,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(
          "CREATE SUBMITTAL ERROR:",
          error
        );

        alert(
          `Failed to create submittal:\n${error.message}`
        );

        return;
      }

      console.log(
        "SUBMITTAL CREATED:",
        data
      );

      alert(
        "Submittal created successfully."
      );

      // Go back to submittal list
      router.push(
        `/app/submittals?project=${form.project_id}`
      );

    } catch (error: any) {
      console.error(
        "CREATE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to create submittal."
      );
    } finally {
      setCreating(false);
    }
  }

  // =====================================================
  // CANCEL
  // =====================================================

  function handleCancel() {
    router.push(
      "/app/submittals"
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-gray-50 p-8">

      <div className="max-w-5xl mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">

          <button
            onClick={handleCancel}
            className="text-blue-600 hover:underline mb-4"
          >
            ← Back to Submittals
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            New Submittal
          </h1>

          <p className="text-gray-500 mt-1">
            Create a new project submittal.
          </p>

        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <div className="bg-white border rounded-xl shadow-sm p-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* PROJECT */}

            <div className="md:col-span-2">

              <label className="block font-semibold mb-2">
                Project *
              </label>

              <select
                value={form.project_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    project_id:
                      e.target.value,
                  })
                }
                disabled={
                  loadingProjects ||
                  creating
                }
                className="
                  w-full
                  border
                  rounded-lg
                  p-3
                  bg-white
                  focus:ring-2
                  focus:ring-blue-500
                  outline-none
                  disabled:bg-gray-100
                "
              >

                <option value="">
                  {loadingProjects
                    ? "Loading projects..."
                    : "Select a project"}
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </option>
                  )
                )}

              </select>

              {!loadingProjects &&
                projects.length ===
                  0 && (
                  <p className="text-red-600 text-sm mt-2">
                    No projects found. Please create a project first.
                  </p>
                )}

            </div>

            {/* SUBMITTAL NUMBER */}

            <div>

              <label className="block font-semibold mb-2">
                Submittal Number
              </label>

              <input
                className="
                  w-full
                  border
                  rounded-lg
                  p-3
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
                placeholder="Example: 003"
                value={
                  form.submittal_number
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    submittal_number:
                      e.target.value,
                  })
                }
              />

            </div>

            {/* TITLE */}

            <div>

              <label className="block font-semibold mb-2">
                Title *
              </label>

              <input
                className="
                  w-full
                  border
                  rounded-lg
                  p-3
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
                placeholder="Example: Ground Rod"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title:
                      e.target.value,
                  })
                }
              />

            </div>

            {/* VENDOR */}

            <div>

              <label className="block font-semibold mb-2">
                Vendor
              </label>

              <input
                className="
                  w-full
                  border
                  rounded-lg
                  p-3
                "
                placeholder="Vendor name"
                value={form.vendor}
                onChange={(e) =>
                  setForm({
                    ...form,
                    vendor:
                      e.target.value,
                  })
                }
              />

            </div>

            {/* MANUFACTURER */}

            <div>

              <label className="block font-semibold mb-2">
                Manufacturer
              </label>

              <input
                className="
                  w-full
                  border
                  rounded-lg
                  p-3
                "
                placeholder="Manufacturer"
                value={
                  form.manufacturer
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    manufacturer:
                      e.target.value,
                  })
                }
              />

            </div>

            {/* SPECIFICATION */}

            <div>

              <label className="block font-semibold mb-2">
                Specification Section
              </label>

              <input
                className="
                  w-full
                  border
                  rounded-lg
                  p-3
                "
                placeholder="Example: 26 05 19"
                value={
                  form.specification_section
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    specification_section:
                      e.target.value,
                  })
                }
              />

            </div>

            {/* REVIEWER */}

            <div>

              <label className="block font-semibold mb-2">
                Reviewer
              </label>

              <input
                className="
                  w-full
                  border
                  rounded-lg
                  p-3
                "
                placeholder="Reviewer name"
                value={
                  form.reviewer
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    reviewer:
                      e.target.value,
                  })
                }
              />

            </div>

            {/* STATUS */}

            <div>

              <label className="block font-semibold mb-2">
                Status
              </label>

              <select
                className="
                  w-full
                  border
                  rounded-lg
                  p-3
                  bg-white
                "
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status:
                      e.target.value,
                  })
                }
              >

                <option>
                  Pending
                </option>

                <option>
                  In Review
                </option>

                <option>
                  Approved
                </option>

                <option>
                  Revise & Resubmit
                </option>

                <option>
                  Rejected
                </option>

              </select>

            </div>

            {/* PRIORITY */}

            <div>

              <label className="block font-semibold mb-2">
                Priority
              </label>

              <select
                className="
                  w-full
                  border
                  rounded-lg
                  p-3
                  bg-white
                "
                value={
                  form.priority
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority:
                      e.target.value,
                  })
                }
              >

                <option>
                  Low
                </option>

                <option>
                  Medium
                </option>

                <option>
                  High
                </option>

                <option>
                  Critical
                </option>

              </select>

            </div>

            {/* DUE DATE */}

            <div>

              <label className="block font-semibold mb-2">
                Due Date
              </label>

              <input
                type="date"
                className="
                  w-full
                  border
                  rounded-lg
                  p-3
                "
                value={
                  form.due_date
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    due_date:
                      e.target.value,
                  })
                }
              />

            </div>

            {/* CREATED BY */}

            <div>

              <label className="block font-semibold mb-2">
                Submitted By
              </label>

              <input
                className="
                  w-full
                  border
                  rounded-lg
                  p-3
                  bg-gray-50
                "
                value={
                  form.created_by
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    created_by:
                      e.target.value,
                  })
                }
              />

            </div>

          </div>

          {/* DESCRIPTION */}

          <div className="mt-6">

            <label className="block font-semibold mb-2">
              Description
            </label>

            <textarea
              className="
                border
                rounded-lg
                w-full
                p-4
                min-h-[180px]
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
              placeholder="Describe the material, product, drawing, specification, or information being submitted."
              value={
                form.description
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
            />

          </div>

          {/* BUTTONS */}

          <div className="mt-8 flex justify-end gap-3">

            <button
              onClick={
                handleCancel
              }
              disabled={creating}
              className="
                border
                px-6
                py-3
                rounded-lg
                hover:bg-gray-50
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              onClick={
                handleCreate
              }
              disabled={
                creating ||
                loadingProjects
              }
              className="
                bg-blue-600
                hover:bg-blue-700
                text-white
                px-6
                py-3
                rounded-lg
                font-semibold
                disabled:opacity-50
              "
            >
              {creating
                ? "Creating..."
                : "Create Submittal"}
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}