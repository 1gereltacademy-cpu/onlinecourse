"use client";

import { useState } from "react";

export default function AdminDeleteCourseButton({ courseId, courseTitle }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = confirm(`"${courseTitle}" course-ийг устгах уу?`);
    if (!ok) return;

    try {
      setLoading(true);

      const res = await fetch("/api/admin/delete-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: courseId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Course устгах үед алдаа гарлаа");
        return;
      }

      alert("Course болон холбоотой lesson-ууд устлаа");
      location.reload();
    } catch (error) {
      console.error("Delete course error:", error);
      alert("Course устгах үед алдаа гарлаа");
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
      {loading ? "Устгаж байна..." : "Course устгах"}
    </button>
  );
}
