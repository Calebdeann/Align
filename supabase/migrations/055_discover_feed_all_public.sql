-- =============================================
-- MIGRATION 055: Show every public workout on the Discover feed
-- =============================================
-- Removes the "must have a photo OR a customized title" filter introduced in
-- migration 054. Going forward, image_audience = 'everyone' is the only gate.
-- The title_customized column is still returned so the client can decide
-- whether to render the caption text under each card.
-- Also restores image_aspect_ratio in the return shape (migration 054 dropped
-- it but the client still reads row.image_aspect_ratio).

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
    AND (p_cursor IS NULL OR w.completed_at < p_cursor)
  ORDER BY w.completed_at DESC
  LIMIT p_limit;
END;
$$;
