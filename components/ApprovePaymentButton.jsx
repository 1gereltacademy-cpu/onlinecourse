"use client";

export default function ApprovePaymentButton({ orderId }) {
  async function handleApprove() {
    const res = await fetch("/api/admin/approve-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order_id: orderId }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Approve алдаа");
      return;
    }

    alert("Payment баталгаажлаа");
    location.reload();
  }

  return (
    <button
      onClick={handleApprove}
      className="rounded-2xl bg-emerald-500 px-4 py-2 text-white"
    >
      Approve
    </button>
  );
}