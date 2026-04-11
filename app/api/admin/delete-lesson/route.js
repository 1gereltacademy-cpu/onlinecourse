import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getStoragePathFromUrl } from "@/lib/storage";

export async function POST(req) {
  const { id } = await req.json();
  const supabase = getSupabaseServer();

  const { data: lesson, error: fetchError } = await supabase
    .from("lessons")
    .select("id, course_id, thumbnail_url")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 400 });
  }

  const imagePath = getStoragePathFromUrl(lesson?.thumbnail_url);

  if (imagePath) {
    const { error: storageError } = await supabase.storage
      .from("images")
      .remove([imagePath]);

    if (storageError) {
      console.error("Storage delete error:", storageError.message);
    }
  }

  const { error } = await supabase.from("lessons").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/admin");
  revalidatePath(`/courses/${lesson.course_id}`);

  return NextResponse.json({ success: true });
}