-- MIGRATION 043: Add plan_id to onboarding_sessions
-- The selected plan is picked pre-signin, so it must be stored in the anonymous
-- session and transferred to profiles via linkOnboardingToUser.
-- (profiles.plan_id was added in migration 036; this completes the pair.)
ALTER TABLE onboarding_sessions ADD COLUMN IF NOT EXISTS plan_id TEXT;
