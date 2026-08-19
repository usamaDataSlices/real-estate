-- User-owned spreadsheet workbooks with JSON cell data for efficient autosaving.
create table if not exists public.spreadsheets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null default 'Untitled spreadsheet',
  cell_data jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spreadsheets_user_updated_idx on public.spreadsheets(user_id, updated_at desc);
alter table public.spreadsheets enable row level security;
grant select, insert, update, delete on table public.spreadsheets to authenticated;

drop policy if exists users_read_own_spreadsheets on public.spreadsheets;
create policy users_read_own_spreadsheets on public.spreadsheets for select to authenticated using (auth.uid() = user_id);
drop policy if exists users_create_own_spreadsheets on public.spreadsheets;
create policy users_create_own_spreadsheets on public.spreadsheets for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists users_update_own_spreadsheets on public.spreadsheets;
create policy users_update_own_spreadsheets on public.spreadsheets for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists users_delete_own_spreadsheets on public.spreadsheets;
create policy users_delete_own_spreadsheets on public.spreadsheets for delete to authenticated using (auth.uid() = user_id);
