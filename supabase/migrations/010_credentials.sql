-- Broker credentials vault (admin-only)

create table if not exists public.credentials (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  username text not null default '',
  password text not null default '',
  url text not null default '',
  notes text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists credentials_updated_at_idx on public.credentials(updated_at desc);
create index if not exists credentials_title_idx on public.credentials(title);

alter table public.credentials enable row level security;

grant select, insert, update, delete on table public.credentials to authenticated;

drop policy if exists admin_full_access_credentials on public.credentials;
create policy admin_full_access_credentials on public.credentials
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
