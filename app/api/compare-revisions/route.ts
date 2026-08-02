import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";

export async function POST(req: NextRequest) {
  try {
    const { leftText, rightText } = await req.json();

    const response = await ollama.chat({
      model: "llama3.2",
      messages: [
        {
          role: "system",
          content:
            "You are an expert construction engineer. Compare two document revisions and summarize only the meaningful changes. Ignore formatting differences.",
        },
        {
          role: "user",
          content: `
Revision A

${leftText}

----------------------

Revision B

${rightText}
`,
        },
      ],
    });

    return NextResponse.json({
      comparison: response.message.content,
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