import { supabase } from "./supabase";

export async function addActivity(activity: any) {
  const { error } = await supabase
    .from("activity_log")
    .insert([activity]);

  if (error) {
    console.error(error);
  }
}

export async function getActivities(projectId: string) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}