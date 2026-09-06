-- 0028_room_media_storage.sql
--
-- Give hosts a production-safe place to upload listing photography and attach
-- room-specific images to the existing property_media table.

-- ============================================================
-- Property media metadata
-- ============================================================

alter table public.property_media
  add column if not exists room_id uuid references public.rooms(id) on delete cascade;

alter table public.property_media
  add column if not exists storage_path text;

create index if not exists property_media_room_idx
  on public.property_media(room_id, sort_order);

create index if not exists property_media_property_room_idx
  on public.property_media(property_id, room_id, sort_order);

-- ============================================================
-- Supabase Storage bucket
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'property-media',
  'property-media',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- The first path segment is always the authenticated user's id. Property
-- ownership is enforced again by the property_media RLS policy when the URL
-- is recorded against a listing.

drop policy if exists "hosts can upload property media objects" on storage.objects;
drop policy if exists "hosts can read property media objects" on storage.objects;
drop policy if exists "hosts can update property media objects" on storage.objects;
drop policy if exists "hosts can delete property media objects" on storage.objects;

create policy "hosts can upload property media objects"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "hosts can read property media objects"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "hosts can update property media objects"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "hosts can delete property media objects"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
