-- =============================================
-- MIGRATION 048: Ensure avatars bucket is public
-- =============================================
-- ON CONFLICT DO UPDATE fixes cases where the bucket was previously
-- created as private (without public = true), which caused getPublicUrl()
-- to return inaccessible URLs.

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;
