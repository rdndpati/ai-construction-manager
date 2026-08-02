"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
type Props = {
  revisions: any[];
  onClose: () => void;
};

export default function RevisionCompareDialog({
  revisions,
  onClose,
}: Props) {
    const [leftRevision, setLeftRevision] = useState(revisions[0]);
const [rightRevision, setRightRevision] = useState(revisions[1] || revisions[0]);
const [loading, setLoading] = useState(false);
const [comparison, setComparison] = useState("");
async function compareRevisions() {
  setLoading(true);

  const ai = await fetch("/api/compare-revisions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      leftText: leftRevision.extracted_text,
      rightText: rightRevision.extracted_text,
    }),
  }).then((r) => r.json());

  setComparison(ai.comparison);

  const { error } = await supabase
    .from("revision_comparisons")
    .insert([
      {
        drawing_id: leftRevision.drawing_id,
        left_revision_id: leftRevision.id,
        right_revision_id: rightRevision.id,
        ai_summary: ai.comparison,
      },
    ]);

  if (error) {
    console.error(error);
  }

  setLoading(false);
}
  return (
    <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto">

      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="bg-white rounded-xl w-[900px] max-h-[90vh] overflow-y-auto p-6">

        <h2 className="text-2xl font-bold mb-6">
          Compare Revisions
        </h2>

        <div className="grid grid-cols-2 gap-6">

          <div>
            <h3 className="font-semibold mb-2">
              Left Revision
            </h3>

            <select
  className="border rounded p-2 w-full"
  value={leftRevision?.id}
  onChange={(e) =>
    setLeftRevision(
      revisions.find((r) => r.id === e.target.value)
    )
  }
>
  {revisions.map((r) => (
    <option key={r.id} value={r.id}>
      {r.revision_number}
    </option>
  ))}
</select>

            <iframe
  src={leftRevision?.pdf_url}
  className="w-full h-[500px] border rounded"
/>
          </div>

          <div>
            <h3 className="font-semibold mb-2">
              Right Revision
            </h3>

            <select
  className="border rounded p-2 w-full"
  value={rightRevision?.id}
  onChange={(e) =>
    setRightRevision(
      revisions.find((r) => r.id === e.target.value)
    )
  }
>
  {revisions.map((r) => (
    <option key={r.id} value={r.id}>
      {r.revision_number}
    </option>
  ))}
</select>

            <iframe
  src={rightRevision?.pdf_url}
  className="w-full h-[500px] border rounded"
/>
          </div>

        </div>
        {comparison && (
  <div className="mt-6 border rounded p-4 bg-gray-50">
    <h3 className="font-bold mb-2">
      AI Comparison
    </h3>

    <pre className="whitespace-pre-wrap text-sm">
      {comparison}
    </pre>
  </div>
)}

        <div className="flex justify-end mt-6">
            <button
  onClick={compareRevisions}
  className="bg-blue-600 text-white px-5 py-2 rounded mr-3"
>
  {loading ? "Analyzing..." : "Analyze Changes"}
</button>

          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-5 py-2 rounded"
          >
            Close
          </button>

        </div>

      </div>

    </div>
  </div>
  );
}