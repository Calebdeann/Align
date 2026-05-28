ALTER TABLE scheduled_workouts
  ADD COLUMN IF NOT EXISTS plan_id TEXT,
  ADD COLUMN IF NOT EXISTS program_workout_id TEXT;

CREATE INDEX IF NOT EXISTS scheduled_workouts_plan_idx
  ON scheduled_workouts(user_id, plan_id);
