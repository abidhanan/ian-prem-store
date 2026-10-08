import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCategories, getProducts } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Semua Produk" };

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : undefined;

  const [categories, products] = await Promise.all([getCategories(), getProducts({ category, q })]);
  const activeCat = categories.find((c) => c.slug === category);

  const href = (slug?: string) => {
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (q) params.set("q", q);
    const s = params.toString();
    return s ? `/products?${s}` : "/products";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-10 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl glass px-4 py-6 sm:rounded-3xl sm:px-10 sm:py-10">
        <div className="absolute -right-10 -top-10 size-60 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-400">Katalog</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-white sm:text-4xl">
          {activeCat ? (
            <>
              {activeCat.icon} {activeCat.name}
            </>
          ) : (
            "Semua Produk Premium"
          )}
        </h1>
        <p className="mt-2 text-sm text-white/50 sm:text-base">{activeCat?.description || "Temukan akun premium terbaik dengan harga paling hemat."}</p>

        <form action="/products" className="relative mt-5 max-w-xl sm:mt-6">
          {category && <input type="hidden" name="category" value={category} />}
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-white/35 sm:left-4" />
          <input name="q" defaultValue={q} placeholder="Cari Netflix, Spotify, Canva..." className="input h-12 pl-11 pr-24 sm:pl-12 sm:pr-28" />
          <button className="btn-primary absolute right-1.5 top-1.5 h-9 py-0">Cari</button>
        </form>
      </div>

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:mt-8 sm:flex-wrap sm:px-0">
        <Chip href={href()} active={!category}>
          🔥 Semua
        </Chip>
        {categories.map((c) => (
          <Chip key={c.id} href={href(c.slug)} active={category === c.slug}>
            {c.icon} {c.name}
          </Chip>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-white/45 sm:mt-6 sm:text-sm">
        <p>
          Menampilkan <span className="font-semibold text-white">{products.length}</span> produk
          {q && (
            <>
              {" "}untuk &ldquo;<span className="text-white">{q}</span>&rdquo;
            </>
          )}
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<PackageSearch className="size-8" />}
          title="Produk tidak ditemukan"
          description="Coba kata kunci lain atau pilih kategori berbeda."
          action={
            <Link href="/products" className="btn-ghost">
              Reset Filter
            </Link>
          }
        />
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-medium transition sm:px-4 sm:text-sm",
        active
          ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20"
          : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:text-white"
      )}
    >
      {children}
    </Link>
  );
}
