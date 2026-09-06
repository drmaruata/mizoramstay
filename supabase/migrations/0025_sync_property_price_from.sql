-- 0025_sync_property_price_from.sql
-- Backfill properties.price_from from the cheapest ACTIVE room and keep it in
-- sync via a trigger on rooms (insert/update/delete). The marketplace
-- projection reads price_from directly, so property cards show real prices.

-- Backfill existing properties (0 when a property has no active rooms).
update public.properties p
   set price_from = coalesce((
     select min(r.base_price)
       from public.rooms r
      where r.property_id = p.id
        and r.status = 'ACTIVE'
   ), 0);

-- Trigger function: recompute price_from for the affected property.
create or replace function public.sync_property_price_from()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property_id uuid;
begin
  if tg_op = 'DELETE' then
    v_property_id := old.property_id;
  else
    v_property_id := new.property_id;
  end if;

  update public.properties p
     set price_from = coalesce((
       select min(r.base_price)
         from public.rooms r
        where r.property_id = v_property_id
          and r.status = 'ACTIVE'
     ), 0)
   where p.id = v_property_id;

  return coalesce(new, old);
end;
$$;

-- Keep price_from in sync whenever rooms change.
drop trigger if exists rooms_sync_price_from on public.rooms;
create trigger rooms_sync_price_from
  after insert or update or delete on public.rooms
  for each row execute function public.sync_property_price_from();