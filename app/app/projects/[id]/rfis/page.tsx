"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { uploadAttachment } from "@/lib/attachments";

import { supabase } from "@/lib/supabase";
import NewRFIDialog from "@/components/NewRFIDialog";

export default function RFIPage() {
  const params = useParams();
  const router = useRouter();

  const projectId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  const [rfis, setRfis] = useState<any[]>([]);

  const [open, setOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // LOAD RFIs
  // =====================================================

  async function loadRFIs() {
    if (!projectId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const {
        data,
        error: loadError,
      } = await supabase
        .from("rfis")
        .select("*")
        .eq(
          "project_id",
          projectId
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (loadError) {
        console.error(
          "RFI LOAD ERROR:",
          loadError
        );

        setError(
          loadError.message ||
            "Unable to load RFIs."
        );

        setRfis([]);

        return;
      }

      setRfis(data ?? []);
    } catch (loadError: any) {
      console.error(
        "RFI LOAD ERROR:",
        loadError
      );

      setError(
        loadError?.message ||
          "Unable to load RFIs."
      );

      setRfis([]);
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (projectId) {
      loadRFIs();
    }
  }, [projectId]);

  // =====================================================
  // CREATE RFI
  // =====================================================

  async function createRFI(form: any) {
    if (creating) {
      return;
    }

    if (!projectId) {
      alert(
        "Project ID is missing."
      );

      return;
    }

    setCreating(true);

    try {
      console.log(
        "Creating RFI..."
      );

      console.log(
        "Project:",
        projectId
      );

      console.log(
        "Form:",
        form
      );

      // =================================================
      // CREATE RFI
      // =================================================

      const {
        data: createdRFI,
        error: createError,
      } = await supabase
        .from("rfis")
        .insert({
          project_id:
            projectId,

          title:
            form.title ||
            "",

          question:
            form.question ||
            "",

          priority:
            form.priority ||
            "Medium",

          status:
            "Open",

          due_date:
            form.due_date ||
            null,

          drawing_id:
            form.drawing_id ||
            null,

          markup_id:
            form.markup_id ||
            null,

          response:
            null,

          // =================================================
          // RFI WORKFLOW
          // =================================================

          submitted_by:
            form.submitted_by ||
            null,

          sent_to:
            form.sent_to ||
            null,

          /*
           * If Ball in Court was not specifically selected,
           * the person receiving the RFI becomes the
           * initial Ball in Court.
           */

          ball_in_court:
            form.ball_in_court ||
            form.sent_to ||
            null,

          // =================================================
          // IMPORTANT
          // =================================================
          //
          // DO NOT PROVIDE rfi_number.
          //
          // PostgreSQL generates it.
          //
        })
        .select()
        .single();

      // =================================================
      // CREATE ERROR
      // =================================================

      if (createError) {
        console.error(
          "CREATE RFI ERROR:",
          createError
        );

        alert(
          createError.message ||
            "Unable to create RFI."
        );

        return;
      }

      // =================================================
      // VERIFY CREATED RFI
      // =================================================

      if (!createdRFI) {
        alert(
          "RFI was created but no record was returned."
        );

        return;
      }

      console.log(
        "RFI CREATED:",
        createdRFI
      );

      // =================================================
      // UPLOAD ATTACHMENT
      // =================================================

      if (
        form.attachment instanceof File
      ) {
        console.log(
          "Uploading attachment:",
          form.attachment.name
        );

        try {
          const uploadedFile =
            await uploadAttachment(
              form.attachment,
              createdRFI.id
            );

          if (!uploadedFile) {
            alert(
              "RFI was created, but the attachment could not be uploaded."
            );
          } else {
            console.log(
              "Attachment uploaded:",
              uploadedFile
            );
          }
        } catch (
          attachmentError
        ) {
          console.error(
            "ATTACHMENT UPLOAD ERROR:",
            attachmentError
          );

          alert(
            "RFI was created, but the attachment upload failed."
          );
        }
      }

      // =================================================
      // CLOSE DIALOG
      // =================================================

      setOpen(false);

      // =================================================
      // REFRESH LIST
      // =================================================

      await loadRFIs();

    } catch (error: any) {
      console.error(
        "RFI CREATE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to create RFI."
      );
    } finally {
      setCreating(false);
    }
  }

  // =====================================================
  // OPEN RFI
  // =====================================================

  function openRFI(
    rfiId: string
  ) {
    if (!rfiId) {
      return;
    }

    router.push(
      `/app/projects/${projectId}/rfis/${rfiId}`
    );
  }

  // =====================================================
  // PRIORITY STYLE
  // =====================================================

  function getPriorityClass(
    priority: string | null
  ) {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-700";

      case "High":
        return "bg-orange-100 text-orange-700";

      case "Medium":
        return "bg-yellow-100 text-yellow-700";

      case "Low":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  // =====================================================
  // STATUS STYLE
  // =====================================================

  function getStatusClass(
    status: string | null
  ) {
    switch (status) {
      case "Closed":
        return "bg-green-100 text-green-700";

      case "In Review":
        return "bg-purple-100 text-purple-700";

      case "Answered":
        return "bg-teal-100 text-teal-700";

      case "Draft":
        return "bg-gray-100 text-gray-700";

      case "Open":
      default:
        return "bg-blue-100 text-blue-700";
    }
  }

  // =====================================================
  // BALL IN COURT STYLE
  // =====================================================

  function getBallInCourtClass(
    rfi: any
  ) {
    if (
      rfi.status ===
      "Closed"
    ) {
      return "bg-green-100 text-green-700";
    }

    return "bg-blue-100 text-blue-700";
  }

  // =====================================================
  // LOADING PAGE
  // =====================================================

  if (loading) {
    return (
      <main className="p-8 bg-gray-50 min-h-screen">

        <div className="max-w-7xl mx-auto">

          <div className="bg-white border rounded-xl p-8 shadow-sm">

            <div className="animate-pulse">

              <div className="h-8 bg-gray-200 rounded w-1/3" />

              <div className="h-4 bg-gray-200 rounded w-1/2 mt-4" />

              <div className="h-32 bg-gray-200 rounded mt-8" />

            </div>

            <p className="text-gray-500 mt-5">
              Loading RFIs...
            </p>

          </div>

        </div>

      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="p-6 md:p-8 bg-gray-50 min-h-screen">

      <div className="max-w-[1600px] mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-5 mb-8">

          <div>

            <div className="flex items-center gap-3 flex-wrap">

              <h1 className="text-3xl font-bold text-gray-900">
                Requests For Information
              </h1>

              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                {rfis.length} RFIs
              </span>

            </div>

            <p className="text-gray-500 mt-2">
              Manage project questions,
              responses, routing, and
              information requests.
            </p>

          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={
                loadRFIs
              }
              disabled={loading}
              className="
                border
                border-gray-300
                bg-white
                hover:bg-gray-50
                text-gray-700
                px-4
                py-2.5
                rounded-lg
                font-medium
                disabled:opacity-50
              "
            >
              ↻ Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                setOpen(true)
              }
              disabled={
                creating
              }
              className="
                bg-blue-600
                hover:bg-blue-700
                text-white
                px-5
                py-2.5
                rounded-lg
                font-medium
                shadow-sm
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              + New RFI
            </button>

          </div>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">

            <div className="flex items-start gap-3">

              <div className="text-xl">
                ⚠️
              </div>

              <div>

                <h2 className="font-semibold text-red-800">
                  Unable to Load RFIs
                </h2>

                <p className="text-sm text-red-700 mt-1">
                  {error}
                </p>

              </div>

            </div>

          </div>
        )}

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <SummaryCard
            title="Total RFIs"
            value={
              rfis.length
            }
            icon="📋"
          />

          <SummaryCard
            title="Open"
            value={
              rfis.filter(
                (rfi) =>
                  rfi.status ===
                  "Open"
              ).length
            }
            icon="🔵"
          />

          <SummaryCard
            title="In Review"
            value={
              rfis.filter(
                (rfi) =>
                  rfi.status ===
                  "In Review"
              ).length
            }
            icon="🔎"
          />

          <SummaryCard
            title="Closed"
            value={
              rfis.filter(
                (rfi) =>
                  rfi.status ===
                  "Closed"
              ).length
            }
            icon="✅"
          />

        </div>

        {/* =================================================
            RFI TABLE
        ================================================= */}

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

          <div className="p-5 border-b">

            <h2 className="text-lg font-bold text-gray-900">
              Project RFIs
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Click an RFI to open the
              complete RFI details.
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1200px]">

              <thead className="bg-gray-50 border-b">

                <tr className="text-left">

                  <th className="p-4 font-semibold text-sm text-gray-600">
                    RFI
                  </th>

                  <th className="p-4 font-semibold text-sm text-gray-600">
                    Subject
                  </th>

                  <th className="p-4 font-semibold text-sm text-gray-600">
                    Submitted By
                  </th>

                  <th className="p-4 font-semibold text-sm text-gray-600">
                    Sent To
                  </th>

                  <th className="p-4 font-semibold text-sm text-gray-600">
                    Ball in Court
                  </th>

                  <th className="p-4 font-semibold text-sm text-gray-600">
                    Priority
                  </th>

                  <th className="p-4 font-semibold text-sm text-gray-600">
                    Status
                  </th>

                  <th className="p-4 font-semibold text-sm text-gray-600">
                    Due Date
                  </th>

                  <th className="p-4 font-semibold text-sm text-gray-600">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {/* =================================================
                    NO RFIs
                ================================================= */}

                {!loading &&
                  rfis.length ===
                    0 && (
                    <tr>

                      <td
                        colSpan={9}
                        className="p-12 text-center"
                      >

                        <div className="text-5xl mb-4">
                          📋
                        </div>

                        <h3 className="text-lg font-semibold text-gray-800">
                          No RFIs Created
                        </h3>

                        <p className="text-gray-500 mt-1">
                          No RFIs have been
                          created for this
                          project yet.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setOpen(
                              true
                            )
                          }
                          className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium"
                        >
                          + Create First RFI
                        </button>

                      </td>

                    </tr>
                  )}

                {/* =================================================
                    RFIs
                ================================================= */}

                {rfis.map(
                  (rfi) => (
                    <tr
                      key={
                        rfi.id
                      }
                      className="
                        border-b
                        last:border-b-0
                        hover:bg-blue-50
                        cursor-pointer
                        transition
                      "
                      onClick={() =>
                        openRFI(
                          rfi.id
                        )
                      }
                    >

                      {/* =========================================
                          RFI NUMBER
                      ========================================= */}

                      <td className="p-4">

                        <button
                          type="button"
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            openRFI(
                              rfi.id
                            );
                          }}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {rfi.rfi_number ||
                            "No Number"}
                        </button>

                      </td>

                      {/* =========================================
                          SUBJECT
                      ========================================= */}

                      <td className="p-4">

                        <div className="font-medium text-gray-900">
                          {rfi.title ||
                            "Untitled RFI"}
                        </div>

                        <div className="text-xs text-gray-400 mt-1">
                          Click to view
                        </div>

                      </td>

                      {/* =========================================
                          SUBMITTED BY
                      ========================================= */}

                      <td className="p-4">

                        <div className="font-medium text-gray-800">
                          {rfi.submitted_by ||
                            "Not specified"}
                        </div>

                        <div className="text-xs text-gray-400 mt-1">
                          RFI originator
                        </div>

                      </td>

                      {/* =========================================
                          SENT TO
                      ========================================= */}

                      <td className="p-4">

                        <div className="font-medium text-gray-800">
                          {rfi.sent_to ||
                            "Not specified"}
                        </div>

                        <div className="text-xs text-gray-400 mt-1">
                          Receiving party
                        </div>

                      </td>

                      {/* =========================================
                          BALL IN COURT
                      ========================================= */}

                      <td className="p-4">

                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getBallInCourtClass(
                            rfi
                          )}`}
                        >
                          ●{" "}
                          {rfi.ball_in_court ||
                            "Not assigned"}
                        </span>

                      </td>

                      {/* =========================================
                          PRIORITY
                      ========================================= */}

                      <td className="p-4">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityClass(
                            rfi.priority
                          )}`}
                        >
                          {rfi.priority ||
                            "Medium"}
                        </span>

                      </td>

                      {/* =========================================
                          STATUS
                      ========================================= */}

                      <td className="p-4">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                            rfi.status
                          )}`}
                        >
                          {rfi.status ||
                            "Open"}
                        </span>

                      </td>

                      {/* =========================================
                          DUE DATE
                      ========================================= */}

                      <td className="p-4">

                        <span className="text-gray-600">
                          {rfi.due_date ||
                            "—"}
                        </span>

                      </td>

                      {/* =========================================
                          ACTION
                      ========================================= */}

                      <td
                        className="p-4"
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >

                        <button
                          type="button"
                          onClick={() =>
                            openRFI(
                              rfi.id
                            )
                          }
                          className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                        >
                          View →
                        </button>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* =====================================================
          NEW RFI DIALOG
      ===================================================== */}

      {open && (
        <NewRFIDialog
          drawings={[]}
          onSave={
            createRFI
          }
          onClose={() =>
            setOpen(false)
          }
        />
      )}

    </main>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">

      <div className="flex justify-between items-center">

        <p className="text-sm text-gray-500">
          {title}
        </p>

        <span className="text-xl">
          {icon}
        </span>

      </div>

      <p className="text-3xl font-bold text-gray-900 mt-2">
        {value}
      </p>

    </div>
  );
}