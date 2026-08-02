import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export async function POST(req: Request) {
  const { drawing } = await req.json();

  const prompt = `
You are an experienced solar EPC design engineer.

Review this drawing information:

Drawing Number: ${drawing.number}
Drawing Name: ${drawing.name}
Revision: ${drawing.revision}
Status: ${drawing.status}

Extracted Text:
${drawing.extracted_text ?? "No extracted text available."}

Provide:

1. Drawing Summary
2. Possible Engineering Risks
3. Missing Information
4. QA/QC Checks
5. Recommended Actions
`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3.2:latest",
      prompt,
      stream: false,
    }),
  });

  const result = await response.json();
  if (drawing?.id) {
  const { error } = await supabase
    .from("drawings")
    .update({
      ai_review: result.response,
    })
    .eq("id", drawing.id);

  if (error) {
    console.error(error);
  }
}

  return NextResponse.json({
    review: result.response,
  });
}