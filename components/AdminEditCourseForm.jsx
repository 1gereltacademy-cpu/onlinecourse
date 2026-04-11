"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";

export default function AdminEditCourseForm({ course }) {
  const [form, setForm] = useState({
    title: course.title || "",
    description: course.description || "",
    price_mnt: course.price_mnt || 0,
    thumbnail_url: course.thumbnail_url || "",
    category: course.category || "",
    level: course.level || "",
    is_premium: course.is_premium ?? true,
    is_published: course.is_published ?? true,
    bank_name: course.bank_name || "",
    bank_account_name: course.bank_account_name || "",
    bank_account_number: course.bank_account_number || "",
    payment_qr_url: course.payment_qr_url || "",
  });

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch("/api/admin/update-course", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: course.id,
        ...form,
        price_mnt: Number(form.price_mnt || 0),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Алдаа гарлаа");
      return;
    }

    alert("Course шинэчлэгдлээ");
    location.reload();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Title"
      />

      <textarea
        className="min-h-[100px] w-full rounded-2xl bg-white/10 p-3 text-white"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Description"
      />

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        value={form.price_mnt}
        onChange={(e) => setForm({ ...form, price_mnt: e.target.value })}
        placeholder="Үнэ"
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-2 text-sm text-slate-300">Course зураг</p>
        <ImageUpload
          onUpload={(url) =>
            setForm((prev) => ({
              ...prev,
              thumbnail_url: url,
            }))
          }
        />
        {form.thumbnail_url ? (
          <img
            src={form.thumbnail_url}
            alt="preview"
            className="mt-3 h-32 w-full rounded-xl object-cover"
          />
        ) : null}
      </div>

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        value={form.thumbnail_url}
        onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
        placeholder="Thumbnail URL"
      />

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        placeholder="Category"
      />

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        value={form.level}
        onChange={(e) => setForm({ ...form, level: e.target.value })}
        placeholder="Level"
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-300">Payment info</h4>

        <input
          className="mb-3 w-full rounded-2xl bg-white/10 p-3 text-white"
          value={form.bank_name}
          onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
          placeholder="Банкны нэр"
        />

        <input
          className="mb-3 w-full rounded-2xl bg-white/10 p-3 text-white"
          value={form.bank_account_name}
          onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
          placeholder="Данс эзэмшигчийн нэр"
        />

        <input
          className="mb-3 w-full rounded-2xl bg-white/10 p-3 text-white"
          value={form.bank_account_number}
          onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
          placeholder="Дансны дугаар"
        />

        <p className="mb-2 text-sm text-slate-300">QR зураг upload</p>
        <ImageUpload
          onUpload={(url) =>
            setForm((prev) => ({
              ...prev,
              payment_qr_url: url,
            }))
          }
        />

        {form.payment_qr_url ? (
          <img
            src={form.payment_qr_url}
            alt="QR preview"
            className="mt-3 h-40 w-40 rounded-xl object-cover"
          />
        ) : null}

        <input
          className="mt-3 w-full rounded-2xl bg-white/10 p-3 text-white"
          value={form.payment_qr_url}
          onChange={(e) => setForm({ ...form, payment_qr_url: e.target.value })}
          placeholder="QR image URL"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_premium}
          onChange={(e) => setForm({ ...form, is_premium: e.target.checked })}
        />
        Premium
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_published}
          onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
        />
        Published
      </label>

      <button className="rounded-2xl bg-amber-400 px-4 py-2 text-slate-950">
        Course засах
      </button>
    </form>
  );
}