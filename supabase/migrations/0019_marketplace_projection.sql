-- 0019_marketplace_projection.sql
-- Phase 2: bridge the gap between the normalized schema and the public
-- marketplace projection used by the tourist-facing pages.
--
-- Adds the display/aggregation columns that the Property projection needs
-- (price_from, rating, review_count, hero_image, cancellation_policy),
-- room display fields (room_type, beds, bathroom_type), a property_media
-- table for photos, and seeds amenities + destinations.
--
-- Follows existing conventions: uuid PKs, text, timestamptz, numeric(12,2),
-- check constraints, and indexed FK columns.

-- ============================================================
-- Properties: marketplace projection columns
-- ============================================================
alter table public.properties
  add column if not exists price_from numeric(12,2) check (price_from >= 0),
  add column if not exists rating numeric(3,2) not null default 0 check (rating between 0 and 5),
  add column if not exists review_count integer not null default 0 check (review_count >= 0),
  add column if not exists hero_image text,
  add column if not exists cancellation_policy text;

-- ============================================================
-- Rooms: display fields
-- ============================================================
alter table public.rooms
  add column if not exists room_type text,
  add column if not exists beds text,
  add column if not exists bathroom_type text;

-- ============================================================
-- Property media (photos)
-- ============================================================
create table if not exists public.property_media (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_hero boolean not null default false,
  created_at timestamptz not null default now(),
  constraint property_media_sort_check check (sort_order >= 0)
);

create index if not exists property_media_property_idx on public.property_media(property_id);

-- Public read: media attached to published properties is visible.
create policy "published property media is public"
  on public.property_media
  for select
  to public
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_media.property_id
        and p.status = 'PUBLISHED'
    )
  );

-- Hosts can manage media for their own properties.
create policy "hosts can manage their property media"
  on public.property_media
  for all
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

-- ============================================================
-- Seed amenities (idempotent)
-- ============================================================
insert into public.amenities (name, category, icon) values
  ('Wi-Fi', 'Connectivity', 'wifi'),
  ('Breakfast', 'Food', 'coffee'),
  ('Parking', 'Property', 'car'),
  ('Hot water', 'Bathroom', 'droplets'),
  ('Garden', 'Outdoor', 'leaf'),
  ('Mountain view', 'View', 'mountain'),
  ('Generator', 'Power', 'zap'),
  ('Family room', 'Room', 'users'),
  ('Kitchen', 'Kitchen', 'utensils'),
  ('TV', 'Entertainment', 'tv'),
  ('Balcony', 'Outdoor', 'sun'),
  ('Pet friendly', 'Accommodation', 'dog')
on conflict (name) do nothing;

-- ============================================================
-- Seed destinations (idempotent)
-- ============================================================
insert into public.destinations (name, slug, district, short_description, description, latitude, longitude, best_time, status) values
  ('Aizawl', 'aizawl', 'Aizawl', 'Mizoram''s urban gateway, food, views and local culture.', 'Gateway destination for city stays, local food and access to surrounding attractions.', 23.7271, 92.7176, 'October-May', 'PUBLISHED'),
  ('Reiek', 'reiek', 'Aizawl', 'Mountain scenery, village atmosphere and a classic day trip.', 'A mountain destination suited to short nature and culture-focused stays.', 23.6833, 92.6167, 'October-May', 'PUBLISHED'),
  ('Champhai', 'champhai', 'Champhai', 'Rolling landscapes, culture and border-region travel.', 'A destination for landscapes, culture and longer regional trips.', 23.4561, 93.3287, 'October-May', 'PUBLISHED'),
  ('Thenzawl', 'thenzawl', 'Serchhip', 'Nature-focused travel around waterfalls and forested hills.', 'A nature-oriented destination with attractions around forested hills.', 23.3000, 92.9500, 'October-May', 'PUBLISHED'),
  ('Lunglei', 'lunglei', 'Lunglei', 'Southern gateway with river adventures.', 'A southern destination with river and nature-focused travel.', 22.8819, 92.7356, 'October-May', 'PUBLISHED'),
  ('Mamit', 'mamit', 'Mamit', 'Gateway to Dampa wildlife sanctuary.', 'A nature destination near Dampa Tiger Reserve.', 23.9300, 92.4900, 'October-May', 'PUBLISHED')
on conflict (slug) do nothing;
