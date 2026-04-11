"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ApprovePaymentButton from "@/components/ApprovePaymentButton";
import DeletePaymentButton from "@/components/DeletePaymentButton";

function StatCard({ title, value, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-3xl border p-5 text-left transition ${active ? "border-sky-400/40 bg-sky-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
      <div className="text-sm text-slate-400">{title}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </button>
  );
}

export default function AdminPaymentsClient({ initialOrders = [], initialProfiles = [] }) {
  const [filter, setFilter] = useState("all");

  const profileMap = useMemo(() => {
    const map = {};
    for (const item of initialProfiles) map[item.id] = item;
    return map;
  }, [initialProfiles]);

  const allOrders = initialOrders;
  const pendingOrders = allOrders.filter((x) => x.status === "pending");
  const approvedOrders = allOrders.filter((x) => x.status === "approved" || x.status === "paid");

  const filteredOrders = filter === "pending" ? pendingOrders : filter === "approved" ? approvedOrders : allOrders;
  const filterTitle = filter === "pending" ? "Хүлээгдэж буй хүсэлтүүд" : filter === "approved" ? "Баталгаажсан хүсэлтүүд" : "Бүх хүсэлтүүд";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Payment Requests</h1>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">Төлбөрийн хүсэлтүүдийг тусад нь харах хэсэг</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10">← Admin руу буцах</Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard title="Нийт хүсэлт" value={allOrders.length} active={filter === "all"} onClick={() => setFilter("all")} />
          <StatCard title="Хүлээгдэж буй" value={pendingOrders.length} active={filter === "pending"} onClick={() => setFilter("pending")} />
          <StatCard title="Баталгаажсан" value={approvedOrders.length} active={filter === "approved"} onClick={() => setFilter("approved")} />
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold sm:text-2xl">Payment жагсаалт</h2>
            <div className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-slate-300">{filterTitle}</div>
          </div>

          <div className="mt-4 space-y-4">
            {filteredOrders.length ? filteredOrders.map((order) => {
              const sender = profileMap[order.user_id] || null;
              return (
                <div key={order.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="break-words text-lg font-semibold">{order.courses?.title || "Course олдсонгүй"}</div>
                      <div className="text-sm text-slate-300">Нэр: {sender?.full_name || "-"}</div>
                      <div className="break-all text-sm text-slate-300">И-мэйл: {sender?.email || "-"}</div>
                      <div className="text-sm text-slate-300">Утас: {sender?.phone || "-"}</div>
                      <div className="text-sm text-slate-300">Регистр: {sender?.register_number || "-"}</div>
                      <div className="pt-2 text-sm text-slate-400">Amount: {Number(order.amount_mnt || 0).toLocaleString()}₮</div>
                      <div className="text-sm text-slate-400">Status: {order.status}</div>
                      {order.created_at ? <div className="text-sm text-slate-400">Огноо: {new Date(order.created_at).toLocaleString()}</div> : null}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      {order.status === "pending" ? <ApprovePaymentButton orderId={order.id} /> : <div className="rounded-2xl bg-emerald-500/20 px-4 py-2 text-center text-sm text-emerald-200">Баталгаажсан</div>}
                      <DeletePaymentButton orderId={order.id} />
                    </div>
                  </div>
                  {order.screenshot_url ? <img src={order.screenshot_url} alt="payment screenshot" className="mt-4 max-h-96 w-full rounded-2xl object-contain" /> : null}
                </div>
              );
            }) : <div className="rounded-2xl border border-dashed border-white/10 p-5 text-slate-400">Энэ хэсэгт мэдээлэл алга байна.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
