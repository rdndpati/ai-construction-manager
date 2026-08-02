"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export default function AIAssistantPage() {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
   const [loading, setLoading] = useState(false);
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
   async function askAI() {
  if (!question.trim()) return;

  setLoading(true);
  setAnswer("");

  try {
    const formData = new FormData();

formData.append("question", question);

if (selectedFile) {
  formData.append("file", selectedFile);
}

const response = await fetch("/api/ai/chat", {
  method: "POST",
  body: formData,
});

    const data = await response.json();

    setAnswer(data.answer || "No response received.");
  } catch (error) {
    console.error(error);
    setAnswer("Something went wrong.");
  }

  setLoading(false);
}
function handleFileChange(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const file = e.target.files?.[0];

  if (!file) return;

  setSelectedFile(file);
}
async function generateRFI() {
  if (!selectedFile) {
    alert("Please upload a drawing first.");
    return;
  }

  const formData = new FormData();

  formData.append("file", selectedFile);

  const response = await fetch("/api/ai/generate-rfi", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  console.log(data);

  setAnswer(JSON.stringify(data, null, 2));
}
  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold">
          AI Construction Assistant
        </h1>

        <p className="text-gray-600 mt-2">
          Ask questions about your construction projects.
        </p>

        <div className="bg-white rounded-xl shadow p-6 mt-8">
    <div className="mb-6">

  <input
    ref={fileInputRef}
    type="file"
    accept=".pdf"
    hidden
    onChange={handleFileChange}
  />

  <button
    onClick={() => fileInputRef.current?.click()}
    className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
  >
    + Upload Drawing
  </button>

  {selectedFile && (
    <p className="mt-3 text-green-700 font-medium">
      📄 {selectedFile.name}
    </p>
  )}

</div>

          <textarea
  value={question}
  onChange={(e) => setQuestion(e.target.value)}
  placeholder="Ask AI anything about your drawings, RFIs, specifications, compliance reports, or submittals..."
  className="w-full border rounded-lg p-4 h-40 resize-none"
/>
          <button
  onClick={askAI}
  disabled={loading}
  className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
>
  {loading ? "Thinking..." : "Ask AI"}
</button>
<button
  onClick={generateRFI}
  className="ml-3 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
>
  Generate AI RFI
</button>
{answer && (
  <div className="mt-6 border rounded-lg p-4 bg-gray-50">
    <h3 className="font-bold mb-2">
      AI Response
    </h3>

    <p className="whitespace-pre-wrap">
      {answer}
    </p>
  </div>
)}
        </div>

        <div className="bg-white rounded-xl shadow p-6 mt-8">

          <h2 className="text-2xl font-bold mb-4">
            Suggested Questions
          </h2>

          <ul className="space-y-2 text-blue-600">

            <li>• Summarize my latest drawing</li>

            <li>• Show all open RFIs</li>

            <li>• Explain this specification</li>

            <li>• Check compliance issues</li>

            <li>• Which submittals are pending?</li>

            <li>• Compare drawing revisions</li>

          </ul>

        </div>

        <Link
          href="/"
          className="inline-block mt-8 text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>

      </div>

    </main>
  );
}