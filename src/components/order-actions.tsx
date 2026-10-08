"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/utils";

export function OrderActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function cancel() {
    if (!confirm("Yakin ingin membatalkan pesanan ini?")) return;
    setLoading(true);
    const { error } = await createClient().rpc("cancel_order", { p_order_id: orderId, p_reason: "Dibatalkan oleh pembeli" });
    setLoading(false);
    if (error) return toast.error(errorMessage(error));
    toast.success("Pesanan dibatalkan");
    router.refresh();
  }

  return (
    <>
      <button onClick={() => router.refresh()} className="btn-ghost px-3 py-3 sm:px-4">
        <RefreshCw className="size-4" /> Cek Status
      </button>
      <button onClick={cancel} disabled={loading} className="btn-danger px-3 py-3 sm:px-4">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} Batalkan
      </button>
    </>
  );
}
