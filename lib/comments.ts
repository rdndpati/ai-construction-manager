import { supabase } from "./supabase";

export async function getComments(rfiId: string) {
  const { data, error } = await supabase
    .from("rfi_comments")
    .select("*")
    .eq("rfi_id", rfiId)
    .order("created_at");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function createComment(comment: any) {
  const { data, error } = await supabase
    .from("rfi_comments")
    .insert([comment])
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}