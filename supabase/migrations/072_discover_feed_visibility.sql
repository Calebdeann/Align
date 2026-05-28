-- =============================================
-- MIGRATION 072: Discover feed visibility filter (public / friends only)
-- =============================================
-- Adds a `p_visibility` parameter to get_public_workout_photos so the Discover
-- screen can show either the public feed (existing behavior) or a feed limited
-- to the caller's accepted friends.
--
-- Behavior:
--   p_visibility = 'public'  (default) → unchanged: all workouts with
--     image_audience = 'everyone' that pass the drip-pause cutoff and have a
--     photo.
--   p_visibility = 'friends' → only workouts whose author is an accepted
--     friend of auth.uid(). Excludes the caller's own workouts. Allows
--     image_audience IN ('everyone', 'friends') so friends-audience posts
--     surface to friends. Same drip-pause cutoff, same photo requirement.
--
-- Preserves migration 071's drip-pause cutoff via app_config key
-- 'discover_visibility_cutoff_iso'.

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
      AND w.completed_at <= v_cutoff
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
      AND w.completed_at <= v_cutoff
      AND (p_cursor IS NULL OR w.completed_at < p_cursor)
    ORDER BY w.completed_at DESC
    LIMIT p_limit;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_workout_photos(INT, TIMESTAMPTZ, TEXT) TO authenticated;
