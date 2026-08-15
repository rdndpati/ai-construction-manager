import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AccessResult = {
  userId: string;
  companyId: string;
  projectId: string;
  isOwner: boolean;
  isAdmin: boolean;
  roleName: string | null;
};

export async function requireCostManagementProjectAccess(
  projectId: string
): Promise<AccessResult> {
  const supabase = await createClient();

  // ============================================
  // 1. LOGGED-IN USER
  // ============================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ============================================
  // 2. USER PROFILE
  // ============================================

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select(`
        id,
        company_id,
        is_owner,
        role_id,
        roles (
          name
        )
      `)
      .eq("id", user.id)
      .single();

  if (profileError || !profile) {
    console.error(
      "COST MANAGEMENT PROFILE ERROR:",
      profileError
    );

    redirect("/app/projects");
  }

  if (!profile.company_id) {
    redirect("/create-company");
  }

  // ============================================
  // 3. ROLE
  // ============================================

  const roleData = profile.roles as
    | { name: string }
    | { name: string }[]
    | null;

  const roleName = Array.isArray(roleData)
    ? roleData[0]?.name ?? null
    : roleData?.name ?? null;

  const isOwner = profile.is_owner === true;
  const isAdmin = roleName === "Admin";

  // ============================================
  // 4. VERIFY PROJECT BELONGS TO COMPANY
  // ============================================

  const { data: project, error: projectError } =
    await supabase
      .from("projects")
      .select("id, company_id")
      .eq("id", projectId)
      .eq("company_id", profile.company_id)
      .single();

  if (projectError || !project) {
    console.error(
      "PROJECT ACCESS - PROJECT NOT FOUND:",
      projectError
    );

    redirect("/app/cost-management");
  }

  // ============================================
  // 5. OWNER / ADMIN
  // ============================================

  if (isOwner || isAdmin) {
    return {
      userId: user.id,
      companyId: profile.company_id,
      projectId,
      isOwner,
      isAdmin,
      roleName,
    };
  }

  // ============================================
  // 6. CHECK PROJECT MEMBERSHIP
  // ============================================

  const { data: membership, error: membershipError } =
    await supabase
      .from("project_members")
      .select("project_id, profile_id")
      .eq("project_id", projectId)
      .eq("profile_id", user.id)
      .maybeSingle();

  if (membershipError) {
    console.error(
      "PROJECT MEMBERSHIP ERROR:",
      membershipError
    );

    redirect("/app/cost-management");
  }

  // ============================================
  // 7. DENY IF NOT ASSIGNED
  // ============================================

  if (!membership) {
    console.error(
      "COST MANAGEMENT ACCESS DENIED",
      {
        userId: user.id,
        projectId,
        roleName,
      }
    );

    redirect("/app/cost-management");
  }

  // ============================================
  // 8. ACCESS GRANTED
  // ============================================

  return {
    userId: user.id,
    companyId: profile.company_id,
    projectId,
    isOwner,
    isAdmin,
    roleName,
  };
}