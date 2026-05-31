-- =============================================
-- MIGRATION 091: EULA acceptance columns on profiles
-- =============================================
-- Apple Guideline 1.2 requires users to agree to terms (EULA) before
-- registration, with explicit no-tolerance-for-objectionable-content
-- language. Phase 2 of the moderation work writes terms_accepted_at +
-- terms_version to the user's profile on signin, and intercepts existing
-- users with NULL terms_accepted_at to route them to a blocking
-- accept-terms screen.
--
-- Phase 1 only ships the columns. No backfill: existing users get NULL on
-- purpose so the Phase 2 gate catches them on next launch.
--
-- CLAUDE.md rule #9: the Phase 2 write path MUST catch PGRST204 and strip
-- these columns from the retry payload so older app binaries (no
-- terms_accepted_at in their write) keep working until forced-update.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version     TEXT;
