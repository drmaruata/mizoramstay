-- 0026_host_booking_actions.sql
-- Host-side booking lifecycle actions:
--   1. mark_booking_completed_transaction — hosts mark a CONFIRMED booking as
--      COMPLETED (hosts have no direct UPDATE policy on bookings, so this is
--      a SECURITY DEFINER RPC that verifies host ownership).
--   2. set_room_inventory_block — hosts block/unblock date ranges on their
--      rooms' inventory. Refuses to change dates that have an active booking.

-- ============================================================
-- 1. Mark booking completed
-- ============================================================
create or replace function public.mark_booking_completed_transaction(p_booking_id uuid)
returns table (booking_id uuid, booking_reference text, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking bookings%rowtype;
  v_is_host boolean;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select * into v_booking
    from public.bookings
   where id = p_booking_id
   for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Booking not found.';
  end if;

  select exists (
    select 1 from public.host_profiles hp
    join public.properties p on p.host_id = hp.id
    where p.id = v_booking.property_id and hp.user_id = v_user_id
  ) into v_is_host;

  if not v_is_host then
    raise exception using errcode = '42501', message = 'Only the host of this property can manage this booking.';
  end if;

  if v_booking.status <> 'CONFIRMED' then
    raise exception using errcode = '22023', message = 'Only confirmed bookings can be marked completed.';
  end if;

  update public.bookings
     set status = 'COMPLETED', updated_at = now()
   where id = p_booking_id;

  return query select v_booking.id, v_booking.booking_reference, 'COMPLETED'::text;
end;
$$;

revoke all on function public.mark_booking_completed_transaction(uuid) from public, anon;
grant execute on function public.mark_booking_completed_transaction(uuid) to authenticated;

-- ============================================================
-- 2. Block / unblock room inventory dates
-- ============================================================
-- NOTE: output params are named rid/dt/avail/blkd (NOT room_id/date/...)
-- because the function body's INSERT ... ON CONFLICT (room_id, date) would
-- otherwise be ambiguous against the RETURNS TABLE output parameter names,
-- which share the PL/pgSQL variable namespace with table columns.
create or replace function public.set_room_inventory_block(
  p_room_id uuid,
  p_start_date date,
  p_end_date date,
  p_blocked boolean
)
returns table (rid uuid, dt date, avail smallint, blkd smallint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_property_id uuid;
  v_is_host boolean;
  v_offset int;
  v_total int;
  v_day date;
  v_active boolean;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    raise exception using errcode = '22023', message = 'Invalid date range.';
  end if;

  select r.property_id into v_property_id
    from public.rooms r
   where r.id = p_room_id;
  if v_property_id is null then
    raise exception using errcode = 'P0002', message = 'Room not found.';
  end if;

  select exists (
    select 1 from public.host_profiles hp
    join public.properties p on p.host_id = hp.id
    where p.id = v_property_id and hp.user_id = v_user_id
  ) into v_is_host;

  if not v_is_host then
    raise exception using errcode = '42501', message = 'Only the host of this property can manage inventory.';
  end if;

  v_total := greatest(p_end_date - p_start_date, 0);

  for v_offset in 0 .. v_total loop
    v_day := p_start_date + v_offset;

    -- Refuse to change a date that has an active booking hold.
    select exists (
      select 1 from public.bookings b
      join public.booking_items bi on bi.booking_id = b.id
      where bi.room_id = p_room_id
        and b.check_in <= v_day and v_day < b.check_out
        and (b.status = 'CONFIRMED' or (b.status = 'PENDING' and b.inventory_reserved = true))
    ) into v_active;

    if v_active then
      raise exception using errcode = 'P0004', message = format('Cannot change availability on %s — it is booked.', v_day);
    end if;

    insert into public.room_inventory (room_id, date, available_units, blocked_units)
    values (
      p_room_id, v_day,
      case when p_blocked then 0 else 1 end,
      case when p_blocked then 1 else 0 end
    )
    on conflict (room_id, date)
    do update set
      available_units = excluded.available_units,
      blocked_units = excluded.blocked_units,
      updated_at = now();

    return query select p_room_id, v_day,
      case when p_blocked then 0::smallint else 1::smallint end,
      case when p_blocked then 1::smallint else 0::smallint end;
  end loop;
end;
$$;

revoke all on function public.set_room_inventory_block(uuid, date, date, boolean) from public, anon;
grant execute on function public.set_room_inventory_block(uuid, date, date, boolean) to authenticated;