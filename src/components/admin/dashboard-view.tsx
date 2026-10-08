"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Receipt,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { AppLogo } from "@/components/brand-logo";
import { StatusBadge } from "@/components/ui/status-badge";
import type { OrderStatus, Product } from "@/lib/types";
import { cn, formatCompactRupiah, formatDate, formatRupiah } from "@/lib/utils";

export type DashboardStats = {
  total_revenue: number;
  total_orders: number;
  completed: number;
  pending: number;
  cancelled: number;
  users: number;
  products: number;
  stock_available: number;
  stock_sold: number;
};

export type DashboardOrder = {
  id: string;
  order_code: string;
  total: number;
  quantity: number;
  status: OrderStatus;
  created_at: string;
  completed_at: string | null;
  product_name: string;
  category_name: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

// Palet chart (divalidasi untuk permukaan gelap — CVD & kontras lolos)
const SERIES = "#9085e9";
const CATEGORICAL = ["#3987e5", "#d95926", "#199e70", "#c98500"];
const OTHER = "#6f6c80";
const STATUS_COLOR: Record<OrderStatus, string> = { completed: "#0ca30c", pending: "#fab219", cancelled: "#d03b3b" };
const STATUS_ICON = { completed: CheckCircle2, pending: Clock3, cancelled: XCircle };
const STATUS_TEXT: Record<OrderStatus, string> = { completed: "Selesai", pending: "Menunggu", cancelled: "Dibatalkan" };
const GRID = "rgba(255,255,255,0.06)";
const AXIS = "#8a8797";
const SURFACE = "#12101c";

const RANGES = [
  { days: 7, label: "7 Hari" },
  { days: 30, label: "30 Hari" },
  { days: 90, label: "90 Hari" },
];

const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);

