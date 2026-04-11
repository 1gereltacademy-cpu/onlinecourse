"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useState } from "react";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    try {
      setLoading(true);
      const supabase = getSupabaseBrowser();

      await supabase.auth.signOut();

      document.cookie =
        "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("logout error:", error);
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-3 text-sm text-rose-300 transition hover:bg-rose-400/15 disabled:opacity-60"
    >
      {loading ? "Гарч байна..." : "Гарах"}
    </button>
  );
}
