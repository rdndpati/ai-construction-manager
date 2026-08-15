import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProjectAccessClient from "./ProjectAccessClient";

export default async function ProjectAccessPage() {
  /* =====================================================
     1. CREATE SERVER SUPABASE CLIENT
  ===================================================== */

  const supabase =
    await createClient();

  /* =====================================================
     2. GET LOGGED-IN USER
  ===================================================== */

  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth.getUser();

  console.log(
    "===================================="
  );

  console.log(
    "PROJECT ACCESS AUTH CHECK"
  );

  console.log(
    "USER:",
    user?.email
  );

  console.log(
    "USER ID:",
    user?.id
  );

  console.log(
    "USER ERROR:",
    userError
  );

  console.log(
    "===================================="
  );

  /* =====================================================
     NOT LOGGED IN
  ===================================================== */

  if (
    userError ||
    !user
  ) {
    redirect("/login");
  }

  /* =====================================================
     3. LOAD USER PROFILE
  ===================================================== */

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      `
        id,
        company_id,
        is_owner,
        roles (
          name
        )
      `
    )
    .eq(
      "id",
      user.id
    )
    .single();

  console.log(
    "PROFILE:",
    profile
  );

  console.log(
    "PROFILE ERROR:",
    profileError
  );

  /* =====================================================
     PROFILE NOT FOUND
  ===================================================== */

  if (
    profileError ||
    !profile
  ) {
    redirect(
      "/app/projects"
    );
  }

  /* =====================================================
     4. DETERMINE ROLE
  ===================================================== */

  const roleData =
    profile.roles as unknown as
      | {
          name: string;
        }
      | {
          name: string;
        }[]
      | null;

  const roleName =
    Array.isArray(
      roleData
    )
      ? roleData[0]?.name
      : roleData?.name;

  const isOwner =
    profile.is_owner ===
    true;

  const isAdmin =
    roleName ===
    "Admin";

  console.log(
    "ROLE:",
    roleName
  );

  console.log(
    "IS OWNER:",
    isOwner
  );

  console.log(
    "IS ADMIN:",
    isAdmin
  );

  /* =====================================================
     5. ONLY OWNER OR ADMIN
  ===================================================== */

  if (
    !isAdmin &&
    !isOwner
  ) {
    console.log(
      "ACCESS DENIED - USER IS NOT ADMIN OR OWNER"
    );

    redirect(
      "/app/projects"
    );
  }

  /* =====================================================
     6. COMPANY REQUIRED
  ===================================================== */

  if (
    !profile.company_id
  ) {
    redirect(
      "/create-company"
    );
  }

  /* =====================================================
     7. RENDER
  ===================================================== */

  return (
    <ProjectAccessClient />
  );
}