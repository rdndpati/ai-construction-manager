"use client";

import { useEffect, useState } from "react";
import {
  getComments,
  createComment,
} from "@/lib/comments";

import {
  getAttachments,
  uploadAttachment,
  deleteAttachment,
} from "@/lib/attachments";

import {
  useParams,
  useRouter,
} from "next/navigation";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

/* =========================================================
   TYPES
========================================================= */

type RFI = {
  id: string;
  project_id: string | null;
  rfi_number: string | null;

  title: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;

  question: string | null;
  description: string | null;
  response: string | null;

  drawing_id: string | null;
  markup_id: string | null;

  /*
   * These fields are optional.
   *
   * If your rfis table has them, they will be used.
   */
  submitted_by?: string | null;
  sent_to?: string | null;
  ball_in_court?: string | null;

  [key: string]: any;
};

type CommentRow = {
  id: string;
  author: string | null;
  comment: string | null;
  created_at: string;
};

type AttachmentRow = {
  id: string;
  file_name: string | null;
  file_url: string | null;
  uploaded_by: string | null;
};

/* =========================================================
   UUID VALIDATION
========================================================= */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(
  value: string | undefined | null
) {
  return (
    !!value &&
    UUID_REGEX.test(value)
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function RFIDetailsPage() {
  const params = useParams();
  const router = useRouter();

  /*
   * Your URL appears to be:
   *
   * /app/projects/[id]/rfis/[rfiId]
   *
   * Therefore project ID comes from params.id.
   */

  const projectId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  const rfiId =
    typeof params.rfiId === "string"
      ? params.rfiId
      : Array.isArray(params.rfiId)
      ? params.rfiId[0]
      : "";

  /* =======================================================
     STATE
  ======================================================= */

  const [rfi, setRFI] =
    useState<RFI | null>(null);

  const [comments, setComments] =
    useState<CommentRow[]>([]);

  const [newComment, setNewComment] =
    useState("");

  const [attachments, setAttachments] =
    useState<AttachmentRow[]>([]);

  const [uploading, setUploading] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD RFI
  ======================================================= */

  useEffect(() => {
    /*
     * VERY IMPORTANT
     *
     * "new" is not a UUID.
     *
     * This prevents:
     *
     * /rfis/new
     *
     * from becoming:
     *
     * .eq("id", "new")
     */

    if (
      !rfiId ||
      rfiId === "new"
    ) {
      setLoading(false);

      /*
       * If there is a dedicated /new page,
       * allow that page to handle it.
       */
      return;
    }

    if (!isValidUUID(rfiId)) {
      setLoading(false);
      setError(
        "Invalid RFI ID."
      );
      return;
    }

    loadRFI();
  }, [rfiId]);

  /* =======================================================
     LOAD RFI FUNCTION
  ======================================================= */

  async function loadRFI() {
    if (
      !rfiId ||
      !isValidUUID(rfiId)
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      /* ================================================
         LOAD RFI
      ================================================ */

      const {
        data,
        error: rfiError,
      } = await supabase
        .from("rfis")
        .select("*")
        .eq("id", rfiId)
        .single();

      if (rfiError) {
        console.error(
          "LOAD RFI ERROR:",
          rfiError
        );

        setError(
          "Unable to load this RFI."
        );

        setRFI(null);
        return;
      }

      if (!data) {
        setError(
          "RFI not found."
        );

        setRFI(null);
        return;
      }

      setRFI(
        data as RFI
      );

      /* ================================================
         LOAD COMMENTS
      ================================================ */

      try {
        const list =
          await getComments(rfiId);

        setComments(
          (list ?? []) as CommentRow[]
        );
      } catch (commentError) {
        console.error(
          "COMMENTS ERROR:",
          commentError
        );

        setComments([]);
      }

      /* ================================================
         LOAD ATTACHMENTS
      ================================================ */

      try {
        const files =
          await getAttachments(rfiId);

        setAttachments(
          (files ?? []) as AttachmentRow[]
        );
      } catch (attachmentError) {
        console.error(
          "ATTACHMENTS ERROR:",
          attachmentError
        );

        setAttachments([]);
      }
    } catch (loadError) {
      console.error(
        "RFI LOAD ERROR:",
        loadError
      );

      setError(
        "Something went wrong while loading the RFI."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     UPDATE FIELD
  ======================================================= */

  function updateRFI(
    field: string,
    value: any
  ) {
    setRFI((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  /* =======================================================
     SAVE RFI
  ======================================================= */

  async function handleSaveRFI() {
    if (!rfi) {
      return;
    }

    if (!isValidUUID(rfi.id)) {
      alert(
        "Invalid RFI ID."
      );
      return;
    }

    try {
      setSaving(true);

      /*
       * Basic fields that already exist
       * in your current RFI page.
       */

      const updateData: Record<
        string,
        any
      > = {
        title:
          rfi.title ?? "",

        status:
          rfi.status ?? "Open",

        priority:
          rfi.priority ?? "Medium",

        due_date:
          rfi.due_date || null,

        question:
          rfi.question ??
          rfi.description ??
          "",

        response:
          rfi.response ?? "",
      };

      /*
       * Add workflow fields ONLY if
       * those properties are present on
       * the RFI object.
       *
       * This helps prevent errors if
       * your current database does not
       * have these columns yet.
       */

      if (
        Object.prototype.hasOwnProperty.call(
          rfi,
          "submitted_by"
        )
      ) {
        updateData.submitted_by =
          rfi.submitted_by ?? null;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          rfi,
          "sent_to"
        )
      ) {
        updateData.sent_to =
          rfi.sent_to ?? null;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          rfi,
          "ball_in_court"
        )
      ) {
        updateData.ball_in_court =
          rfi.ball_in_court ?? null;
      }

      const {
        error: updateError,
      } = await supabase
        .from("rfis")
        .update(updateData)
        .eq("id", rfi.id);

      if (updateError) {
        console.error(
          "SAVE RFI ERROR:",
          updateError
        );

        alert(
          `Failed to update RFI.\n\n${updateError.message}`
        );

        return;
      }

      alert(
        "RFI updated successfully."
      );

      await loadRFI();
    } catch (saveError) {
      console.error(
        "SAVE RFI ERROR:",
        saveError
      );

      alert(
        "Something went wrong while saving the RFI."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     COMMENT
  ======================================================= */

  async function handleComment() {
    if (
      !newComment.trim()
    ) {
      return;
    }

    if (!isValidUUID(rfiId)) {
      alert(
        "Invalid RFI."
      );
      return;
    }

    try {
      const comment =
        await createComment({
          rfi_id: rfiId,
          author:
            "Project Engineer",
          comment:
            newComment.trim(),
        });

      if (comment) {
        setComments(
          (prev) => [
            ...prev,
            comment as CommentRow,
          ]
        );

        setNewComment("");
      }
    } catch (commentError) {
      console.error(
        "CREATE COMMENT ERROR:",
        commentError
      );

      alert(
        "Failed to add comment."
      );
    }
  }

  /* =======================================================
     UPLOAD ATTACHMENT
  ======================================================= */

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!isValidUUID(rfiId)) {
      alert(
        "Invalid RFI."
      );

      e.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const uploaded =
        await uploadAttachment(
          file,
          rfiId
        );

      if (uploaded) {
        setAttachments(
          (prev) => [
            ...prev,
            uploaded as AttachmentRow,
          ]
        );
      }
    } catch (uploadError) {
      console.error(
        "UPLOAD ERROR:",
        uploadError
      );

      alert(
        "Failed to upload attachment."
      );
    } finally {
      setUploading(false);

      /*
       * Allows the same file to be
       * selected again.
       */
      e.target.value = "";
    }
  }

  /* =======================================================
     DELETE ATTACHMENT
  ======================================================= */

  async function handleDeleteAttachment(
    id: string,
    fileUrl: string
  ) {
    const ok =
      window.confirm(
        "Are you sure you want to delete this attachment?"
      );

    if (!ok) {
      return;
    }

    try {
      const deleted =
        await deleteAttachment(
          id,
          fileUrl
        );

      if (deleted) {
        setAttachments(
          (prev) =>
            prev.filter(
              (attachment) =>
                attachment.id !== id
            )
        );
      }
    } catch (deleteError) {
      console.error(
        "DELETE ATTACHMENT ERROR:",
        deleteError
      );

      alert(
        "Failed to delete attachment."
      );
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-40 bg-gray-200 rounded" />
          </div>

          <p className="text-gray-500 mt-5">
            Loading RFI...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     NEW ROUTE
  ======================================================= */

  if (
    !rfiId ||
    rfiId === "new"
  ) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-xl mx-auto bg-white border rounded-xl shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">
            📝
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Create New RFI
          </h1>

          <p className="text-gray-500 mt-2">
            This URL is for creating a new RFI.
          </p>

          <Link
            href={`/app/projects/${projectId}/rfis`}
            className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg"
          >
            ← Back to RFIs
          </Link>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error ||
    !rfi
  ) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-xl mx-auto bg-white border rounded-xl shadow-sm p-8 text-center">

          <div className="text-5xl mb-4">
            ⚠️
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Unable to Load RFI
          </h1>

          <p className="text-gray-500 mt-3">
            {error ||
              "This RFI could not be found."}
          </p>

          <div className="flex justify-center gap-3 mt-6">

            <button
              onClick={loadRFI}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg"
            >
              Try Again
            </button>

            <Link
              href={`/app/projects/${projectId}/rfis`}
              className="border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-lg"
            >
              Back to RFIs
            </Link>

          </div>

        </div>
      </main>
    );
  }

  /* =======================================================
     PROJECT ID
  ======================================================= */

  const actualProjectId =
    rfi.project_id ||
    projectId;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-8">

      <div className="max-w-7xl mx-auto">

        {/* =================================================
            BACK
        ================================================= */}

        <Link
          href={`/app/projects/${actualProjectId}/rfis`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline mb-5"
        >
          ← Back to RFIs
        </Link>

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

          {/* ===============================================
              HEADER
          =============================================== */}

          <div className="p-6 md:p-8 border-b">

            <div className="flex flex-col xl:flex-row xl:justify-between gap-8">

              {/* LEFT */}

              <div className="flex-1">

                <div className="flex items-center gap-3 flex-wrap">

                  <span className="text-sm font-semibold text-gray-500">
                    RFI
                  </span>

                  <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    {rfi.rfi_number ||
                      "RFI"}
                  </span>

                </div>

                <h1 className="text-3xl font-bold text-gray-900 mt-3">
                  RFI #
                  {rfi.rfi_number ||
                    "—"}
                </h1>

                <input
                  className="border border-gray-300 rounded-lg w-full mt-4 p-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={
                    rfi.title ?? ""
                  }
                  placeholder="RFI title"
                  onChange={(e) =>
                    updateRFI(
                      "title",
                      e.target.value
                    )
                  }
                />

              </div>

              {/* RIGHT */}

              <div className="w-full xl:w-80 space-y-4">

                {/* STATUS */}

                <div>
                  <label className="block font-semibold text-sm text-gray-700">
                    Status
                  </label>

                  <select
                    className="border border-gray-300 rounded-lg w-full mt-1 p-3 bg-white"
                    value={
                      rfi.status ??
                      "Open"
                    }
                    onChange={(e) =>
                      updateRFI(
                        "status",
                        e.target.value
                      )
                    }
                  >
                    <option value="Open">
                      Open
                    </option>

                    <option value="In Review">
                      In Review
                    </option>

                    <option value="Closed">
                      Closed
                    </option>
                  </select>
                </div>

                {/* PRIORITY */}

                <div>
                  <label className="block font-semibold text-sm text-gray-700">
                    Priority
                  </label>

                  <select
                    className="border border-gray-300 rounded-lg w-full mt-1 p-3 bg-white"
                    value={
                      rfi.priority ??
                      "Medium"
                    }
                    onChange={(e) =>
                      updateRFI(
                        "priority",
                        e.target.value
                      )
                    }
                  >
                    <option value="Low">
                      Low
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="High">
                      High
                    </option>

                    <option value="Critical">
                      Critical
                    </option>
                  </select>
                </div>

                {/* DUE DATE */}

                <div>
                  <label className="block font-semibold text-sm text-gray-700">
                    Due Date
                  </label>

                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg w-full mt-1 p-3"
                    value={
                      rfi.due_date ??
                      ""
                    }
                    onChange={(e) =>
                      updateRFI(
                        "due_date",
                        e.target.value
                      )
                    }
                  />
                </div>

              </div>

            </div>

          </div>

          {/* ===============================================
              RFI WORKFLOW
          =============================================== */}

          <div className="p-6 md:p-8 border-b bg-gray-50">

            <div className="flex items-center justify-between mb-5">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  RFI Workflow
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Track who submitted the RFI, who received it,
                  and who currently owns the response.
                </p>
              </div>

              <span className="hidden md:inline-flex bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                Ball in Court
              </span>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* SUBMITTED BY */}

              <div className="bg-white border rounded-xl p-5">

                <div className="text-2xl mb-3">
                  👤
                </div>

                <label className="block text-sm font-semibold text-gray-700">
                  Submitted By
                </label>

                <input
                  type="text"
                  className="border border-gray-300 rounded-lg w-full mt-2 p-3"
                  placeholder="Person who submitted RFI"
                  value={
                    rfi.submitted_by ??
                    ""
                  }
                  onChange={(e) =>
                    updateRFI(
                      "submitted_by",
                      e.target.value
                    )
                  }
                />

                <p className="text-xs text-gray-400 mt-2">
                  RFI originator
                </p>

              </div>

              {/* SENT TO */}

              <div className="bg-white border rounded-xl p-5">

                <div className="text-2xl mb-3">
                  📤
                </div>

                <label className="block text-sm font-semibold text-gray-700">
                  Sent To
                </label>

                <input
                  type="text"
                  className="border border-gray-300 rounded-lg w-full mt-2 p-3"
                  placeholder="Person receiving RFI"
                  value={
                    rfi.sent_to ??
                    ""
                  }
                  onChange={(e) =>
                    updateRFI(
                      "sent_to",
                      e.target.value
                    )
                  }
                />

                <p className="text-xs text-gray-400 mt-2">
                  Responsible recipient
                </p>

              </div>

              {/* BALL IN COURT */}

              <div className="bg-white border-2 border-blue-200 rounded-xl p-5">

                <div className="text-2xl mb-3">
                  🏀
                </div>

                <label className="block text-sm font-semibold text-gray-700">
                  Ball in Court
                </label>

                <input
                  type="text"
                  className="border border-blue-300 rounded-lg w-full mt-2 p-3"
                  placeholder="Who needs to act?"
                  value={
                    rfi.ball_in_court ??
                    ""
                  }
                  onChange={(e) =>
                    updateRFI(
                      "ball_in_court",
                      e.target.value
                    )
                  }
                />

                <p className="text-xs text-gray-500 mt-2">
                  Person currently responsible for the next action
                </p>

              </div>

            </div>

          </div>

          {/* ===============================================
              QUESTION / RESPONSE
          =============================================== */}

          <div className="p-6 md:p-8">

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* QUESTION */}

              <div className="border rounded-xl p-5">

                <div className="flex items-center justify-between mb-3">

                  <h2 className="text-xl font-bold">
                    Question
                  </h2>

                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    RFI Question
                  </span>

                </div>

                <textarea
                  className="border border-gray-300 rounded-lg w-full p-4 min-h-[220px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={
                    rfi.question ||
                    rfi.description ||
                    ""
                  }
                  placeholder="Enter the RFI question..."
                  onChange={(e) =>
                    updateRFI(
                      "question",
                      e.target.value
                    )
                  }
                />

              </div>

              {/* RESPONSE */}

              <div className="border rounded-xl p-5">

                <div className="flex items-center justify-between mb-3">

                  <h2 className="text-xl font-bold">
                    Response
                  </h2>

                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Response
                  </span>

                </div>

                <textarea
                  className="border border-gray-300 rounded-lg w-full p-4 min-h-[220px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={
                    rfi.response ??
                    ""
                  }
                  placeholder="Enter the response..."
                  onChange={(e) =>
                    updateRFI(
                      "response",
                      e.target.value
                    )
                  }
                />

              </div>

            </div>

          </div>

          {/* ===============================================
              LINKED DOCUMENTS
          =============================================== */}

          <div className="px-6 md:px-8 pb-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* DRAWING */}

              <div className="border rounded-xl p-5">

                <div className="flex items-center justify-between">

                  <h3 className="font-bold text-lg">
                    📄 Linked Drawing
                  </h3>

                  {rfi.drawing_id && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Linked
                    </span>
                  )}

                </div>

                <p className="text-sm text-gray-500 mt-3 break-all">
                  {rfi.drawing_id ||
                    "Not linked"}
                </p>

                {rfi.drawing_id ? (
                  <Link
                    href={`/app/projects/${actualProjectId}/drawings/${rfi.drawing_id}${
                      rfi.markup_id
                        ? `?markup=${rfi.markup_id}`
                        : ""
                    }`}
                    className="inline-flex mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    📄 Open Drawing
                  </Link>
                ) : (
                  <button
                    disabled
                    className="mt-4 bg-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed"
                  >
                    No Drawing Linked
                  </button>
                )}

              </div>

              {/* MARKUP */}

              <div className="border rounded-xl p-5">

                <div className="flex items-center justify-between">

                  <h3 className="font-bold text-lg">
                    📌 Linked Markup
                  </h3>

                  {rfi.markup_id && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      Linked
                    </span>
                  )}

                </div>

                <p className="text-sm text-gray-500 mt-3 break-all">
                  {rfi.markup_id ||
                    "Not linked"}
                </p>

              </div>

            </div>

          </div>

          {/* ===============================================
              SAVE BAR
          =============================================== */}

          <div className="border-t bg-gray-50 p-5 flex flex-col sm:flex-row justify-between gap-3">

            <button
              type="button"
              onClick={loadRFI}
              className="border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 px-5 py-3 rounded-lg"
            >
              ↻ Refresh
            </button>

            <button
              type="button"
              onClick={handleSaveRFI}
              disabled={saving}
              className={`px-6 py-3 rounded-lg text-white font-medium ${
                saving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {saving
                ? "Saving..."
                : "💾 Save RFI"}
            </button>

          </div>

        </div>

        {/* =================================================
            COMMENTS
        ================================================= */}

        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h2 className="text-2xl font-bold">
                Comments
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Project discussion and RFI communication.
              </p>

            </div>

            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
              {comments.length}{" "}
              {comments.length === 1
                ? "comment"
                : "comments"}
            </span>

          </div>

          {comments.length === 0 ? (
            <div className="border border-dashed rounded-xl p-8 text-center text-gray-500">
              No comments yet.
            </div>
          ) : (
            <div className="space-y-4">

              {comments.map(
                (comment) => (
                  <div
                    key={comment.id}
                    className="border rounded-xl p-4 bg-gray-50"
                  >

                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2">

                      <strong className="text-gray-900">
                        {comment.author ||
                          "Unknown User"}
                      </strong>

                      <span className="text-gray-500 text-sm">
                        {comment.created_at
                          ? new Date(
                              comment.created_at
                            ).toLocaleString()
                          : ""}
                      </span>

                    </div>

                    <p className="mt-3 text-gray-700 whitespace-pre-wrap">
                      {comment.comment}
                    </p>

                  </div>
                )
              )}

            </div>
          )}

          <div className="mt-6">

            <textarea
              className="border border-gray-300 rounded-lg w-full p-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Write a comment..."
              value={
                newComment
              }
              onChange={(e) =>
                setNewComment(
                  e.target.value
                )
              }
            />

            <div className="flex justify-end">

              <button
                type="button"
                onClick={
                  handleComment
                }
                disabled={
                  !newComment.trim()
                }
                className={`mt-3 px-5 py-2.5 rounded-lg text-white ${
                  newComment.trim()
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Add Comment
              </button>

            </div>

          </div>

        </div>

        {/* =================================================
            ATTACHMENTS
        ================================================= */}

        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6 mb-10">

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5">

            <div>

              <h2 className="text-2xl font-bold">
                Attachments
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Documents attached to this RFI.
              </p>

            </div>

            <label
              className={`inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-white ${
                uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              }`}
            >

              {uploading
                ? "Uploading..."
                : "+ Upload"}

              <input
                type="file"
                hidden
                disabled={
                  uploading
                }
                onChange={
                  handleUpload
                }
              />

            </label>

          </div>

          {attachments.length ===
          0 ? (
            <div className="border border-dashed rounded-xl p-8 text-center text-gray-500">
              No attachments yet.
            </div>
          ) : (
            <div className="space-y-3">

              {attachments.map(
                (file) => (
                  <div
                    key={file.id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border rounded-xl p-4"
                  >

                    <div className="min-w-0">

                      <p className="font-medium text-gray-900 truncate">
                        📄{" "}
                        {file.file_name ||
                          "Attachment"}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {file.uploaded_by ||
                          "Unknown user"}
                      </p>

                    </div>

                    <div className="flex items-center gap-4">

                      {file.file_url && (
                        <a
                          href={
                            file.file_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Open
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteAttachment(
                            file.id,
                            file.file_url ||
                              ""
                          )
                        }
                        className="text-red-600 hover:text-red-800 hover:underline"
                      >
                        Delete
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

      </div>

    </main>
  );
}