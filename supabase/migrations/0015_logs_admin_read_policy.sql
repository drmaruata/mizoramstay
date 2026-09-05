-- 0015_logs_admin_read_policy.sql
-- Add an admin read policy for the logs table, consistent with
-- analytics_events. Logs remain write-only for normal users; only
-- service_role (server-side) writes, and admins can read for debugging.

create policy "admins can read logs"
  on public.logs
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('ADMIN', 'SUPER_ADMIN')
    )
  );