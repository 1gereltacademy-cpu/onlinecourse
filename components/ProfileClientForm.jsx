"use client";

import Link from "next/link";
import { useState } from "react";

export default function ProfileClientForm({ profile }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: form.full_name, phone: form.phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Алдаа гарлаа.");
        return;
      }

      setMessage("Мэдээлэл амжилттай хадгалагдлаа.");
    } catch (err) {
      setMessage(err.message || "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/" className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-center">Нүүр</Link>
          <Link href="/courses" className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-center">Courses</Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Хэрэглэгчийн мэдээлэл</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
            Бүртгэлийн мэдээллээ эндээс харж, засаж хадгална. Регистрийн дугаар түгжигдсэн.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Овог нэр</label>
              <input className="w-full rounded-2xl bg-white/10 p-3 text-white outline-none" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Овог нэр" />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Утасны дугаар</label>
              <input className="w-full rounded-2xl bg-white/10 p-3 text-white outline-none" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Утасны дугаар" />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">И-мэйл</label>
              <input className="w-full cursor-not-allowed rounded-2xl bg-white/5 p-3 text-slate-400 outline-none" value={profile?.email || ""} readOnly />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Регистрийн дугаар</label>
              <input className="w-full cursor-not-allowed rounded-2xl bg-white/5 p-3 text-slate-400 outline-none" value={profile?.register_number || ""} readOnly />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Role</label>
              <input className="w-full cursor-not-allowed rounded-2xl bg-white/5 p-3 text-slate-400 outline-none" value={profile?.role || "user"} readOnly />
            </div>

            {message ? <div className="break-words whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</div> : null}

            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-white px-5 py-3 font-semibold text-slate-900 disabled:opacity-60 sm:w-auto">
              {loading ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
