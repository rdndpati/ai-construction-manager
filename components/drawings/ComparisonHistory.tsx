"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Comparison {
  id: string;
  ai_summary: string;
  created_at: string;
  left_revision_id: string;
  right_revision_id: string;
}

export default function ComparisonHistory({
  drawingId,
}: {
  drawingId: string;
}) {
  const [history, setHistory] = useState<Comparison[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const { data, error } = await supabase
      .from("revision_comparisons")
      .select("*")
      .eq("drawing_id", drawingId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setHistory(data);
    }
  }

  return (
    <div className="border rounded-xl p-4 mt-6">
      <h2 className="text-lg font-semibold mb-4">
        AI Comparison History
      </h2>

      {history.length === 0 ? (
        <p className="text-gray-500">
          No saved comparisons.
        </p>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-3 hover:bg-gray-50"
            >
              <div className="text-sm text-gray-500">
                {new Date(item.created_at).toLocaleString()}
              </div>

              <div className="mt-2 whitespace-pre-wrap">
                {item.ai_summary}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}