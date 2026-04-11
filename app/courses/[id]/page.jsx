export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";
import PaymentRequestButton from "@/components/PaymentRequestButton";
import LessonVideoPlayer from "@/components/LessonVideoPlayer";
import HLSPlayer from "@/components/HLSPlayer";

function formatPrice(value) {
  return Number(value || 0).toLocaleString() + "₮";
}

export default async function CourseDetailPage({ params, searchParams }) {
  const supabase = getSupabaseServer();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", params.id)
    .order("position", { ascending: true });

  if (!course) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-300">
            Course олдсонгүй.
          </div>
        </div>
      </main>
    );
  }

  let currentUserId = null;
  let currentUserEmail = null;
  let currentUserRole = "user";

  const cookieStore = cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (accessToken) {
    const browserLikeClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    const {
      data: { user },
    } = await browserLikeClient.auth.getUser();

    currentUserId = user?.id || null;
    currentUserEmail = user?.email || null;

    if (currentUserId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUserId)
        .single();

      currentUserRole = profile?.role || "user";
    }
  }

  let paidEnrollment = null;

  if (currentUserId) {
    const { data } = await supabase
      .from("enrollments")
      .select("*")
      .eq("course_id", params.id)
      .eq("user_id", currentUserId)
      .in("payment_status", ["paid", "approved"])
      .maybeSingle();

    paidEnrollment = data;
  }

  const isAdmin = currentUserRole === "admin";
  const isUnlockedCourse = isAdmin || !!paidEnrollment;

  const selectedLessonId =
    searchParams?.lesson || (lessons?.length ? lessons[0].id : null);

  const selectedLesson =
    lessons?.find((lesson) => lesson.id === selectedLessonId) || null;

  const canViewLesson = selectedLesson
    ? isAdmin || selectedLesson.is_preview || !!paidEnrollment
    : false;

  const hasYouTube = !!selectedLesson?.video_url;
  const hasPrivateVideo = !!selectedLesson?.video_path;

  const hasDiscount =
    !!course.discount_price_mnt &&
    !!course.discount_ends_at &&
    new Date(course.discount_ends_at).getTime() > Date.now();

  const activePrice = hasDiscount
    ? course.discount_price_mnt || 0
    : course.price_mnt || 0;

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_24%),linear-gradient(to_bottom,#020617,#0f172a,#020617)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-2 text-sm text-slate-200 transition hover:bg-white/[0.09]"
        >
          ← Буцах
        </Link>

        <div className="mt-5 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl">
              <div className="relative">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="h-56 w-full object-cover sm:h-72 md:h-[24rem]"
                  />
                ) : (
                  <div className="flex h-56 w-full items-center justify-center bg-slate-900 text-slate-500 sm:h-72 md:h-[24rem]">
                    Cover image
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 md:p-8">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur">
                      Онлайн сургалт
                    </span>
                    {course.category ? (
                      <span className="rounded-full border border-indigo-400/20 bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-100 backdrop-blur">
                        {course.category}
                      </span>
                    ) : null}
                    {course.level ? (
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur">
                        {course.level}
                      </span>
                    ) : null}
                  </div>

                  <h1 className="mt-4 max-w-4xl text-2xl font-bold leading-tight sm:text-3xl md:text-4xl xl:text-5xl">
                    {course.title}
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                    {course.description || "Энэ сургалтын дэлгэрэнгүй тайлбар удахгүй нэмэгдэнэ."}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {hasDiscount ? (
                      <>
                        <span className="rounded-full border border-rose-400/20 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-100">
                          {formatPrice(course.discount_price_mnt)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-300 line-through">
                          {formatPrice(course.price_mnt)}
                        </span>
                        <span className="rounded-full border border-yellow-400/20 bg-yellow-400/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-yellow-100">
                          Хямдралтай
                        </span>
                      </>
                    ) : (
                      <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100">
                        {formatPrice(course.price_mnt)}
                      </span>
                    )}

                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/15 px-4 py-2 text-xs font-medium text-emerald-100">
                      {lessons?.length || 0} lesson
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/[0.05] p-4 shadow-xl backdrop-blur-xl sm:p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex items-center rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
                    Сонгосон хичээл
                  </div>
                  <h2 className="mt-3 text-xl font-semibold sm:text-2xl">
                    {selectedLesson ? selectedLesson.title : "Lesson сонгоно уу"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Хугацаа: {selectedLesson?.duration || "--:--"}
                  </p>
                </div>

                {selectedLesson ? (
                  canViewLesson ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-200">
                      {selectedLesson.is_preview ? "Preview" : "Unlocked"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-rose-400/20 bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-200">
                      🔒 Premium lesson
                    </span>
                  )
                ) : null}
              </div>

              {selectedLesson ? (
                <div className="mt-5 animate-[fadeIn_.45s_ease]">
                  {selectedLesson.thumbnail_url ? (
                    <img
                      src={selectedLesson.thumbnail_url}
                      alt={selectedLesson.title}
                      className="mb-4 h-44 w-full rounded-3xl object-cover sm:h-56"
                    />
                  ) : null}

                  <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/40 shadow-[0_0_40px_rgba(15,23,42,0.35)]">
                    {canViewLesson ? (
                      hasYouTube ? (
                        <LessonVideoPlayer
                          lessonId={selectedLesson.id}
                          videoUrl={selectedLesson.video_url}
                          userEmail={currentUserEmail}
                        />
                      ) : hasPrivateVideo ? (
                        <HLSPlayer
                          lessonId={selectedLesson.id}
                          videoPath={selectedLesson.video_path}
                          userEmail={currentUserEmail}
                        />
                      ) : (
                        <div className="flex min-h-[220px] items-center justify-center px-6 py-10 text-center text-slate-400">
                          Видео байхгүй байна.
                        </div>
                      )
                    ) : (
                      <div className="flex min-h-[220px] flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.12),transparent_35%)] px-6 py-10 text-center">
                        <div className="rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200">
                          🔒 Нээгдэхгүй байна
                        </div>
                        <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
                          Энэ lesson premium байна. Төлбөр баталгаажсаны дараа шууд
                          үзэх боломжтой болно.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center text-slate-400">
                  Lesson алга байна.
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-white/[0.05] p-4 shadow-xl backdrop-blur-xl sm:p-5 xl:sticky xl:top-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold sm:text-2xl">Хичээлүүд</h2>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-300">
                  {lessons?.length || 0}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {lessons?.length ? (
                  lessons.map((lesson, index) => {
                    const isActive = lesson.id === selectedLessonId;
                    const isLocked = !isAdmin && !lesson.is_preview && !paidEnrollment;

                    return (
                      <Link
                        key={lesson.id}
                        href={`/courses/${params.id}?lesson=${lesson.id}`}
                        className={`group block rounded-3xl border p-4 transition duration-300 ${
                          isActive
                            ? "border-indigo-400/35 bg-indigo-500/15 shadow-[0_0_24px_rgba(99,102,241,0.16)]"
                            : "border-white/10 bg-slate-900/55 hover:bg-slate-800/90"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                              Lesson {index + 1}
                            </div>
                            <div className="mt-2 line-clamp-2 font-semibold text-white">
                              {lesson.title}
                            </div>
                            <div className="mt-2 text-sm text-slate-400">
                              {lesson.duration || "--:--"}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {isLocked ? (
                              <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200">
                                🔒 Premium
                              </span>
                            ) : (
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                                lesson.is_preview
                                  ? "border-sky-400/20 bg-sky-500/15 text-sky-200"
                                  : "border-emerald-400/20 bg-emerald-500/15 text-emerald-200 animate-pulse"
                              }`}>
                                {lesson.is_preview ? "Preview" : "Unlocked"}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-slate-400">
                    Энэ course дээр lesson алга байна.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-indigo-500/10 via-white/[0.04] to-emerald-500/10 p-4 shadow-xl backdrop-blur-xl sm:p-5">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                Төлбөрийн мэдээлэл
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-semibold">Сургалтын төлбөр</h3>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {hasDiscount ? (
                    <>
                      <div className="text-3xl font-bold text-white">
                        {formatPrice(course.discount_price_mnt)}
                      </div>
                      <div className="text-sm text-slate-400 line-through">
                        {formatPrice(course.price_mnt)}
                      </div>
                    </>
                  ) : (
                    <div className="text-3xl font-bold text-white">
                      {formatPrice(course.price_mnt)}
                    </div>
                  )}
                </div>
              </div>

              {isUnlockedCourse ? (
                <div className="mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-500/15 px-4 py-4 text-sm text-emerald-100">
                  ✅ Энэ course танд нээгдсэн байна.
                </div>
              ) : (
                <>
                  <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="space-y-2 text-sm text-slate-300">
                      <div>
                        <span className="text-slate-400">Банк:</span>{" "}
                        {course.bank_name || "-"}
                      </div>
                      <div>
                        <span className="text-slate-400">Данс эзэмшигч:</span>{" "}
                        {course.bank_account_name || "-"}
                      </div>
                      <div>
                        <span className="text-slate-400">Данс:</span>{" "}
                        {course.bank_account_number || "-"}
                      </div>
                    </div>

                    {course.payment_qr_url ? (
                      <div className="mt-4 rounded-3xl border border-white/10 bg-white p-3">
                        <img
                          src={course.payment_qr_url}
                          alt="payment qr"
                          className="mx-auto h-40 w-40 rounded-2xl object-cover sm:h-52 sm:w-52"
                        />
                      </div>
                    ) : (
                      <div className="mt-4 rounded-3xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
                        Энд QPay QR, банкны QR эсвэл дансны мэдээлэл байршуул.
                      </div>
                    )}
                  </div>

                  <div className="mt-5">
                    <PaymentRequestButton
                      userId={currentUserId}
                      courseId={course.id}
                      amountMnt={activePrice}
                    />
                  </div>
                </>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
