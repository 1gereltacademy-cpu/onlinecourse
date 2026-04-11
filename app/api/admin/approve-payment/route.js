import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req) {
  const { order_id } = await req.json();
  const supabase = getSupabaseServer();

  const { data: order, error: orderError } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("id", order_id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { error: updateOrderError } = await supabase
    .from("payment_orders")
    .update({ status: "paid" })
    .eq("id", order_id);

  if (updateOrderError) {
    return NextResponse.json({ error: updateOrderError.message }, { status: 400 });
  }

  const { error: enrollmentError } = await supabase
    .from("enrollments")
    .upsert(
      {
        user_id: order.user_id,
        course_id: order.course_id,
        payment_status: "paid",
      },
      { onConflict: "user_id,course_id" }
    );

  if (enrollmentError) {
    return NextResponse.json({ error: enrollmentError.message }, { status: 400 });
  }

  revalidatePath("/admin");
  revalidatePath(`/courses/${order.course_id}`);

  return NextResponse.json({ success: true });
}