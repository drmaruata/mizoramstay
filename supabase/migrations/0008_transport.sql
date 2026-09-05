-- 0008_transport.sql
-- Transport domain: transport providers and vehicles.
-- Sensitive vehicle/identity data should have restricted access.
-- Follows the existing schema conventions (uuid PKs, text, timestamptz, numeric(12,2)).
-- All FK columns are indexed per Supabase best practices.

-- ============================================================
-- Transport Providers
-- ============================================================
create table public.transport_providers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  provider_type text not null,
  name text not null,
  phone text,
  license_status text not null default 'PENDING',
  verification_status text not null default 'PENDING',
  rating numeric(3,2) check (rating between 0 and 5),
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transport_providers_type_check check (
    provider_type in ('TAXI', 'CAR_RENTAL', 'TOURIST_VEHICLE', 'DRIVER', 'OTHER')
  ),
  constraint transport_providers_license_check check (
    license_status in ('PENDING', 'VERIFIED', 'REJECTED')
  ),
  constraint transport_providers_verification_check check (
    verification_status in ('PENDING', 'VERIFIED', 'REJECTED')
  ),
  constraint transport_providers_status_check check (
    status in ('ACTIVE', 'INACTIVE', 'SUSPENDED')
  )
);

-- ============================================================
-- Vehicles
-- ============================================================
create table public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid not null references public.transport_providers(id) on delete cascade,
  vehicle_type text not null,
  registration_number text not null unique,
  capacity smallint not null check (capacity > 0),
  price_per_day numeric(12,2) check (price_per_day >= 0),
  price_per_km numeric(12,2) check (price_per_km >= 0),
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  constraint vehicles_type_check check (
    vehicle_type in ('SEDAN', 'SUV', 'HATCHBACK', 'MINIVAN', 'BUS', 'MOTORCYCLE', 'OTHER')
  ),
  constraint vehicles_status_check check (status in ('ACTIVE', 'INACTIVE', 'MAINTENANCE'))
);

create index vehicles_provider_idx on public.vehicles(provider_id);

-- ============================================================
-- RLS Policies
-- ============================================================
alter table public.transport_providers enable row level security;
alter table public.vehicles enable row level security;

-- Transport providers can read their own profile
create policy "providers can read their own transport profile"
  on public.transport_providers
  for select
  using (user_id = auth.uid());

-- Transport providers can update their own profile
create policy "providers can update their own transport profile"
  on public.transport_providers
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Public can read active transport providers (non-sensitive fields)
create policy "active transport providers are public"
  on public.transport_providers
  for select
  using (status = 'ACTIVE');

-- Providers can manage their own vehicles
create policy "providers can read their own vehicles"
  on public.vehicles
  for select
  using (provider_id in (
    select id from public.transport_providers where user_id = auth.uid()
  ));

create policy "providers can insert their own vehicles"
  on public.vehicles
  for insert
  with check (provider_id in (
    select id from public.transport_providers where user_id = auth.uid()
  ));

create policy "providers can update their own vehicles"
  on public.vehicles
  for update
  using (provider_id in (
    select id from public.transport_providers where user_id = auth.uid()
  ))
  with check (provider_id in (
    select id from public.transport_providers where user_id = auth.uid()
  ));

create policy "providers can delete their own vehicles"
  on public.vehicles
  for delete
  using (provider_id in (
    select id from public.transport_providers where user_id = auth.uid()
  ));
