import { supabase } from "./supabase";

export async function getRevisions(drawingId: string) {
  const { data } = await supabase
    .from("drawing_revisions")
    .select("*")
    .eq("drawing_id", drawingId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function createRevision(revision: any) {
  const { data, error } = await supabase
    .from("drawing_revisions")
    .insert([revision])
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}