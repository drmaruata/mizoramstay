-- 0016_analytics_insert_policy.sql
-- Allow the /api/v1/analytics endpoint (RLS-respecting server client) to
-- insert analytics events. Authenticated users may record their own events;
-- anonymous visitors may record events with no user id.

create policy "users can insert their own analytics events"
  on public.analytics_events
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "anonymous can insert analytics events"
  on public.analytics_events
  for insert
  to anon
  with check (user_id is null);
