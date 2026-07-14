"use client";
import { getComments, createComment } from "@/lib/comments";
import { useEffect, useState } from "react";
import { getAttachments, uploadAttachment } from "@/lib/attachments";
import { useParams } from "next/navigation";
import Link from "next/link";

import { supabase } from "@/lib/supabase";

export default function RFIDetailsPage() {
  const params = useParams();

  const projectId = params.id as string;
  const rfiId = params.rfiId as string;
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const [rfi, setRFI] = useState<any>(null);

  useEffect(() => {
    async function loadRFI() {
      const { data } = await supabase
        .from("rfis")
        .select("*")
        .eq("id", rfiId)
        .single();

      setRFI(data);
      const list = await getComments(rfiId);
setComments(list);
const files = await getAttachments(rfiId);
setAttachments(files);
    }

    if (rfiId) {
      loadRFI();
    }
  }, [rfiId]);

  if (!rfi) {
    return (
      <main className="p-8">
        Loading...
      </main>
    );
  }
  async function handleComment() {
  if (!newComment.trim()) return;

  const comment = await createComment({
    rfi_id: rfiId,
    author: "Project Engineer",
    comment: newComment,
  });

  if (comment) {
    setComments((prev) => [...prev, comment]);
    setNewComment("");
  }
}
async function handleUpload(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const file = e.target.files?.[0];

  if (!file) return;

  setUploading(true);

  const uploaded = await uploadAttachment(file, rfiId);

  if (uploaded) {
    setAttachments((prev) => [...prev, uploaded]);
  }

  setUploading(false);
}

  return (
    <main className="p-8 bg-gray-100 min-h-screen">

      <Link
        href={`/projects/${projectId}/rfis`}
        className="text-blue-600 hover:underline"
      >
        ← Back to RFIs
      </Link>

      <div className="bg-white rounded-xl shadow mt-6 p-8">

        <div className="flex justify-between">

          <div>

            <h1 className="text-3xl font-bold">
              RFI #{rfi.rfi_number}
            </h1>

            <p className="text-gray-500 mt-2">
              {rfi.title}
            </p>

          </div>

          <div className="text-right">

            <p>
              <strong>Status:</strong> {rfi.status}
            </p>

            <p>
              <strong>Priority:</strong> {rfi.priority}
            </p>

            <p>
              <strong>Due:</strong> {rfi.due_date}
            </p>

          </div>

        </div>

        <hr className="my-8" />

        <h2 className="text-xl font-bold mb-3">
          Question
        </h2>

        <div className="border rounded p-4 min-h-[150px]">
          {rfi.question || rfi.description || "No question yet."}
        </div>

        <h2 className="text-xl font-bold mt-8 mb-3">
          Response
        </h2>

        <div className="border rounded p-4 min-h-[150px]">
          {rfi.response || "No response yet."}
        </div>

        <div className="grid grid-cols-2 gap-6 mt-8">

          <div className="border rounded p-5">

            <h3 className="font-bold mb-2">
              Linked Drawing
            </h3>

            <p>{rfi.drawing_id || "Not linked"}</p>

          </div>

          <div className="border rounded p-5">

            <h3 className="font-bold mb-2">
              Linked Markup
            </h3>

            <p>{rfi.markup_id || "Not linked"}</p>

          </div>

        </div>

      </div>
      <div className="mt-10 bg-white rounded-xl shadow p-6">

  <h2 className="text-2xl font-bold mb-5">
    Comments
  </h2>

  <div className="space-y-4">

    {comments.map((c) => (

      <div
        key={c.id}
        className="border rounded-lg p-4"
      >

        <div className="flex justify-between">

          <strong>{c.author}</strong>

          <span className="text-gray-500 text-sm">
            {new Date(c.created_at).toLocaleString()}
          </span>

        </div>

        <p className="mt-2">
          {c.comment}
        </p>

      </div>

    ))}

  </div>

  <textarea
    className="border rounded w-full p-3 mt-6"
    rows={4}
    placeholder="Write a comment..."
    value={newComment}
    onChange={(e) => setNewComment(e.target.value)}
  />

  <button
    onClick={handleComment}
    className="mt-4 bg-blue-600 text-white px-5 py-2 rounded"
  >
    Add Comment
  </button>

</div>
<div className="mt-10 bg-white rounded-xl shadow p-6">

  <div className="flex justify-between items-center mb-5">

    <h2 className="text-2xl font-bold">
      Attachments
    </h2>

    <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">

      {uploading ? "Uploading..." : "+ Upload"}

      <input
        type="file"
        hidden
        onChange={handleUpload}
      />

    </label>

  </div>

  {attachments.length === 0 && (

    <p className="text-gray-500">
      No attachments yet.
    </p>

  )}

  <div className="space-y-3">

    {attachments.map((file) => (

      <div
        key={file.id}
        className="flex justify-between items-center border rounded p-3"
      >

        <div>

          <p className="font-medium">
            📄 {file.file_name}
          </p>

          <p className="text-sm text-gray-500">
            {file.uploaded_by}
          </p>

        </div>

        <a
          href={file.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Open
        </a>

      </div>

    ))}

  </div>

</div>

    </main>
  );
}