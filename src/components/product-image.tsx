/* eslint-disable @next/next/no-img-element */
import { categoryColor, cn } from "@/lib/utils";
import { BrandGlyph, findBrand } from "./brand-logo";

export function ProductImage({
  src,
  name,
  color,
  icon,
  className,
  compact,
  hero,
}: {
  src: string | null | undefined;
  name: string;
  color?: string | null;
  icon?: string | null;
  className?: string;
  compact?: boolean;
  /** Ukuran besar untuk halaman detail produk */
  hero?: boolean;
}) {
  const c = categoryColor(color);
  if (src) {
    return <img src={src} alt={name} className={cn("h-full w-full object-cover", className)} loading="lazy" />;
  }
  const brand = findBrand(name);
  if (brand) {
    return (
      <div className={cn("relative grid h-full w-full place-items-center overflow-hidden", className)} style={{ background: `linear-gradient(135deg, ${brand.hex}, ${brand.hex}cc 55%, #0d0b17)` }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_55%)]" />
        <div className="relative flex flex-col items-center gap-2 px-3 text-center">
          <span
            className={cn("grid place-items-center bg-white shadow-xl shadow-black/30", compact ? "size-8 rounded-lg" : "size-16 rounded-2xl sm:size-20")}
            style={{ color: brand.hex }}
          >
            <BrandGlyph
              brand={brand}
              className={cn(compact ? "size-5" : hero ? "size-10 sm:size-12" : "size-8 sm:size-10", brand.text && "text-2xl sm:text-3xl")}
            />
          </span>
          {!compact && !hero && (
            <span className="hidden font-display text-base font-bold leading-tight text-white drop-shadow sm:line-clamp-2">{name}</span>
          )}
          {hero && <span className="line-clamp-2 font-display text-2xl font-bold leading-tight text-white drop-shadow">{name}</span>}
        </div>
      </div>
    );
  }
  return (
    <div className={cn("relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br", c.gradient, className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
      <div className="absolute -bottom-10 -right-10 size-40 rounded-full bg-black/20 blur-2xl" />
      <div className="relative flex flex-col items-center gap-1 px-3 text-center sm:gap-2 sm:px-4">
        <span className={compact ? "text-2xl" : hero ? "text-6xl drop-shadow-lg" : "text-4xl drop-shadow-lg sm:text-5xl"}>{icon || "✨"}</span>
        {!compact && (
          <span className={cn("font-display font-bold leading-tight text-white drop-shadow", hero ? "line-clamp-2 text-2xl" : "hidden text-lg sm:line-clamp-2")}>{name}</span>
        )}
      </div>
    </div>
  );
}
