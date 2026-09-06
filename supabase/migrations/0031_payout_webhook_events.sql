-- 0031_payout_webhook_events.sql
create table if not exists public.payout_events (
  id uuid primary key default uuid_generate_v4(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payout_provider_id text,
  payload jsonb not null,
  status text not null default 'RECEIVED',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text,
  unique(provider, event_id)
);
create index if not exists payout_events_payout_idx on public.payout_events(provider, payout_provider_id, received_at desc);
alter table public.payout_events enable row level security;
revoke all on table public.payout_events from public, anon, authenticated;
