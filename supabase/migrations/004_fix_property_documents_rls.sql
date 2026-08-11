-- Fix property_documents permissions for admin document saves (403 Forbidden).
-- Run in Supabase SQL editor if document save fails with 403.

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

-- Ensure admin profiles exist for users created before the auth trigger ran
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.email),
  'admin'
from auth.users u
on conflict (id) do update
set role = excluded.role
where public.profiles.role is distinct from 'admin';

alter table public.property_documents enable row level security;

grant select on table public.property_documents to anon, authenticated;
grant insert, update, delete on table public.property_documents to authenticated;

drop policy if exists admin_full_access_documents on public.property_documents;
create policy admin_full_access_documents on public.property_documents
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists public_select_published_documents on public.property_documents;
create policy public_select_published_documents on public.property_documents
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.properties p
      where p.id = property_documents.property_id
        and p.status = 'published'
    )
  );
