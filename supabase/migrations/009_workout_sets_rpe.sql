-- =============================================
-- ADD RPE COLUMN TO WORKOUT_SETS
-- Rate of Perceived Exertion tracking per set
-- Values: 6, 7, 7.5, 8, 8.5, 9, 9.5, 10 (or NULL)
-- =============================================

ALTER TABLE workout_sets
  ADD COLUMN IF NOT EXISTS rpe DECIMAL(3,1)
  CHECK (rpe IS NULL OR (rpe >= 6 AND rpe <= 10));
