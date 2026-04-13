"use client";

import { useState } from "react";

export default function AdminDeleteLessonButton({ lessonId, lessonTitle }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = confirm(`"${lessonTitle}" lesson-ийг устгах уу?`);
    if (!ok) return;

    try {
      setLoading(true);

      const res = await fetch("/api/admin/delete-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: lessonId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Lesson устгах үед алдаа гарлаа");
        return;
      }

      alert("Lesson устлаа");
      location.reload();
    } catch (error) {
      console.error("Delete lesson error:", error);
      alert("Lesson устгах үед алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-2xl bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Устгаж байна..." : "Lesson устгах"}
    </button>
  );
  
}
