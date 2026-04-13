import { NextResponse } from "next/server";

// 👇 ЭНЭ import замыг өөрийн төслийн helper-т тааруулж солиорой.
// Жишээ нь:
// import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Course id ирээгүй байна" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // 1) course байгаа эсэхийг шалгах
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

    // 2) тухайн course-ийн бүх lesson-ийг авах
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, thumbnail_url")
      .eq("course_id", id);

    if (lessonsError) {
      return NextResponse.json(
        { error: lessonsError.message || "Lesson-уудыг уншихад алдаа гарлаа" },
        { status: 500 }
      );
    }

    // 3) lesson-уудыг эхэлж устгах (FK constraint асуудал гарахаас сэргийлнэ)
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

    // 4) course-ийг устгах
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

    // 5) Хэрэв Supabase Storage дээр зураг хадгалдаг бол энд бас устгаж болно.
    //    thumbnail_url дотор bucket path байдаг бол доорх логикийг өөрчилж ашиглаарай.
    //    Одоогоор comment хэлбэрээр үлдээв.

    return NextResponse.json({
      success: true,
      message: "Course болон холбоотой lesson-ууд амжилттай устлаа",
    });
  } catch (error) {
    console.error("delete-course api error:", error);

    return NextResponse.json(
      { error: error.message || "Серверийн алдаа гарлаа" },
      { status: 500 }
    );
  }
}
