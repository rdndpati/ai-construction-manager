import { supabase } from "@/lib/supabase";

export type Permission =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "manage";

export type UserAccess = {
  userId: string | null;
  roleId: string | null;
  roleName: string | null;
  isOwner: boolean;
  isAdmin: boolean;
};

/**
 * Get the currently logged-in user's
 * role and company access information.
 */
export async function getUserAccess(): Promise<UserAccess> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      userId: null,
      roleId: null,
      roleName: null,
      isOwner: false,
      isAdmin: false,
    };
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(`
      role_id,
      is_owner,
      roles (
        name
      )
    `)
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error(
      "GET USER ACCESS ERROR:",
      profileError
    );

    return {
      userId: user.id,
      roleId: null,
      roleName: null,
      isOwner: false,
      isAdmin: false,
    };
  }

  const roleData = profile.roles as
    | { name: string }
    | { name: string }[]
    | null;

  const roleName =
    Array.isArray(roleData)
      ? roleData[0]?.name ?? null
      : roleData?.name ?? null;

  const isOwner =
    profile.is_owner === true;

  const isAdmin =
    roleName === "Admin";

  return {
    userId: user.id,
    roleId: profile.role_id,
    roleName,
    isOwner,
    isAdmin,
  };
}

/**
 * Check whether the current user has
 * a specific permission.
 *
 * Owner/Admin:
 *     Full access.
 *
 * Other users:
 *     Must have the permission in
 *     the permissions table.
 */
export async function hasPermission(
  module: string,
  permission: Permission
): Promise<boolean> {
  const access =
    await getUserAccess();

  // ============================================
  // OWNER / ADMIN
  // ============================================

  if (
    access.isOwner ||
    access.isAdmin
  ) {
    return true;
  }

  // ============================================
  // NO ROLE
  // ============================================

  if (!access.roleId) {
    return false;
  }

  // ============================================
  // CHECK EXACT PERMISSION
  // ============================================

  const {
    data,
    error,
  } = await supabase
    .from("permissions")
    .select("id")
    .eq(
      "role_id",
      access.roleId
    )
    .eq(
      "module",
      module
    )
    .eq(
      "permission",
      permission
    )
    .limit(1);

  if (error) {
    console.error(
      "PERMISSION CHECK ERROR:",
      error
    );

    return false;
  }

  if (
    data &&
    data.length > 0
  ) {
    return true;
  }

  // ============================================
  // MANAGE = FULL MODULE ACCESS
  // ============================================

  if (
    permission !== "manage"
  ) {
    const {
      data: managePermission,
      error: manageError,
    } = await supabase
      .from("permissions")
      .select("id")
      .eq(
        "role_id",
        access.roleId
      )
      .eq(
        "module",
        module
      )
      .eq(
        "permission",
        "manage"
      )
      .limit(1);

    if (manageError) {
      console.error(
        "MANAGE PERMISSION CHECK ERROR:",
        manageError
      );

      return false;
    }

    if (
      managePermission &&
      managePermission.length > 0
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Convenience helpers
 */

export async function canView(
  module: string
): Promise<boolean> {
  return hasPermission(
    module,
    "view"
  );
}

export async function canCreate(
  module: string
): Promise<boolean> {
  return hasPermission(
    module,
    "create"
  );
}

export async function canEdit(
  module: string
): Promise<boolean> {
  return hasPermission(
    module,
    "edit"
  );
}

export async function canDelete(
  module: string
): Promise<boolean> {
  return hasPermission(
    module,
    "delete"
  );
}

export async function canApprove(
  module: string
): Promise<boolean> {
  return hasPermission(
    module,
    "approve"
  );
}

export async function canManage(
  module: string
): Promise<boolean> {
  return hasPermission(
    module,
    "manage"
  );
}