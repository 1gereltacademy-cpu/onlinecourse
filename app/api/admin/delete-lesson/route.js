import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

function parseStorageUrl(value) {
  if (!value || typeof value !== "string") return null;

  let clean = value.trim();
  if (!clean) return null;

  if (clean.includes("?")) {
    clean = clean.split("?")[0];
  }

  const markers = [
    "/storage/v1/object/public/",
    "/storage/v1/object/sign/",
    "/storage/v1/object/authenticated/",
    "/storage/v1/object/",
  ];

  for (const marker of markers) {
    if (clean.includes(marker)) {
      let rest = clean.split(marker)[1];
      if (!rest) return null;

      if (rest.startsWith("public/")) rest = rest.replace("public/", "");
      if (rest.startsWith("sign/")) rest = rest.replace("sign/", "");
      if (rest.startsWith("authenticated/")) rest = rest.replace("authenticated/", "");

      const parts = rest.split("/");
      const bucket = parts.shift();
      const path = parts.join("/");

      if (!bucket || !path) return null;
      return { bucket, path };
    }
  }

  if (clean.includes("/")) {
    const parts = clean.replace(/^\/+/, "").split("/");
    const bucket = parts.shift();
    const path = parts.join("/");
    if (!bucket || !path) return null;
    return { bucket, path };
  }

  return null;
}

async function deleteParsedFiles(supabase, entries) {
  const grouped = {};

  for (const entry of entries) {
    if (!entry?.bucket || !entry?.path) continue;
    if (!grouped[entry.bucket]) grouped[entry.bucket] = new Set();
    grouped[entry.bucket].add(entry.path);
  }

  for (const [bucket, pathSet] of Object.entries(grouped)) {
    const paths = Array.from(pathSet);
    if (!paths.length) continue;

    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      console.error(`Storage delete error in bucket "${bucket}":`, error.message);
    }
  }
}

export async function POST(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Lesson id байхгүй" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: lesson, error: findError } = await supabase
      .from("lessons")
      .select("id, thumbnail_url, video_path")
      .eq("id", id)
      .single();

    if (findError || !lesson) {
      return NextResponse.json({ error: "Lesson олдсонгүй" }, { status: 404 });
    }

    const filesToDelete = [];

    const thumbInfo = parseStorageUrl(lesson.thumbnail_url);
    if (thumbInfo) filesToDelete.push(thumbInfo);

    if (lesson.video_path) {
      filesToDelete.push({
        bucket: "videos-private",
        path: lesson.video_path,
      });
    }

    const { error: deleteError } = await supabase
      .from("lessons")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || "Lesson устгахад алдаа гарлаа" },
        { status: 500 }
      );
    }

    await deleteParsedFiles(supabase, filesToDelete);

    return NextResponse.json({
      success: true,
      message: "Lesson, зураг, видео амжилттай устлаа",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Серверийн алдаа гарлаа" },
      { status: 500 }
    );
  }
}
