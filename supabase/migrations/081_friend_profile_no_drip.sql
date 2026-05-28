-- =============================================
-- MIGRATION 079: Friend profile + tap-to-view bypass Discover drip cutoff
-- =============================================
-- After migration 078 fixed get_friends_with_activity to filter by NOW(),
-- a friend's most-recent past workout correctly shows on the Friends list
-- (e.g. "Last workout: Tuesday"). But tapping the friend's profile rendered
-- zero workouts, because get_public_workouts and get_public_workout_details
-- (both from migration 077) still gated seed-user rows by
-- app_config.discover_visibility_cutoff_iso — the Discover drip dial.
--
-- That cutoff exists to throttle seeded posts trickling into the Discover
-- homepage feed. Once a user is already on a specific person's profile, the
-- drip doesn't apply — they should see everything that person has actually
-- done up to now, no different from viewing their own profile.
--
-- Fix: both profile-context RPCs now gate on `completed_at <= NOW()` for all
-- users uniformly. Future-dated seed workouts (the drip queue) remain hidden.
-- The Discover homepage RPC (get_public_workout_photos) is intentionally
-- NOT touched — that one keeps the cutoff so the drip continues to work.

-- ---------------------------------------------
-- Per-profile workouts list
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION get_public_workouts(p_viewer_id UUID, p_target_id UUID, p_limit INT DEFAULT 30)
RETURNS TABLE(id UUID, name TEXT, completed_at TIMESTAMPTZ, image_uri TEXT, duration_seconds INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_are_friends BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
      AND ((requester_id = p_viewer_id AND addressee_id = p_target_id)
        OR (requester_id = p_target_id AND addressee_id = p_viewer_id))
  ) INTO v_are_friends;

  RETURN QUERY
    SELECT
      w.id,
      w.name,
      w.completed_at,
      CASE
        WHEN w.image_audience = 'everyone' THEN w.image_uri
        WHEN w.image_audience = 'friends' AND v_are_friends THEN w.image_uri
        ELSE NULL
      END AS image_uri,
      w.duration_seconds
    FROM workouts w
    WHERE w.user_id = p_target_id
      AND w.completed_at IS NOT NULL
      AND w.completed_at <= NOW()
      AND w.image_uri IS NOT NULL
    ORDER BY w.completed_at DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_workouts(UUID, UUID, INT) TO authenticated;

-- ---------------------------------------------
-- Tap-to-view detail
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION get_public_workout_details(p_workout_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'workout', to_jsonb(w.*),
    'exercises', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', we.id,
          'workout_id', we.workout_id,
          'exercise_id', we.exercise_id,
          'exercise_name', we.exercise_name,
          'exercise_muscle', we.exercise_muscle,
          'order_index', we.order_index,
          'superset_id', we.superset_id,
          'notes', we.notes,
          'thumbnail_url', COALESCE(e.thumbnail_url, ce.thumbnail_url),
          'image_url', COALESCE(e.image_url, ce.image_url),
          'sets', COALESCE((
            SELECT jsonb_agg(to_jsonb(ws.*) ORDER BY ws.set_number)
            FROM workout_sets ws
            WHERE ws.workout_exercise_id = we.id
          ), '[]'::jsonb)
        ) ORDER BY we.order_index
      )
      FROM workout_exercises we
      LEFT JOIN exercises e ON e.id = we.exercise_id
      LEFT JOIN custom_exercises ce ON ce.id = we.exercise_id
      WHERE we.workout_id = w.id
    ), '[]'::jsonb),
    'muscles', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'muscle', wm.muscle,
        'total_sets', wm.total_sets,
        'activation', wm.activation
      ))
      FROM workout_muscles wm
      WHERE wm.workout_id = w.id
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM workouts w
  WHERE w.id = p_workout_id
    AND COALESCE(w.image_audience, 'everyone') = 'everyone'
    AND w.image_uri IS NOT NULL
    AND w.completed_at <= NOW();

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_workout_details(UUID) TO authenticated;
