import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { extractText } from "unpdf";
import { extractSpecification } from "@/lib/ai/specification";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    const uint8Array = new Uint8Array(await file.arrayBuffer());

    const { text } = await extractText(uint8Array);

    const pdfText = Array.isArray(text)
      ? text.join("\n")
      : text;

    const result = await extractSpecification(pdfText);

    console.log("AI Result:", result);

for (const reqItem of result.requirements) {

  const { error } = await supabase
    .from("specifications")
    .insert({
      project_id: projectId,
      requirement: reqItem.requirement,
    });

  if (error) {
    console.error(error);
  }
}

    return NextResponse.json(result);

  } catch (error: any) {
  console.error("========== SPECIFICATION API ERROR ==========");
  console.error(error);

  if (error instanceof Error) {
    console.error(error.stack);
  }

  return NextResponse.json(
    {
      error: error?.message || "Unknown error",
    },
    { status: 500 }
  );
}
}