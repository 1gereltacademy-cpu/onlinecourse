import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = getSupabaseServer();

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const { course_id, amount_mnt } = body;

  const { data, error } = await supabase
    .from("payment_orders")
    .insert({
      user_id: user.id,
      course_id,
      amount_mnt,
      provider: "manual",
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase
    .from("enrollments")
    .upsert(
      {
        user_id: user.id,
        course_id,
        payment_status: "pending",
      },
      { onConflict: "user_id,course_id" }
    );

  return NextResponse.json({ order: data });
}