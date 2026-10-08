import "server-only";
import { SUPABASE_CONFIGURED } from "./config";
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from "./demo-data";
import { createClient } from "./supabase/server";
import type { Category, Product } from "./types";

const PRODUCT_SELECT = "*, categories(id, name, slug, icon, color)";

export async function getCategories(): Promise<Category[]> {
  if (!SUPABASE_CONFIGURED) return DEMO_CATEGORIES;
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order").order("name");
  if (error) console.error("getCategories:", error.message);
  return (data as Category[]) ?? [];
}

export async function getProducts(opts: { category?: string; q?: string; featured?: boolean; limit?: number } = {}): Promise<Product[]> {
  if (!SUPABASE_CONFIGURED) {
    let list = DEMO_PRODUCTS;
    if (opts.category) list = list.filter((p) => p.categories?.slug === opts.category);
    if (opts.q) list = list.filter((p) => p.name.toLowerCase().includes(opts.q!.toLowerCase()));
    if (opts.featured) list = list.filter((p) => p.is_featured);
    return opts.limit ? list.slice(0, opts.limit) : list;
  }

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(opts.category ? "*, categories!inner(id, name, slug, icon, color)" : PRODUCT_SELECT)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("sold_count", { ascending: false })
    .order("created_at", { ascending: false });

  if (opts.category) query = query.eq("categories.slug", opts.category);
  if (opts.q) query = query.ilike("name", `%${opts.q.replace(/[%_,()]/g, "")}%`);
  if (opts.featured) query = query.eq("is_featured", true);
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) console.error("getProducts:", error.message);
  return (data as unknown as Product[]) ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!SUPABASE_CONFIGURED) return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("is_active", true).maybeSingle();
  return (data as Product) ?? null;
}

export async function getStoreStats() {
  if (!SUPABASE_CONFIGURED) {
    return { products: DEMO_PRODUCTS.length, sold: DEMO_PRODUCTS.reduce((a, p) => a + p.sold_count, 0) };
  }
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("sold_count").eq("is_active", true);
  const rows = (data as { sold_count: number }[]) ?? [];
  return { products: rows.length, sold: rows.reduce((a, p) => a + (p.sold_count || 0), 0) };
}
