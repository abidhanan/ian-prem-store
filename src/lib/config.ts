export const SITE_NAME = "Ian Prem Store";
export const SITE_TAGLINE = "Akun premium murah, aman & bergaransi";
// Alamat utama situs (dipakai untuk URL absolut gambar pratinjau/Open Graph)
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ianpremstore.vercel.app";
export const SITE_DESCRIPTION = "Toko aplikasi premium terpercaya, harga bersahabat, proses cepat, dan bergaransi.";

// Nomor WhatsApp admin (format internasional tanpa + dan spasi)
export const WHATSAPP_NUMBER = "6285184718334";
export const WHATSAPP_DISPLAY = "+62 851-8471-8334";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
export const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const PRODUCT_IMAGE_BUCKET = "product-images";
