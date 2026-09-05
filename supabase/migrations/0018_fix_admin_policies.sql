-- 0018_fix_admin_policies.sql
-- Fix infinite recursion in the "admins can read all profiles" policy.
--
-- The previous migration (0017) added an admin read policy on `profiles`
-- that queried `profiles` directly, causing infinite recursion (a policy on
-- `profiles` that reads `profiles` re-triggers itself).
--
-- The recommended Supabase pattern is a SECURITY DEFINER helper function that
-- checks the admin role without re-entering RLS on `profiles`. We create
-- `public.is_admin()` and use it in all admin read policies.

-- SECURITY DEFINER helper: returns true when the current user's profile role
-- is ADMIN or SUPER_ADMIN. Runs with the function owner's privileges, so it
-- bypasses RLS on `profiles` and avoids recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('ADMIN', 'SUPER_ADMIN')
  );
$$;

-- Drop the recursive policy from 0017.
drop policy if exists "admins can read all profiles" on public.profiles;

-- Recreate it using the helper function (no recursion).
create policy "admins can read all profiles"
  on public.profiles
  for select
  using (public.is_admin());

-- Recreate the other admin read policies from 0017 using the helper for
-- consistency and to avoid any subquery/RLS edge cases.
drop policy if exists "admins can read all properties" on public.properties;
create policy "admins can read all properties"
  on public.properties
  for select
  using (public.is_admin());

drop policy if exists "admins can read all rooms" on public.rooms;
create policy "admins can read all rooms"
  on public.rooms
  for select
  using (public.is_admin());

drop policy if exists "admins can read all verification cases" on public.verification_cases;
create policy "admins can read all verification cases"
  on public.verification_cases
  for select
  using (public.is_admin());

drop policy if exists "admins can read all property documents" on public.property_documents;
create policy "admins can read all property documents"
  on public.property_documents
  for select
  using (public.is_admin());
