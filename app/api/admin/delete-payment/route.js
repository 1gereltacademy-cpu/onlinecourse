import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const { orderId } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Payment order авах
  const { data: order } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order олдсонгүй" }, { status: 404 });
  }

  // 2. Screenshot image байвал устгана
  if (order.screenshot_url) {
    try {
      const path = order.screenshot_url.split("/storage/v1/object/public/")[1];

      await supabase.storage
        .from("payments")
        .remove([path]);
    } catch (err) {
      console.log("Image устгах алдаа:", err);
    }
  }

  // 3. DB-с устгах
  const { error } = await supabase
    .from("payment_orders")
    .delete()
    .eq("id", orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
