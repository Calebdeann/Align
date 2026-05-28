-- =============================================
-- MIGRATION 051: Add image_aspect_ratio to workouts
-- =============================================
-- Stores the actual height/width ratio of each workout photo so the
-- discover feed can size cards dynamically instead of using a hardcoded value.

ALTER TABLE workouts ADD COLUMN IF NOT EXISTS image_aspect_ratio NUMERIC DEFAULT NULL;

-- Recreate get_public_workout_photos to include the new column (drop first — return type changed)
DROP FUNCTION IF EXISTS get_public_workout_photos(INT, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_public_workout_photos(
  p_limit   INT         DEFAULT 20,
  p_cursor  TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  workout_id          UUID,
  workout_name        TEXT,
  completed_at        TIMESTAMPTZ,
  image_uri           TEXT,
  image_aspect_ratio  NUMERIC,
  user_id             UUID,
  user_name           TEXT,
  user_avatar         TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id                  AS workout_id,
    w.name                AS workout_name,
    w.completed_at        AS completed_at,
    w.image_uri           AS image_uri,
    w.image_aspect_ratio  AS image_aspect_ratio,
    p.id                  AS user_id,
    p.name                AS user_name,
    p.avatar_url          AS user_avatar
  FROM workouts w
  JOIN profiles p ON p.id = w.user_id
  WHERE w.image_audience = 'everyone'
    AND (p_cursor IS NULL OR w.completed_at < p_cursor)
  ORDER BY w.completed_at DESC
  LIMIT p_limit;
END;
$$;
