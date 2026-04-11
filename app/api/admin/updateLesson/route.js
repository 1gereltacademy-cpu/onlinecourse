import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      id,
      title,
      video_url,
      duration,
      position,
      thumbnail_url,
      is_preview,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Lesson id байхгүй байна" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { error } = await supabase
      .from("lessons")
      .update({
        title,
        video_url,
        duration,
        position: Number(position || 0),
        thumbnail_url,
        is_preview,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
