"use client";

export default function DeletePaymentButton({ orderId }) {
  async function handleDelete() {
    const confirmDelete = confirm("Payment устгах уу?");
    if (!confirmDelete) return;

    const res = await fetch("/api/admin/delete-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Алдаа гарлаа");
      return;
    }

    alert("Payment + зураг устлаа");
    location.reload();
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-xl bg-red-500 px-3 py-1 text-white hover:bg-red-600"
    >
      Remove
    </button>
  );
}
