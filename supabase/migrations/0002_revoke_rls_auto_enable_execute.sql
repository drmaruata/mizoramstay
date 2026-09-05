-- rls_auto_enable() is an internal event-trigger helper (event trigger "ensure_rls").
-- Supabase default ACL grants EXECUTE to anon/authenticated/service_role on all public functions.
-- Explicitly revoke EXECUTE from anon and authenticated so it cannot be called via /rest/v1/rpc.
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
