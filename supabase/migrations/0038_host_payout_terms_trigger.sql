-- 0038_host_payout_terms_trigger.sql
-- Defense-in-depth: every host earning receives a frozen fee rate and next fixed settlement date.

create or replace function public.set_host_payout_settlement_terms()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checkout date;
  v_rate numeric(5,2);
begin
  if new.booking_id is not null then
    select check_out into v_checkout from public.bookings where id = new.booking_id;
    select commission_rate into v_rate from public.platform_settings where id = true;
  end if;

  if new.platform_fee_rate is null then
    new.platform_fee_rate := coalesce(v_rate, 10.00);
  end if;

  if new.settlement_date is null and v_checkout is not null then
    new.settlement_date := public.next_host_settlement_date(v_checkout);
  end if;

  return new;
end;
$$;

drop trigger if exists host_payout_settlement_terms_trigger on public.host_payouts;
create trigger host_payout_settlement_terms_trigger
before insert on public.host_payouts
for each row execute function public.set_host_payout_settlement_terms();

revoke all on function public.set_host_payout_settlement_terms() from public, anon, authenticated;
grant execute on function public.set_host_payout_settlement_terms() to service_role;
