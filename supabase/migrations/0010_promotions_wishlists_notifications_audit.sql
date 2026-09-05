-- 0010_promotions_wishlists_notifications_audit.sql
-- Marketing/engagement domain: promotions, wishlists, notifications, and audit logs.
-- Audit logs must never be exposed to normal users.
-- Follows the existing schema conventions (uuid PKs, text, timestamptz, numeric(12,2)).
-- All FK columns are indexed per Supabase best practices.

-- ============================================================
-- Promotions
-- ============================================================
create table public.promotions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  code text unique,
  discount_type text not null,
  discount_value numeric(12,2) not null check (discount_value >= 0),
  minimum_booking_value numeric(12,2) check (minimum_booking_value >= 0),
  start_date timestamptz not null,
  end_date timestamptz not null,
  usage_limit integer check (usage_limit > 0),
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  constraint promotions_type_check check (
    type in ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_NIGHT', 'OTHER')
  ),
  constraint promotions_discount_type_check check (
    discount_type in ('PERCENTAGE', 'FIXED_AMOUNT')
  ),
  constraint promotions_status_check check (
    status in ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED')
  ),
  constraint promotions_valid_dates check (end_date > start_date)
);

-- ============================================================
-- Wishlists
-- ============================================================
create table public.wishlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create index wishlists_user_idx on public.wishlists(user_id);
create index wishlists_property_idx on public.wishlists(property_id);

-- ============================================================
-- Notifications
-- ============================================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  channel text not null default 'IN_APP',
  subject text,
  body text,
  status text not null default 'PENDING',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (
    type in ('BOOKING', 'PAYMENT', 'CONFIRMATION', 'CANCELLATION', 'REMINDER', 'REVIEW', 'PAYOUT', 'SYSTEM')
  ),
  constraint notifications_channel_check check (
    channel in ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH')
  ),
  constraint notifications_status_check check (
    status in ('PENDING', 'SENT', 'FAILED', 'READ')
  )
);

create index notifications_user_idx on public.notifications(user_id, created_at desc);

-- ============================================================
-- Audit Logs
-- ============================================================
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_identity text,
  entity_type text not null,
  entity_id text,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index audit_logs_created_idx on public.audit_logs(created_at desc);

-- ============================================================
-- RLS Policies
-- ============================================================
alter table public.promotions enable row level security;
alter table public.wishlists enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Active promotions are public
create policy "active promotions are public"
  on public.promotions
  for select
  using (status = 'ACTIVE');

-- Tourists can read their own wishlist
create policy "tourists can read their own wishlist"
  on public.wishlists
  for select
  using (user_id = auth.uid());

-- Tourists can add to their own wishlist
create policy "tourists can insert into their own wishlist"
  on public.wishlists
  for insert
  with check (user_id = auth.uid());

-- Tourists can remove from their own wishlist
create policy "tourists can delete from their own wishlist"
  on public.wishlists
  for delete
  using (user_id = auth.uid());

-- Users can read their own notifications
create policy "users can read their own notifications"
  on public.notifications
  for select
  using (user_id = auth.uid());

-- Users can update their own notifications (e.g. mark as read)
create policy "users can update their own notifications"
  on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Audit logs are not exposed to normal users (no policies = no access)
-- Only service_role / privileged workflows can access via server-side code.
