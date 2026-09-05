-- 0011_index_missing_fk_columns.sql
-- Index pre-existing FK columns that were missing indexes in the foundation migration.
-- Per Supabase best practices, FK columns should always be indexed for fast JOINs and CASCADE.
create index properties_host_idx on public.properties(host_id);
create index rooms_property_idx on public.rooms(property_id);
