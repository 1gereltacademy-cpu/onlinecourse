
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [messageType, setMessageType] = useState("error");

  useEffect(() => {
    let mounted = true;

    async function checkRecoveryLink() {
      try {
        const url = new URL(window.location.href);
        const hasRecoveryHash = url.hash.includes("type=recovery");
        const hasCode = url.searchParams.has("code");
        const hasRecoveryType =
          url.searchParams.get("type") === "recovery";

        if (hasCode) {
          const code = url.searchParams.get("code");

          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (!mounted) return;

          if (error) {
            setMessage(
              "Сэргээх холбоос хүчингүй эсвэл хугацаа нь дууссан байна. Шинэ холбоос хүснэ үү."
            );
            setMessageType("error");
            window.history.replaceState({}, "", url.pathname);
            return;
          }

          window.history.replaceState({}, "", url.pathname);
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!error && session && (hasRecoveryHash || hasCode || hasRecoveryType)) {
          setRecoveryMode(true);
          setMessage("");
        } else if (hasRecoveryHash || hasRecoveryType || hasCode) {
          if (!message) {
            setMessage(
              "Сэргээх холбоос хүчингүй эсвэл хугацаа нь дууссан байна. Шинэ холбоос хүснэ үү."
            );
            setMessageType("error");
          }
        }
      } catch (error) {
        if (mounted) {
          console.error("Recovery link error:", error);
          setMessage("Холбоос шалгах үед алдаа гарлаа.");
          setMessageType("error");
        }
      } finally {
        if (mounted) setChecking(false);
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        setRecoveryMode(true);
        setMessage("");
        setMessageType("error");
        setChecking(false);
      }
    });

    checkRecoveryLink();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSendResetEmail(e) {
    e.preventDefault();

    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMessage("И-мэйл хаягаа зөв оруулна уу.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setSuccess(false);

      // Сервер талд бүртгэлтэй эсэхийг шалгана.
      const response = await fetch("/api/auth/check-reset-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "И-мэйл шалгах үед алдаа гарлаа.");
        setMessageType("error");
        return;
      }

      if (result.exists !== true) {
        setMessage("Энэ и-мэйл хаяг бүртгэлгүй байна.");
        setMessageType("error");
        return;
      }

      // Бүртгэлтэй и-мэйлд сэргээх холбоос илгээнэ.
      const { error } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        console.error("Supabase reset email error:", error.message);
        setMessage(
          "Сэргээх холбоос илгээж чадсангүй. Supabase-ийн URL болон SMTP тохиргоог шалгана уу."
        );
        setMessageType("error");
        return;
      }

      setSuccess(true);
      setMessage(
        "Нууц үг сэргээх холбоос илгээгдлээ. И-мэйлийн Inbox болон Spam хавтсаа шалгана уу."
      );
      setMessageType("success");
    } catch (error) {
      console.error("Reset email request error:", error);
      setMessage(
        "Сервертэй холбогдох боломжгүй байна. API болон Vercel тохиргоог шалгана уу."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();

    if (loading) return;

    if (password.length < 6) {
      setMessage("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Нууц үгүүд хоорондоо таарахгүй байна.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        setMessage(
          "Сэргээх session олдсонгүй. И-мэйлээсээ шинэ холбоос хүснэ үү."
        );
        setMessageType("error");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error("Password update error:", updateError.message);
        setMessage(
          "Нууц үг шинэчлэх үед алдаа гарлаа. Холбоосын хугацааг шалгана уу."
        );
        setMessageType("error");
        return;
      }

      setSuccess(true);
      setMessage("Нууц үг амжилттай шинэчлэгдлээ. Нэвтрэх хуудас руу шилжинэ.");
      setMessageType("success");
      setPassword("");
      setConfirmPassword("");

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login");
      }, 1800);
    } catch (error) {
      console.error("Password reset error:", error);
      setMessage("Нууц үг шинэчлэх үед алдаа гарлаа.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  const messageClass =
    messageType === "success"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : "border-rose-400/20 bg-rose-400/10 text-rose-200";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.25),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_30%),linear-gradient(to_bottom,#020617,#0f172a,#020617)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6 text-center">
            <div className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300">
              Нууц үг сэргээх
            </div>

            <h1 className="mt-4 text-3xl font-bold">
              {recoveryMode
                ? "Шинэ нууц үг оруулах"
                : "Нууц үгээ мартсан уу?"}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              {recoveryMode
                ? "Шинэ нууц үгээ оруулж хадгална уу."
                : "Бүртгэлтэй и-мэйлээ оруулж сэргээх холбоос аваарай."}
            </p>
          </div>

          {checking ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-slate-300">
              Шалгаж байна...
            </div>
          ) : (
            <form
              onSubmit={
                recoveryMode
                  ? handleResetPassword
                  : handleSendResetEmail
              }
              className="space-y-4"
            >
              {recoveryMode ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Шинэ нууц үг
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-indigo-400/50"
                      placeholder="Хамгийн багадаа 6 тэмдэгт"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading || success}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Нууц үг давтах
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-indigo-400/50"
                      placeholder="Нууц үгээ дахин оруулна уу"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading || success}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    И-мэйл хаяг
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-indigo-400/50"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || success}
                  />
                </div>
              )}

              {message && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`break-words whitespace-pre-wrap rounded-2xl border px-4 py-3 text-sm ${messageClass}`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || success}
                className="w-full rounded-2xl bg-white py-3 font-semibold text-slate-900 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Түр хүлээнэ үү..."
                  : success
                  ? "Амжилттай"
                  : recoveryMode
                  ? "Нууц үг шинэчлэх"
                  : "Сэргээх холбоос илгээх"}
              </button>
            </form>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
            >
              Нэвтрэх
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
            >
              Нүүр хуудас
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
