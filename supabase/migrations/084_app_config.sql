-- =============================================
-- MIGRATION 084: Global app_config table for remote feature flags
-- =============================================
-- A single key/value table that lets us flip runtime behavior without
-- shipping a new build. First use case: `in_app_paywall_enabled` —
-- the global gate that wraps `(tabs)` re-presents the Superwall paywall
-- on every mount for non-subscribed users. We ship the build with this
-- flag set to FALSE so users who finish onboarding stay in the app
-- paywall-free. To re-enable the in-app gate later, flip the row to
-- TRUE in Supabase dashboard — no rebuild required.
--
-- value is JSONB to keep this table reusable for future flags
-- (numbers, strings, arrays, structured config blobs).

CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read app_config — these are non-sensitive client-side
-- runtime toggles. Writes are admin-only (no INSERT/UPDATE/DELETE policy
-- defined, so only the service-role key can mutate).
CREATE POLICY "anyone can read app_config"
  ON app_config FOR SELECT
  USING (true);

-- Seed the in-app paywall flag to FALSE. Onboarding paywall is unaffected
-- (it lives in pre-paywall.tsx and is wired separately via Superwall).
INSERT INTO app_config (key, value)
VALUES ('in_app_paywall_enabled', to_jsonb(false))
ON CONFLICT (key) DO NOTHING;
