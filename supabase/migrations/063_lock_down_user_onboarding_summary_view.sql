-- =============================================
-- MIGRATION 063: Fix Supabase security-advisor "SECURITY DEFINER View" warning
-- on v_user_onboarding_summary.
-- =============================================
-- Postgres views default to running with the view owner's privileges, which
-- bypasses RLS on the underlying tables. Since this view exposes profile data
-- + Align legacy onboarding for every user, an authenticated PostgREST caller
-- could read everyone's records — not just their own.
--
-- Fix:
--   1) ALTER VIEW … SET (security_invoker = true) so the view respects the
--      caller's RLS instead of the owner's. Belt against accidental exposure.
--   2) REVOKE SELECT from anon + authenticated so the view isn't queryable
--      via PostgREST at all. The view is for admin SQL-editor use only
--      (postgres role bypasses this restriction).

ALTER VIEW v_user_onboarding_summary SET (security_invoker = true);

REVOKE ALL ON v_user_onboarding_summary FROM PUBLIC;
REVOKE ALL ON v_user_onboarding_summary FROM anon, authenticated;
