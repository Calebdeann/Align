-- =============================================
-- MIGRATION 070: Configurable drip-start delay for public workout views
-- =============================================
-- Adds a runtime-tunable delay between a workout's `completed_at` and the
-- moment it becomes publicly visible. While we're still in pre-launch dev
-- with no real users, we want the seeded "drip" content to NOT actually
-- drip — we'll set the delay to 7 days so all currently-future-dated rows
-- stay hidden, and we can dial it down (2 days, 0, etc.) closer to launch
-- without shipping a new app version.
--
-- Mechanism:
--   - app_config key `discover_drip_delay_days` (default '7').
--   - Each public RPC subtracts that many days from NOW() in its visibility
--     check, so `completed_at <= NOW() - delay`.
--   - To adjust the delay live:
--       UPDATE app_config SET value = '2' WHERE key = 'discover_drip_delay_days';
--     (Or edit the row in the Supabase dashboard table editor.)
--
-- This affects the three public workout RPCs only:
--   get_public_workout_photos, get_public_workouts, get_public_workout_details.
-- A user's OWN workout history is unaffected.

-- Seed default. 7 days during dev.
INSERT INTO app_config (key, value) VALUES ('discover_drip_delay_days', '7')
  ON CONFLICT (key) DO NOTHING;

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
DECLARE
  v_delay_days INT;
  v_cutoff TIMESTAMPTZ;
BEGIN
  SELECT COALESCE(value::INT, 0) INTO v_delay_days
  FROM app_config WHERE key = 'discover_drip_delay_days';
  v_delay_days := COALESCE(v_delay_days, 0);
  v_cutoff := NOW() - (v_delay_days || ' days')::INTERVAL;

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
    AND w.completed_at <= v_cutoff
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
  v_delay_days INT;
  v_cutoff TIMESTAMPTZ;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
      AND ((requester_id = p_viewer_id AND addressee_id = p_target_id)
        OR (requester_id = p_target_id AND addressee_id = p_viewer_id))
  ) INTO v_are_friends;

  SELECT COALESCE(value::INT, 0) INTO v_delay_days
  FROM app_config WHERE key = 'discover_drip_delay_days';
  v_delay_days := COALESCE(v_delay_days, 0);
  v_cutoff := NOW() - (v_delay_days || ' days')::INTERVAL;

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
      AND w.completed_at <= v_cutoff
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
  v_delay_days INT;
  v_cutoff TIMESTAMPTZ;
BEGIN
  SELECT COALESCE(value::INT, 0) INTO v_delay_days
  FROM app_config WHERE key = 'discover_drip_delay_days';
  v_delay_days := COALESCE(v_delay_days, 0);
  v_cutoff := NOW() - (v_delay_days || ' days')::INTERVAL;

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
    AND w.completed_at <= v_cutoff;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_workout_details(UUID) TO authenticated;
