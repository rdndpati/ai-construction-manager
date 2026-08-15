import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
    drawingId: string;
  }>;
};

type Drawing = {
  id: string;
  project_id: string;
  number: string | null;
  name: string | null;
  revision: string | null;
  status: string | null;
  file_url: string | null;
  created_at: string | null;
};

export default async function CompareRevisionsPage({
  params,
}: Props) {
  const { id, drawingId } = await params;

  const supabase = await createClient();

  // ---------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ---------------------------------------------------------
  // Company
  // ---------------------------------------------------------
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    redirect("/create-company");
  }

  // ---------------------------------------------------------
  // Project
  // ---------------------------------------------------------
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();

  if (!project) {
    redirect("/app/projects");
  }

  // ---------------------------------------------------------
  // Current drawing
  // ---------------------------------------------------------
  const { data: currentDrawing } = await supabase
    .from("drawings")
    .select("*")
    .eq("id", drawingId)
    .eq("project_id", id)
    .single();

  if (!currentDrawing) {
    redirect(`/app/projects/${id}/drawings`);
  }

  // ---------------------------------------------------------
  // Get all revisions with same drawing number
  // ---------------------------------------------------------
  const { data: revisionData } = await supabase
    .from("drawings")
    .select("*")
    .eq("project_id", id)
    .eq("number", currentDrawing.number)
    .order("created_at", { ascending: false });

  const revisions: Drawing[] = revisionData ?? [];

  if (revisions.length < 2) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">

          <Link
            href={`/app/projects/${id}/drawings/${drawingId}`}
            className="text-blue-600 hover:underline"
          >
            ← Back to Drawing
          </Link>

          <div className="bg-white border rounded-xl p-10 mt-8 text-center">

            <h1 className="text-3xl font-bold">
              Not Enough Revisions
            </h1>

            <p className="text-gray-500 mt-3">
              At least two revisions are required to compare drawings.
            </p>

          </div>

        </div>
      </main>
    );
  }

  // ---------------------------------------------------------
  // Use newest revision as left
  // and second newest as right
  // ---------------------------------------------------------
  const leftRevision = revisions[0];
  const rightRevision = revisions[1];

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-[1800px] mx-auto">

        {/* -------------------------------------------------
            Header
        ------------------------------------------------- */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>

            <Link
              href={`/app/projects/${id}/drawings/${drawingId}`}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to Drawing
            </Link>

            <h1 className="text-4xl font-bold text-gray-900 mt-3">
              Revision Comparison
            </h1>

            <p className="text-gray-500 mt-1">
              {currentDrawing.number} - {currentDrawing.name}
            </p>

          </div>

          <div className="flex gap-3">

            <Link
              href={`/app/projects/${id}/drawings/${drawingId}`}
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              Close
            </Link>

          </div>

        </div>

        {/* -------------------------------------------------
            Revision Selection
        ------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

          <div className="bg-white border rounded-xl p-5">

            <p className="text-sm font-semibold text-gray-500 uppercase">
              Left Revision
            </p>

            <div className="mt-3 border rounded-lg p-4 bg-gray-50">

              <p className="text-xl font-bold">
                {leftRevision.revision || "Revision"}
              </p>

              <p className="text-sm text-gray-500 mt-1">
                {leftRevision.name}
              </p>

              {leftRevision.created_at && (
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(
                    leftRevision.created_at
                  ).toLocaleDateString()}
                </p>
              )}

            </div>

          </div>

          <div className="bg-white border rounded-xl p-5">

            <p className="text-sm font-semibold text-gray-500 uppercase">
              Right Revision
            </p>

            <div className="mt-3 border rounded-lg p-4 bg-gray-50">

              <p className="text-xl font-bold">
                {rightRevision.revision || "Revision"}
              </p>

              <p className="text-sm text-gray-500 mt-1">
                {rightRevision.name}
              </p>

              {rightRevision.created_at && (
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(
                    rightRevision.created_at
                  ).toLocaleDateString()}
                </p>
              )}

            </div>

          </div>

        </div>

        {/* -------------------------------------------------
            Side-by-Side PDFs
        ------------------------------------------------- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">

          {/* LEFT */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">

            <div className="px-5 py-4 border-b flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold">
                  {leftRevision.revision}
                </h2>

                <p className="text-sm text-gray-500">
                  Previous / Selected Revision
                </p>
              </div>

              {leftRevision.file_url && (
                <a
                  href={leftRevision.file_url}
                  download
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm"
                >
                  ↓ Download
                </a>
              )}

            </div>

            {leftRevision.file_url ? (

              <div className="bg-gray-800 p-3">

                <iframe
                  src={leftRevision.file_url}
                  title={`Left ${leftRevision.revision}`}
                  className="w-full h-[1000px] bg-white rounded-lg"
                />

              </div>

            ) : (

              <div className="h-[1000px] flex items-center justify-center text-gray-500">
                No PDF available.
              </div>

            )}

          </div>

          {/* RIGHT */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">

            <div className="px-5 py-4 border-b flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold">
                  {rightRevision.revision}
                </h2>

                <p className="text-sm text-gray-500">
                  Current / Selected Revision
                </p>
              </div>

              {rightRevision.file_url && (
                <a
                  href={rightRevision.file_url}
                  download
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm"
                >
                  ↓ Download
                </a>
              )}

            </div>

            {rightRevision.file_url ? (

              <div className="bg-gray-800 p-3">

                <iframe
                  src={rightRevision.file_url}
                  title={`Right ${rightRevision.revision}`}
                  className="w-full h-[1000px] bg-white rounded-lg"
                />

              </div>

            ) : (

              <div className="h-[1000px] flex items-center justify-center text-gray-500">
                No PDF available.
              </div>

            )}

          </div>

        </div>

        {/* -------------------------------------------------
            Revision Information
        ------------------------------------------------- */}
        <div className="bg-white border rounded-xl shadow-sm mt-8 p-6">

          <h2 className="text-2xl font-bold">
            Revision Information
          </h2>

          <p className="text-gray-500 mt-1">
            Review the document versions manually side-by-side.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

            <div className="border rounded-lg p-5">

              <h3 className="font-bold text-lg">
                {leftRevision.revision}
              </h3>

              <div className="mt-4 space-y-2 text-sm">

                <p>
                  <strong>Drawing:</strong>{" "}
                  {leftRevision.number}
                </p>

                <p>
                  <strong>Name:</strong>{" "}
                  {leftRevision.name}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {leftRevision.status || "—"}
                </p>

                <p>
                  <strong>Date:</strong>{" "}
                  {leftRevision.created_at
                    ? new Date(
                        leftRevision.created_at
                      ).toLocaleDateString()
                    : "—"}
                </p>

              </div>

            </div>

            <div className="border rounded-lg p-5">

              <h3 className="font-bold text-lg">
                {rightRevision.revision}
              </h3>

              <div className="mt-4 space-y-2 text-sm">

                <p>
                  <strong>Drawing:</strong>{" "}
                  {rightRevision.number}
                </p>

                <p>
                  <strong>Name:</strong>{" "}
                  {rightRevision.name}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {rightRevision.status || "—"}
                </p>

                <p>
                  <strong>Date:</strong>{" "}
                  {rightRevision.created_at
                    ? new Date(
                        rightRevision.created_at
                      ).toLocaleDateString()
                    : "—"}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}