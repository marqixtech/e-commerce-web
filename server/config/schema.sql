-- =========================================================
-- MARQIX SHOPPING MALL — Database Schema (PostgreSQL / Supabase)
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query)
-- =========================================================

-- Extension for UUID generation
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- USERS
-- ---------------------------------------------------------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  full_name     varchar(150) not null,
  email         varchar(150) unique not null,
  password_hash text not null,
  role          varchar(20) not null default 'customer', -- 'customer' | 'admin'
  phone         varchar(30),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------
create table if not exists categories (
  id          serial primary key,
  name        varchar(100) unique not null,
  slug        varchar(100) unique not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  name          varchar(200) not null,
  description   text,
  price         numeric(10,2) not null check (price >= 0),
  stock         integer not null default 0 check (stock >= 0),
  category_id   integer references categories(id) on delete set null,
  brand         varchar(100),
  is_featured   boolean not null default false,
  is_deal       boolean not null default false,
  discount_pct  integer default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_name on products using gin (to_tsvector('english', name));

-- ---------------------------------------------------------
-- PRODUCT IMAGES (multiple images per product)
-- ---------------------------------------------------------
create table if not exists product_images (
  id           serial primary key,
  product_id   uuid references products(id) on delete cascade,
  image_url    text not null,
  sort_order   integer default 0
);

-- ---------------------------------------------------------
-- CART
-- ---------------------------------------------------------
create table if not exists cart_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete cascade,
  product_id   uuid references products(id) on delete cascade,
  quantity     integer not null default 1 check (quantity > 0),
  created_at   timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ---------------------------------------------------------
-- WISHLIST
-- ---------------------------------------------------------
create table if not exists wishlist_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete cascade,
  product_id   uuid references products(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ---------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------
create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references users(id) on delete set null,
  status         varchar(30) not null default 'pending',
  -- pending -> processing -> shipped -> delivered -> cancelled
  total_amount   numeric(10,2) not null default 0,
  shipping_name  varchar(150),
  shipping_phone varchar(30),
  shipping_address text,
  payment_method varchar(30) default 'not_set',
  payment_status  varchar(20) default 'unpaid',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid references orders(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  product_name varchar(200) not null, -- snapshot at time of order
  unit_price   numeric(10,2) not null,
  quantity     integer not null check (quantity > 0)
);

-- Order status history (for tracking timeline)
create table if not exists order_status_history (
  id           serial primary key,
  order_id     uuid references orders(id) on delete cascade,
  status       varchar(30) not null,
  note         text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------
-- REVIEWS
-- ---------------------------------------------------------
create table if not exists reviews (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid references products(id) on delete cascade,
  user_id      uuid references users(id) on delete cascade,
  rating       integer not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now(),
  unique (product_id, user_id)
);

-- ---------------------------------------------------------
-- TRIGGER: auto update updated_at
-- ---------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated on users;
create trigger trg_users_updated before update on users
  for each row execute function set_updated_at();

drop trigger if exists trg_products_updated on products;
create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_orders_updated on orders;
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();

-- ---------------------------------------------------------
-- SEED DATA (sample categories + products so the UI has data)
-- ---------------------------------------------------------
insert into categories (name, slug) values
  ('Electronics', 'electronics'),
  ('Fashion', 'fashion'),
  ('Home & Kitchen', 'home-kitchen'),
  ('Beauty', 'beauty'),
  ('Sports', 'sports')
on conflict (name) do nothing;

insert into products (name, description, price, stock, category_id, brand, is_featured, is_deal, discount_pct)
select 'Wireless Headphones', 'Over-ear wireless headphones with noise cancellation.', 99.00, 50,
  (select id from categories where slug='electronics'), 'SoundMax', true, true, 15
where not exists (select 1 from products where name='Wireless Headphones');

insert into products (name, description, price, stock, category_id, brand, is_featured)
select 'Running Sneakers', 'Lightweight breathable running shoes.', 65.00, 80,
  (select id from categories where slug='sports'), 'RunFit', true
where not exists (select 1 from products where name='Running Sneakers');

insert into products (name, description, price, stock, category_id, brand)
select 'Non-stick Cookware Set', '5-piece non-stick cookware set.', 120.00, 30,
  (select id from categories where slug='home-kitchen'), 'HomeChef'
where not exists (select 1 from products where name='Non-stick Cookware Set');
