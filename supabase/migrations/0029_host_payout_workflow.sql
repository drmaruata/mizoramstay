-- 0029_host_payout_workflow.sql
-- Host payout onboarding, provider transfer tracking and settlement lifecycle.

create table if not exists public.host_payout_settings (
  id uuid primary key default uuid_generate_v4(),
  host_id uuid not null unique references public.host_profiles(id) on delete cascade,
  provider text not null default 'RAZORPAY_X',
  provider_contact_id text,
  provider_fund_account_id text,
  provider_validation_id text,
  provider_validation_status text,
  provider_validation_utr text,
  beneficiary_name text,
  bank_name text,
  bank_account_last4 text,
  ifsc_code text,
  status text not null default 'NOT_CONFIGURED',
  auto_payout boolean not null default true,
  payout_delay_days smallint not null default 1 check (payout_delay_days between 0 and 30),
  last_verified_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint host_payout_settings_status_check check (status in ('NOT_CONFIGURED','ONBOARDING','UNDER_REVIEW','ACTIVE','ACTION_REQUIRED','SUSPENDED')),
  constraint host_payout_settings_provider_check check (provider in ('RAZORPAY_X'))
);

create index if not exists host_payout_settings_status_idx on public.host_payout_settings(status);

alter table public.host_payouts
  add column if not exists provider text not null default 'RAZORPAY_X',
  add column if not exists provider_transfer_id text,
  add column if not exists provider_transfer_status text,
  add column if not exists provider_settlement_status text,
  add column if not exists idempotency_key text,
  add column if not exists failure_reason text,
  add column if not exists initiated_at timestamptz,
  add column if not exists settled_at timestamptz,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists host_payouts_provider_transfer_idx
  on public.host_payouts(provider, provider_transfer_id)
  where provider_transfer_id is not null;

create unique index if not exists host_payouts_idempotency_idx
  on public.host_payouts(idempotency_key)
  where idempotency_key is not null;

alter table public.host_payout_settings enable row level security;

drop policy if exists "hosts can read payout settings" on public.host_payout_settings;
drop policy if exists "hosts can insert payout settings" on public.host_payout_settings;
drop policy if exists "hosts can update payout settings" on public.host_payout_settings;

create policy "hosts can read payout settings"
  on public.host_payout_settings for select
  using (host_id in (select id from public.host_profiles where user_id = auth.uid()));

create policy "hosts can insert payout settings"
  on public.host_payout_settings for insert
  with check (host_id in (select id from public.host_profiles where user_id = auth.uid()));

create policy "hosts can update payout settings"
  on public.host_payout_settings for update
  using (host_id in (select id from public.host_profiles where user_id = auth.uid()))
  with check (host_id in (select id from public.host_profiles where user_id = auth.uid()));

create or replace function public.prepare_host_payouts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  update public.host_payouts hp
     set status = 'SCHEDULED',
         scheduled_at = coalesce(hp.scheduled_at, now()),
         updated_at = now()
   where hp.status = 'PENDING'
     and exists (
       select 1 from public.host_payout_settings s
        where s.host_id = hp.host_id
          and s.status = 'ACTIVE'
          and s.auto_payout = true
     )
     and exists (
       select 1 from public.bookings b
        where b.id = hp.booking_id
          and b.status = 'COMPLETED'
     )
     and (hp.scheduled_at is null or hp.scheduled_at <= now());
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.prepare_host_payouts() from public, anon, authenticated;
grant execute on function public.prepare_host_payouts() to service_role;
