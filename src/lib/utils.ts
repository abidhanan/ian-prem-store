import { clsx, type ClassValue } from "clsx";
import { SITE_NAME, WHATSAPP_NUMBER } from "./config";
import type { AccountField, Order, OrderStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatCompactRupiah(value: number) {
  if (value >= 1_000_000_000) return `Rp${(value / 1_000_000_000).toFixed(1).replace(".0", "")}M`;
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1).replace(".0", "")}jt`;
  if (value >= 1_000) return `Rp${(value / 1_000).toFixed(0)}rb`;
  return `Rp${value}`;
}

export function formatDate(value: string | null | undefined, withTime = true) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function discountPercent(price: number, original: number | null) {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function orderWhatsappMessage(
  order: Pick<Order, "order_code" | "product_name" | "quantity" | "total" | "customer_note">,
  customer: { name?: string | null; email?: string | null }
) {
  const lines = [
    `Halo Admin ${SITE_NAME},`,
    `Saya ingin melakukan pembayaran untuk pesanan berikut:`,
    ``,
    `Kode Pesanan: *${order.order_code}*`,
    `Produk: ${order.product_name}`,
    `Jumlah: ${order.quantity}`,
    `Total: *${formatRupiah(order.total)}*`,
    `Nama: ${customer.name || "-"}`,
    `Email akun: ${customer.email || "-"}`,
  ];
  if (order.customer_note) lines.push(`Catatan: ${order.customer_note}`);
  lines.push(``, `Mohon info metode pembayarannya. Terima kasih.`);
  return lines.join("\n");
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Menunggu Pembayaran",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const ACCOUNT_FIELDS: { key: AccountField; label: string; placeholder: string }[] = [
  { key: "email", label: "Email / Username", placeholder: "akun@email.com" },
  { key: "password", label: "Password", placeholder: "••••••••" },
  { key: "profile", label: "Profil", placeholder: "Profil 1 / Nama profil" },
  { key: "pin", label: "PIN", placeholder: "1234" },
  { key: "access_link", label: "Link Akses", placeholder: "https://..." },
];

export const CATEGORY_COLORS: Record<string, { gradient: string; soft: string; text: string; ring: string }> = {
  violet: { gradient: "from-violet-500 to-fuchsia-500", soft: "bg-violet-500/15", text: "text-violet-300", ring: "ring-violet-500/30" },
  rose: { gradient: "from-rose-500 to-orange-400", soft: "bg-rose-500/15", text: "text-rose-300", ring: "ring-rose-500/30" },
  emerald: { gradient: "from-emerald-500 to-teal-400", soft: "bg-emerald-500/15", text: "text-emerald-300", ring: "ring-emerald-500/30" },
  amber: { gradient: "from-amber-400 to-orange-500", soft: "bg-amber-500/15", text: "text-amber-300", ring: "ring-amber-500/30" },
  sky: { gradient: "from-sky-500 to-indigo-500", soft: "bg-sky-500/15", text: "text-sky-300", ring: "ring-sky-500/30" },
  pink: { gradient: "from-pink-500 to-rose-400", soft: "bg-pink-500/15", text: "text-pink-300", ring: "ring-pink-500/30" },
  cyan: { gradient: "from-cyan-400 to-blue-500", soft: "bg-cyan-500/15", text: "text-cyan-300", ring: "ring-cyan-500/30" },
  red: { gradient: "from-red-500 to-rose-600", soft: "bg-red-500/15", text: "text-red-300", ring: "ring-red-500/30" },
};

export function categoryColor(color: string | null | undefined) {
  return CATEGORY_COLORS[color || "violet"] || CATEGORY_COLORS.violet;
}

export function errorMessage(error: unknown) {
  if (!error) return "Terjadi kesalahan";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error && "message" in error) {
    const msg = String((error as { message: string }).message);
    if (msg.includes("Invalid login credentials")) return "Email atau password salah";
    if (msg.includes("User already registered")) return "Email sudah terdaftar";
    if (msg.includes("Email not confirmed")) return "Email belum dikonfirmasi. Cek inbox email Anda";
    if (msg.includes("signups are disabled") || msg.includes("Signups not allowed"))
      return "Pendaftaran sedang ditutup. Admin: aktifkan Email provider & 'Allow new users to sign up' di Supabase → Authentication";
    if (msg.includes("rate limit")) return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi";
    if (msg.includes("duplicate key") && msg.includes("slug")) return "Slug sudah dipakai, gunakan nama lain";
    if (msg.includes("violates foreign key") && msg.includes("orders"))
      return "Produk sudah memiliki transaksi. Nonaktifkan produk saja, jangan dihapus";
    return msg;
  }
  return "Terjadi kesalahan";
}