export function DashboardView({
  now,
  stats,
  orders,
  lowStock,
  error,
}: {
  now: number;
  stats: DashboardStats;
  orders: DashboardOrder[];
  lowStock: Pick<Product, "id" | "name" | "stock_count">[];
  error?: string;
}) {
  const [range, setRange] = useState(30);
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");

  const data = useMemo(() => {
    const start = now - range * 86_400_000;
    const prevStart = start - range * 86_400_000;

    const inRange = (iso: string | null, from: number, to: number) => {
      if (!iso) return false;
      const t = new Date(iso).getTime();
      return t >= from && t < to;
    };

    const current = orders.filter((o) => inRange(o.created_at, start, now + 1));
    const revenueOf = (from: number, to: number) =>
      orders
        .filter((o) => o.status === "completed" && inRange(o.completed_at ?? o.created_at, from, to))
        .reduce((a, o) => a + o.total, 0);
    const completedOf = (from: number, to: number) =>
      orders.filter((o) => o.status === "completed" && inRange(o.completed_at ?? o.created_at, from, to)).length;

    const revenue = revenueOf(start, now + 1);
    const prevRevenue = revenueOf(prevStart, start);
    const completed = completedOf(start, now + 1);
    const prevCompleted = completedOf(prevStart, start);
    const ordersCount = current.length;
    const prevOrdersCount = orders.filter((o) => inRange(o.created_at, prevStart, start)).length;

    // Seri harian
    const days: { key: string; label: string; revenue: number; orders: number }[] = [];
    const index = new Map<string, number>();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000);
      const key = dayKey(d);
      index.set(key, days.length);
      days.push({
        key,
        label: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }).format(d),
        revenue: 0,
        orders: 0,
      });
    }
    for (const o of orders) {
      const ci = index.get(dayKey(new Date(o.created_at)));
      if (ci !== undefined && inRange(o.created_at, start, now + 1)) days[ci].orders += 1;
      if (o.status === "completed") {
        const at = o.completed_at ?? o.created_at;
        const ri = index.get(dayKey(new Date(at)));
        if (ri !== undefined && inRange(at, start, now + 1)) days[ri].revenue += o.total;
      }
    }

    // Status
    const statusData = (["completed", "pending", "cancelled"] as OrderStatus[]).map((s) => ({
      status: s,
      name: STATUS_TEXT[s],
      value: current.filter((o) => o.status === s).length,
    }));

    // Produk terlaris
    const completedCurrent = current.filter((o) => o.status === "completed");
    const byProduct = new Map<string, { name: string; revenue: number; qty: number }>();
    for (const o of completedCurrent) {
      const p = byProduct.get(o.product_name) ?? { name: o.product_name, revenue: 0, qty: 0 };
      p.revenue += o.total;
      p.qty += o.quantity;
      byProduct.set(o.product_name, p);
    }
    const topProducts = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Kategori (4 teratas + Lainnya). Warna mengikuti nama kategori (urutan alfabet), bukan peringkat.
    const byCat = new Map<string, number>();
    for (const o of completedCurrent) {
      const k = o.category_name || "Tanpa Kategori";
      byCat.set(k, (byCat.get(k) || 0) + o.total);
    }
    const sortedCats = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
    const top = sortedCats.slice(0, 4).map(([name]) => name).sort((a, b) => a.localeCompare(b));
    const categoryData = top.map((name, i) => ({ name, value: byCat.get(name)!, color: CATEGORICAL[i] }));
    categoryData.sort((a, b) => b.value - a.value);
    const rest = sortedCats.slice(4).reduce((a, [, v]) => a + v, 0);
    if (rest > 0) categoryData.push({ name: "Lainnya", value: rest, color: OTHER });

    return {
      revenue,
      prevRevenue,
      completed,
      prevCompleted,
      ordersCount,
      prevOrdersCount,
      avgOrder: completed ? Math.round(revenue / completed) : 0,
      days,
      statusData,
      topProducts,
      categoryData,
    };
  }, [orders, range, now]);

  const recent = orders.slice(0, 6);
  const statusTotal = data.statusData.reduce((a, s) => a + s.value, 0);
  const categoryTotal = data.categoryData.reduce((a, s) => a + s.value, 0);
  const rangeLabel = RANGES.find((r) => r.days === range)!.label.toLowerCase();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-xs text-white/50 sm:text-sm">Ringkasan performa toko dalam {rangeLabel} terakhir</p>
        </div>
        <div className="grid grid-cols-3 rounded-xl border border-white/10 bg-white/[0.03] p-1 sm:inline-flex">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRange(r.days)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-sm font-medium transition",
                range === r.days ? "bg-white text-ink-950 shadow" : "text-white/60 hover:text-white"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Gagal memuat statistik: {error}. Pastikan <code>schema.sql</code> sudah dijalankan.
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Kpi
          icon={Wallet}
          label="Pendapatan"
          value={formatRupiah(data.revenue)}
          current={data.revenue}
          previous={data.prevRevenue}
          sub={`Total semua: ${formatCompactRupiah(stats.total_revenue)}`}
          accent="from-violet-500 to-fuchsia-500"
        />
        <Kpi
          icon={Receipt}
          label="Pesanan Selesai"
          value={data.completed.toLocaleString("id-ID")}
          current={data.completed}
          previous={data.prevCompleted}
          sub={`Rata-rata ${formatCompactRupiah(data.avgOrder)} / pesanan`}
          accent="from-sky-500 to-indigo-500"
        />
        <Link href="/admin/orders?status=pending" className="block">
          <Kpi
            icon={Clock3}
            label="Menunggu Konfirmasi"
            value={stats.pending.toLocaleString("id-ID")}
            sub="Klik untuk memproses →"
            accent="from-amber-400 to-orange-500"
            highlight={stats.pending > 0}
          />
        </Link>
        <Kpi
          icon={Users}
          label="Total Pengguna"
          value={stats.users.toLocaleString("id-ID")}
          sub={`${stats.stock_available} akun siap jual`}
          accent="from-emerald-500 to-teal-500"
        />
      </div>

      {/* Tren */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              {metric === "revenue" ? "Pendapatan Harian" : "Pesanan Masuk Harian"}
            </h2>
            <p className="text-xs text-white/45">
              {metric === "revenue" ? "Dari pesanan yang sudah dikonfirmasi" : "Semua pesanan yang dibuat pembeli"}
            </p>
          </div>
          <div className="grid grid-cols-2 rounded-lg border border-white/10 bg-white/[0.03] p-0.5 text-xs sm:inline-flex">
            {(["revenue", "orders"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={cn("rounded-md px-3 py-1.5 font-medium transition", metric === m ? "bg-white/10 text-white" : "text-white/50 hover:text-white")}
              >
                {m === "revenue" ? "Pendapatan" : "Jumlah Pesanan"}
              </button>
            ))}
          </div>
        </div>
        <div className="-ml-2 mt-4 h-56 sm:ml-0 sm:mt-6 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.days} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: AXIS, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: AXIS, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={metric === "revenue" ? 60 : 32}
                allowDecimals={false}
                tickFormatter={(v: number) => (metric === "revenue" ? formatCompactRupiah(v) : String(v))}
              />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.25)", strokeDasharray: "4 4" }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <ChartTooltip
                      title={String(label)}
                      rows={[
                        {
                          color: SERIES,
                          label: metric === "revenue" ? "Pendapatan" : "Pesanan",
                          value: metric === "revenue" ? formatRupiah(Number(payload[0].value)) : `${payload[0].value} pesanan`,
                        },
                      ]}
                    />
                  ) : null
                }
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={SERIES}
                strokeWidth={2}
                fill="url(#areaFill)"
                activeDot={{ r: 5, stroke: SURFACE, strokeWidth: 2, fill: SERIES }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Status */}
        <div className="card p-4 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-white">Status Pesanan</h2>
          <p className="text-xs text-white/45">Pesanan yang dibuat dalam {rangeLabel} terakhir</p>
          {statusTotal === 0 ? (
            <NoData />
          ) : (
            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
              <div className="relative size-40 shrink-0 sm:size-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusData.filter((s) => s.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="68%"
                      outerRadius="100%"
                      stroke={SURFACE}
                      strokeWidth={2}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {data.statusData
                        .filter((s) => s.value > 0)
                        .map((s) => (
                          <Cell key={s.status} fill={STATUS_COLOR[s.status]} />
                        ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <ChartTooltip
                            rows={[
                              {
                                color: STATUS_COLOR[(payload[0].payload as { status: OrderStatus }).status],
                                label: String(payload[0].name),
                                value: `${payload[0].value} (${Math.round((Number(payload[0].value) / statusTotal) * 100)}%)`,
                              },
                            ]}
                          />
                        ) : null
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="font-display text-3xl font-bold text-white">{statusTotal}</p>
                    <p className="text-xs text-white/45">pesanan</p>
                  </div>
                </div>
              </div>
              <ul className="w-full space-y-2.5">
                {data.statusData.map((s) => {
                  const Icon = STATUS_ICON[s.status];
                  return (
                    <li key={s.status} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3.5 py-2.5">
                      <span className="size-2.5 rounded-full" style={{ background: STATUS_COLOR[s.status] }} />
                      <Icon className="size-4 text-white/50" />
                      <span className="flex-1 text-sm text-white/75">{s.name}</span>
                      <span className="text-sm font-semibold tabular-nums text-white">{s.value}</span>
                      <span className="w-10 text-right text-xs tabular-nums text-white/40">
                        {Math.round((s.value / statusTotal) * 100)}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Kategori */}
        <div className="card p-4 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-white">Pendapatan per Kategori</h2>
          <p className="text-xs text-white/45">Kontribusi tiap kategori terhadap pendapatan</p>
          {categoryTotal === 0 ? (
            <NoData />
          ) : (
            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
              <div className="relative size-40 shrink-0 sm:size-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="68%"
                      outerRadius="100%"
                      stroke={SURFACE}
                      strokeWidth={2}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {data.categoryData.map((c) => (
                        <Cell key={c.name} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <ChartTooltip
                            rows={[
                              {
                                color: (payload[0].payload as { color: string }).color,
                                label: String(payload[0].name),
                                value: formatRupiah(Number(payload[0].value)),
                              },
                            ]}
                          />
                        ) : null
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="font-display text-xl font-bold text-white">{formatCompactRupiah(categoryTotal)}</p>
                    <p className="text-xs text-white/45">total</p>
                  </div>
                </div>
              </div>
              <ul className="w-full space-y-2.5">
                {data.categoryData.map((c) => (
                  <li key={c.name} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3.5 py-2.5">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="min-w-0 flex-1 truncate text-sm text-white/75">{c.name}</span>
                    <span className="text-sm font-semibold tabular-nums text-white">{formatCompactRupiah(c.value)}</span>
                    <span className="w-10 text-right text-xs tabular-nums text-white/40">{Math.round((c.value / categoryTotal) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Top produk */}
        <div className="card p-4 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-white">Produk Terlaris</h2>
          <p className="text-xs text-white/45">5 produk dengan pendapatan tertinggi</p>
          {data.topProducts.length === 0 ? (
            <NoData />
          ) : (
            <ul className="mt-5 space-y-4">
              {data.topProducts.map((p) => (
                <li key={p.name} className="group" title={`${p.name}: ${formatRupiah(p.revenue)} • ${p.qty} akun terjual`}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2.5 text-white/80">
                      <AppLogo name={p.name} className="size-7 rounded-lg" />
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-white">{formatCompactRupiah(p.revenue)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-2.5 flex-1 rounded-full bg-white/[0.04]">
                      <div
                        className="h-full rounded-full transition-[filter] group-hover:brightness-125"
                        style={{ width: `${Math.max(3, (p.revenue / data.topProducts[0].revenue) * 100)}%`, background: SERIES }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs tabular-nums text-white/40">{p.qty} akun</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Stok menipis */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Stok Gudang</h2>
              <p className="text-xs text-white/45">Produk aktif dengan stok paling sedikit</p>
            </div>
            <Link href="/admin/stock" className="text-xs font-semibold text-fuchsia-300 hover:underline">
              Kelola
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.03] p-3">
              <p className="text-xs text-white/45">Siap jual</p>
              <p className="font-display text-xl font-bold text-white">{stats.stock_available}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3">
              <p className="text-xs text-white/45">Terjual</p>
              <p className="font-display text-xl font-bold text-white">{stats.stock_sold}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                <AppLogo name={p.name} className="size-7 rounded-lg" />
                <span className="min-w-0 flex-1 truncate text-sm text-white/75">{p.name}</span>
                {p.stock_count <= 2 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-300">
                    <AlertTriangle className="size-3" /> {p.stock_count === 0 ? "Habis" : `${p.stock_count} tersisa`}
                  </span>
                ) : (
                  <span className="text-sm font-semibold tabular-nums text-white/80">{p.stock_count}</span>
                )}
              </li>
            ))}
            {lowStock.length === 0 && <p className="text-sm text-white/40">Belum ada produk.</p>}
          </ul>
        </div>
      </div>

      {/* Transaksi terbaru */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Transaksi Terbaru</h2>
            <p className="text-xs text-white/45">6 pesanan terakhir</p>
          </div>
          <Link href="/admin/orders" className="btn-ghost py-2 text-xs">
            Lihat Semua <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <ul className="divide-y divide-white/[0.05] border-t border-white/[0.06] md:hidden">
          {recent.map((o) => (
            <li key={o.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-white">
                  <AppLogo name={o.product_name} className="size-8 rounded-lg" />
                  <span className="truncate">{o.product_name}</span>
                </p>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-white">{formatRupiah(o.total)}</p>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-xs text-white/45">
                  {o.profiles?.full_name || o.profiles?.email || "-"} • {formatDate(o.created_at)}
                </p>
                <StatusBadge status={o.status} short className="shrink-0 px-2 py-0.5 text-[11px]" />
              </div>
            </li>
          ))}
          {recent.length === 0 && <li className="px-4 py-10 text-center text-sm text-white/40">Belum ada transaksi</li>}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-y border-white/[0.06] text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-6 py-3 font-semibold">Pesanan</th>
                <th className="px-6 py-3 font-semibold">Pembeli</th>
                <th className="px-6 py-3 font-semibold">Total</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <AppLogo name={o.product_name} className="size-9 rounded-xl" />
                      <div className="min-w-0">
                        <p className="font-medium text-white">{o.product_name}</p>
                        <p className="font-mono text-xs text-white/40">
                          {o.order_code} • {formatDate(o.created_at)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-white/70">{o.profiles?.full_name || o.profiles?.email || "-"}</td>
                  <td className="px-6 py-3.5 font-semibold tabular-nums text-white">{formatRupiah(o.total)}</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={o.status} short />
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-white/40">
                    Belum ada transaksi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  current,
  previous,
  accent,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  current?: number;
  previous?: number;
  accent: string;
  highlight?: boolean;
}) {
  let delta: number | null = null;
  if (current !== undefined && previous !== undefined) {
    delta = previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);
  }
  return (
    <div className={cn("card relative h-full overflow-hidden p-3.5 transition hover:border-white/20 sm:p-5", highlight && "border-amber-500/30")}>
      <div className={cn("absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl", accent)} />
      <div className="relative flex items-start justify-between">
        <span className={cn("grid size-9 place-items-center rounded-xl bg-gradient-to-br shadow-lg sm:size-10", accent)}>
          <Icon className="size-4 text-white sm:size-5" />
        </span>
        {delta !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold sm:px-2 sm:text-xs",
              delta >= 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"
            )}
            title="Dibanding periode sebelumnya"
          >
            {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="relative mt-3 truncate text-[11px] font-medium text-white/50 sm:mt-4 sm:text-sm">{label}</p>
      <p className="relative mt-0.5 truncate font-display text-base font-bold text-white sm:mt-1 sm:text-2xl">{value}</p>
      {sub && <p className="relative mt-1 truncate text-[10px] text-white/40 sm:text-xs">{sub}</p>}
    </div>
  );
}

function ChartTooltip({ title, rows }: { title?: string; rows: { color?: string; label: string; value: string }[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800/95 px-3.5 py-2.5 text-xs shadow-2xl backdrop-blur">
      {title && <p className="mb-1.5 font-semibold text-white">{title}</p>}
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 py-0.5">
          {r.color ? <span className="size-2 rounded-full" style={{ background: r.color }} /> : <span className="size-2" />}
          <span className="text-white/55">{r.label}</span>
          <span className="ml-auto pl-4 font-semibold tabular-nums text-white">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function NoData() {
  return (
    <div className="mt-4 grid h-48 place-items-center rounded-xl border border-dashed border-white/10 text-sm text-white/35">
      Belum ada data pada periode ini
    </div>
  );
}
