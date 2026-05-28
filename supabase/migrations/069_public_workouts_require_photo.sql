-- =============================================
-- MIGRATION 068: Public workout views must have a photo + be in the past
-- =============================================
-- Two rules enforced at the DB layer for every public-facing workout RPC:
--   1. completed_at <= NOW()  — hides future-dated drip rows
--   2. image_uri IS NOT NULL  — never expose a workout without a photo (a
--      missing photo would render as a grey card or broken image, which we
--      never want in any public view)
--
-- This applies to:
--   - get_public_workout_photos  (discover feed list)
--   - get_public_workouts        (per-profile workouts list)
--   - get_public_workout_details (tap-to-view detail screen)
--
-- The user's OWN workout history is unaffected — those queries hit the
-- workouts table directly under RLS, not through these public RPCs.

-- ---------------------------------------------
-- 1. Discover feed
-- ---------------------------------------------
DROP FUNCTION IF EXISTS get_public_workout_photos(INT, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_public_workout_photos(
  p_limit   INT         DEFAULT 20,
  p_cursor  TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  workout_id         UUID,
  workout_name       TEXT,
  completed_at       TIMESTAMPTZ,
  image_uri          TEXT,
  image_aspect_ratio NUMERIC,
  user_id            UUID,
  user_name          TEXT,
  user_avatar        TEXT,
  title_customized   BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id                                 AS workout_id,
    w.name                               AS workout_name,
    w.completed_at                       AS completed_at,
    w.image_uri                          AS image_uri,
    w.image_aspect_ratio                 AS image_aspect_ratio,
    p.id                                 AS user_id,
    p.name                               AS user_name,
    p.avatar_url                         AS user_avatar,
    COALESCE(w.title_customized, FALSE)  AS title_customized
  FROM workouts w
  JOIN profiles p ON p.id = w.user_id
  WHERE w.image_audience = 'everyone'
    AND w.image_uri IS NOT NULL
    AND w.completed_at <= NOW()
    AND (p_cursor IS NULL OR w.completed_at < p_cursor)
  ORDER BY w.completed_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_workout_photos(INT, TIMESTAMPTZ) TO authenticated;

-- ---------------------------------------------
-- 2. Per-profile workouts list
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
      AND w.image_uri IS NOT NULL
      AND w.completed_at <= NOW()
    ORDER BY w.completed_at DESC
    LIMIT p_limit;
END;
$$;

-- ---------------------------------------------
-- 3. Tap-to-view detail
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
