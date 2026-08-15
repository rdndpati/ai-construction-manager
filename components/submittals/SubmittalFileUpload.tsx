"use client";

import { supabase } from "@/lib/supabase";

type Props = {
  submittalId: string;
  onUploaded: (url: string) => void;
};

export default function SubmittalFileUpload({
  submittalId,
  onUploaded,
}: Props) {
  async function uploadFile(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please select a PDF file.");
      return;
    }

    try {
      const fileName =
        `${submittalId}/${Date.now()}-${file.name}`;

      // Upload file
      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from("submittals")
          .upload(fileName, file, {
            upsert: true,
          });

      if (uploadError) {
        console.error(
          "UPLOAD ERROR:",
          uploadError
        );

        alert(
          `Upload failed.\n\n${uploadError.message}`
        );

        return;
      }

      console.log(
        "Uploaded:",
        uploadData
      );

      // Get public URL
      const { data: publicUrlData } =
        supabase.storage
          .from("submittals")
          .getPublicUrl(fileName);

      const publicUrl =
        publicUrlData.publicUrl;

      if (!publicUrl) {
        alert(
          "File uploaded but URL could not be created."
        );

        return;
      }

      console.log(
        "PUBLIC URL:",
        publicUrl
      );

      // IMPORTANT:
      // Save URL to database
      const { error: dbError } =
        await supabase
          .from("submittals")
          .update({
            file_url: publicUrl,
          })
          .eq("id", submittalId);

      if (dbError) {
        console.error(
          "DATABASE UPDATE ERROR:",
          dbError
        );

        alert(
          `File uploaded, but database was not updated.\n\n${dbError.message}`
        );

        return;
      }

      // Update parent page
      onUploaded(publicUrl);

      alert(
        "PDF uploaded successfully."
      );

    } catch (error: any) {
      console.error(
        "UPLOAD ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to upload file."
      );
    }
  }

  return (
    <div className="mt-6">

      <label className="font-medium block mb-2">
        Upload PDF
      </label>

      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={uploadFile}
        className="block"
      />

      <p className="text-sm text-gray-500 mt-2">
        PDF files only.
      </p>

    </div>
  );
}