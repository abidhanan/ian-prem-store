# 👑 Ian Prem Store — Jual Beli Aplikasi Premium

Website toko akun aplikasi premium (Netflix, Spotify, Canva, dll.) dengan 2 role: **Admin** dan **User**.

- **Stack:** Next.js 16 (App Router) + Tailwind CSS v4 + Supabase (Auth, Postgres, Storage) + Recharts
- **Biaya:** Rp0 — Supabase Free Plan + Vercel Hobby Plan

## 📘 Panduan Pengguna

Panduan lengkap untuk **Pembeli** dan **Admin** (30 halaman, bergambar): [`docs/Panduan-IanPrem-Store.pdf`](docs/Panduan-IanPrem-Store.pdf).
Sumbernya ada di `docs/panduan/panduan.html` (bisa diedit lalu dicetak ulang ke PDF lewat Chrome → Print → Save as PDF).

## ✨ Fitur

**Pengunjung / User**
- Lihat kategori & produk tanpa login (preview publik)
- Wajib login/daftar untuk membeli
- Checkout → diarahkan ke WhatsApp admin (**+62 889-8008-1680**) dengan pesan otomatis berisi kode pesanan
- Menu **Pesanan Saya**: status pesanan & detail akun (email, password, profil, PIN, link) muncul otomatis setelah admin konfirmasi
- Bisa membatalkan pesanan yang masih menunggu

**Admin** (`/admin`)
- **Dashboard**: KPI (pendapatan, pesanan, menunggu konfirmasi, pengguna), grafik pendapatan/pesanan harian, donut status pesanan, donut pendapatan per kategori, bar produk terlaris, stok menipis, transaksi terbaru — dengan filter 7/30/90 hari
- **Transaksi**: riwayat semua transaksi, filter status, pencarian, konfirmasi pembayaran (akun otomatis terkirim ke user), batalkan, detail, chat pembeli, export CSV
- **Produk**: tambah/edit/hapus, upload gambar, harga coret, durasi, keunggulan, pilih kolom data akun, aktif/nonaktif, unggulan
- **Kategori**: tambah/edit/hapus dengan ikon emoji & warna
- **Gudang Akun**: stok akun per produk (email, password, profil, PIN, link akses — semua opsional), tambah satuan atau massal, sembunyikan password

**Keamanan**: semua aturan dijaga di database dengan Row Level Security. User hanya bisa melihat akun dari pesanan miliknya yang sudah selesai; harga & stok dihitung di server (RPC), bukan di browser.

---

## 🚀 Panduan Setup (±15 menit)

### 1. Buat project Supabase (gratis)
1. Daftar/login di https://supabase.com → **New project** (pilih region *Southeast Asia (Singapore)*).
2. Buka **SQL Editor** → **New query** → salin seluruh isi [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. (Opsional) Jalankan [`supabase/seed.sql`](supabase/seed.sql) untuk data contoh kategori & produk.
4. Buka **Authentication → Sign In / Providers → Email**:
   - Paling mudah: **matikan "Confirm email"** agar user bisa langsung login setelah daftar.
     (Email bawaan Supabase gratis dibatasi hanya beberapa email per jam.)
5. Buka **Project Settings → API** (atau tombol **Connect**) dan salin **Project URL** + **anon / publishable key**.

### 2. Jalankan di komputer
```bash
cp .env.example .env.local   # lalu isi NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```
Buka http://localhost:3000

### 3. Jadikan akun Anda admin
1. Daftar lewat halaman `/register`.
2. Di Supabase **SQL Editor**, jalankan:
   ```sql
   update public.profiles set role = 'admin' where email = 'emailanda@gmail.com';
   ```
3. Refresh website → menu **Dashboard Admin** muncul di dropdown profil (atau buka `/admin`).

### 4. Deploy ke Vercel (gratis)
1. Upload project ini ke GitHub (repo boleh private).
2. Login https://vercel.com dengan GitHub → **Add New → Project** → pilih repo.
3. Di **Environment Variables** isi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (opsional) `NEXT_PUBLIC_WHATSAPP_NUMBER` = `6288980081680`, `NEXT_PUBLIC_SITE_NAME`
4. Klik **Deploy**.
5. Kembali ke Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `https://nama-project.vercel.app`
   - **Redirect URLs**: tambahkan `https://nama-project.vercel.app/**`

> ⚠️ Supabase Free akan **menjeda project** yang tidak aktif selama 7 hari. Cukup buka dashboard Supabase lalu klik *Restore* bila terjadi.

---

## 🔄 Alur Transaksi

1. User pilih produk → **Beli Sekarang** (wajib login) → pesanan dibuat dengan status **Menunggu**.
2. User klik **Bayar via WhatsApp** → chat ke admin dengan kode pesanan & total.
3. Admin menerima pembayaran → buka **Admin → Transaksi** → **Konfirmasi**.
4. Sistem otomatis mengambil akun dari **Gudang Akun** dan mengirimkannya ke user → status **Selesai**.
5. User melihat detail akun di **Pesanan Saya**.

## 📥 Format Tambah Akun Massal

Satu akun per baris, kolom dipisah `|` sesuai kolom data akun yang dipilih di produk, contoh untuk Netflix (email, password, profil, PIN):
```
akun1@gmail.com|pass123|Profil 1|1111
akun1@gmail.com|pass123|Profil 2|2222|catatan opsional
```

## 📁 Struktur

```
supabase/schema.sql        Skema database, RLS, fungsi transaksi
supabase/seed.sql          Data contoh (opsional)
src/app/(shop)             Halaman toko: beranda, produk, pesanan saya
src/app/(auth)             Login & daftar
src/app/admin              Dashboard, transaksi, produk, kategori, gudang akun
src/components             Komponen UI
src/lib                    Supabase client, query, util, konfigurasi
```

Nomor WhatsApp & nama toko bisa diubah di `src/lib/config.ts` atau lewat environment variable.
