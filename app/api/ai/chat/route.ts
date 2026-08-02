import { NextResponse } from "next/server";
import { extractText } from "unpdf";
import { Ollama } from "ollama";

const ollama = new Ollama({
  host: "http://127.0.0.1:11434",
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const question = formData.get("question") as string;
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({
        answer: "Please upload a drawing or specification.",
      });
    }

    // Read uploaded PDF
    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);

    // Extract text from PDF
    const result = await extractText(uint8Array);

    const drawingText = result.text.join("\n");

    // Send drawing text to Ollama
    const response = await ollama.chat({
      model: "llama3.2",
      messages: [
        {
          role: "system",
          content:
            "You are an experienced electrical construction engineer. Answer the user's question using ONLY the uploaded drawing or specification. If the answer is not present in the document, clearly state that it is not available.",
        },
        {
          role: "user",
          content: `
Drawing Text:

${drawingText}

Question:

${question}
`,
        },
      ],
    });

    return NextResponse.json({
      answer: response.message.content,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        answer: "Server error while processing the document.",
      },
      {
        status: 500,
      }
    );
  }
}