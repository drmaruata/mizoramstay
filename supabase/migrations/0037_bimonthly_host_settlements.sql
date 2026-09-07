-- 0037_bimonthly_host_settlements.sql
-- Fixed host settlement calendar: 5th and 15th of every month.

create or replace function public.next_host_settlement_date(p_anchor_date date)
returns date
language plpgsql
immutable
set search_path = public
as $$
declare
  v_month_start date := date_trunc('month', p_anchor_date)::date;
  v_next date;
begin
  if extract(day from p_anchor_date) < 5 then
    return v_month_start + 4;
  elsif extract(day from p_anchor_date) < 15 then
    return v_month_start + 14;
  end if;
  v_next := (v_month_start + interval '1 month')::date;
  return v_next + 4;
end;
$$;

alter table public.host_payouts
  add column if not exists settlement_date date,
  add column if not exists settlement_batch_id uuid,
  add column if not exists platform_fee_rate numeric(5,2);

create table if not exists public.host_settlement_batches (
  id uuid primary key default uuid_generate_v4(),
  host_id uuid not null references public.host_profiles(id) on delete cascade,
  settlement_date date not null,
  gross_amount numeric(12,2) not null check (gross_amount >= 0),
  platform_fee_amount numeric(12,2) not null default 0 check (platform_fee_amount >= 0),
  refund_adjustment numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null check (net_amount >= 0),
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED','PROCESSING','PAID','FAILED','CANCELLED')),
  provider text not null default 'RAZORPAY_X' check (provider = 'RAZORPAY_X'),
  provider_transfer_id text,
  provider_transfer_status text,
  provider_utr text,
  idempotency_key text,
  failure_reason text,
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  initiated_at timestamptz,
  settled_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (host_id, settlement_date)
);

create unique index if not exists host_settlement_batches_provider_transfer_idx on public.host_settlement_batches(provider, provider_transfer_id) where provider_transfer_id is not null;
create unique index if not exists host_settlement_batches_idempotency_idx on public.host_settlement_batches(idempotency_key) where idempotency_key is not null;
create index if not exists host_settlement_batches_due_idx on public.host_settlement_batches(settlement_date, status);
create index if not exists host_payouts_settlement_date_idx on public.host_payouts(settlement_date, status);
create index if not exists host_payouts_settlement_batch_idx on public.host_payouts(settlement_batch_id);

alter table public.host_payouts drop constraint if exists host_payouts_settlement_batch_fkey;
alter table public.host_payouts add constraint host_payouts_settlement_batch_fkey foreign key (settlement_batch_id) references public.host_settlement_batches(id) on delete set null;

update public.host_payouts
set platform_fee_rate = case when gross_amount > 0 then round((platform_commission / gross_amount) * 100, 2) else 0 end
where platform_fee_rate is null;

update public.host_payouts
set settlement_date = public.next_host_settlement_date(created_at::date)
where settlement_date is null;

alter table public.host_payouts alter column settlement_date set not null;
alter table public.host_payouts alter column platform_fee_rate set default 10.00;

alter table public.host_settlement_batches enable row level security;
drop policy if exists "hosts can read their settlement batches" on public.host_settlement_batches;
create policy "hosts can read their settlement batches"
  on public.host_settlement_batches for select
  using (host_id in (select id from public.host_profiles where user_id = auth.uid()));

alter table public.platform_settings drop constraint if exists platform_settings_commission_rate_check;
alter table public.platform_settings add constraint platform_settings_commission_rate_check check (commission_rate >= 5 and commission_rate <= 10);
update public.platform_settings set commission_rate = least(greatest(commission_rate, 5), 10) where id = true;

create or replace function public.prepare_host_payouts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_date date := (now() at time zone 'Asia/Kolkata')::date;
  v_count integer := 0;
begin
  if extract(day from v_run_date) not in (5, 15) then return 0; end if;

  with eligible as (
    select hp.host_id, hp.settlement_date, hp.gross_amount, hp.platform_commission, hp.refund_adjustment, hp.net_amount
    from public.host_payouts hp
    join public.bookings b on b.id = hp.booking_id
    join public.host_payout_settings s on s.host_id = hp.host_id
    where hp.status in ('PENDING','FAILED')
      and hp.settlement_date = v_run_date
      and b.status = 'COMPLETED'
      and s.status = 'ACTIVE'
      and s.auto_payout = true
  ), grouped as (
    select host_id, settlement_date, round(sum(gross_amount),2) gross_amount,
           round(sum(platform_commission),2) platform_fee_amount,
           round(sum(refund_adjustment),2) refund_adjustment,
           round(sum(net_amount),2) net_amount
    from eligible group by host_id, settlement_date
  )
  insert into public.host_settlement_batches(host_id,settlement_date,gross_amount,platform_fee_amount,refund_adjustment,net_amount,status,updated_at)
  select host_id,settlement_date,gross_amount,platform_fee_amount,refund_adjustment,net_amount,'SCHEDULED',now() from grouped
  on conflict (host_id, settlement_date) do update set
    gross_amount=excluded.gross_amount,
    platform_fee_amount=excluded.platform_fee_amount,
    refund_adjustment=excluded.refund_adjustment,
    net_amount=excluded.net_amount,
    updated_at=now(),
    status=case when public.host_settlement_batches.status in ('PAID','PROCESSING') then public.host_settlement_batches.status else 'SCHEDULED' end;

  update public.host_payouts hp
  set settlement_batch_id=b.id,
      status='SCHEDULED',
      scheduled_at=(v_run_date::timestamp at time zone 'Asia/Kolkata'),
      updated_at=now()
  from public.host_settlement_batches b
  where b.host_id=hp.host_id and b.settlement_date=hp.settlement_date and b.settlement_date=v_run_date
    and b.status in ('SCHEDULED','PROCESSING') and hp.status in ('PENDING','FAILED');

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.prepare_host_payouts() from public, anon, authenticated;
grant execute on function public.prepare_host_payouts() to service_role;

-- New earning rows can be assigned by the application transaction to next_host_settlement_date(check_out).
-- Existing production database also contains the corresponding function replacement in this migration.
