import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { markup, aiResult } = await req.json();

    // Create the RFI
    const { data: newRFI, error } = await supabase
      .from("rfis")
      .insert({
        project_id: markup.project_id,
        drawing_id: markup.drawing_id,
        markup_id: markup.id,

        rfi_number: `RFI-${Date.now()}`,

        title: markup.title,

        description: aiResult,

        status: "Open",

        priority: markup.priority ?? "Medium",

        due_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Link the markup to the new RFI
    const { error: markupError } = await supabase
      .from("markups")
      .update({
        rfi_id: newRFI.id,
      })
      .eq("id", markup.id);

    if (markupError) {
      throw markupError;
    }

    return NextResponse.json({
      success: true,
      message: "RFI saved successfully.",
      rfi: newRFI,
    });
  } catch (err) {
    console.error("Save RFI Error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save RFI.",
      },
      { status: 500 }
    );
  }
}