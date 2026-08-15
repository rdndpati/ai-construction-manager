"use client";

import { useState } from "react";

type NewRFIDialogProps = {
  drawings?: any[];
  onSave: (form: any) => Promise<void> | void;
  onClose: () => void;
};

export default function NewRFIDialog({
  drawings = [],
  onSave,
  onClose,
}: NewRFIDialogProps) {
  const [rfiNumber, setRfiNumber] = useState("AUTO");

  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");

  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");

  // RFI workflow fields
  const [submittedBy, setSubmittedBy] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [ballInCourt, setBallInCourt] = useState("");

  // Existing project drawing
  const [drawingId, setDrawingId] = useState("");

  // Uploaded file
  const [attachment, setAttachment] =
    useState<File | null>(null);

  const [saving, setSaving] = useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter an RFI subject.");
      return;
    }

    if (!question.trim()) {
      alert("Please enter the RFI question.");
      return;
    }

    if (!submittedBy.trim()) {
      alert("Please enter who is submitting the RFI.");
      return;
    }

    if (!sentTo.trim()) {
      alert("Please enter who the RFI is being sent to.");
      return;
    }

    if (!ballInCourt.trim()) {
      alert("Please enter who currently has the ball in court.");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        rfi_number:
          rfiNumber === "AUTO"
            ? null
            : rfiNumber,

        title: title.trim(),

        question: question.trim(),

        priority,

        due_date:
          dueDate || null,

        // RFI workflow
        submitted_by:
          submittedBy.trim(),

        sent_to:
          sentTo.trim(),

        ball_in_court:
          ballInCourt.trim(),

        // Existing project drawing
        drawing_id:
          drawingId || null,

        // Uploaded file
        attachment,
      });
    } catch (error) {
      console.error(
        "CREATE RFI DIALOG ERROR:",
        error
      );

      alert(
        "Failed to create RFI."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0];

    if (!file) return;

    // 25 MB maximum
    if (
      file.size >
      25 * 1024 * 1024
    ) {
      alert(
        "File must be smaller than 25 MB."
      );

      e.target.value = "";

      return;
    }

    setAttachment(file);
  }

  function removeAttachment() {
    setAttachment(null);
  }

  const selectedDrawing =
    drawings.find(
      (drawing) =>
        drawing.id === drawingId
    );

  function getDrawingName(
    drawing: any
  ) {
    return (
      drawing.drawing_number ||
      drawing.number ||
      drawing.name ||
      drawing.title ||
      "Drawing"
    );
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        bg-black/50
        p-4
        flex
        items-center
        justify-center
        overflow-hidden
      "
    >

      {/* MODAL */}

      <div
        className="
          bg-white
          w-full
          max-w-3xl
          rounded-2xl
          shadow-2xl
          overflow-hidden
          max-h-[calc(100vh-2rem)]
          flex
          flex-col
        "
      >

        {/* HEADER */}

        <div
          className="
            px-6
            py-5
            border-b
            flex
            justify-between
            items-start
            shrink-0
          "
        >

          <div>

            <h2 className="text-2xl font-bold text-gray-900">
              New Request for Information
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Create a new RFI for this project.
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              text-gray-400
              hover:text-gray-700
              text-2xl
              leading-none
              disabled:opacity-50
            "
          >
            ×
          </button>

        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="
            flex
            flex-col
            flex-1
            min-h-0
          "
        >

          {/* SCROLLABLE CONTENT */}

          <div
            className="
              p-6
              space-y-6
              overflow-y-auto
              overscroll-contain
              flex-1
            "
          >

            {/* RFI NUMBER */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                RFI Number
              </label>

              <select
                value={rfiNumber}
                onChange={(e) =>
                  setRfiNumber(
                    e.target.value
                  )
                }
                disabled={saving}
                className="
                  w-full
                  border
                  border-gray-300
                  rounded-lg
                  px-4
                  py-3
                  bg-white
                  focus:ring-2
                  focus:ring-blue-500
                  outline-none
                  disabled:bg-gray-100
                "
              >

                <option value="AUTO">
                  Auto-generate next RFI number
                </option>

                {Array.from(
                  { length: 50 },
                  (_, index) => {

                    const number =
                      `RFI-${String(
                        index + 1
                      ).padStart(4, "0")}`;

                    return (
                      <option
                        key={number}
                        value={number}
                      >
                        {number}
                      </option>
                    );
                  }
                )}

              </select>

              <p className="text-xs text-gray-500 mt-1">
                Auto-generate is recommended.
              </p>

            </div>

            {/* SUBJECT */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject
                <span className="text-red-500">
                  {" "}*
                </span>
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                disabled={saving}
                placeholder="Example: Clarification on grounding conductor installation"
                className="
                  w-full
                  border
                  border-gray-300
                  rounded-lg
                  px-4
                  py-3
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                  disabled:bg-gray-100
                "
              />

            </div>

            {/* QUESTION */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Question / Description
                <span className="text-red-500">
                  {" "}*
                </span>
              </label>

              <textarea
                value={question}
                onChange={(e) =>
                  setQuestion(
                    e.target.value
                  )
                }
                disabled={saving}
                placeholder="Describe the question, clarification, or information required..."
                rows={7}
                className="
                  w-full
                  border
                  border-gray-300
                  rounded-lg
                  px-4
                  py-3
                  outline-none
                  resize-y
                  focus:ring-2
                  focus:ring-blue-500
                  disabled:bg-gray-100
                "
              />

            </div>

            {/* ================================================= */}
            {/* RFI WORKFLOW */}
            {/* ================================================= */}

            <div
              className="
                border
                border-blue-200
                rounded-xl
                p-5
                bg-blue-50
              "
            >

              <h3 className="text-lg font-bold text-gray-900 mb-1">
                RFI Responsibility
              </h3>

              <p className="text-sm text-gray-600 mb-5">
                Identify who submitted the RFI, who received it,
                and who currently needs to take action.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* SUBMITTED BY */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Submitted By
                    <span className="text-red-500">
                      {" "}*
                    </span>
                  </label>

                  <input
                    type="text"
                    value={submittedBy}
                    onChange={(e) =>
                      setSubmittedBy(
                        e.target.value
                      )
                    }
                    disabled={saving}
                    placeholder="Example: Rakesh Dondapati"
                    className="
                      w-full
                      border
                      border-gray-300
                      rounded-lg
                      px-4
                      py-3
                      bg-white
                      outline-none
                      focus:ring-2
                      focus:ring-blue-500
                      disabled:bg-gray-100
                    "
                  />

                </div>

                {/* SENT TO */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sent To
                    <span className="text-red-500">
                      {" "}*
                    </span>
                  </label>

                  <input
                    type="text"
                    value={sentTo}
                    onChange={(e) =>
                      setSentTo(
                        e.target.value
                      )
                    }
                    disabled={saving}
                    placeholder="Example: Electrical Contractor"
                    className="
                      w-full
                      border
                      border-gray-300
                      rounded-lg
                      px-4
                      py-3
                      bg-white
                      outline-none
                      focus:ring-2
                      focus:ring-blue-500
                      disabled:bg-gray-100
                    "
                  />

                </div>

                {/* BALL IN COURT */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ball in Court
                    <span className="text-red-500">
                      {" "}*
                    </span>
                  </label>

                  <input
                    type="text"
                    value={ballInCourt}
                    onChange={(e) =>
                      setBallInCourt(
                        e.target.value
                      )
                    }
                    disabled={saving}
                    placeholder="Example: Electrical Contractor"
                    className="
                      w-full
                      border
                      border-gray-300
                      rounded-lg
                      px-4
                      py-3
                      bg-white
                      outline-none
                      focus:ring-2
                      focus:ring-blue-500
                      disabled:bg-gray-100
                    "
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    The person or company currently responsible
                    for the next action on this RFI.
                  </p>

                </div>

              </div>

            </div>

            {/* PRIORITY + DUE DATE */}

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-5
              "
            >

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(
                      e.target.value
                    )
                  }
                  disabled={saving}
                  className="
                    w-full
                    border
                    border-gray-300
                    rounded-lg
                    px-4
                    py-3
                    bg-white
                    focus:ring-2
                    focus:ring-blue-500
                    outline-none
                    disabled:bg-gray-100
                  "
                >

                  <option value="Low">
                    Low
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="High">
                    High
                  </option>

                  <option value="Critical">
                    Critical
                  </option>

                </select>

              </div>

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Due Date
                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) =>
                    setDueDate(
                      e.target.value
                    )
                  }
                  disabled={saving}
                  className="
                    w-full
                    border
                    border-gray-300
                    rounded-lg
                    px-4
                    py-3
                    bg-white
                    focus:ring-2
                    focus:ring-blue-500
                    outline-none
                    disabled:bg-gray-100
                  "
                />

              </div>

            </div>

            {/* FILE UPLOAD */}

            <div className="border-t pt-6">

              <label className="block text-sm font-semibold text-gray-700">
                Attach Drawing / Supporting Document
              </label>

              <p className="text-xs text-gray-500 mt-1 mb-3">
                Upload a drawing or supporting document directly
                from your computer.
              </p>

              {!attachment && (

                <label
                  className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    border-2
                    border-dashed
                    border-gray-300
                    rounded-xl
                    p-8
                    cursor-pointer
                    hover:border-blue-500
                    hover:bg-blue-50
                    transition
                  "
                >

                  <div className="text-4xl mb-3">
                    📎
                  </div>

                  <p className="font-semibold text-gray-700">
                    Choose a drawing or document
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Click here to select a file
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    PDF, DWG, PNG, JPG, JPEG • Maximum 25 MB
                  </p>

                  <input
                    type="file"
                    hidden
                    accept=".pdf,.dwg,.png,.jpg,.jpeg"
                    onChange={
                      handleFileChange
                    }
                    disabled={saving}
                  />

                </label>

              )}

              {attachment && (

                <div
                  className="
                    border
                    border-blue-200
                    rounded-xl
                    p-4
                    bg-blue-50
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        gap-3
                        min-w-0
                      "
                    >

                      <div
                        className="
                          w-12
                          h-12
                          rounded-lg
                          bg-white
                          flex
                          items-center
                          justify-center
                          text-2xl
                          shrink-0
                        "
                      >
                        📄
                      </div>

                      <div className="min-w-0">

                        <p className="font-semibold text-gray-800 truncate">
                          {attachment.name}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {(
                            attachment.size /
                            1024 /
                            1024
                          ).toFixed(2)}{" "}
                          MB
                        </p>

                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={
                        removeAttachment
                      }
                      disabled={saving}
                      className="
                        text-red-600
                        hover:text-red-800
                        text-sm
                        font-medium
                        shrink-0
                      "
                    >
                      Remove
                    </button>

                  </div>

                </div>

              )}

            </div>

            {/* EXISTING DRAWING */}

            <div className="border-t pt-6">

              <label className="block text-sm font-semibold text-gray-700">
                Link Existing Project Drawing
                <span className="text-gray-400 font-normal">
                  {" "} (Optional)
                </span>
              </label>

              <p className="text-xs text-gray-500 mt-1 mb-3">
                Use this if the drawing already exists in the
                project's Drawings section.
              </p>

              {drawings.length === 0 ? (

                <div
                  className="
                    border
                    border-dashed
                    border-gray-300
                    rounded-lg
                    p-5
                    text-center
                  "
                >

                  <p className="text-gray-500">
                    No project drawings available.
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    You can still upload a drawing above.
                  </p>

                </div>

              ) : (

                <select
                  value={drawingId}
                  onChange={(e) =>
                    setDrawingId(
                      e.target.value
                    )
                  }
                  disabled={saving}
                  className="
                    w-full
                    border
                    border-gray-300
                    rounded-lg
                    px-4
                    py-3
                    bg-white
                    focus:ring-2
                    focus:ring-blue-500
                    outline-none
                    disabled:bg-gray-100
                  "
                >

                  <option value="">
                    No existing project drawing
                  </option>

                  {drawings.map(
                    (drawing) => (

                      <option
                        key={drawing.id}
                        value={drawing.id}
                      >
                        {getDrawingName(
                          drawing
                        )}
                      </option>

                    )
                  )}

                </select>

              )}

              {selectedDrawing && (

                <div
                  className="
                    mt-4
                    border
                    rounded-lg
                    p-4
                    bg-gray-50
                  "
                >

                  <div
                    className="
                      flex
                      justify-between
                      items-center
                      gap-4
                    "
                  >

                    <div>

                      <p className="font-semibold">
                        📄{" "}
                        {getDrawingName(
                          selectedDrawing
                        )}
                      </p>

                      {selectedDrawing.title && (
                        <p className="text-sm text-gray-500 mt-1">
                          {
                            selectedDrawing.title
                          }
                        </p>
                      )}

                    </div>

                    {selectedDrawing.file_url && (

                      <a
                        href={
                          selectedDrawing.file_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="
                          bg-gray-700
                          hover:bg-gray-800
                          text-white
                          px-4
                          py-2
                          rounded-lg
                          text-sm
                          shrink-0
                        "
                      >
                        Download
                      </a>

                    )}

                  </div>

                </div>

              )}

            </div>

            {/* WORKFLOW INFORMATION */}

            <div
              className="
                bg-blue-50
                border
                border-blue-100
                rounded-xl
                p-4
              "
            >

              <div className="flex gap-3">

                <div className="text-lg">
                  ℹ️
                </div>

                <div>

                  <p className="font-semibold text-blue-800 text-sm">
                    RFI workflow
                  </p>

                  <p className="text-sm text-blue-700 mt-1">
                    New RFIs are created as Open. The Ball in
                    Court identifies the person or company
                    responsible for the next action.
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* FOOTER */}

          <div
            className="
              px-6
              py-4
              bg-gray-50
              border-t
              flex
              justify-end
              gap-3
              shrink-0
            "
          >

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                px-5
                py-2.5
                rounded-lg
                border
                border-gray-300
                bg-white
                text-gray-700
                hover:bg-gray-50
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="
                px-5
                py-2.5
                rounded-lg
                bg-blue-600
                text-white
                font-medium
                hover:bg-blue-700
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {saving
                ? "Creating..."
                : "Create RFI"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}