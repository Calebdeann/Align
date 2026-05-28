-- =============================================
-- MIGRATION 049: Chronological workout feed (no photo requirement)
-- =============================================
-- Removes the `image_uri IS NOT NULL` gate from get_public_workout_photos so
-- all public workouts (not just those with photos) appear in the discover feed,
-- ordered chronologically. Replaces the partial index with a plain one.

DROP INDEX IF EXISTS workouts_image_discover_idx;

CREATE INDEX IF NOT EXISTS workouts_discover_idx
  ON workouts (image_audience, completed_at DESC);

CREATE OR REPLACE FUNCTION get_public_workout_photos(
  p_limit   INT         DEFAULT 20,
  p_cursor  TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  workout_id   UUID,
  workout_name TEXT,
  completed_at TIMESTAMPTZ,
  image_uri    TEXT,
  user_id      UUID,
  user_name    TEXT,
  user_avatar  TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id           AS workout_id,
    w.name         AS workout_name,
    w.completed_at AS completed_at,
    w.image_uri    AS image_uri,
    p.id           AS user_id,
    p.name         AS user_name,
    p.avatar_url   AS user_avatar
  FROM workouts w
  JOIN profiles p ON p.id = w.user_id
  WHERE w.image_audience = 'everyone'
    AND (p_cursor IS NULL OR w.completed_at < p_cursor)
  ORDER BY w.completed_at DESC
  LIMIT p_limit;
END;
$$;
