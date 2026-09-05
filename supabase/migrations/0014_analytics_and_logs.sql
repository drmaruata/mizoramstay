-- 0014_analytics_and_logs.sql
-- Analytics & logging domain: analytics_events for product/usage tracking and
-- logs for structured application logging.

-- ============================================================
-- Analytics Events
-- ============================================================
create table public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  event_name text not null,
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  properties jsonb not null default '{}'::jsonb,
  page_path text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index analytics_events_name_idx on public.analytics_events(event_name, created_at desc);
create index analytics_events_user_idx on public.analytics_events(user_id, created_at desc);
create index analytics_events_created_idx on public.analytics_events(created_at desc);

-- ============================================================
-- Application Logs
-- ============================================================
create table public.logs (
  id uuid primary key default uuid_generate_v4(),
  level text not null default 'INFO',
  service text not null default 'web',
  message text not null,
  context jsonb not null default '{}'::jsonb,
  trace_id text,
  created_at timestamptz not null default now(),
  constraint logs_level_check check (
    level in ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')
  )
);

create index logs_level_idx on public.logs(level, created_at desc);
create index logs_created_idx on public.logs(created_at desc);

-- ============================================================
-- RLS Policies
-- ============================================================
alter table public.analytics_events enable row level security;
alter table public.logs enable row level security;

-- Analytics events are written server-side (service_role / anon via API with
-- rate limiting). No direct read access for normal users.
-- Admins can read analytics events.
create policy "admins can read analytics events"
  on public.analytics_events
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Logs are never exposed to normal users (no policies = no access).
-- Only service_role / privileged workflows can access via server-side code.