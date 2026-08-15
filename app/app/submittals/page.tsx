"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Submittal = {
  id: string;
  project_id: string | null;
  submittal_number: string | null;
  title: string | null;
  description: string | null;
  vendor: string | null;
  manufacturer: string | null;
  reviewer: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  file_url: string | null;
  created_by: string | null;
  submitted_by: string | null;
  sent_to: string | null;
  ball_in_court: string | null;
  created_at: string | null;
};

type Project = {
  id: string;
  name: string;
};

export default function SubmittalsPage() {
  const router = useRouter();

  const [submittals, setSubmittals] = useState<Submittal[]>([]);
  const [projects, setProjects] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // =====================================================
  // LOAD SUBMITTALS
  // =====================================================

  async function loadSubmittals() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("submittals")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("SUBMITTAL LOAD ERROR:", error);

        alert(
          `Unable to load submittals:\n${error.message}`
        );

        return;
      }

      const records = (data ?? []) as Submittal[];

      setSubmittals(records);

      // =================================================
      // LOAD PROJECT NAMES
      // =================================================

      const projectIds = Array.from(
        new Set(
          records
            .map((item) => item.project_id)
            .filter(
              (id): id is string => Boolean(id)
            )
        )
      );

      if (projectIds.length === 0) {
        setProjects({});
        return;
      }

      const {
        data: projectData,
        error: projectError,
      } = await supabase
        .from("projects")
        .select("id, name")
        .in("id", projectIds);

      if (projectError) {
        console.error(
          "PROJECT LOAD ERROR:",
          projectError
        );

        return;
      }

      const projectMap: Record<string, string> = {};

      ((projectData ?? []) as Project[]).forEach(
        (project) => {
          projectMap[project.id] = project.name;
        }
      );

      setProjects(projectMap);

    } catch (error) {
      console.error("LOAD ERROR:", error);

      alert("Unable to load submittals.");

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubmittals();
  }, []);

  // =====================================================
  // PROJECT NAME
  // =====================================================

  function getProjectName(
    projectId: string | null
  ) {
    if (!projectId) {
      return "No Project";
    }

    return (
      projects[projectId] ||
      "Unknown Project"
    );
  }

  // =====================================================
  // SUBMITTED BY
  // =====================================================

  function getSubmittedBy(
    item: Submittal
  ) {
    return (
      item.submitted_by ||
      item.created_by ||
      "—"
    );
  }

  // =====================================================
  // SENT TO
  // =====================================================

  function getSentTo(
    item: Submittal
  ) {
    return (
      item.sent_to ||
      item.reviewer ||
      "—"
    );
  }

  // =====================================================
  // BALL IN COURT
  // =====================================================

  function getBallInCourt(
    item: Submittal
  ) {
    return (
      item.ball_in_court ||
      item.sent_to ||
      item.reviewer ||
      "Not assigned"
    );
  }

  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const filteredSubmittals = useMemo(() => {
    const text = search
      .trim()
      .toLowerCase();

    return submittals.filter((item) => {

      const status =
        item.status || "Pending";

      // Status filter
      if (
        statusFilter !== "All" &&
        status !== statusFilter
      ) {
        return false;
      }

      // Search
      if (!text) {
        return true;
      }

      const searchable = [
        getProjectName(item.project_id),
        item.submittal_number,
        item.title,
        item.vendor,
        item.manufacturer,
        getSubmittedBy(item),
        getSentTo(item),
        getBallInCourt(item),
        item.reviewer,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(text);
    });

  }, [
    submittals,
    projects,
    search,
    statusFilter,
  ]);

  // =====================================================
  // VIEW
  // =====================================================

  function handleView(
    item: Submittal
  ) {
    const projectQuery =
      item.project_id
        ? `?project=${item.project_id}`
        : "";

    router.push(
      `/app/submittals/${item.id}${projectQuery}`
    );
  }

  // =====================================================
  // GET STORAGE PATH FROM PUBLIC URL
  // =====================================================

  function getStoragePath(
    fileUrl: string
  ) {
    try {
      const url = new URL(fileUrl);

      const marker =
        "/storage/v1/object/public/submittals/";

      const index =
        url.pathname.indexOf(marker);

      if (index === -1) {
        return null;
      }

      const path =
        url.pathname.substring(
          index + marker.length
        );

      return decodeURIComponent(path);

    } catch (error) {
      console.error(
        "STORAGE PATH ERROR:",
        error
      );

      return null;
    }
  }

  // =====================================================
  // DOWNLOAD
  // =====================================================

  async function handleDownload(
    item: Submittal
  ) {
    if (!item.file_url) {
      alert(
        "No file is attached to this submittal."
      );

      return;
    }

    if (downloadingId) {
      return;
    }

    setDownloadingId(item.id);

    try {
      // -----------------------------------------------
      // Try Supabase Storage directly
      // -----------------------------------------------

      const storagePath =
        getStoragePath(
          item.file_url
        );

      if (storagePath) {

        const {
          data,
          error,
        } = await supabase.storage
          .from("submittals")
          .download(storagePath);

        if (!error && data) {

          const blobUrl =
            window.URL.createObjectURL(
              data
            );

          const link =
            document.createElement("a");

          link.href = blobUrl;

          const safeName =
            (
              item.title ||
              item.submittal_number ||
              "submittal"
            )
              .replace(
                /[^a-z0-9]/gi,
                "_"
              )
              .substring(
                0,
                100
              );

          link.download =
            `${safeName}.pdf`;

          document.body.appendChild(
            link
          );

          link.click();

          link.remove();

          window.URL.revokeObjectURL(
            blobUrl
          );

          return;
        }

        console.error(
          "SUPABASE STORAGE DOWNLOAD ERROR:",
          error
        );
      }

      // -----------------------------------------------
      // Fallback: open public URL
      // -----------------------------------------------

      const link =
        document.createElement("a");

      link.href =
        item.file_url;

      link.target =
        "_blank";

      link.rel =
        "noopener noreferrer";

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

    } catch (error) {

      console.error(
        "DOWNLOAD ERROR:",
        error
      );

      // Final fallback
      window.open(
        item.file_url,
        "_blank",
        "noopener,noreferrer"
      );

    } finally {
      setDownloadingId(null);
    }
  }

  // =====================================================
  // SEND
  // =====================================================

  async function handleSend(
    item: Submittal
  ) {
    if (sendingId) {
      return;
    }

    const receiver =
      item.sent_to ||
      item.reviewer;

    if (!receiver) {
      alert(
        "Please assign a reviewer or receiver before sending."
      );

      return;
    }

    setSendingId(item.id);

    try {

      const {
        error,
      } = await supabase
        .from("submittals")
        .update({
          status: "In Review",
          ball_in_court: receiver,
        })
        .eq(
          "id",
          item.id
        );

      if (error) {

        console.error(
          "SEND ERROR:",
          error
        );

        alert(
          `Unable to send submittal:\n${error.message}`
        );

        return;
      }

      alert(
        `Submittal sent to ${receiver}.`
      );

      await loadSubmittals();

    } catch (error) {

      console.error(
        "SEND ERROR:",
        error
      );

      alert(
        "Unable to send submittal."
      );

    } finally {
      setSendingId(null);
    }
  }

  // =====================================================
  // DELETE
  // =====================================================

  async function handleDelete(
    item: Submittal
  ) {
    if (deletingId) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete submittal "${
          item.submittal_number ||
          item.title ||
          "this submittal"
        }"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);

    try {

      // -----------------------------------------------
      // Delete file from storage if it exists
      // -----------------------------------------------

      if (item.file_url) {

        const storagePath =
          getStoragePath(
            item.file_url
          );

        if (storagePath) {

          const {
            error: storageError,
          } = await supabase.storage
            .from("submittals")
            .remove([
              storagePath,
            ]);

          if (storageError) {
            console.warn(
              "STORAGE DELETE WARNING:",
              storageError
            );
          }
        }
      }

      // -----------------------------------------------
      // Delete database record
      // -----------------------------------------------

      const {
        error,
      } = await supabase
        .from("submittals")
        .delete()
        .eq(
          "id",
          item.id
        );

      if (error) {

        console.error(
          "DELETE SUBMITTAL ERROR:",
          error
        );

        alert(
          `Unable to delete submittal:\n${error.message}`
        );

        return;
      }

      // Remove from screen immediately

      setSubmittals(
        (previous) =>
          previous.filter(
            (submittal) =>
              submittal.id !==
              item.id
          )
      );

      alert(
        "Submittal deleted successfully."
      );

    } catch (error) {

      console.error(
        "DELETE ERROR:",
        error
      );

      alert(
        "Unable to delete submittal."
      );

    } finally {
      setDeletingId(null);
    }
  }

  // =====================================================
  // RESET
  // =====================================================

  function handleReset() {
    setSearch("");
    setStatusFilter("All");
  }

  // =====================================================
  // COUNTS
  // =====================================================

  const total =
    submittals.length;

  const pending =
    submittals.filter(
      (item) =>
        (item.status ||
          "Pending") ===
        "Pending"
    ).length;

  const approved =
    submittals.filter(
      (item) =>
        item.status ===
        "Approved"
    ).length;

  const rejected =
    submittals.filter(
      (item) =>
        item.status ===
        "Rejected"
    ).length;

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="p-8 bg-gray-50 min-h-screen">

      {/* ============================================= */}
      {/* HEADER */}
      {/* ============================================= */}

      <div className="flex justify-between items-center mb-8">

        <div>

          <h1 className="text-3xl font-bold text-gray-900">
            Submittal Management
          </h1>

          <p className="text-gray-500 mt-1">
            Manage material, equipment,
            product, and document
            submittals.
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/app/submittals/new"
            )
          }
          className="
            bg-blue-600
            hover:bg-blue-700
            text-white
            px-5
            py-3
            rounded-lg
            font-semibold
            shadow-sm
          "
        >
          + New Submittal
        </button>

      </div>

      {/* ============================================= */}
      {/* SUMMARY */}
      {/* ============================================= */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

        <div className="bg-white border rounded-xl p-6">

          <p className="text-gray-500">
            Total
          </p>

          <p className="text-3xl font-bold mt-2">
            {total}
          </p>

        </div>

        <div className="bg-yellow-50 border rounded-xl p-6">

          <p className="text-gray-500">
            Pending
          </p>

          <p className="text-3xl font-bold mt-2">
            {pending}
          </p>

        </div>

        <div className="bg-green-50 border rounded-xl p-6">

          <p className="text-gray-500">
            Approved
          </p>

          <p className="text-3xl font-bold mt-2">
            {approved}
          </p>

        </div>

        <div className="bg-red-50 border rounded-xl p-6">

          <p className="text-gray-500">
            Rejected
          </p>

          <p className="text-3xl font-bold mt-2">
            {rejected}
          </p>

        </div>

      </div>

      {/* ============================================= */}
      {/* SEARCH + FILTER */}
      {/* ============================================= */}

      <div className="bg-white border rounded-xl p-4 mb-5">

        <div className="flex gap-3">

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search submittal #, title, vendor, sender, receiver..."
            className="
              flex-1
              border
              rounded-lg
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-blue-500
            "
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="
              border
              rounded-lg
              px-4
              py-3
              bg-white
            "
          >

            <option value="All">
              All
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="In Review">
              In Review
            </option>

            <option value="Approved">
              Approved
            </option>

            <option value="Revise & Resubmit">
              Revise & Resubmit
            </option>

            <option value="Rejected">
              Rejected
            </option>

          </select>

          <button
            type="button"
            onClick={handleReset}
            className="
              border
              rounded-lg
              px-5
              hover:bg-gray-50
            "
          >
            Reset
          </button>

        </div>

      </div>

      {/* ============================================= */}
      {/* TABLE */}
      {/* ============================================= */}

      <div className="bg-white border rounded-xl overflow-x-auto">

        <table className="w-full min-w-[1500px]">

          <thead className="bg-gray-50 border-b">

            <tr className="text-left">

              <th className="p-4">
                Project
              </th>

              <th className="p-4">
                Submittal #
              </th>

              <th className="p-4">
                Title
              </th>

              <th className="p-4">
                Vendor
              </th>

              <th className="p-4">
                Submitted By
              </th>

              <th className="p-4">
                Sent To
              </th>

              <th className="p-4">
                Ball in Court
              </th>

              <th className="p-4">
                Status
              </th>

              <th className="p-4">
                Reviewer
              </th>

              <th className="p-4">
                Due Date
              </th>

              <th className="p-4">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {/* LOADING */}

            {loading && (
              <tr>

                <td
                  colSpan={11}
                  className="p-12 text-center text-gray-500"
                >
                  Loading submittals...
                </td>

              </tr>
            )}

            {/* EMPTY */}

            {!loading &&
              filteredSubmittals.length === 0 && (
                <tr>

                  <td
                    colSpan={11}
                    className="p-12 text-center text-gray-500"
                  >
                    No submittals found.
                  </td>

                </tr>
              )}

            {/* DATA */}

            {!loading &&
              filteredSubmittals.map(
                (item) => {

                  const status =
                    item.status ||
                    "Pending";

                  return (

                    <tr
                      key={item.id}
                      className="
                        border-b
                        hover:bg-gray-50
                      "
                    >

                      {/* PROJECT */}

                      <td className="p-4">

                        <div className="font-semibold text-gray-900">
                          {getProjectName(
                            item.project_id
                          )}
                        </div>

                      </td>

                      {/* SUBMITTAL NUMBER */}

                      <td className="p-4">

                        <button
                          type="button"
                          onClick={() =>
                            handleView(
                              item
                            )
                          }
                          className="
                            text-blue-600
                            font-semibold
                            hover:underline
                          "
                        >
                          {item.submittal_number ||
                            "—"}
                        </button>

                      </td>

                      {/* TITLE */}

                      <td className="p-4 font-medium">
                        {item.title ||
                          "Untitled"}
                      </td>

                      {/* VENDOR */}

                      <td className="p-4">
                        {item.vendor ||
                          "—"}
                      </td>

                      {/* SUBMITTED BY */}

                      <td className="p-4">
                        {getSubmittedBy(
                          item
                        )}
                      </td>

                      {/* SENT TO */}

                      <td className="p-4">
                        {getSentTo(
                          item
                        )}
                      </td>

                      {/* BALL IN COURT */}

                      <td className="p-4">

                        <span
                          className="
                            inline-flex
                            px-3
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                            bg-blue-100
                            text-blue-700
                          "
                        >
                          {getBallInCourt(
                            item
                          )}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="p-4">

                        <span
                          className={`
                            inline-flex
                            px-3
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                            ${
                              status ===
                              "Approved"
                                ? "bg-green-100 text-green-700"
                                : status ===
                                  "Rejected"
                                ? "bg-red-100 text-red-700"
                                : status ===
                                  "In Review"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-yellow-100 text-yellow-700"
                            }
                          `}
                        >
                          {status}
                        </span>

                      </td>

                      {/* REVIEWER */}

                      <td className="p-4">
                        {item.reviewer ||
                          "—"}
                      </td>

                      {/* DUE DATE */}

                      <td className="p-4">
                        {item.due_date ||
                          "—"}
                      </td>

                      {/* ACTIONS */}

                      <td className="p-4">

                        <div className="
                          flex
                          items-center
                          gap-3
                          whitespace-nowrap
                        ">

                          {/* VIEW */}

                          <button
                            type="button"
                            onClick={() =>
                              handleView(
                                item
                              )
                            }
                            className="
                              text-blue-600
                              hover:text-blue-800
                              hover:underline
                              font-medium
                            "
                          >
                            View
                          </button>

                          {/* DOWNLOAD */}

                          {item.file_url ? (

                            <button
                              type="button"
                              onClick={() =>
                                handleDownload(
                                  item
                                )
                              }
                              disabled={
                                downloadingId ===
                                item.id
                              }
                              className="
                                text-green-600
                                hover:text-green-800
                                hover:underline
                                font-medium
                                disabled:opacity-50
                              "
                            >

                              {downloadingId ===
                              item.id
                                ? "Downloading..."
                                : "⬇ Download"}

                            </button>

                          ) : (

                            <span
                              className="
                                text-gray-400
                                text-sm
                              "
                            >
                              No File
                            </span>

                          )}

                          {/* SEND */}

                          <button
                            type="button"
                            onClick={() =>
                              handleSend(
                                item
                              )
                            }
                            disabled={
                              sendingId ===
                              item.id
                            }
                            className="
                              text-purple-600
                              hover:text-purple-800
                              hover:underline
                              font-medium
                              disabled:opacity-50
                            "
                          >

                            {sendingId ===
                            item.id
                              ? "Sending..."
                              : "📤 Send"}

                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                item
                              )
                            }
                            disabled={
                              deletingId ===
                              item.id
                            }
                            className="
                              text-red-600
                              hover:text-red-800
                              hover:underline
                              font-medium
                              disabled:opacity-50
                            "
                          >

                            {deletingId ===
                            item.id
                              ? "Deleting..."
                              : "🗑 Delete"}

                          </button>

                        </div>

                      </td>

                    </tr>

                  );
                }
              )}

          </tbody>

        </table>

      </div>

      {/* ============================================= */}
      {/* FOOTER */}
      {/* ============================================= */}

      {!loading && (
        <p className="text-sm text-gray-500 mt-4">
          Showing{" "}
          {filteredSubmittals.length}{" "}
          of{" "}
          {submittals.length}{" "}
          submittals
        </p>
      )}

    </main>
  );
}