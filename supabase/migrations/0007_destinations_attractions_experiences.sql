-- 0007_destinations_attractions_experiences.sql
-- Discovery domain: destinations, attractions, experiences, and experience inventory.
-- Follows the existing schema conventions (uuid PKs, text, timestamptz, numeric(12,2)).
-- All FK columns are indexed per Supabase best practices.

-- ============================================================
-- Destinations
-- ============================================================
create table public.destinations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  district text,
  description text,
  short_description text,
  latitude double precision,
  longitude double precision,
  hero_image text,
  best_time text,
  travel_information text,
  status text not null default 'DRAFT',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint destinations_status_check check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

create index destinations_status_idx on public.destinations(status);

-- ============================================================
-- Attractions
-- ============================================================
create table public.attractions (
  id uuid primary key default uuid_generate_v4(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  name text not null,
  description text,
  latitude double precision,
  longitude double precision,
  category text,
  best_time text,
  entry_fee numeric(12,2),
  duration text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  constraint attractions_status_check check (status in ('ACTIVE', 'INACTIVE'))
);

create index attractions_destination_idx on public.attractions(destination_id);

-- ============================================================
-- Experiences
-- ============================================================
create table public.experiences (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid not null references public.host_profiles(id),
  destination_id uuid references public.destinations(id),
  name text not null,
  description text,
  category text,
  duration text,
  price numeric(12,2) not null check (price >= 0),
  max_group_size smallint check (max_group_size > 0),
  difficulty text,
  requirements text,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiences_status_check check (status in ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'SUSPENDED'))
);

create index experiences_provider_idx on public.experiences(provider_id);
create index experiences_destination_idx on public.experiences(destination_id);

-- ============================================================
-- Experience Inventory
-- ============================================================
create table public.experience_inventory (
  id uuid primary key default uuid_generate_v4(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  date date not null,
  start_time time,
  capacity smallint not null check (capacity > 0),
  remaining_capacity smallint not null check (remaining_capacity >= 0),
  price numeric(12,2) check (price >= 0),
  unique (experience_id, date, start_time)
);

create index experience_inventory_experience_idx on public.experience_inventory(experience_id);

-- ============================================================
-- RLS Policies
-- ============================================================
alter table public.destinations enable row level security;
alter table public.attractions enable row level security;
alter table public.experiences enable row level security;
alter table public.experience_inventory enable row level security;

-- Published destinations are public
create policy "published destinations are public"
  on public.destinations
  for select
  using (status = 'PUBLISHED');

-- Attractions for published destinations are public
create policy "published destination attractions are public"
  on public.attractions
  for select
  using (exists (
    select 1 from public.destinations
    where destinations.id = attractions.destination_id
      and destinations.status = 'PUBLISHED'
  ));

-- Published experiences are public
create policy "published experiences are public"
  on public.experiences
  for select
  using (status = 'PUBLISHED');

-- Providers can manage their own experiences
create policy "providers can read their own experiences"
  on public.experiences
  for select
  using (provider_id in (
    select id from public.host_profiles where user_id = auth.uid()
  ));

create policy "providers can insert their own experiences"
  on public.experiences
  for insert
  with check (provider_id in (
    select id from public.host_profiles where user_id = auth.uid()
  ));

create policy "providers can update their own experiences"
  on public.experiences
  for update
  using (provider_id in (
    select id from public.host_profiles where user_id = auth.uid()
  ))
  with check (provider_id in (
    select id from public.host_profiles where user_id = auth.uid()
  ));

-- Experience inventory for published experiences is public
create policy "published experience inventory is public"
  on public.experience_inventory
  for select
  using (exists (
    select 1 from public.experiences
    where experiences.id = experience_inventory.experience_id
      and experiences.status = 'PUBLISHED'
  ));
