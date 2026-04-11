do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'utm_source'
  ) then
    alter table public.orders
      rename column utm_source to utm_source_code;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'orders'
      and indexname = 'orders_utm_source_idx'
  ) then
    alter index public.orders_utm_source_idx
      rename to orders_utm_source_code_idx;
  end if;
end $$;

create index if not exists orders_utm_source_code_idx on public.orders (utm_source_code);
