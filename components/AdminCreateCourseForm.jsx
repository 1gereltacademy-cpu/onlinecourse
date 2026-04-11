"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";

export default function AdminCreateCourseForm() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price_mnt: "",
    thumbnail_url: "",
    category: "",
    level: "",
    is_premium: true,
    is_published: true,
  });

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch("/api/admin/create-course", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        price_mnt: Number(form.price_mnt || 0),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Алдаа гарлаа");
      return;
    }

    alert("Course нэмэгдлээ");
    location.reload();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        placeholder="Course title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <textarea
        className="min-h-[110px] w-full rounded-2xl bg-white/10 p-3 text-white"
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        placeholder="Үнэ"
        value={form.price_mnt}
        onChange={(e) => setForm({ ...form, price_mnt: e.target.value })}
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-2 text-sm text-slate-300">Course зураг upload</p>

        <ImageUpload
          onUpload={(url) =>
            setForm((prev) => ({
              ...prev,
              thumbnail_url: url,
            }))
          }
        />

        {form.thumbnail_url ? (
          <div className="mt-3">
            <p className="mb-2 text-xs text-emerald-300">Зураг амжилттай орлоо</p>
            <img
              src={form.thumbnail_url}
              alt="Course preview"
              className="h-32 w-full rounded-xl object-cover"
            />
          </div>
        ) : null}
      </div>

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        placeholder="Thumbnail URL"
        value={form.thumbnail_url}
        onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
      />

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        placeholder="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      />

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        placeholder="Level"
        value={form.level}
        onChange={(e) => setForm({ ...form, level: e.target.value })}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_premium}
          onChange={(e) => setForm({ ...form, is_premium: e.target.checked })}
        />
        Premium course
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_published}
          onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
        />
        Published
      </label>

      <button className="rounded-2xl bg-white px-4 py-2 text-slate-900">
        Course нэмэх
      </button>
    </form>
  );
}