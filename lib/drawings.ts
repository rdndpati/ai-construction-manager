import { supabase } from "./supabase";

export async function getDrawings(projectId: string) {
  const { data, error } = await supabase
    .from("drawings")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get Drawings Error:", error);
    return [];
  }

  return data;
}

export async function createDrawing(drawing: {
  project_id: string;
  number: string;
  name: string;
  revision: string;
  status: string;
  file_url?: string;
}) {
  console.log("INSERTING:", drawing);

  const { data, error } = await supabase
    .from("drawings")
    .insert([
      {
        project_id: drawing.project_id,
        number: drawing.number,
        name: drawing.name,
        revision: drawing.revision,
        status: drawing.status,
        file_url: drawing.file_url,
      },
    ])
    .select()
    .single();

  console.log("DATA:", data);
  console.log("ERROR:", error);

  if (error) {
    console.error(error);
    alert(error.message);
    return null;
  }

  return data;
}
export async function updateDrawing(
  id: string,
  updates: {
    number: string;
    name: string;
    revision: string;
    status: string;
    file_url?: string;
  }
) {
  const { data, error } = await supabase
    .from("drawings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Update Drawing Error:", error);
    alert(error.message);
    return null;
  }

  return data;
}

export async function deleteDrawing(id: string) {
  const { error } = await supabase
    .from("drawings")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete Drawing Error:", error);
    alert(error.message);
    return false;
  }

  return true;
}

export async function uploadDrawingFile(file: File) {
  const fileName = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("drawings")
    .upload(fileName, file);

  if (error) {
    console.error("Upload File Error:", error);
    alert(error.message);
    return null;
  }

  const { data } = supabase.storage
    .from("drawings")
    .getPublicUrl(fileName);

  return data.publicUrl;
}