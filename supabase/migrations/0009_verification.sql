-- 0009_verification.sql
-- Verification domain: verification cases and audit events.
-- Every administrative verification decision should be auditable.
-- Follows the existing schema conventions (uuid PKs, text, timestamptz).
-- All FK columns are indexed per Supabase best practices.

-- ============================================================
-- Verification Cases
-- ============================================================
create table public.verification_cases (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  verification_type text not null,
  risk_level text not null default 'LOW',
  status text not null default 'OPEN',
  assigned_to uuid references public.profiles(id),
  submitted_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  constraint verification_cases_type_check check (
    verification_type in ('DOCUMENT', 'PHONE', 'IDENTITY', 'TOURISM_REGISTRATION', 'PROPERTY_VISIT', 'QUALITY')
  ),
  constraint verification_cases_risk_check check (
    risk_level in ('LOW', 'MEDIUM', 'HIGH')
  ),
  constraint verification_cases_status_check check (
    status in ('OPEN', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'REQUEST_CHANGES', 'CLOSED')
  )
);

create index verification_cases_property_idx on public.verification_cases(property_id);
create index verification_cases_assigned_idx on public.verification_cases(assigned_to);
create index verification_cases_status_idx on public.verification_cases(status);

-- ============================================================
-- Verification Events (audit trail)
-- ============================================================
create table public.verification_events (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references public.verification_cases(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  old_status text,
  new_status text,
  notes text,
  created_at timestamptz not null default now()
);

create index verification_events_case_idx on public.verification_events(case_id);
create index verification_events_actor_idx on public.verification_events(actor_id);

-- ============================================================
-- RLS Policies
-- ============================================================
alter table public.verification_cases enable row level security;
alter table public.verification_events enable row level security;

-- Hosts can read verification cases for their own properties
create policy "hosts can read verification cases for their properties"
  on public.verification_cases
  for select
  using (exists (
    select 1 from public.properties
    join public.host_profiles on host_profiles.id = properties.host_id
    where properties.id = verification_cases.property_id
      and host_profiles.user_id = auth.uid()
  ));

-- Hosts can read verification events for their own properties
create policy "hosts can read verification events for their properties"
  on public.verification_events
  for select
  using (exists (
    select 1 from public.verification_cases
    join public.properties on properties.id = verification_cases.property_id
    join public.host_profiles on host_profiles.id = properties.host_id
    where verification_cases.id = verification_events.case_id
      and host_profiles.user_id = auth.uid()
  ));
