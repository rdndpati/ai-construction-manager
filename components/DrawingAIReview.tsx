"use client";

import { useState } from "react";

type Props = {
  drawing: any;
};

export default function DrawingAIReview({ drawing }: Props) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState(
  drawing.ai_review || ""
);
  async function analyze() {
    try {
      setLoading(true);
      

      let extractedText = drawing.extracted_text;

      // Only extract if not already saved
      if (!extractedText) {
        const extractRes = await fetch("/api/extract-drawing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pdfUrl: drawing.file_url,
            drawingId: drawing.id,
          }),
        });

        if (!extractRes.ok) {
          throw new Error("Failed to extract text from PDF");
        }

        const extractData = await extractRes.json();

        extractedText = extractData.extractedText;
      }

      // Analyze using Ollama
      const analyzeRes = await fetch("/api/drawings/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          drawing: {
            ...drawing,
            extracted_text: extractedText,
          },
        }),
      });

      if (!analyzeRes.ok) {
        throw new Error("Failed to analyze drawing");
      }

      const analyzeData = await analyzeRes.json();

      setReview(analyzeData.review);
    } catch (err) {
      console.error(err);
      alert("Unable to analyze drawing.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-4">
        AI Engineering Review
      </h2>

      <button
  onClick={analyze}
  disabled={loading}
  className="bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50"
>
  {loading ? "Analyzing..." : "Analyze Drawing"}
</button>
      {review && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">
            AI Review
          </h3>

          <pre className="whitespace-pre-wrap text-sm bg-gray-100 rounded-lg p-4 max-h-[600px] overflow-auto">
            {review}
          </pre>
        </div>
      )}
    </div>
  );
}