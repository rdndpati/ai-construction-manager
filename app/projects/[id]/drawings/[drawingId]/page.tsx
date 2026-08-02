import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DrawingAIReview from "@/components/DrawingAIReview";
import RevisionHistory from "@/components/drawings/RevisionHistory";

type Props = {
  params: Promise<{
    id: string;
    drawingId: string;
  }>;
};

export default async function DrawingDetails({ params }: Props) {
  const { id, drawingId } = await params;

  const { data: drawing, error } = await supabase
    .from("drawings")
    .select("*")
    .eq("id", drawingId)
    .single();

  if (error || !drawing) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">
          Drawing not found
        </h1>

        <Link
          href={`/projects/${id}/drawings`}
          className="text-blue-600 hover:underline"
        >
          ← Back to Drawings
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <Link
        href={`/projects/${id}/drawings`}
        className="text-blue-600 hover:underline"
      >
        ← Back to Drawings
      </Link>

      <h1 className="text-4xl font-bold mt-4">
        {drawing.number} - {drawing.name}
      </h1>

      <div className="grid grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">
            Drawing Information
          </h2>

          <p>
            <strong>Number:</strong> {drawing.number}
          </p>

          <p>
            <strong>Name:</strong> {drawing.name}
          </p>

          <p>
            <strong>Revision:</strong> {drawing.revision}
          </p>

          <p>
            <strong>Status:</strong> {drawing.status}
          </p>
        </div>

        <DrawingAIReview drawing={drawing} />
        <RevisionHistory drawingId={drawing.id} />
      </div>

      <div className="bg-white rounded-xl shadow mt-8 p-6">

  <h2 className="text-2xl font-bold mb-4">
    PDF Drawing
  </h2>

  <iframe
  src={drawing.file_url}
  className="w-full h-[900px] rounded border"
/>
</div>
    </main>
  );
}