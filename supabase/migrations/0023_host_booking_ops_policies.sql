-- 0023_host_booking_ops_policies.sql
-- Close RLS gaps so hosts can operate their booking management UI:
--   * read booking_items (which room was booked)
--   * read booking_guests (guest name / contact)
--   * read + update room_inventory for their own rooms (calendar / blocking)
-- All follow the existing "hosts can read property bookings" pattern.

create policy "hosts can read booking items for their properties"
on public.booking_items for select
to authenticated
using (
  exists (
    select 1 from public.bookings b
    join public.properties p on p.id = b.property_id
    join public.host_profiles hp on hp.id = p.host_id
    where b.id = booking_items.booking_id and hp.user_id = auth.uid()
  )
);

create policy "hosts can read booking guests for their properties"
on public.booking_guests for select
to authenticated
using (
  exists (
    select 1 from public.bookings b
    join public.properties p on p.id = b.property_id
    join public.host_profiles hp on hp.id = p.host_id
    where b.id = booking_guests.booking_id and hp.user_id = auth.uid()
  )
);

create policy "hosts can read inventory for their rooms"
on public.room_inventory for select
to authenticated
using (
  exists (
    select 1 from public.rooms r
    join public.properties p on p.id = r.property_id
    join public.host_profiles hp on hp.id = p.host_id
    where r.id = room_inventory.room_id and hp.user_id = auth.uid()
  )
);

create policy "hosts can update inventory for their rooms"
on public.room_inventory for update
to authenticated
using (
  exists (
    select 1 from public.rooms r
    join public.properties p on p.id = r.property_id
    join public.host_profiles hp on hp.id = p.host_id
    where r.id = room_inventory.room_id and hp.user_id = auth.uid()
  )
);