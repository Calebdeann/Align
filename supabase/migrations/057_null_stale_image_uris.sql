-- =============================================
-- MIGRATION 057: Null out stale non-https image_uri values
-- =============================================
-- Before the upload-on-save fix, the client could persist a device-local URI
-- (file://, ph://, /var/, http://localhost:8081 from Metro, etc.) into
-- workouts.image_uri. Those URIs only work in the originating session/device,
-- so the Discover feed and detail view see dead URLs. This migration cleans
-- the legacy data by nulling any image_uri that isn't a real https:// URL.
-- Going forward, saveCompletedWorkout uploads to Supabase Storage and stores
-- only https URLs, so this is a one-shot cleanup.

UPDATE workouts
SET image_uri = NULL
WHERE image_uri IS NOT NULL
  AND image_uri NOT LIKE 'https://%';
