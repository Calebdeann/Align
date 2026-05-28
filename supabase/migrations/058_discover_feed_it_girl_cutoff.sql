-- =============================================
-- MIGRATION 058: Filter Discover feed to It Girl era
-- =============================================
-- Workouts created in the legacy Align/Snatched apps remain in the DB but
-- should not pollute the It Girl Discover feed. Apply a hard cutoff so only
-- workouts completed on or after 2026-05-21 00:00 UTC (when It Girl
-- development began) appear in the public feed.
-- To revert: change the cutoff to '1970-01-01' or drop+recreate without the filter.

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
  -- Workouts before this timestamp are legacy Align/Snatched data, hidden from the feed.
  legacy_cutoff TIMESTAMPTZ := '2026-05-21 00:00:00+00';
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
    AND w.completed_at >= legacy_cutoff
    AND (p_cursor IS NULL OR w.completed_at < p_cursor)
  ORDER BY w.completed_at DESC
  LIMIT p_limit;
END;
$$;
