"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import AdminCreateCourseForm from "@/components/AdminCreateCourseForm";
import AdminCreateLessonForm from "@/components/AdminCreateLessonForm";
import AdminLessonOrderButtons from "@/components/AdminLessonOrderButtons";
import AdminEditCourseForm from "@/components/AdminEditCourseForm";
import AdminEditLessonForm from "@/components/AdminEditLessonForm";
import AdminDeleteCourseButton from "@/components/AdminDeleteCourseButton";
import AdminDeleteLessonButton from "@/components/AdminDeleteLessonButton";

function AnimatedBlock({ open, children }) {
  return (
    <div
      className={`grid transition-all duration-300 ease-in-out ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function TopCollapseCard({ title, desc, open, onToggle, children }) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-xl backdrop-blur">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm text-slate-200">
            {title}
          </div>
          <h2 className="mt-4 text-2xl font-semibold">{title}</h2>
          <p className="mt-2 text-slate-400">{desc}</p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">
          {open ? "Хураах ▲" : "Нээх ▼"}
        </span>
      </button>

      <AnimatedBlock open={open}>
        <div className="mt-5">{children}</div>
      </AnimatedBlock>
    </section>
  );
}

export default function AdminDashboardCollapsible({ courses, lessons }) {
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [createLessonOpen, setCreateLessonOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(true);
  const [courseState, setCourseState] = useState({});
  const [lessonState, setLessonState] = useState({});
  const [dragIndex, setDragIndex] = useState(null);
  const [dragSaving, setDragSaving] = useState(false);
  const [dragMessage, setDragMessage] = useState("");

  const [orderedCourses, setOrderedCourses] = useState(() =>
    [...(courses || [])].sort((a, b) => {
      const aPos =
        typeof a.position === "number" ? a.position : Number.MAX_SAFE_INTEGER;
      const bPos =
        typeof b.position === "number" ? b.position : Number.MAX_SAFE_INTEGER;

      if (aPos !== bPos) return aPos - bPos;
      return 0;
    })
  );

  const grouped = useMemo(() => {
    return orderedCourses.map((course) => ({
      ...course,
      lessons: (lessons || []).filter((lesson) => lesson.course_id === course.id),
    }));
  }, [orderedCourses, lessons]);

  function toggleCourse(courseId) {
    setCourseState((prev) => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        open: !prev[courseId]?.open,
      },
    }));
  }

  function toggleLesson(courseId, lessonId) {
    setLessonState((prev) => ({
      ...prev,
      [courseId]: {
        ...(prev[courseId] || {}),
        [lessonId]: !prev[courseId]?.[lessonId],
      },
    }));
  }

  function moveItem(array, fromIndex, toIndex) {
    const copy = [...array];
    const [item] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, item);
    return copy;
  }

  async function saveCourseOrder(nextCourses) {
    try {
      setDragSaving(true);
      setDragMessage("");

      const supabase = getSupabaseBrowser();

      for (let i = 0; i < nextCourses.length; i += 1) {
        const course = nextCourses[i];
        const { error } = await supabase
          .from("courses")
          .update({ position: i + 1 })
          .eq("id", course.id);

        if (error) throw error;
      }

      setDragMessage("Course дараалал хадгалагдлаа.");
    } catch (error) {
      console.error("save course order error:", error);
      setDragMessage(
        "Хадгалах үед алдаа гарлаа. courses table дээр position column байгаа эсэхийг шалга."
      );
    } finally {
      setDragSaving(false);
    }
  }

  function handleDropCourse(index) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }

    const nextCourses = moveItem(orderedCourses, dragIndex, index).map(
      (course, idx) => ({
        ...course,
        position: idx + 1,
      })
    );

    setOrderedCourses(nextCourses);
    setDragIndex(null);
    saveCourseOrder(nextCourses);
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-2">
        <TopCollapseCard
          title="Шинэ course"
          desc="Шинэ сургалтын мэдээлэл оруулж нийтлэх хэсэг."
          open={createCourseOpen}
          onToggle={() => setCreateCourseOpen((prev) => !prev)}
        >
          <AdminCreateCourseForm />
        </TopCollapseCard>

        <TopCollapseCard
          title="Шинэ lesson"
          desc="Course дээр шинэ lesson үүсгэж контентоо нэмнэ."
          open={createLessonOpen}
          onToggle={() => setCreateLessonOpen((prev) => !prev)}
        >
          <AdminCreateLessonForm courses={orderedCourses || []} />
        </TopCollapseCard>
      </div>

      <div className="mt-8">
        <section className="rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-xl backdrop-blur">
          <button
            type="button"
            onClick={() => setCoursesOpen((prev) => !prev)}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <div>
              <h2 className="text-2xl font-semibold">Courses & Lessons</h2>
              <p className="mt-1 text-slate-400">
                Нэг course-ийг дарахад доторх lesson-үүд нь хураалттай харагдана.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                {orderedCourses?.length || 0}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">
                {coursesOpen ? "Хураах ▲" : "Нээх ▼"}
              </span>
            </div>
          </button>

          <AnimatedBlock open={coursesOpen}>
            <div className="mt-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-400">
                  Course card-ийг mouse-аар чирж дарааллыг нь солино.
                </div>
                <div className="text-sm text-slate-300">
                  {dragSaving ? "Хадгалж байна..." : dragMessage}
                </div>
              </div>

              <div className="space-y-4">
                {grouped.length ? (
                  grouped.map((course, index) => {
                    const courseOpen = !!courseState[course.id]?.open;

                    return (
                      <div
                        key={course.id}
                        draggable
                        onDragStart={() => setDragIndex(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDropCourse(index)}
                        className={`rounded-3xl border bg-slate-900/60 p-5 transition ${
                          dragIndex === index
                            ? "border-indigo-400/40 opacity-70"
                            : "border-white/10"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleCourse(course.id)}
                          className="flex w-full items-start justify-between gap-3 text-left"
                        >
                          <div>
                            <div className="text-lg font-semibold text-white">
                              {course.title}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              {course.category ? (
                                <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-indigo-200">
                                  {course.category}
                                </span>
                              ) : null}

                              {course.level ? (
                                <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                                  {course.level}
                                </span>
                              ) : null}

                              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">
                                {Number(course.price_mnt || 0).toLocaleString()}₮
                              </span>

                              <span className="rounded-full bg-sky-500/20 px-3 py-1 text-sky-200">
                                {course.lessons.length} lesson
                              </span>

                              <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                                Чирж зөөнө
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                              {course.is_published ? "Published" : "Draft"}
                            </div>

                            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                              {courseOpen ? "▲" : "▼"}
                            </div>
                          </div>
                        </button>

                        <AnimatedBlock open={courseOpen}>
                          <div className="mt-4 border-t border-white/10 pt-4">
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                              <div className="text-sm font-medium text-slate-200">
                                Course тохиргоо
                              </div>

                              <div className="mt-4">
                                <AdminEditCourseForm course={course} />
                              </div>

                              <div className="mt-3">
                                <AdminDeleteCourseButton courseId={course.id} />
                              </div>
                            </div>

                            <div className="mt-4 space-y-3">
                              {course.lessons.length ? (
                                course.lessons.map((lesson, index) => {
                                  const lessonOpen = !!lessonState[course.id]?.[lesson.id];

                                  return (
                                    <div
                                      key={lesson.id}
                                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => toggleLesson(course.id, lesson.id)}
                                        className="flex w-full items-start justify-between gap-3 text-left"
                                      >
                                        <div>
                                          <div className="text-xs uppercase tracking-wide text-slate-400">
                                            Lesson {index + 1}
                                          </div>
                                          <div className="mt-1 text-base font-semibold text-white">
                                            {lesson.title}
                                          </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 text-xs">
                                          <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                                            {lesson.duration || "--:--"}
                                          </span>

                                          <span
                                            className={`rounded-full px-3 py-1 ${
                                              lesson.is_preview
                                                ? "bg-emerald-500/20 text-emerald-200"
                                                : "bg-amber-500/20 text-amber-200"
                                            }`}
                                          >
                                            {lesson.is_preview ? "Preview" : "Premium"}
                                          </span>

                                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                                            {lessonOpen ? "▲" : "▼"}
                                          </span>
                                        </div>
                                      </button>

                                      <AnimatedBlock open={lessonOpen}>
                                        <div className="mt-4 border-t border-white/10 pt-4">
                                          <AdminLessonOrderButtons lesson={lesson} />

                                          <div className="mt-4">
                                            <AdminEditLessonForm lesson={lesson} />
                                          </div>

                                          <div className="mt-3">
                                            <AdminDeleteLessonButton lessonId={lesson.id} />
                                          </div>
                                        </div>
                                      </AnimatedBlock>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-slate-400">
                                  Энэ course дээр lesson алга байна.
                                </div>
                              )}
                            </div>
                          </div>
                        </AnimatedBlock>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 p-5 text-slate-400">
                    Course алга байна.
                  </div>
                )}
              </div>
            </div>
          </AnimatedBlock>
        </section>
      </div>
    </>
  );
}
