import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock3, KeyRound, PackageCheck, XCircle } from "lucide-react";
import { OrderActions } from "@/components/order-actions";
import { CopyButton } from "@/components/ui/copy-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { AccountStock, Order } from "@/lib/types";
import { WhatsappIcon } from "@/components/whatsapp-icon";
import { ACCOUNT_FIELDS, cn, formatDate, formatRupiah, orderWhatsappMessage, whatsappLink } from "@/lib/utils";

export const metadata: Metadata = { title: "Detail Pesanan" };

export default async function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/orders/${id}`);

  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).eq("user_id", user.id).maybeSingle<Order>();
  if (!order) notFound();

  let accounts: AccountStock[] = [];
  if (order.status === "completed") {
    const { data } = await supabase.from("account_stock").select("*").eq("order_id", order.id).order("created_at");
    accounts = (data as AccountStock[]) ?? [];
  }

  const waUrl = whatsappLink(orderWhatsappMessage(order, { name: user.profile?.full_name, email: user.email }));
  const steps = [
    { label: "Pesanan dibuat", date: order.created_at, done: true },
    { label: "Pembayaran dikonfirmasi", date: order.completed_at, done: order.status === "completed" },
    { label: "Akun terkirim", date: order.completed_at, done: order.status === "completed" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white">
        <ArrowLeft className="size-4" /> Kembali ke Pesanan Saya
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 sm:mt-5 sm:items-center">
        <div>
          <p className="text-xs text-white/50 sm:text-sm">Kode Pesanan</p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="break-all font-mono text-lg font-bold tracking-wide text-white sm:text-2xl sm:tracking-wider">{order.order_code}</h1>
            <CopyButton value={order.order_code} label="Kode pesanan" />
          </div>
        </div>
        <StatusBadge status={order.status} className="sm:px-4 sm:py-2 sm:text-sm" />
      </div>

      {/* Status banner */}
      {order.status === "pending" && (
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-4 sm:mt-6 sm:rounded-3xl sm:p-6">
          <div className="flex items-start gap-3 sm:items-center sm:gap-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500/15 sm:size-14 sm:rounded-2xl">
              <Clock3 className="size-6 text-amber-300 sm:size-7" />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-base font-semibold text-white sm:text-lg">Menunggu Pembayaran</h2>
              <p className="mt-1 text-sm text-white/60">
                Silakan lakukan pembayaran melalui WhatsApp admin. Setelah dikonfirmasi, akun akan otomatis muncul di halaman ini.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:flex-wrap">
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-wa col-span-2 px-5 py-3">
              <WhatsappIcon className="size-5" /> Bayar via WhatsApp
            </a>
            <OrderActions orderId={order.id} />
          </div>
        </div>
      )}

      {order.status === "cancelled" && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-4 sm:mt-6 sm:gap-4 sm:rounded-3xl sm:p-6">
          <XCircle className="size-7 shrink-0 text-red-300" />
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Pesanan Dibatalkan</h2>
            <p className="mt-1 text-sm text-white/60">{order.admin_note || "Pesanan ini telah dibatalkan."}</p>
          </div>
        </div>
      )}

      {/* Akun */}
      {order.status === "completed" && (
        <section className="mt-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/15">
              <PackageCheck className="size-5 text-emerald-400" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Akun Premium Kamu</h2>
              <p className="text-xs text-white/50">Jangan bagikan data akun ini ke orang lain</p>
            </div>
          </div>
          {order.admin_note && (
            <p className="mt-4 rounded-2xl bg-sky-500/10 px-4 py-3 text-sm text-sky-200 ring-1 ring-sky-500/20">📌 {order.admin_note}</p>
          )}
          <div className="mt-4 grid gap-3 sm:gap-4 md:grid-cols-2">
            {accounts.map((acc, i) => (
              <div key={acc.id} className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-4 sm:rounded-3xl sm:p-5">
                <div className="absolute -right-10 -top-10 size-32 rounded-full bg-emerald-500/10 blur-2xl" />
                <p className="relative flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  <KeyRound className="size-4" /> Akun #{i + 1}
                </p>
                <div className="relative mt-4 space-y-2.5">
                  {ACCOUNT_FIELDS.filter((f) => acc[f.key]).map((f) => (
                    <div key={f.key} className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2.5 sm:gap-3 sm:px-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{f.label}</p>
                        {f.key === "access_link" ? (
                          <a href={acc[f.key]!} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-sky-300 hover:underline">
                            {acc[f.key]}
                          </a>
                        ) : (
                          <p className="truncate font-mono text-sm text-white">{acc[f.key]}</p>
                        )}
                      </div>
                      <CopyButton value={acc[f.key]!} label={f.label} />
                    </div>
                  ))}
                  {acc.notes && <p className="rounded-xl bg-black/20 px-3.5 py-2.5 text-sm text-white/70">📝 {acc.notes}</p>}
                </div>
              </div>
            ))}
            {accounts.length === 0 && <p className="text-sm text-white/50">Data akun belum tersedia. Hubungi admin.</p>}
          </div>
        </section>
      )}

      <div className="mt-5 grid gap-4 sm:mt-6 md:grid-cols-[1fr_280px]">
        <div className="card p-5 sm:p-6">
          <h3 className="font-display font-semibold text-white">Rincian Pesanan</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Produk" value={order.product_name} />
            {order.category_name && <Row label="Kategori" value={order.category_name} />}
            <Row label="Harga Satuan" value={formatRupiah(order.unit_price)} />
            <Row label="Jumlah" value={`${order.quantity}x`} />
            {order.customer_note && <Row label="Catatan" value={order.customer_note} />}
            <div className="flex justify-between border-t border-white/10 pt-3">
              <dt className="font-semibold text-white">Total</dt>
              <dd className="font-display text-lg font-bold text-gradient">{formatRupiah(order.total)}</dd>
            </div>
          </dl>
        </div>
        <div className="card p-5 sm:p-6">
          <h3 className="font-display font-semibold text-white">Status</h3>
          <ol className="mt-4 space-y-4">
            {steps.map((s, i) => (
              <li key={s.label} className="relative flex gap-3">
                {i < steps.length - 1 && (
                  <span className={cn("absolute left-[9px] top-6 h-[calc(100%-4px)] w-0.5", s.done && steps[i + 1].done ? "bg-emerald-500/50" : "bg-white/10")} />
                )}
                <span
                  className={cn(
                    "relative mt-0.5 size-5 shrink-0 rounded-full border-2",
                    s.done ? "border-emerald-400 bg-emerald-400/30" : order.status === "cancelled" ? "border-red-400/50" : "border-white/20"
                  )}
                />
                <div>
                  <p className={cn("text-sm font-medium", s.done ? "text-white" : "text-white/40")}>{s.label}</p>
                  {s.done && <p className="text-xs text-white/40">{formatDate(s.date)}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-white/50">{label}</dt>
      <dd className="text-right text-white/85">{value}</dd>
    </div>
  );
}
