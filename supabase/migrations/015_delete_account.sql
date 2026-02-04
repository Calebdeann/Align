-- =============================================
-- DELETE OWN ACCOUNT
-- SECURITY DEFINER function so users can delete
-- their own auth.users entry (and all related data)
-- =============================================

CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete user data from child tables first to respect FK constraints
  DELETE FROM user_exercise_preferences WHERE user_id = auth.uid();

  DELETE FROM workout_muscles WHERE workout_id IN (
    SELECT id FROM workouts WHERE user_id = auth.uid()
  );

  DELETE FROM workout_sets WHERE workout_exercise_id IN (
    SELECT we.id FROM workout_exercises we
    JOIN workouts w ON w.id = we.workout_id
    WHERE w.user_id = auth.uid()
  );

  DELETE FROM workout_exercises WHERE workout_id IN (
    SELECT id FROM workouts WHERE user_id = auth.uid()
  );

  DELETE FROM workouts WHERE user_id = auth.uid();

  DELETE FROM template_sets WHERE template_exercise_id IN (
    SELECT te.id FROM template_exercises te
    JOIN workout_templates wt ON wt.id = te.template_id
    WHERE wt.user_id = auth.uid()
  );

  DELETE FROM template_exercises WHERE template_id IN (
    SELECT id FROM workout_templates WHERE user_id = auth.uid()
  );

  DELETE FROM workout_templates WHERE user_id = auth.uid();

  -- Delete profile (cascades to referrals)
  DELETE FROM profiles WHERE id = auth.uid();

  -- Finally delete the auth user
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Add missing DELETE policy on profiles table
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);
