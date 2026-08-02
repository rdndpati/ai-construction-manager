import { supabase } from "@/lib/supabase";

export async function hasPermission(
  module: string,
  permission: string
) {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  // Get user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id")
    .eq("id", user.id)
    .single();

  if (!profile?.role_id) return false;

  // Check permission
  const { data } = await supabase
    .from("permissions")
    .select("id")
    .eq("role_id", profile.role_id)
    .eq("module", module)
    .eq("permission", permission);

  return (data?.length ?? 0) > 0;
}