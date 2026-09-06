-- 0036_repair_host_payout_settings_razorpayx_schema.sql
-- Repair host payout settings created by the legacy Razorpay Route payout schema.
-- The application now uses RazorpayX and expects provider_contact_id,
-- provider_fund_account_id and provider validation columns. The earlier
-- migration used CREATE TABLE IF NOT EXISTS, so it did not alter an already
-- existing host_payout_settings table.

alter table public.host_payout_settings
  add column if not exists provider_contact_id text,
  add column if not exists provider_fund_account_id text,
  add column if not exists provider_validation_id text,
  add column if not exists provider_validation_status text,
  add column if not exists provider_validation_utr text;

alter table public.host_payout_settings
  drop constraint if exists host_payout_settings_provider_check;

alter table public.host_payout_settings
  add constraint host_payout_settings_provider_check
  check (provider = 'RAZORPAY_X');

alter table public.host_payout_settings
  alter column provider set default 'RAZORPAY_X';

update public.host_payout_settings
   set provider = 'RAZORPAY_X'
 where provider is distinct from 'RAZORPAY_X';

create index if not exists host_payout_settings_status_idx
  on public.host_payout_settings(status);
