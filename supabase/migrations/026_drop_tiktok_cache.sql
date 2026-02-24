-- Remove tiktok_cache table: TikTok data should not be persisted in DB
-- Only stored in memory if user saves it as a template
DROP TABLE IF EXISTS tiktok_cache;
