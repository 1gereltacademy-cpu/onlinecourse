import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const body = await req.json();

  const browserSafeClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const authHeader = req.headers.get("authorization");
  let user = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data } = await browserSafeClient.auth.getUser(token);
    user = data.user;
  }

  if (!user) {
    return NextResponse.json({ error: "Нэвтэрсэн хэрэглэгч олдсонгүй" }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("payment_orders")
    .insert({
      user_id: user.id,
      course_id: body.courseId,
      amount_mnt: body.amountMnt,
      provider: "manual",
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ order: data });
}
