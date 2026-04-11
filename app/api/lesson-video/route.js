
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json({ error: "lessonId байхгүй" }, { status: 400 });
    }

    const token = req.cookies.get("sb-access-token")?.value;

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: lesson, error: lessonError } = await serviceClient
      .from("lessons")
      .select("id, course_id, is_preview, video_url, video_path")
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: "Lesson олдсонгүй" }, { status: 404 });
    }

    // YouTube байвал signed url хэрэггүй
    if (lesson.video_url && !lesson.video_path) {
      return NextResponse.json({
        success: true,
        signedUrl: "",
        kind: "youtube",
        videoUrl: lesson.video_url,
      });
    }

    // Preview lesson бол loginгүй signed url өгч болно
    if (lesson.is_preview) {
      const { data, error } = await serviceClient.storage
        .from("videos-private")
        .createSignedUrl(lesson.video_path, 60 * 10);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        kind: "file",
        signedUrl: data.signedUrl,
      });
    }

    if (!token) {
      return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
    }

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
    } = await anonClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
    }

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    let hasAccess = isAdmin;

    if (!hasAccess) {
      const { data: enrollment } = await serviceClient
        .from("enrollments")
        .select("id, payment_status")
        .eq("user_id", user.id)
        .eq("course_id", lesson.course_id)
        .eq("payment_status", "paid")
        .single();

      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Энэ видео locked байна" }, { status: 403 });
    }

    const { data, error } = await serviceClient.storage
      .from("videos-private")
      .createSignedUrl(lesson.video_path, 60 * 10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      kind: "file",
      signedUrl: data.signedUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
