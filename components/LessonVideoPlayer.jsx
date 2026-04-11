export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

import AdminLessonOrderButtons from "@/components/AdminLessonOrderButtons";
import AdminCreateCourseForm from "@/components/AdminCreateCourseForm";
import AdminCreateLessonForm from "@/components/AdminCreateLessonForm";
import AdminEditCourseForm from "@/components/AdminEditCourseForm";
import AdminEditLessonForm from "@/components/AdminEditLessonForm";
import AdminDeleteCourseButton from "@/components/AdminDeleteCourseButton";
import AdminDeleteLessonButton from "@/components/AdminDeleteLessonButton";
import ApprovePaymentButton from "@/components/ApprovePaymentButton";
import DeletePaymentButton from "@/components/DeletePaymentButton";
import AdminLogoutButton from "@/components/AdminLogoutButton";

export default async function AdminPage() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) redirect("/login");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const userEmail = user.email;

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*, courses(id,title)")
    .order("position", { ascending: true });

  const { data: paymentOrders } = await supabase
    .from("payment_orders")
    .select("*, courses(title)")
    .order("created_at", { ascending: false });

  const { data: users } = await supabase.from("profiles").select("*");

  const totalCourses = courses?.length || 0;
  const totalUsers = users?.length || 0;
  const totalRevenue =
    paymentOrders?.reduce((sum, p) => sum + (p.amount_mnt || 0), 0) || 0;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Admin Panel</h1>
            <p className="text-slate-400">{userEmail}</p>
          </div>

          <div className="flex gap-3">
            <Link href="/" className="rounded-2xl border px-4 py-2">
              Нүүр
            </Link>
            <AdminLogoutButton />
          </div>
        </div>

        {/* Analytics */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="bg-white/5 p-5 rounded-2xl">
            <div className="text-sm text-slate-400">Courses</div>
            <div className="text-3xl font-bold">{totalCourses}</div>
          </div>

          <div className="bg-white/5 p-5 rounded-2xl">
            <div className="text-sm text-slate-400">Users</div>
            <div className="text-3xl font-bold">{totalUsers}</div>
          </div>

          <div className="bg-white/5 p-5 rounded-2xl">
            <div className="text-sm text-slate-400">Revenue</div>
            <div className="text-3xl font-bold">
              {totalRevenue.toLocaleString()}₮
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-2xl font-semibold">Course нэмэх</h2>
            <AdminCreateCourseForm />
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-2xl font-semibold">Lesson нэмэх</h2>
            <AdminCreateLessonForm courses={courses || []} />
          </section>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-2xl font-semibold">Courses</h2>

            <div className="mt-4 space-y-4">
              {courses?.map((course) => (
                <div key={course.id} className="rounded-2xl bg-slate-900/60 p-4">
                  <div className="font-semibold">{course.title}</div>

                  <div className="mt-3">
                    <AdminEditCourseForm course={course} />
                  </div>

                  <div className="mt-3">
                    <AdminDeleteCourseButton courseId={course.id} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-2xl font-semibold">Lessons</h2>

            <div className="mt-4 space-y-4">
              {lessons?.map((lesson) => (
                <div key={lesson.id} className="rounded-2xl bg-slate-900/60 p-4">
                  <div className="font-semibold">{lesson.title}</div>
                  <div className="text-sm text-slate-400">
                    Course: {lesson.courses?.title}
                  </div>

                  <div className="mt-2">
                    <AdminLessonOrderButtons lesson={lesson} />
                  </div>

                  <div className="mt-3">
                    <AdminEditLessonForm lesson={lesson} />
                  </div>

                  <div className="mt-3">
                    <AdminDeleteLessonButton lessonId={lesson.id} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-2xl font-semibold">Payment</h2>

          <div className="mt-4 space-y-4">
            {paymentOrders?.map((order) => (
              <div key={order.id} className="rounded-2xl bg-slate-900/60 p-4">
                <div className="font-semibold">{order.courses?.title}</div>
                <div>{order.amount_mnt}₮</div>
                <div>Status: {order.status}</div>

                <div className="mt-3 flex gap-3">
                  {order.status === "pending" && (
                    <ApprovePaymentButton orderId={order.id} />
                  )}

                  <DeletePaymentButton orderId={order.id} />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
