import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req) {
  const { id, direction, course_id, position } = await req.json();
  const supabase = getSupabaseServer();

  const newPos = direction === "up" ? position - 1 : position + 1;

  const { data: other } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", course_id)
    .eq("position", newPos)
    .single();

  if (other) {
    await supabase
      .from("lessons")
      .update({ position })
      .eq("id", other.id);
  }

  await supabase
    .from("lessons")
    .update({ position: newPos })
    .eq("id", id);

  return NextResponse.json({ success: true });
}