-- =============================================
-- USER DATA ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures users can only access their own data
-- =============================================

-- =============================================
-- PROFILES TABLE
-- Users can only access their own profile
-- Note: profile.id = auth.users.id (same UUID)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================
-- WORKOUTS TABLE
-- Users can only access their own workouts
-- =============================================

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can insert own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can update own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can delete own workouts" ON workouts;

CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- WORKOUT_EXERCISES TABLE
-- Access through parent workout ownership
-- =============================================

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Users can insert own workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Users can update own workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Users can delete own workout exercises" ON workout_exercises;

CREATE POLICY "Users can view own workout exercises"
  ON workout_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout exercises"
  ON workout_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout exercises"
  ON workout_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout exercises"
  ON workout_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

-- =============================================
-- WORKOUT_SETS TABLE
-- Access through grandparent workout ownership
-- workout_sets -> workout_exercises -> workouts
-- =============================================

ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workout sets" ON workout_sets;
DROP POLICY IF EXISTS "Users can insert own workout sets" ON workout_sets;
DROP POLICY IF EXISTS "Users can update own workout sets" ON workout_sets;
DROP POLICY IF EXISTS "Users can delete own workout sets" ON workout_sets;

CREATE POLICY "Users can view own workout sets"
  ON workout_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_exercises
      JOIN workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = workout_sets.workout_exercise_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout sets"
  ON workout_sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_exercises
      JOIN workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = workout_sets.workout_exercise_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout sets"
  ON workout_sets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workout_exercises
      JOIN workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = workout_sets.workout_exercise_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout sets"
  ON workout_sets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workout_exercises
      JOIN workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = workout_sets.workout_exercise_id
      AND workouts.user_id = auth.uid()
    )
  );

-- =============================================
-- WORKOUT_MUSCLES TABLE
-- Access through parent workout ownership
-- =============================================

ALTER TABLE workout_muscles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workout muscles" ON workout_muscles;
DROP POLICY IF EXISTS "Users can insert own workout muscles" ON workout_muscles;
DROP POLICY IF EXISTS "Users can update own workout muscles" ON workout_muscles;
DROP POLICY IF EXISTS "Users can delete own workout muscles" ON workout_muscles;

CREATE POLICY "Users can view own workout muscles"
  ON workout_muscles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_muscles.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout muscles"
  ON workout_muscles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_muscles.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout muscles"
  ON workout_muscles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_muscles.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout muscles"
  ON workout_muscles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_muscles.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

-- =============================================
-- USER_EXERCISE_PREFERENCES TABLE
-- Direct user ownership
-- =============================================

ALTER TABLE user_exercise_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON user_exercise_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_exercise_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_exercise_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_exercise_preferences;

CREATE POLICY "Users can view own preferences"
  ON user_exercise_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_exercise_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_exercise_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_exercise_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- REFERENCE TABLES (exercises, exercise_muscles)
-- Read-only for authenticated users
-- Only admin/service role can modify
-- =============================================

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view exercises" ON exercises;

CREATE POLICY "Authenticated users can view exercises"
  ON exercises FOR SELECT
  USING (auth.role() = 'authenticated');

-- No INSERT/UPDATE/DELETE policies = only service role can modify

ALTER TABLE exercise_muscles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view exercise muscles" ON exercise_muscles;

CREATE POLICY "Authenticated users can view exercise muscles"
  ON exercise_muscles FOR SELECT
  USING (auth.role() = 'authenticated');

-- No INSERT/UPDATE/DELETE policies = only service role can modify

-- =============================================
-- INDEXES FOR RLS PERFORMANCE
-- These indexes help the RLS policy subqueries run fast
-- =============================================

-- Index on workout_exercises.workout_id for faster parent lookups
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id
  ON workout_exercises(workout_id);

-- Index on workout_sets.workout_exercise_id for faster parent lookups
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_exercise_id
  ON workout_sets(workout_exercise_id);

-- Index on workout_muscles.workout_id for faster parent lookups
CREATE INDEX IF NOT EXISTS idx_workout_muscles_workout_id
  ON workout_muscles(workout_id);

-- Index on workouts.user_id for faster user filtering
CREATE INDEX IF NOT EXISTS idx_workouts_user_id
  ON workouts(user_id);

-- Index on user_exercise_preferences.user_id for faster user filtering
CREATE INDEX IF NOT EXISTS idx_user_exercise_preferences_user_id
  ON user_exercise_preferences(user_id);
