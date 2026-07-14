import { supabase } from "./supabase";

export async function uploadAttachment(file: File, rfiId: string) {

  const extension = file.name.split(".").pop();

  const filename = `${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("rfi-files")
    .upload(filename, file);

  if (uploadError) {
    console.error(uploadError);
    return null;
  }

  const { data } = supabase.storage
    .from("rfi-files")
    .getPublicUrl(filename);

  const { data: attachment, error } = await supabase
    .from("rfi_attachments")
    .insert([
      {
        rfi_id: rfiId,
        file_name: file.name,
        file_url: data.publicUrl,
        uploaded_by: "Project Engineer",
      },
    ])
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return attachment;
}

export async function getAttachments(rfiId: string) {

  const { data, error } = await supabase
    .from("rfi_attachments")
    .select("*")
    .eq("rfi_id", rfiId)
    .order("created_at");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}