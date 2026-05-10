"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      const user = data?.user;
      const session = data?.session;

      if (!user || !session) {
        setMessage("Нэвтрэх мэдээлэл олдсонгүй.");
        return;
      }

      document.cookie = `sb-access-token=${session.access_token}; path=/;`;

      window.location.href = "/";
    } catch (err) {
      setMessage(err.message || "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    const email = form.email.trim();

    if (!email) {
      setResetMessage("Нууц үг сэргээхдээ эхлээд и-мэйл хаягаа оруулна уу.");
      return;
    }

    try {
      setResetLoading(true);
      setResetMessage("");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("reset password error:", error);
        setResetMessage(error.message);
        return;
      }

      setResetMessage(
        "Нууц үг сэргээх холбоос таны и-мэйл рүү илгээгдлээ. И-мэйлээ шалгана уу."
      );
    } catch (err) {
      setResetMessage(err.message || "Нууц үг сэргээх үед алдаа гарлаа.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.25),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_30%),linear-gradient(to_bottom,#020617,#0f172a,#020617)]" />
      <div className="absolute left-[-100px] top-[100px] h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-60px] h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-2 lg:gap-10">
        <div className="hidden lg:block">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-300 backdrop-blur">
            Gerelt Academy
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight xl:text-6xl">
            Мэдлэгээрээ
            <span className="block bg-gradient-to-r from-indigo-300 to-emerald-300 bg-clip-text text-transparent">ирээдүйгээ бүтээ</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Онлайн сургалтын платформдоо нэвтэрч,
            өөрийн суралцах орчноо нэг шат ахиулаарай.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="text-2xl font-bold">24/7</div>
              <div className="mt-1 text-sm text-slate-400">Онлайн хандалт</div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="text-2xl font-bold">2+</div>
              <div className="mt-1 text-sm text-slate-400">Сургалтын багц</div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="text-2xl font-bold">100%</div>
              <div className="mt-1 text-sm text-slate-400">Дижитал орчин</div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl sm:rounded-[32px] sm:p-6 md:p-8">
            <div className="mb-6">
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Хэрэглэгчийн нэвтрэх хэсэг
              </div>

              <h1 className="mt-4 text-3xl font-bold md:text-4xl">Нэвтрэх</h1>

              <p className="mt-2 text-sm text-slate-400 sm:text-base">
                Өөрийн бүртгэлээр нэвтэрч, сургалтуудаа үргэлжлүүлээрэй.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  И-мэйл хаяг
                </label>
                <input
                  type="email"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/50 focus:bg-white/10"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Нууц үг
                </label>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/50 focus:bg-white/10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-right text-sm text-indigo-300 transition hover:text-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resetLoading ? "Илгээж байна..." : "Нууц үг мартсан?"}
                </button>
              </div>

              {message ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {message}
                </div>
              ) : null}

              {resetMessage ? (
                <div className="break-words whitespace-pre-wrap rounded-2xl border border-indigo-400/20 bg-indigo-400/10 px-4 py-3 text-sm text-indigo-200">
                  {resetMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white py-3 font-semibold text-slate-900 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
              </button>
            </form>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:bg-white/10"
              >
                Бүртгүүлэх
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:bg-white/10"
              >
                Буцах
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
