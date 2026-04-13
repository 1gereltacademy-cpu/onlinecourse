
"use client";

import { useState } from "react";

export default function AdminEditLessonForm({ lesson }) {
  const [form, setForm] = useState({
    title: lesson.title || "",
    video_path: lesson.video_path || "",
    thumbnail_url: lesson.thumbnail_url || "",
  });

  const [videoFile, setVideoFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function uploadFile(file, bucket) {
    const fileName = Date.now() + "-" + file.name;

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: JSON.stringify({ fileName, bucket }),
    });

    const { url } = await res.json();

    await fetch(url, {
      method: "PUT",
      body: file,
    });

    return fileName;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);

      let videoPath = form.video_path;
      let thumbnail = form.thumbnail_url;

      if (videoFile) {
        videoPath = await uploadFile(videoFile, "videos-private");
      }

      if (imageFile) {
        const imageName = await uploadFile(imageFile, "thumbnails");
        thumbnail = `thumbnails/${imageName}`;
      }

      const res = await fetch("/api/admin/updateLesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: lesson.id,
          title: form.title,
          video_path: videoPath,
          thumbnail_url: thumbnail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Алдаа гарлаа");
        return;
      }

      alert("Lesson шинэчлэгдлээ");
      location.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      <input
        className="w-full p-3 rounded bg-white/10 text-white"
        value={form.title}
        onChange={(e)=>setForm({...form,title:e.target.value})}
      />

      <div>
        <p className="text-sm text-white">Видео солих</p>
        <input type="file" onChange={(e)=>setVideoFile(e.target.files[0])} />
      </div>

      <div>
        <p className="text-sm text-white">Зураг солих</p>
        <input type="file" onChange={(e)=>setImageFile(e.target.files[0])} />
      </div>

      <button
        disabled={loading}
        className="bg-yellow-400 px-4 py-2 rounded"
      >
        {loading ? "Хадгалж байна..." : "Хадгалах"}
      </button>

    </form>
  );
}
