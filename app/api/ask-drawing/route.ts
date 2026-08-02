import { NextResponse } from "next/server";
import ollama from "ollama";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { drawingId, question } = await req.json();

    const { data: revisions, error } = await supabase
      .from("drawing_revisions")
      .select("extracted_text")
      .eq("drawing_id", drawingId)
      .order("revision_date", { ascending: false })
      .limit(1);

    if (error || !revisions?.length) {
      return NextResponse.json({
        answer: "No extracted text found for this drawing.",
      });
    }

    const drawingText = revisions[0].extracted_text;

    const prompt = `
You are a Senior Solar Design Engineer.

You help engineers answer questions about construction drawings.

If the user asks to create an RFI:

Return your answer EXACTLY like this:

Title:
...

Question:
...

Discipline:
Electrical | Civil | Structural | Mechanical

Priority:
Low | Medium | High

Drawing Information:

${drawingText}

User Question:

${question}
`;

    const response = await ollama.chat({
      model: "llama3.2",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const answer = response.message.content;

    await supabase.from("ai_chats").insert([
      {
        drawing_id: drawingId,
        question,
        answer,
      },
    ]);

    return NextResponse.json({
      answer,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        answer: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}