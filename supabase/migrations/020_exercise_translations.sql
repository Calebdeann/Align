-- Exercise translations table
-- Stores translated exercise names, instructions, and keywords per language
CREATE TABLE IF NOT EXISTS exercise_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  instructions_array TEXT[],
  keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(exercise_id, language)
);

-- Fast lookup by exercise + language (primary query pattern)
CREATE INDEX idx_exercise_translations_exercise_lang
  ON exercise_translations(exercise_id, language);

-- Fast lookup by language (for bulk fetch of all translations for a locale)
CREATE INDEX idx_exercise_translations_language
  ON exercise_translations(language);

-- GIN index for translated keyword search
CREATE INDEX idx_exercise_translations_keywords
  ON exercise_translations USING GIN (keywords);

-- RLS: Read-only, publicly accessible (reference data like exercises)
ALTER TABLE exercise_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercise translations"
  ON exercise_translations FOR SELECT
  USING (true);
