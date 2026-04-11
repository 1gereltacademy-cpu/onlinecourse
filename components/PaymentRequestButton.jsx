"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function PaymentRequestButton({
  userId,
  courseId,
  amountMnt,
}) {
  const supabase = getSupabaseBrowser();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingOrder, setExistingOrder] = useState(null);

  const startedRef = useRef(false);

  useEffect(() => {
    if (!userId || !courseId) {
      setExistingOrder(null);
      setChecking(false);
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    async function loadExistingRequest() {
      try {
        setChecking(true);

        const { data } = await supabase
          .from("payment_orders")
          .select("id, status")
          .eq("user_id", userId)
          .eq("course_id", courseId)
          .in("status", ["pending", "approved", "paid"])
          .limit(1)
          .maybeSingle();

        setExistingOrder(data || null);
      } finally {
        setChecking(false);
      }
    }

    loadExistingRequest();
  }, [userId, courseId, supabase]);

  async function handleCreateRequest() {
    if (loading || checking) return;

    try {
      setLoading(true);

      const { data: alreadyExists } = await supabase
        .from("payment_orders")
        .select("id, status")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .in("status", ["pending", "approved", "paid"])
        .limit(1)
        .maybeSingle();

      if (alreadyExists) {
        setExistingOrder(alreadyExists);
        return;
      }

      const { data } = await supabase
        .from("payment_orders")
        .insert({
          user_id: userId,
          course_id: courseId,
          amount_mnt: amountMnt || 0,
          status: "pending",
        })
        .select()
        .single();

      setExistingOrder(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelRequest() {
    if (!existingOrder) return;

    try {
      setLoading(true);

      await supabase
        .from("payment_orders")
        .delete()
        .eq("id", existingOrder.id);

      setExistingOrder(null);
    } finally {
      setLoading(false);
    }
  }

  if (!userId) {
    return <div>Нэвтэрсний дараа төлбөрөө төлөөрэй</div>;
  }

  if (checking) {
    return <div>Шалгаж байна...</div>;
  }

  if (existingOrder) {
    const isPaid =
      existingOrder.status === "approved" || existingOrder.status === "paid";

    return (
      <div className="space-y-3">
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            isPaid
              ? "bg-emerald-500/20 text-emerald-200"
              : "bg-amber-500/20 text-amber-200"
          }`}
        >
          {isPaid ? "✅ Төлбөр баталгаажсан" : "⏳ Хүсэлт илгээгдсэн"}
        </div>

        {!isPaid && (
          <button
            onClick={handleCancelRequest}
            className="rounded-2xl bg-red-500 px-4 py-2 text-white"
          >
            ❌ Хүсэлт цуцлах
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleCreateRequest}
      disabled={loading}
      className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900"
    >
      {loading ? "Илгээж байна..." : "Төлбөрийн хүсэлт үүсгэх"}
    </button>
  );
}
