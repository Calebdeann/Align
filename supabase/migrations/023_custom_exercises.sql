-- =============================================
-- MIGRATION 023: Custom exercises + storage bucket
-- =============================================
-- Allows users to create their own custom exercises.
-- Each user can only access their own custom exercises (RLS enforced).
-- Images stored in custom-exercise-images bucket under {userId}/{exerciseId}.jpg

-- Create custom_exercises table
CREATE TABLE IF NOT EXISTS custom_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT[] DEFAULT '{}',
  secondary_muscles TEXT[] DEFAULT '{}',
  image_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE custom_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own custom exercises
DO $$ BEGIN
  CREATE POLICY "Users can view own custom exercises"
  ON custom_exercises FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own custom exercises"
  ON custom_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own custom exercises"
  ON custom_exercises FOR UPDATE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own custom exercises"
  ON custom_exercises FOR DELETE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_custom_exercises_user_id ON custom_exercises(user_id);

-- Create storage bucket for custom exercise images (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-exercise-images', 'custom-exercise-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DO $$ BEGIN
  CREATE POLICY "Public read access for custom exercise images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'custom-exercise-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can upload to their own folder
DO $$ BEGIN
  CREATE POLICY "Users can upload own custom exercise images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'custom-exercise-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can update their own images
DO $$ BEGIN
  CREATE POLICY "Users can update own custom exercise images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'custom-exercise-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can delete their own images
DO $$ BEGIN
  CREATE POLICY "Users can delete own custom exercise images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'custom-exercise-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
