-- Add app_version and last_active_at columns to profiles
-- These track which version of the app a user is running and when they were last active
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS app_version TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
