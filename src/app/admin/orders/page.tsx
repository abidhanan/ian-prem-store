import { OrdersManager } from "@/components/admin/orders-manager";

export const metadata = { title: "Transaksi" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const { status } = await searchParams;
  return <OrdersManager initialStatus={typeof status === "string" ? status : "all"} />;
}
