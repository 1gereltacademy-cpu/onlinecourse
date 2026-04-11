export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminDashboardCollapsible from "@/components/AdminDashboardCollapsible";

async function getAdminSupabase() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  if (!accessToken) redirect("/login");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return { supabase, user, profile };
}

export default async function AdminPage() {
  const { supabase, user, profile } = await getAdminSupabase();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  const { data: lessons } = await supabase.from("lessons").select("*, courses(id,title)").order("position", { ascending: true });
  const { data: paymentOrders } = await supabase.from("payment_orders").select("*, courses(title)").order("created_at", { ascending: false });
  const { data: users } = await supabase.from("profiles").select("id, full_name, phone, register_number, role, access_expires_at").order("full_name", { ascending: true });

  const totalRevenue =
    paymentOrders?.reduce((sum, p) => sum + ((p.status === "approved" || p.status === "paid") ? Number(p.amount_mnt || 0) : 0), 0) || 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_24%),linear-gradient(to_bottom,#020617,#0f172a,#020617)]" />
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-300">Admin dashboard</div>
              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Хяналтын<span className="block text-indigo-400">самбар</span></h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">Course, lesson, төлбөр, хэрэглэгч болон эрхийн хугацааг нэг дэлгэцээс удирдана.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <div className="text-xs text-slate-400">Админ</div>
                  <div className="mt-1 break-words font-medium text-white">{profile?.full_name || "Admin"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <div className="text-xs text-slate-400">И-мэйл</div>
                  <div className="mt-1 break-all font-medium text-white">{user.email}</div>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link href="/" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm text-white transition hover:bg-white/10">Нүүр хуудас</Link>
              <Link href="/admin/payments" className="rounded-2xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-center text-sm text-sky-300 transition hover:bg-sky-400/15">Төлбөрүүд</Link>
              <AdminLogoutButton />
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Card label="Courses" value={courses?.length || 0} />
            <Card label="Lessons" value={lessons?.length || 0} />
            <Link href="/admin/users" className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur transition hover:bg-white/[0.08]">
              <div className="text-sm text-slate-400">Users</div>
              <div className="mt-2 text-3xl font-bold text-white">{users?.length || 0}</div>
            </Link>
            <Card label="Pending payments" value={paymentOrders?.filter((p)=>p.status==="pending").length || 0} accent="amber" />
            <Card label="Revenue" value={`${totalRevenue.toLocaleString()}₮`} accent="green" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <AdminDashboardCollapsible courses={courses || []} lessons={lessons || []} />
      </section>
    </main>
  );
}

function Card({ label, value, accent = "default" }) {
  const box = accent === "amber" ? "border-amber-400/20 bg-amber-400/10" : accent === "green" ? "border-emerald-400/20 bg-emerald-400/10" : "border-white/10 bg-white/[0.05]";
  const text = accent === "amber" ? "text-amber-200" : accent === "green" ? "text-emerald-200" : "text-slate-400";
  return <div className={`rounded-[28px] border p-5 backdrop-blur ${box}`}><div className={`text-sm ${text}`}>{label}</div><div className="mt-2 break-words text-3xl font-bold text-white">{value}</div></div>;
}
