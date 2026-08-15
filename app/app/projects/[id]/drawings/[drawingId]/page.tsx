import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
    drawingId: string;
  }>;
};

function getStageClass(status?: string | null) {
  switch (status) {
    case "10%":
      return "bg-gray-100 text-gray-700 border-gray-200";

    case "30%":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "60%":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case "90%":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "IFC":
      return "bg-green-50 text-green-700 border-green-200";

    case "Approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "Issued":
      return "bg-teal-50 text-teal-700 border-teal-200";

    case "Review":
      return "bg-orange-50 text-orange-700 border-orange-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default async function DrawingDetails({
  params,
}: Props) {
  const { id, drawingId } = await params;

  const supabase = await createClient();

  /* =========================================================
     GET LOGGED-IN USER
  ========================================================= */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">

          <div className="bg-white border rounded-2xl p-8">

            <h1 className="text-2xl font-bold text-gray-900">
              Please log in
            </h1>

            <Link
              href="/login"
              className="inline-block mt-4 text-blue-600 hover:underline"
            >
              Go to Login
            </Link>

          </div>

        </div>
      </main>
    );
  }

  /* =========================================================
     GET USER COMPANY
  ========================================================= */

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">

          <div className="bg-white border rounded-2xl p-8">

            <h1 className="text-2xl font-bold text-gray-900">
              Company not found
            </h1>

            <p className="text-gray-500 mt-2">
              Your account is not connected to a company.
            </p>

          </div>

        </div>
      </main>
    );
  }

  /* =========================================================
     GET PROJECT
  ========================================================= */

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("company_id", profile.company_id)
    .single();

  if (!project) {
    notFound();
  }

  /* =========================================================
     GET CURRENT DRAWING
  ========================================================= */

  const { data: drawing, error: drawingError } =
    await supabase
      .from("drawings")
      .select("*")
      .eq("id", drawingId)
      .eq("project_id", id)
      .single();

  if (drawingError || !drawing) {
    notFound();
  }

  /* =========================================================
     GET ALL REVISIONS
     
     Your current database design stores revisions as
     separate drawing records using the same drawing number.
  ========================================================= */

  const { data: revisions } = await supabase
    .from("drawings")
    .select("*")
    .eq("project_id", id)
    .eq("number", drawing.number)
    .order("created_at", {
      ascending: false,
    });

  const revisionList = revisions ?? [];

  /* =========================================================
     COUNTS
  ========================================================= */

  const revisionCount = revisionList.length;

  const hasComparison =
    revisionCount >= 2;

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8">

      <div className="max-w-7xl mx-auto">

        {/* =====================================================
            BACK NAVIGATION
        ===================================================== */}

        <div className="mb-5">

          <Link
            href={`/app/projects/${id}/drawings`}
            className="
              inline-flex
              items-center
              text-sm
              font-medium
              text-blue-600
              hover:text-blue-800
              hover:underline
            "
          >
            ← Back to Drawings
          </Link>

        </div>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="
          bg-white
          border
          border-gray-200
          rounded-2xl
          shadow-sm
          p-6
        ">

          <div className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-5
          ">

            <div>

              <div className="
                flex
                items-center
                gap-3
              ">

                <div className="
                  w-12
                  h-12
                  rounded-xl
                  bg-blue-100
                  flex
                  items-center
                  justify-center
                  text-2xl
                ">
                  📐
                </div>

                <div>

                  <h1 className="
                    text-3xl
                    md:text-4xl
                    font-bold
                    text-gray-900
                  ">
                    {drawing.number} - {drawing.name}
                  </h1>

                  <p className="
                    text-gray-500
                    mt-1
                  ">
                    Drawing document and revision management
                  </p>

                </div>

              </div>

              {/* CURRENT REVISION + STAGE */}

              <div className="
                flex
                flex-wrap
                items-center
                gap-3
                mt-4
              ">

                <span className="
                  inline-flex
                  items-center
                  px-3
                  py-1.5
                  rounded-full
                  bg-blue-50
                  text-blue-700
                  border
                  border-blue-200
                  text-sm
                  font-semibold
                ">
                  Revision: {drawing.revision || "—"}
                </span>

                <span
                  className={`
                    inline-flex
                    items-center
                    px-3
                    py-1.5
                    rounded-full
                    border
                    text-sm
                    font-semibold
                    ${getStageClass(
                      drawing.status
                    )}
                  `}
                >
                  Design Stage:{" "}
                  {drawing.status || "Not Set"}
                </span>

                <span className="
                  inline-flex
                  items-center
                  px-3
                  py-1.5
                  rounded-full
                  bg-gray-100
                  text-gray-700
                  border
                  border-gray-200
                  text-sm
                  font-medium
                ">
                  {revisionCount} revision
                  {revisionCount === 1
                    ? ""
                    : "s"}
                </span>

              </div>

            </div>

            {/* HEADER ACTIONS */}

            <div className="
              flex
              flex-wrap
              gap-3
            ">

              {drawing.file_url && (
                <>
                  <a
                    href={drawing.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      inline-flex
                      items-center
                      justify-center
                      px-4
                      py-2.5
                      rounded-lg
                      border
                      border-gray-300
                      bg-white
                      hover:bg-gray-50
                      text-gray-800
                      font-medium
                    "
                  >
                    View PDF
                  </a>

                  <a
                    href={drawing.file_url}
                    download
                    className="
                      inline-flex
                      items-center
                      justify-center
                      px-4
                      py-2.5
                      rounded-lg
                      bg-blue-600
                      hover:bg-blue-700
                      text-white
                      font-medium
                    "
                  >
                    ↓ Download PDF
                  </a>
                </>
              )}

            </div>

          </div>

        </div>

        {/* =====================================================
            DRAWING INFORMATION + REVISION HISTORY
        ===================================================== */}

        <div className="
          grid
          grid-cols-1
          lg:grid-cols-3
          gap-6
          mt-7
        ">

          {/* =================================================
              DRAWING INFORMATION
          ================================================= */}

          <div className="
            bg-white
            border
            border-gray-200
            rounded-2xl
            shadow-sm
            p-6
          ">

            <h2 className="
              text-xl
              font-bold
              text-gray-900
            ">
              Drawing Information
            </h2>

            <p className="
              text-sm
              text-gray-500
              mt-1
              mb-6
            ">
              Current drawing information
            </p>

            <div className="space-y-5">

              <div>

                <p className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-gray-400
                  font-semibold
                ">
                  Drawing Number
                </p>

                <p className="
                  text-lg
                  font-semibold
                  text-gray-900
                  mt-1
                ">
                  {drawing.number || "—"}
                </p>

              </div>

              <div>

                <p className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-gray-400
                  font-semibold
                ">
                  Drawing Name
                </p>

                <p className="
                  text-lg
                  font-semibold
                  text-gray-900
                  mt-1
                ">
                  {drawing.name || "—"}
                </p>

              </div>

              <div>

                <p className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-gray-400
                  font-semibold
                ">
                  Current Revision
                </p>

                <div className="mt-2">

                  <span className="
                    inline-flex
                    px-3
                    py-1.5
                    rounded-full
                    bg-blue-50
                    text-blue-700
                    border
                    border-blue-200
                    font-semibold
                  ">
                    {drawing.revision || "—"}
                  </span>

                </div>

              </div>

              <div>

                <p className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-gray-400
                  font-semibold
                ">
                  Design Stage
                </p>

                <div className="mt-2">

                  <span
                    className={`
                      inline-flex
                      px-3
                      py-1.5
                      rounded-full
                      border
                      font-semibold
                      ${getStageClass(
                        drawing.status
                      )}
                    `}
                  >
                    {drawing.status || "Not Set"}
                  </span>

                </div>

              </div>

              <div>

                <p className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-gray-400
                  font-semibold
                ">
                  Project
                </p>

                <p className="
                  text-gray-800
                  font-medium
                  mt-1
                ">
                  {project.name}
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              REVISION HISTORY
          ================================================= */}

          <div className="
            lg:col-span-2
            bg-white
            border
            border-gray-200
            rounded-2xl
            shadow-sm
            p-6
          ">

            <div className="
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-3
              mb-6
            ">

              <div>

                <h2 className="
                  text-xl
                  font-bold
                  text-gray-900
                ">
                  Revision History
                </h2>

                <p className="
                  text-sm
                  text-gray-500
                  mt-1
                ">
                  Previous versions of drawing{" "}
                  {drawing.number}
                </p>

              </div>

              <span className="
                inline-flex
                w-fit
                px-3
                py-1
                rounded-full
                bg-gray-100
                text-gray-700
                text-sm
                font-medium
              ">
                {revisionCount} revision
                {revisionCount === 1
                  ? ""
                  : "s"}
              </span>

            </div>

            {revisionList.length > 0 ? (

              <div className="space-y-3">

                {revisionList.map(
                  (revision) => (

                    <div
                      key={revision.id}
                      className={`
                        border
                        rounded-xl
                        p-4
                        transition
                        ${
                          revision.id ===
                          drawing.id
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }
                      `}
                    >

                      <div className="
                        flex
                        flex-col
                        md:flex-row
                        md:items-center
                        md:justify-between
                        gap-4
                      ">

                        <div>

                          <div className="
                            flex
                            flex-wrap
                            items-center
                            gap-2
                          ">

                            <span className="
                              text-lg
                              font-bold
                              text-gray-900
                            ">
                              {revision.revision ||
                                "No Revision"}
                            </span>

                            {revision.id ===
                              drawing.id && (

                              <span className="
                                text-xs
                                bg-blue-600
                                text-white
                                px-2.5
                                py-1
                                rounded-full
                                font-semibold
                              ">
                                CURRENT
                              </span>

                            )}

                            {revision.status && (

                              <span
                                className={`
                                  text-xs
                                  px-2.5
                                  py-1
                                  rounded-full
                                  border
                                  font-medium
                                  ${getStageClass(
                                    revision.status
                                  )}
                                `}
                              >
                                {revision.status}
                              </span>

                            )}

                          </div>

                          <p className="
                            text-sm
                            text-gray-600
                            mt-2
                          ">
                            {revision.name ||
                              drawing.name}
                          </p>

                          {revision.created_at && (

                            <p className="
                              text-xs
                              text-gray-400
                              mt-1
                            ">
                              Uploaded{" "}
                              {new Date(
                                revision.created_at
                              ).toLocaleDateString()}
                            </p>

                          )}

                        </div>

                        <div className="
                          flex
                          gap-2
                        ">

                          {revision.file_url && (

                            <a
                              href={
                                revision.file_url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="
                                px-3
                                py-2
                                text-sm
                                border
                                border-gray-300
                                rounded-lg
                                bg-white
                                hover:bg-gray-50
                                font-medium
                              "
                            >
                              View
                            </a>

                          )}

                          {revision.file_url && (

                            <a
                              href={
                                revision.file_url
                              }
                              download
                              className="
                                px-3
                                py-2
                                text-sm
                                bg-gray-900
                                text-white
                                rounded-lg
                                hover:bg-gray-800
                                font-medium
                              "
                            >
                              Download
                            </a>

                          )}

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="
                text-center
                py-12
                border
                border-dashed
                rounded-xl
                text-gray-500
              ">
                No revision history available.
              </div>

            )}

          </div>

        </div>

        {/* =====================================================
            COMPARE REVISIONS
        ===================================================== */}

        {hasComparison && (

          <div className="
            mt-7
            bg-white
            border
            border-gray-200
            rounded-2xl
            shadow-sm
            p-6
          ">

            <div className="
              flex
              flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-5
            ">

              <div>

                <div className="
                  flex
                  items-center
                  gap-3
                ">

                  <div className="
                    w-11
                    h-11
                    rounded-lg
                    bg-green-100
                    flex
                    items-center
                    justify-center
                    text-xl
                  ">
                    ⇄
                  </div>

                  <div>

                    <h2 className="
                      text-xl
                      font-bold
                      text-gray-900
                    ">
                      Compare Revisions
                    </h2>

                    <p className="
                      text-sm
                      text-gray-500
                      mt-1
                    ">
                      Compare two versions of this
                      drawing side-by-side.
                    </p>

                  </div>

                </div>

              </div>

              <Link
                href={`/app/projects/${id}/drawings/${drawing.id}/compare`}
                className="
                  inline-flex
                  items-center
                  justify-center
                  px-6
                  py-3
                  rounded-xl
                  bg-green-600
                  hover:bg-green-700
                  text-white
                  font-semibold
                  shadow-sm
                "
              >
                Compare Revisions →
              </Link>

            </div>

          </div>

        )}

        {/* =====================================================
            CURRENT DRAWING PDF
        ===================================================== */}

        <div className="
          mt-7
          bg-white
          border
          border-gray-200
          rounded-2xl
          shadow-sm
          overflow-hidden
        ">

          {/* PDF HEADER */}

          <div className="
            px-6
            py-5
            border-b
            bg-white
          ">

            <div className="
              flex
              flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-4
            ">

              <div>

                <h2 className="
                  text-2xl
                  font-bold
                  text-gray-900
                ">
                  Current Drawing
                </h2>

                <p className="
                  text-sm
                  text-gray-500
                  mt-1
                ">
                  {drawing.number} •{" "}
                  {drawing.name} •{" "}
                  {drawing.revision}
                </p>

              </div>

              {drawing.file_url && (

                <div className="
                  flex
                  gap-2
                ">

                  <a
                    href={
                      drawing.file_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      px-4
                      py-2
                      border
                      border-gray-300
                      rounded-lg
                      hover:bg-gray-50
                      font-medium
                    "
                  >
                    Open
                  </a>

                  <a
                    href={
                      drawing.file_url
                    }
                    download
                    className="
                      px-4
                      py-2
                      bg-blue-600
                      hover:bg-blue-700
                      text-white
                      rounded-lg
                      font-medium
                    "
                  >
                    ↓ Download
                  </a>

                </div>

              )}

            </div>

          </div>

          {/* PDF VIEWER */}

          {drawing.file_url ? (

            <div className="
              bg-gray-700
              p-3
              md:p-5
            ">

              <iframe
                src={drawing.file_url}
                className="
                  w-full
                  h-[900px]
                  md:h-[1100px]
                  lg:h-[1200px]
                  bg-white
                  rounded-lg
                  border-0
                "
                title={`
                  ${drawing.number}
                  ${drawing.revision}
                `}
              />

            </div>

          ) : (

            <div className="
              p-20
              text-center
              text-gray-500
            ">

              <div className="
                text-5xl
                mb-4
              ">
                📄
              </div>

              <p className="
                text-lg
                font-medium
                text-gray-700
              ">
                No PDF uploaded
              </p>

              <p className="
                text-sm
                mt-1
              ">
                Upload a PDF to view the drawing here.
              </p>

            </div>

          )}

        </div>

      </div>

    </main>
  );
}