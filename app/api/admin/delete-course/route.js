import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

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
        { error: "Course id ирээгүй байна" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: course, error: courseFindError } = await supabase
      .from("courses")
      .select("id, thumbnail_url")
      .eq("id", id)
      .single();

    if (courseFindError || !course) {
      return NextResponse.json(
        { error: "Course олдсонгүй" },
        { status: 404 }
      );
    }

    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, thumbnail_url, video_url")
      .eq("course_id", id);

    if (lessonsError) {
      return NextResponse.json(
        { error: lessonsError.message || "Lesson-уудыг уншихад алдаа гарлаа" },
        { status: 500 }
      );
    }

    const allFileUrls = [
      course?.thumbnail_url,
      ...(lessons || []).flatMap((lesson) => [
        lesson?.thumbnail_url,
        lesson?.video_url,
      ]),
    ].filter(Boolean);

    const lessonIds = (lessons || []).map((lesson) => lesson.id);

    if (lessonIds.length > 0) {
      const { error: deleteLessonsError } = await supabase
        .from("lessons")
        .delete()
        .in("id", lessonIds);

      if (deleteLessonsError) {
        return NextResponse.json(
          { error: deleteLessonsError.message || "Lesson устгахад алдаа гарлаа" },
          { status: 500 }
        );
      }
    }

    const { error: deleteCourseError } = await supabase
      .from("courses")
      .delete()
      .eq("id", id);

    if (deleteCourseError) {
      return NextResponse.json(
        { error: deleteCourseError.message || "Course устгахад алдаа гарлаа" },
        { status: 500 }
      );
    }

    await deleteStorageFiles(supabase, allFileUrls);

    return NextResponse.json({
      success: true,
      message: "Course, lesson, зураг, видео амжилттай устлаа",
    });
  } catch (error) {
    console.error("delete-course api error:", error);

    return NextResponse.json(
      { error: error.message || "Серверийн алдаа гарлаа" },
      { status: 500 }
    );
  }
}
