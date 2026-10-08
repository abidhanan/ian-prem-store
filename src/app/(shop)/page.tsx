import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  CreditCard,
  Headphones,
  MousePointerClick,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { WhatsappIcon } from "@/components/whatsapp-icon";
import { ProductCard } from "@/components/product-card";
import { ScrollLink } from "@/components/scroll-link";
import { SITE_NAME } from "@/lib/config";
import { getCategories, getProducts, getStoreStats } from "@/lib/queries";
import { categoryColor, cn, discountPercent, formatRupiah, whatsappLink } from "@/lib/utils";

export default async function HomePage() {
  const [categories, featured, allProducts, stats] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ limit: 24 }),
    getStoreStats(),
  ]);

  const showcase = (featured.length ? featured : allProducts).slice(0, 3);
  const best = featured.length ? featured : allProducts.slice(0, 8);
  const countByCategory = allProducts.reduce<Record<string, number>>((acc, p) => {
    if (p.category_id) acc[p.category_id] = (acc[p.category_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative flex flex-col md:min-h-[calc(100dvh-4rem)]">
        <div aria-hidden className="grid-bg absolute inset-0 -z-10" />
        <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-14 px-4 pb-14 pt-8 sm:px-6 md:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="animate-fade-up">
            <h1 className="text-gradient animate-shine font-display text-[2.1rem] font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
              Nikmati Aplikasi Premium
              <br className="hidden sm:block" /> dengan Harga Hemat
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/60 sm:mt-6 sm:text-lg">
              Netflix, Spotify, Canva, ChatGPT dan banyak lagi. Bayar mudah via WhatsApp, akun langsung terkirim ke dashboard
              kamu setelah dikonfirmasi admin.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-wrap">
              <Link href="/products" className="btn-primary px-3 py-3.5 sm:px-6 sm:text-base">
                Belanja Sekarang <ArrowRight className="size-4" />
              </Link>
              <ScrollLink id="cara-order" className="btn-ghost px-3 py-3.5 sm:px-6 sm:text-base">
                Cara Order
              </ScrollLink>
            </div>

            <div className="glass mt-10 grid max-w-lg grid-cols-3 divide-x divide-white/10 rounded-2xl py-4 sm:mt-12 sm:divide-x-0 sm:border-0 sm:bg-transparent sm:py-0 sm:backdrop-blur-none">
              {[
                { value: `${stats.products}+`, label: "Produk Premium" },
                stats.sold > 0
                  ? { value: `${stats.sold.toLocaleString("id-ID")}+`, label: "Akun Terjual" }
                  : { value: "100%", label: "Bergaransi" },
                { value: "4.9/5", label: "Rating Pembeli" },
              ].map((s) => (
                <div key={s.label} className="px-2 text-center sm:px-0 sm:text-left">
                  <p className="font-display text-xl font-bold text-white sm:text-3xl">{s.value}</p>
                  <p className="mt-1 text-[11px] text-white/45 sm:text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Showcase cards: disusun dalam alur flex agar tidak pernah saling bertabrakan */}
          <div className="relative hidden h-[590px] lg:block">
            <div className="absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-600/40 to-fuchsia-600/30 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between gap-6 py-2">
              {showcase.map((p, i) => {
                const c = categoryColor(p.categories?.color);
                const pos = ["self-start -rotate-3", "self-end rotate-3", "self-start ml-10 -rotate-2"][i] ?? "self-start";
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className={cn(
                      "glass-strong w-72 max-w-full rounded-3xl p-5 shadow-2xl shadow-black/40 transition duration-500 hover:rotate-0 hover:scale-[1.03]",
                      pos,
                      "animate-float-soft"
                    )}
                    style={{ animationDelay: `${i * 1.6}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <BrandLogo
                        name={p.name}
                        className="size-12 rounded-2xl text-2xl shadow-lg"
                        gradient={c.gradient}
                        fallback={p.categories?.icon || "✨"}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-display font-semibold text-white">{p.name}</p>
                        <p className="text-xs text-white/50">{p.duration || "Premium"}</p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        {p.original_price && <p className="text-xs text-white/35 line-through">{formatRupiah(p.original_price)}</p>}
                        <p className="font-display text-xl font-bold text-white">{formatRupiah(p.price)}</p>
                      </div>
                      {discountPercent(p.price, p.original_price) > 0 && (
                        <span className="rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-300">
                          Hemat {discountPercent(p.price, p.original_price)}%
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Marquee */}
        {allProducts.length > 0 && (
          <div className="relative border-y border-white/[0.06] bg-white/[0.02] py-4 sm:py-5 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-10">
              {[...allProducts, ...allProducts, ...allProducts].map((p, i) => (
                <span key={i} className="flex items-center gap-2 whitespace-nowrap font-display text-base font-semibold text-white/35 sm:text-lg">
                  <BrandLogo
                    name={p.name}
                    className="size-7 rounded-lg text-base"
                    gradient={categoryColor(p.categories?.color).gradient}
                    fallback={p.categories?.icon || "✨"}
                  />{" "}
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ============ KATEGORI ============ */}
      <section id="kategori" className="mx-auto max-w-7xl scroll-mt-16 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading eyebrow="Kategori" title="Jelajahi Berdasarkan Kategori" subtitle="Temukan aplikasi premium sesuai kebutuhanmu" />
        {categories.length === 0 ? (
          <p className="mt-10 text-center text-sm text-white/40">Belum ada kategori.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => {
              const c = categoryColor(cat.color);
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl glass p-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 sm:rounded-3xl sm:p-6"
                >
                  <div className={cn("absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-40", c.gradient)} />
                  <span className={cn("relative grid size-11 place-items-center rounded-xl bg-gradient-to-br text-2xl shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6 sm:size-14 sm:rounded-2xl sm:text-3xl", c.gradient)}>
                    {cat.icon || "✨"}
                  </span>
                  <h3 className="relative mt-4 font-display text-[15px] font-semibold leading-snug text-white sm:mt-5 sm:text-lg">{cat.name}</h3>
                  <p className="relative mt-1 line-clamp-2 text-xs text-white/45 sm:text-sm">{cat.description || "Lihat produk"}</p>
                  <p className={cn("relative mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold sm:pt-4", c.text)}>
                    {countByCategory[cat.id] || 0} produk <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ PRODUK TERLARIS ============ */}
      <section id="terlaris" className="mx-auto max-w-7xl scroll-mt-16 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading eyebrow="Terlaris" title="Produk Paling Diminati" subtitle="Pilihan favorit ribuan pelanggan kami" align="left" />
          <Link href="/products" className="btn-ghost shrink-0 px-3 sm:px-4">
            <span className="hidden sm:inline">Lihat Semua</span>
            <span className="sm:hidden">Semua</span> <ArrowRight className="size-4" />
          </Link>
        </div>
        {best.length === 0 ? (
          <p className="mt-10 text-center text-sm text-white/40">Belum ada produk.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-4">
            {best.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ============ KEUNGGULAN ============ */}
      <section id="keunggulan" className="scroll-mt-16 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading eyebrow="Kenapa Kami" title={`Kenapa Belanja di ${SITE_NAME}?`} subtitle="Kami utamakan keamanan dan kenyamanan kamu" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Bergaransi", desc: "Garansi penuh selama masa aktif. Ada kendala? Kami ganti.", color: "from-emerald-500 to-teal-500" },
            { icon: Wallet, title: "Harga Hemat", desc: "Hemat hingga 90% dibanding berlangganan resmi sendiri.", color: "from-amber-400 to-orange-500" },
            { icon: Zap, title: "Proses Cepat", desc: "Akun langsung muncul di dashboard setelah pembayaran dikonfirmasi.", color: "from-violet-500 to-fuchsia-500" },
            { icon: Headphones, title: "Support Responsif", desc: "Admin siap membantu via WhatsApp setiap hari.", color: "from-sky-500 to-indigo-500" },
          ].map((f) => (
            <div key={f.title} className="group card relative overflow-hidden p-4 transition hover:border-white/20 sm:p-6">
              <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-0 transition group-hover:opacity-100", f.color)} />
              <span className={cn("grid size-10 place-items-center rounded-xl bg-gradient-to-br shadow-lg sm:size-12 sm:rounded-2xl", f.color)}>
                <f.icon className="size-5 text-white sm:size-6" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-white sm:mt-5 sm:text-lg">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-white/50 sm:mt-2 sm:text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CARA ORDER ============ */}
      <section id="cara-order" className="mx-auto max-w-7xl scroll-mt-16 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading eyebrow="Cara Order" title="Beli Akun Premium dalam 4 Langkah" subtitle="Mudah, aman, dan tanpa ribet" />
        <div className="relative mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:mt-14 sm:gap-6 md:grid-cols-4">
          <div aria-hidden className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent md:block" />
          {[
            { icon: MousePointerClick, title: "Pilih Produk", desc: "Pilih aplikasi premium & durasi yang kamu mau." },
            { icon: CreditCard, title: "Login & Checkout", desc: "Masuk ke akunmu lalu buat pesanan." },
            { icon: WhatsappIcon, title: "Bayar via WhatsApp", desc: "Kamu diarahkan ke WhatsApp admin untuk pembayaran." },
            { icon: PackageCheck, title: "Akun Terkirim", desc: "Setelah dikonfirmasi, akun muncul di menu Pesanan Saya." },
          ].map((s, i) => (
            <div key={s.title} className="relative text-center">
              <div className="relative mx-auto grid size-14 place-items-center rounded-2xl border border-white/10 bg-ink-900 shadow-xl sm:size-16">
                <s.icon className="size-6 text-fuchsia-300 sm:size-7" />
                <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-4 font-display text-[15px] font-semibold text-white sm:mt-5 sm:text-lg">{s.title}</h3>
              <p className="mx-auto mt-1.5 max-w-56 text-xs leading-relaxed text-white/50 sm:mt-2 sm:text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ TESTIMONI ============ */}
      <section id="testimoni" className="mx-auto max-w-7xl scroll-mt-16 py-14 sm:px-6 sm:py-20 lg:px-8">
        {/* Mobile: berjalan otomatis (looping kanan ke kiri). Tablet ke atas: grid 3 kolom. */}
        <div className="overflow-hidden md:overflow-visible">
          <div className="marquee-track flex w-max hover:[animation-play-state:paused] animate-[marquee-half_28s_linear_infinite] md:block md:w-auto md:animate-none">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1 || undefined}
                className={cn("flex shrink-0 gap-3 pr-3", copy === 0 ? "md:grid md:grid-cols-3 md:gap-4 md:px-0" : "md:hidden")}
              >
                {TESTIMONIALS.map((t) => (
                  <div key={t.name} className="card w-[78vw] max-w-sm shrink-0 p-5 sm:p-6 md:w-auto md:max-w-none">
                    <div className="flex gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-white/75">&ldquo;{t.text}&rdquo;</p>
                    <div className="mt-5 flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white">
                        {t.name[0]}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{t.name}</p>
                        <p className="text-xs text-white/45">{t.app}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-16 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Pertanyaan yang Sering Diajukan" />
        <div className="mt-10 space-y-3">
          {[
            { q: "Bagaimana cara pembayarannya?", a: "Setelah membuat pesanan, kamu akan diarahkan ke WhatsApp admin. Admin akan memberikan info pembayaran (transfer bank / e-wallet / QRIS) dan mengonfirmasi pesananmu secara manual." },
            { q: "Berapa lama akun dikirim?", a: "Biasanya 5–30 menit setelah pembayaran dikonfirmasi admin. Akun akan otomatis muncul di menu Pesanan Saya." },
            { q: "Apakah wajib punya akun?", a: "Ya, kamu wajib login untuk bertransaksi agar akun premium bisa dikirim dengan aman ke akunmu. Tapi kamu tetap bisa melihat produk tanpa login." },
            { q: "Bagaimana jika akun bermasalah?", a: "Semua produk bergaransi selama masa aktif. Hubungi admin via WhatsApp dengan menyertakan kode pesanan, kami akan bantu ganti." },
          ].map((f) => (
            <details key={f.q} className="group card overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-4 py-4 text-[15px] font-medium text-white sm:px-5 sm:text-base">
                {f.q}
                <ChevronDown className="size-5 shrink-0 text-white/40 transition group-open:rotate-180" />
              </summary>
              <p className="px-4 pb-4 text-sm leading-relaxed text-white/55 sm:px-5 sm:pb-5">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 px-5 py-10 text-center shadow-2xl shadow-fuchsia-900/40 sm:rounded-[2rem] sm:px-12 sm:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_40%)]" />
          <div className="absolute -bottom-20 -right-20 size-72 rounded-full bg-white/10 blur-2xl" />
          <Sparkles className="relative mx-auto size-10 text-white/90" />
          <h2 className="relative mt-4 font-display text-2xl font-bold text-white sm:text-4xl">Siap upgrade ke Premium?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">Daftar gratis sekarang dan nikmati aplikasi favoritmu tanpa batas.</p>
          <div className="relative mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-wrap sm:justify-center">
            <Link href="/products" className="btn bg-white px-3 py-3.5 text-fuchsia-700 shadow-xl hover:bg-white/90 sm:px-6 sm:text-base">
              Lihat Produk <ArrowRight className="size-4" />
            </Link>
            <a
              href={whatsappLink(`Halo Admin ${SITE_NAME}, saya ingin bertanya tentang produk.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn border border-white/30 bg-white/10 px-3 py-3.5 text-white hover:bg-white/20 sm:px-6 sm:text-base"
            >
              <WhatsappIcon className="size-4" /> Tanya Admin
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

const TESTIMONIALS = [
  { name: "Rizky A.", text: "Prosesnya cepet banget, 10 menit akun Netflix udah masuk. Recommended!", app: "Netflix Premium" },
  { name: "Salsabila P.", text: "Harga paling murah yang pernah aku temuin, adminnya juga ramah.", app: "Spotify Premium" },
  { name: "Dimas K.", text: "Udah langganan 6 bulan, belum pernah ada masalah. Mantap!", app: "Canva Pro" },
];

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn(align === "center" && "mx-auto max-w-2xl text-center")}>
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-400">{eyebrow}</span>
      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-white/50 sm:mt-3 sm:text-base">{subtitle}</p>}
    </div>
  );
}
