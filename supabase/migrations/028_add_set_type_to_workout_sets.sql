-- =============================================
-- MIGRATION 028: Add set_type to workout_sets
-- =============================================
-- Migration 022 added set_type to template_sets but not workout_sets.
-- The app code inserts set_type on every workout save, so the column
-- must exist to avoid insert failures.
-- IF NOT EXISTS makes this safe to run even if the column already exists.

ALTER TABLE workout_sets
ADD COLUMN IF NOT EXISTS set_type TEXT DEFAULT 'normal';
