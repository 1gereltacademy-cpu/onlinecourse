export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

async function getAdminSupabase() {
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("profile fetch error:", profileError.message);
  }

  if (!profile || profile.role !== "admin") redirect("/");

  return { supabase, user, profile };
}

async function updateUserAccess(formData) {
  "use server";

  const { supabase } = await getAdminSupabase();

  const userId = String(formData.get("user_id") || "");
  const role = String(formData.get("role") || "user");
  const accessExpiresAtRaw = String(formData.get("access_expires_at") || "");

  const payload = {
    role,
    access_expires_at: accessExpiresAtRaw
      ? new Date(`${accessExpiresAtRaw}T23:59:59`).toISOString()
      : null,
  };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId);

  if (error) {
    console.error("update user access error:", error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

async function deleteUserCompletely(formData) {
  "use server";

  const { user } = await getAdminSupabase();
  const userId = String(formData.get("user_id") || "");

  if (!userId || userId === user.id) {
    console.error("delete blocked: invalid user or self delete");
    return;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY байхгүй байна");
    return;
  }

  try {
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey
    );

    await adminSupabase.from("payment_orders").delete().eq("user_id", userId);
    await adminSupabase.from("enrollments").delete().eq("user_id", userId);
    await adminSupabase.from("profiles").delete().eq("id", userId);

    const { error: authDeleteError } =
      await adminSupabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("auth delete error:", authDeleteError.message);
    }
  } catch (error) {
    console.error("delete user completely error:", error);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

export default async function AdminUsersPage() {
  const { supabase, user } = await getAdminSupabase();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, name, email, phone, register_number, role, access_expires_at")
    .order("name", { ascending: true });

  const totalUsers = users?.length || 0;
  const activeUsers =
    users?.filter((u) => {
      if (!u.access_expires_at) return true;
      return new Date(u.access_expires_at).getTime() >= Date.now();
    }).length || 0;

  const expiredUsers =
    users?.filter((u) => {
      if (!u.access_expires_at) return false;
      return new Date(u.access_expires_at).getTime() < Date.now();
    }).length || 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_24%),linear-gradient(to_bottom,#020617,#0f172a,#020617)]" />

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-300">
                User management
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
                Хэрэглэгчдийн
                <span className="block text-indigo-400">удирдлага</span>
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                Хэрэглэгчдийн эрх, admin/user role, эрхийн дуусах хугацаа,
                мөн бүрэн устгах үйлдлийг эндээс удирдана.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
              >
                ← Admin руу буцах
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
              <div className="text-sm text-slate-400">Нийт хэрэглэгч</div>
              <div className="mt-2 text-3xl font-bold text-white">{totalUsers}</div>
            </div>

            <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-400/10 p-5 backdrop-blur">
              <div className="text-sm text-emerald-200">Active</div>
              <div className="mt-2 text-3xl font-bold text-white">{activeUsers}</div>
            </div>

            <div className="rounded-[28px] border border-rose-400/20 bg-rose-400/10 p-5 backdrop-blur">
              <div className="text-sm text-rose-200">Expired</div>
              <div className="mt-2 text-3xl font-bold text-white">{expiredUsers}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-xl backdrop-blur">
          <div className="space-y-4">
            {users?.length ? (
              users.map((item, index) => {
                const isExpired = item.access_expires_at
                  ? new Date(item.access_expires_at).getTime() < Date.now()
                  : false;

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-white/10 bg-slate-900/60 p-5"
                  >
                    <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          User {index + 1}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-white">
                          {item.name || "Нэр оруулаагүй"}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {item.phone ? (
                            <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                              {item.phone}
                            </span>
                          ) : null}

                          {item.email ? (
                            <span className="break-all rounded-full bg-white/10 px-3 py-1 text-slate-200">
                              {item.email}
                            </span>
                          ) : (
                            <span className="rounded-full bg-white/10 px-3 py-1 text-slate-400">
                              Email байхгүй
                            </span>
                          )}

                          {item.register_number ? (
                            <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                              {item.register_number}
                            </span>
                          ) : null}

                          <span
                            className={`rounded-full px-3 py-1 ${
                              item.role === "admin"
                                ? "bg-amber-500/20 text-amber-200"
                                : "bg-emerald-500/20 text-emerald-200"
                            }`}
                          >
                            {item.role}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 ${
                              isExpired
                                ? "bg-rose-500/20 text-rose-200"
                                : "bg-sky-500/20 text-sky-200"
                            }`}
                          >
                            {isExpired ? "Expired" : "Active"}
                          </span>

                          {item.id === user.id ? (
                            <span className="rounded-full bg-white/10 px-3 py-1 text-slate-300">
                              Та өөрөө
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                        Эрхийн дуусах хугацаа:{" "}
                        <span className="font-medium text-white">
                          {item.access_expires_at
                            ? new Date(item.access_expires_at).toLocaleDateString()
                            : "Тохируулаагүй"}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
                      <form
                        action={updateUserAccess}
                        className="grid gap-4 xl:grid-cols-[1fr_220px_220px_150px]"
                      >
                        <input type="hidden" name="user_id" value={item.id} />

                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                          {item.name || "Нэргүй хэрэглэгч"}
                        </div>

                        <select
                          name="role"
                          defaultValue={item.role || "user"}
                          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>

                        <input
                          type="date"
                          name="access_expires_at"
                          defaultValue={
                            item.access_expires_at
                              ? new Date(item.access_expires_at)
                                  .toISOString()
                                  .slice(0, 10)
                              : ""
                          }
                          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                        />

                        <button
                          type="submit"
                          className="rounded-2xl bg-white px-5 py-3 font-medium text-slate-900 transition hover:scale-[1.01]"
                        >
                          Хадгалах
                        </button>
                      </form>

                      {item.id !== user.id ? (
                        <form action={deleteUserCompletely}>
                          <input type="hidden" name="user_id" value={item.id} />
                          <button
                            type="submit"
                            className="w-full rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-3 font-medium text-rose-300 transition hover:bg-rose-400/15 xl:w-auto"
                          >
                            Бүр мөсөн устгах
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-500 xl:w-auto"
                        >
                          Өөрийгөө устгахгүй
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 p-5 text-slate-400">
                Хэрэглэгч алга байна.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
