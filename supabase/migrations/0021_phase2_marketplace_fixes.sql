-- 0021_phase2_marketplace_fixes.sql
-- Phase 2 marketplace fixes:
--   1. Add missing columns to bookings (rooms, notes, updated_at)
--   2. Add missing columns to room_inventory (created_at, updated_at)
--   3. Add missing media_type column to property_media
--   4. Add RLS policies for property_media (hosts manage their own)
--   5. Add RLS policies for room_inventory and room_prices (public read)
--   6. Add RLS policies for amenities (public read)
--   7. Add RLS policies for property_amenities and room_amenities (public read)

-- ============================================================
-- 1. bookings: add missing columns
-- ============================================================
alter table public.bookings
  add column if not exists rooms smallint not null default 1 check (rooms > 0),
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

-- ============================================================
-- 2. room_inventory: add missing columns
-- ============================================================
alter table public.room_inventory
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- ============================================================
-- 3. property_media: add media_type column
-- ============================================================
alter table public.property_media
  add column if not exists media_type text not null default 'IMAGE'
    check (media_type in ('IMAGE', 'VIDEO'));

-- ============================================================
-- 4. RLS: property_media — hosts manage their own property media
-- ============================================================
create policy "hosts can read media for their properties"
  on public.property_media
  for select
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      join public.host_profiles hp on hp.id = p.host_id
      where p.id = property_media.property_id
        and hp.user_id = auth.uid()
    )
  );

create policy "hosts can insert media for their properties"
  on public.property_media
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.properties p
      join public.host_profiles hp on hp.id = p.host_id
      where p.id = property_media.property_id
        and hp.user_id = auth.uid()
    )
  );

create policy "hosts can update media for their properties"
  on public.property_media
  for update
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      join public.host_profiles hp on hp.id = p.host_id
      where p.id = property_media.property_id
        and hp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      join public.host_profiles hp on hp.id = p.host_id
      where p.id = property_media.property_id
        and hp.user_id = auth.uid()
    )
  );

create policy "hosts can delete media for their properties"
  on public.property_media
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      join public.host_profiles hp on hp.id = p.host_id
      where p.id = property_media.property_id
        and hp.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. RLS: room_inventory — public read for published properties
-- ============================================================
create policy "public can read inventory for published properties"
  on public.room_inventory
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.rooms r
      join public.properties p on p.id = r.property_id
      where r.id = room_inventory.room_id
        and p.status = 'PUBLISHED'
    )
  );

-- ============================================================
-- 6. RLS: room_prices — public read for published properties
-- ============================================================
create policy "public can read prices for published properties"
  on public.room_prices
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.rooms r
      join public.properties p on p.id = r.property_id
      where r.id = room_prices.room_id
        and p.status = 'PUBLISHED'
    )
  );

-- ============================================================
-- 7. RLS: amenities — public read
-- ============================================================
create policy "public can read amenities"
  on public.amenities
  for select
  to anon, authenticated
  using (status = 'ACTIVE');

-- ============================================================
-- 8. RLS: property_amenities — public read for published properties
-- ============================================================
create policy "public can read property amenities for published properties"
  on public.property_amenities
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_amenities.property_id
        and p.status = 'PUBLISHED'
    )
  );

-- ============================================================
-- 9. RLS: room_amenities — public read for published properties
-- ============================================================
create policy "public can read room amenities for published properties"
  on public.room_amenities
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.rooms r
      join public.properties p on p.id = r.property_id
      where r.id = room_amenities.room_id
        and p.status = 'PUBLISHED'
    )
  );

-- ============================================================
-- 10. RLS: property_media — public read for published properties
-- ============================================================
create policy "public can read media for published properties"
  on public.property_media
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_media.property_id
        and p.status = 'PUBLISHED'
    )
  );

-- ============================================================
-- 11. RLS: rooms — public read for published properties
-- ============================================================
create policy "public can read rooms for published properties"
  on public.rooms
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = rooms.property_id
        and p.status = 'PUBLISHED'
    )
  );
