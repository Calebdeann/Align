-- MIGRATION 040: Add matched_buddy_index to onboarding_sessions
-- Buddy is matched pre-signin, so it must be stored in the anonymous session
-- and transferred to profiles via linkOnboardingToUser.
ALTER TABLE onboarding_sessions ADD COLUMN IF NOT EXISTS matched_buddy_index INTEGER;
