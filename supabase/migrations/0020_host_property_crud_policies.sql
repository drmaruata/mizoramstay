-- 0020_host_property_crud_policies.sql
-- Enable hosts to manage their own properties, rooms, and amenity links.
--
-- Previously there were NO policies allowing a host to INSERT/UPDATE/DELETE
-- their own `properties` or `rooms` rows. This migration adds them so the
-- host onboarding / property CRUD flow can work against the live database.
--
-- Pattern: a host is identified by their `host_profiles.user_id` matching
-- `auth.uid()`. For INSERT on `properties`, the host must set `host_id` to
-- their own host profile id (checked via `with check`).

-- ============================================================
-- properties
-- ============================================================

-- Hosts can read their own properties (any status, including DRAFT).
create policy "hosts can read their own properties"
  on public.properties
  for select
  to authenticated
  using (
    exists (
      select 1 from public.host_profiles hp
      where hp.id = properties.host_id
        and hp.user_id = auth.uid()
    )
  );

-- Hosts can create properties owned by their own host profile.
create policy "hosts can insert their own properties"
  on public.properties
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.host_profiles hp
      where hp.id = properties.host_id
        and hp.user_id = auth.uid()
    )
  );

-- Hosts can update their own properties.
create policy "hosts can update their own properties"
  on public.properties
  for update
  to authenticated
  using (
    exists (
      select 1 from public.host_profiles hp
      where hp.id = properties.host_id
        and hp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.host_profiles hp
      where hp.id = properties.host_id
        and hp.user_id = auth.uid()
    )
  );

-- Hosts can delete their own properties.
create policy "hosts can delete their own properties"
  on public.properties
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.host_profiles hp
      where hp.id = properties.host_id
        and hp.user_id = auth.uid()
    )
  );

-- ============================================================
-- rooms
-- ============================================================

-- Hosts can read rooms belonging to their own properties.
create policy "hosts can read rooms for their properties"
  on public.rooms
  for select
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      join public.host_profiles hp on hp.id = p.host_id
      where p.id = rooms.property_id
        and hp.user_id = auth.uid()
    )
  );

-- Hosts can insert rooms into their own properties.
create policy "hosts can insert rooms for their properties"
  on public.rooms
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.properties p
      join public.host_profiles hp on hp.id = p.host_id
      where p.id = rooms.property_id
        and hp.user_id = auth.uid()
    )
  );

-- Hosts can update rooms in their own properties.
create policy "hosts can update rooms for their properties"
  on public.rooms
  for update
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      join public.host_profiles hp on hp.id = p.host_id
      where p.id = rooms.property_id
        and hp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      join public.host_profiles hp on hp.id = p.host_id
      where p.id = rooms.property_id
        and hp.user_id = auth.uid()
    )
  );

-- Hosts can delete rooms in their own properties.
create policy "hosts can delete rooms for their properties"
  on public.rooms
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      join public.host_profiles hp on hp.id = p.host_id
      where p.id = rooms.property_id
        and hp.user_id = auth.uid()
    )
  );

-- ============================================================
-- property_amenities
-- ============================================================

-- Hosts can link amenities to their own properties.
create policy "hosts can manage property amenities"
  on public.property_amenities
  for all
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      join public.host_profiles hp on hp.id = p.host_id
      where p.id = property_amenities.property_id
        and hp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      join public.host_profiles hp on hp.id = p.host_id
      where p.id = property_amenities.property_id
        and hp.user_id = auth.uid()
    )
  );

-- ============================================================
-- room_amenities
-- ============================================================

-- Hosts can link amenities to rooms in their own properties.
create policy "hosts can manage room amenities"
  on public.room_amenities
  for all
  to authenticated
  using (
    exists (
      select 1 from public.rooms r
      join public.properties p on p.id = r.property_id
      join public.host_profiles hp on hp.id = p.host_id
      where r.id = room_amenities.room_id
        and hp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rooms r
      join public.properties p on p.id = r.property_id
      join public.host_profiles hp on hp.id = p.host_id
      where r.id = room_amenities.room_id
        and hp.user_id = auth.uid()
    )
  );
