import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req) {
  const body = await req.json();
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("lessons")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/admin");
  revalidatePath(`/courses/${body.course_id}`);

  return NextResponse.json({ lesson: data });
}