-- Cache processed TikTok import results to avoid re-fetching rate-limited videos
-- Results are cached by video ID with a 24-hour TTL

CREATE TABLE IF NOT EXISTS tiktok_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_tiktok_cache_video_id ON tiktok_cache(video_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_cache_expires_at ON tiktok_cache(expires_at);
