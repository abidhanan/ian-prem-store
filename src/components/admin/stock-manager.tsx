"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, Eye, EyeOff, Layers, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLogo } from "@/components/brand-logo";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { AccountField, AccountStock, Product } from "@/lib/types";
import { ACCOUNT_FIELDS, cn, errorMessage, formatDate } from "@/lib/utils";
import { PageHeader } from "./page-header";

type ProductLite = Pick<Product, "id" | "name" | "account_fields" | "stock_count" | "sold_count"> & {
  categories: { icon: string | null } | null;
};
type Row = AccountStock & { orders: { order_code: string } | null };
type Form = Record<AccountField, string> & { notes: string };
const EMPTY: Form = { email: "", password: "", profile: "", pin: "", access_link: "", notes: "" };

export function StockManager({ initialProductId }: { initialProductId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [productId, setProductId] = useState(initialProductId);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [tab, setTab] = useState<"available" | "sold">("available");
  const [q, setQ] = useState("");
  const [reveal, setReveal] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [showAll, setShowAll] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState("");
  const [saving, setSaving] = useState(false);

  const product = products.find((p) => p.id === productId);
  const fields = useMemo(() => ACCOUNT_FIELDS.filter((f) => product?.account_fields.includes(f.key)), [product]);

  const loadProducts = useCallback(
    () =>
      supabase
        .from("products")
        .select("id, name, account_fields, stock_count, sold_count, categories(icon)")
        .order("name")
        .then(({ data, error }) => {
          if (error) toast.error(errorMessage(error));
          const list = (data as unknown as ProductLite[]) ?? [];
          setProducts(list);
          setProductId((cur) => (cur && list.some((p) => p.id === cur) ? cur : list[0]?.id ?? ""));
          setLoading(false);
        }),
    [supabase]
  );

  const loadRows = useCallback(() => {
    if (!productId) return;
    supabase
      .from("account_stock")
      .select("*, orders(order_code)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(errorMessage(error));
        setRows((data as Row[]) ?? []);
        setLoadingRows(false);
      });
  }, [supabase, productId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);
  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const refresh = () => {
    loadRows();
    loadProducts();
  };

  const available = rows.filter((r) => r.status === "available");
  const sold = rows.filter((r) => r.status === "sold");
  const visible = (tab === "available" ? available : sold).filter((r) => {
    if (!q) return true;
    const t = q.toLowerCase();
    return [r.email, r.profile, r.notes, r.orders?.order_code].some((v) => v?.toLowerCase().includes(t));
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setShowAll(false);
    setFormOpen(true);
  }

  function openEdit(r: Row) {
    setEditing(r);
    setForm({
      email: r.email ?? "",
      password: r.password ?? "",
      profile: r.profile ?? "",
      pin: r.pin ?? "",
      access_link: r.access_link ?? "",
      notes: r.notes ?? "",
    });
    setShowAll(ACCOUNT_FIELDS.some((f) => !product?.account_fields.includes(f.key) && r[f.key]));
    setFormOpen(true);
  }

  const clean = (f: Form) => ({
    email: f.email.trim() || null,
    password: f.password.trim() || null,
    profile: f.profile.trim() || null,
    pin: f.pin.trim() || null,
    access_link: f.access_link.trim() || null,
    notes: f.notes.trim() || null,
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = clean(form);
    if (!Object.values(payload).some(Boolean)) return toast.error("Isi minimal satu kolom");
    setSaving(true);
    const { error } = editing
      ? await supabase.from("account_stock").update(payload).eq("id", editing.id)
      : await supabase.from("account_stock").insert({ ...payload, product_id: productId });
    setSaving(false);
    if (error) return toast.error(errorMessage(error));
    toast.success(editing ? "Akun diperbarui" : "Akun ditambahkan ke gudang");
    setFormOpen(false);
    refresh();
  }

  const bulkParsed = useMemo(() => {
    const keys = (fields.length ? fields : ACCOUNT_FIELDS.slice(0, 2)).map((f) => f.key);
    return bulk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((s) => s.trim());
        const f: Form = { ...EMPTY };
        keys.forEach((k, i) => (f[k] = parts[i] ?? ""));
        if (parts.length > keys.length) f.notes = parts.slice(keys.length).join(" | ");
        return clean(f);
      });
  }, [bulk, fields]);

  async function saveBulk() {
    if (bulkParsed.length === 0) return toast.error("Belum ada data");
    setSaving(true);
    const { error } = await supabase.from("account_stock").insert(bulkParsed.map((r) => ({ ...r, product_id: productId })));
    setSaving(false);
    if (error) return toast.error(errorMessage(error));
    toast.success(`${bulkParsed.length} akun ditambahkan`);
    setBulk("");
    setBulkOpen(false);
    refresh();
  }

  async function remove(r: Row) {
    if (!confirm("Hapus akun ini dari gudang?")) return;
    const { error } = await supabase.from("account_stock").delete().eq("id", r.id);
    if (error) return toast.error(errorMessage(error));
    toast.success("Akun dihapus");
    refresh();
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-32">
        <Loader2 className="size-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div>
        <PageHeader title="Gudang Akun" description="Simpan stok akun premium yang siap dikirim ke pembeli" />
        <EmptyState
          icon={<Boxes className="size-8" />}
          title="Belum ada produk"
          description="Buat produk terlebih dahulu sebelum menambahkan stok akun."
          action={
            <Link href="/admin/products" className="btn-primary">
              Kelola Produk
            </Link>
          }
        />
      </div>
    );
  }

  const shownFields = fields.length ? fields : ACCOUNT_FIELDS.slice(0, 2);
  const formFields = showAll ? ACCOUNT_FIELDS : shownFields;

  return (
    <div>
      <PageHeader
        title="Gudang Akun"
        description="Stok akun otomatis dikirim ke pembeli saat pesanan dikonfirmasi"
        action={
          <>
            <button onClick={() => setBulkOpen(true)} className="btn-ghost" disabled={!productId}>
              <Layers className="size-4" /> Tambah Massal
            </button>
            <button onClick={openNew} className="btn-primary" disabled={!productId}>
              <Plus className="size-4" /> Tambah Akun
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[1fr_auto_auto]">
        <div className="card col-span-2 p-3 sm:p-4 lg:col-span-1">
          <label className="label">Pilih Produk</label>
          <Select
            value={productId}
            onChange={(v) => {
              setLoadingRows(true);
              setProductId(v);
            }}
            placeholder="Pilih produk"
            options={products.map((p) => ({ value: p.id, icon: <AppLogo name={p.name} className="size-7" />, label: `${p.name} — stok ${p.stock_count}` }))}
          />
        </div>
        <div className="card flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300 sm:size-11">
            <Boxes className="size-5" />
          </span>
          <div>
            <p className="text-xs text-white/45">Tersedia</p>
            <p className="font-display text-2xl font-bold text-white">{available.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300 sm:size-11">
            <Layers className="size-5" />
          </span>
          <div>
            <p className="text-xs text-white/45">Terjual</p>
            <p className="font-display text-2xl font-bold text-white">{sold.length}</p>
          </div>
        </div>
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="grid grid-cols-2 gap-1.5 sm:flex">
            {(["available", "sold"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition",
                  tab === t ? "bg-white text-ink-950" : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                {t === "available" ? `Tersedia (${available.length})` : `Terjual (${sold.length})`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari email, profil..." className="input py-2 pl-10" />
            </div>
            <button onClick={() => setReveal((v) => !v)} className="btn-ghost px-3" title={reveal ? "Sembunyikan password" : "Tampilkan password"}>
              {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/[0.05] md:hidden">
          {loadingRows ? (
            <div className="py-14 text-center">
              <Loader2 className="mx-auto size-6 animate-spin text-white/40" />
            </div>
          ) : visible.length === 0 ? (
            <p className="px-4 py-14 text-center text-sm text-white/40">
              {tab === "available" ? "Stok kosong. Tambahkan akun untuk produk ini." : "Belum ada akun terjual."}
            </p>
          ) : (
            visible.map((r) => (
              <div key={r.id} className="space-y-2 p-4">
                {shownFields.map((f) => {
                  const v = r[f.key];
                  const secret = (f.key === "password" || f.key === "pin") && !reveal;
                  return (
                    <div key={f.key} className="flex items-center gap-2">
                      <span className="w-20 shrink-0 truncate text-[11px] font-semibold uppercase tracking-wider text-white/40">{f.label.split(" / ")[0]}</span>
                      {v ? (
                        <>
                          <span className="min-w-0 flex-1 truncate font-mono text-xs text-white/85">{secret ? "••••••••" : v}</span>
                          <CopyButton value={v} className="size-7" />
                        </>
                      ) : (
                        <span className="text-white/25">—</span>
                      )}
                    </div>
                  );
                })}
                {r.notes && <p className="rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-xs text-white/55">📝 {r.notes}</p>}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="min-w-0 truncate text-[11px] text-white/40">
                    {tab === "sold" ? `${r.orders?.order_code ?? "—"} • ${formatDate(r.sold_at)}` : `Ditambahkan ${formatDate(r.created_at)}`}
                  </p>
                  <div className="flex shrink-0 gap-1.5">
                    <button onClick={() => openEdit(r)} className="btn bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10" aria-label="Edit">
                      <Pencil className="size-3.5" />
                    </button>
                    {r.status === "available" && (
                      <button onClick={() => remove(r)} className="btn bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/20" aria-label="Hapus">
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-white/40">
                {shownFields.map((f) => (
                  <th key={f.key} className="px-5 py-3 font-semibold">
                    {f.label}
                  </th>
                ))}
                <th className="px-5 py-3 font-semibold">Catatan</th>
                <th className="px-5 py-3 font-semibold">{tab === "sold" ? "Pesanan" : "Ditambahkan"}</th>
                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loadingRows ? (
                <tr>
                  <td colSpan={shownFields.length + 3} className="py-14 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-white/40" />
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={shownFields.length + 3} className="py-14 text-center text-white/40">
                    {tab === "available" ? "Stok kosong. Tambahkan akun untuk produk ini." : "Belum ada akun terjual."}
                  </td>
                </tr>
              ) : (
                visible.map((r) => (
                  <tr key={r.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                    {shownFields.map((f) => {
                      const v = r[f.key];
                      const secret = (f.key === "password" || f.key === "pin") && !reveal;
                      return (
                        <td key={f.key} className="max-w-56 px-5 py-3">
                          {v ? (
                            <div className="flex items-center gap-2">
                              <span className="truncate font-mono text-xs text-white/85">{secret ? "••••••••" : v}</span>
                              <CopyButton value={v} className="size-6" />
                            </div>
                          ) : (
                            <span className="text-white/25">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="max-w-48 truncate px-5 py-3 text-xs text-white/55">{r.notes || "—"}</td>
                    <td className="px-5 py-3 text-xs text-white/50">
                      {tab === "sold" ? (
                        <>
                          <p className="font-mono text-white/80">{r.orders?.order_code ?? "—"}</p>
                          <p>{formatDate(r.sold_at)}</p>
                        </>
                      ) : (
                        formatDate(r.created_at)
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openEdit(r)} className="btn bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10" title="Edit">
                          <Pencil className="size-3.5" />
                        </button>
                        {r.status === "available" && (
                          <button onClick={() => remove(r)} className="btn bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/20" title="Hapus">
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form tunggal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Akun" : "Tambah Akun"}
        description={`${product?.name ?? ""} — semua kolom opsional, isi sesuai kebutuhan aplikasi`}
      >
        <form onSubmit={save} className="space-y-4">
          {editing?.status === "sold" && (
            <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-xs text-amber-200 ring-1 ring-amber-500/20">
              Akun ini sudah terjual. Perubahan akan langsung terlihat oleh pembeli.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {formFields.map((f) => (
              <div key={f.key} className={f.key === "access_link" ? "sm:col-span-2" : ""}>
                <label className="label">{f.label}</label>
                <input
                  value={form[f.key]}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="input font-mono"
                />
              </div>
            ))}
          </div>
          {fields.length < ACCOUNT_FIELDS.length && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="text-xs font-semibold text-fuchsia-300 hover:underline">
              {showAll ? "Sembunyikan kolom lain" : "+ Tampilkan semua kolom (profil, PIN, link, dll.)"}
            </button>
          )}
          <div>
            <label className="label">Catatan (terlihat oleh pembeli)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
              rows={2}
              placeholder="Contoh: Aktif sampai 23 Okt 2026"
              className="input resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-ghost">
              Batal
            </button>
            <button disabled={saving} className="btn-primary">
              {saving && <Loader2 className="size-4 animate-spin" />} Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* Tambah massal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Tambah Akun Massal" description={product?.name} size="lg">
        <div className="rounded-2xl bg-white/[0.04] p-4 text-sm text-white/65">
          <p>Satu akun per baris, pisahkan kolom dengan tanda <code className="rounded bg-white/10 px-1.5 text-fuchsia-300">|</code> dengan urutan:</p>
          <p className="mt-2 font-mono text-xs text-white">
            {shownFields.map((f) => f.label).join(" | ")} | Catatan (opsional)
          </p>
          <p className="mt-2 text-xs text-white/45">Kolom yang tidak ada bisa dikosongkan, contoh: <span className="font-mono">email@x.com||Profil 2</span></p>
        </div>
        <textarea
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          rows={10}
          placeholder={shownFields.map((f) => f.placeholder).join(" | ")}
          className="input mt-4 resize-y font-mono text-xs"
        />
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-white/50">
            <span className="font-semibold text-white">{bulkParsed.length}</span> akun akan ditambahkan
          </p>
          <div className="flex gap-2">
            <button onClick={() => setBulkOpen(false)} className="btn-ghost">
              Batal
            </button>
            <button onClick={saveBulk} disabled={saving || bulkParsed.length === 0} className="btn-primary">
              {saving && <Loader2 className="size-4 animate-spin" />} Simpan Semua
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
