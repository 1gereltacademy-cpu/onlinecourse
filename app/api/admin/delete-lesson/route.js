import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/supabase-server";

export async function POST(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Lesson id байхгүй" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, thumbnail_url, video_path")
      .eq("id", id)
      .single();

    await supabase.from("lessons").delete().eq("id", id);

    const files = [];

    if (lesson?.thumbnail_url) files.push(lesson.thumbnail_url);
    if (lesson?.video_path) files.push(`videos-private/${lesson.video_path}`);

    if (files.length) {
      await supabase.storage.from("videos-private").remove(
        files.map(f => f.replace("videos-private/", ""))
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
