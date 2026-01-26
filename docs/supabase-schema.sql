-- =============================================
-- ALIGN WORKOUT TRACKER - SUPABASE SCHEMA
-- =============================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
--
-- Tables:
-- 1. exercises - Exercise library (public, read-only)
-- 2. exercise_muscles - Muscles worked by each exercise
-- 3. workouts - Completed workout sessions
-- 4. workout_exercises - Exercises within each workout
-- 5. workout_sets - Individual sets with weight/reps
-- 6. workout_muscles - Aggregate muscles worked in a workout

-- =============================================
-- TABLE 1: EXERCISES (Public Exercise Library)
-- =============================================
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle TEXT NOT NULL,           -- Primary muscle: 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'
  equipment TEXT,                 -- 'Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight'
  instructions TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE 2: EXERCISE_MUSCLES (Muscles Worked by Each Exercise)
-- =============================================
-- Maps exercises to the specific muscle groups they work
-- Each exercise can work multiple muscles with different activation levels

CREATE TABLE IF NOT EXISTS exercise_muscles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  muscle TEXT NOT NULL,           -- Specific muscle: 'Upper Chest', 'Lower Chest', 'Front Delts', 'Biceps', etc.
  activation TEXT NOT NULL DEFAULT 'secondary', -- 'primary' or 'secondary'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exercise_id, muscle)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_exercise_muscles_exercise_id ON exercise_muscles(exercise_id);

-- Common muscle groups for reference:
-- Chest: Upper Chest, Lower Chest, Inner Chest
-- Back: Lats, Upper Back, Lower Back, Rhomboids, Traps
-- Shoulders: Front Delts, Side Delts, Rear Delts
-- Arms: Biceps, Triceps, Forearms
-- Legs: Quads, Hamstrings, Glutes, Calves, Hip Flexors
-- Core: Abs, Obliques, Lower Back

-- =============================================
-- TABLE 3: WORKOUTS (Completed Sessions)
-- =============================================
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,                      -- Optional: "Chest Day", "Morning Workout"
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  duration_seconds INT NOT NULL,
  notes TEXT,
  source_template_id UUID,        -- Reference to template this workout was started from (if any)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_completed_at ON workouts(completed_at DESC);

-- =============================================
-- TABLE 4: WORKOUT_EXERCISES (Exercises in a Workout)
-- =============================================
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  exercise_name TEXT NOT NULL,    -- Denormalized for history display
  exercise_muscle TEXT,           -- Denormalized primary muscle group
  notes TEXT,
  order_index INT NOT NULL,       -- Order in workout (1, 2, 3...)
  superset_id INT,                -- Exercises with same superset_id are grouped together
  rest_timer_seconds INT DEFAULT 90, -- Rest timer setting used for this exercise
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster workout queries
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);

-- =============================================
-- TABLE 5: WORKOUT_SETS (Individual Sets)
-- =============================================
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number INT NOT NULL,        -- 1, 2, 3...
  weight DECIMAL(5,2),            -- Always stored in kg
  reps INT,
  set_type TEXT DEFAULT 'normal', -- 'normal', 'warmup', 'failure', 'dropset'
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster set queries
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_exercise_id ON workout_sets(workout_exercise_id);

-- =============================================
-- TABLE 6: WORKOUT_MUSCLES (Aggregate Muscles Worked)
-- =============================================
-- Stores a summary of all muscles worked in a workout for quick queries
-- Calculated from exercise_muscles when workout is saved

CREATE TABLE IF NOT EXISTS workout_muscles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  muscle TEXT NOT NULL,           -- 'Upper Chest', 'Biceps', 'Quads', etc.
  total_sets INT NOT NULL,        -- Number of sets targeting this muscle
  activation TEXT NOT NULL,       -- 'primary' or 'secondary'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workout_id, muscle, activation)
);

