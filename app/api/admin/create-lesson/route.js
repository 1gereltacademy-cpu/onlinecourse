
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req) {
  try {
    const body = await req.json();

    // Заавал шаардлагатай талбарууд
    if (!body.course_id || !body.title?.trim()) {
      return NextResponse.json(
        { error: "Курс болон хичээлийн нэрээ оруулна уу." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Нэвтэрч орно уу." },
        { status: 401 }
      );
    }

    // Хэрэглэгчийн нэвтрэлт шалгах
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
    } = await authClient.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү." },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServer();

    // Админ эрх шалгах
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Энэ үйлдлийг зөвхөн админ хийх боломжтой." },
        { status: 403 }
      );
    }

    // Курс байгаа эсэхийг шалгах
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", body.course_id)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Сонгосон курс олдсонгүй." },
        { status: 400 }
      );
    }

    // Зөвхөн зөвшөөрөгдсөн талбаруудыг хадгалах
    const lesson = {
      course_id: body.course_id,
      title: body.title.trim(),
      video_url: body.video_url?.trim() || null,
      duration: body.duration?.trim() || null,
      position: Number(body.position || 1),
      is_preview: Boolean(body.is_preview),
      thumbnail_url: body.thumbnail_url || null,
      video_path: body.video_path || null,
    };

    if (!Number.isFinite(lesson.position) || lesson.position < 1) {
      return NextResponse.json(
        { error: "Хичээлийн дараалал буруу байна." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("lessons")
      .insert(lesson)
      .select()
      .single();

    if (error) {
      console.error("Create lesson database error:", error);

      return NextResponse.json(
        { error: `Хичээл хадгалахад алдаа гарлаа: ${error.message}` },
        { status: 400 }
      );
    }

    revalidatePath("/admin");
    revalidatePath(`/courses/${lesson.course_id}`);

    return NextResponse.json({ lesson: data });
  } catch (error) {
    console.error("Create lesson API error:", error);

    return NextResponse.json(
      { error: "Серверийн алдаа гарлаа." },
      { status: 500 }
    );
  }
}
