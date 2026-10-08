import Link from "next/link";
import { Clock, Flame, Package } from "lucide-react";
import type { Product } from "@/lib/types";
import { discountPercent, formatRupiah } from "@/lib/utils";
import { ProductImage } from "./product-image";

export function ProductCard({ product }: { product: Product }) {
  const disc = discountPercent(product.price, product.original_price);
  const soldOut = product.stock_count <= 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl glass transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:shadow-fuchsia-900/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
          <ProductImage
            src={product.image_url}
            name={product.name}
            color={product.categories?.color}
            icon={product.categories?.icon}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950/80 to-transparent" />
        <div className="absolute left-2 top-2 flex gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
          {disc > 0 && (
            <span className="rounded-md bg-gradient-to-r from-pink-500 to-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg sm:rounded-lg sm:px-2 sm:py-1 sm:text-[11px]">
              -{disc}%
            </span>
          )}
          {product.is_featured && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-bold text-amber-950 shadow-lg sm:gap-1 sm:rounded-lg sm:px-2 sm:py-1 sm:text-[11px]">
              <Flame className="size-3" /> Hot
            </span>
          )}
        </div>
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-ink-950/60 backdrop-blur-[2px]">
            <span className="rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 sm:px-4 sm:py-1.5 sm:text-xs">
              Stok Habis
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.categories && (
          <span className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300/80 sm:text-[11px]">
            {product.categories.icon} {product.categories.name}
          </span>
        )}
        <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-white sm:text-base">{product.name}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-white/45 sm:gap-x-3 sm:text-xs">
          {product.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3 sm:size-3.5" /> {product.duration}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Package className="size-3 sm:size-3.5" /> Stok {product.stock_count}
          </span>
          {product.sold_count > 0 && <span className="hidden sm:inline">{product.sold_count} terjual</span>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3 sm:pt-4">
          <div className="min-w-0">
            {disc > 0 && <p className="text-[11px] text-white/35 line-through sm:text-xs">{formatRupiah(product.original_price!)}</p>}
            <p className="font-display text-base font-bold text-white sm:text-lg">{formatRupiah(product.price)}</p>
          </div>
          <span className="hidden shrink-0 rounded-xl sm:inline-block bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/80 transition group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-fuchsia-600 group-hover:text-white">
            Beli
          </span>
        </div>
      </div>
    </Link>
  );
}
