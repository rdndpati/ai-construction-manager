"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  uploadMultipleDrawingFiles,
  createDrawing,
} from "@/lib/drawings";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type DrawingUpload = {
  id: string;
  file: File;
  number: string;
  name: string;
  revision: string;
  status: string;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default function NewDrawingPage({ params }: Props) {
  const { id } = use(params);

  const router = useRouter();

  const [files, setFiles] = useState<DrawingUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     ADD MULTIPLE FILES
  ========================================================= */

  function handleFilesChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = Array.from(
      e.target.files ?? []
    );

    if (selectedFiles.length === 0) {
      return;
    }

    setError("");
    setSuccess("");

    const newFiles: DrawingUpload[] = [];

    for (const file of selectedFiles) {
      /* -----------------------------------------
         PDF validation
      ----------------------------------------- */

      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        setError(
          `${file.name} is not a PDF. Only PDF drawings are allowed.`
        );
        continue;
      }

      /* -----------------------------------------
         Size validation
      ----------------------------------------- */

      if (file.size > MAX_FILE_SIZE) {
        setError(
          `${file.name} is larger than 50 MB.`
        );
        continue;
      }

      /* -----------------------------------------
         Prevent duplicate file names
      ----------------------------------------- */

      const alreadyExists = files.some(
        (existingFile) =>
          existingFile.file.name === file.name &&
          existingFile.file.size === file.size
      );

      const alreadyInNewFiles = newFiles.some(
        (existingFile) =>
          existingFile.file.name === file.name &&
          existingFile.file.size === file.size
      );

      if (
        alreadyExists ||
        alreadyInNewFiles
      ) {
        continue;
      }

      /* -----------------------------------------
         Remove .pdf from default drawing name
      ----------------------------------------- */

      const defaultName = file.name
        .replace(/\.pdf$/i, "")
        .replace(/[_-]+/g, " ");

      newFiles.push({
        id: crypto.randomUUID(),
        file,
        number: "",
        name: defaultName,
        revision: "Rev 0",
        status: "Review",
      });
    }

    setFiles((previous) => [
      ...previous,
      ...newFiles,
    ]);

    /*
      Reset input so the same file can be selected
      again if needed.
    */
    e.target.value = "";
  }

  /* =========================================================
     UPDATE FILE INFORMATION
  ========================================================= */

  function updateFile(
    fileId: string,
    field: keyof Omit<DrawingUpload, "id" | "file">,
    value: string
  ) {
    setFiles((previous) =>
      previous.map((item) =>
        item.id === fileId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );

    setError("");
    setSuccess("");
  }

  /* =========================================================
     REMOVE FILE
  ========================================================= */

  function removeFile(fileId: string) {
    setFiles((previous) =>
      previous.filter(
        (item) => item.id !== fileId
      )
    );

    setError("");
  }

  /* =========================================================
     CLEAR ALL
  ========================================================= */

  function clearAll() {
    setFiles([]);
    setError("");
    setSuccess("");
  }

  /* =========================================================
     UPLOAD ALL DRAWINGS
  ========================================================= */

  async function handleUploadAll(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");

    /* -----------------------------------------
       Check files
    ----------------------------------------- */

    if (files.length === 0) {
      setError(
        "Please select at least one drawing PDF."
      );
      return;
    }

    /* -----------------------------------------
       Validate information
    ----------------------------------------- */

    for (const drawing of files) {
      if (!drawing.number.trim()) {
        setError(
          `Please enter a drawing number for ${drawing.file.name}.`
        );
        return;
      }

      if (!drawing.name.trim()) {
        setError(
          `Please enter a drawing name for ${drawing.file.name}.`
        );
        return;
      }

      if (!drawing.revision.trim()) {
        setError(
          `Please enter a revision for ${drawing.file.name}.`
        );
        return;
      }
    }

    setUploading(true);

    try {
      /* -----------------------------------------
         Upload all PDFs
      ----------------------------------------- */

      const uploadedFiles =
        await uploadMultipleDrawingFiles(
          files.map((item) => item.file)
        );

      if (
        !uploadedFiles ||
        uploadedFiles.length === 0
      ) {
        throw new Error(
          "No drawings were uploaded."
        );
      }

      /* -----------------------------------------
         Create database records
      ----------------------------------------- */

      let createdCount = 0;

      for (const uploaded of uploadedFiles) {
        const matchingDrawing = files.find(
          (item) =>
            item.file.name ===
              uploaded.file.name &&
            item.file.size ===
              uploaded.file.size
        );

        if (!matchingDrawing) {
          continue;
        }

        const drawing =
          await createDrawing({
            project_id: id,
            number:
              matchingDrawing.number.trim(),
            name:
              matchingDrawing.name.trim(),
            revision:
              matchingDrawing.revision.trim(),
            status:
              matchingDrawing.status,
            file_url:
              uploaded.url,
          });

        if (drawing) {
          createdCount++;
        }
      }

      /* -----------------------------------------
         Success
      ----------------------------------------- */

      if (createdCount === 0) {
        throw new Error(
          "PDFs were uploaded, but no drawing records were created."
        );
      }

      setSuccess(
        `${createdCount} drawing${
          createdCount === 1 ? "" : "s"
        } uploaded successfully.`
      );

      /*
        Give the success message a moment,
        then return to drawings.
      */

      setTimeout(() => {
        router.push(
          `/app/projects/${id}/drawings`
        );

        router.refresh();
      }, 700);

    } catch (err: any) {
      console.error(
        "Multiple drawing upload error:",
        err
      );

      setError(
        err?.message ||
          "Unable to upload drawings."
      );
    } finally {
      setUploading(false);
    }
  }

  /* =========================================================
     TOTAL SIZE
  ========================================================= */

  const totalSize = files.reduce(
    (total, item) =>
      total + item.file.size,
    0
  );

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8">

      <div className="max-w-7xl mx-auto">

        {/* =================================================
            BACK
        ================================================= */}

        <Link
          href={`/app/projects/${id}/drawings`}
          className="
            text-sm
            text-blue-600
            hover:text-blue-800
            hover:underline
          "
        >
          ← Back to Drawings
        </Link>

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mt-5 flex flex-col md:flex-row md:items-end md:justify-between gap-4">

          <div>

            <div className="flex items-center gap-3">

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
                  text-4xl
                  font-bold
                  text-gray-900
                ">
                  Upload Drawings
                </h1>

                <p className="
                  text-gray-500
                  mt-1
                ">
                  Upload one or multiple engineering
                  drawing PDFs to this project.
                </p>

              </div>

            </div>

          </div>

          {files.length > 0 && (
            <div className="
              bg-white
              border
              rounded-xl
              px-5
              py-3
              shadow-sm
            ">

              <div className="
                text-sm
                text-gray-500
              ">
                Selected Drawings
              </div>

              <div className="
                text-2xl
                font-bold
                text-gray-900
              ">
                {files.length}
              </div>

            </div>
          )}

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="
            mt-6
            border
            border-red-200
            bg-red-50
            text-red-700
            rounded-xl
            px-5
            py-4
          ">

            <div className="font-semibold">
              Upload Error
            </div>

            <div className="text-sm mt-1">
              {error}
            </div>

          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="
            mt-6
            border
            border-green-200
            bg-green-50
            text-green-700
            rounded-xl
            px-5
            py-4
          ">

            <div className="font-semibold">
              ✓ Upload Complete
            </div>

            <div className="text-sm mt-1">
              {success}
            </div>

          </div>
        )}

        {/* =================================================
            UPLOAD AREA
        ================================================= */}

        <div className="
          bg-white
          border
          border-gray-200
          rounded-2xl
          shadow-sm
          mt-8
          p-6
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
                text-xl
                font-bold
                text-gray-900
              ">
                Add Drawing PDFs
              </h2>

              <p className="
                text-sm
                text-gray-500
                mt-1
              ">
                Select multiple PDF files at once.
                Each file will become a separate drawing.
              </p>

            </div>

            <label
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                bg-blue-600
                hover:bg-blue-700
                text-white
                px-6
                py-3
                rounded-lg
                font-semibold
                cursor-pointer
                transition
              "
            >

              <span>＋</span>

              <span>
                Select Drawing PDFs
              </span>

              <input
                type="file"
                accept="application/pdf,.pdf"
                multiple
                className="hidden"
                onChange={handleFilesChange}
                disabled={uploading}
              />

            </label>

          </div>

          {/* INFO */}

          <div className="
            mt-5
            grid
            grid-cols-1
            md:grid-cols-3
            gap-3
          ">

            <div className="
              bg-gray-50
              rounded-lg
              p-4
            ">

              <div className="text-lg">
                📄
              </div>

              <div className="
                text-sm
                font-semibold
                mt-1
              ">
                Multiple PDFs
              </div>

              <div className="
                text-xs
                text-gray-500
                mt-1
              ">
                Upload several drawings together.
              </div>

            </div>

            <div className="
              bg-gray-50
              rounded-lg
              p-4
            ">

              <div className="text-lg">
                📋
              </div>

              <div className="
                text-sm
                font-semibold
                mt-1
              ">
                Individual Details
              </div>

              <div className="
                text-xs
                text-gray-500
                mt-1
              ">
                Set number, name and revision for each.
              </div>

            </div>

            <div className="
              bg-gray-50
              rounded-lg
              p-4
            ">

              <div className="text-lg">
                🔒
              </div>

              <div className="
                text-sm
                font-semibold
                mt-1
              ">
                PDF Only
              </div>

              <div className="
                text-xs
                text-gray-500
                mt-1
              ">
                Maximum 50 MB per drawing.
              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            SELECTED DRAWINGS
        ================================================= */}

        {files.length > 0 && (
          <form
            onSubmit={handleUploadAll}
            className="
              mt-6
              bg-white
              border
              border-gray-200
              rounded-2xl
              shadow-sm
              overflow-hidden
            "
          >

            {/* TABLE HEADER */}

            <div className="
              px-6
              py-5
              border-b
              bg-gray-50
              flex
              flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-3
            ">

              <div>

                <h2 className="
                  text-xl
                  font-bold
                  text-gray-900
                ">
                  Drawings Ready to Upload
                </h2>

                <p className="
                  text-sm
                  text-gray-500
                  mt-1
                ">
                  Complete the information for each drawing.
                </p>

              </div>

              <button
                type="button"
                onClick={clearAll}
                disabled={uploading}
                className="
                  text-sm
                  text-red-600
                  hover:text-red-800
                  font-medium
                "
              >
                Clear All
              </button>

            </div>

            {/* DRAWING CARDS */}

            <div className="p-6 space-y-5">

              {files.map(
                (drawing, index) => (

                  <div
                    key={drawing.id}
                    className="
                      border
                      border-gray-200
                      rounded-xl
                      overflow-hidden
                    "
                  >

                    {/* FILE HEADER */}

                    <div className="
                      bg-gray-50
                      px-5
                      py-4
                      flex
                      items-center
                      justify-between
                      gap-4
                    ">

                      <div className="
                        flex
                        items-center
                        gap-3
                        min-w-0
                      ">

                        <div className="
                          w-10
                          h-10
                          rounded-lg
                          bg-red-100
                          flex
                          items-center
                          justify-center
                          flex-shrink-0
                        ">
                          📄
                        </div>

                        <div className="min-w-0">

                          <div className="
                            text-xs
                            font-semibold
                            text-gray-400
                            uppercase
                          ">
                            Drawing {index + 1}
                          </div>

                          <div className="
                            font-semibold
                            text-gray-900
                            truncate
                          ">
                            {drawing.file.name}
                          </div>

                          <div className="
                            text-xs
                            text-gray-500
                            mt-1
                          ">
                            {(
                              drawing.file.size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB
                          </div>

                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeFile(
                            drawing.id
                          )
                        }
                        disabled={uploading}
                        className="
                          text-red-500
                          hover:text-red-700
                          text-sm
                          font-medium
                          flex-shrink-0
                        "
                      >
                        Remove
                      </button>

                    </div>

                    {/* DRAWING DETAILS */}

                    <div className="
                      p-5
                      grid
                      grid-cols-1
                      md:grid-cols-2
                      xl:grid-cols-4
                      gap-5
                    ">

                      {/* NUMBER */}

                      <div>

                        <label className="
                          block
                          text-sm
                          font-semibold
                          text-gray-700
                          mb-2
                        ">
                          Drawing Number
                          <span className="text-red-500 ml-1">
                            *
                          </span>
                        </label>

                        <input
                          value={drawing.number}
                          onChange={(e) =>
                            updateFile(
                              drawing.id,
                              "number",
                              e.target.value
                            )
                          }
                          placeholder="C-101"
                          disabled={uploading}
                          className="
                            w-full
                            border
                            border-gray-300
                            rounded-lg
                            px-3
                            py-2.5
                            focus:ring-2
                            focus:ring-blue-500
                            focus:border-blue-500
                            outline-none
                          "
                        />

                      </div>

                      {/* NAME */}

                      <div>

                        <label className="
                          block
                          text-sm
                          font-semibold
                          text-gray-700
                          mb-2
                        ">
                          Drawing Name
                          <span className="text-red-500 ml-1">
                            *
                          </span>
                        </label>

                        <input
                          value={drawing.name}
                          onChange={(e) =>
                            updateFile(
                              drawing.id,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="Site Layout"
                          disabled={uploading}
                          className="
                            w-full
                            border
                            border-gray-300
                            rounded-lg
                            px-3
                            py-2.5
                            focus:ring-2
                            focus:ring-blue-500
                            focus:border-blue-500
                            outline-none
                          "
                        />

                      </div>

                      {/* REVISION */}

                      <div>

                        <label className="
                          block
                          text-sm
                          font-semibold
                          text-gray-700
                          mb-2
                        ">
                          Revision
                          <span className="text-red-500 ml-1">
                            *
                          </span>
                        </label>

                        <select
                          value={drawing.revision}
                          onChange={(e) =>
                            updateFile(
                              drawing.id,
                              "revision",
                              e.target.value
                            )
                          }
                          disabled={uploading}
                          className="
                            w-full
                            border
                            border-gray-300
                            rounded-lg
                            px-3
                            py-2.5
                            bg-white
                            focus:ring-2
                            focus:ring-blue-500
                            outline-none
                          "
                        >
                          <option value="Rev 0">
                            Rev 0
                          </option>

                          <option value="Rev 1">
                            Rev 1
                          </option>

                          <option value="Rev 2">
                            Rev 2
                          </option>

                          <option value="Rev 3">
                            Rev 3
                          </option>

                          <option value="Rev 4">
                            Rev 4
                          </option>

                          <option value="Rev 5">
                            Rev 5
                          </option>

                          <option value="Rev 6">
                            Rev 6
                          </option>

                          <option value="Rev 7">
                            Rev 7
                          </option>

                          <option value="Rev 8">
                            Rev 8
                          </option>

                          <option value="Rev 9">
                            Rev 9
                          </option>

                          <option value="Rev 10">
                            Rev 10
                          </option>
                        </select>

                      </div>

                      {/* DESIGN STATUS */}

                      <div>

                        <label className="
                          block
                          text-sm
                          font-semibold
                          text-gray-700
                          mb-2
                        ">
                          Design Stage
                        </label>

                        <select
                          value={drawing.status}
                          onChange={(e) =>
                            updateFile(
                              drawing.id,
                              "status",
                              e.target.value
                            )
                          }
                          disabled={uploading}
                          className="
                            w-full
                            border
                            border-gray-300
                            rounded-lg
                            px-3
                            py-2.5
                            bg-white
                            focus:ring-2
                            focus:ring-blue-500
                            outline-none
                          "
                        >

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

                )
              )}

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="
              px-6
              py-5
              border-t
              bg-gray-50
              flex
              flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-4
            ">

              <div className="
                text-sm
                text-gray-500
              ">

                <strong>
                  {files.length}
                </strong>{" "}
                drawing
                {files.length === 1
                  ? ""
                  : "s"}{" "}
                selected

                <span className="mx-2">
                  •
                </span>

                {(
                  totalSize /
                  1024 /
                  1024
                ).toFixed(2)}{" "}
                MB total

              </div>

              <div className="
                flex
                justify-end
                gap-3
              ">

                <Link
                  href={`/app/projects/${id}/drawings`}
                  className="
                    px-5
                    py-2.5
                    border
                    border-gray-300
                    bg-white
                    rounded-lg
                    font-medium
                    text-gray-700
                    hover:bg-gray-100
                  "
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={uploading}
                  className="
                    px-7
                    py-2.5
                    bg-blue-600
                    hover:bg-blue-700
                    disabled:bg-gray-400
                    text-white
                    rounded-lg
                    font-semibold
                    transition
                  "
                >
                  {uploading
                    ? "Uploading Drawings..."
                    : `Upload ${files.length} Drawing${
                        files.length === 1
                          ? ""
                          : "s"
                      }`}
                </button>

              </div>

            </div>

          </form>
        )}

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {files.length === 0 && (
          <div className="
            mt-6
            bg-white
            border
            border-gray-200
            rounded-2xl
            shadow-sm
            p-12
            text-center
          ">

            <div className="text-6xl">
              📂
            </div>

            <h2 className="
              text-xl
              font-bold
              text-gray-900
              mt-4
            ">
              No drawings selected
            </h2>

            <p className="
              text-gray-500
              mt-2
              max-w-md
              mx-auto
            ">
              Select one or multiple engineering
              PDF drawings above. You can enter
              the details for each drawing before
              uploading.
            </p>

          </div>
        )}

      </div>

    </main>
  );
}