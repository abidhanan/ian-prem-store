"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageLoader } from "./page-loader";

const MAX_WAIT_MS = 10_000;

function normalize(pathname: string, search: string) {
  const q = new URLSearchParams(search).toString();
  return q ? `${pathname}?${q}` : pathname;
}

/**
 * Menampilkan layar loading saat pengguna mengklik link internal menuju halaman lain.
 * Halaman lama tetap terlihat di belakang (gelap & blur) sampai halaman baru siap.
 */
export function NavigationLoader() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = normalize(pathname, search);
  // URL saat link diklik; overlay tampil selama URL belum berubah
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  // Setelah URL berpindah, navigasi dianggap selesai (reset saat render, tanpa effect)
  const [prevHere, setPrevHere] = useState(here);
  if (prevHere !== here) {
    setPrevHere(here);
    setPendingFrom(null);
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const from = normalize(window.location.pathname, window.location.search);
      if (normalize(url.pathname, url.search) === from) return; // halaman sama / hanya hash
      setPendingFrom(from);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Pengaman: jangan pernah menahan layar lebih dari MAX_WAIT_MS
  useEffect(() => {
    if (pendingFrom === null) return;
    const t = setTimeout(() => setPendingFrom(null), MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, [pendingFrom]);

  return pendingFrom !== null && pendingFrom === here ? <PageLoader /> : null;
}
