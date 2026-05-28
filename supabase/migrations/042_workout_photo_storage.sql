-- =============================================
-- MIGRATION 042: Workout photo cloud storage
-- =============================================
-- Creates a public storage bucket for workout photos.
-- Photos are uploaded before the workout row is inserted, so image_uri
-- stores a persistent Supabase Storage public URL instead of a local file:// path.

-- Public bucket — CDN-backed via Supabase Edge / Cloudflare
INSERT INTO storage.buckets (id, name, public)
VALUES ('workout-photos', 'workout-photos', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public read access for workout photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'workout-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can upload their own workout photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'workout-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own workout photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'workout-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Audience for each workout photo: 'friends' (friends-only) or 'everyone' (public discover feed).
-- Defaults to 'everyone' so existing rows without the column behave as public.
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS image_audience TEXT DEFAULT 'everyone';

-- Partial index for the discover feed: only rows with a public photo need to be scanned.
CREATE INDEX IF NOT EXISTS workouts_image_discover_idx
  ON workouts (image_audience, completed_at DESC)
  WHERE image_uri IS NOT NULL;
