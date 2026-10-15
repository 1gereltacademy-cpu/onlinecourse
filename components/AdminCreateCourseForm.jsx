
"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";

const initialForm = {
  title: "",
  description: "",
  price_mnt: "",
  thumbnail_url: "",
  category: "",
  level: "",
  is_premium: true,
  is_published: true,
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  payment_qr_url: "",
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-slate-400";

export default function AdminCreateCourseForm() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (saving) return;

    if (!form.title.trim()) {
      alert("Курсын нэрээ оруулна уу.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/admin/create-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          price_mnt: Number(form.price_mnt || 0),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Курс үүсгэхэд алдаа гарлаа.");
        return;
      }

      alert("Курс болон төлбөрийн мэдээлэл амжилттай хадгалагдлаа.");
      window.location.reload();
    } catch (error) {
      console.error("Create course error:", error);
      alert("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm text-slate-300">
          Курсын нэр *
        </label>
        <input
          required
          className={inputClass}
          placeholder="Жишээ: CapCut сургалт"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-300">
          Тайлбар
        </label>
        <textarea
          className={`${inputClass} min-h-[110px]`}
          placeholder="Курсын тайлбар"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-300">
          Үнэ (₮)
        </label>
        <input
          type="number"
          min="0"
          className={inputClass}
          placeholder="149000"
          value={form.price_mnt}
          onChange={(e) => updateField("price_mnt", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-300">
          Ангилал
        </label>
        <input
          className={inputClass}
          placeholder="Жишээ: Видео эвлүүлэг"
          value={form.category}
          onChange={(e) => updateField("category", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-300">
          Түвшин
        </label>
        <input
          className={inputClass}
          placeholder="Жишээ: Beginner"
          value={form.level}
          onChange={(e) => updateField("level", e.target.value)}
        />
      </div>

      {/* Курсын үндсэн зураг */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 font-medium text-white">
          Курсын үндсэн зураг
        </p>

        <ImageUpload
          onUpload={(url) => updateField("thumbnail_url", url)}
        />

        {form.thumbnail_url && (
          <div className="mt-3">
            <img
              src={form.thumbnail_url}
              alt="Курсын зураг"
              className="h-36 w-full rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={() => updateField("thumbnail_url", "")}
              className="mt-2 text-sm text-red-300"
            >
              Зураг арилгах
            </button>
          </div>
        )}
      </div>

      {/* Банкны мэдээлэл */}
      <div className="space-y-3 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-4">
        <h3 className="font-semibold text-sky-200">
          Төлбөрийн банкны мэдээлэл
        </h3>

        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Банкны нэр
          </label>
          <input
            className={inputClass}
            placeholder="Жишээ: Хаан банк"
            value={form.bank_name}
            onChange={(e) => updateField("bank_name", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Данс эзэмшигчийн нэр
          </label>
          <input
            className={inputClass}
            placeholder="Данс эзэмшигчийн нэр"
            value={form.bank_account_name}
            onChange={(e) =>
              updateField("bank_account_name", e.target.value)
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Дансны дугаар
          </label>
          <input
            className={inputClass}
            placeholder="Дансны дугаар"
            value={form.bank_account_number}
            onChange={(e) =>
              updateField("bank_account_number", e.target.value)
            }
          />
        </div>

        {/* Төлбөрийн QR зураг */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="mb-3 text-sm text-slate-300">
            Төлбөрийн QR зураг
          </p>

          <ImageUpload
            onUpload={(url) => updateField("payment_qr_url", url)}
          />

          {form.payment_qr_url && (
            <div className="mt-3">
              <img
                src={form.payment_qr_url}
                alt="Төлбөрийн QR"
                className="max-h-64 rounded-xl bg-white object-contain p-2"
              />
              <button
                type="button"
                onClick={() => updateField("payment_qr_url", "")}
                className="mt-2 text-sm text-red-300"
              >
                QR зураг арилгах
              </button>
            </div>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={form.is_premium}
          onChange={(e) => updateField("is_premium", e.target.checked)}
        />
        Premium course
      </label>

      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={form.is_published}
          onChange={(e) => updateField("is_published", e.target.checked)}
        />
        Published
      </label>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Хадгалж байна..." : "Курс нэмэх"}
      </button>
    </form>
  );
}
