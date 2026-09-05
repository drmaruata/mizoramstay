create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.app_role as enum ('TOURIST','HOST','GUIDE','DRIVER','OPERATOR','ADMIN','SUPER_ADMIN');
create type public.record_status as enum ('DRAFT','ACTIVE','SUSPENDED','ARCHIVED');
create type public.verification_status as enum ('UNVERIFIED','PENDING','VERIFIED','REJECTED','EXPIRED');
create type public.booking_status as enum ('PENDING','CONFIRMED','CANCELLED','COMPLETED','NO_SHOW','REFUND_PENDING','REFUNDED');
create type public.payment_status as enum ('INITIATED','AUTHORIZED','CAPTURED','FAILED','REFUNDED','PARTIALLY_REFUNDED');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext,
  phone text,
  role public.app_role not null default 'TOURIST',
  first_name text,
  last_name text,
  status public.record_status not null default 'ACTIVE',
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table public.host_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  display_name text not null,
  bio text,
  profile_photo_url text,
  identity_status public.verification_status not null default 'UNVERIFIED',
  bank_account_status public.verification_status not null default 'UNVERIFIED',
  rating numeric(3,2) not null default 0,
  total_bookings integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.destinations (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  district text not null, description text not null default '', short_description text not null default '',
  latitude numeric(9,6), longitude numeric(9,6), hero_image text, best_time text,
  travel_information jsonb not null default '{}'::jsonb, status public.record_status not null default 'ACTIVE',
  seo_title text, seo_description text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(), host_id uuid not null references public.host_profiles(id) on delete restrict,
  destination_id uuid references public.destinations(id) on delete set null,
  name text not null, slug text not null unique,
  property_type text not null check (property_type in ('HOMESTAY','HOTEL','GUESTHOUSE','LODGE','RESORT','VILLAGE_STAY','OTHER')),
  description text not null default '', address text not null default '', village text, town text, district text not null,
  pincode text, latitude numeric(9,6), longitude numeric(9,6), check_in_time time, check_out_time time,
  status public.record_status not null default 'DRAFT', verification_level smallint not null default 0 check (verification_level between 0 and 5),
  tourism_registration_number text, tourism_registration_status public.verification_status not null default 'UNVERIFIED',
  rating numeric(3,2) not null default 0, review_count integer not null default 0,
  published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.amenities (
  id uuid primary key default gen_random_uuid(), name text not null unique, category text, icon text, status public.record_status not null default 'ACTIVE'
);
create table public.property_amenities (
  property_id uuid not null references public.properties(id) on delete cascade,
  amenity_id uuid not null references public.amenities(id) on delete cascade,
  primary key (property_id, amenity_id)
);
create table public.rooms (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  name text not null, description text not null default '', room_type text not null default 'STANDARD', max_guests integer not null check (max_guests > 0),
  beds text not null default '1 double bed', bed_type text, bathroom_type text, room_size numeric(7,2),
  base_price numeric(12,2) not null check (base_price >= 0), status public.record_status not null default 'ACTIVE',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.room_amenities (
  room_id uuid not null references public.rooms(id) on delete cascade,
  amenity_id uuid not null references public.amenities(id) on delete cascade,
  primary key (room_id, amenity_id)
);
create table public.room_inventory (
  id uuid primary key default gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade,
  date date not null, available_units integer not null default 0 check (available_units >= 0), blocked_units integer not null default 0 check (blocked_units >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(room_id, date)
);
create table public.room_prices (
  id uuid primary key default gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade,
  date date not null, base_price numeric(12,2) not null check (base_price >= 0), weekend_price numeric(12,2), seasonal_price numeric(12,2), special_price numeric(12,2), minimum_stay integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(room_id, date)
);
create table public.property_media (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null, media_type text not null default 'IMAGE', alt_text text not null default '', sort_order integer not null default 0, is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(), booking_reference text not null unique,
  user_id uuid not null references public.users(id) on delete restrict, property_id uuid not null references public.properties(id) on delete restrict,
  check_in date not null, check_out date not null, guests integer not null check (guests > 0), rooms integer not null default 1 check (rooms > 0),
  subtotal numeric(12,2) not null default 0, discount numeric(12,2) not null default 0, tax numeric(12,2) not null default 0,
  platform_fee numeric(12,2) not null default 0, total_amount numeric(12,2) not null default 0, currency text not null default 'INR',
  status public.booking_status not null default 'PENDING', cancellation_policy text, hold_expires_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(check_out > check_in)
);
create table public.booking_items (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete restrict, check_in date not null, check_out date not null,
  quantity integer not null default 1 check(quantity > 0), nightly_rate numeric(12,2) not null, subtotal numeric(12,2) not null,
  unique(booking_id, room_id), check(check_out > check_in)
);
create table public.booking_guests (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete cascade,
  first_name text not null, last_name text, phone text, email citext, age_group text, special_requirements text
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete restrict,
  provider text not null, provider_transaction_id text, amount numeric(12,2) not null check(amount >= 0), currency text not null default 'INR',
  status public.payment_status not null default 'INITIATED', payment_method text, paid_at timestamptz, created_at timestamptz not null default now(),
  unique(provider, provider_transaction_id)
);
create table public.payment_events (
  id uuid primary key default gen_random_uuid(), provider text not null, provider_event_id text not null,
  booking_id uuid references public.bookings(id) on delete set null, event_type text not null, payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz, created_at timestamptz not null default now(), unique(provider, provider_event_id)
);
create table public.refunds (
  id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id) on delete restrict,
  amount numeric(12,2) not null check(amount > 0), reason text, provider_refund_id text, status text not null default 'PENDING', created_at timestamptz not null default now(), processed_at timestamptz
);
create table public.host_payouts (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id) on delete restrict,
  host_id uuid not null references public.host_profiles(id) on delete restrict, gross_amount numeric(12,2) not null,
  platform_commission numeric(12,2) not null default 0, payment_cost numeric(12,2) not null default 0, refund_adjustment numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null default 0, status text not null default 'SCHEDULED', scheduled_at timestamptz, paid_at timestamptz, created_at timestamptz not null default now(), unique(booking_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references public.bookings(id) on delete restrict,
  user_id uuid not null references public.users(id) on delete restrict, property_id uuid not null references public.properties(id) on delete restrict,
  rating integer not null check(rating between 1 and 5), cleanliness_rating integer check(cleanliness_rating between 1 and 5), location_rating integer check(location_rating between 1 and 5),
  hospitality_rating integer check(hospitality_rating between 1 and 5), facilities_rating integer check(facilities_rating between 1 and 5), value_rating integer check(value_rating between 1 and 5),
  comment text, status public.record_status not null default 'ACTIVE', created_at timestamptz not null default now()
);
create table public.review_responses (
  id uuid primary key default gen_random_uuid(), review_id uuid not null unique references public.reviews(id) on delete cascade,
  host_id uuid not null references public.host_profiles(id) on delete restrict, response text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.verification_cases (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  verification_type text not null, risk_level text not null default 'MEDIUM', status public.verification_status not null default 'PENDING',
  assigned_to uuid references public.users(id) on delete set null, submitted_at timestamptz not null default now(), completed_at timestamptz, notes text
);
create table public.property_documents (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  document_type text not null, document_number text, storage_path text not null, verification_status public.verification_status not null default 'PENDING',
  verified_by uuid references public.users(id) on delete set null, verified_at timestamptz, expiry_date date, created_at timestamptz not null default now()
);
create table public.verification_events (
  id uuid primary key default gen_random_uuid(), case_id uuid not null references public.verification_cases(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null, action text not null, old_status text, new_status text, notes text, created_at timestamptz not null default now()
);
create table public.wishlists (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade, property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(), unique(user_id, property_id)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade, type text not null, channel text not null,
  subject text, body text not null, status text not null default 'QUEUED', sent_at timestamptz, created_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.users(id) on delete set null, entity_type text not null, entity_id uuid,
  action text not null, old_values jsonb, new_values jsonb, ip_address inet, user_agent text, created_at timestamptz not null default now()
);

create index properties_destination_idx on public.properties(destination_id);
create index properties_status_idx on public.properties(status);
create index properties_district_idx on public.properties(lower(district));
create index properties_search_idx on public.properties using gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(district,'')));
create index room_inventory_lookup_idx on public.room_inventory(room_id, date);
create index bookings_user_idx on public.bookings(user_id, created_at desc);
create index bookings_property_idx on public.bookings(property_id, check_in, check_out);
create index audit_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

create or replace function public.current_user_role() returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users(id, email, phone) values(new.id, new.email, new.phone) on conflict (id) do update set email = excluded.email, phone = excluded.phone, updated_at = now();
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.host_profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.properties enable row level security;
alter table public.amenities enable row level security;
alter table public.property_amenities enable row level security;
alter table public.rooms enable row level security;
alter table public.room_amenities enable row level security;
alter table public.room_inventory enable row level security;
alter table public.room_prices enable row level security;
alter table public.property_media enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;
alter table public.booking_guests enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.refunds enable row level security;
alter table public.host_payouts enable row level security;
alter table public.reviews enable row level security;
alter table public.review_responses enable row level security;
alter table public.verification_cases enable row level security;
alter table public.property_documents enable row level security;
alter table public.verification_events enable row level security;
alter table public.wishlists enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy users_self on public.users for select using (id = auth.uid() or public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy users_update_self on public.users for update using (id = auth.uid() or public.current_user_role() in ('ADMIN','SUPER_ADMIN')) with check (id = auth.uid() or public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy destinations_public_read on public.destinations for select using (status = 'ACTIVE' or public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy properties_public_read on public.properties for select using (status = 'ACTIVE' or public.current_user_role() in ('ADMIN','SUPER_ADMIN') or host_id in (select id from public.host_profiles where user_id = auth.uid()));
create policy host_profiles_self on public.host_profiles for all using (user_id = auth.uid() or public.current_user_role() in ('ADMIN','SUPER_ADMIN')) with check (user_id = auth.uid() or public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy properties_host_manage on public.properties for all using (host_id in (select id from public.host_profiles where user_id = auth.uid()) or public.current_user_role() in ('ADMIN','SUPER_ADMIN')) with check (host_id in (select id from public.host_profiles where user_id = auth.uid()) or public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy rooms_host_manage on public.rooms for all using (property_id in (select p.id from public.properties p join public.host_profiles h on h.id=p.host_id where h.user_id=auth.uid()) or public.current_user_role() in ('ADMIN','SUPER_ADMIN')) with check (property_id in (select p.id from public.properties p join public.host_profiles h on h.id=p.host_id where h.user_id=auth.uid()) or public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy inventory_host_manage on public.room_inventory for all using (room_id in (select r.id from public.rooms r join public.properties p on p.id=r.property_id join public.host_profiles h on h.id=p.host_id where h.user_id=auth.uid()) or public.current_user_role() in ('ADMIN','SUPER_ADMIN')) with check (room_id in (select r.id from public.rooms r join public.properties p on p.id=r.property_id join public.host_profiles h on h.id=p.host_id where h.user_id=auth.uid()) or public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy prices_host_manage on public.room_prices for all using (room_id in (select r.id from public.rooms r join public.properties p on p.id=r.property_id join public.host_profiles h on h.id=p.host_id where h.user_id=auth.uid()) or public.current_user_role() in ('ADMIN','SUPER_ADMIN')) with check (room_id in (select r.id from public.rooms r join public.properties p on p.id=r.property_id join public.host_profiles h on h.id=p.host_id where h.user_id=auth.uid()) or public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy reviews_public_read on public.reviews for select using (status='ACTIVE');
create policy reviews_owner_write on public.reviews for insert with check (user_id=auth.uid() and exists(select 1 from public.bookings b where b.id=booking_id and b.user_id=auth.uid() and b.status='COMPLETED'));
create policy reviews_owner_or_admin_update on public.reviews for update using (user_id=auth.uid() or public.current_user_role() in ('ADMIN','SUPER_ADMIN')) with check (user_id=auth.uid() or public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy wishlist_self on public.wishlists for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy bookings_customer_read on public.bookings for select using (user_id=auth.uid() or property_id in(select p.id from public.properties p join public.host_profiles h on h.id=p.host_id where h.user_id=auth.uid()) or public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy booking_children_customer_read on public.booking_items for select using (booking_id in(select b.id from public.bookings b where b.user_id=auth.uid() or b.property_id in(select p.id from public.properties p join public.host_profiles h on h.id=p.host_id where h.user_id=auth.uid()) or public.current_user_role() in ('ADMIN','SUPER_ADMIN')));
create policy guests_customer_read on public.booking_guests for select using (booking_id in(select b.id from public.bookings b where b.user_id=auth.uid() or public.current_user_role() in ('ADMIN','SUPER_ADMIN')));
create policy payments_customer_read on public.payments for select using (booking_id in(select b.id from public.bookings b where b.user_id=auth.uid() or public.current_user_role() in ('ADMIN','SUPER_ADMIN')));
create policy notifications_self on public.notifications for select using (user_id=auth.uid() or public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy verification_admin_only on public.verification_cases for all using (public.current_user_role() in ('ADMIN','SUPER_ADMIN')) with check (public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy verification_documents_host_or_admin on public.property_documents for select using (property_id in(select p.id from public.properties p join public.host_profiles h on h.id=p.host_id where h.user_id=auth.uid()) or public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy verification_document_admin_write on public.property_documents for all using (public.current_user_role() in ('ADMIN','SUPER_ADMIN')) with check (public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy review_responses_public_read on public.review_responses for select using (true);
create policy review_responses_host_write on public.review_responses for all using (host_id in(select h.id from public.host_profiles h where h.user_id=auth.uid()) or public.current_user_role() in ('ADMIN','SUPER_ADMIN')) with check (host_id in(select h.id from public.host_profiles h where h.user_id=auth.uid()) or public.current_user_role() in ('ADMIN','SUPER_ADMIN'));
create policy audit_admin_only on public.audit_logs for select using (public.current_user_role() in ('ADMIN','SUPER_ADMIN'));

-- Privileged payment/payout/refund mutations should be performed by server-side Edge Functions/RPCs.
-- The production create-booking RPC must lock inventory rows before creating booking records.
