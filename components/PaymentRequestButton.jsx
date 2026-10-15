
"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function PaymentRequestButton({
  userId,
  courseId,
  amountMnt,
}) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingOrder, setExistingOrder] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadExistingRequest() {
      if (!userId || !courseId) {
        setExistingOrder(null);
        setChecking(false);
        return;
      }

      try {
        setChecking(true);
        setErrorMessage("");

        const supabase = getSupabaseBrowser();

        const { data, error } = await supabase
          .from("payment_orders")
          .select("id, status")
          .eq("user_id", userId)
          .eq("course_id", courseId)
          .in("status", ["pending", "approved", "paid"])
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (!cancelled) {
          setExistingOrder(data || null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message || "Хүсэлт шалгахад алдаа гарлаа.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    loadExistingRequest();

    return () => {
      cancelled = true;
    };
  }, [userId, courseId]);

  async function handleCreateRequest() {
    if (loading || checking || !userId || !courseId) return;

    try {
      setLoading(true);
      setErrorMessage("");

      const supabase = getSupabaseBrowser();

      const { data: alreadyExists, error: checkError } = await supabase
        .from("payment_orders")
        .select("id, status")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .in("status", ["pending", "approved", "paid"])
        .limit(1)
        .maybeSingle();

      if (checkError) throw checkError;

      if (alreadyExists) {
        setExistingOrder(alreadyExists);
        return;
      }

      const { data, error } = await supabase
        .from("payment_orders")
        .insert({
          user_id: userId,
          course_id: courseId,
          amount_mnt: amountMnt || 0,
          status: "pending",
        })
        .select("id, status")
        .single();

      if (error) throw error;

      setExistingOrder(data);
    } catch (error) {
      console.error("Payment request error:", error);
      setErrorMessage(
        error.message || "Төлбөрийн хүсэлт үүсгэхэд алдаа гарлаа."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelRequest() {
    if (!existingOrder || loading) return;

    try {
      setLoading(true);
      setErrorMessage("");

      const supabase = getSupabaseBrowser();

      const { error } = await supabase
        .from("payment_orders")
        .delete()
        .eq("id", existingOrder.id)
        .eq("user_id", userId)
        .eq("status", "pending");

      if (error) throw error;

      setExistingOrder(null);
    } catch (error) {
      console.error("Cancel payment request error:", error);
      setErrorMessage(error.message || "Хүсэлт цуцлахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  if (!userId) {
    return <div>Нэвтэрсний дараа төлбөрөө төлөөрэй</div>;
  }

  if (checking) {
    return <div>Хүсэлтийг шалгаж байна...</div>;
  }

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {existingOrder ? (
        <>
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              ["approved", "paid"].includes(existingOrder.status)
                ? "bg-emerald-500/20 text-emerald-200"
                : "bg-amber-500/20 text-amber-200"
            }`}
          >
            {["approved", "paid"].includes(existingOrder.status)
              ? "✅ Төлбөр баталгаажсан"
              : "⏳ Хүсэлт илгээгдсэн"}
          </div>

          {existingOrder.status === "pending" && (
            <button
              onClick={handleCancelRequest}
              disabled={loading}
              className="rounded-2xl bg-red-500 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Түр хүлээнэ үү..." : "❌ Хүсэлт цуцлах"}
            </button>
          )}
        </>
      ) : (
        <button
          onClick={handleCreateRequest}
          disabled={loading}
          className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900 disabled:opacity-50"
        >
          {loading ? "Илгээж байна..." : "Төлбөрийн хүсэлт үүсгэх"}
        </button>
      )}
    </div>
  );
}
