import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getStoragePathFromUrl } from "@/lib/storage";

export async function POST(req) {
  const { id } = await req.json();
  const supabase = getSupabaseServer();

  const { data: course, error: fetchError } = await supabase
    .from("courses")
    .select("id, thumbnail_url, payment_qr_url")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 400 });
  }

  const { data: lessons } = await supabase
    .from("lessons")
    .select("thumbnail_url")
    .eq("course_id", id);

  const filesToDelete = [];

  const courseImage = getStoragePathFromUrl(course?.thumbnail_url);
  const qrImage = getStoragePathFromUrl(course?.payment_qr_url);

  if (courseImage) filesToDelete.push(courseImage);
  if (qrImage) filesToDelete.push(qrImage);

  if (lessons?.length) {
    for (const lesson of lessons) {
      const lessonImage = getStoragePathFromUrl(lesson.thumbnail_url);
      if (lessonImage) filesToDelete.push(lessonImage);
    }
  }

  const uniqueFiles = [...new Set(filesToDelete)];

  if (uniqueFiles.length) {
    const { error: storageError } = await supabase.storage
      .from("images")
      .remove(uniqueFiles);

    if (storageError) {
      console.error("Storage delete error:", storageError.message);
    }
  }

  const { error } = await supabase.from("courses").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/admin");

  return NextResponse.json({ success: true });
}