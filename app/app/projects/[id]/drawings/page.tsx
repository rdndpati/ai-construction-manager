import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProjectTabs from "@/components/ProjectTabs";
import DrawingRegister from "@/components/drawings/DrawingRegister";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDrawings({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  /* =========================================================
     GET LOGGED-IN USER
  ========================================================= */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /* =========================================================
     GET USER COMPANY
  ========================================================= */

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile?.company_id
  ) {
    redirect("/create-company");
  }

  /* =========================================================
     GET PROJECT
  ========================================================= */

  const {
    data: project,
    error: projectError,
  } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq(
      "company_id",
      profile.company_id
    )
    .single();

  if (
    projectError ||
    !project
  ) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">

        <div className="max-w-7xl mx-auto">

          <div className="
            bg-white
            border
            border-red-200
            rounded-2xl
            p-8
          ">

            <h1 className="
              text-3xl
              font-bold
              text-gray-900
            ">
              Project Not Found
            </h1>

            <p className="
              text-gray-500
              mt-2
            ">
              The project could not be found or
              you do not have access to it.
            </p>

            <Link
              href="/app/projects"
              className="
                inline-flex
                mt-6
                bg-blue-600
                hover:bg-blue-700
                text-white
                px-5
                py-2.5
                rounded-lg
                font-medium
              "
            >
              ← Back to Projects
            </Link>

          </div>

        </div>

      </main>
    );
  }

  /* =========================================================
     GET DRAWINGS
  ========================================================= */

  const {
    data: drawings,
    error: drawingsError,
  } = await supabase
    .from("drawings")
    .select("*")
    .eq("project_id", id)
    .order("created_at", {
      ascending: false,
    });

  if (drawingsError) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">

        <div className="max-w-7xl mx-auto">

          <div className="
            bg-white
            border
            border-red-200
            rounded-2xl
            p-8
          ">

            <h1 className="
              text-3xl
              font-bold
              text-red-600
            ">
              Error Loading Drawings
            </h1>

            <p className="
              mt-3
              text-gray-600
            ">
              {drawingsError.message}
            </p>

            <Link
              href={`/app/projects/${id}`}
              className="
                inline-block
                mt-5
                text-blue-600
                hover:underline
              "
            >
              ← Back to Project
            </Link>

          </div>

        </div>

      </main>
    );
  }

  /* =========================================================
     SUMMARY
  ========================================================= */

  const drawingList =
    drawings ?? [];

  const totalDrawings =
    drawingList.length;

  const pdfCount =
    drawingList.filter(
      (drawing) =>
        !!drawing.file_url
    ).length;

  const reviewCount =
    drawingList.filter(
      (drawing) =>
        drawing.status === "Review"
    ).length;

  const ifcCount =
    drawingList.filter(
      (drawing) =>
        drawing.status === "IFC"
    ).length;

  const designCount =
    drawingList.filter((drawing) =>
      [
        "10%",
        "30%",
        "60%",
        "90%",
      ].includes(drawing.status)
    ).length;

  return (
    <main className="
      min-h-screen
      bg-gray-50
      p-6
      md:p-8
    ">

      <div className="
        max-w-7xl
        mx-auto
      ">

        {/* =================================================
            BACK
        ================================================= */}

        <div className="mb-4">

          <Link
            href={`/app/projects/${id}`}
            className="
              text-sm
              text-blue-600
              hover:text-blue-800
              hover:underline
            "
          >
            ← Back to Project
          </Link>

        </div>

        {/* =================================================
            HEADER
        ================================================= */}

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
                  {project.name}
                </h1>

                <p className="
                  text-gray-500
                  mt-1
                ">
                  Drawing Register
                </p>

              </div>

            </div>

            <p className="
              text-gray-500
              mt-3
              max-w-2xl
            ">
              Manage engineering drawings,
              revisions, design stages, PDFs,
              and drawing history.
            </p>

          </div>

          <Link
            href={`/app/projects/${id}/drawings/new`}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              bg-blue-600
              hover:bg-blue-700
              text-white
              font-semibold
              px-6
              py-3
              rounded-xl
              shadow-sm
              transition
            "
          >
            <span className="text-lg">
              ＋
            </span>

            Upload Drawings
          </Link>

        </div>

        {/* =================================================
            PROJECT TABS
        ================================================= */}

        <div className="mt-7">
          <ProjectTabs projectId={id} />
        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-5
          gap-4
          mt-7
        ">

          {/* TOTAL */}

          <div className="
            bg-white
            border
            border-gray-200
            rounded-xl
            p-5
            shadow-sm
          ">

            <p className="
              text-sm
              text-gray-500
            ">
              Total Drawings
            </p>

            <p className="
              text-3xl
              font-bold
              text-gray-900
              mt-1
            ">
              {totalDrawings}
            </p>

          </div>

          {/* PDF */}

          <div className="
            bg-white
            border
            border-gray-200
            rounded-xl
            p-5
            shadow-sm
          ">

            <p className="
              text-sm
              text-gray-500
            ">
              PDF Documents
            </p>

            <p className="
              text-3xl
              font-bold
              text-gray-900
              mt-1
            ">
              {pdfCount}
            </p>

          </div>

          {/* DESIGN */}

          <div className="
            bg-white
            border
            border-gray-200
            rounded-xl
            p-5
            shadow-sm
          ">

            <p className="
              text-sm
              text-gray-500
            ">
              Design Stage
            </p>

            <p className="
              text-3xl
              font-bold
              text-blue-600
              mt-1
            ">
              {designCount}
            </p>

          </div>

          {/* REVIEW */}

          <div className="
            bg-white
            border
            border-gray-200
            rounded-xl
            p-5
            shadow-sm
          ">

            <p className="
              text-sm
              text-gray-500
            ">
              Under Review
            </p>

            <p className="
              text-3xl
              font-bold
              text-orange-500
              mt-1
            ">
              {reviewCount}
            </p>

          </div>

          {/* IFC */}

          <div className="
            bg-white
            border
            border-gray-200
            rounded-xl
            p-5
            shadow-sm
          ">

            <p className="
              text-sm
              text-gray-500
            ">
              IFC
            </p>

            <p className="
              text-3xl
              font-bold
              text-green-600
              mt-1
            ">
              {ifcCount}
            </p>

          </div>

        </div>

        {/* =================================================
            DRAWING REGISTER
        ================================================= */}

        <div className="mt-7">

          <DrawingRegister
            projectId={id}
            drawings={drawingList}
          />

        </div>

      </div>

    </main>
  );
}