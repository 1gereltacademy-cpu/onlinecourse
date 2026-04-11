
"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";

export default function AdminCreateLessonForm({ courses }) {
  const [form, setForm] = useState({
    course_id: courses?.[0]?.id || "",
    title: "",
    video_url: "",
    duration: "",
    position: 1,
    is_preview: false,
    thumbnail_url: "",
    video_path: "",
  });

  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  async function uploadPrivateVideo() {
    if (!videoFile) return "";

    setUploadingVideo(true);

    const formData = new FormData();
    formData.append("file", videoFile);

    const res = await fetch("/api/admin/upload-video", {
      method: "POST",
      body: formData,
    });

    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text || "Unknown server response" };
    }

    setUploadingVideo(false);

    if (!res.ok) {
      throw new Error(data.error || "Видео upload алдаа");
    }

    return data.video_path || "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);

      let finalVideoPath = form.video_path;
      let finalVideoUrl = form.video_url;

      // Хэрвээ private video upload сонгосон бол video_path хадгална
      if (videoFile) {
        finalVideoPath = await uploadPrivateVideo();
        finalVideoUrl = "";
      }

      const res = await fetch("/api/admin/create-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          video_path: finalVideoPath,
          video_url: finalVideoUrl,
          position: Number(form.position || 1),
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

      alert("Lesson нэмэгдлээ");
      location.reload();
    } catch (error) {
      alert(error.message || "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <select
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        value={form.course_id}
        onChange={(e) => setForm({ ...form, course_id: e.target.value })}
      >
        {courses?.map((course) => (
          <option key={course.id} value={course.id} className="bg-slate-900">
            {course.title}
          </option>
        ))}
      </select>

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        placeholder="Lesson title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-2 text-sm text-slate-300">
          Video source
        </p>

        <input
          className="w-full rounded-2xl bg-white/10 p-3 text-white"
          placeholder="YouTube link (optional)"
          value={form.video_url}
          onChange={(e) => setForm({ ...form, video_url: e.target.value })}
        />

        <div className="mt-3 text-xs text-slate-400">
          Эсвэл private video upload хийж болно
        </div>

        <input
          type="file"
          accept="video/mp4,video/webm,video/ogg"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          className="mt-3 w-full rounded-2xl bg-white/10 p-3 text-white file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-slate-900"
        />

        {videoFile ? (
          <p className="mt-2 text-xs text-emerald-300">
            Сонгосон файл: {videoFile.name}
          </p>
        ) : null}

        {uploadingVideo ? (
          <p className="mt-2 text-xs text-yellow-300">Видео upload хийж байна...</p>
        ) : null}
      </div>

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        placeholder="Duration"
        value={form.duration}
        onChange={(e) => setForm({ ...form, duration: e.target.value })}
      />

      <input
        type="number"
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        placeholder="Position"
        value={form.position}
        onChange={(e) => setForm({ ...form, position: e.target.value })}
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-2 text-sm text-slate-300">Lesson зураг upload</p>

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
            alt="Lesson preview"
            className="mt-3 h-32 w-full rounded-xl object-cover"
          />
        ) : null}
      </div>

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
        disabled={loading || uploadingVideo}
        className="rounded-2xl bg-white px-4 py-2 text-slate-900 disabled:opacity-60"
      >
        {loading ? "Нэмэж байна..." : "Lesson нэмэх"}
      </button>
    </form>
  );
}
