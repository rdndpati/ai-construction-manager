"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SubmittalFileUpload from "@/components/submittals/SubmittalFileUpload";
import Link from "next/link";

export default function SubmittalDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  const submittalId = params.id as string;
  const [aiReview, setAiReview] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);  

  const [submittal, setSubmittal] = useState<any>(null);

  useEffect(() => {
    loadSubmittal();
  }, []);

  async function loadSubmittal() {
    const { data } = await supabase
      .from("submittals")
      .select("*")
      .eq("id", submittalId)
      .single();

    setSubmittal(data);
  }

  async function saveSubmittal() {
    const { error } = await supabase
      .from("submittals")
      .update({
        title: submittal.title,
        description: submittal.description,
        vendor: submittal.vendor,
        manufacturer: submittal.manufacturer,
        reviewer: submittal.reviewer,
        status: submittal.status,
        priority: submittal.priority,
        due_date: submittal.due_date,
        file_url: submittal.file_url,
      })
      .eq("id", submittal.id);

    if (error) {
      alert("Failed to save.");
      return;
    }

    alert("Submittal Updated");
  }
  async function analyzeSubmittal() {
  if (!submittal.file_url) {
    alert("Please upload a PDF first.");
    return;
  }

  setAnalyzing(true);

  try {
    const pdfResponse = await fetch(submittal.file_url);
    const pdfBlob = await pdfResponse.blob();

    const formData = new FormData();
    formData.append("file", pdfBlob, "submittal.pdf");

    const response = await fetch("/api/ai/summarize", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    console.log(result);

    if (!response.ok) {
      throw new Error(result.error || "AI analysis failed");
    }

   setAiReview(result);
  } catch (err) {
    console.error(err);
    alert("AI analysis failed.");
  } finally {
    setAnalyzing(false);
  }
}

  if (!submittal)
    return <div className="p-8">Loading...</div>;

  return (
    <main className="max-w-6xl mx-auto p-8">
        <Link
  href={
    projectId
      ? `/submittals?project=${projectId}`
      : "/submittals"
  }
  className="text-blue-600 hover:underline"
>
  ← Back to Submittals
</Link>


      <h1 className="text-3xl font-bold mb-8">
        {submittal.submittal_number}
      </h1>

      <div className="grid grid-cols-2 gap-6">

        <input
          className="border rounded p-3"
          value={submittal.title}
          onChange={(e)=>
            setSubmittal({
              ...submittal,
              title:e.target.value
            })
          }
        />
        

        <input
          className="border rounded p-3"
          value={submittal.vendor}
          onChange={(e)=>
            setSubmittal({
              ...submittal,
              vendor:e.target.value
            })
          }
        />

        <input
          className="border rounded p-3"
          value={submittal.manufacturer}
          onChange={(e)=>
            setSubmittal({
              ...submittal,
              manufacturer:e.target.value
            })
          }
        />

        <input
          className="border rounded p-3"
          value={submittal.reviewer}
          onChange={(e)=>
            setSubmittal({
              ...submittal,
              reviewer:e.target.value
            })
          }
        />

        <select
          className="border rounded p-3"
          value={submittal.status}
          onChange={(e)=>
            setSubmittal({
              ...submittal,
              status:e.target.value
            })
          }
        >
          <option>Pending</option>
          <option>In Review</option>
          <option>Approved</option>
          <option>Revise & Resubmit</option>
          <option>Rejected</option>
        </select>

        <select
          className="border rounded p-3"
          value={submittal.priority}
          onChange={(e)=>
            setSubmittal({
              ...submittal,
              priority:e.target.value
            })
          }
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>

      </div>

      <textarea
        className="border rounded w-full mt-6 p-4 min-h-[200px]"
        value={submittal.description ?? ""}
        onChange={(e)=>
          setSubmittal({
            ...submittal,
            description:e.target.value
          })
        }
      />

      <SubmittalFileUpload
    submittalId={submittal.id}
    onUploaded={(url) =>
        setSubmittal({
            ...submittal,
            file_url: url,
        })
    }
/>

{submittal.file_url && (
    <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">
            Uploaded PDF
        </h2>

        <iframe
            src={submittal.file_url}
            className="w-full h-[700px] border rounded"
            title="Submittal PDF"
        />
    </div>
)}

<div className="mt-8 flex justify-between">

  <button
    onClick={analyzeSubmittal}
    disabled={analyzing}
    className="bg-blue-600 text-white px-6 py-3 rounded-lg"
  >
    {analyzing ? "Analyzing..." : "🤖 Analyze with AI"}
  </button>

  <button
    onClick={saveSubmittal}
    className="bg-green-600 text-white px-6 py-3 rounded-lg"
  >
    Save Changes
  </button>

</div>
{aiReview && (
  <div className="mt-8 rounded-lg border bg-gray-50 p-6">

    <h2 className="text-2xl font-bold mb-4">
      🤖 AI Assistant
    </h2>

    <p className="mb-4">
      <strong>Document Type:</strong> {aiReview.documentType}
    </p>

    {/* Non-submittal documents */}
    {aiReview.summary && (
      <div>
        <h3 className="font-bold text-lg mb-2">
          📄 AI Summary
        </h3>

        <p className="whitespace-pre-wrap">
          {aiReview.summary}
        </p>
      </div>
    )}

    {/* Engineering Submittals */}
    {aiReview.review && (
      <>
        <p>
          <strong>Product:</strong> {aiReview.review.product}
        </p>

        <p>
          <strong>Manufacturer:</strong> {aiReview.review.manufacturer}
        </p>

        <p>
          <strong>Model:</strong> {aiReview.review.model}
        </p>

        <h3 className="mt-4 font-bold">
          Specifications
        </h3>

        <ul className="list-disc ml-6">
          {aiReview.review.specifications?.map(
            (item: string, index: number) => (
              <li key={index}>{item}</li>
            )
          )}
        </ul>

        <h3 className="mt-4 font-bold">
          Risks
        </h3>

        <ul className="list-disc ml-6">
          {aiReview.review.risks?.map(
            (item: string, index: number) => (
              <li key={index}>{item}</li>
            )
          )}
        </ul>

        <h3 className="mt-4 font-bold">
          Missing Information
        </h3>

        <ul className="list-disc ml-6">
          {aiReview.review.missingInformation?.map(
            (item: string, index: number) => (
              <li key={index}>{item}</li>
            )
          )}
        </ul>

        <h3 className="mt-4 font-bold">
          Reviewer Checklist
        </h3>

        <ul className="list-disc ml-6">
          {aiReview.review.reviewChecklist?.map(
            (item: string, index: number) => (
              <li key={index}>{item}</li>
            )
          )}
        </ul>
      </>
    )}

  </div>
)}
    </main>
  );
}