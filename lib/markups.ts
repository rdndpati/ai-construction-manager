import { supabase } from "./supabase";

export async function getMarkups(drawingId: string) {
  const { data, error } = await supabase
    .from("markups")
    .select("*")
    .eq("drawing_id", drawingId);

  console.log("GET:", data, error);

  return data ?? [];
}

export async function createMarkup(markup: any) {
  console.log("INSERTING:", markup);

  const { data, error } = await supabase
    .from("markups")
    .insert(markup)
    .select();

  console.log("RESULT:", data);
  console.log("ERROR:", error);

  if (error) throw error;

  return data?.[0];
  
}
export async function updateMarkupPosition(
  id: string,
  x: number,
  y: number
) {
  const { data, error } = await supabase
    .from("markups")
    .update({
      x,
      y,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}