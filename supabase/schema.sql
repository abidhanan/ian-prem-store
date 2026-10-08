-- =====================================================================
--  Ian Prem Store — Skema Database Supabase
--  Jalankan seluruh file ini di Supabase Dashboard → SQL Editor → Run
--  (Aman dijalankan ulang / idempotent)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. PROFILES (terhubung ke auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  phone       text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

-- Helper: cek apakah user yang login adalah admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Otomatis buat profil saat user mendaftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. CATEGORIES
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  icon        text default '✨',
  color       text default 'violet',
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. PRODUCTS
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid references public.categories (id) on delete set null,
  name            text not null,
  slug            text not null unique,
  description     text,
  image_url       text,
  price           integer not null check (price >= 0),
  original_price  integer check (original_price is null or original_price >= 0),
  duration        text,
  features        text[] not null default '{}',
  -- kolom akun yang relevan untuk produk ini: email, password, profile, pin, access_link
  account_fields  text[] not null default '{email,password}',
  is_active       boolean not null default true,
  is_featured     boolean not null default false,
  stock_count     integer not null default 0,
  sold_count      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);

-- ---------------------------------------------------------------------
-- 4. ORDERS (transaksi)
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  order_code     text not null unique,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  product_id     uuid references public.products (id) on delete restrict,
  product_name   text not null,
  category_name  text,
  unit_price     integer not null,
  quantity       integer not null default 1 check (quantity > 0),
  total          integer not null,
  status         text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  customer_note  text,
  admin_note     text,
  created_at     timestamptz not null default now(),
  completed_at   timestamptz,
  cancelled_at   timestamptz
);

create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- ---------------------------------------------------------------------
-- 5. ACCOUNT STOCK (gudang akun)
-- ---------------------------------------------------------------------
create table if not exists public.account_stock (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  email        text,
  password     text,
  profile      text,
  pin          text,
  access_link  text,
  notes        text,
  status       text not null default 'available' check (status in ('available', 'sold')),
  order_id     uuid references public.orders (id) on delete set null,
  created_at   timestamptz not null default now(),
  sold_at      timestamptz
);

create index if not exists stock_product_status_idx on public.account_stock (product_id, status);
create index if not exists stock_order_idx on public.account_stock (order_id);

-- Sinkronisasi otomatis products.stock_count
create or replace function public.refresh_stock_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
begin
  for pid in
    select distinct x from unnest(array[
      case when tg_op in ('INSERT', 'UPDATE') then new.product_id end,
      case when tg_op in ('UPDATE', 'DELETE') then old.product_id end
    ]) as x where x is not null
  loop
    update public.products
       set stock_count = (
         select count(*) from public.account_stock
          where product_id = pid and status = 'available'
       )
     where id = pid;
  end loop;
  return null;
end;
$$;

drop trigger if exists account_stock_count on public.account_stock;
create trigger account_stock_count
  after insert or update or delete on public.account_stock
  for each row execute function public.refresh_stock_count();

-- updated_at otomatis pada products
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch
  before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 6. RPC: BUAT PESANAN (user)
