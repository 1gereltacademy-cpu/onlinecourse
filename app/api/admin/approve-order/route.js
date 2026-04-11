import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req) {
  const formData = await req.formData();
  const orderId = formData.get("orderId");

  const supabase = getSupabaseServer();

  const { data: order, error: orderError } = await supabase
    .from("payment_orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 400 });
  }

  const { error: enrollmentError } = await supabase
    .from("enrollments")
    .upsert({
      user_id: order.user_id,
      course_id: order.course_id,
      payment_status: "paid",
    });

  if (enrollmentError) {
    return NextResponse.json({ error: enrollmentError.message }, { status: 400 });
  }

  return NextResponse.redirect(new URL("/admin", req.url));
}
