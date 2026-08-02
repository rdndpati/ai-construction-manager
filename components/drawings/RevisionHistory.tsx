"use client";

import { useEffect, useState } from "react";
import { getRevisions, createRevision } from "@/lib/revisions";

import NewRevisionDialog from "@/components/NewRevisionDialog";
import RevisionCompareDialog from "@/components/RevisionCompareDialog";
import ComparisonHistory from "./ComparisonHistory";

type Props = {
  drawingId: string;
};

export default function RevisionHistory({
  drawingId,
}: Props) {
  const [revisions, setRevisions] = useState<any[]>([]);

  const [showUpload, setShowUpload] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    loadRevisions();
  }, []);

  async function loadRevisions() {
    const data = await getRevisions(drawingId);
    setRevisions(data);
  }

  async function saveRevision(revision: any) {
    const saved = await createRevision(revision);

    if (saved) {
      loadRevisions();
    }

    setShowUpload(false);
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="text-xl font-bold mb-4">
          Revision History
        </h2>

        {revisions.length === 0 ? (
          <p className="text-gray-500">
            No revisions uploaded.
          </p>
        ) : (
          <div className="space-y-2 mb-6">
            {revisions.map((revision) => (
              <div
                key={revision.id}
                className="flex justify-between border rounded p-3"
              >
                <div>
                  <div className="font-medium">
                    {revision.revision_number}
                  </div>

                  <div className="text-sm text-gray-500">
                    {revision.revision_date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">

          <button
            onClick={() => setShowUpload(true)}
            className="w-full bg-blue-600 text-white rounded-lg p-3"
          >
            Upload Revision
          </button>

          <button
            disabled={revisions.length < 2}
            onClick={() => setShowCompare(true)}
            className="w-full bg-green-600 text-white rounded-lg p-3 disabled:bg-gray-300"
          >
            Compare Revisions
          </button>

        </div>

        <ComparisonHistory drawingId={drawingId} />

      </div>

      {showUpload && (
        <NewRevisionDialog
          drawingId={drawingId}
          onSave={saveRevision}
          onClose={() => setShowUpload(false)}
        />
      )}

      {showCompare && (
        <RevisionCompareDialog
          revisions={revisions}
          onClose={() => setShowCompare(false)}
        />
      )}
    </>
  );
}