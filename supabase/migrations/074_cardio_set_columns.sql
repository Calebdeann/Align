-- =============================================
-- MIGRATION 074: Cardio set columns (difficulty + duration_seconds)
-- =============================================
-- Adds two nullable columns to workout_sets so cardio workouts can log
-- difficulty (incline / resistance / pace / level — depends on the cardio
-- machine type) and duration in seconds.
--
-- Existing weight/reps sets keep working unchanged. Cardio sets leave
-- weight + reps as NULL and populate difficulty + duration_seconds instead.
--
-- The app distinguishes cardio sets by the parent exercise's id (which
-- starts with `cardio-` for synthesized cardio exercises). No constraint
-- enforces "exactly one pair populated" because (a) it's hard to express
-- cleanly and (b) the client logic is the source of truth.
--
-- Safe to re-run: IF NOT EXISTS makes this idempotent.

ALTER TABLE workout_sets
  ADD COLUMN IF NOT EXISTS difficulty numeric NULL,
  ADD COLUMN IF NOT EXISTS duration_seconds integer NULL;
