-- 0029_admin_settings.sql
-- Persist operator-managed platform defaults.

create table if not exists public.platform_settings (
  id boolean primary key default true check (id = true),
  commission_rate numeric(5,2) not null default 10.00 check (commission_rate >= 0 and commission_rate <= 30),
  flexible_free_cancel_hours integer not null default 48 check (flexible_free_cancel_hours >= 0),
  moderate_free_cancel_hours integer not null default 120 check (moderate_free_cancel_hours >= 0),
  strict_free_cancel_hours integer not null default 240 check (strict_free_cancel_hours >= 0),
  default_hold_minutes integer not null default 15 check (default_hold_minutes between 1 and 60),
  verification_sla_hours integer not null default 48 check (verification_sla_hours > 0),
  require_mfa_for_admins boolean not null default false,
  notify_booking_email boolean not null default true,
  notify_verification_email boolean not null default true,
  notify_payout_email boolean not null default true,
  default_currency text not null default 'INR' check (char_length(default_currency) = 3),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id)
values (true)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

create policy "admins can read platform settings"
  on public.platform_settings
  for select
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role in ('ADMIN','SUPER_ADMIN')));

create policy "admins can update platform settings"
  on public.platform_settings
  for update
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role in ('ADMIN','SUPER_ADMIN')))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role in ('ADMIN','SUPER_ADMIN')));
