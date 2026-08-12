-- Unique title for Excel import upserts (scripts/import-properties.js)

create unique index if not exists properties_title_key on public.properties (title);
