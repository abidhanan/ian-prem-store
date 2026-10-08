-- =====================================================================
--  DATA DUMMY untuk SEMUA produk (OPSIONAL, aman dijalankan ulang)
--  Jalankan di Supabase Dashboard → SQL Editor → Run.
--
--  Yang dilakukan:
--   1) Melengkapi data produk yang masih kosong (deskripsi, durasi, harga coret,
--      keunggulan) dan mengisi jumlah terjual agar toko terlihat hidup.
--   2) Menambah 10 akun dummy per produk ke Gudang Akun, sehingga stok tampil.
--      stock_count produk diperbarui otomatis oleh trigger.
--
--  PENTING: akun dummy memakai email @example.com. Jangan konfirmasi pesanan
--  asli memakai stok dummy. Hapus sebelum mulai berjualan dengan perintah di
--  bagian paling bawah file ini.
-- =====================================================================

-- 1) Lengkapi data produk yang kosong
update public.products p
set
  description    = coalesce(
                     nullif(trim(p.description), ''),
                     'Akun ' || p.name || ' premium bergaransi. Proses cepat, harga hemat, dan didukung admin via WhatsApp.'
                   ),
  duration       = coalesce(nullif(trim(p.duration), ''), '1 Bulan'),
  original_price = coalesce(p.original_price, (round(p.price * 1.6 / 1000.0) * 1000)::int),
  features       = case
                     when coalesce(array_length(p.features, 1), 0) = 0
                       then array['Bergaransi selama masa aktif', 'Proses cepat', 'Support via WhatsApp']
                     else p.features
                   end,
  sold_count     = case
                     when p.sold_count < 20 then 20 + (abs(hashtext(p.slug)) % 480)
                     else p.sold_count
                   end;

-- 2) Akun dummy di Gudang Akun (10 per produk, dilewati jika sudah ada)
insert into public.account_stock (product_id, email, password, profile, pin, access_link, notes, status)
select
  p.id,
  'dummy.' || p.slug || '.' || lpad(n::text, 2, '0') || '@example.com',
  'Dummy#' || lpad(((n * 7919) % 10000)::text, 4, '0'),
  case when 'profile' = any (p.account_fields) then 'Profil ' || (((n - 1) % 5) + 1) end,
  case when 'pin' = any (p.account_fields) then lpad(((n * 1373) % 10000)::text, 4, '0') end,
  case when 'access_link' = any (p.account_fields) then 'https://example.com/akses/' || p.slug || '-' || lpad(n::text, 2, '0') end,
  'DATA DUMMY - hapus sebelum jualan',
  'available'
from public.products p
cross join generate_series(1, 10) as n
where not exists (
  select 1
  from public.account_stock s
  where s.product_id = p.id
    and s.email = 'dummy.' || p.slug || '.' || lpad(n::text, 2, '0') || '@example.com'
);

-- =====================================================================
--  HAPUS AKUN DUMMY (jalankan nanti, sebelum jualan sungguhan):
-- =====================================================================
-- delete from public.account_stock
--  where notes like 'DATA DUMMY%' and status = 'available';
