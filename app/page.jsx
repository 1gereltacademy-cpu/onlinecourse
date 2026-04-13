"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

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

        if (authUser) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", authUser.id)
            .single();

          if (profileError) {
            console.error("profile fetch error:", profileError.message);
          }

          if (!mounted) return;
          setProfile(profileData || null);
          setRole(profileData?.role || null);
        } else {
          setProfile(null);
          setRole(null);
        }

        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("*")
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (courseError) {
          console.error("courses fetch error:", courseError.message);
        }

        if (!mounted) return;
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
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_30%),linear-gradient(to_bottom,#020617,#0f172a,#020617)]" />

        <div className="absolute inset-0">
          <img
            src="/hero-bg.jpg"
            alt="Hero background"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/55" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm text-slate-200">
              🚀 Элсэлт явагдаж байна
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Онлайн сургалтын
              <span className="block text-indigo-400">
                Орчин үеийн платформ
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-slate-300 md:text-lg">
              Видео хичээл + бодит даалгавар + өөрийн хурдаар суралцах боломж.
              Шинэ ур чадвар эзэмшиж, өөрийгөө дараагийн түвшинд хүргээрэй.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#courses"
                className="rounded-2xl border border-white/20 px-6 py-3 font-medium transition hover:bg-white/10"
              >
                Сургалтууд
              </a>

              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-6 py-3 font-medium text-emerald-300 transition hover:bg-emerald-400/15"
                  >
                    {displayName}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-6 py-3 font-medium text-rose-300 transition hover:bg-rose-400/15"
                  >
                    Гарах
                  </button>

                  {role === "admin" ? (
                    <Link
                      href="/admin"
                      className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-6 py-3 font-medium text-amber-300 transition hover:bg-amber-400/15"
                    >
                      Admin
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-2xl border border-white/20 px-6 py-3 font-medium transition hover:bg-white/10"
                  >
                    Нэвтрэх
                  </Link>

                  <Link
                    href="/register"
                    className="rounded-2xl border border-indigo-400/30 bg-indigo-400/10 px-6 py-3 font-medium text-indigo-300 transition hover:bg-indigo-400/15"
                  >
                    Бүртгүүлэх
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="courses" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">Сургалтууд</h2>
          <p className="mt-2 text-slate-400">
            Өөрт тохирох онлайн сургалтуудаа сонгож эхлээрэй.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
            Уншиж байна...
          </div>
        ) : courses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg transition hover:scale-[1.02] hover:bg-white/10"
              >
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-slate-800 text-slate-500">
                    Cover image
                  </div>
                )}

                <div className="p-5">
                  <h3 className="text-xl font-semibold">{course.title}</h3>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-300">
                    {course.description || "Тайлбар байхгүй"}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-lg font-bold text-indigo-400">
                      {Number(course.price_mnt || 0).toLocaleString()}₮
                    </span>

                    <Link
                      href={`/courses/${course.id}`}
                      className="text-sm underline underline-offset-4"
                    >
                      Дэлгэрэнгүй →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-slate-400">
            Одоогоор нийтлэгдсэн сургалт алга байна.
          </div>
        )}
      </section>

      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold">Өнөөдөр эхлээд өөрийгөө өөрчил</h2>
        <p className="mt-4 text-slate-400">
          Амжилттай хүмүүс сурахаа хэзээ ч зогсоодоггүй
        </p>

        {user ? (
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-2xl bg-indigo-500 px-8 py-3 font-medium transition hover:scale-[1.02]"
          >
            Холбоо барих
          </Link>
        ) : (
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-2xl bg-indigo-500 px-8 py-3 font-medium transition hover:scale-[1.02]"
          >
            Холбоо барих
          </Link>
        )}
      </section>
    </main>
  );
}
