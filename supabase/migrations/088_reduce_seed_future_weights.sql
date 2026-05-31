-- =============================================
-- MIGRATION 088: Reduce future-dated seed buddy workout weights by 15%
-- =============================================
-- The seeded fake-buddy workouts were generated with weights that felt too
-- heavy. Reducing weight by 15% drops volume (weight × reps × sets) by the
-- same factor, with no separate cached aggregate to touch.
--
-- Scope: only future-dated seed workouts (completed_at > NOW()) — i.e. the
-- drip-release rows that haven't surfaced in the Discover feed yet. Already
-- visible past-dated seed rows are left untouched (user explicitly said
-- don't worry about past). Real user rows are identified by NULL or
-- non-'[seed]' notes and are never touched here.
--
-- Rounding back to 2.5 kg increments preserves the realistic dumbbell-jump
-- feel that scripts/seed-fake-workouts.mjs enforces on every weight it
-- generates.

UPDATE workout_sets
SET weight = ROUND((weight * 0.85) / 2.5) * 2.5
WHERE workout_exercise_id IN (
  SELECT we.id
  FROM workout_exercises we
  JOIN workouts w ON w.id = we.workout_id
  WHERE w.notes = '[seed]'
    AND w.completed_at > NOW()
);
