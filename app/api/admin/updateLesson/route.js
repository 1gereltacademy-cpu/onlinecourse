
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req) {
  try {
    // 1. Нэвтрэлтийг шалгах
    const cookieStore = await cookies();
    const token = cookieStore.get("sb-access-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Нэвтэрч орно уу." },
        { status: 401 }
      );
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: authData, error: authError } =
      await authClient.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Нэвтрэлт хүчингүй байна." },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServer();

    // 2. Админ эрх шалгах
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Админ эрх шаардлагатай." },
        { status: 403 }
      );
    }

    // 3. Хүсэлтийн мэдээлэл авах
    const body = await req.json();

    const {
      id,
      title,
      video_url,
      video_path,
      duration,
      position,
      thumbnail_url,
      is_preview,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Lesson ID байхгүй байна." },
        { status: 400 }
      );
    }

    // 4. Хуучин хичээлийн мэдээлэл авах
    const { data: oldLesson, error: oldLessonError } = await supabase
      .from("lessons")
      .select("id, video_path, video_url")
      .eq("id", id)
      .maybeSingle();

    if (oldLessonError) {
      console.error("Read lesson error:", oldLessonError);

      return NextResponse.json(
        { error: oldLessonError.message },
        { status: 400 }
      );
    }

    if (!oldLesson) {
      return NextResponse.json(
        { error: "Lesson олдсонгүй." },
        { status: 404 }
      );
    }

    // 5. Шинэчлэх мэдээлэл бэлтгэх
    const updates = {};

    if (title !== undefined) {
      updates.title = title;
    }

    if (duration !== undefined) {
      updates.duration = duration;
    }

    if (position !== undefined) {
      const parsedPosition = Number(position);

      if (!Number.isFinite(parsedPosition) || parsedPosition < 0) {
        return NextResponse.json(
          { error: "Lesson-ийн дараалал буруу байна." },
          { status: 400 }
        );
      }

      updates.position = parsedPosition;
    }

    if (thumbnail_url !== undefined) {
      updates.thumbnail_url = thumbnail_url || null;
    }

    if (is_preview !== undefined) {
      updates.is_preview = is_preview;
    }

    const hasVideoPath = Object.prototype.hasOwnProperty.call(
      body,
      "video_path"
    );

    const hasVideoUrl = Object.prototype.hasOwnProperty.call(
      body,
      "video_url"
    );

    // Storage видео сонгосон бол URL-ийг null болгоно
    if (hasVideoPath) {
      const newPath =
        typeof video_path === "string" ? video_path.trim() : "";

      updates.video_path = newPath || null;

      if (newPath) {
        updates.video_url = null;
      } else if (hasVideoUrl) {
        const newUrl =
          typeof video_url === "string" ? video_url.trim() : "";

        updates.video_url = newUrl || null;
      }
    } else if (hasVideoUrl) {
      const newUrl =
        typeof video_url === "string" ? video_url.trim() : "";

      updates.video_url = newUrl || null;

      // Гадаад URL ашиглах бол Storage замыг цэвэрлэнэ
      if (newUrl) {
        updates.video_path = null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Өөрчлөх мэдээлэл алга." },
        { status: 400 }
      );
    }

    // 6. Эхлээд өгөгдлийн санг шинэчлэх
    const { data: updatedLesson, error: updateError } = await supabase
      .from("lessons")
      .update(updates)
      .eq("id", id)
      .select("id, video_path, video_url")
      .single();

    if (updateError) {
      console.error("Update lesson error:", updateError);

      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    // 7. Хуучин видео ашиглагдаагүй бол Storage-оос устгах
    const oldPath = oldLesson.video_path;
    const newPath = updatedLesson.video_path;

    let oldVideoDeleted = false;
    let deleteMessage = "Хуучин видео устгах шаардлагагүй.";

    if (oldPath && oldPath !== newPath) {
      const { data: otherLessons, error: referenceError } = await supabase
        .from("lessons")
        .select("id")
        .eq("video_path", oldPath)
        .neq("id", id)
        .limit(1);

      if (referenceError) {
        console.error("Old video reference check error:", referenceError);

        deleteMessage =
          "Хуучин видео ашиглагдаж байгаа эсэхийг шалгахад алдаа гарлаа.";
      } else if (otherLessons && otherLessons.length > 0) {
        deleteMessage =
          "Хуучин видеог өөр хичээл ашиглаж байгаа тул устгасангүй.";
      } else {
        const { error: deleteError } = await supabase.storage
          .from("videos-private")
          .remove([oldPath]);

        if (deleteError) {
          console.error("Old video delete error:", deleteError);

          deleteMessage = `Storage устгалын алдаа: ${deleteError.message}`;
        } else {
          oldVideoDeleted = true;
          deleteMessage = "Хуучин видео Storage-оос устгагдлаа.";
        }
      }
    } else if (!oldPath) {
      deleteMessage = "Өмнөх хичээлд video_path байгаагүй.";
    } else {
      deleteMessage = "Шинэ видео зам хуучин замтай ижил байна.";
    }

    // 8. Үр дүн буцаах
    return NextResponse.json({
      success: true,
      message: "Хичээл амжилттай шинэчлэгдлээ.",
      oldPath,
      newPath,
      oldVideoDeleted,
      deleteMessage,
    });
  } catch (error) {
    console.error("Update lesson API error:", error);

    return NextResponse.json(
      { error: error.message || "Серверийн алдаа гарлаа." },
      { status: 500 }
    );
  }
}
