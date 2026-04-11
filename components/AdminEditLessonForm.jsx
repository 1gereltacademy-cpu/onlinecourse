"use client";

import { useState } from "react";

export default function AdminEditLessonForm({ lesson }) {
  const [form, setForm] = useState({
    title: lesson.title || "",
    video_url: lesson.video_url || "",
    duration: lesson.duration || "",
    position: lesson.position || 0,
    thumbnail_url: lesson.thumbnail_url || "",
    is_preview: lesson.is_preview || false,
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      const res = await fetch("/api/admin/updateLesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: lesson.id,
          title: form.title,
          video_url: form.video_url,
          duration: form.duration,
          position: Number(form.position || 0),
          thumbnail_url: form.thumbnail_url,
          is_preview: form.is_preview,
        }),
      });

      const text = await res.text();
      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || "Unknown server response" };
      }

      if (!res.ok) {
        alert(data.error || "Алдаа гарлаа");
        return;
      }

      alert("Lesson шинэчлэгдлээ");
      location.reload();
    } catch (error) {
      alert(error.message || "Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        value={form.video_url}
        onChange={(e) => setForm({ ...form, video_url: e.target.value })}
      />

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        value={form.duration}
        onChange={(e) => setForm({ ...form, duration: e.target.value })}
      />

      <input
        type="number"
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        value={form.position}
        onChange={(e) => setForm({ ...form, position: e.target.value })}
      />

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        value={form.thumbnail_url}
        onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
      />

      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={form.is_preview}
          onChange={(e) =>
            setForm({ ...form, is_preview: e.target.checked })
          }
        />
        Preview lesson
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl bg-yellow-400 px-4 py-2 text-slate-900 disabled:opacity-60"
      >
        {loading ? "Хадгалж байна..." : "Lesson засах"}
      </button>
    </form>
  );
}
