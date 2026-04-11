"use client";

export default function AdminDeleteLessonButton({ lessonId, lessonTitle }) {
  async function handleDelete() {
    const ok = confirm(`"${lessonTitle}" lesson-ийг устгах уу?`);
    if (!ok) return;

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
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-2xl bg-red-500 px-4 py-2 text-white hover:bg-red-600"
    >
      Lesson устгах
    </button>
  );
}