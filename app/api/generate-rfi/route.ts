import { NextResponse } from "next/server";
import { extractText } from "unpdf";
import { Ollama } from "ollama";

const ollama = new Ollama({
  host: "http://127.0.0.1:11434",
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Please upload a drawing." },
        { status: 400 }
      );
    }

    // Read PDF
    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);

    // Extract text
    const result = await extractText(uint8Array);
    const drawingText = result.text.join("\n");

    // Generate RFI
    const response = await ollama.chat({
      model: "llama3.2",
      messages: [
        {
          role: "system",
          content: `
You are a senior construction engineer.

Read the uploaded drawing/specification.

Generate ONE professional construction RFI.

Return ONLY valid JSON in this format:

{
  "title":"",
  "question":"",
  "discipline":"",
  "priority":"",
  "reason":""
}
`,
        },
        {
          role: "user",
          content: drawingText,
        },
      ],
    });

    return NextResponse.json({
      rfi: response.message.content,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to generate RFI." },
      { status: 500 }
    );
  }
}