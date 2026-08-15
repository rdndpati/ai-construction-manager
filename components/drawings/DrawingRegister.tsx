"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Drawing = {
  id: string;
  number?: string | null;
  name?: string | null;
  revision?: string | null;
  status?: string | null;
  file_url?: string | null;
};

type Props = {
  projectId: string;
  drawings: Drawing[];
};

function getStatusClass(
  status?: string | null
) {
  switch (status) {
    case "10%":
      return "bg-gray-100 text-gray-700";

    case "30%":
      return "bg-blue-50 text-blue-700";

    case "60%":
      return "bg-indigo-50 text-indigo-700";

    case "90%":
      return "bg-purple-50 text-purple-700";

    case "IFC":
      return "bg-green-50 text-green-700";

    case "Approved":
      return "bg-emerald-50 text-emerald-700";

    case "Issued":
      return "bg-teal-50 text-teal-700";

    case "Review":
      return "bg-orange-50 text-orange-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function DrawingRegister({
  projectId,
  drawings,
}: Props) {
  const [search, setSearch] =
    useState("");

  const [stage, setStage] =
    useState("All");

  const filteredDrawings =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return drawings.filter(
        (drawing) => {
          const matchesSearch =
            !searchValue ||
            drawing.number
              ?.toLowerCase()
              .includes(searchValue) ||
            drawing.name
              ?.toLowerCase()
              .includes(searchValue) ||
            drawing.revision
              ?.toLowerCase()
              .includes(searchValue);

          const matchesStage =
            stage === "All" ||
            drawing.status === stage;

          return (
            matchesSearch &&
            matchesStage
          );
        }
      );
    }, [drawings, search, stage]);

  return (
    <div className="
      bg-white
      border
      border-gray-200
      rounded-2xl
      shadow-sm
      overflow-hidden
    ">

      {/* =================================================
          REGISTER HEADER
      ================================================= */}

      <div className="
        px-6
        py-5
        border-b
        bg-white
      ">

        <div className="
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-4
        ">

          <div>

            <h2 className="
              text-2xl
              font-bold
              text-gray-900
            ">
              Drawing Register
            </h2>

            <p className="
              text-sm
              text-gray-500
              mt-1
            ">
              {filteredDrawings.length} of{" "}
              {drawings.length} drawings
            </p>

          </div>

          {/* SEARCH */}

          <div className="
            flex
            flex-col
            sm:flex-row
            gap-3
            w-full
            lg:w-auto
          ">

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search drawing..."
              className="
                w-full
                sm:w-64
                border
                border-gray-300
                rounded-lg
                px-4
                py-2.5
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            />

            <select
              value={stage}
              onChange={(e) =>
                setStage(
                  e.target.value
                )
              }
              className="
                border
                border-gray-300
                rounded-lg
                px-4
                py-2.5
                bg-white
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            >

              <option value="All">
                All Stages
              </option>

              <option value="Review">
                Review
              </option>

              <option value="10%">
                10% Design
              </option>

              <option value="30%">
                30% Design
              </option>

              <option value="60%">
                60% Design
              </option>

              <option value="90%">
                90% Design
              </option>

              <option value="IFC">
                IFC
              </option>

              <option value="Approved">
                Approved
              </option>

              <option value="Issued">
                Issued
              </option>

            </select>

          </div>

        </div>

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      {filteredDrawings.length > 0 ? (

        <div className="
          overflow-x-auto
        ">

          <table className="
            w-full
            min-w-[900px]
          ">

            <thead className="
              bg-gray-50
              border-b
            ">

              <tr className="
                text-left
                text-xs
                uppercase
                tracking-wide
                text-gray-500
              ">

                <th className="px-6 py-4">
                  Drawing
                </th>

                <th className="px-6 py-4">
                  Name
                </th>

                <th className="px-6 py-4">
                  Revision
                </th>

                <th className="px-6 py-4">
                  Design Stage
                </th>

                <th className="px-6 py-4">
                  Document
                </th>

                <th className="px-6 py-4 text-right">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredDrawings.map(
                (drawing) => (

                  <tr
                    key={drawing.id}
                    className="
                      border-b
                      last:border-b-0
                      hover:bg-gray-50
                    "
                  >

                    {/* DRAWING NUMBER */}

                    <td className="px-6 py-5">

                      <div className="
                        font-semibold
                        text-gray-900
                      ">
                        {drawing.number ||
                          "—"}
                      </div>

                      <div className="
                        text-xs
                        text-gray-400
                        mt-1
                      ">
                        Drawing
                      </div>

                    </td>

                    {/* NAME */}

                    <td className="px-6 py-5">

                      <div className="
                        font-medium
                        text-gray-800
                      ">
                        {drawing.name ||
                          "Untitled Drawing"}
                      </div>

                    </td>

                    {/* REVISION */}

                    <td className="px-6 py-5">

                      <span className="
                        inline-flex
                        items-center
                        px-3
                        py-1
                        rounded-full
                        bg-blue-50
                        text-blue-700
                        text-sm
                        font-medium
                      ">
                        {drawing.revision ||
                          "—"}
                      </span>

                    </td>

                    {/* STAGE */}

                    <td className="px-6 py-5">

                      <span
                        className={`
                          inline-flex
                          items-center
                          px-3
                          py-1
                          rounded-full
                          text-sm
                          font-medium
                          ${getStatusClass(
                            drawing.status
                          )}
                        `}
                      >
                        {drawing.status ||
                          "Not Set"}
                      </span>

                    </td>

                    {/* PDF */}

                    <td className="px-6 py-5">

                      {drawing.file_url ? (

                        <a
                          href={
                            drawing.file_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                            inline-flex
                            items-center
                            gap-2
                            text-blue-600
                            hover:text-blue-800
                            font-medium
                          "
                        >
                          <span>
                            📄
                          </span>

                          View PDF
                        </a>

                      ) : (

                        <span className="
                          text-gray-400
                          text-sm
                        ">
                          No PDF
                        </span>

                      )}

                    </td>

                    {/* ACTIONS */}

                    <td className="
                      px-6
                      py-5
                      text-right
                    ">

                      <Link
                        href={`/app/projects/${projectId}/drawings/${drawing.id}`}
                        className="
                          inline-flex
                          items-center
                          justify-center
                          px-4
                          py-2
                          rounded-lg
                          bg-gray-900
                          hover:bg-gray-700
                          text-white
                          text-sm
                          font-medium
                        "
                      >
                        Open
                      </Link>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      ) : (

        /* =================================================
           EMPTY / NO RESULTS
        ================================================= */

        <div className="
          text-center
          px-6
          py-16
        ">

          <div className="
            text-5xl
          ">
            📐
          </div>

          <h3 className="
            text-xl
            font-bold
            text-gray-900
            mt-4
          ">
            {drawings.length === 0
              ? "No drawings yet"
              : "No drawings found"}
          </h3>

          <p className="
            text-gray-500
            mt-2
          ">

            {drawings.length === 0
              ? "Upload engineering drawings to start building your drawing register."
              : "Try changing your search or design stage filter."}

          </p>

          {drawings.length === 0 && (
            <Link
              href={`/app/projects/${projectId}/drawings/new`}
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
              ＋ Upload Drawings
            </Link>
          )}

          {drawings.length > 0 && (
            <button
              onClick={() => {
                setSearch("");
                setStage("All");
              }}
              className="
                mt-6
                text-blue-600
                hover:underline
                font-medium
              "
            >
              Clear Filters
            </button>
          )}

        </div>

      )}

    </div>
  );
}