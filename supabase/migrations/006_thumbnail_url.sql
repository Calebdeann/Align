-- Add thumbnail_url column for fast-loading list images
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_exercises_thumbnail_url ON exercises(thumbnail_url);
