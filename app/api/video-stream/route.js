
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message, status) {
  return NextResponse.json({ error: message }, { status });
}

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase server environment variables are missing");
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function handleVideoRequest(req, { headOnly = false } = {}) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");
    const lessonId = searchParams.get("lessonId");

    if (!path || !lessonId) {
      return jsonError("path эсвэл lessonId байхгүй", 400);
    }

    const serviceClient = getServiceClient();

    const { data: lesson, error: lessonError } = await serviceClient
      .from("lessons")
      .select("id, course_id, is_preview, video_path")
      .eq("id", lessonId)
      .maybeSingle();

    if (lessonError) {
      console.error("Video lesson lookup error:", lessonError.message);
      return jsonError("Хичээл шалгахад алдаа гарлаа", 500);
    }

    if (!lesson) {
      return jsonError("Хичээл олдсонгүй", 404);
    }

    if (!lesson.video_path || lesson.video_path !== path) {
      return jsonError("Видео зам буруу байна", 403);
    }

    // Preview биш видеонд хэрэглэгчийн эрх шалгана.
    if (!lesson.is_preview) {
      const token = req.cookies.get("sb-access-token")?.value;

      if (!token) {
        return jsonError("Нэвтэрнэ үү", 401);
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        console.error("Supabase public environment variables are missing");
        return jsonError("Нэвтрэлтийн тохиргоонд алдаа гарлаа", 500);
      }

      const authClient = createClient(supabaseUrl, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const {
        data: { user },
        error: authError,
      } = await authClient.auth.getUser(token);

      if (authError || !user) {
        return jsonError("Нэвтрэлт хүчингүй байна", 401);
      }

      const { data: profile, error: profileError } = await serviceClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile lookup error:", profileError.message);
        return jsonError("Хэрэглэгчийн эрх шалгахад алдаа гарлаа", 500);
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
            .limit(1)
            .maybeSingle();

        if (enrollmentError) {
          console.error("Enrollment lookup error:", enrollmentError.message);
          return jsonError("Сургалтын эрх шалгахад алдаа гарлаа", 500);
        }

        hasAccess = Boolean(enrollment);
      }

      if (!hasAccess) {
        return jsonError("Энэ видеог үзэх эрхгүй байна", 403);
      }
    }

    // Private Storage-оос signed URL үүсгэнэ.
    const { data: signed, error: signedError } =
      await serviceClient.storage
        .from("videos-private")
        .createSignedUrl(path, 600);

    if (signedError || !signed?.signedUrl) {
      console.error("Create signed URL error:", {
        message: signedError?.message,
        status: signedError?.status,
      });

      return jsonError("Видео холбоос үүсгэж чадсангүй", 502);
    }

    let signedUrl;
    let configuredUrl;

    try {
      signedUrl = new URL(signed.signedUrl);
      configuredUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    } catch {
      console.error("Invalid Supabase URL configuration");
      return jsonError("Видео серверийн тохиргоо буруу байна", 500);
    }

    if (
      signedUrl.protocol !== "https:" ||
      signedUrl.hostname !== configuredUrl.hostname
    ) {
      console.error("Signed URL hostname or protocol mismatch");
      return jsonError("Видео хадгалах сервер таарахгүй байна", 502);
    }

    // Оношилгоо: token болон signed URL-г логт хэзээ ч хэвлэхгүй.
    try {
      const token = signedUrl.searchParams.get("token");

      if (!token) {
        console.error("Video signed URL diagnostics:", {
          hasToken: false,
          storageHost: signedUrl.hostname,
        });
      } else {
        const parts = token.split(".");
        const payloadPart = parts[1];

        if (!payloadPart) {
          throw new Error("JWT payload missing");
        }

        const payload = JSON.parse(
          Buffer.from(payloadPart, "base64url").toString("utf8")
        );

        const now = Math.floor(Date.now() / 1000);

        console.log("Video signed URL diagnostics:", {
          issuedAt: payload.iat ?? null,
          expiresAt: payload.exp ?? null,
          serverNow: now,
          secondsUntilExpiry:
            typeof payload.exp === "number" ? payload.exp - now : null,
          storageHost: signedUrl.hostname,
        });
      }
    } catch (error) {
      console.error("Video signed URL diagnostic parse failed:", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Browser-оос ирсэн Range хүсэлтийг дамжуулна.
    const range = req.headers.get("range");
    const upstreamHeaders = new Headers();

    if (range) {
      upstreamHeaders.set("Range", range);
    }

    const upstream = await fetch(signedUrl.toString(), {
      method: headOnly ? "HEAD" : "GET",
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
        method: headOnly ? "HEAD" : "GET",
        range: range || null,
        storageHost: signedUrl.hostname,
      });

      return jsonError("Видео файлыг уншиж чадсангүй", 502);
    }

    const headers = new Headers({
      "Content-Type": upstream.headers.get("content-type") || "video/mp4",
      "Accept-Ranges": upstream.headers.get("accept-ranges") || "bytes",
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

    return new Response(headOnly ? null : upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    console.error("Video stream error:", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return jsonError("Видео дамжуулах үед серверийн алдаа гарлаа", 500);
  }
}

export async function GET(req) {
  return handleVideoRequest(req);
}

export async function HEAD(req) {
  return handleVideoRequest(req, { headOnly: true });
}
