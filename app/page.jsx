"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const HOME_COURSE_LIMIT = 6;

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let mounted = true;

    async function loadData(currentUser = null) {
      try {
        let authUser = currentUser;

        if (!authUser) {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError) {
            console.error("getUser error:", userError.message);
          }

          authUser = user || null;
        }

        if (!mounted) return;
        setUser(authUser);

        const profilePromise = authUser
          ? supabase
              .from("profiles")
              .select("full_name, role")
              .eq("id", authUser.id)
              .single()
          : Promise.resolve({ data: null, error: null });

        const coursesPromise = supabase
              .from("courses")
              .select("id, title, description, price_mnt, thumbnail_url, position")
              .eq("is_published", true)
              .order("position", { ascending: true })
              .order("created_at", { ascending: false })
              .limit(HOME_COURSE_LIMIT);

        const [
          { data: profileData, error: profileError },
          { data: courseData, error: courseError },
        ] = await Promise.all([profilePromise, coursesPromise]);

        if (profileError) {
          console.error("profile fetch error:", profileError.message);
        }

        if (courseError) {
          console.error("courses fetch error:", courseError.message);
        }

        if (!mounted) return;

        setProfile(profileData || null);
        setRole(profileData?.role || null);
        setCourses(courseData || []);
      } catch (error) {
        console.error("loadData error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setRole(null);
        setCourses([]);
        window.location.reload();
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        loadData(session?.user || null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const displayName =
    profile?.full_name?.trim() ||
    (profile === null ? "" : user?.email?.split("@")[0]) ||
    "Хэрэглэгч";

  async function handleLogout() {
    try {
      const supabase = getSupabaseBrowser();

      setUser(null);
      setProfile(null);
      setRole(null);

      await supabase.auth.signOut();

      document.cookie =
        "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      window.location.reload();
    } catch (error) {
      console.error("logout error:", error);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden py-14 sm:py-16 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.24),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_30%),linear-gradient(to_bottom,#020617,#0f172a,#020617)]" />

        <div className="absolute inset-0">
          <img
            src="/hero-bg.jpg"
            alt="Hero background"
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-slate-950/70" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-5xl text-center">
            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200 sm:px-4 sm:text-sm">
              🚀 Gerelt Academy
            </span>

            <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Онлайн сургалтын
              <span className="block bg-gradient-to-r from-indigo-300 to-emerald-300 bg-clip-text text-transparent">
                Орчин үеийн платформ
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:mt-6 sm:text-base md:text-lg">
              Шинэ ур чадвар эзэмшиж, мэдлэгээ дараагийн түвшинд хүргэ
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">

              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-center font-medium text-emerald-300 transition hover:bg-emerald-400/15 sm:px-6"
                  >
                    {displayName || "Профайл"}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-3 text-center font-medium text-rose-300 transition hover:bg-rose-400/15 sm:px-6"
                  >
                    Гарах
                  </button>

                  {role === "admin" ? (
                    <Link
                      href="/admin"
                      className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-center font-medium text-amber-300 transition hover:bg-amber-400/15 sm:px-6"
                    >
                      Admin
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-2xl border border-white/20 px-5 py-3 text-center font-medium transition hover:bg-white/10 sm:px-6"
                  >
                    Нэвтрэх
                  </Link>

                  <Link
                    href="/register"
                    className="rounded-2xl border border-indigo-400/30 bg-indigo-400/10 px-5 py-3 text-center font-medium text-indigo-300 transition hover:bg-indigo-400/15 sm:px-6"
                  >
                    Бүртгүүлэх
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        id="courses"
        className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16"
      >
        <div className="mb-8 text-center">
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl md:text-4xl">
            Сургалтууд
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:gap-6">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]"
              >
                <div className="grid lg:grid-cols-[1fr_0.95fr]">
                  <div className="min-h-[220px] animate-pulse bg-white/5 sm:min-h-[260px] lg:min-h-[320px]" />
                  <div className="p-5 sm:p-6">
                    <div className="h-6 w-28 animate-pulse rounded-full bg-white/5" />
                    <div className="mt-4 h-10 w-2/3 animate-pulse rounded-xl bg-white/5" />
                    <div className="mt-4 space-y-3">
                      <div className="h-4 animate-pulse rounded bg-white/5" />
                      <div className="h-4 animate-pulse rounded bg-white/5" />
                      <div className="h-4 w-4/5 animate-pulse rounded bg-white/5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="space-y-5 sm:space-y-6">
            {courses.map((course, index) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group block overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] transition hover:border-indigo-400/30 hover:bg-white/[0.06]"
              >
                <div className="grid lg:grid-cols-[1fr_0.95fr]">
                  <div className="relative min-h-[220px] overflow-hidden sm:min-h-[260px] lg:min-h-[320px]">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full min-h-[220px] items-center justify-center bg-slate-800 text-slate-500 sm:min-h-[260px] lg:min-h-[320px]">
                        Cover image
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                    <div className="absolute left-4 top-4 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                      Course {index + 1}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between p-5 sm:p-6 lg:p-7">
                    <div>
                      <div className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs text-indigo-300">
                        Premium course
                      </div>

                      <h3 className="mt-4 line-clamp-2 text-2xl font-bold leading-tight sm:text-3xl">
                        {course.title}
                      </h3>

                      <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-300 sm:line-clamp-4 sm:text-base">
                        {course.description || "Тайлбар байхгүй"}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <div className="text-sm text-slate-400">Үнэ</div>
                        <div className="mt-1 text-2xl font-bold text-indigo-400 sm:text-3xl">
                          {Number(course.price_mnt || 0).toLocaleString()}₮
                        </div>
                      </div>

                      <div className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-900">
                        Course руу
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400 sm:p-8 sm:text-base">
            Одоогоор нийтлэгдсэн сургалт алга байна.
          </div>
        )}
      </section>

      <section className="px-4 py-16 text-center sm:px-6 sm:py-20">
        <h2 className="text-2xl font-bold sm:text-3xl">
          Өнөөдөр эхлээд өөрийгөө өөрчил
        </h2>

        <p className="mt-4 text-sm text-slate-400 sm:text-base">
          Амжилттай хүмүүс сурахаа хэзээ ч зогсоодоггүй
        </p>

        <Link
          href="/contact"
          className="mt-6 inline-block rounded-2xl bg-indigo-500 px-6 py-3 font-medium transition hover:opacity-90 sm:px-8"
        >
          Холбоо барих
        </Link>
      </section>
    </main>
  );
}
