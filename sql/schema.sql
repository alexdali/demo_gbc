create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  retailcrm_order_id bigint not null unique,
  external_id text,
  order_number text,
  created_at timestamptz,
  customer_name text,
  customer_phone text,
  city text,
  status text,
  utm_source_code text,
  total_amount numeric(12, 2) not null default 0,
  currency text not null default 'KZT',
  raw_payload jsonb not null,
  synced_at timestamptz not null default now(),
  notified_high_value boolean not null default false
);

create index if not exists orders_created_at_idx on public.orders (created_at);
create index if not exists orders_total_amount_idx on public.orders (total_amount);
create index if not exists orders_utm_source_code_idx on public.orders (utm_source_code);
create index if not exists orders_city_idx on public.orders (city);
