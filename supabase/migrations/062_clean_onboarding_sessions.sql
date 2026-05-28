-- 062: Remove Align-era body/notification columns from onboarding_sessions.
--
-- Context:
--   These columns (age, height, weight, target_weight, notifications_enabled, reminder_time)
--   were on `onboarding_sessions` because Align onboarding asked for them. It Girl onboarding
--   does NOT collect these — they remain on `profiles` only because the post-onboarding
--   personal-details editor and the notifications service read from there.
--
--   `onboarding_sessions` should only carry fields that an active It Girl onboarding screen
--   writes to. After this migration, the sessions row is It-Girl-only.

ALTER TABLE onboarding_sessions
  DROP COLUMN IF EXISTS age,
  DROP COLUMN IF EXISTS height,
  DROP COLUMN IF EXISTS weight,
  DROP COLUMN IF EXISTS target_weight,
  DROP COLUMN IF EXISTS notifications_enabled,
  DROP COLUMN IF EXISTS reminder_time;
