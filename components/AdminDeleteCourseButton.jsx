"use client";

export default function AdminDeleteCourseButton({ courseId, courseTitle }) {
  async function handleDelete() {
    const ok = confirm(`"${courseTitle}" course-ийг устгах уу?`);
    if (!ok) return;

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

    alert("Course устлаа");
    location.reload();
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-2xl bg-red-500 px-4 py-2 text-white hover:bg-red-600"
    >
      Course устгах
    </button>
  );
}