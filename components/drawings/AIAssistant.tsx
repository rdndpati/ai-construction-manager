"use client";

import { useState } from "react";

export default function AIAssistant({
  drawingId,
}: {
  drawingId: string;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function askAI() {
    if (!question.trim()) return;

    setLoading(true);

    const response = await fetch("/api/ask-drawing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        drawingId,
        question,
      }),
    });

    const data = await response.json();

    setAnswer(data.answer);

    setLoading(false);
  }

  return (
    <div className="border rounded-xl p-4 mt-6">

      <h2 className="text-xl font-bold">
        AI Assistant
      </h2>

      <textarea
        className="w-full border rounded mt-4 p-3"
        rows={3}
        placeholder="Ask about this drawing..."
        value={question}
        onChange={(e)=>setQuestion(e.target.value)}
      />

      <button
        onClick={askAI}
        className="mt-3 bg-blue-600 text-white px-5 py-2 rounded"
      >
        {loading ? "Thinking..." : "Ask AI"}
      </button>
      <button
  onClick={() =>
    setQuestion(
      "Create an RFI for the current drawing."
    )
  }
  className="ml-3 bg-orange-600 text-white px-5 py-2 rounded"
>
  Generate RFI
</button>

      {answer && (
        <div className="mt-5 bg-gray-100 rounded p-4 whitespace-pre-wrap">
          {answer}
        </div>
      )}

    </div>
  );
}