-- 0012_handle_new_user_trigger.sql
-- Auto-create a profiles row whenever a new user signs up via Supabase Auth.
-- This is required so that every authenticated user has a profile with a role,
-- which the app's RBAC (proxy + RLS policies) depends on.

-- Function to insert a profile row on new user signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'TOURIST')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger on auth.users after insert.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
