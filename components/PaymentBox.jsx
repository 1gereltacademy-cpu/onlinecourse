"use client";

import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function PaymentBox({ courseId, amountMnt }) {
  const supabase = getSupabaseBrowser();

  async function createOrder() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Эхлээд нэвтэрнэ үү");
      return;
    }

    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ courseId, amountMnt }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Алдаа гарлаа");
      return;
    }

    alert("Захиалга үүслээ. Admin approve хийсний дараа курс нээгдэнэ.");
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-xl font-semibold">Төлбөр</h3>
      <p className="mt-2 text-slate-300">Үнэ: {Number(amountMnt || 0).toLocaleString()}₮</p>
      <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
        Энд QPay QR, банкны QR, эсвэл картын төлбөрийн widget байрлуулна.
      </div>
      <button onClick={createOrder} className="mt-4 rounded-2xl bg-white px-4 py-2 text-slate-900">
        Төлбөрийн захиалга үүсгэх
      </button>
    </div>
  );
}
