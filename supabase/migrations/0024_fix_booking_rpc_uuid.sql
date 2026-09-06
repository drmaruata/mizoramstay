-- 0024_fix_booking_rpc_uuid.sql
-- Fix: create_booking_transaction used uuid_generate_v4() (extensions schema)
-- while the function sets search_path = 'public', so the call failed with
-- "function uuid_generate_v4() does not exist". Replace with gen_random_uuid()
-- which lives in pg_catalog and is always resolvable.

CREATE OR REPLACE FUNCTION public.create_booking_transaction(p_property_id uuid, p_room_id uuid, p_check_in date, p_check_out date, p_guests smallint, p_quantity smallint, p_guest_name text, p_guest_phone text, p_guest_email text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_idempotency_key text DEFAULT NULL::text, p_hold_minutes integer DEFAULT 15)
 RETURNS TABLE(booking_id uuid, booking_reference text, total_amount numeric, hold_expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_room rooms%rowtype;
  v_booking_id uuid;
  v_reference text;
  v_nights integer;
  v_subtotal numeric(12,2);
  v_platform_fee numeric(12,2);
  v_total numeric(12,2);
  v_hold_expires timestamptz;
  v_date date;
  v_available smallint;
  v_existing bookings%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if p_guests is null or p_guests < 1 or p_guests > 20 then
    raise exception using errcode = '22023', message = 'Guest count must be between 1 and 20.';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception using errcode = '22023', message = 'Room quantity must be at least 1.';
  end if;
  if p_check_out <= p_check_in then
    raise exception using errcode = '22023', message = 'Check-out date must be after check-in date.';
  end if;
  if p_hold_minutes < 1 or p_hold_minutes > 60 then
    raise exception using errcode = '22023', message = 'Hold duration must be between 1 and 60 minutes.';
  end if;

  if p_idempotency_key is not null then
    select * into v_existing
      from public.bookings
     where idempotency_key = p_idempotency_key
     for update;
    if found then
      return query select v_existing.id, v_existing.booking_reference,
        v_existing.total_amount, v_existing.hold_expires_at;
      return;
    end if;
  end if;

  select rooms.* into v_room
    from public.rooms
    join public.properties on properties.id = rooms.property_id
   where rooms.id = p_room_id
     and rooms.property_id = p_property_id
     and rooms.status = 'ACTIVE'
     and properties.status = 'PUBLISHED'
   for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Room or property is not available.';
  end if;
  if p_guests > v_room.max_guests * p_quantity then
    raise exception using errcode = '22023', message = 'Guest count exceeds room capacity.';
  end if;

  v_nights := p_check_out - p_check_in;
  v_subtotal := v_room.base_price * v_nights * p_quantity;
  v_platform_fee := round(v_subtotal * 0.10, 2);
  v_total := v_subtotal + v_platform_fee;
  v_hold_expires := now() + make_interval(mins => p_hold_minutes);

  -- Lock every inventory row before checking/decrementing it. Missing rows
  -- fail closed; inventory must be initialized before a room can be booked.
  for v_date in select generate_series(p_check_in, p_check_out - 1, interval '1 day')::date loop
    select available_units into v_available
      from public.room_inventory
     where room_id = p_room_id and date = v_date
     for update;
    if not found then
      raise exception using errcode = 'P0003', message = format('Inventory is not initialized for %s.', v_date);
    end if;
    if v_available < p_quantity then
      raise exception using errcode = 'P0004', message = format('Insufficient availability on %s.', v_date);
    end if;
  end loop;

  v_reference := 'MZ-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.bookings (
    booking_reference, user_id, property_id, check_in, check_out, guests,
    subtotal, platform_fee, total_amount, status, notes, idempotency_key,
    hold_expires_at, inventory_reserved, updated_at
  ) values (
    v_reference, v_user_id, p_property_id, p_check_in, p_check_out, p_guests,
    v_subtotal, v_platform_fee, v_total, 'PENDING', p_notes, p_idempotency_key,
    v_hold_expires, true, now()
  ) returning id into v_booking_id;

  insert into public.booking_items (
    booking_id, room_id, check_in, check_out, quantity, nightly_rate, subtotal
  ) values (
    v_booking_id, p_room_id, p_check_in, p_check_out, p_quantity, v_room.base_price, v_subtotal
  );

  insert into public.booking_guests (
    booking_id, first_name, last_name, phone, email
  ) values (
    v_booking_id,
    split_part(trim(p_guest_name), ' ', 1),
    nullif(trim(substr(trim(p_guest_name), length(split_part(trim(p_guest_name), ' ', 1)) + 1)), ''),
    p_guest_phone,
    p_guest_email
  );

  for v_date in select generate_series(p_check_in, p_check_out - 1, interval '1 day')::date loop
    update public.room_inventory
       set available_units = available_units - p_quantity
     where room_id = p_room_id and date = v_date;
  end loop;

  return query select v_booking_id, v_reference, v_total, v_hold_expires;
end;
$function$;