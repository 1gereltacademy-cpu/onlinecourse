import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/supabase-server";

function extractStorageInfo(url) {
  if (!url || typeof url !== "string") return null;

  try {
    const publicMarker = "/storage/v1/object/public/";
    const signedMarker = "/storage/v1/object/sign/";
    const objectMarker = "/storage/v1/object/";

    let clean = url.trim();

    if (clean.includes("?")) {
      clean = clean.split("?")[0];
    }

    let relevantPart = null;

    if (clean.includes(publicMarker)) {
      relevantPart = clean.split(publicMarker)[1];
    } else if (clean.includes(signedMarker)) {
      relevantPart = clean.split(signedMarker)[1];
    } else if (clean.includes(objectMarker)) {
      relevantPart = clean.split(objectMarker)[1];

      if (relevantPart.startsWith("public/")) {
        relevantPart = relevantPart.replace("public/", "");
      }

      if (relevantPart.startsWith("sign/")) {
        relevantPart = relevantPart.replace("sign/", "");
      }
    } else {
      relevantPart = clean.startsWith("/") ? clean.slice(1) : clean;
    }

    if (!relevantPart || !relevantPart.includes("/")) return null;

    const parts = relevantPart.split("/");
    const bucket = parts.shift();
    const filePath = parts.join("/");

    if (!bucket || !filePath) return null;

    return { bucket, filePath };
  } catch (error) {
    console.error("extractStorageInfo error:", error);
    return null;
  }
}

async function deleteStorageFiles(supabase, urls = []) {
  const grouped = {};

  for (const url of urls) {
    const info = extractStorageInfo(url);
    if (!info) continue;

    if (!grouped[info.bucket]) {
      grouped[info.bucket] = [];
    }

    if (!grouped[info.bucket].includes(info.filePath)) {
      grouped[info.bucket].push(info.filePath);
    }
  }

  for (const [bucket, filePaths] of Object.entries(grouped)) {
    if (!filePaths.length) continue;

    const { error } = await supabase.storage.from(bucket).remove(filePaths);

    if (error) {
      console.error(`Storage delete error in bucket "${bucket}":`, error.message);
    }
  }
}

export async function POST(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Lesson id ирээгүй байна" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: lesson, error: findError } = await supabase
      .from("lessons")
      .select("id, thumbnail_url, video_url")
      .eq("id", id)
      .single();

    if (findError || !lesson) {
      return NextResponse.json(
        { error: "Lesson олдсонгүй" },
        { status: 404 }
      );
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

    await deleteStorageFiles(
      supabase,
      [lesson?.thumbnail_url, lesson?.video_url].filter(Boolean)
    );

    return NextResponse.json({
      success: true,
      message: "Lesson, зураг, видео амжилттай устлаа",
    });
  } catch (error) {
    console.error("delete-lesson api error:", error);

    return NextResponse.json(
      { error: error.message || "Серверийн алдаа гарлаа" },
      { status: 500 }
    );
  }
}
