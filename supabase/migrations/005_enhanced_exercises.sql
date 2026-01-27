-- Migration: Enhanced Exercises for ExerciseDB Premium Dataset
-- Adds support for female animations, videos, and detailed exercise data

-- Add new columns to exercises table
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS exercise_db_id TEXT,           -- Original ExerciseDB ID for reference
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'female',   -- Animation gender variant - default to female for our app
ADD COLUMN IF NOT EXISTS video_url TEXT,                 -- Video URL if available
ADD COLUMN IF NOT EXISTS gif_url_male TEXT,              -- Unused legacy column (kept for migration compatibility)
ADD COLUMN IF NOT EXISTS gif_url_female TEXT,            -- Female animation URL
ADD COLUMN IF NOT EXISTS target_muscles TEXT[],          -- Array of target/primary muscles
ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[],       -- Array of secondary muscles
ADD COLUMN IF NOT EXISTS body_parts TEXT[],              -- Array of body parts
ADD COLUMN IF NOT EXISTS instructions_array TEXT[],      -- Array of instruction steps
ADD COLUMN IF NOT EXISTS exercise_type TEXT,             -- Type of exercise
ADD COLUMN IF NOT EXISTS keywords TEXT[];                -- Search keywords

-- Update muscle_group column to allow NULL (we'll use target_muscles array instead)
ALTER TABLE exercises ALTER COLUMN muscle_group DROP NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exercises_exercise_db_id ON exercises(exercise_db_id);
CREATE INDEX IF NOT EXISTS idx_exercises_gender ON exercises(gender);

-- Note: Storage bucket needs to be created via Supabase Dashboard or CLI:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create bucket named "exercise-gifs"
-- 3. Set it to PUBLIC for read access
-- Or run: supabase storage create exercise-gifs --public
