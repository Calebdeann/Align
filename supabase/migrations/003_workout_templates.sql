-- =============================================
-- WORKOUT TEMPLATES TABLES
-- Stores user-created workout templates with exercises and sets
-- =============================================

-- Main workout templates table
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Image fields
  image_type TEXT CHECK (image_type IN ('template', 'camera', 'gallery')),
  image_uri TEXT,
  image_template_id TEXT,

  -- Template metadata
  tag_ids TEXT[] DEFAULT '{}',
  tag_color TEXT NOT NULL DEFAULT '#947AFF',
  estimated_duration INTEGER NOT NULL DEFAULT 60, -- in minutes
  difficulty TEXT NOT NULL DEFAULT 'Beginner' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  equipment TEXT NOT NULL DEFAULT 'Gym',
  category TEXT CHECK (category IN ('at-home', 'travel', 'cardio', 'rehab')),
  is_preset BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template exercises table
CREATE TABLE IF NOT EXISTS template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  muscle TEXT NOT NULL,
  notes TEXT,
  rest_timer_seconds INTEGER NOT NULL DEFAULT 90,
  order_index INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template sets table
CREATE TABLE IF NOT EXISTS template_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_exercise_id UUID NOT NULL REFERENCES template_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  target_weight DECIMAL(10, 2), -- in kg
  target_reps INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Index for faster user template lookups
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_id ON workout_templates(user_id);

-- Index for template exercises by template
CREATE INDEX IF NOT EXISTS idx_template_exercises_template_id ON template_exercises(template_id);

-- Index for template sets by exercise
CREATE INDEX IF NOT EXISTS idx_template_sets_exercise_id ON template_sets(template_exercise_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_sets ENABLE ROW LEVEL SECURITY;

-- Policies for workout_templates
-- Users can only see their own templates
CREATE POLICY "Users can view own templates"
  ON workout_templates FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own templates
CREATE POLICY "Users can insert own templates"
  ON workout_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
  ON workout_templates FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
  ON workout_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for template_exercises
-- Users can view exercises for their templates
CREATE POLICY "Users can view own template exercises"
  ON template_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_templates
      WHERE workout_templates.id = template_exercises.template_id
      AND workout_templates.user_id = auth.uid()
    )
  );

-- Users can insert exercises for their templates
CREATE POLICY "Users can insert own template exercises"
  ON template_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_templates
      WHERE workout_templates.id = template_exercises.template_id
      AND workout_templates.user_id = auth.uid()
    )
  );

-- Users can update exercises for their templates
CREATE POLICY "Users can update own template exercises"
  ON template_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workout_templates
      WHERE workout_templates.id = template_exercises.template_id
      AND workout_templates.user_id = auth.uid()
    )
  );

-- Users can delete exercises for their templates
CREATE POLICY "Users can delete own template exercises"
  ON template_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workout_templates
      WHERE workout_templates.id = template_exercises.template_id
      AND workout_templates.user_id = auth.uid()
    )
  );

-- Policies for template_sets
-- Users can view sets for their template exercises
CREATE POLICY "Users can view own template sets"
  ON template_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM template_exercises
      JOIN workout_templates ON workout_templates.id = template_exercises.template_id
      WHERE template_exercises.id = template_sets.template_exercise_id
      AND workout_templates.user_id = auth.uid()
    )
  );

-- Users can insert sets for their template exercises
CREATE POLICY "Users can insert own template sets"
  ON template_sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM template_exercises
      JOIN workout_templates ON workout_templates.id = template_exercises.template_id
      WHERE template_exercises.id = template_sets.template_exercise_id
      AND workout_templates.user_id = auth.uid()
    )
  );

-- Users can update sets for their template exercises
CREATE POLICY "Users can update own template sets"
  ON template_sets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM template_exercises
      JOIN workout_templates ON workout_templates.id = template_exercises.template_id
      WHERE template_exercises.id = template_sets.template_exercise_id
      AND workout_templates.user_id = auth.uid()
    )
  );

-- Users can delete sets for their template exercises
CREATE POLICY "Users can delete own template sets"
  ON template_sets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM template_exercises
      JOIN workout_templates ON workout_templates.id = template_exercises.template_id
      WHERE template_exercises.id = template_sets.template_exercise_id
      AND workout_templates.user_id = auth.uid()
    )
  );

-- =============================================
-- TRIGGER FOR updated_at
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on workout_templates
CREATE TRIGGER update_workout_templates_updated_at
  BEFORE UPDATE ON workout_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
