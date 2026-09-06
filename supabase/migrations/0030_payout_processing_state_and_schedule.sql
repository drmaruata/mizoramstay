-- 0030_payout_processing_state_and_schedule.sql

alter table public.host_payouts drop constraint if exists host_payouts_status_check;
alter table public.host_payouts add constraint host_payouts_status_check check (status in ('PENDING','SCHEDULED','PROCESSING','PAID','FAILED','CANCELLED'));

alter table public.host_payouts add column if not exists provider_utr text;

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
         scheduled_at = coalesce(hp.scheduled_at, b.check_out::timestamptz + make_interval(days => coalesce(s.payout_delay_days, 1))),
         updated_at = now()
    from public.bookings b
    join public.host_payout_settings s on s.host_id = hp.host_id
   where hp.booking_id = b.id
     and hp.status = 'PENDING'
     and s.status = 'ACTIVE'
     and s.auto_payout = true
     and b.status = 'COMPLETED'
     and coalesce(hp.scheduled_at, b.check_out::timestamptz + make_interval(days => coalesce(s.payout_delay_days, 1))) <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.prepare_host_payouts() from public, anon, authenticated;
grant execute on function public.prepare_host_payouts() to service_role;
