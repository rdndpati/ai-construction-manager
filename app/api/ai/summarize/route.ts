import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import { extractSpecification } from "@/lib/ai/specification";
import { classifyDocument } from "@/lib/ai/classify";
import { reviewSubmittal } from "@/lib/ai/review";
import { askOllama } from "@/lib/ollama";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No PDF uploaded" },
        { status: 400 }
      );
    }

    // Read PDF
    const uint8Array = new Uint8Array(await file.arrayBuffer());

    // Extract text
    const { text } = await extractText(uint8Array);

const pdfText = Array.isArray(text)
  ? text.join("\n")
  : text;

    console.log("========== PDF TEXT ==========");
    console.log(pdfText);
    console.log("PDF Length:", pdfText.length);
    console.log("==============================");

    // Classify document
    const documentInfo = await classifyDocument(pdfText);
    console.log("========== DOCUMENT TYPE ==========");
    console.log(documentInfo);
    console.log("===================================");

    // Engineering Submittal
    // Engineering Submittal
if (documentInfo.documentType === "Submittal") {
  const review = await reviewSubmittal(pdfText);

  return NextResponse.json({
    documentType: "Submittal",
    review,
  });
}

// Project Specification
if (documentInfo.documentType === "Specification") {
  const requirements = await extractSpecification(pdfText);

  return NextResponse.json({
    documentType: "Specification",
    requirements,
  });
}

// Everything else
const summary = await askOllama(`
You are an AI document assistant.

Summarize the following document in simple language.

Document Type:
${documentInfo.documentType}

Document:

${pdfText}
`);

return NextResponse.json({
  documentType: documentInfo.documentType,
  summary,
  details: documentInfo,
});

  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}