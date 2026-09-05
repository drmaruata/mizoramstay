-- 0013_revoke_handle_new_user_execute.sql
-- The handle_new_user() function is SECURITY DEFINER and is only invoked by
-- the on_auth_user_created trigger on auth.users. It must never be callable
-- directly by anon or authenticated roles, so revoke EXECUTE from them.
-- Note: revoking from public is required because the function was created
-- with the default PUBLIC EXECUTE grant.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;