import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronRight, Clock, Flame, Package, ShieldCheck, TrendingUp } from "lucide-react";
import { BuyPanel } from "@/components/buy-panel";
import { WhatsappIcon } from "@/components/whatsapp-icon";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { getProductBySlug, getProducts } from "@/lib/queries";
import { getCurrentUser } from "@/lib/supabase/server";
import { ACCOUNT_FIELDS } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Produk", description: product?.description ?? undefined };
}

export default async function ProductDetailPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const [product, user] = await Promise.all([getProductBySlug(slug), getCurrentUser()]);
  if (!product) notFound();

  const related = product.categories
    ? (await getProducts({ category: product.categories.slug, limit: 5 })).filter((p) => p.id !== product.id).slice(0, 4)
    : [];

  const fieldsLabel = ACCOUNT_FIELDS.filter((f) => product.account_fields.includes(f.key)).map((f) => f.label);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 pb-10 sm:px-6 sm:py-8 lg:px-8">
      <nav className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs text-white/45 [scrollbar-width:none] sm:text-sm">
        <Link href="/" className="hover:text-white">Beranda</Link>
        <ChevronRight className="size-4" />
        <Link href="/products" className="hover:text-white">Produk</Link>
        {product.categories && (
          <>
            <ChevronRight className="size-4" />
            <Link href={`/products?category=${product.categories.slug}`} className="hover:text-white">
              {product.categories.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-4" />
        <span className="truncate text-white/80">{product.name}</span>
      </nav>

      <div className="mt-4 grid gap-5 sm:mt-6 lg:grid-cols-[1fr_420px] lg:gap-x-8 lg:gap-y-6">
        <div className="grid gap-5 md:grid-cols-[minmax(0,320px)_1fr] md:gap-6 lg:col-start-1">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/40 sm:rounded-3xl md:aspect-square">
            <ProductImage src={product.image_url} name={product.name} color={product.categories?.color} icon={product.categories?.icon} hero />
            {product.is_featured && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950">
                <Flame className="size-3.5" /> Terlaris
              </span>
            )}
          </div>
          <div>
            {product.categories && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold text-fuchsia-300 ring-1 ring-fuchsia-500/20">
                {product.categories.icon} {product.categories.name}
              </span>
            )}
            <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-white sm:text-4xl">{product.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
              {product.duration && <Pill icon={<Clock className="size-4 text-sky-300" />}>{product.duration}</Pill>}
              <Pill icon={<Package className="size-4 text-emerald-300" />}>Stok {product.stock_count}</Pill>
              <Pill icon={<TrendingUp className="size-4 text-fuchsia-300" />}>{product.sold_count} terjual</Pill>
            </div>
            {product.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/65 sm:mt-5 sm:text-base">{product.description}</p>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <BuyPanel
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              original_price: product.original_price,
              stock_count: product.stock_count,
            }}
            user={user ? { name: user.profile?.full_name ?? null, email: user.email } : null}
          />
        </div>

        <div className="space-y-4 sm:space-y-6 lg:col-start-1">
          {product.features.length > 0 && (
            <div className="card p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold text-white">Keunggulan</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {product.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/75">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-5 sm:p-6">
              <ShieldCheck className="size-7 text-emerald-400" />
              <h3 className="mt-3 font-semibold text-white">Yang akan kamu terima</h3>
              <p className="mt-1.5 text-sm text-white/55">
                Detail akun berisi: <span className="text-white/85">{fieldsLabel.join(", ") || "detail akses"}</span>. Dikirim ke menu
                Pesanan Saya setelah pembayaran dikonfirmasi.
              </p>
            </div>
            <div className="card p-5 sm:p-6">
              <WhatsappIcon className="size-7 text-green-400" />
              <h3 className="mt-3 font-semibold text-white">Pembayaran via WhatsApp</h3>
              <p className="mt-1.5 text-sm text-white/55">
                Setelah checkout, kamu diarahkan ke WhatsApp admin untuk pembayaran & konfirmasi manual.
              </p>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12 sm:mt-20">
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">Produk Serupa</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="glass inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs text-white/80 sm:px-3 sm:text-sm">
      {icon}
      {children}
    </span>
  );
}