-- Index for faster muscle analytics queries
CREATE INDEX IF NOT EXISTS idx_workout_muscles_workout_id ON workout_muscles(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_muscles_muscle ON workout_muscles(muscle);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- EXERCISES: Public read access (everyone can browse exercises)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exercises are publicly readable"
  ON exercises FOR SELECT
  USING (true);

-- WORKOUTS: Users can only access their own workouts
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);

-- WORKOUT_EXERCISES: Users can only access exercises in their workouts
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workout exercises"
  ON workout_exercises FOR SELECT
  USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert workout exercises"
  ON workout_exercises FOR INSERT
  WITH CHECK (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their workout exercises"
  ON workout_exercises FOR UPDATE
  USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their workout exercises"
  ON workout_exercises FOR DELETE
  USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

-- WORKOUT_SETS: Users can only access sets in their workout exercises
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workout sets"
  ON workout_sets FOR SELECT
  USING (
    workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workouts w ON we.workout_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workout sets"
  ON workout_sets FOR INSERT
  WITH CHECK (
    workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workouts w ON we.workout_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their workout sets"
  ON workout_sets FOR UPDATE
  USING (
    workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workouts w ON we.workout_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their workout sets"
  ON workout_sets FOR DELETE
  USING (
    workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workouts w ON we.workout_id = w.id
      WHERE w.user_id = auth.uid()
    )
  );

-- EXERCISE_MUSCLES: Public read access (everyone can see muscle mappings)
ALTER TABLE exercise_muscles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exercise muscles are publicly readable"
  ON exercise_muscles FOR SELECT
  USING (true);

-- WORKOUT_MUSCLES: Users can only access muscle data for their workouts
ALTER TABLE workout_muscles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workout muscles"
  ON workout_muscles FOR SELECT
  USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert workout muscles"
  ON workout_muscles FOR INSERT
  WITH CHECK (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their workout muscles"
  ON workout_muscles FOR UPDATE
  USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their workout muscles"
  ON workout_muscles FOR DELETE
  USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

-- =============================================
-- SAMPLE EXERCISE MUSCLE DATA
-- =============================================
-- Example mappings for common exercises
-- Run these after populating your exercises table

-- Bench Press (works chest primarily, triceps and front delts secondarily)
-- INSERT INTO exercise_muscles (exercise_id, muscle, activation)
-- SELECT id, 'Upper Chest', 'primary' FROM exercises WHERE name = 'Barbell Bench Press';
-- INSERT INTO exercise_muscles (exercise_id, muscle, activation)
-- SELECT id, 'Lower Chest', 'primary' FROM exercises WHERE name = 'Barbell Bench Press';
-- INSERT INTO exercise_muscles (exercise_id, muscle, activation)
-- SELECT id, 'Front Delts', 'secondary' FROM exercises WHERE name = 'Barbell Bench Press';
-- INSERT INTO exercise_muscles (exercise_id, muscle, activation)
-- SELECT id, 'Triceps', 'secondary' FROM exercises WHERE name = 'Barbell Bench Press';

-- Shoulder Press (works shoulders primarily, triceps secondarily)
-- INSERT INTO exercise_muscles (exercise_id, muscle, activation)
-- SELECT id, 'Front Delts', 'primary' FROM exercises WHERE name = 'Dumbbell Shoulder Press';
-- INSERT INTO exercise_muscles (exercise_id, muscle, activation)
-- SELECT id, 'Side Delts', 'primary' FROM exercises WHERE name = 'Dumbbell Shoulder Press';
-- INSERT INTO exercise_muscles (exercise_id, muscle, activation)
-- SELECT id, 'Triceps', 'secondary' FROM exercises WHERE name = 'Dumbbell Shoulder Press';

-- Bicep Curl (works biceps primarily, forearms secondarily)
-- INSERT INTO exercise_muscles (exercise_id, muscle, activation)
-- SELECT id, 'Biceps', 'primary' FROM exercises WHERE name = 'Dumbbell Bicep Curl';
-- INSERT INTO exercise_muscles (exercise_id, muscle, activation)
-- SELECT id, 'Forearms', 'secondary' FROM exercises WHERE name = 'Dumbbell Bicep Curl';
