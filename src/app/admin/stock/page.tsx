import { StockManager } from "@/components/admin/stock-manager";

export const metadata = { title: "Gudang Akun" };

export default async function AdminStockPage({ searchParams }: PageProps<"/admin/stock">) {
  const { product } = await searchParams;
  return <StockManager initialProductId={typeof product === "string" ? product : ""} />;
}
