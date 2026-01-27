-- =============================================
-- MIGRATION 012: Exercise thumbnails storage bucket
-- =============================================
-- Creates a public storage bucket for background-removed exercise thumbnails.
-- Run this in the Supabase SQL Editor, then upload thumbnails via:
--   node scripts/upload-thumbnails-nobg.mjs

-- Create the storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-thumbnails', 'exercise-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all files in the bucket
DO $$ BEGIN
  CREATE POLICY "Public read access for exercise thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exercise-thumbnails');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow authenticated uploads (for admin/script use via service role key)
DO $$ BEGIN
  CREATE POLICY "Service upload access for exercise thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'exercise-thumbnails');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow updates (re-uploading thumbnails)
DO $$ BEGIN
  CREATE POLICY "Service update access for exercise thumbnails"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'exercise-thumbnails');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
