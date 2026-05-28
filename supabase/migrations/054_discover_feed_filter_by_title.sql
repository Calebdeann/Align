-- =============================================
-- MIGRATION 052: Filter Discover feed + return title_customized
-- =============================================
-- Updates get_public_workout_photos to: (a) return the title_customized flag
-- so clients can decide whether to render the caption text, and (b) exclude
-- workouts that have neither a photo nor a customized title so the feed
-- doesn't fill with repeated "Upper" / "Lower" defaults. The return shape
-- changes, so the existing function must be dropped first.

DROP FUNCTION IF EXISTS get_public_workout_photos(INT, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_public_workout_photos(
  p_limit   INT         DEFAULT 20,
  p_cursor  TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  workout_id        UUID,
  workout_name      TEXT,
  completed_at      TIMESTAMPTZ,
  image_uri         TEXT,
  user_id           UUID,
  user_name         TEXT,
  user_avatar       TEXT,
  title_customized  BOOLEAN
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
    p.avatar_url   AS user_avatar,
    COALESCE(w.title_customized, FALSE) AS title_customized
  FROM workouts w
  JOIN profiles p ON p.id = w.user_id
  WHERE w.image_audience = 'everyone'
    AND (w.image_uri IS NOT NULL OR COALESCE(w.title_customized, FALSE) = TRUE)
    AND (p_cursor IS NULL OR w.completed_at < p_cursor)
  ORDER BY w.completed_at DESC
  LIMIT p_limit;
END;
$$;
