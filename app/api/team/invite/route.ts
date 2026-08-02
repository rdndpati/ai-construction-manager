import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      full_name,
      email,
      role_id,
      company_id,
      invited_by,
    } = body;

    // Send invitation email through Supabase Auth
    const { data, error } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Save invitation
    const { error: inviteError } = await supabaseAdmin
      .from("invitations")
      .insert({
        company_id,
        email,
        role_id,
        invited_by,
        status: "Pending",
      });

    if (inviteError) {
      return NextResponse.json(
        { error: inviteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to send invitation.",
      },
      {
        status: 500,
      }
    );
  }
}