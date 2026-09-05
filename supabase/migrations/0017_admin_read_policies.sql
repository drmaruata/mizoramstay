-- 0017_admin_read_policies.sql
-- Add admin read policies for the property verification workflow.
--
-- The admin pages (src/app/admin/**) use the RLS-respecting client
-- (src/lib/supabase/server.ts) to fetch data for display. Previously only
-- PUBLISHED content was readable by the public, and hosts could only read
-- their own records — so admins could not see PENDING_REVIEW properties,
-- their rooms, documents, verification cases, or host profiles.
--
-- These policies grant SELECT to users whose profile role is ADMIN or
-- SUPER_ADMIN, consistent with the pattern used in migrations 0014/0015.

-- Admins can read all properties (any status) for the verification workflow.
create policy "admins can read all properties"
  on public.properties
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Admins can read all rooms (including unpublished properties' rooms).
create policy "admins can read all rooms"
  on public.rooms
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Admins can read any user's profile (host details for verification).
create policy "admins can read all profiles"
  on public.profiles
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Admins can read all verification cases.
create policy "admins can read all verification cases"
  on public.verification_cases
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Admins can read all property documents.
create policy "admins can read all property documents"
  on public.property_documents
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('ADMIN', 'SUPER_ADMIN')
    )
  );
