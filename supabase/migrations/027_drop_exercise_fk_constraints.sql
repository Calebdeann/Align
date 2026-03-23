-- =============================================
-- MIGRATION 027: Drop exercise_id FK constraints
-- =============================================
-- Custom exercises are stored in a separate custom_exercises table.
-- The FK constraints on workout_exercises and user_exercise_preferences
-- only reference the exercises table, causing inserts to fail when the
-- exercise_id belongs to a custom exercise.
--
-- Dropping these FKs allows both library and custom exercise IDs.
-- Data integrity is maintained because:
--   - workout_exercises stores denormalized exercise_name/exercise_muscle
--   - user_exercise_preferences only needs exercise_id as a lookup key
--   - template_exercises already has no FK (consistent behavior)

ALTER TABLE workout_exercises
  DROP CONSTRAINT IF EXISTS workout_exercises_exercise_id_fkey;

ALTER TABLE user_exercise_preferences
  DROP CONSTRAINT IF EXISTS user_exercise_preferences_exercise_id_fkey;
