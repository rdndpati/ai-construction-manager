import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import PDFParser from "pdf2json";

export async function POST(req: NextRequest) {
  try {
    const { pdfUrl, revisionId } = await req.json();

    if (!pdfUrl) {
      return NextResponse.json(
        { error: "Missing pdfUrl" },
        { status: 400 }
      );
    }

    // Download PDF
    const response = await fetch(pdfUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to download PDF" },
        { status: 400 }
      );
    }

    // Convert to Buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const pdfParser = new PDFParser();

    const extractedText = await new Promise<string>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(errData.parserError);
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          let text = "";

          for (const page of pdfData.Pages) {
  for (const item of page.Texts) {
    try {
      if (item.R?.length) {
        text += decodeURIComponent(item.R[0].T) + " ";
      }
    } catch {
      text += item.R?.[0]?.T ?? "";
      text += " ";
    }
  }

  text += "\n";
}

          resolve(text);
        } catch (err) {
          reject(err);
        }
      });

      pdfParser.parseBuffer(buffer);
    });
    if (revisionId) {
  const { error } = await supabase
    .from("drawing_revisions")
    .update({
      extracted_text: extractedText,
    })
    .eq("id", revisionId);

  if (error) {
    console.error(error);
  }
}

    return NextResponse.json({
      success: true,
      extractedText,
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

export async function GET() {
  return NextResponse.json({
    message: "GET works",
  });
}