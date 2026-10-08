// Data contoh yang HANYA ditampilkan saat Supabase belum dikonfigurasi,
// agar tampilan website bisa dilihat sebelum setup database.
import type { Category, Product } from "./types";

const now = new Date().toISOString();

export const DEMO_CATEGORIES: Category[] = [
  { id: "c1", name: "Streaming Film", slug: "streaming-film", icon: "🎬", color: "rose", description: "Nonton film & series tanpa iklan", sort_order: 1, created_at: now },
  { id: "c2", name: "Musik", slug: "musik", icon: "🎧", color: "emerald", description: "Musik tanpa batas & offline", sort_order: 2, created_at: now },
  { id: "c3", name: "Desain & Kreatif", slug: "desain", icon: "🎨", color: "violet", description: "Tools desain premium", sort_order: 3, created_at: now },
  { id: "c4", name: "Produktivitas", slug: "produktivitas", icon: "⚡", color: "amber", description: "AI & tools kerja pro", sort_order: 4, created_at: now },
];

const cat = (id: string) => {
  const c = DEMO_CATEGORIES.find((x) => x.id === id)!;
  return { id: c.id, name: c.name, slug: c.slug, icon: c.icon, color: c.color };
};

const base = { image_url: null, is_active: true, created_at: now, updated_at: now };

export const DEMO_PRODUCTS: Product[] = [
  { ...base, id: "p1", category_id: "c1", categories: cat("c1"), name: "Netflix Premium Sharing", slug: "netflix-premium-sharing", description: "Akun Netflix Premium 4K UHD, 1 profil pribadi dengan PIN.", price: 35000, original_price: 54000, duration: "1 Bulan", features: ["Kualitas 4K UHD", "1 Profil + PIN pribadi", "Garansi full 30 hari"], account_fields: ["email", "password", "profile", "pin"], is_featured: true, stock_count: 12, sold_count: 248 },
  { ...base, id: "p2", category_id: "c2", categories: cat("c2"), name: "Spotify Premium Individual", slug: "spotify-premium", description: "Upgrade via link invite family, tanpa iklan & bisa download.", price: 20000, original_price: 55000, duration: "1 Bulan", features: ["Tanpa iklan", "Download offline", "Via link invite"], account_fields: ["email", "password", "access_link"], is_featured: true, stock_count: 30, sold_count: 512 },
  { ...base, id: "p3", category_id: "c3", categories: cat("c3"), name: "Canva Pro", slug: "canva-pro", description: "Akses semua template & elemen premium Canva.", price: 10000, original_price: 95000, duration: "1 Bulan", features: ["Template premium", "Remove background", "Brand kit"], account_fields: ["email", "access_link"], is_featured: true, stock_count: 50, sold_count: 731 },
  { ...base, id: "p4", category_id: "c4", categories: cat("c4"), name: "ChatGPT Plus", slug: "chatgpt-plus", description: "Akses model AI terbaru, lebih cepat & prioritas.", price: 85000, original_price: 330000, duration: "1 Bulan", features: ["Model terbaru", "Prioritas akses", "Sharing aman"], account_fields: ["email", "password"], is_featured: true, stock_count: 5, sold_count: 96 },
  { ...base, id: "p5", category_id: "c1", categories: cat("c1"), name: "Disney+ Hotstar", slug: "disney-hotstar", description: "Akses Disney+, Marvel, Star Wars & Pixar.", price: 25000, original_price: 39000, duration: "1 Bulan", features: ["Full HD", "Bisa 2 device", "Garansi 30 hari"], account_fields: ["email", "password"], is_featured: false, stock_count: 8, sold_count: 120 },
  { ...base, id: "p6", category_id: "c2", categories: cat("c2"), name: "YouTube Premium", slug: "youtube-premium", description: "YouTube tanpa iklan + YouTube Music Premium.", price: 15000, original_price: 59000, duration: "1 Bulan", features: ["Tanpa iklan", "Background play", "YouTube Music"], account_fields: ["email", "access_link"], is_featured: false, stock_count: 0, sold_count: 340 },
];
