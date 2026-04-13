import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req) {
  try {
    const { id } = await req.json();
    const supabase = getSupabaseServer();

    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, thumbnail_url, video_path")
      .eq("course_id", id);

    const files = [];

    lessons?.forEach(l => {
      if (l.thumbnail_url) files.push(l.thumbnail_url);
      if (l.video_path) files.push(`videos-private/${l.video_path}`);
    });

    await supabase.from("lessons").delete().eq("course_id", id);
    await supabase.from("courses").delete().eq("id", id);

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
