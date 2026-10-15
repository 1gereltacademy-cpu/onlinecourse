
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");
    const lessonId = searchParams.get("lessonId");

    if (!path || !lessonId) {
      return NextResponse.json(
        { error: "path эсвэл lessonId байхгүй" },
        { status: 400 }
      );
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Хичээлийг олно
    const { data: lesson, error: lessonError } = await serviceClient
      .from("lessons")
      .select("id, course_id, is_preview, video_path")
      .eq("id", lessonId)
      .maybeSingle();

    if (lessonError) {
      console.error("Video lesson lookup error:", lessonError.message);

      return NextResponse.json(
        { error: "Хичээл шалгахад алдаа гарлаа" },
        { status: 500 }
      );
    }

    if (!lesson) {
      return NextResponse.json(
        { error: "Хичээл олдсонгүй" },
        { status: 404 }
      );
    }

    // URL-д дур мэдэн өөр файлын зам өгөхөөс хамгаална
    if (!lesson.video_path || lesson.video_path !== path) {
      return NextResponse.json(
        { error: "Видео зам буруу байна" },
        { status: 403 }
      );
    }

    // Preview биш видеонд хэрэглэгчийн эрх шалгана
    if (!lesson.is_preview) {
      const token = req.cookies.get("sb-access-token")?.value;

      if (!token) {
        return NextResponse.json(
          { error: "Нэвтэрнэ үү" },
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
          { error: "Нэвтрэлт хүчингүй байна" },
          { status: 401 }
        );
      }

      const { data: profile, error: profileError } = await serviceClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile lookup error:", profileError.message);

        return NextResponse.json(
          { error: "Хэрэглэгчийн эрх шалгахад алдаа гарлаа" },
          { status: 500 }
        );
      }

      let hasAccess = profile?.role === "admin";

      if (!hasAccess) {
        const { data: enrollment, error: enrollmentError } =
          await serviceClient
            .from("enrollments")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", lesson.course_id)
            .in("payment_status", ["paid", "approved"])
            .maybeSingle();

        if (enrollmentError) {
          console.error(
            "Enrollment lookup error:",
            enrollmentError.message
          );

          return NextResponse.json(
            { error: "Сургалтын эрх шалгахад алдаа гарлаа" },
            { status: 500 }
          );
        }

        hasAccess = Boolean(enrollment);
      }

      if (!hasAccess) {
        return NextResponse.json(
          { error: "Энэ видеог үзэх эрхгүй байна" },
          { status: 403 }
        );
      }
    }

    // Хугацаатай signed URL үүсгэнэ
    const { data: signed, error: signedError } =
      await serviceClient.storage
        .from("videos-private")
        .createSignedUrl(path, 60 * 10);

    if (signedError || !signed?.signedUrl) {
      console.error(
        "Create signed URL error:",
        signedError?.message
      );

      return NextResponse.json(
        { error: "Видео холбоос үүсгэж чадсангүй" },
        { status: 500 }
      );
    }

    // Browser-оос ирсэн Range хүсэлтийг Storage руу дамжуулна
    const range = req.headers.get("range");
    const upstreamHeaders = new Headers();

    if (range) {
      upstreamHeaders.set("Range", range);
    }

    const upstream = await fetch(signed.signedUrl, {
      method: "GET",
      headers: upstreamHeaders,
      cache: "no-store",
      redirect: "follow",
    });

    
if (!upstream.ok && upstream.status !== 206) {
  const details = await upstream.clone().text().catch(() => "");

  console.error("Storage video response:", {
    status: upstream.status,
    details: details.slice(0, 1000),
    lessonId,
  });

  return NextResponse.json(
    { error: "Видео файлыг уншиж чадсангүй" },
    { status: 502 }
  );
}


    // Видео тоглуулагчид шаардлагатай толгой мэдээллүүд
    const headers = new Headers({
      "Content-Type":
        upstream.headers.get("content-type") || "video/mp4",
      "Accept-Ranges":
        upstream.headers.get("accept-ranges") || "bytes",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });

    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");

    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    if (contentRange) {
      headers.set("Content-Range", contentRange);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    console.error("Video stream error:", error);

    return NextResponse.json(
      { error: "Видео дамжуулах үед серверийн алдаа гарлаа" },
      { status: 500 }
    );
  }
}
