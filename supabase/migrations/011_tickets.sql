-- Workspace tickets (admin-only) with document attachments

create table if not exists public.tickets (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null default '',
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority text not null default 'medium'
    check (priority in ('lowest', 'low', 'medium', 'high', 'urgent')),
  type text not null default 'task'
    check (type in ('task', 'bug', 'story', 'improvement')),
  assignee text not null default '',
  labels text[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists tickets_updated_at_idx on public.tickets(updated_at desc);
create index if not exists tickets_status_idx on public.tickets(status);
create index if not exists tickets_priority_idx on public.tickets(priority);

alter table public.tickets enable row level security;

grant select, insert, update, delete on table public.tickets to authenticated;

drop policy if exists admin_full_access_tickets on public.tickets;
create policy admin_full_access_tickets on public.tickets
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- ticket_attachments
-- ---------------------------------------------------------------------------
create table if not exists public.ticket_attachments (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_path text not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null check (file_size > 0),
  created_at timestamptz default now()
);

create index if not exists ticket_attachments_ticket_id_idx on public.ticket_attachments(ticket_id);
create index if not exists ticket_attachments_user_id_idx on public.ticket_attachments(user_id);

alter table public.ticket_attachments enable row level security;

grant select, insert, update, delete on table public.ticket_attachments to authenticated;

drop policy if exists admin_full_access_ticket_attachments on public.ticket_attachments;
create policy admin_full_access_ticket_attachments on public.ticket_attachments
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- storage bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ticket-attachments',
  'ticket-attachments',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
on conflict (id) do nothing;

drop policy if exists admin_ticket_attachments_select on storage.objects;
create policy admin_ticket_attachments_select on storage.objects
  for select
  to authenticated
  using (bucket_id = 'ticket-attachments' and public.is_admin());

drop policy if exists admin_ticket_attachments_insert on storage.objects;
create policy admin_ticket_attachments_insert on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'ticket-attachments' and public.is_admin());

drop policy if exists admin_ticket_attachments_update on storage.objects;
create policy admin_ticket_attachments_update on storage.objects
  for update
  to authenticated
  using (bucket_id = 'ticket-attachments' and public.is_admin())
  with check (bucket_id = 'ticket-attachments' and public.is_admin());

drop policy if exists admin_ticket_attachments_delete on storage.objects;
create policy admin_ticket_attachments_delete on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'ticket-attachments' and public.is_admin());
