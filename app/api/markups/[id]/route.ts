import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from("markups")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Markup deleted successfully.",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete markup.",
      },
      { status: 500 }
    );
  }
}