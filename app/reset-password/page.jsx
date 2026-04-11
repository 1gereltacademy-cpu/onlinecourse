"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          setMessage("Сэргээх холбоос шалгах үед алдаа гарлаа.");
          setChecking(false);
          return;
        }

        if (session) {
          setChecking(false);
          return;
        }

        setMessage(
          "Сэргээх холбоос хүчингүй эсвэл хугацаа нь дууссан байж магадгүй. И-мэйлээсээ дахин шинэ холбоос аваарай."
        );
        setChecking(false);
      } catch (err) {
        if (!mounted) return;
        setMessage(err.message || "Алдаа гарлаа.");
        setChecking(false);
      }
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setChecking(false);
        setMessage("");
      }

      if (!session && event === "SIGNED_OUT") {
        setChecking(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleResetPassword(e) {
    e.preventDefault();
    if (loading) return;

    if (!password || !confirmPassword) {
      setMessage("Шинэ нууц үгээ бүтэн оруулна уу.");
      return;
    }

    if (password.length < 6) {
      setMessage("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Нууц үгүүд таарахгүй байна.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setSuccess(true);
      setMessage("Нууц үг амжилттай шинэчлэгдлээ.");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setMessage(err.message || "Нууц үг шинэчлэх үед алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.25),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_30%),linear-gradient(to_bottom,#020617,#0f172a,#020617)]" />
      <div className="absolute left-[-100px] top-[100px] h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-60px] h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl sm:rounded-[32px] sm:p-6 md:p-8">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300">
              Нууц үг сэргээх
            </div>

            <h1 className="mt-4 text-3xl font-bold md:text-4xl">
              Шинэ нууц үг оруулах
            </h1>

            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              И-мэйлээр ирсэн холбоосоор орж ирээд шинэ нууц үгээ хадгална уу.
            </p>
          </div>

          {checking ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-slate-300">
              Сэргээх холбоос шалгаж байна...
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Шинэ нууц үг
                </label>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/50 focus:bg-white/10"
                  placeholder="Шинэ нууц үг"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={success}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Шинэ нууц үг давтах
                </label>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/50 focus:bg-white/10"
                  placeholder="Шинэ нууц үг давтах"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={success}
                />
              </div>

              {message ? (
                <div
                  className={`break-words whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                    success
                      ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                      : "border border-rose-400/20 bg-rose-400/10 text-rose-200"
                  }`}
                >
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || success}
                className="w-full rounded-2xl bg-white py-3 font-semibold text-slate-900 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Шинэчилж байна..."
                  : success
                  ? "Амжилттай шинэчлэгдлээ"
                  : "Нууц үг шинэчлэх"}
              </button>
            </form>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:bg-white/10"
            >
              Нэвтрэх
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:bg-white/10"
            >
              Нүүр
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
