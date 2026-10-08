"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Boxes, ExternalLink, FolderTree, LayoutDashboard, LogOut, Menu, Package, Receipt, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Logo } from "../logo";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Transaksi", icon: Receipt, badge: true },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/categories", label: "Kategori", icon: FolderTree },
  { href: "/admin/stock", label: "Gudang Akun", icon: Boxes },
];

export function AdminShell({
  children,
  name,
  email,
  pendingCount,
}: {
  children: React.ReactNode;
  name: string;
  email: string | null;
  pendingCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo href="/admin" />
        <button onClick={() => setOpen(false)} className="text-white/50 lg:hidden" aria-label="Tutup menu">
          <X className="size-5" />
        </button>
      </div>
      <p className="px-5 pb-2 pt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/30">Menu Admin</p>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-gradient-to-r from-violet-600/25 to-fuchsia-600/10 text-white" : "text-white/55 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-fuchsia-400" />}
              <item.icon className={cn("size-5", active ? "text-fuchsia-300" : "text-white/40 group-hover:text-white/70")} />
              {item.label}
              {item.badge && pendingCount > 0 && (
                <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-amber-950">{pendingCount}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-white/[0.06] p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/55 hover:bg-white/[0.04] hover:text-white">
          <ExternalLink className="size-5 text-white/40" /> Lihat Toko
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white">
            {name[0]?.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="truncate text-xs text-white/40">{email}</p>
          </div>
          <button onClick={logout} className="text-white/40 hover:text-red-300" aria-label="Keluar" title="Keluar">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/3 size-[32rem] rounded-full bg-violet-700/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 size-[28rem] rounded-full bg-fuchsia-700/10 blur-[120px]" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[0.06] bg-ink-900/70 backdrop-blur-xl lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/10 bg-ink-900">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/[0.06] bg-ink-950/70 px-4 backdrop-blur-xl lg:hidden">
          <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-xl border border-white/10" aria-label="Buka menu">
            <Menu className="size-5" />
          </button>
          <Logo href="/admin" />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
