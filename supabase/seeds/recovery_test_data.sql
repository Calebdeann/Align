-- =============================================
-- RECOVERY TEST DATA
-- =============================================
--
-- STEP 1: Get your User ID
--   → supabase.com → your project → Authentication → Users
--   → Find your account, copy the UUID (looks like: abc12345-...)
--
-- STEP 2: Paste your UUID in the line below (keep the quotes)
--
-- STEP 3: Go to supabase.com → your project → SQL Editor → New query
--   → Paste this entire file → click Run
--
-- =============================================

DO $$
DECLARE
  uid UUID := 'PASTE-YOUR-UUID-HERE';   -- <-- only line you need to change

  w_today     UUID := gen_random_uuid();
  w_yesterday UUID := gen_random_uuid();
  w_3days     UUID := gen_random_uuid();
  w_5days     UUID := gen_random_uuid();
  w_10days    UUID := gen_random_uuid();
  w_20days    UUID := gen_random_uuid();
BEGIN

INSERT INTO workouts (id, user_id, name, started_at, completed_at, duration_seconds) VALUES
  (w_today,     uid, 'Leg Day',    now() - interval '1.5 hours',      now() - interval '15 minutes', 5400),
  (w_yesterday, uid, 'Push Day',   now() - interval '1 day 1 hour',   now() - interval '1 day',      4200),
  (w_3days,     uid, 'Pull Day',   now() - interval '3 days 1 hour',  now() - interval '3 days',     3600),
  (w_5days,     uid, 'Leg Day',    now() - interval '5 days 1 hour',  now() - interval '5 days',     4800),
  (w_10days,    uid, 'Full Body',  now() - interval '10 days 1 hour', now() - interval '10 days',    5400),
  (w_20days,    uid, 'Lower Body', now() - interval '20 days 1 hour', now() - interval '20 days',    3600);

INSERT INTO workout_muscles (id, workout_id, muscle, total_sets, activation) VALUES
  -- Today: heavy legs
  (gen_random_uuid(), w_today, 'glutes',     5, 'primary'),
  (gen_random_uuid(), w_today, 'quads',      4, 'primary'),
  (gen_random_uuid(), w_today, 'hamstrings', 4, 'primary'),
  (gen_random_uuid(), w_today, 'calves',     3, 'primary'),
  (gen_random_uuid(), w_today, 'abs',        2, 'secondary'),

  -- Yesterday: push
  (gen_random_uuid(), w_yesterday, 'pectorals', 5, 'primary'),
  (gen_random_uuid(), w_yesterday, 'delts',     4, 'primary'),
  (gen_random_uuid(), w_yesterday, 'triceps',   4, 'secondary'),
  (gen_random_uuid(), w_yesterday, 'abs',       2, 'secondary'),

  -- 3 days ago: pull
  (gen_random_uuid(), w_3days, 'lats',    5, 'primary'),
  (gen_random_uuid(), w_3days, 'biceps',  4, 'primary'),
  (gen_random_uuid(), w_3days, 'delts',   2, 'secondary'),
  (gen_random_uuid(), w_3days, 'abs',     2, 'secondary'),

  -- 5 days ago: legs
  (gen_random_uuid(), w_5days, 'glutes',     4, 'primary'),
  (gen_random_uuid(), w_5days, 'quads',      4, 'primary'),
  (gen_random_uuid(), w_5days, 'hamstrings', 3, 'primary'),
  (gen_random_uuid(), w_5days, 'calves',     3, 'primary'),

  -- 10 days ago: full body
  (gen_random_uuid(), w_10days, 'pectorals',  3, 'primary'),
  (gen_random_uuid(), w_10days, 'lats',       3, 'primary'),
  (gen_random_uuid(), w_10days, 'quads',      3, 'primary'),
  (gen_random_uuid(), w_10days, 'glutes',     3, 'primary'),
  (gen_random_uuid(), w_10days, 'delts',      2, 'secondary'),
  (gen_random_uuid(), w_10days, 'triceps',    2, 'secondary'),
  (gen_random_uuid(), w_10days, 'biceps',     2, 'secondary'),

  -- 20 days ago: lower body
  (gen_random_uuid(), w_20days, 'glutes',     5, 'primary'),
  (gen_random_uuid(), w_20days, 'quads',      4, 'primary'),
  (gen_random_uuid(), w_20days, 'hamstrings', 4, 'primary'),
  (gen_random_uuid(), w_20days, 'calves',     2, 'primary');

END $$;


-- =============================================
-- CLEANUP — run this when done testing
-- (uncomment by selecting all lines below and pressing Cmd+/)
-- =============================================
-- DELETE FROM workout_muscles WHERE workout_id IN (
--   SELECT id FROM workouts
--   WHERE user_id = 'PASTE-YOUR-UUID-HERE'
--   AND name IN ('Leg Day', 'Push Day', 'Pull Day', 'Full Body', 'Lower Body')
-- );
-- DELETE FROM workouts
-- WHERE user_id = 'PASTE-YOUR-UUID-HERE'
-- AND name IN ('Leg Day', 'Push Day', 'Pull Day', 'Full Body', 'Lower Body');
