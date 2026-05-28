-- =============================================
-- MIGRATION 059: Remote app config (key/value)
-- =============================================
-- A small public-readable config table so we can flip behavior in production
-- (e.g. the "Help us grow" review URL) without shipping a new build. Keys are
-- string-named; values are nullable text.

CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read app_config" ON app_config;
CREATE POLICY "Anyone can read app_config"
  ON app_config FOR SELECT
  USING (true);

-- Seed the review URL key with an empty value so the client falls back to the
-- native review prompt until we set this in the Supabase dashboard.
INSERT INTO app_config (key, value) VALUES ('review_url', '')
  ON CONFLICT (key) DO NOTHING;
