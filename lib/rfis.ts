import { supabase } from "./supabase";
import { addActivity } from "./activity";

export async function getRFIs(projectId: string) {
  const { data, error } = await supabase
    .from("rfis")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function createRFI(rfi: any) {
  const { data, error } = await supabase
    .from("rfis")
    .insert([rfi])
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }
  await addActivity({
    project_id: data.project_id,
    drawing_id: data.drawing_id,
    markup_id: data.markup_id,
    rfi_id: data.id,
    user_name: "Rakesh",
    action: "Created RFI",
    description: data.title,
});

  return data;
}

export async function updateRFI(id: string, updates: any) {
  const { data, error } = await supabase
    .from("rfis")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export async function deleteRFI(id: string) {
  const { error } = await supabase
    .from("rfis")
    .delete()
    .eq("id", id);

  return !error;
}