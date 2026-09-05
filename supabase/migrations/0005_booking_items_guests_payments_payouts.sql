-- 0005_booking_items_guests_payments_payouts.sql
-- Booking/transaction domain: booking items, guests, payments, and host payouts.
-- Follows the existing schema conventions (uuid PKs, text, timestamptz, numeric(12,2)).
-- All FK columns are indexed per Supabase best practices.

-- ============================================================
-- Booking Items (multiple rooms per booking)
-- ============================================================
create table public.booking_items (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  room_id uuid not null references public.rooms(id),
  check_in date not null,
  check_out date not null,
  quantity smallint not null default 1 check (quantity > 0),
  nightly_rate numeric(12,2) not null check (nightly_rate >= 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  constraint booking_items_valid_dates check (check_out > check_in)
);

create index booking_items_booking_idx on public.booking_items(booking_id);
create index booking_items_room_idx on public.booking_items(room_id);

-- ============================================================
-- Booking Guests
-- ============================================================
create table public.booking_guests (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  first_name text not null,
  last_name text,
  phone text,
  email text,
  age_group text,
  special_requirements text,
  created_at timestamptz not null default now()
);

create index booking_guests_booking_idx on public.booking_guests(booking_id);

-- ============================================================
-- Payments
-- ============================================================
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id),
  provider text not null,
  provider_transaction_id text,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'INR',
  status text not null default 'INITIATED',
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint payments_status_check check (
    status in ('INITIATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED')
  )
);

create index payments_booking_idx on public.payments(booking_id);
create index payments_provider_txn_idx on public.payments(provider_transaction_id);

-- ============================================================
-- Host Payouts
-- ============================================================
create table public.host_payouts (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id),
  host_id uuid not null references public.host_profiles(id),
  gross_amount numeric(12,2) not null check (gross_amount >= 0),
  platform_commission numeric(12,2) not null default 0 check (platform_commission >= 0),
  payment_cost numeric(12,2) not null default 0 check (payment_cost >= 0),
  refund_adjustment numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null check (net_amount >= 0),
  status text not null default 'PENDING',
  scheduled_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint host_payouts_status_check check (
    status in ('PENDING', 'SCHEDULED', 'PAID', 'FAILED', 'CANCELLED')
  )
);

create index host_payouts_booking_idx on public.host_payouts(booking_id);
create index host_payouts_host_idx on public.host_payouts(host_id);

-- ============================================================
-- RLS Policies
-- ============================================================
alter table public.booking_items enable row level security;
alter table public.booking_guests enable row level security;
alter table public.payments enable row level security;
alter table public.host_payouts enable row level security;

-- Booking items: tourists can read their own booking items
create policy "tourists can read their booking items"
  on public.booking_items
  for select
  using (exists (
    select 1 from public.bookings
    where bookings.id = booking_items.booking_id
      and bookings.user_id = auth.uid()
  ));

-- Booking guests: tourists can read their own booking guests
create policy "tourists can read their booking guests"
  on public.booking_guests
  for select
  using (exists (
    select 1 from public.bookings
    where bookings.id = booking_guests.booking_id
      and bookings.user_id = auth.uid()
  ));

-- Payments: tourists can read their own payments
create policy "tourists can read their payments"
  on public.payments
  for select
  using (exists (
    select 1 from public.bookings
    where bookings.id = payments.booking_id
      and bookings.user_id = auth.uid()
  ));

-- Host payouts: hosts can read their own payouts
create policy "hosts can read their payouts"
  on public.host_payouts
  for select
  using (host_id in (
    select id from public.host_profiles where user_id = auth.uid()
  ));
