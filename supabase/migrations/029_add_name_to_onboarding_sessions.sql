-- =============================================
-- MIGRATION 029: Add missing name column to onboarding_sessions
-- =============================================
-- The onboarding name screen saves to onboarding_sessions,
-- but the column was never created. This caused the name to be
-- silently dropped during anonymous onboarding.

ALTER TABLE onboarding_sessions ADD COLUMN IF NOT EXISTS name TEXT;
