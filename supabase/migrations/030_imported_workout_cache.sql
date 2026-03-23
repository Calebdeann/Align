-- Shared cache for imported workout videos.
-- When a user imports a TikTok/Instagram video, the result is cached here
-- so subsequent imports of the same video skip the edge function (saves API costs).

CREATE TABLE IF NOT EXISTS imported_workout_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  video_id TEXT NOT NULL,
  workout_name TEXT,
  exercises JSONB NOT NULL,
  confidence NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_imported_workout_cache_lookup
  ON imported_workout_cache(platform, video_id);

ALTER TABLE imported_workout_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read cached imports"
    ON imported_workout_cache FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can insert cached imports"
    ON imported_workout_cache FOR INSERT
    TO authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
