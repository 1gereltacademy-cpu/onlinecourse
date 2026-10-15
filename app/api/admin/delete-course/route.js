
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";

function parseStorageUrl(value) {
  if (!value || typeof value !== "string") return null;

  try {
    const url = new URL(value);
    const marker = "/storage/v1/object/";
    const index = url.pathname.indexOf(marker);

    if (index === -1) return null;

    let rest = url.pathname.slice(index + marker.length);

    for (const prefix of ["public/", "sign/", "authenticated/"]) {
      if (rest.startsWith(prefix)) {
        rest = rest.slice(prefix.length);
        break;
      }
    }

    const slashIndex = rest.indexOf("/");
    if (slashIndex === -1) return null;

    const bucket = rest.slice(0, slashIndex);
    const path = decodeURIComponent(rest.slice(slashIndex + 1));

    if (!bucket || !path) return null;

    return { bucket, path };
  } catch {
    return null;
  }
}

async function deleteStorageFiles(supabase, entries) {
  const grouped = new Map();

  for (const entry of entries) {
    if (!entry?.bucket || !entry?.path) continue;

    const key = `${entry.bucket}/${entry.path}`;
    grouped.set(key, entry);
  }

  const buckets = new Map();

  for (const entry of grouped.values()) {
    if (!buckets.has(entry.bucket)) {
      buckets.set(entry.bucket, []);
    }

    buckets.get(entry.bucket).push(entry.path);
  }

  const errors = [];

  for (const [bucket, paths] of buckets.entries()) {
    // Storage remove API-д нэг хүсэлтээр хэт олон файл явуулахгүй
    for (let i = 0; i < paths.length; i += 100) {
      const batch = paths.slice(i, i + 100);

      const { error } = await supabase.storage
        .from(bucket)
        .remove(batch);

      if (error) {
        errors.push({
          bucket,
          paths: batch,
          message: error.message,
        });
      }
    }
  }

  return errors;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json(
        { error: "Курсын ID шаардлагатай." },
        { status: 400 }
      );
    }

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

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү." },
        { status: 401 }
      );
    }

    // 2. Админ эрхийг шалгах
    const supabase = getSupabaseServer();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        {
          error: "Хэрэглэгчийн эрхийг шалгаж чадсангүй.",
          details: profileError.message,
        },
        { status: 500 }
      );
    }

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Зөвхөн админ курс устгах эрхтэй." },
        { status: 403 }
      );
    }

    // 3. Курсын мэдээлэл авах
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, thumbnail_url, payment_qr_url")
      .eq("id", id)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json(
        {
          error: "Курсын мэдээлэл авахад алдаа гарлаа.",
          details: courseError.message,
        },
        { status: 500 }
      );
    }

    if (!course) {
      return NextResponse.json(
        { error: "Курс олдсонгүй." },
        { status: 404 }
      );
    }

    // 4. Төлбөрийн түүхийг шалгах
    const { data: paymentOrders, error: paymentError } = await supabase
      .from("payment_orders")
      .select("id")
      .eq("course_id", id)
      .limit(1);

    if (paymentError) {
      return NextResponse.json(
        {
          error: "Курсын төлбөрийн түүхийг шалгаж чадсангүй.",
          details: paymentError.message,
        },
        { status: 500 }
      );
    }

    if (paymentOrders?.length > 0) {
      return NextResponse.json(
        {
          error:
            "Энэ курс төлбөрийн түүхтэй тул шууд устгах боломжгүй.",
        },
        { status: 409 }
      );
    }

    // 5. Хичээлүүдийн video_path болон video_url-ийг авах
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, video_path, video_url, thumbnail_url")
      .eq("course_id", id);

    if (lessonsError) {
      return NextResponse.json(
        {
          error: "Хичээлүүдийн мэдээлэл авахад алдаа гарлаа.",
          details: lessonsError.message,
        },
        { status: 500 }
      );
    }

    const lessonIds = (lessons || []).map((lesson) => lesson.id);

    // 6. Storage файлуудын жагсаалтыг бэлтгэх
    const filesToDelete = [];

    const courseThumbnail = parseStorageUrl(course.thumbnail_url);
    if (courseThumbnail) filesToDelete.push(courseThumbnail);

    const paymentQR = parseStorageUrl(course.payment_qr_url);
    if (paymentQR) filesToDelete.push(paymentQR);

    for (const lesson of lessons || []) {
      // Хуучин зураг URL-аар хадгалагдсан бол
      const thumbnail = parseStorageUrl(lesson.thumbnail_url);
      if (thumbnail) filesToDelete.push(thumbnail);

      // Видео video_path-аар хадгалагдсан бол
      if (lesson.video_path) {
        filesToDelete.push({
          bucket: "videos-private",
          path: lesson.video_path,
        });
      }

      // Өмнөх хувилбар URL-аар хадгалсан видео бол
      const video = parseStorageUrl(lesson.video_url);
      if (video) filesToDelete.push(video);
    }

    // 7. Өөр хичээлүүд эдгээр video_path-уудыг ашиглаж байгаа эсэхийг шалгах
    const videoPaths = [
      ...new Set(
        (lessons || [])
          .map((lesson) => lesson.video_path)
          .filter(Boolean)
      ),
    ];

    const protectedPaths = new Set();

    for (const videoPath of videoPaths) {
      const { data: otherLessons, error: referenceError } = await supabase
        .from("lessons")
        .select("id")
        .eq("video_path", videoPath)
        .neq("course_id", id)
        .limit(1);

      if (referenceError) {
        return NextResponse.json(
          {
            error: "Видео өөр хичээлд ашиглагдаж байгаа эсэхийг шалгаж чадсангүй.",
            details: referenceError.message,
          },
          { status: 500 }
        );
      }

      if (otherLessons?.length > 0) {
        protectedPaths.add(`videos-private/${videoPath}`);
      }
    }

    const safeFilesToDelete = filesToDelete.filter(
      (file) => !protectedPaths.has(`${file.bucket}/${file.path}`)
    );

    // 8. Хичээлүүдийг устгах
    const { error: deleteLessonsError } = await supabase
      .from("lessons")
      .delete()
      .eq("course_id", id);

    if (deleteLessonsError) {
      return NextResponse.json(
        {
          error: "Курсын хичээлүүдийг устгаж чадсангүй.",
          details: deleteLessonsError.message,
        },
        { status: 500 }
      );
    }

    // 9. Курсыг устгах
    const { error: deleteCourseError } = await supabase
      .from("courses")
      .delete()
      .eq("id", id);

    if (deleteCourseError) {
      return NextResponse.json(
        {
          error: "Курсыг устгаж чадсангүй.",
          details: deleteCourseError.message,
          note: "Хичээлүүд устсан байж болзошгүй. Дахин шалгана уу.",
        },
        { status: 500 }
      );
    }

    // 10. Холбогдох Storage файлуудыг устгах
    const storageErrors = await deleteStorageFiles(
      supabase,
      safeFilesToDelete
    );

    return NextResponse.json({
      success: true,
      message:
        storageErrors.length > 0
          ? "Курс болон хичээлүүд устсан. Зарим Storage файл үлдсэн."
          : "Курс, хичээлүүд болон холбогдох Storage файлууд устлаа.",
      deletedLessonCount: lessonIds.length,
      storageFilesRequested: safeFilesToDelete.length,
      protectedVideoCount: protectedPaths.size,
      storageErrors,
    });
  } catch (error) {
    console.error("Delete course error:", error);

    return NextResponse.json(
      {
        error: "Курс устгах үед гэнэтийн алдаа гарлаа.",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
