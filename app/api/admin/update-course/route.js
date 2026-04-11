import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req) {
  const body = await req.json();
  const { id, ...updates } = body;

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("courses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/courses/${id}`);

  return NextResponse.json({ course: data });
}