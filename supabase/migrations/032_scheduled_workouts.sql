-- Scheduled workouts table: syncs local scheduled workouts to Supabase
-- so they persist across reinstalls, sign-out/sign-in, and device changes.

CREATE TABLE IF NOT EXISTS scheduled_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core fields
  name TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,  -- YYYY-MM-DD

  -- Image (JSONB to match WorkoutImage type: {type, uri, templateId?})
  image JSONB,

  -- Tag/color
  tag_id TEXT,
  tag_color TEXT NOT NULL DEFAULT '#947AFF',

  -- Template link
  template_name TEXT,
  template_id TEXT,  -- not a FK (templates can be deleted, preset IDs are slugs)

  -- Time (JSONB: {hour, minute})
  time JSONB,

  -- Repeat config (JSONB: {type, customDays?, intervalDays?})
  repeat JSONB NOT NULL DEFAULT '{"type":"never"}',

  -- Reminder config (JSONB: {enabled, hour, minute})
  reminder JSONB,

  -- Completion / exclusion tracking
  completed_dates JSONB NOT NULL DEFAULT '[]',
  excluded_dates JSONB NOT NULL DEFAULT '[]',
  end_date TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_user_id ON scheduled_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_date ON scheduled_workouts(date);

-- RLS
ALTER TABLE scheduled_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled workouts"
  ON scheduled_workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled workouts"
  ON scheduled_workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled workouts"
  ON scheduled_workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled workouts"
  ON scheduled_workouts FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at on row change
CREATE TRIGGER update_scheduled_workouts_updated_at
  BEFORE UPDATE ON scheduled_workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
