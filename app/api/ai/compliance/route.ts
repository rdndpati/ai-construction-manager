import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";

import { supabase } from "@/lib/supabase";
import { compareCompliance } from "@/lib/ai/compliance";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "Missing file or projectId" },
        { status: 400 }
      );
    }

    // Load project specifications
    const { data: specifications, error } = await supabase
      .from("specifications")
      .select("requirement")
      .eq("project_id", projectId);

    if (error) {
      throw error;
    }

    const requirements = specifications
      ?.map((item) => item.requirement)
      .join("\n") || "";

    // Extract PDF text
    const uint8Array = new Uint8Array(
      await file.arrayBuffer()
    );

    const { text } = await extractText(uint8Array);

    const submittalText = Array.isArray(text)
      ? text.join("\n")
      : text;

    // Compare using AI
    const result = await compareCompliance(
  requirements,
  submittalText
);

// Determine recommendation
const recommendation =
  result.includes("Revise and Resubmit")
    ? "Revise and Resubmit"
    : "Approved";

// Save report
const { error: insertError } = await supabase
  .from("compliance_reports")
  .insert({
    project_id: projectId,
    submittal_name: file.name,
    report: result,
    recommendation,
  });

if (insertError) {
  console.error(insertError);
}

return NextResponse.json({
  report: result,
});

  } catch (error: any) {

    console.error(error);

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}