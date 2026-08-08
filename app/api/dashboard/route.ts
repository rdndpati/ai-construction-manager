import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const [
    projects,
    drawings,
    rfis,
    submittals,
    specifications,
    compliance,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("drawings")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("rfis")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("submittals")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("specifications")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("compliance_reports")
      .select("*", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    projects: projects.count ?? 0,
    drawings: drawings.count ?? 0,
    rfis: rfis.count ?? 0,
    submittals: submittals.count ?? 0,
    specifications: specifications.count ?? 0,
    compliance: compliance.count ?? 0,
  });
}