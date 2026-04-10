-- =============================================
-- BACKFILL workout_muscles FROM EXISTING WORKOUTS
-- =============================================
-- Populates workout_muscles for any workout that has
-- workout_exercises but no muscle data yet.
--
-- Uses target_muscles (primary) and secondary_muscles
-- from the exercises table — same source as the app.
--
-- Safe to run multiple times — only fills gaps.
-- Run in: Supabase dashboard → SQL Editor → New query → Run
-- =============================================

-- Primary muscles
INSERT INTO workout_muscles (id, workout_id, muscle, total_sets, activation)
SELECT
  gen_random_uuid(),
  we.workout_id,
  tm.muscle,
  SUM(completed_sets.cnt) AS total_sets,
  'primary' AS activation
FROM workout_exercises we
JOIN exercises ex ON ex.id = we.exercise_id
JOIN LATERAL unnest(ex.target_muscles) AS tm(muscle) ON TRUE
JOIN (
  SELECT workout_exercise_id, COUNT(*) AS cnt
  FROM workout_sets
  WHERE completed = true
  GROUP BY workout_exercise_id
) completed_sets ON completed_sets.workout_exercise_id = we.id
WHERE tm.muscle IS NOT NULL AND tm.muscle != ''
  AND NOT EXISTS (
    SELECT 1 FROM workout_muscles wm WHERE wm.workout_id = we.workout_id
  )
GROUP BY we.workout_id, tm.muscle
HAVING SUM(completed_sets.cnt) > 0;

-- Secondary muscles
INSERT INTO workout_muscles (id, workout_id, muscle, total_sets, activation)
SELECT
  gen_random_uuid(),
  we.workout_id,
  sm.muscle,
  SUM(completed_sets.cnt) AS total_sets,
  'secondary' AS activation
FROM workout_exercises we
JOIN exercises ex ON ex.id = we.exercise_id
JOIN LATERAL unnest(ex.secondary_muscles) AS sm(muscle) ON TRUE
JOIN (
  SELECT workout_exercise_id, COUNT(*) AS cnt
  FROM workout_sets
  WHERE completed = true
  GROUP BY workout_exercise_id
) completed_sets ON completed_sets.workout_exercise_id = we.id
WHERE sm.muscle IS NOT NULL AND sm.muscle != ''
  AND NOT EXISTS (
    SELECT 1 FROM workout_muscles wm WHERE wm.workout_id = we.workout_id
  )
GROUP BY we.workout_id, sm.muscle
HAVING SUM(completed_sets.cnt) > 0;
