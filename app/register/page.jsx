"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function normalizePhone(value) {
  return (value || "").replace(/\D/g, "").slice(0, 8);
}

function normalizeRegisterNumber(value) {
  return (value || "")
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 10);
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    register_number: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setMessage("");

    const payload = {
      full_name: form.full_name.trim(),
      phone: normalizePhone(form.phone),
      register_number: normalizeRegisterNumber(form.register_number),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };

    if (
      !payload.full_name ||
      !payload.phone ||
      !payload.register_number ||
      !payload.email ||
      !payload.password
    ) {
      setMessage("Бүх талбарыг бөглөнө үү.");
      return;
    }

    if (!/^\d{8}$/.test(payload.phone)) {
      setMessage("Утасны дугаар яг 8 оронтой тоо байх ёстой.");
      return;
    }

    if (!/^[А-ЯӨҮЁ]{2}\d{8}$/.test(payload.register_number)) {
      setMessage(
        "Регистрийн эхний 2 тэмдэгт крилл том үсэг, дараагийн 8 нь тоо байх ёстой."
      );
      return;
    }

    if (payload.password.length < 6) {
      setMessage("Нууц үг хамгийн багадаа 6 тэмдэгттэй байна.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage(result?.error || "Бүртгэх үед алдаа гарлаа.");
        return;
      }

      setMessage("Амжилттай бүртгэгдлээ. Одоо нэвтэрч орно уу.");

      setForm({
        full_name: "",
        phone: "",
        register_number: "",
        email: "",
        password: "",
      });

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      setMessage(err.message || "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.25),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_30%),linear-gradient(to_bottom,#020617,#0f172a,#020617)]" />
      <div className="absolute left-[-120px] top-[120px] h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute bottom-[-100px] right-[-80px] h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-2 lg:gap-10">
        <div className="hidden lg:block">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-300 backdrop-blur">
            Gerelt Academy
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight xl:text-6xl">
            Ирээдүйдээ
            <span className="block bg-gradient-to-r from-indigo-300 to-emerald-300 bg-clip-text text-transparent">Өнөөдөр бүтээ</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Орчин үеийн онлайн сургалтын платформд бүртгүүлж, шинэ ур чадвар
            эзэмшиж, мэдлэгээ дараагийн түвшинд хүргэ.
          </p>
        </div>

        <div className="mx-auto w-full max-w-xl">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl sm:rounded-[32px] sm:p-6 md:p-8">
            <div className="mb-6">
              <div className="inline-flex items-center rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300">
                Шинэ хэрэглэгчийн бүртгэл
              </div>

              <h2 className="mt-4 text-3xl font-bold md:text-4xl">
                Бүртгүүлэх
              </h2>

              <p className="mt-2 text-sm text-slate-400 sm:text-base">
                Утасны дугаар болон регистрийн дугаараа давхардсан
                эсэхийг шалгаарай.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Овог нэр
                </label>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/50 focus:bg-white/10"
                  placeholder="Жишээ: Бат-Эрдэнэ"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Утасны дугаар
                </label>
                <input
                  inputMode="numeric"
                  maxLength={8}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/50 focus:bg-white/10"
                  placeholder="Жишээ: 99112233"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: normalizePhone(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Регистрийн дугаар
                </label>
                <input
                  maxLength={10}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white uppercase outline-none transition placeholder:text-slate-500 focus:border-indigo-400/50 focus:bg-white/10"
                  placeholder="Жишээ: АБ12345678"
                  value={form.register_number}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      register_number: normalizeRegisterNumber(e.target.value),
                    })
                  }
                />
                <p className="mt-2 text-xs text-slate-500">
                  Эхний 2 тэмдэгт крилл том үсэг, дараагийн 8 нь тоо байна.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  И-мэйл хаяг
                </label>
                <input
                  type="email"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/50 focus:bg-white/10"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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

              {message ? (
                <div className="break-words whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Бүртгэж байна..." : "Бүртгэл үүсгэх"}
              </button>
            </form>

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
                Буцах
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
