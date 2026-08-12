-- Broker notes with full-text search support

create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists notes_updated_at_idx on public.notes(updated_at desc);
create index if not exists notes_title_idx on public.notes(title);

alter table public.notes enable row level security;

grant select, insert, update, delete on table public.notes to authenticated;

drop policy if exists admin_full_access_notes on public.notes;
create policy admin_full_access_notes on public.notes
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
