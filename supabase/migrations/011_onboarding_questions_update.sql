-- =============================================
-- MIGRATION 011: Update onboarding questions
-- =============================================
-- Adds new onboarding fields (health_situation, energy_fluctuation)
-- Removes deprecated field (accomplish) from both tables

-- Add new columns to onboarding_sessions
ALTER TABLE onboarding_sessions ADD COLUMN IF NOT EXISTS health_situation TEXT;
ALTER TABLE onboarding_sessions ADD COLUMN IF NOT EXISTS energy_fluctuation TEXT;

-- Add new columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS health_situation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS energy_fluctuation TEXT;

-- Remove deprecated accomplish column
ALTER TABLE onboarding_sessions DROP COLUMN IF EXISTS accomplish;
ALTER TABLE profiles DROP COLUMN IF EXISTS accomplish;
