-- =====================================================================
--  Data contoh (OPSIONAL). Jalankan setelah schema.sql
-- =====================================================================

insert into public.categories (name, slug, icon, color, description, sort_order) values
  ('Streaming Film', 'streaming-film', '🎬', 'rose',    'Nonton film & series favorit tanpa iklan', 1),
  ('Musik',          'musik',          '🎧', 'emerald', 'Dengarkan musik tanpa batas & offline',     2),
  ('Desain & Kreatif','desain',        '🎨', 'violet',  'Tools desain premium untuk kreator',        3),
  ('Produktivitas',  'produktivitas',  '⚡', 'amber',   'Kerja lebih cepat dengan AI & tools pro',   4)
on conflict (slug) do nothing;

insert into public.products (category_id, name, slug, description, price, original_price, duration, features, account_fields, is_featured)
select c.id, p.name, p.slug, p.description, p.price, p.original_price, p.duration, p.features, p.account_fields, p.is_featured
from (values
  ('streaming-film', 'Netflix Premium Sharing', 'netflix-premium-sharing',
   'Akun Netflix Premium 4K UHD, 1 profil pribadi dengan PIN.', 35000, 54000, '1 Bulan',
   array['Kualitas 4K UHD','1 Profil + PIN pribadi','Garansi full 30 hari'], array['email','password','profile','pin'], true),
  ('streaming-film', 'Disney+ Hotstar', 'disney-hotstar',
   'Akses Disney+, Marvel, Star Wars & Pixar.', 25000, 39000, '1 Bulan',
   array['Full HD','Bisa 2 device','Garansi 30 hari'], array['email','password'], false),
  ('musik', 'Spotify Premium Individual', 'spotify-premium',
   'Upgrade langsung via link invite family, tanpa iklan & bisa download.', 20000, 55000, '1 Bulan',
   array['Tanpa iklan','Download offline','Via link invite'], array['email','password','access_link'], true),
  ('musik', 'YouTube Premium', 'youtube-premium',
   'YouTube tanpa iklan + YouTube Music Premium.', 15000, 59000, '1 Bulan',
   array['Tanpa iklan','Background play','YouTube Music'], array['email','access_link'], false),
  ('desain', 'Canva Pro', 'canva-pro',
   'Akses semua template & elemen premium Canva.', 10000, 95000, '1 Bulan',
   array['Template premium','Remove background','Brand kit'], array['email','access_link'], true),
  ('produktivitas', 'ChatGPT Plus', 'chatgpt-plus',
   'Akses model AI terbaru, lebih cepat & prioritas.', 85000, 330000, '1 Bulan',
   array['Model terbaru','Prioritas akses','Sharing aman'], array['email','password'], true)
) as p(cat_slug, name, slug, description, price, original_price, duration, features, account_fields, is_featured)
join public.categories c on c.slug = p.cat_slug
on conflict (slug) do nothing;

-- =====================================================================
--  JADIKAN AKUN ANDA ADMIN
--  1) Daftar dulu lewat halaman /register di website
--  2) Ganti email di bawah, lalu jalankan:
-- =====================================================================
-- update public.profiles set role = 'admin' where email = 'emailanda@gmail.com';
