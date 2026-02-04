-- Fix exercise_translations RLS policy
-- Exercise translations are public reference data (like exercises table should be)
-- Allow all users to read them, not just authenticated users
DROP POLICY IF EXISTS "Authenticated users can view exercise translations" ON exercise_translations;

CREATE POLICY "Anyone can view exercise translations"
  ON exercise_translations FOR SELECT
  USING (true);
