-- =============================================
-- MIGRATION 073: Real users bypass the discover drip cutoff
-- =============================================
-- Migration 071 added a "drip pause" cutoff (app_config key
-- discover_visibility_cutoff_iso) and applied it uniformly via
-- `WHERE w.completed_at <= v_cutoff` in three RPCs. The intent was to
-- throttle the 27 hardcoded seed accounts (see scripts/seed-data/
-- fake-accounts.json) so their posts trickle into Discover over time.
--
-- Side effect: real users' new posts are also hidden because their
-- completed_at is after the frozen cutoff.
--
-- Fix: tag seed accounts with `profiles.is_seed = TRUE` and only apply
-- the cutoff to those rows. Real users (`is_seed = FALSE`) bypass.

-- ---------------------------------------------
-- 1. Add the flag + backfill from traffic_source
-- ---------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE profiles
SET is_seed = TRUE
WHERE traffic_source LIKE 'seed-buddy-%'
   OR traffic_source LIKE 'seed-extra-%';

-- ---------------------------------------------
-- 2. Discover feed
-- ---------------------------------------------
DROP FUNCTION IF EXISTS get_public_workout_photos(INT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS get_public_workout_photos(INT, TIMESTAMPTZ, TEXT);

CREATE OR REPLACE FUNCTION get_public_workout_photos(
  p_limit      INT         DEFAULT 20,
  p_cursor     TIMESTAMPTZ DEFAULT NULL,
  p_visibility TEXT        DEFAULT 'public'
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
  v_cutoff TIMESTAMPTZ;
  v_viewer UUID;
BEGIN
  SELECT COALESCE(NULLIF(value, '')::TIMESTAMPTZ, NOW()) INTO v_cutoff
  FROM app_config WHERE key = 'discover_visibility_cutoff_iso';
  v_cutoff := COALESCE(v_cutoff, NOW());

  v_viewer := auth.uid();

  IF p_visibility = 'friends' THEN
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
    JOIN friendships f
      ON f.status = 'accepted'
     AND (
       (f.requester_id = v_viewer AND f.addressee_id = w.user_id)
       OR
       (f.addressee_id = v_viewer AND f.requester_id = w.user_id)
     )
    WHERE w.user_id <> v_viewer
      AND COALESCE(w.image_audience, 'everyone') IN ('everyone', 'friends')
      AND w.image_uri IS NOT NULL
      AND (NOT p.is_seed OR w.completed_at <= v_cutoff)
      AND (p_cursor IS NULL OR w.completed_at < p_cursor)
    ORDER BY w.completed_at DESC
    LIMIT p_limit;
  ELSE
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
      AND (NOT p.is_seed OR w.completed_at <= v_cutoff)
      AND (p_cursor IS NULL OR w.completed_at < p_cursor)
    ORDER BY w.completed_at DESC
    LIMIT p_limit;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_workout_photos(INT, TIMESTAMPTZ, TEXT) TO authenticated;

-- ---------------------------------------------
-- 3. Per-profile workouts list
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION get_public_workouts(p_viewer_id UUID, p_target_id UUID, p_limit INT DEFAULT 30)
RETURNS TABLE(id UUID, name TEXT, completed_at TIMESTAMPTZ, image_uri TEXT, duration_seconds INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_are_friends   BOOLEAN;
  v_cutoff        TIMESTAMPTZ;
  v_target_is_seed BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
      AND ((requester_id = p_viewer_id AND addressee_id = p_target_id)
        OR (requester_id = p_target_id AND addressee_id = p_viewer_id))
  ) INTO v_are_friends;

  SELECT COALESCE(NULLIF(value, '')::TIMESTAMPTZ, NOW()) INTO v_cutoff
  FROM app_config WHERE key = 'discover_visibility_cutoff_iso';
  v_cutoff := COALESCE(v_cutoff, NOW());

  SELECT COALESCE(is_seed, FALSE) INTO v_target_is_seed
  FROM profiles WHERE id = p_target_id;
  v_target_is_seed := COALESCE(v_target_is_seed, FALSE);

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
      AND (NOT v_target_is_seed OR w.completed_at <= v_cutoff)
    ORDER BY w.completed_at DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_workouts(UUID, UUID, INT) TO authenticated;

-- ---------------------------------------------
-- 4. Tap-to-view detail
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION get_public_workout_details(p_workout_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_cutoff TIMESTAMPTZ;
BEGIN
  SELECT COALESCE(NULLIF(value, '')::TIMESTAMPTZ, NOW()) INTO v_cutoff
  FROM app_config WHERE key = 'discover_visibility_cutoff_iso';
  v_cutoff := COALESCE(v_cutoff, NOW());

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
  JOIN profiles p ON p.id = w.user_id
  WHERE w.id = p_workout_id
    AND COALESCE(w.image_audience, 'everyone') = 'everyone'
    AND w.image_uri IS NOT NULL
    AND (NOT p.is_seed OR w.completed_at <= v_cutoff);

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_workout_details(UUID) TO authenticated;
