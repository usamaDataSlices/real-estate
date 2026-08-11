-- Supabase SQL migration: initial schema for listings portal
-- Run in Supabase SQL editor or via supabase CLI

create extension if not exists "uuid-ossp";

-- profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'admin',
  avatar_url text
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'admin',
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- properties
create table if not exists properties (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  type text,
  address text,
  city text,
  area text,
  price numeric,
  rent_frequency text,
  bedrooms int,
  bathrooms int,
  size numeric,
  amenities text[] default array[]::text[],
  status text default 'draft',
  bayut_url text,
  external_url text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- property_images
create table if not exists property_images (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete cascade,
  url text not null,
  storage_path text,
  sort_order int default 0,
  is_cover boolean default false
);

-- Row Level Security (RLS)
-- Allow public (anon) SELECT only on published listings
alter table properties enable row level security;
drop policy if exists public_select_published on properties;
create policy public_select_published on properties for select using (status = 'published');

-- Admin full access: requires a profile row with role = 'admin' matching auth.uid()
drop policy if exists admin_full_access on properties;
create policy admin_full_access on properties
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Make sure profiles table is writable only by owners/admins as needed (basic example)
alter table profiles enable row level security;
drop policy if exists profiles_self on profiles;
create policy profiles_self on profiles for all using (id = auth.uid());

alter table property_images enable row level security;
drop policy if exists public_select_published_images on property_images;
create policy public_select_published_images on property_images
  for select using (
    exists (
      select 1 from properties p
      where p.id = property_images.property_id and p.status = 'published'
    )
  );

drop policy if exists admin_full_access_images on property_images;
create policy admin_full_access_images on property_images
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
