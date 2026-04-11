
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import AdminPaymentsClient from "@/components/AdminPaymentsClient";

export default async function AdminPaymentsPage() {
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

  const { data: paymentOrders } = await supabase
    .from("payment_orders")
    .select("*, courses(title)")
    .order("created_at", { ascending: false });

  const userIds = [...new Set((paymentOrders || []).map((x) => x.user_id).filter(Boolean))];

  let profiles = [];
  if (userIds.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, register_number")
      .in("id", userIds);

    profiles = data || [];
  }

  return (
    <AdminPaymentsClient
      initialOrders={paymentOrders || []}
      initialProfiles={profiles || []}
    />
  );
}
