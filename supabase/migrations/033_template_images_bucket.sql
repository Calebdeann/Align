-- =============================================
-- MIGRATION 033: Template images storage bucket
-- =============================================
-- Creates a public storage bucket for user-uploaded template cover images.
-- Images are stored at {userId}/{timestamp}.jpg and served publicly.

-- Create the storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-images', 'template-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all template images
DO $$ BEGIN
  CREATE POLICY "Public read access for template images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'template-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow authenticated users to upload to their own folder (path: {userId}/...)
DO $$ BEGIN
  CREATE POLICY "Users can upload their own template images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'template-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow authenticated users to delete their own images
DO $$ BEGIN
  CREATE POLICY "Users can delete their own template images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'template-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
