-- =============================================
-- MIGRATION 073: Rename plan id `glow-up` → `busy-girl`
-- =============================================
-- The Glow Up plan has been renamed to Busy Girl across the codebase
-- (program file, PROGRAMS registry, plan card, screen plan-icon maps).
-- This migration backfills existing user data so no records are orphaned:
--   • profiles.plan_id              — the user's chosen plan
--   • onboarding_sessions.plan_id   — in-flight onboarding picks
--   • scheduled_workouts.plan_id    — scheduled plan reference
--   • scheduled_workouts.program_workout_id — IDs like `glow-up-w1-d1-main`
--     → `busy-girl-w1-d1-main`
--
-- Safe to re-run: each UPDATE is filtered by WHERE plan_id = 'glow-up' (or LIKE
-- 'glow-up-%') so it's a no-op once applied.

UPDATE profiles
SET plan_id = 'busy-girl'
WHERE plan_id = 'glow-up';

UPDATE onboarding_sessions
SET plan_id = 'busy-girl'
WHERE plan_id = 'glow-up';

UPDATE scheduled_workouts
SET plan_id = 'busy-girl'
WHERE plan_id = 'glow-up';

UPDATE scheduled_workouts
SET program_workout_id = REPLACE(program_workout_id, 'glow-up-', 'busy-girl-')
WHERE program_workout_id LIKE 'glow-up-%';
