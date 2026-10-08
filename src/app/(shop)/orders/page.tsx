import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Package, Receipt, ShoppingBag } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { Order, OrderStatus } from "@/lib/types";
import { cn, formatDate, formatRupiah } from "@/lib/utils";

export const metadata: Metadata = { title: "Pesanan Saya" };

const TABS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
];

export default async function MyOrdersPage({ searchParams }: PageProps<"/orders">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/orders");

  const sp = await searchParams;
  const status = (typeof sp.status === "string" ? sp.status : "all") as OrderStatus | "all";

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, products(slug, image_url, account_fields)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const all = (data as Order[]) ?? [];
  const orders = status === "all" ? all : all.filter((o) => o.status === status);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl sm:size-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-fuchsia-600/30">
          <Receipt className="size-6 text-white" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Pesanan Saya</h1>
          <p className="text-xs text-white/50 sm:text-sm">Akun premium yang sudah dibeli akan muncul di sini</p>
        </div>
      </div>

      <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:mt-8 sm:px-0">
        {TABS.map((t) => {
          const count = t.key === "all" ? all.length : all.filter((o) => o.status === t.key).length;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/orders" : `/orders?status=${t.key}`}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                status === t.key
                  ? "border-transparent bg-white text-ink-950"
                  : "border-white/10 bg-white/[0.03] text-white/65 hover:text-white"
              )}
            >
              {t.label}
              <span className={cn("rounded-full px-1.5 text-xs", status === t.key ? "bg-ink-950/10" : "bg-white/10")}>{count}</span>
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<ShoppingBag className="size-8" />}
          title="Belum ada pesanan"
          description="Yuk mulai belanja akun premium favoritmu!"
          action={
            <Link href="/products" className="btn-primary">
              Mulai Belanja
            </Link>
          }
        />
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="group card flex items-center gap-3 p-3.5 transition hover:border-white/20 hover:bg-white/[0.05] sm:gap-4 sm:p-5"
            >
              <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 sm:size-16">
                {o.products?.image_url ? (
                  <ProductImage src={o.products.image_url} name={o.product_name} />
                ) : (
                  <Package className="size-6 text-white/80 sm:size-7" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-semibold text-white sm:text-base">{o.product_name}</p>
                  <p className="shrink-0 font-display text-sm font-bold text-white sm:text-base">{formatRupiah(o.total)}</p>
                </div>
                <p className="mt-0.5 truncate font-mono text-[11px] text-white/45 sm:text-xs">{o.order_code}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-white/40 sm:text-xs">
                    {formatDate(o.created_at)} • {o.quantity}x
                  </span>
                  <StatusBadge status={o.status} short className="px-2 py-0.5 text-[11px] sm:px-2.5 sm:py-1 sm:text-xs" />
                </div>
              </div>
              <ChevronRight className="hidden size-5 shrink-0 text-white/30 transition group-hover:translate-x-1 group-hover:text-white sm:block" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
