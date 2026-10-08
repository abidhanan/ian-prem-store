"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Menu, PackageSearch, Receipt, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

type NavUser = { name: string; email: string | null; isAdmin: boolean } | null;

// Tinggi navbar (h-16). Dipakai agar bagian atas section pas di bawah navbar.
const HEADER_H = 64;

const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/#kategori", label: "Kategori" },
  { href: "/#terlaris", label: "Terlaris" },
  { href: "/#keunggulan", label: "Keunggulan" },
  { href: "/#cara-order", label: "Cara Order" },
  { href: "/#faq", label: "FAQ" },
];

const PENDING_KEY = "pending-section";

// Scroll mulus sampai bagian atas section pas di bawah navbar
function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - HEADER_H), behavior: "smooth" });
}

// Section di halaman utama yang dipantau scroll-spy (urut dari atas ke bawah)
const SPY_IDS = LINKS.filter((l) => l.href.startsWith("/#")).map((l) => l.href.slice(2));

export function NavbarClient({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [spy, setSpy] = useState<string | null>(null);
  const [underline, setUnderline] = useState<{ left: number; width: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const isHome = pathname === "/";

  // Scroll-spy realtime
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 10);
      if (!isHome) return setSpy(null);
      let current: string | null = null;
      for (const id of SPY_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= HEADER_H + 24) current = id;
      }
      setSpy(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isHome, pathname]);

  const current = !isHome ? null : spy ? `/#${spy}` : "/";

  // Garis bawah geser mengikuti link aktif
  useLayoutEffect(() => {
    const measure = () => {
      const el = current ? itemRefs.current[current] : null;
      setUnderline(el ? { left: el.offsetLeft + 12, width: Math.max(0, el.offsetWidth - 24) } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [current]);

  useEffect(() => {
    if (!isHome) return;
    const id = sessionStorage.getItem(PENDING_KEY);
    if (!id) return;
    sessionStorage.removeItem(PENDING_KEY);
    const t = setTimeout(() => scrollToSection(id), 120);
    return () => clearTimeout(t);
  }, [isHome]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Di halaman utama: scroll mulus hingga bagian atas section pas di bawah navbar
  function goTo(e: React.MouseEvent, href: string) {
    setOpen(false);
    if (!isHome) {
      if (href === "/") return; // Next menavigasi ke beranda
      // Dari halaman lain: ke beranda dulu (URL tetap bersih tanpa "#"), lalu scroll ke section
      e.preventDefault();
      sessionStorage.setItem(PENDING_KEY, href.slice(2));
      router.push("/");
      return;
    }
    e.preventDefault();
    if (window.location.hash) history.replaceState(null, "", "/");
    if (href === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    scrollToSection(href.slice(2));
  }

  async function logout() {
    await createClient().auth.signOut();
    toast.success("Berhasil keluar");
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const initials = user?.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "bg-ink-950/75 shadow-lg shadow-black/20 backdrop-blur-xl" : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Logo className="shrink-0" />

        <div className="relative hidden items-center gap-0.5 lg:flex">
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute bottom-1 h-0.5 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-300 ease-out",
              underline ? "opacity-100" : "opacity-0"
            )}
            style={{ left: underline?.left ?? 0, width: underline?.width ?? 0 }}
          />
          {LINKS.map((l) => {
            const active = current === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={(e) => goTo(e, l.href)}
                ref={(el) => {
                  itemRefs.current[l.href] = el;
                }}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-white" : "text-white/60 hover:text-white"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3 transition hover:bg-white/[0.08]"
              >
                <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
                  {initials}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-medium text-white/90 sm:block lg:hidden xl:block">{user.name}</span>
                <ChevronDown className={cn("size-4 text-white/50 transition-transform duration-300", menuOpen && "rotate-180 text-fuchsia-300")} />
              </button>
              <div
                className={cn(
                  "glass-strong absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl p-1.5 shadow-2xl shadow-black/50 transition-all duration-200",
                  menuOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-1 scale-95 opacity-0"
                )}
                aria-hidden={!menuOpen}
              >
                <div className="border-b border-white/10 px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="truncate text-xs text-white/50">{user.email}</p>
                </div>
                {user.isAdmin && (
                  <MenuLink href="/admin" icon={<LayoutDashboard className="size-4" />} onClick={() => setMenuOpen(false)}>
                    Dashboard Admin
                  </MenuLink>
                )}
                <MenuLink href="/products" icon={<PackageSearch className="size-4" />} onClick={() => setMenuOpen(false)}>
                  Semua Produk
                </MenuLink>
                <MenuLink href="/orders" icon={<Receipt className="size-4" />} onClick={() => setMenuOpen(false)}>
                  Pesanan Saya
                </MenuLink>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10"
                >
                  <LogOut className="size-4" /> Keluar
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden px-3 min-[360px]:inline-flex sm:px-4">
                Masuk
              </Link>
              <Link href="/register" className="btn-primary">
                Daftar
              </Link>
            </>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="hidden size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] md:grid lg:hidden"
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="absolute inset-x-0 top-full hidden px-4 pt-1 sm:px-6 md:block lg:hidden">
          <div className="glass-strong max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain rounded-2xl p-2 shadow-2xl shadow-black/50 animate-fade-up">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={(e) => goTo(e, l.href)}
                className={cn(
                  "block rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  current === l.href ? "bg-white/[0.07] text-white" : "text-white/70 hover:bg-white/5"
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-1 border-t border-white/10 pt-1">
              {user?.isAdmin && (
                <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/5">
                  <LayoutDashboard className="size-4 text-white/50" /> Dashboard Admin
                </Link>
              )}
              <Link href="/products" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/5">
                <PackageSearch className="size-4 text-white/50" /> Semua Produk
              </Link>
              {user ? (
                <Link href="/orders" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/5">
                  <Receipt className="size-4 text-white/50" /> Pesanan Saya
                </Link>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/5">
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white">
      {icon}
      {children}
    </Link>
  );
}
