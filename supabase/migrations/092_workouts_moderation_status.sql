-- =============================================
-- MIGRATION 092: workouts.moderation_status
-- =============================================
-- Single source of truth for whether a workout (and its photo, since the
-- photo lives on workouts.image_uri) is allowed in public surfaces.
--
-- States:
--   visible         — default; flows through discover RPCs.
--   pending_review  — auto-set by Phase 4 (profanity trigger on name/desc;
--                     Rekognition Edge Function on photo upload).
--   rejected        — set by admin in Phase 5 ("Remove content" action).
--                     Filtered out of every public RPC starting in 093.
--
-- Default 'visible' so existing rows + seed-account workouts (Priya, Emma,
-- Tilly, etc.) keep flowing without intervention. Seed safety preserved.
--
-- The partial index covers only non-visible rows — that's where the admin
-- queue, retries, and dashboards will query, and visible rows (the vast
-- majority) don't need an index entry.

ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible'
    CHECK (moderation_status IN ('visible','pending_review','rejected'));

CREATE INDEX IF NOT EXISTS workouts_moderation_status_idx
  ON workouts (moderation_status)
  WHERE moderation_status <> 'visible';
