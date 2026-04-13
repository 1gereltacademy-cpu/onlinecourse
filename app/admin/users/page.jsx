export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

async function getAdminSupabase() {
  const cookieStore = await cookies();
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
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/");

  return { supabase, user, profile };
}

function chunkArray(items, size) {
  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

async function removeUserStorageObjects(adminSupabase, userId) {
  const bucketsToClean = ["videos", "images", "thumbnails", "avatars", "course-files"];

  for (const bucket of bucketsToClean) {
    try {
      const prefixes = [userId, `${userId}/`, `users/${userId}`, `users/${userId}/`];
      const pathsToRemove = new Set();

      for (const prefix of prefixes) {
        const normalizedPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;

        const { data: objects, error: listError } = await adminSupabase.storage
          .from(bucket)
          .list(normalizedPrefix, {
            limit: 1000,
            offset: 0,
          });

        if (listError) {
          continue;
        }

        for (const object of objects || []) {
          if (!object?.name) continue;
          const basePath = normalizedPrefix ? `${normalizedPrefix}/${object.name}` : object.name;
          pathsToRemove.add(basePath);
        }
      }

      const removablePaths = Array.from(pathsToRemove);

      for (const group of chunkArray(removablePaths, 100)) {
        const { error: removeError } = await adminSupabase.storage.from(bucket).remove(group);

        if (removeError) {
          console.error(`storage remove error [${bucket}]:`, removeError.message);
        }
      }
    } catch (error) {
      console.error(`storage cleanup error [${bucket}]:`, error);
    }
  }
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

  const { error } = await supabase.from("profiles").update(payload).eq("id", userId);

  if (error) {
    console.error("update user access error:", error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

async function deleteUserCompletely(formData) {
  "use server";

  const { user } = await getAdminSupabase();

  const userId = String(formData.get("user_id") || "").trim();

  if (!userId || userId === user.id) {
    console.error("delete blocked: invalid user or self delete");
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL эсвэл SUPABASE_SERVICE_ROLE_KEY байхгүй байна.");
    return;
  }

  try {
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // 1) Storage cleanup
    await removeUserStorageObjects(adminSupabase, userId);

    // 2) User-тэй холбоотой app data цэвэрлэх
    const tablesToDelete = [
      { table: "payment_orders", column: "user_id" },
      { table: "enrollments", column: "user_id" },
      { table: "payment_requests", column: "user_id" },
      { table: "profiles", column: "id" },
    ];

    for (const item of tablesToDelete) {
      const { error } = await adminSupabase.from(item.table).delete().eq(item.column, userId);

      if (error) {
        console.error(`${item.table} delete error:`, error.message);
      }
    }

    // 3) Хамгийн сүүлд auth user устгана
    const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("auth delete error:", authDeleteError.message);
      return;
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
    .select("id, full_name, email, phone, register_number, role, access_expires_at")
    .order("full_name", { ascending: true });

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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-300">
                User management
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Хэрэглэгчдийн
                <span className="block text-indigo-400">удирдлага</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
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
            <StatCard label="Нийт хэрэглэгч" value={totalUsers} />
            <StatCard label="Active" value={activeUsers} tone="green" />
            <StatCard label="Expired" value={expiredUsers} tone="rose" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-4 shadow-xl backdrop-blur sm:rounded-[32px] sm:p-6">
          <div className="space-y-4">
            {users?.length ? (
              users.map((item, index) => {
                const isExpired = item.access_expires_at
                  ? new Date(item.access_expires_at).getTime() < Date.now()
                  : false;

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 sm:p-5"
                  >
                    <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          User {index + 1}
                        </div>
                        <div className="mt-1 break-words text-lg font-semibold text-white">
                          {item.full_name || "Нэр оруулаагүй"}
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

                    <div className="grid gap-4">
                      <form
                        action={updateUserAccess}
                        className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px_150px]"
                      >
                        <input type="hidden" name="user_id" value={item.id} />

                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                          {item.full_name || "Нэргүй хэрэглэгч"}
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

function StatCard({ label, value, tone = "default" }) {
  const toneClasses =
    tone === "green"
      ? "border-emerald-400/20 bg-emerald-400/10"
      : tone === "rose"
      ? "border-rose-400/20 bg-rose-400/10"
      : "border-white/10 bg-white/[0.05]";

  const textClasses =
    tone === "green"
      ? "text-emerald-200"
      : tone === "rose"
      ? "text-rose-200"
      : "text-slate-400";

  return (
    <div className={`rounded-[28px] border p-5 backdrop-blur ${toneClasses}`}>
      <div className={`text-sm ${textClasses}`}>{label}</div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
    </div>
  );
  
}
