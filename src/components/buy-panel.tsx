"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Lock, Minus, Plus, Receipt, ShieldCheck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";
import { discountPercent, errorMessage, formatRupiah, orderWhatsappMessage, whatsappLink } from "@/lib/utils";
import { Modal } from "./ui/modal";
import { WhatsappIcon } from "./whatsapp-icon";

type Props = {
  product: { id: string; name: string; slug: string; price: number; original_price: number | null; stock_count: number };
  user: { name: string | null; email: string | null } | null;
};

export function BuyPanel({ product, user }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const maxQty = Math.min(product.stock_count, 20);
  const soldOut = product.stock_count <= 0;
  const disc = discountPercent(product.price, product.original_price);
  const total = product.price * qty;

  async function checkout() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setLoading(true);
    const { data, error } = await createClient().rpc("create_order", {
      p_product_id: product.id,
      p_quantity: qty,
      p_note: note || null,
    });
    setLoading(false);
    if (error) {
      toast.error(errorMessage(error));
      return;
    }
    setOrder(data as Order);
    router.refresh();
  }

  const waUrl = order ? whatsappLink(orderWhatsappMessage(order, { name: user?.name, email: user?.email })) : "#";

  return (
    <>
      <div id="beli" className="relative scroll-mt-20 overflow-hidden rounded-2xl glass p-5 shadow-2xl shadow-black/30 sm:rounded-3xl sm:p-6">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <p className="relative text-sm text-white/50">Harga</p>
        <div className="relative mt-1 flex items-end gap-3">
          <span className="font-display text-3xl font-bold text-white sm:text-4xl">{formatRupiah(product.price)}</span>
          {disc > 0 && (
            <span className="mb-1.5 rounded-lg bg-pink-500/15 px-2 py-0.5 text-xs font-bold text-pink-300">-{disc}%</span>
          )}
        </div>
        {disc > 0 && <p className="relative mt-1 text-sm text-white/35 line-through">{formatRupiah(product.original_price!)}</p>}

        <div className="relative mt-5 space-y-4 sm:mt-6">
          <div>
            <label className="label">Jumlah</label>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04]">
                <button
                  type="button"
                  disabled={qty <= 1 || soldOut}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid size-11 place-items-center text-white/70 hover:text-white disabled:opacity-30"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center font-semibold text-white">{qty}</span>
                <button
                  type="button"
                  disabled={qty >= maxQty || soldOut}
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  className="grid size-11 place-items-center text-white/70 hover:text-white disabled:opacity-30"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <span className="text-sm text-white/45">Stok tersedia: {product.stock_count}</span>
            </div>
          </div>

          <div>
            <label className="label">Catatan (opsional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Contoh: minta profil nomor 2"
              className="input resize-none"
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-sm text-white/60">Total Bayar</span>
            <span className="font-display text-2xl font-bold text-gradient">{formatRupiah(total)}</span>
          </div>

          {soldOut ? (
            <button disabled className="btn-ghost w-full py-3.5">
              Stok Habis
            </button>
          ) : user ? (
            <button onClick={checkout} disabled={loading} className="btn-primary w-full py-3.5 text-base">
              {loading ? <Loader2 className="size-5 animate-spin" /> : <ShoppingBag className="size-5" />}
              {loading ? "Memproses..." : "Beli Sekarang"}
            </button>
          ) : (
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn-primary w-full py-3.5 text-base">
              <Lock className="size-5" /> Masuk untuk Membeli
            </Link>
          )}

          {!user && !soldOut && (
            <p className="text-center text-xs text-white/45">
              Belum punya akun?{" "}
              <Link href={`/register?next=${encodeURIComponent(pathname)}`} className="font-semibold text-fuchsia-300 hover:underline">
                Daftar gratis
              </Link>
            </p>
          )}

          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/[0.07] px-3 py-2.5 text-xs text-emerald-300/90">
            <ShieldCheck className="size-4" /> Transaksi aman & bergaransi
          </div>
        </div>
      </div>

      <Modal open={!!order} onClose={() => setOrder(null)} title="Pesanan Berhasil Dibuat" size="sm">
        {order && (
          <div className="text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/15 ring-8 ring-emerald-500/5">
              <CheckCircle2 className="size-9 text-emerald-400" />
            </div>
            <p className="mt-4 text-sm text-white/60">Kode pesanan kamu</p>
            <p className="mt-1 font-mono text-xl font-bold tracking-wider text-white">{order.order_code}</p>

            <div className="mt-5 space-y-2 rounded-2xl bg-white/[0.04] p-4 text-left text-sm">
              <Row label="Produk" value={order.product_name} />
              <Row label="Jumlah" value={`${order.quantity}x`} />
              <Row label="Total" value={formatRupiah(order.total)} strong />
            </div>

            <p className="mt-5 text-sm text-white/55">
              Lanjutkan pembayaran ke WhatsApp admin. Akun akan dikirim ke menu <b className="text-white">Pesanan Saya</b> setelah
              pembayaran dikonfirmasi.
            </p>

            <div className="mt-6 grid gap-2">
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-wa w-full py-3.5 text-base">
                <WhatsappIcon className="size-5" /> Bayar via WhatsApp
              </a>
              <Link href={`/orders/${order.id}`} className="btn-ghost w-full py-3">
                <Receipt className="size-4" /> Lihat Detail Pesanan
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/50">{label}</span>
      <span className={strong ? "font-bold text-white" : "text-right text-white/85"}>{value}</span>
    </div>
  );
}
