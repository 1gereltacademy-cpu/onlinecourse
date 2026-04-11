export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export default async function ProfilePage() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) redirect("/login");

  const supabase = createClient(
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
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, email, phone, register_number, role, access_expires_at")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("profile fetch error:", error.message);
  }

  const displayName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Хэрэглэгч";

  const role = profile?.role || "user";
  const email = profile?.email || user.email || "Оруулаагүй";
  const phone = profile?.phone || "Оруулаагүй";
  const registerNumber = profile?.register_number || "Оруулаагүй";
  const accessExpiresAt = profile?.access_expires_at
    ? new Date(profile.access_expires_at).toLocaleDateString()
    : "Хязгааргүй";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("");

  const isAdmin = role === "admin";

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.25),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_30%),linear-gradient(to_bottom,#020617,#0f172a,#020617)]" />
      <div className="absolute left-[-120px] top-[60px] -z-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-80px] -z-10 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                Premium profile
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Хэрэглэгчийн
                <span className="block text-indigo-400">мэдээлэл</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                Өөрийн бүртгэл, эрх, холбоо барих мэдээлэл болон платформын
                хандалтын төлөвөө эндээс хараарай.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm text-white transition hover:bg-white/10"
              >
                ← Нүүр рүү буцах
              </Link>

              {isAdmin ? (
                <Link
                  href="/admin"
                  className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-center text-sm text-amber-300 transition hover:bg-amber-400/15"
                >
                  Admin panel
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:rounded-[32px] sm:p-6">
            <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-indigo-500/20 via-slate-900 to-emerald-500/10 p-5 sm:rounded-[28px] sm:p-6">
              <div className="absolute right-[-30px] top-[-30px] h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl" />
              <div className="absolute bottom-[-40px] left-[-20px] h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />

              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl font-bold text-white shadow-lg sm:h-24 sm:w-24 sm:text-3xl">
                  {initials || "U"}
                </div>

                <h2 className="mt-5 break-words text-xl font-bold sm:text-2xl">
                  {displayName}
                </h2>
                <p className="mt-2 break-all text-sm text-slate-300">{email}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isAdmin
                        ? "border border-amber-400/20 bg-amber-400/10 text-amber-200"
                        : "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                    }`}
                  >
                    {isAdmin ? "Admin эрхтэй" : "Хэрэглэгч"}
                  </span>

                  <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
                    Идэвхтэй бүртгэл
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-slate-400">Хандалтын хугацаа</div>
                <div className="mt-2 break-words text-lg font-semibold text-white">
                  {accessExpiresAt}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-slate-400">Нэвтрэх эрх</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {isAdmin ? "Бүрэн удирдлага" : "Стандарт хэрэглэгч"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 shadow-xl backdrop-blur-xl sm:rounded-[32px] sm:p-6">
              <div className="mb-6">
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  Хувийн мэдээлэл
                </div>
                <h3 className="mt-4 text-2xl font-bold text-white">
                  Бүртгэлийн дэлгэрэнгүй
                </h3>
                <p className="mt-2 text-sm text-slate-400 sm:text-base">
                  Доорх мэдээллүүд нь таны бүртгэлд хадгалагдсан өгөгдлүүд юм.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard label="Овог нэр" value={displayName} />
                <InfoCard label="И-мэйл" value={email} breakAll />
                <InfoCard label="Утасны дугаар" value={phone} />
                <InfoCard label="Регистрийн дугаар" value={registerNumber} />
                <InfoCard label="Role" value={role} />
                <InfoCard label="Хандалтын хугацаа" value={accessExpiresAt} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value, breakAll = false }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
      <div className="text-sm text-slate-400">{label}</div>
      <div
        className={`mt-2 text-lg font-semibold text-white ${
          breakAll ? "break-all" : "break-words"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
