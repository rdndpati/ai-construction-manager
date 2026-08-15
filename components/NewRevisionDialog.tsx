"use client";

import { useState } from "react";
import { uploadDrawingFile } from "@/lib/drawings";

type Props = {
  drawingId: string;
  onSave: (revision: any) => void;
  onClose: () => void;
};

export default function NewRevisionDialog({
  drawingId,
  onSave,
  onClose,
}: Props) {
  const [form, setForm] = useState({
    drawing_id: drawingId,
    revision_number: "",
    revision_date: new Date().toISOString().split("T")[0],
    uploaded_by: "",
    notes: "",
    pdf_url: "",
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateForm(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");

    // Only PDF
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      e.target.value = "";
      return;
    }

    // 50 MB limit
    if (file.size > 50 * 1024 * 1024) {
      setError("PDF must be smaller than 50 MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const url = await uploadDrawingFile(file);

      if (!url) {
        throw new Error("PDF upload failed.");
      }

      setForm((prev) => ({
        ...prev,
        pdf_url: url,
      }));
    } catch (err: any) {
      console.error("Revision upload error:", err);

      setError(
        err?.message ||
          "Unable to upload the PDF. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setError("");

    // Validate revision
    if (!form.revision_number.trim()) {
      setError("Please enter a revision number.");
      return;
    }

    // Validate date
    if (!form.revision_date) {
      setError("Please select a revision date.");
      return;
    }

    // Validate PDF
    if (!form.pdf_url) {
      setError("Please upload the revision PDF.");
      return;
    }

    if (uploading) {
      setError("Please wait until the PDF finishes uploading.");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        ...form,
        revision_number: form.revision_number.trim(),
        notes: form.notes.trim(),
      });
    } catch (err: any) {
      console.error("Save revision error:", err);

      setError(
        err?.message ||
          "Unable to save the revision."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b bg-gray-50">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Upload Drawing Revision
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Add a new revision and attach the updated PDF.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving || uploading}
              className="text-gray-400 hover:text-gray-700 text-2xl disabled:opacity-50"
            >
              ×
            </button>

          </div>

        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Revision Number */}
          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Revision Number
              <span className="text-red-500 ml-1">*</span>
            </label>

            <input
              type="text"
              placeholder="Example: Rev 3"
              value={form.revision_number}
              onChange={(e) =>
                updateForm(
                  "revision_number",
                  e.target.value
                )
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

          </div>

          {/* Revision Date */}
          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Revision Date
              <span className="text-red-500 ml-1">*</span>
            </label>

            <input
              type="date"
              value={form.revision_date}
              onChange={(e) =>
                updateForm(
                  "revision_date",
                  e.target.value
                )
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

          </div>

          {/* Uploaded By */}
          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Uploaded By
            </label>

            <input
              type="text"
              placeholder="Your name"
              value={form.uploaded_by}
              onChange={(e) =>
                updateForm(
                  "uploaded_by",
                  e.target.value
                )
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

          </div>

          {/* Notes */}
          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Revision Notes
            </label>

            <textarea
              rows={4}
              placeholder="Describe what changed in this revision..."
              value={form.notes}
              onChange={(e) =>
                updateForm(
                  "notes",
                  e.target.value
                )
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

          </div>

          {/* PDF Upload */}
          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Revision PDF
              <span className="text-red-500 ml-1">*</span>
            </label>

            <label
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition ${
                uploading
                  ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                  : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
              }`}
            >

              <div className="text-4xl mb-3">
                📄
              </div>

              {uploading ? (

                <p className="font-medium text-blue-600">
                  Uploading PDF...
                </p>

              ) : form.pdf_url ? (

                <>
                  <p className="font-medium text-green-600">
                    ✓ PDF uploaded successfully
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    You can save this revision now.
                  </p>
                </>

              ) : (

                <>
                  <p className="font-medium text-gray-700">
                    Click to upload PDF
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    PDF files only • Maximum 50 MB
                  </p>
                </>

              )}

              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading || saving}
              />

            </label>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">

          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploading}
            className="px-5 py-2.5 border border-gray-300 bg-white rounded-lg font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving
              ? "Saving..."
              : uploading
              ? "Uploading..."
              : "Save Revision"}
          </button>

        </div>

      </div>

    </div>
  );
}