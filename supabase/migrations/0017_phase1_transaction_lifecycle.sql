-- 0017_phase1_transaction_lifecycle.sql
-- Payment lifecycle: provider order tracking, webhook idempotency, captured-payment
-- confirmation, and refund ledger.

alter table public.payments
  add column if not exists provider_order_id text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists payments_provider_order_idx
  on public.payments(provider, provider_order_id)
  where provider_order_id is not null;

create unique index if not exists payments_provider_transaction_unique_idx
  on public.payments(provider, provider_transaction_id)
  where provider_transaction_id is not null;

create table if not exists public.payment_events (
  id uuid primary key default uuid_generate_v4(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'RECEIVED',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text,
  unique (provider, event_id)
);

create index if not exists payment_events_type_idx on public.payment_events(provider, event_type, received_at desc);

create table if not exists public.refunds (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id),
  payment_id uuid not null references public.payments(id),
  provider text not null,
  provider_refund_id text,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'INR',
  reason text,
  status text not null default 'INITIATED',
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text,
  constraint refunds_status_check check (status in ('INITIATED','PROCESSED','FAILED'))
);

create unique index if not exists refunds_provider_refund_unique_idx
  on public.refunds(provider, provider_refund_id)
  where provider_refund_id is not null;

alter table public.payment_events enable row level security;
alter table public.refunds enable row level security;

create or replace function public.confirm_booking_payment_transaction(
  p_booking_id uuid,
  p_provider text,
  p_provider_order_id text,
  p_provider_transaction_id text,
  p_amount numeric,
  p_payment_method text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  confirmed boolean,
  booking_status text,
  payment_id uuid,
  host_id uuid,
  refund_required boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_payment public.payments%rowtype;
  v_host_id uuid;
begin
  select * into v_booking
    from public.bookings
   where id = p_booking_id
   for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Booking not found.';
  end if;

  select hp.id into v_host_id
    from public.properties p
    join public.host_profiles hp on hp.id = p.host_id
   where p.id = v_booking.property_id;

  if v_booking.status = 'CONFIRMED' then
    select * into v_payment
      from public.payments
     where booking_id = p_booking_id
     order by created_at desc
     limit 1;
    return query select true, v_booking.status::text, v_payment.id, v_host_id, false;
    return;
  end if;

  if v_booking.status <> 'PENDING' then
    return query select false, v_booking.status::text, null::uuid, v_host_id, false;
    return;
  end if;

  if v_booking.hold_expires_at is not null and v_booking.hold_expires_at < now() then
    if v_booking.inventory_reserved then
      update public.room_inventory ri
         set available_units = ri.available_units + bi.quantity
        from public.booking_items bi
       where bi.booking_id = p_booking_id
         and ri.room_id = bi.room_id
         and ri.date >= v_booking.check_in
         and ri.date < v_booking.check_out;
    end if;

    update public.bookings
       set status = 'CANCELLED', inventory_reserved = false,
           hold_expires_at = null,
           notes = coalesce(notes || E'\n', '') || 'Payment arrived after booking hold expiry.',
           updated_at = now()
     where id = p_booking_id;

    insert into public.payments (
      booking_id, provider, provider_order_id, provider_transaction_id,
      amount, currency, status, payment_method, paid_at, metadata
    ) values (
      p_booking_id, p_provider, p_provider_order_id, p_provider_transaction_id,
      p_amount, v_booking.currency, 'CAPTURED', p_payment_method, now(), p_metadata
    )
    on conflict (provider, provider_transaction_id) where provider_transaction_id is not null
    do update set status = 'CAPTURED', paid_at = coalesce(public.payments.paid_at, now()), metadata = public.payments.metadata || excluded.metadata
    returning * into v_payment;

    return query select false, 'CANCELLED'::text, v_payment.id, v_host_id, true;
    return;
  end if;

  if round(p_amount, 2) <> round(v_booking.total_amount, 2) then
    raise exception using errcode = '22023', message = 'Payment amount does not match booking total.';
  end if;

  insert into public.payments (
    booking_id, provider, provider_order_id, provider_transaction_id,
    amount, currency, status, payment_method, paid_at, metadata
  ) values (
    p_booking_id, p_provider, p_provider_order_id, p_provider_transaction_id,
    p_amount, v_booking.currency, 'CAPTURED', p_payment_method, now(), p_metadata
  )
  on conflict (provider, provider_transaction_id) where provider_transaction_id is not null
  do update set
    status = 'CAPTURED',
    paid_at = coalesce(public.payments.paid_at, now()),
    metadata = public.payments.metadata || excluded.metadata
  returning * into v_payment;

  update public.bookings
     set status = 'CONFIRMED', hold_expires_at = null, updated_at = now()
   where id = p_booking_id;

  if v_host_id is not null then
    insert into public.host_payouts (
      booking_id, host_id, gross_amount, platform_commission, payment_cost,
      refund_adjustment, net_amount, status, scheduled_at
    ) values (
      p_booking_id, v_host_id, v_booking.subtotal, v_booking.platform_fee, 0,
      0, greatest(v_booking.subtotal - v_booking.platform_fee, 0), 'PENDING',
      v_booking.check_out + interval '1 day'
    ) on conflict do nothing;
  end if;

  insert into public.notifications (user_id, type, channel, subject, body, status, sent_at)
  values (
    v_booking.user_id, 'CONFIRMATION', 'IN_APP', 'Booking confirmed',
    format('Your MizoramStay booking %s is confirmed.', v_booking.booking_reference), 'SENT', now()
  );

  if v_host_id is not null then
    insert into public.notifications (user_id, type, channel, subject, body, status, sent_at)
    select hp.user_id, 'BOOKING', 'IN_APP', 'New confirmed booking',
      format('Booking %s has been paid and confirmed.', v_booking.booking_reference), 'SENT', now()
      from public.host_profiles hp
     where hp.id = v_host_id;
  end if;

  return query select true, 'CONFIRMED'::text, v_payment.id, v_host_id, false;
end;
$$;

revoke all on function public.confirm_booking_payment_transaction(uuid, text, text, text, numeric, text, jsonb) from public, anon, authenticated;
grant execute on function public.confirm_booking_payment_transaction(uuid, text, text, text, numeric, text, jsonb) to service_role;
