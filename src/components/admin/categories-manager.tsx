"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderTree, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";
import { CATEGORY_COLORS, categoryColor, cn, errorMessage, slugify } from "@/lib/utils";
import { PageHeader } from "./page-header";

const EMOJIS = ["🎬", "🎧", "🎨", "⚡", "🎮", "📚", "🤖", "☁️", "🔒", "📺", "💼", "✨", "📸", "🎵", "🧠", "🛡️"];

type Form = { name: string; slug: string; icon: string; color: string; description: string; sort_order: number };
const EMPTY: Form = { name: "", slug: "", icon: "✨", color: "violet", description: "", sort_order: 0 };

export function CategoriesManager() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<(Category & { products: { count: number }[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const load = useCallback(
    () =>
      supabase
        .from("categories")
        .select("*, products(count)")
        .order("sort_order")
        .order("name")
        .then(({ data, error }) => {
          if (error) toast.error(errorMessage(error));
          setItems((data as never) ?? []);
          setLoading(false);
        }),
    [supabase]
  );

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY, sort_order: items.length + 1 });
    setSlugTouched(false);
    setOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      icon: c.icon || "✨",
      color: c.color || "violet",
      description: c.description || "",
      sort_order: c.sort_order,
    });
    setSlugTouched(true);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, slug: slugify(form.slug || form.name), description: form.description || null };
    const { error } = editing
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    setSaving(false);
    if (error) return toast.error(errorMessage(error));
    toast.success(editing ? "Kategori diperbarui" : "Kategori ditambahkan");
    setOpen(false);
    load();
    router.refresh();
  }

  async function remove(c: Category) {
    if (!confirm(`Hapus kategori "${c.name}"? Produk di dalamnya akan menjadi tanpa kategori.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return toast.error(errorMessage(error));
    toast.success("Kategori dihapus");
    load();
  }

  return (
    <div>
      <PageHeader
        title="Kategori"
        description="Kelompokkan produk agar mudah ditemukan pembeli"
        action={
          <button onClick={openNew} className="btn-primary">
            <Plus className="size-4" /> Tambah Kategori
          </button>
        }
      />

      {loading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="size-6 animate-spin text-white/40" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="size-8" />}
          title="Belum ada kategori"
          description="Tambahkan kategori pertama, misalnya Streaming, Musik, atau Desain."
          action={
            <button onClick={openNew} className="btn-primary">
              <Plus className="size-4" /> Tambah Kategori
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {items.map((c) => {
            const col = categoryColor(c.color);
            return (
              <div key={c.id} className="card group relative overflow-hidden p-4 sm:p-5">
                <div className={cn("absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br opacity-20 blur-2xl", col.gradient)} />
                <div className="relative flex items-start gap-4">
                  <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-2xl shadow-lg sm:size-14 sm:text-3xl", col.gradient)}>{c.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-lg font-semibold text-white">{c.name}</h3>
                    <p className="font-mono text-xs text-white/40">/{c.slug}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-white/55">{c.description || "—"}</p>
                  </div>
                </div>
                <div className="relative mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", col.soft, col.text)}>{c.products?.[0]?.count ?? 0} produk</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(c)} className="btn bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10">
                      <Pencil className="size-3.5" /> Edit
                    </button>
                    <button onClick={() => remove(c)} className="btn bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/20">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Kategori" : "Tambah Kategori"}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nama Kategori</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))}
                placeholder="Streaming Film"
                className="input"
              />
            </div>
            <div>
              <label className="label">Slug (URL)</label>
              <input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
                placeholder="streaming-film"
                className="input font-mono"
              />
            </div>
          </div>
          <div>
            <label className="label">Ikon</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((em) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => setForm((f) => ({ ...f, icon: em }))}
                  className={cn(
                    "grid size-10 place-items-center rounded-xl border text-xl transition",
                    form.icon === em ? "border-fuchsia-500 bg-fuchsia-500/15" : "border-white/10 bg-white/[0.03] hover:bg-white/10"
                  )}
                >
                  {em}
                </button>
              ))}
              <input
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="input h-10 w-20 text-center text-lg"
                maxLength={4}
                title="Atau ketik emoji lain"
              />
            </div>
          </div>
          <div>
            <label className="label">Warna</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_COLORS).map(([key, c]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setForm((f) => ({ ...f, color: key }))}
                  className={cn(
                    "size-9 rounded-xl bg-gradient-to-br ring-offset-2 ring-offset-ink-900 transition",
                    c.gradient,
                    form.color === key ? "ring-2 ring-white" : "opacity-70 hover:opacity-100"
                  )}
                  aria-label={key}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="label">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Deskripsi singkat kategori"
              className="input resize-none"
            />
          </div>
          <div className="w-32">
            <label className="label">Urutan</label>
            <input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} className="input" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Batal
            </button>
            <button disabled={saving} className="btn-primary">
              {saving && <Loader2 className="size-4 animate-spin" />} Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
