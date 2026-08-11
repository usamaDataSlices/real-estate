-- Supabase SQL migration: create property_documents table

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists property_documents (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete cascade not null,
  title text not null,
  content text default '',
  file_url text,
  storage_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security (RLS)
alter table property_documents enable row level security;

grant select on table public.property_documents to anon, authenticated;
grant insert, update, delete on table public.property_documents to authenticated;

-- Admin full access
drop policy if exists admin_full_access_documents on property_documents;
create policy admin_full_access_documents on property_documents
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Public safe select (read-only for published properties)
drop policy if exists public_select_published_documents on property_documents;
create policy public_select_published_documents on property_documents
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from properties p
      where p.id = property_documents.property_id and p.status = 'published'
    )
  );
