-- Supabase SQL migration: create property_documents table
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

-- Admin full access
drop policy if exists admin_full_access_documents on property_documents;
create policy admin_full_access_documents on property_documents
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Public safe select (read-only for published properties)
drop policy if exists public_select_published_documents on property_documents;
create policy public_select_published_documents on property_documents
  for select using (
    exists (
      select 1 from properties p
      where p.id = property_documents.property_id and p.status = 'published'
    )
  );
