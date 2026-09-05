-- 0006_reviews.sql
-- Reviews domain: property reviews and host responses.
-- Only completed bookings should be eligible for verified reviews.
-- Follows the existing schema conventions (uuid PKs, text, timestamptz, numeric).
-- All FK columns are indexed per Supabase best practices.

-- ============================================================
-- Reviews
-- ============================================================
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null unique references public.bookings(id),
  user_id uuid not null references public.profiles(id),
  property_id uuid not null references public.properties(id),
  rating smallint not null check (rating between 1 and 5),
  cleanliness_rating smallint check (cleanliness_rating between 1 and 5),
  location_rating smallint check (location_rating between 1 and 5),
  hospitality_rating smallint check (hospitality_rating between 1 and 5),
  facilities_rating smallint check (facilities_rating between 1 and 5),
  value_rating smallint check (value_rating between 1 and 5),
  comment text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_status_check check (status in ('PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN'))
);

create index reviews_user_idx on public.reviews(user_id);
create index reviews_property_idx on public.reviews(property_id);
create index reviews_property_status_idx on public.reviews(property_id, status);

-- ============================================================
-- Review Responses
-- ============================================================
create table public.review_responses (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  host_id uuid not null references public.host_profiles(id),
  response text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index review_responses_review_idx on public.review_responses(review_id);
create index review_responses_host_idx on public.review_responses(host_id);

-- ============================================================
-- RLS Policies
-- ============================================================
alter table public.reviews enable row level security;
alter table public.review_responses enable row level security;

-- Published reviews are public
create policy "published reviews are public"
  on public.reviews
  for select
  using (status = 'PUBLISHED');

-- Tourists can read their own reviews (including pending)
create policy "tourists can read their own reviews"
  on public.reviews
  for select
  using (user_id = auth.uid());

-- Tourists can create a review for a completed booking they made
create policy "tourists can create reviews for completed bookings"
  on public.reviews
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.bookings
      where bookings.id = reviews.booking_id
        and bookings.user_id = auth.uid()
        and bookings.status = 'COMPLETED'
    )
  );

-- Tourists can update their own reviews
create policy "tourists can update their own reviews"
  on public.reviews
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Hosts can read reviews for their properties
create policy "hosts can read reviews for their properties"
  on public.reviews
  for select
  using (exists (
    select 1 from public.properties
    join public.host_profiles on host_profiles.id = properties.host_id
    where properties.id = reviews.property_id
      and host_profiles.user_id = auth.uid()
  ));

-- Hosts can respond to reviews on their properties
create policy "hosts can respond to reviews on their properties"
  on public.review_responses
  for insert
  with check (exists (
    select 1 from public.reviews
    join public.properties on properties.id = reviews.property_id
    join public.host_profiles on host_profiles.id = properties.host_id
    where reviews.id = review_responses.review_id
      and host_profiles.user_id = auth.uid()
  ));

-- Hosts can read responses on their properties
create policy "hosts can read responses on their properties"
  on public.review_responses
  for select
  using (exists (
    select 1 from public.reviews
    join public.properties on properties.id = reviews.property_id
    join public.host_profiles on host_profiles.id = properties.host_id
    where reviews.id = review_responses.review_id
      and host_profiles.user_id = auth.uid()
  ));
