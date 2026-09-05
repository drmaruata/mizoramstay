-- 0004_property_documents_amenities_pricing.sql
-- Property domain: documents, amenities, and pricing tables.
-- Follows the existing schema conventions (uuid PKs, text, timestamptz, numeric(12,2)).
-- All FK columns are indexed per Supabase best practices.

-- ============================================================
-- Property Documents
-- ============================================================
create table public.property_documents (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  document_type text not null,
  document_number text,
  file_url text not null,
  verification_status text not null default 'PENDING',
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  expiry_date date,
  created_at timestamptz not null default now(),
  constraint property_documents_type_check check (
    document_type in ('IDENTITY', 'OWNERSHIP', 'TOURISM_REGISTRATION', 'POLICE_CLEARANCE', 'ADDRESS_PROOF', 'BANK_PROOF', 'OTHER')
  ),
  constraint property_documents_status_check check (
    verification_status in ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')
  )
);

create index property_documents_property_idx on public.property_documents(property_id);
create index property_documents_verified_by_idx on public.property_documents(verified_by);

-- ============================================================
-- Amenities
-- ============================================================
create table public.amenities (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  category text not null default 'GENERAL',
  icon text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  constraint amenities_status_check check (status in ('ACTIVE', 'INACTIVE'))
);

create table public.property_amenities (
  property_id uuid not null references public.properties(id) on delete cascade,
  amenity_id uuid not null references public.amenities(id) on delete cascade,
  primary key (property_id, amenity_id)
);

create table public.room_amenities (
  room_id uuid not null references public.rooms(id) on delete cascade,
  amenity_id uuid not null references public.amenities(id) on delete cascade,
  primary key (room_id, amenity_id)
);

create index property_amenities_amenity_idx on public.property_amenities(amenity_id);
create index room_amenities_amenity_idx on public.room_amenities(amenity_id);

-- ============================================================
-- Room Pricing
-- ============================================================
create table public.room_prices (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  date date not null,
  base_price numeric(12,2) not null check (base_price >= 0),
  weekend_price numeric(12,2) check (weekend_price >= 0),
  seasonal_price numeric(12,2) check (seasonal_price >= 0),
  special_price numeric(12,2) check (special_price >= 0),
  minimum_stay smallint not null default 1 check (minimum_stay > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, date)
);

create index room_prices_room_idx on public.room_prices(room_id);

-- ============================================================
-- RLS Policies
-- ============================================================
alter table public.property_documents enable row level security;
alter table public.amenities enable row level security;
alter table public.property_amenities enable row level security;
alter table public.room_amenities enable row level security;
alter table public.room_prices enable row level security;

-- Property documents: only the owning host and admins can access
create policy "hosts can read their property documents"
  on public.property_documents
  for select
  using (exists (
    select 1 from public.properties
    join public.host_profiles on host_profiles.id = properties.host_id
    where properties.id = property_documents.property_id
      and host_profiles.user_id = auth.uid()
  ));

create policy "hosts can insert their property documents"
  on public.property_documents
  for insert
  with check (exists (
    select 1 from public.properties
    join public.host_profiles on host_profiles.id = properties.host_id
    where properties.id = property_documents.property_id
      and host_profiles.user_id = auth.uid()
  ));

create policy "hosts can update their property documents"
  on public.property_documents
  for update
  using (exists (
    select 1 from public.properties
    join public.host_profiles on host_profiles.id = properties.host_id
    where properties.id = property_documents.property_id
      and host_profiles.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.properties
    join public.host_profiles on host_profiles.id = properties.host_id
    where properties.id = property_documents.property_id
      and host_profiles.user_id = auth.uid()
  ));

create policy "hosts can delete their property documents"
  on public.property_documents
  for delete
  using (exists (
    select 1 from public.properties
    join public.host_profiles on host_profiles.id = properties.host_id
    where properties.id = property_documents.property_id
      and host_profiles.user_id = auth.uid()
  ));

-- Amenities: public read, admin manages
create policy "amenities are publicly readable"
  on public.amenities
  for select
  using (true);

-- Property amenities: public read for published properties
create policy "published property amenities are public"
  on public.property_amenities
  for select
  using (exists (
    select 1 from public.properties
    where properties.id = property_amenities.property_id
      and properties.status = 'PUBLISHED'
  ));

-- Room amenities: public read for published properties
create policy "published room amenities are public"
  on public.room_amenities
  for select
  using (exists (
    select 1 from public.rooms
    join public.properties on properties.id = rooms.property_id
    where rooms.id = room_amenities.room_id
      and properties.status = 'PUBLISHED'
  ));

-- Room prices: public read for published properties
create policy "published room prices are public"
  on public.room_prices
  for select
  using (exists (
    select 1 from public.rooms
    join public.properties on properties.id = rooms.property_id
    where rooms.id = room_prices.room_id
      and properties.status = 'PUBLISHED'
  ));
