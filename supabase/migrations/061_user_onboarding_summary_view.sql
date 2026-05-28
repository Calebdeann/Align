-- 061: Readable onboarding summary view.
--
-- Provides a single wide row per user joining active It Girl onboarding answers
-- (from `profiles`) with the archived Align-era answers (from `legacy_align_onboarding`).
-- Use `SELECT * FROM v_user_onboarding_summary;` in the Supabase SQL editor to inspect
-- everything we have on each user in one place.

CREATE OR REPLACE VIEW v_user_onboarding_summary AS
SELECT
  p.id                                    AS user_id,
  p.email                                 AS email,
  p.name                                  AS it_girl_name,
  p.created_at                            AS signed_up,
  -- Active It Girl onboarding answers
  p.traffic_source                        AS itgirl_how_they_found_us,
  array_to_string(p.achieve_goals, ', ')  AS itgirl_goals,
  p.ideal_day                             AS itgirl_lifestyle,
  array_to_string(p.challenges, ', ')     AS itgirl_challenges,
  array_to_string(p.workout_days, ', ')   AS itgirl_workout_days,
  p.plan_id                               AS itgirl_plan,
  p.matched_buddy_index                   AS itgirl_buddy_idx,
  p.program_start_date                    AS itgirl_start_date,
  -- Body / preferences still on profiles
  p.age, p.height, p.weight, p.target_weight,
  p.notifications_enabled, p.reminder_time,
  -- Align legacy (from archive table — NULL for It-Girl-only users)
  l.experience_level    AS align_experience,
  l.main_goal           AS align_main_goal,
  array_to_string(l.goals, ', ') AS align_goals,
  l.body_change_goal    AS align_body_change,
  l.tried_other_apps    AS align_tried_others,
  l.referral_source     AS align_referral_source,
  l.training_location   AS align_train_location,
  l.workout_frequency   AS align_workout_freq,
  l.main_obstacle       AS align_main_obstacle,
  l.health_situation    AS align_health,
  l.energy_fluctuation  AS align_energy,
  l.units               AS align_units,
  l.archived_at         AS align_archived_at
FROM profiles p
LEFT JOIN legacy_align_onboarding l ON l.user_id = p.id
ORDER BY p.created_at DESC;

COMMENT ON VIEW v_user_onboarding_summary IS
  'One row per user with active It Girl onboarding answers plus archived Align-era data. Use for analytics / curiosity in the Supabase SQL editor.';
