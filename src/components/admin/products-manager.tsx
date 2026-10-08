"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Boxes, Flame, ImagePlus, Loader2, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/product-image";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import type { AccountField, Category, Product } from "@/lib/types";
import { ACCOUNT_FIELDS, cn, errorMessage, formatRupiah, slugify } from "@/lib/utils";
import { PageHeader } from "./page-header";

type Form = {
  name: string;
  slug: string;
  category_id: string;
  price: string;
  original_price: string;
  duration: string;
  description: string;
  features: string;
  image_url: string;
  account_fields: AccountField[];
  is_active: boolean;
  is_featured: boolean;
};

const EMPTY: Form = {
  name: "",
  slug: "",
  category_id: "",
  price: "",
  original_price: "",
  duration: "1 Bulan",
  description: "",
  features: "",
  image_url: "",
  account_fields: ["email", "password"],
  is_active: true,
  is_featured: false,
};

export function ProductsManager() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(
    () =>
      Promise.all([
        supabase.from("products").select("*, categories(id, name, slug, icon, color)").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("sort_order").order("name"),
      ]).then(([p, c]) => {
        if (p.error) toast.error(errorMessage(p.error));
        setProducts((p.data as Product[]) ?? []);
        setCategories((c.data as Category[]) ?? []);
        setLoading(false);
      }),
    [supabase]
  );

  useEffect(() => {
    load();
  }, [load]);

  const filtered = products.filter(
    (p) => (!cat || p.category_id === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase()))
  );

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY, category_id: categories[0]?.id ?? "" });
    setSlugTouched(false);
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      category_id: p.category_id ?? "",
      price: String(p.price),
      original_price: p.original_price ? String(p.original_price) : "",
      duration: p.duration ?? "",
      description: p.description ?? "",
      features: p.features.join("\n"),
      image_url: p.image_url ?? "",
      account_fields: p.account_fields,
      is_active: p.is_active,
      is_featured: p.is_featured,
    });
    setSlugTouched(true);
    setOpen(true);
  }

  async function upload(file: File) {
    if (file.size > 2 * 1024 * 1024) return toast.error("Ukuran gambar maksimal 2MB");
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, { cacheControl: "31536000" });
    setUploading(false);
    if (error) return toast.error(errorMessage(error));
    const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    toast.success("Gambar diunggah");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.account_fields.length === 0) return toast.error("Pilih minimal 1 kolom data akun");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      category_id: form.category_id || null,
      price: Number(form.price) || 0,
      original_price: form.original_price ? Number(form.original_price) : null,
      duration: form.duration.trim() || null,
      description: form.description.trim() || null,
      features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
      image_url: form.image_url.trim() || null,
      account_fields: form.account_fields,
      is_active: form.is_active,
      is_featured: form.is_featured,
    };
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) return toast.error(errorMessage(error));
    toast.success(editing ? "Produk diperbarui" : "Produk ditambahkan");
    setOpen(false);
    load();
    router.refresh();
  }

  async function toggle(p: Product, key: "is_active" | "is_featured") {
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, [key]: !x[key] } : x)));
    const { error } = await supabase.from("products").update({ [key]: !p[key] }).eq("id", p.id);
    if (error) {
      toast.error(errorMessage(error));
      load();
    }
  }

  async function remove(p: Product) {
    if (!confirm(`Hapus produk "${p.name}"? Semua stok akun yang belum terjual juga akan terhapus.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(errorMessage(error));
    toast.success("Produk dihapus");
    load();
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader
        title="Produk"
        description="Kelola produk aplikasi premium yang dijual"
        action={
          <button onClick={openNew} className="btn-primary" disabled={loading}>
            <Plus className="size-4" /> Tambah Produk
          </button>
        }
      />

      <div className="card mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari produk..." className="input pl-10" />
        </div>
        <Select
          value={cat}
          onChange={setCat}
          className="sm:w-56"
          options={[{ value: "", label: "Semua kategori" }, ...categories.map((c) => ({ value: c.id, label: `${c.icon ?? ""} ${c.name}`.trim() }))]}
        />
      </div>

      {loading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="size-6 animate-spin text-white/40" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="size-8" />}
          title={products.length ? "Produk tidak ditemukan" : "Belum ada produk"}
          description={categories.length ? "Tambahkan produk pertama kamu." : "Buat kategori terlebih dahulu, lalu tambahkan produk."}
          action={
            categories.length ? (
              <button onClick={openNew} className="btn-primary">
                <Plus className="size-4" /> Tambah Produk
              </button>
            ) : (
              <Link href="/admin/categories" className="btn-primary">
                Buat Kategori
              </Link>
            )
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-white/[0.05] md:hidden">
            {filtered.map((p) => (
              <div key={p.id} className="p-4">
                <div className="flex gap-3">
                  <div className="size-14 shrink-0 overflow-hidden rounded-xl">
                    <ProductImage src={p.image_url} name={p.name} color={p.categories?.color} icon={p.categories?.icon} compact />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-semibold text-white">{p.name}</p>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", stockBadge(p.stock_count))}>stok {p.stock_count}</span>
                    </div>
                    <p className="truncate text-xs text-white/40">
                      {p.categories ? `${p.categories.icon} ${p.categories.name}` : "Tanpa kategori"}
                      {p.duration && ` • ${p.duration}`}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-semibold tabular-nums text-white">{formatRupiah(p.price)}</span>
                      {p.original_price && <span className="ml-2 text-xs text-white/35 line-through">{formatRupiah(p.original_price)}</span>}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-xs text-white/55">
                    <span className="flex items-center gap-2">
                      <Switch checked={p.is_active} onChange={() => toggle(p, "is_active")} /> Aktif
                    </span>
                    <button
                      onClick={() => toggle(p, "is_featured")}
                      className={cn("grid size-8 place-items-center rounded-lg transition", p.is_featured ? "bg-amber-400/15 text-amber-300" : "bg-white/5 text-white/30")}
                      aria-label="Tandai sebagai unggulan"
                    >
                      <Flame className="size-4" />
                    </button>
                    <span className="hidden min-[380px]:inline">{p.sold_count} terjual</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Link href={`/admin/stock?product=${p.id}`} className="btn bg-violet-500/15 px-2.5 py-1.5 text-xs text-violet-200 hover:bg-violet-500/25">
                      <Boxes className="size-3.5" /> Stok
                    </Link>
                    <button onClick={() => openEdit(p)} className="btn bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10" aria-label="Edit">
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => remove(p)} className="btn bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/20" aria-label="Hapus">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-5 py-3.5 font-semibold">Produk</th>
                  <th className="px-5 py-3.5 font-semibold">Harga</th>
                  <th className="px-5 py-3.5 font-semibold">Stok</th>
                  <th className="px-5 py-3.5 font-semibold">Terjual</th>
                  <th className="px-5 py-3.5 font-semibold">Aktif</th>
                  <th className="px-5 py-3.5 font-semibold">Unggulan</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-xl">
                          <ProductImage src={p.image_url} name={p.name} color={p.categories?.color} icon={p.categories?.icon} compact />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{p.name}</p>
                          <p className="text-xs text-white/40">
                            {p.categories ? `${p.categories.icon} ${p.categories.name}` : "Tanpa kategori"}
                            {p.duration && ` • ${p.duration}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold tabular-nums text-white">{formatRupiah(p.price)}</p>
                      {p.original_price && <p className="text-xs text-white/35 line-through">{formatRupiah(p.original_price)}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", stockBadge(p.stock_count))}>
                        {p.stock_count}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-white/70">{p.sold_count}</td>
                    <td className="px-5 py-3.5">
                      <Switch checked={p.is_active} onChange={() => toggle(p, "is_active")} />
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggle(p, "is_featured")}
                        className={cn("grid size-8 place-items-center rounded-lg transition", p.is_featured ? "bg-amber-400/15 text-amber-300" : "text-white/25 hover:text-white/60")}
                        title="Tandai sebagai unggulan"
                      >
                        <Flame className="size-4" />
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <Link href={`/admin/stock?product=${p.id}`} className="btn bg-violet-500/15 px-2.5 py-1.5 text-xs text-violet-200 hover:bg-violet-500/25">
                          <Boxes className="size-3.5" /> Stok
                        </Link>
                        <button onClick={() => openEdit(p)} className="btn bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10" title="Edit">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => remove(p)} className="btn bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/20" title="Hapus">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Produk" : "Tambah Produk"} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <div>
              <label className="label">Gambar</label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative grid aspect-square w-28 place-items-center overflow-hidden rounded-2xl border border-dashed sm:w-full border-white/15 bg-white/[0.03] hover:border-fuchsia-500/50"
              >
                {form.image_url ? (
                  <ProductImage src={form.image_url} name={form.name} />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-xs text-white/40">
                    {uploading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
                    Upload
                  </span>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Nama Produk</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))}
                  placeholder="Netflix Premium Sharing"
                  className="input"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Slug (URL)</label>
                  <input
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", e.target.value);
                    }}
                    className="input font-mono"
                  />
                </div>
                <div>
                  <label className="label">Kategori</label>
                  <Select
                    value={form.category_id}
                    onChange={(v) => set("category_id", v)}
                    options={[{ value: "", label: "Tanpa kategori" }, ...categories.map((c) => ({ value: c.id, label: `${c.icon ?? ""} ${c.name}`.trim() }))]}
                  />
                </div>
              </div>
              <div>
                <label className="label">URL Gambar (opsional)</label>
                <input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://... atau upload di samping" className="input" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Harga Jual (Rp)</label>
              <input required type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="35000" className="input" />
            </div>
            <div>
              <label className="label">Harga Coret (Rp)</label>
              <input type="number" min={0} value={form.original_price} onChange={(e) => set("original_price", e.target.value)} placeholder="54000" className="input" />
            </div>
            <div>
              <label className="label">Durasi</label>
              <input value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="1 Bulan" className="input" />
            </div>
          </div>

          <div>
            <label className="label">Deskripsi</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="input resize-none" placeholder="Jelaskan produk, aturan pemakaian, garansi, dll." />
          </div>

          <div>
            <label className="label">Keunggulan (satu per baris)</label>
            <textarea value={form.features} onChange={(e) => set("features", e.target.value)} rows={3} className="input resize-none" placeholder={"Kualitas 4K UHD\nGaransi 30 hari"} />
          </div>

          <div>
            <label className="label">Data akun yang diberikan ke pembeli</label>
            <p className="-mt-0.5 mb-2 text-xs text-white/40">Kolom ini akan muncul di form Gudang Akun untuk produk ini.</p>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_FIELDS.map((f) => {
                const on = form.account_fields.includes(f.key);
                return (
                  <button
                    type="button"
                    key={f.key}
                    onClick={() =>
                      set("account_fields", on ? form.account_fields.filter((k) => k !== f.key) : [...form.account_fields, f.key])
                    }
                    className={cn(
                      "rounded-xl border px-3.5 py-2 text-sm font-medium transition",
                      on ? "border-fuchsia-500/60 bg-fuchsia-500/15 text-white" : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"
                    )}
                  >
                    {on ? "✓ " : ""}
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl bg-white/[0.03] p-4 sm:flex-row sm:flex-wrap sm:gap-6">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-white/80">
              <Switch checked={form.is_active} onChange={() => set("is_active", !form.is_active)} /> Tampilkan di toko
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-white/80">
              <Switch checked={form.is_featured} onChange={() => set("is_featured", !form.is_featured)} /> Produk unggulan (Hot)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Batal
            </button>
            <button disabled={saving || uploading} className="btn-primary">
              {saving && <Loader2 className="size-4 animate-spin" />} Simpan Produk
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function stockBadge(n: number) {
  return n === 0 ? "bg-red-500/10 text-red-300" : n <= 3 ? "bg-amber-500/10 text-amber-300" : "bg-emerald-500/10 text-emerald-300";
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : "bg-white/15")}
    >
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}
