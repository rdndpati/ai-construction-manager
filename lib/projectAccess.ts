import { supabase } from "@/lib/supabase";

export type AccessibleProject = {
  id: string;
  name: string;
};

export async function getAccessibleProjects(): Promise<{
  projects: AccessibleProject[];
  userId: string | null;
  companyId: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  error: string | null;
}> {
  try {
    // ============================================
    // GET CURRENT USER
    // ============================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        projects: [],
        userId: null,
        companyId: null,
        isOwner: false,
        isAdmin: false,
        error: "User is not logged in.",
      };
    }

    // ============================================
    // GET PROFILE + ROLE
    // ============================================

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(`
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
        "PROJECT ACCESS PROFILE ERROR:",
        profileError
      );

      return {
        projects: [],
        userId: user.id,
        companyId: null,
        isOwner: false,
        isAdmin: false,
        error: "Unable to load user profile.",
      };
    }

    if (!profile.company_id) {
      return {
        projects: [],
        userId: user.id,
        companyId: null,
        isOwner: profile.is_owner === true,
        isAdmin: false,
        error: "User does not belong to a company.",
      };
    }

    // ============================================
    // DETERMINE ROLE
    // ============================================

    const roleData = profile.roles as
      | { name: string }
      | { name: string }[]
      | null;

    const roleName = Array.isArray(roleData)
      ? roleData[0]?.name
      : roleData?.name;

    const isOwner =
      profile.is_owner === true;

    const isAdmin =
      roleName === "Admin";

    const fullAccess =
      isOwner || isAdmin;

    // ============================================
    // OWNER / ADMIN
    // ============================================

    if (fullAccess) {
      const {
        data,
        error,
      } = await supabase
        .from("projects")
        .select("id,name")
        .eq(
          "company_id",
          profile.company_id
        )
        .order("name");

      if (error) {
        console.error(
          "ALL PROJECTS ERROR:",
          error
        );

        return {
          projects: [],
          userId: user.id,
          companyId: profile.company_id,
          isOwner,
          isAdmin,
          error: error.message,
        };
      }

      return {
        projects:
          (data as AccessibleProject[]) ?? [],
        userId: user.id,
        companyId: profile.company_id,
        isOwner,
        isAdmin,
        error: null,
      };
    }

    // ============================================
    // PROJECT ENGINEER / QA/QC / OTHER USER
    // ============================================

    const {
      data: memberships,
      error: membershipError,
    } = await supabase
      .from("project_members")
      .select("project_id")
      .eq(
        "profile_id",
        user.id
      );

    if (membershipError) {
      console.error(
        "PROJECT MEMBERS ERROR:",
        membershipError
      );

      return {
        projects: [],
        userId: user.id,
        companyId: profile.company_id,
        isOwner,
        isAdmin,
        error: membershipError.message,
      };
    }

    const projectIds =
      (memberships ?? [])
        .map(
          (member) =>
            member.project_id
        )
        .filter(Boolean);

    // ============================================
    // USER HAS NO PROJECT ASSIGNMENTS
    // ============================================

    if (projectIds.length === 0) {
      return {
        projects: [],
        userId: user.id,
        companyId: profile.company_id,
        isOwner,
        isAdmin,
        error: null,
      };
    }

    // ============================================
    // ONLY ASSIGNED PROJECTS
    // ============================================

    const {
      data,
      error,
    } = await supabase
      .from("projects")
      .select("id,name")
      .eq(
        "company_id",
        profile.company_id
      )
      .in(
        "id",
        projectIds
      )
      .order("name");

    if (error) {
      console.error(
        "ASSIGNED PROJECTS ERROR:",
        error
      );

      return {
        projects: [],
        userId: user.id,
        companyId: profile.company_id,
        isOwner,
        isAdmin,
        error: error.message,
      };
    }

    return {
      projects:
        (data as AccessibleProject[]) ?? [],
      userId: user.id,
      companyId: profile.company_id,
      isOwner,
      isAdmin,
      error: null,
    };

  } catch (error) {
    console.error(
      "PROJECT ACCESS ERROR:",
      error
    );

    return {
      projects: [],
      userId: null,
      companyId: null,
      isOwner: false,
      isAdmin: false,
      error: "Unable to load projects.",
    };
  }
}