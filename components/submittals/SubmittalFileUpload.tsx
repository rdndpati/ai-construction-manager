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

    const fileName = `${submittalId}/${Date.now()}-${file.name}`;

    const { data: uploadData, error } = await supabase.storage
  .from("submittals")
  .upload(fileName, file);

console.log("Upload data:", uploadData);
console.log("Upload error:", error);

if (error) {
  console.error(error);
  alert(JSON.stringify(error, null, 2));
  return;
}

    const { data } = supabase.storage
      .from("submittals")
      .getPublicUrl(fileName);

    onUploaded(data.publicUrl);
  }

  return (
    <div className="mt-6">
      <label className="font-medium">
        Upload PDF
      </label>

      <input
        type="file"
        accept=".pdf"
        onChange={uploadFile}
        className="block mt-2"
      />
    </div>
  );
}