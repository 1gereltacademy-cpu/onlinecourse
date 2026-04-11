"use client";

export default function AdminLessonOrderButtons({ lesson }) {
  async function move(direction) {
    await fetch("/api/admin/reorder-lesson", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: lesson.id,
        direction,
        course_id: lesson.course_id,
        position: lesson.position,
      }),
    });

    location.reload();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => move("up")}
        className="rounded-xl bg-white/10 px-3 py-1 text-xs"
      >
        ↑
      </button>
      <button
        onClick={() => move("down")}
        className="rounded-xl bg-white/10 px-3 py-1 text-xs"
      >
        ↓
      </button>
    </div>
  );
}