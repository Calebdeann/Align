-- 060: Archive Align/Snatched-era onboarding columns and add It Girl onboarding columns.
--
-- Context:
--   The profiles + onboarding_sessions tables still carry ~12 columns from the Align era
--   (experience_level, main_goal, body_change_goal, etc.) that no It Girl onboarding screen
--   reads or writes. Existing user data is preserved (read by some legacy code paths) but
--   should be decoupled from the It Girl app surface.
--
--   This migration:
--     1. Snapshots the Align-era data into a new `legacy_align_onboarding` table (data preserved).
--     2. Drops those columns from `profiles` and `onboarding_sessions` (app no longer touches them).
--     3. Adds new It-Girl-specific columns that match what the current onboarding flow actually
--        collects on the 5 screens that were losing their answers: traffic-source, achieve,
--        ideal-day, challenge, when-to-begin.

-- 1. ARCHIVE TABLE -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS legacy_align_onboarding (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email              TEXT,
  archived_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  experience_level   TEXT,
  main_goal          TEXT,
  goals              TEXT[],
  body_change_goal   TEXT,
  tried_other_apps   TEXT,
  referral_source    TEXT,
  training_location  TEXT,
  workout_frequency  INTEGER,
  main_obstacle      TEXT,
  health_situation   TEXT,
  energy_fluctuation TEXT,
  units              TEXT
);

COMMENT ON TABLE legacy_align_onboarding IS
  'Snapshot of Align/Snatched-era onboarding answers per user. Frozen at the moment It Girl migration 060 ran. NOT written by It Girl app code; preserved for analytical / reactivation purposes only.';

ALTER TABLE legacy_align_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own legacy align row" ON legacy_align_onboarding;
CREATE POLICY "Users can read own legacy align row"
  ON legacy_align_onboarding FOR SELECT
  USING (auth.uid() = user_id);

-- 2. COPY DATA INTO ARCHIVE --------------------------------------------------
INSERT INTO legacy_align_onboarding (
  user_id, email,
  experience_level, main_goal, goals, body_change_goal, tried_other_apps,
  referral_source, training_location, workout_frequency,
  main_obstacle, health_situation, energy_fluctuation, units
)
SELECT
  id, email,
  experience_level, main_goal, goals, body_change_goal, tried_other_apps,
  referral_source, training_location, workout_frequency,
  main_obstacle, health_situation, energy_fluctuation, units
FROM profiles
WHERE
  experience_level   IS NOT NULL OR main_goal         IS NOT NULL OR goals             IS NOT NULL
  OR body_change_goal  IS NOT NULL OR tried_other_apps  IS NOT NULL OR referral_source   IS NOT NULL
  OR training_location IS NOT NULL OR workout_frequency IS NOT NULL OR main_obstacle     IS NOT NULL
  OR health_situation  IS NOT NULL OR energy_fluctuation IS NOT NULL OR units            IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. DROP LEGACY COLUMNS FROM profiles ---------------------------------------
ALTER TABLE profiles
  DROP COLUMN IF EXISTS experience_level,
  DROP COLUMN IF EXISTS main_goal,
  DROP COLUMN IF EXISTS goals,
  DROP COLUMN IF EXISTS body_change_goal,
  DROP COLUMN IF EXISTS tried_other_apps,
  DROP COLUMN IF EXISTS referral_source,
  DROP COLUMN IF EXISTS training_location,
  DROP COLUMN IF EXISTS workout_frequency,
  DROP COLUMN IF EXISTS main_obstacle,
  DROP COLUMN IF EXISTS health_situation,
  DROP COLUMN IF EXISTS energy_fluctuation,
  DROP COLUMN IF EXISTS units;

-- 4. DROP SAME COLUMNS FROM onboarding_sessions ------------------------------
ALTER TABLE onboarding_sessions
  DROP COLUMN IF EXISTS experience_level,
  DROP COLUMN IF EXISTS main_goal,
  DROP COLUMN IF EXISTS goals,
  DROP COLUMN IF EXISTS body_change_goal,
  DROP COLUMN IF EXISTS tried_other_apps,
  DROP COLUMN IF EXISTS referral_source,
  DROP COLUMN IF EXISTS training_location,
  DROP COLUMN IF EXISTS workout_frequency,
  DROP COLUMN IF EXISTS main_obstacle,
  DROP COLUMN IF EXISTS health_situation,
  DROP COLUMN IF EXISTS energy_fluctuation,
  DROP COLUMN IF EXISTS units;

-- 5. ADD NEW IT GIRL COLUMNS -------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS traffic_source      TEXT,
  ADD COLUMN IF NOT EXISTS achieve_goals       TEXT[],
  ADD COLUMN IF NOT EXISTS ideal_day           TEXT,
  ADD COLUMN IF NOT EXISTS challenges          TEXT[],
  ADD COLUMN IF NOT EXISTS program_start_date  DATE;

ALTER TABLE onboarding_sessions
  ADD COLUMN IF NOT EXISTS traffic_source      TEXT,
  ADD COLUMN IF NOT EXISTS achieve_goals       TEXT[],
  ADD COLUMN IF NOT EXISTS ideal_day           TEXT,
  ADD COLUMN IF NOT EXISTS challenges          TEXT[],
  ADD COLUMN IF NOT EXISTS program_start_date  DATE;

COMMENT ON COLUMN profiles.traffic_source      IS 'It Girl onboarding: how user heard about us (TikTok, Instagram, Pinterest, App Store, Friend/Family, Content Creator, Other).';
COMMENT ON COLUMN profiles.achieve_goals       IS 'It Girl onboarding: multi-select goals (confident, physique, discipline, health).';
COMMENT ON COLUMN profiles.ideal_day           IS 'It Girl onboarding: lifestyle vibe (flexible, early, balanced, gentle).';
COMMENT ON COLUMN profiles.challenges          IS 'It Girl onboarding: multi-select current challenges (consistent, unsure, motivation, confidence).';
COMMENT ON COLUMN profiles.program_start_date  IS 'It Girl onboarding: when user wants to start the program (YYYY-MM-DD).';
