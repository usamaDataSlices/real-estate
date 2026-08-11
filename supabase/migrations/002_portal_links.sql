-- Add portal_links jsonb and backfill from legacy bayut_url / external_url.
-- Leaves bayut_url and external_url in place for a follow-up drop once verified.

alter table properties
  add column if not exists portal_links jsonb not null default '[]'::jsonb;

update properties
set portal_links =
  (case
    when bayut_url is not null and btrim(bayut_url) <> ''
      then jsonb_build_array(jsonb_build_object('portal', 'bayut', 'url', bayut_url))
    else '[]'::jsonb
  end)
  ||
  (case
    when external_url is not null and btrim(external_url) <> ''
      then jsonb_build_array(jsonb_build_object('portal', 'other', 'url', external_url))
    else '[]'::jsonb
  end)
where
  (bayut_url is not null and btrim(bayut_url) <> '')
  or (external_url is not null and btrim(external_url) <> '');