-- ---------------------------------------------------------------------
create or replace function public.create_order(
  p_product_id uuid,
  p_quantity   int default 1,
  p_note       text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product  public.products;
  v_category text;
  v_order    public.orders;
  v_code     text;
begin
  if auth.uid() is null then
    raise exception 'Silakan login terlebih dahulu';
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 20 then
    raise exception 'Jumlah pembelian tidak valid (1-20)';
  end if;

  select * into v_product from public.products where id = p_product_id and is_active;
  if not found then
    raise exception 'Produk tidak ditemukan atau tidak aktif';
  end if;

  if v_product.stock_count < p_quantity then
    raise exception 'Stok tidak mencukupi (tersisa %)', v_product.stock_count;
  end if;

  select name into v_category from public.categories where id = v_product.category_id;

  v_code := 'IPS-' || to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD') || '-'
            || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (
    order_code, user_id, product_id, product_name, category_name,
    unit_price, quantity, total, customer_note
  ) values (
    v_code, auth.uid(), v_product.id, v_product.name, v_category,
    v_product.price, p_quantity, v_product.price * p_quantity, nullif(trim(p_note), '')
  )
  returning * into v_order;

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. RPC: KONFIRMASI PESANAN (admin) → kirim akun ke user
-- ---------------------------------------------------------------------
create or replace function public.confirm_order(p_order_id uuid, p_admin_note text default null)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_ids   uuid[];
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat mengonfirmasi pesanan';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'Pesanan sudah diproses sebelumnya';
  end if;

  select array_agg(id) into v_ids from (
    select id from public.account_stock
     where product_id = v_order.product_id and status = 'available'
     order by created_at
     limit v_order.quantity
     for update skip locked
  ) s;

  if coalesce(array_length(v_ids, 1), 0) < v_order.quantity then
    raise exception 'Stok akun tidak mencukupi. Tambahkan stok di Gudang Akun terlebih dahulu';
  end if;

  update public.account_stock
     set status = 'sold', order_id = v_order.id, sold_at = now()
   where id = any (v_ids);

  update public.products
     set sold_count = sold_count + v_order.quantity
   where id = v_order.product_id;

  update public.orders
     set status = 'completed',
         completed_at = now(),
         admin_note = coalesce(nullif(trim(p_admin_note), ''), admin_note)
   where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. RPC: BATALKAN PESANAN (admin, atau user untuk pesanan pending miliknya)
-- ---------------------------------------------------------------------
create or replace function public.cancel_order(p_order_id uuid, p_reason text default null)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;
  if not (public.is_admin() or v_order.user_id = auth.uid()) then
    raise exception 'Tidak diizinkan';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'Hanya pesanan berstatus menunggu yang dapat dibatalkan';
  end if;

  update public.orders
     set status = 'cancelled',
         cancelled_at = now(),
         admin_note = coalesce(nullif(trim(p_reason), ''), admin_note)
   where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------
-- 8b. RPC: STATISTIK DASHBOARD (admin)
-- ---------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Tidak diizinkan';
  end if;
  return json_build_object(
    'total_revenue',   (select coalesce(sum(total), 0) from public.orders where status = 'completed'),
    'total_orders',    (select count(*) from public.orders),
    'completed',       (select count(*) from public.orders where status = 'completed'),
    'pending',         (select count(*) from public.orders where status = 'pending'),
    'cancelled',       (select count(*) from public.orders where status = 'cancelled'),
    'users',           (select count(*) from public.profiles where role = 'user'),
    'products',        (select count(*) from public.products),
    'stock_available', (select count(*) from public.account_stock where status = 'available'),
    'stock_sold',      (select count(*) from public.account_stock where status = 'sold')
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.categories    enable row level security;
alter table public.products      enable row level security;
alter table public.orders        enable row level security;
alter table public.account_stock enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Hak akses tabel untuk Data API (RLS di atas tetap membatasi baris yang boleh diakses)
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant select, insert, update, delete on public.account_stock to authenticated;
grant select, update, delete on public.orders to authenticated;   -- insert hanya lewat RPC create_order
grant select on public.profiles to authenticated;

-- user hanya boleh mengubah nama & nomor HP (bukan role)
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone) on public.profiles to authenticated;

-- categories: publik bisa lihat, admin kelola
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select using (true);

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- products: publik lihat produk aktif, admin lihat & kelola semua
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (is_active or public.is_admin());

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- orders: user lihat miliknya, admin lihat semua. Insert/update via RPC saja.
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete" on public.orders
  for delete using (public.is_admin());

-- account_stock: admin kelola, user hanya lihat akun dari pesanan selesai miliknya
drop policy if exists "stock_admin_all" on public.account_stock;
create policy "stock_admin_all" on public.account_stock
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "stock_owner_read" on public.account_stock;
create policy "stock_owner_read" on public.account_stock
  for select using (
    exists (
      select 1 from public.orders o
       where o.id = account_stock.order_id
         and o.user_id = auth.uid()
         and o.status = 'completed'
    )
  );

-- izin eksekusi RPC
revoke execute on function public.create_order(uuid, int, text) from public, anon;
revoke execute on function public.confirm_order(uuid, text)     from public, anon;
revoke execute on function public.cancel_order(uuid, text)      from public, anon;
grant  execute on function public.create_order(uuid, int, text) to authenticated;
grant  execute on function public.confirm_order(uuid, text)     to authenticated;
grant  execute on function public.cancel_order(uuid, text)      to authenticated;
revoke execute on function public.admin_dashboard_stats()       from public, anon;
grant  execute on function public.admin_dashboard_stats()       to authenticated;

-- ---------------------------------------------------------------------
-- 10. STORAGE: bucket gambar produk
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());
