-- =============================================
-- MIGRATION 017: Add new onboarding fields, remove unused columns
-- =============================================
-- Adds tried_other_apps and body_change_goal columns
-- Removes weekly_goal and preferred_equipment (no screens collect these)

-- Add new columns to onboarding_sessions
ALTER TABLE onboarding_sessions ADD COLUMN IF NOT EXISTS tried_other_apps TEXT;
ALTER TABLE onboarding_sessions ADD COLUMN IF NOT EXISTS body_change_goal TEXT;

-- Add new columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tried_other_apps TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS body_change_goal TEXT;

-- Remove unused columns from onboarding_sessions
ALTER TABLE onboarding_sessions DROP COLUMN IF EXISTS weekly_goal;
ALTER TABLE onboarding_sessions DROP COLUMN IF EXISTS preferred_equipment;

-- Remove unused columns from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS weekly_goal;
ALTER TABLE profiles DROP COLUMN IF EXISTS preferred_equipment;
