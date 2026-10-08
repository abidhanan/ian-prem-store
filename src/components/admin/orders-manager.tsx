"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Download, Eye, Loader2, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/ui/copy-button";
import { AppLogo } from "@/components/brand-logo";
import { WhatsappIcon } from "@/components/whatsapp-icon";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import type { AccountStock, Order, OrderStatus } from "@/lib/types";
import { ACCOUNT_FIELDS, cn, errorMessage, formatDate, formatRupiah } from "@/lib/utils";
import { PageHeader } from "./page-header";

type Row = Order & { products: { stock_count: number } | null };

const TABS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
];
const PAGE_SIZE = 15;

export function OrdersManager({ initialStatus }: { initialStatus: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OrderStatus | "all">(
    (["pending", "completed", "cancelled"].includes(initialStatus) ? initialStatus : "all") as OrderStatus | "all"
  );
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState<Row | null>(null);
  const [cancelling, setCancelling] = useState<Row | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);

  const load = useCallback(
    () =>
      supabase
        .from("orders")
        .select("*, profiles(full_name, email, phone), products(stock_count)")
        .order("created_at", { ascending: false })
        .limit(2000)
        .then(({ data, error }) => {
          if (error) toast.error(errorMessage(error));
          setRows((data as Row[]) ?? []);
          setLoading(false);
        }),
    [supabase]
  );

  function reload() {
    setLoading(true);
    load();
  }

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!term) return true;
      return [o.order_code, o.product_name, o.profiles?.full_name, o.profiles?.email, o.profiles?.phone]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term));
    });
  }, [rows, status, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const revenue = filtered.filter((o) => o.status === "completed").reduce((a, o) => a + o.total, 0);

  function exportCsv() {
    const header = ["Kode", "Tanggal", "Pembeli", "Email", "No HP", "Produk", "Qty", "Total", "Status"];
    const lines = filtered.map((o) =>
      [o.order_code, formatDate(o.created_at), o.profiles?.full_name, o.profiles?.email, o.profiles?.phone, o.product_name, o.quantity, o.total, o.status]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `transaksi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const afterChange = () => {
    reload();
    router.refresh();
  };

  return (
    <div>
      <PageHeader
        title="Riwayat Transaksi"
        description="Konfirmasi pembayaran untuk mengirim akun ke pembeli secara otomatis"
        action={
          <>
            <button onClick={reload} className="btn-ghost">
              <RefreshCw className={cn("size-4", loading && "animate-spin")} /> Muat Ulang
            </button>
            <button onClick={exportCsv} className="btn-ghost">
              <Download className="size-4" /> Export CSV
            </button>
          </>
        }
      />

      <div className="card p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {TABS.map((t) => {
              const count = t.key === "all" ? rows.length : rows.filter((o) => o.status === t.key).length;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setStatus(t.key);
                    setPage(1);
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition",
                    status === t.key ? "bg-white text-ink-950" : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs",
                      status === t.key ? "bg-ink-950/10" : t.key === "pending" && count > 0 ? "bg-amber-500 text-amber-950" : "bg-white/10"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative lg:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
            <input value={q} onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }} placeholder="Cari kode, produk, pembeli..." className="input pl-10" />
          </div>
        </div>
        <p className="mt-3 text-xs text-white/40">
          {filtered.length} transaksi • Pendapatan (selesai): <span className="font-semibold text-white/80">{formatRupiah(revenue)}</span>
        </p>
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="divide-y divide-white/[0.05] md:hidden">
          {loading && rows.length === 0 ? (
            <div className="py-14 text-center">
              <Loader2 className="mx-auto size-6 animate-spin text-white/40" />
            </div>
          ) : pageRows.length === 0 ? (
            <p className="py-14 text-center text-sm text-white/40">Tidak ada transaksi</p>
          ) : (
            pageRows.map((o) => (
              <div key={o.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <AppLogo name={o.product_name} className="size-10 rounded-xl" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {o.product_name} <span className="font-normal text-white/45">× {o.quantity}</span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-white/50">{o.profiles?.full_name || o.profiles?.email || "-"}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums text-white">{formatRupiah(o.total)}</p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate font-mono text-[11px] text-white/40">
                    {o.order_code} • {formatDate(o.created_at)}
                  </p>
                  <StatusBadge status={o.status} short className="shrink-0 px-2 py-0.5 text-[11px]" />
                </div>
                {o.status === "pending" && o.products && (
                  <p className={cn("mt-1.5 text-[11px]", o.products.stock_count < o.quantity ? "text-red-300" : "text-emerald-300/80")}>
                    Stok tersedia: {o.products.stock_count}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  {o.status === "pending" && (
                    <>
                      <button onClick={() => setConfirming(o)} className="btn flex-1 bg-emerald-500/15 py-2 text-xs text-emerald-300 hover:bg-emerald-500/25">
                        <Check className="size-3.5" /> Konfirmasi
                      </button>
                      <button onClick={() => setCancelling(o)} className="btn bg-red-500/10 px-3 py-2 text-xs text-red-300 hover:bg-red-500/20">
                        <X className="size-3.5" /> Batal
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setDetail(o)}
                    className={cn("btn bg-white/5 py-2 text-xs text-white/70 hover:bg-white/10", o.status === "pending" ? "px-3" : "flex-1")}
                  >
                    <Eye className="size-3.5" /> Detail
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-5 py-3.5 font-semibold">Pesanan</th>
                <th className="px-5 py-3.5 font-semibold">Pembeli</th>
                <th className="px-5 py-3.5 font-semibold">Produk</th>
                <th className="px-5 py-3.5 font-semibold">Total</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-white/40" />
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-white/40">
                    Tidak ada transaksi
                  </td>
                </tr>
              ) : (
                pageRows.map((o) => (
                  <tr key={o.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-semibold text-white">{o.order_code}</p>
                      <p className="mt-0.5 text-xs text-white/40">{formatDate(o.created_at)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-white/90">{o.profiles?.full_name || "-"}</p>
                      <p className="text-xs text-white/40">{o.profiles?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <AppLogo name={o.product_name} className="size-9 rounded-xl" />
                        <div className="min-w-0">
                          <p className="text-white/85">{o.product_name}</p>
                          <p className="text-xs text-white/40">
                            {o.quantity}x {formatRupiah(o.unit_price)}
                            {o.status === "pending" && o.products && (
                              <span className={cn("ml-2", o.products.stock_count < o.quantity ? "text-red-300" : "text-emerald-300/80")}>
                                • stok {o.products.stock_count}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold tabular-nums text-white">{formatRupiah(o.total)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={o.status} short />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        {o.status === "pending" && (
                          <>
                            <button onClick={() => setConfirming(o)} className="btn bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/25">
                              <Check className="size-3.5" /> Konfirmasi
                            </button>
                            <button onClick={() => setCancelling(o)} className="btn bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/20" title="Batalkan">
                              <X className="size-3.5" />
                            </button>
                          </>
                        )}
                        <button onClick={() => setDetail(o)} className="btn bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10" title="Detail">
                          <Eye className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-xs text-white/50 sm:px-5 sm:text-sm">
            <span>
              Halaman {page} dari {pages}
            </span>
            <div className="flex gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost px-2.5 py-1.5">
                <ChevronLeft className="size-4" />
              </button>
              <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="btn-ghost px-2.5 py-1.5">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal key={confirming?.id ?? "confirm"} order={confirming} onClose={() => setConfirming(null)} onDone={afterChange} />
      <CancelModal key={cancelling?.id ?? "cancel"} order={cancelling} onClose={() => setCancelling(null)} onDone={afterChange} />
      <DetailModal key={detail?.id ?? "detail"} order={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function OrderSummary({ order }: { order: Row }) {
  return (
    <div className="space-y-2 rounded-2xl bg-white/[0.04] p-4 text-sm">
      <SummaryRow label="Kode" value={order.order_code} mono />
      <SummaryRow label="Pembeli" value={`${order.profiles?.full_name ?? "-"} (${order.profiles?.email ?? "-"})`} />
      <SummaryRow label="Produk" value={`${order.product_name} × ${order.quantity}`} />
      <SummaryRow label="Total" value={formatRupiah(order.total)} strong />
    </div>
  );
}

function SummaryRow({ label, value, strong, mono }: { label: string; value: string; strong?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-white/50">{label}</span>
      <span className={cn("text-right", strong ? "font-bold text-white" : "text-white/85", mono && "font-mono")}>{value}</span>
    </div>
  );
}

function ConfirmModal({ order, onClose, onDone }: { order: Row | null; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  if (!order) return null;
  const stock = order.products?.stock_count ?? 0;
  const enough = stock >= order.quantity;

  async function submit() {
    setLoading(true);
    const { error } = await createClient().rpc("confirm_order", { p_order_id: order!.id, p_admin_note: note || null });
    setLoading(false);
    if (error) return toast.error(errorMessage(error));
    toast.success(`Pesanan ${order!.order_code} dikonfirmasi. Akun terkirim ke pembeli ✅`);
    onClose();
    onDone();
  }

  return (
    <Modal open onClose={onClose} title="Konfirmasi Pembayaran" description="Pastikan pembayaran sudah diterima sebelum mengonfirmasi.">
      <OrderSummary order={order} />
      <div
        className={cn(
          "mt-4 rounded-xl px-4 py-3 text-sm ring-1",
          enough ? "bg-emerald-500/10 text-emerald-200 ring-emerald-500/20" : "bg-red-500/10 text-red-200 ring-red-500/20"
        )}
      >
        {enough
          ? `✓ Stok tersedia: ${stock}. ${order.quantity} akun akan otomatis dikirim ke pembeli.`
          : `✗ Stok hanya ${stock}, butuh ${order.quantity}. Tambahkan stok di Gudang Akun terlebih dahulu.`}
      </div>
      <label className="label mt-4">Catatan untuk pembeli (opsional)</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Contoh: Jangan ubah password & profil ya kak"
        className="input resize-none"
      />
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost">
          Batal
        </button>
        <button onClick={submit} disabled={loading || !enough} className="btn bg-emerald-500 text-white hover:bg-emerald-400">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Konfirmasi & Kirim Akun
        </button>
      </div>
    </Modal>
  );
}

function CancelModal({ order, onClose, onDone }: { order: Row | null; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  if (!order) return null;

  async function submit() {
    setLoading(true);
    const { error } = await createClient().rpc("cancel_order", { p_order_id: order!.id, p_reason: reason || "Dibatalkan oleh admin" });
    setLoading(false);
    if (error) return toast.error(errorMessage(error));
    toast.success("Pesanan dibatalkan");
    onClose();
    onDone();
  }

  return (
    <Modal open onClose={onClose} title="Batalkan Pesanan" size="sm">
      <OrderSummary order={order} />
      <label className="label mt-4">Alasan pembatalan</label>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Contoh: Pembayaran tidak diterima" className="input resize-none" />
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost">
          Kembali
        </button>
        <button onClick={submit} disabled={loading} className="btn-danger">
          {loading && <Loader2 className="size-4 animate-spin" />} Batalkan Pesanan
        </button>
      </div>
    </Modal>
  );
}

function DetailModal({ order, onClose }: { order: Row | null; onClose: () => void }) {
  const [accounts, setAccounts] = useState<AccountStock[]>([]);
  useEffect(() => {
    if (!order || order.status !== "completed") return;
    createClient()
      .from("account_stock")
      .select("*")
      .eq("order_id", order.id)
      .then(({ data }) => setAccounts((data as AccountStock[]) ?? []));
  }, [order]);
  if (!order) return null;

  const phone = order.profiles?.phone?.replace(/\D/g, "").replace(/^0/, "62");

  return (
    <Modal open onClose={onClose} title={`Detail ${order.order_code}`} size="lg">
      <div className="flex items-center justify-between">
        <StatusBadge status={order.status} />
        {phone && (
          <a
            href={`https://wa.me/${phone}?text=${encodeURIComponent(`Halo ${order.profiles?.full_name ?? ""}, terkait pesanan ${order.order_code}...`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-wa py-2 text-xs"
          >
            <WhatsappIcon className="size-4" /> Chat Pembeli
          </a>
        )}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-2xl bg-white/[0.04] p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Pembeli</p>
          <SummaryRow label="Nama" value={order.profiles?.full_name ?? "-"} />
          <SummaryRow label="Email" value={order.profiles?.email ?? "-"} />
          <SummaryRow label="No. HP" value={order.profiles?.phone ?? "-"} />
        </div>
        <div className="space-y-2 rounded-2xl bg-white/[0.04] p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Pesanan</p>
          <SummaryRow label="Produk" value={`${order.product_name} × ${order.quantity}`} />
          <SummaryRow label="Total" value={formatRupiah(order.total)} strong />
          <SummaryRow label="Dibuat" value={formatDate(order.created_at)} />
          {order.completed_at && <SummaryRow label="Selesai" value={formatDate(order.completed_at)} />}
          {order.cancelled_at && <SummaryRow label="Dibatalkan" value={formatDate(order.cancelled_at)} />}
        </div>
      </div>
      {order.customer_note && <p className="mt-4 rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white/75">💬 Catatan pembeli: {order.customer_note}</p>}
      {order.admin_note && <p className="mt-2 rounded-xl bg-sky-500/10 px-4 py-3 text-sm text-sky-200">📌 Catatan admin: {order.admin_note}</p>}
      {accounts.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Akun Terkirim</p>
          <div className="mt-2 space-y-2">
            {accounts.map((a) => (
              <div key={a.id} className="flex flex-wrap gap-x-5 gap-y-1.5 rounded-xl bg-emerald-500/[0.07] px-4 py-3 text-sm ring-1 ring-emerald-500/15">
                {ACCOUNT_FIELDS.filter((f) => a[f.key]).map((f) => (
                  <span key={f.key} className="flex items-center gap-1.5">
                    <span className="text-white/45">{f.label}:</span>
                    <span className="font-mono text-white/90">{a[f.key]}</span>
                    <CopyButton value={a[f.key]!} className="size-6" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
