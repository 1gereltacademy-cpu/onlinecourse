"use client";

import { useMemo, useState } from "react";

export default function AdminEditLessonForm({ lesson }) {
  const [form, setForm] = useState({
    title: lesson.title || "",
    video_url: lesson.video_url || "",
    video_path: lesson.video_path || "",
    duration: lesson.duration || "",
    position: lesson.position || 0,
    thumbnail_url: lesson.thumbnail_url || "",
    is_preview: lesson.is_preview || false,
  });

  const [videoFile, setVideoFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const imagePreview = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    return form.thumbnail_url || "";
  }, [imageFile, form.thumbnail_url]);

  async function uploadVideo(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/upload-video", {
      method: "POST",
      body: formData,
    });

    const text = await res.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text || "Video upload response алдаатай байна" };
    }

    if (!res.ok) {
      throw new Error(data.error || "Видео upload хийх үед алдаа гарлаа");
    }

    // Аль алиныг нь дэмжинэ
    return {
      video_path: data.video_path || data.path || data.fileName || "",
      video_url: data.video_url || data.url || "",
    };
  }

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const text = await res.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text || "Image upload response алдаатай байна" };
    }

    if (!res.ok) {
      throw new Error(data.error || "Зураг upload хийх үед алдаа гарлаа");
    }

    // Аль алиныг нь дэмжинэ
    return data.thumbnail_url || data.url || data.path || "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);

      let nextVideoUrl = form.video_url.trim();
      let nextVideoPath = form.video_path.trim();
      let nextThumbnailUrl = form.thumbnail_url.trim();

      if (videoFile) {
        setUploadingVideo(true);
        const uploadedVideo = await uploadVideo(videoFile);
        setUploadingVideo(false);

        nextVideoPath = uploadedVideo.video_path || nextVideoPath;
        nextVideoUrl = uploadedVideo.video_url || nextVideoUrl;
      }

      if (imageFile) {
        setUploadingImage(true);
        const uploadedImageUrl = await uploadImage(imageFile);
        setUploadingImage(false);

        nextThumbnailUrl = uploadedImageUrl || nextThumbnailUrl;
      }

      const res = await fetch("/api/admin/updateLesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: lesson.id,
          title: form.title,
          video_url: nextVideoUrl,
          video_path: nextVideoPath,
          duration: form.duration,
          position: Number(form.position || 0),
          thumbnail_url: nextThumbnailUrl,
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

      alert(data.message || "Lesson шинэчлэгдлээ");
      location.reload();
    } catch (error) {
      alert(error.message || "Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
      setUploadingVideo(false);
      setUploadingImage(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        placeholder="Lesson title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        placeholder="Video URL"
        value={form.video_url}
        onChange={(e) => setForm({ ...form, video_url: e.target.value })}
      />

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        placeholder="Video path"
        value={form.video_path}
        onChange={(e) => setForm({ ...form, video_path: e.target.value })}
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-sm text-white/80">Шинэ видео сонгох</p>
        <input
          type="file"
          accept="video/*"
          className="w-full text-sm text-white"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
        />
        {videoFile ? (
          <p className="mt-2 text-xs text-emerald-300">
            Сонгосон видео: {videoFile.name}
          </p>
        ) : form.video_path ? (
          <p className="mt-2 text-xs text-white/60">
            Одоогийн video_path: {form.video_path}
          </p>
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

      <input
        className="w-full rounded-2xl bg-white/10 p-3 text-white"
        placeholder="Thumbnail URL"
        value={form.thumbnail_url}
        onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-sm text-white/80">Шинэ зураг сонгох</p>
        <input
          type="file"
          accept="image/*"
          className="w-full text-sm text-white"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />

        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Thumbnail preview"
            className="mt-3 h-32 w-full rounded-xl object-cover"
          />
        ) : null}

        {imageFile ? (
          <p className="mt-2 text-xs text-emerald-300">
            Сонгосон зураг: {imageFile.name}
          </p>
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
        disabled={loading}
        className="rounded-2xl bg-yellow-400 px-4 py-2 text-slate-900 disabled:opacity-60"
      >
        {loading
          ? uploadingVideo
            ? "Видео upload хийж байна..."
            : uploadingImage
            ? "Зураг upload хийж байна..."
            : "Хадгалж байна..."
          : "Lesson засах"}
      </button>
    </form>
  );
}