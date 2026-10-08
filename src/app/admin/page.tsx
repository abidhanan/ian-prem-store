import { DashboardView, type DashboardOrder, type DashboardStats } from "@/components/admin/dashboard-view";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const metadata = { title: "Dashboard" };

const currentTime = () => Date.now();

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const now = currentTime();
  const since = new Date(now - 180 * 86_400_000).toISOString();

  const [statsRes, ordersRes, lowStockRes] = await Promise.all([
    supabase.rpc("admin_dashboard_stats"),
    supabase
      .from("orders")
      .select("id, order_code, total, quantity, status, created_at, completed_at, product_name, category_name, profiles(full_name, email)")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("products")
      .select("id, name, stock_count, is_active")
      .eq("is_active", true)
      .order("stock_count", { ascending: true })
      .limit(6),
  ]);

  const stats: DashboardStats = statsRes.data ?? {
    total_revenue: 0,
    total_orders: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    users: 0,
    products: 0,
    stock_available: 0,
    stock_sold: 0,
  };

  return (
    <DashboardView
      now={now}
      stats={stats}
      orders={(ordersRes.data as unknown as DashboardOrder[]) ?? []}
      lowStock={(lowStockRes.data as Pick<Product, "id" | "name" | "stock_count">[]) ?? []}
      error={statsRes.error?.message}
    />
  );
}
