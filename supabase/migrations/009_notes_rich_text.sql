-- Rich-text notes: Tiptap JSON, plaintext search, attachments, storage

-- ---------------------------------------------------------------------------
-- notes columns
-- ---------------------------------------------------------------------------
alter table public.notes add column if not exists content_json jsonb;
alter table public.notes add column if not exists content_plain text not null default '';

-- Migrate existing plain-text body -> Tiptap JSON (one paragraph per line)
update public.notes
set
  content_json = jsonb_build_object(
    'type', 'doc',
    'content', coalesce(
      (
        select jsonb_agg(
          case
            when line = '' then jsonb_build_object('type', 'paragraph')
            else jsonb_build_object(
              'type', 'paragraph',
              'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', line))
            )
          end
          order by ord
        )
        from (
          select line, row_number() over () as ord
          from regexp_split_to_table(coalesce(body, ''), E'\n') as line
        ) lines
      ),
      '[]'::jsonb
    )
  ),
  content_plain = coalesce(body, '')
where content_json is null;

alter table public.notes alter column content_json set default '{"type":"doc","content":[]}'::jsonb;
update public.notes set content_json = '{"type":"doc","content":[]}'::jsonb where content_json is null;
alter table public.notes alter column content_json set not null;

-- Optional: pg_trgm for faster ILIKE on content_plain
create extension if not exists pg_trgm;

-- Full-text search vector (title weighted higher than body plain text)
alter table public.notes drop column if exists search_vector;
alter table public.notes add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(content_plain, '')), 'B')
  ) stored;

create index if not exists notes_search_vector_idx on public.notes using gin (search_vector);
create index if not exists notes_content_plain_trgm_idx on public.notes using gin (content_plain gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- note_attachments (non-inline documents)
-- ---------------------------------------------------------------------------
create table if not exists public.note_attachments (
  id uuid primary key default uuid_generate_v4(),
  note_id uuid references public.notes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_path text not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null check (file_size > 0),
  created_at timestamptz default now()
);

create index if not exists note_attachments_note_id_idx on public.note_attachments(note_id);
create index if not exists note_attachments_user_id_idx on public.note_attachments(user_id);

alter table public.note_attachments enable row level security;

grant select, insert, update, delete on table public.note_attachments to authenticated;

drop policy if exists admin_full_access_note_attachments on public.note_attachments;
create policy admin_full_access_note_attachments on public.note_attachments
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- storage bucket: note-attachments (private, 20 MB)
-- Path: {user_id}/{note_id}/{filename}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('note-attachments', 'note-attachments', false, 20971520)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists note_attachments_select on storage.objects;
create policy note_attachments_select on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'note-attachments'
    and public.is_admin()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists note_attachments_insert on storage.objects;
create policy note_attachments_insert on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'note-attachments'
    and public.is_admin()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists note_attachments_update on storage.objects;
create policy note_attachments_update on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'note-attachments'
    and public.is_admin()
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'note-attachments'
    and public.is_admin()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists note_attachments_delete on storage.objects;
create policy note_attachments_delete on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'note-attachments'
    and public.is_admin()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- body column kept for rollback safety; app reads content_json / content_plain
comment on column public.notes.body is 'Deprecated: use content_json and content_plain';
