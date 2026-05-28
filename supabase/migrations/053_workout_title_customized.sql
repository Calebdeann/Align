-- =============================================
-- MIGRATION 051: title_customized flag on workouts
-- =============================================
-- Tracks whether the user actively typed a title at save time versus carrying
-- through a plan workout's default name (e.g. "Upper", "Lower"). Used by the
-- Discover feed to avoid surfacing hundreds of duplicate plan-default labels.

ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS title_customized BOOLEAN NOT NULL DEFAULT FALSE;
