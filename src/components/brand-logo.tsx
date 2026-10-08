import { Package } from "lucide-react";
import { BRANDS, type Brand } from "@/lib/brands";
import { cn } from "@/lib/utils";

export function findBrand(name: string | null | undefined): Brand | null {
  if (!name) return null;
  const n = name.toLowerCase();
  // Cocokkan kata kunci terpanjang dulu agar "youtube music" menang atas "youtube"
  let best: { brand: Brand; len: number } | null = null;
  for (const brand of BRANDS) {
    for (const k of brand.keywords) {
      if (n.includes(k) && (!best || k.length > best.len)) best = { brand, len: k.length };
    }
  }
  return best?.brand ?? null;
}

function isDark(hex: string) {
  const v = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.2;
}

/** Glyph logo merek (path SVG asli) — warna mengikuti `currentColor`. */
export function BrandGlyph({ brand, className }: { brand: Brand; className?: string }) {
  if (brand.path) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
        <path d={brand.path} />
      </svg>
    );
  }
  return (
    <span aria-hidden className={cn("font-display font-extrabold leading-none tracking-tighter", className)}>
      {brand.text}
    </span>
  );
}

/**
 * Tile logo aplikasi. Memakai logo merek asli bila nama produk dikenali,
 * jika tidak, jatuh ke `fallback` (emoji kategori) di atas gradient kategori.
 */
export function BrandLogo({
  name,
  className,
  glyphClassName = "size-[55%]",
  fallback,
  gradient,
}: {
  name: string | null | undefined;
  className?: string;
  glyphClassName?: string;
  fallback?: React.ReactNode;
  gradient?: string;
}) {
  const brand = findBrand(name);
  if (!brand) {
    return (
      <span className={cn("grid shrink-0 place-items-center bg-gradient-to-br", gradient, className)}>{fallback ?? "✨"}</span>
    );
  }
  const dark = isDark(brand.hex);
  return (
    <span
      className={cn("grid shrink-0 place-items-center ring-1 ring-inset ring-white/15", className)}
      style={dark ? { background: "#fff", color: brand.hex } : { background: brand.hex, color: "#fff" }}
    >
      <BrandGlyph brand={brand} className={cn(glyphClassName, brand.text && "text-[1.1em]")} />
    </span>
  );
}

/** Logo kecil aplikasi untuk daftar/tabel (admin). Tanpa merek dikenali → ikon paket netral. */
export function AppLogo({ name, className }: { name: string | null | undefined; className?: string }) {
  return (
    <BrandLogo
      name={name}
      className={cn("size-8 rounded-lg text-sm", className)}
      gradient="from-white/[0.08] to-white/[0.03] ring-1 ring-inset ring-white/10"
      fallback={<Package className="size-[55%] text-white/60" />}
    />
  );
}
