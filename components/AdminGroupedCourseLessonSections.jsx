"use client";

import { useMemo, useState } from "react";
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

function SectionHeader({ title, description, count, open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mt-1 text-slate-400">
          {description} Нийт {count}.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
          {count}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">
          {open ? "Хураах ▲" : "Нээх ▼"}
        </span>
      </div>
    </button>
  );
}

export default function AdminGroupedCourseLessonSections({ courses, lessons }) {
  const [courseSectionOpen, setCourseSectionOpen] = useState(false);
  const [lessonSectionOpen, setLessonSectionOpen] = useState(false);
  const [openCourses, setOpenCourses] = useState({});
  const [openLessonGroups, setOpenLessonGroups] = useState({});
  const [openLessons, setOpenLessons] = useState({});

  const groupedLessons = useMemo(() => {
    const courseMap = new Map();

    (courses || []).forEach((course) => {
      courseMap.set(course.id, {
        courseId: course.id,
        courseTitle: course.title,
        items: [],
      });
    });

    (lessons || []).forEach((lesson) => {
      const key = lesson.courses?.id || "no-course";

      if (!courseMap.has(key)) {
        courseMap.set(key, {
          courseId: lesson.courses?.id || null,
          courseTitle: lesson.courses?.title || "Холбогдоогүй course",
          items: [],
        });
      }

      courseMap.get(key).items.push(lesson);
    });

    return Array.from(courseMap.values());
  }, [courses, lessons]);

  function toggleCourse(id) {
    setOpenCourses((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleLessonGroup(id) {
    setOpenLessonGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleLesson(id) {
    setOpenLessons((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-xl backdrop-blur">
        <SectionHeader
          title="Courses"
          description="Дарвал courses жагсаалт доошоо нээгдэнэ."
          count={courses?.length || 0}
          open={courseSectionOpen}
          onClick={() => setCourseSectionOpen((prev) => !prev)}
        />

        <AnimatedBlock open={courseSectionOpen}>
          <div className="mt-5 space-y-4">
            {courses?.length ? (
              courses.map((course) => {
                const isOpen = !!openCourses[course.id];

                return (
                  <div
                    key={course.id}
                    className="rounded-3xl border border-white/10 bg-slate-900/60 p-5"
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
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                          {course.is_published ? "Published" : "Draft"}
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                          {isOpen ? "▲" : "▼"}
                        </div>
                      </div>
                    </button>

                    <AnimatedBlock open={isOpen}>
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <AdminEditCourseForm course={course} />
                        <div className="mt-3">
                          <AdminDeleteCourseButton courseId={course.id} />
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
        </AnimatedBlock>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-xl backdrop-blur">
        <SectionHeader
          title="Lessons"
          description="Lesson-үүд course дотроо group болоод нээгдэнэ."
          count={lessons?.length || 0}
          open={lessonSectionOpen}
          onClick={() => setLessonSectionOpen((prev) => !prev)}
        />

        <AnimatedBlock open={lessonSectionOpen}>
          <div className="mt-5 space-y-4">
            {groupedLessons.length ? (
              groupedLessons.map((group) => {
                const groupKey = group.courseId || group.courseTitle;
                const isGroupOpen = !!openLessonGroups[groupKey];

                return (
                  <div
                    key={groupKey}
                    className="rounded-3xl border border-white/10 bg-slate-900/60 p-5"
                  >
                    <button
                      type="button"
                      onClick={() => toggleLessonGroup(groupKey)}
                      className="flex w-full items-start justify-between gap-3 text-left"
                    >
                      <div>
                        <div className="text-lg font-semibold text-white">
                          {group.courseTitle}
                        </div>
                        <div className="mt-2 text-sm text-slate-400">
                          {group.items.length} lesson
                        </div>
                      </div>

                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        {isGroupOpen ? "▲" : "▼"}
                      </div>
                    </button>

                    <AnimatedBlock open={isGroupOpen}>
                      <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                        {group.items.length ? (
                          group.items.map((lesson, index) => {
                            const isLessonOpen = !!openLessons[lesson.id];

                            return (
                              <div
                                key={lesson.id}
                                className="rounded-2xl border border-white/10 bg-black/20 p-4"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleLesson(lesson.id)}
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
                                      {isLessonOpen ? "▲" : "▼"}
                                    </span>
                                  </div>
                                </button>

                                <AnimatedBlock open={isLessonOpen}>
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
                            Lesson алга байна.
                          </div>
                        )}
                      </div>
                    </AnimatedBlock>
                  </div>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 p-5 text-slate-400">
                Lesson алга байна.
              </div>
            )}
          </div>
        </AnimatedBlock>
      </section>
    </div>
  );
}