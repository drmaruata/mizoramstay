-- 0022_seed_rooms_inventory.sql
-- Backfill rooms, rolling inventory and amenity links for PUBLISHED
-- properties so the transactional booking flow can be exercised end-to-end.
-- Idempotent: safe to re-run (guarded by not-exists checks).

-- 1. Rooms for every published property (guarded by property_id + name).
insert into public.rooms (property_id, name, description, room_type, max_guests, beds, bathroom_type, base_price, status)
select p.id, r.name, r.description, r.room_type, r.max_guests, r.beds, r.bathroom_type, r.base_price, 'ACTIVE'
from public.properties p
cross join (values
  ('Deluxe Double Room', 'A comfortable double room with an attached bathroom.', 'DOUBLE', 2, '1 queen bed', 'ATTACHED', 1800),
  ('Family Room', 'A spacious family room with two queen beds.', 'FAMILY', 4, '2 queen beds', 'ATTACHED', 2600)
) as r(name, description, room_type, max_guests, beds, bathroom_type, base_price)
where p.status = 'PUBLISHED'
  and not exists (
    select 1 from public.rooms existing
    where existing.property_id = p.id and existing.name = r.name
  );

-- 2. Rolling 90-day inventory for every active room (guarded by room_id + date).
insert into public.room_inventory (room_id, date, available_units, blocked_units)
select r.id, d.day, 1, 0
from public.rooms r
cross join (select generate_series(current_date, current_date + 90, interval '1 day')::date as day) as d
where r.status = 'ACTIVE'
  and not exists (
    select 1 from public.room_inventory existing
    where existing.room_id = r.id and existing.date = d.day
  );

-- 3. Standard amenity links for every published property (guarded by pair).
insert into public.property_amenities (property_id, amenity_id)
select p.id, a.id
from public.properties p
cross join public.amenities a
where p.status = 'PUBLISHED'
  and a.name in ('Wi-Fi', 'Breakfast', 'Parking', 'Hot water')
  and not exists (
    select 1 from public.property_amenities existing
    where existing.property_id = p.id and existing.amenity_id = a.id
  );