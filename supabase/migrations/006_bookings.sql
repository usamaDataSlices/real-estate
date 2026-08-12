-- Bookings for property resource timeline calendar

create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) on delete cascade not null,
  check_in date not null,
  check_out date not null,
  guest_name text not null,
  guest_phone text,
  price numeric default 0,
  status text not null default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint bookings_check_out_after_check_in check (check_out >= check_in)
);

create index if not exists bookings_property_id_idx on public.bookings(property_id);
create index if not exists bookings_dates_idx on public.bookings(check_in, check_out);

alter table public.bookings enable row level security;

grant select on table public.bookings to anon, authenticated;
grant insert, update, delete on table public.bookings to authenticated;

drop policy if exists admin_full_access_bookings on public.bookings;
create policy admin_full_access_bookings on public.bookings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
