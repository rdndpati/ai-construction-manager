"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function NewDrawingPage({ params }: Props) {
  const { id } = use(params);

  const router = useRouter();

  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [revision, setRevision] = useState("");
  const [status, setStatus] = useState("Review");
  const [file, setFile] = useState<File | null>(null);

  async function handleUpload(e: React.FormEvent) {
  e.preventDefault();

  if (!file) {
    alert("Please choose a PDF.");
    return;
  }

  try {
    // Create a unique filename
    const fileName = `${Date.now()}-${file.name}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("drawings")
      .upload(fileName, file);

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    // Get the public URL
    const { data } = supabase.storage
      .from("drawings")
      .getPublicUrl(fileName);

    // Save the drawing record
    const { error: insertError } = await supabase
      .from("drawings")
      .insert({
        project_id: id,
        number,
        name,
        revision,
        status,
        file_url: data.publicUrl,
      });

    if (insertError) {
      alert(insertError.message);
      return;
    }

    alert("Drawing uploaded successfully!");

    router.push(`/projects/${id}/drawings`);
    router.refresh();

  } catch (err) {
    console.error(err);
    alert("Upload failed.");
  }
}

  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <Link
        href={`/projects/${id}/drawings`}
        className="text-blue-600 hover:underline"
      >
        ← Back to Drawings
      </Link>

      <h1 className="text-4xl font-bold mt-6">
        Upload Drawing
      </h1>

      <form
        onSubmit={handleUpload}
        className="bg-white rounded-xl shadow p-8 mt-8 max-w-2xl space-y-6"
      >
        <div>
          <label className="block font-semibold mb-2">
            Drawing Number
          </label>

          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="w-full border rounded-lg p-3"
            placeholder="C-101"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">
            Drawing Name
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg p-3"
            placeholder="Site Layout"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">
            Revision
          </label>

          <input
            value={revision}
            onChange={(e) => setRevision(e.target.value)}
            className="w-full border rounded-lg p-3"
            placeholder="Rev 1"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">
            Status
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded-lg p-3"
          >
            <option>Review</option>
            <option>IFC</option>
            <option>Approved</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-2">
            PDF Drawing
          </label>

          <input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setFile(e.target.files?.[0] ?? null)
            }
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Upload Drawing
        </button>
      </form>

    </main>
  );
}