import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: { default: "Admin", template: "%s - Admin" } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");

  if (user.profile?.role !== "admin") {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <div className="card max-w-md p-10 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-500/15">
            <ShieldAlert className="size-8 text-red-300" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-white">Akses Ditolak</h1>
          <p className="mt-2 text-sm text-white/55">Halaman ini khusus untuk admin.</p>
          <Link href="/" className="btn-primary mt-6">
            Kembali ke Toko
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending");

  return (
    <AdminShell name={user.profile?.full_name || user.email || "Admin"} email={user.email} pendingCount={count ?? 0}>
      {children}
    </AdminShell>
  );
}
