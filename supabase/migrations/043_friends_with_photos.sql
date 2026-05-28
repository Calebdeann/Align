-- =============================================
-- MIGRATION 043: Add image data to friends activity feed
-- =============================================
-- Extends get_friends_with_activity to return image_uri and image_audience
-- so the client can display a friend's workout photo in the friend card.
-- Must drop first because the return type is changing.

DROP FUNCTION IF EXISTS get_friends_with_activity(UUID);

CREATE FUNCTION get_friends_with_activity(p_user_id UUID)
RETURNS TABLE (
  friend_id        UUID,
  friend_name      TEXT,
  friend_avatar    TEXT,
  is_active        BOOLEAN,
  workout_id       UUID,
  workout_name     TEXT,
  duration_seconds INT,
  volume_kg        NUMERIC,
  workout_at       TIMESTAMPTZ,
  last_workout_at  TIMESTAMPTZ,
  image_uri        TEXT,
  image_audience   TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  today_start TIMESTAMPTZ := date_trunc('day', now() AT TIME ZONE 'UTC');
BEGIN
  RETURN QUERY
  WITH friend_ids AS (
    SELECT CASE
      WHEN requester_id = p_user_id THEN addressee_id
      ELSE requester_id
    END AS fid
    FROM friendships
    WHERE (requester_id = p_user_id OR addressee_id = p_user_id)
      AND status = 'accepted'
  ),
  latest_workouts AS (
    SELECT DISTINCT ON (w.user_id)
      w.id,
      w.user_id,
      w.name,
      w.duration_seconds,
      w.completed_at,
      w.image_uri,
      COALESCE(w.image_audience, 'everyone') AS image_audience,
      COALESCE(
        (SELECT SUM(ws.weight_kg * ws.reps)
         FROM workout_exercises we2
         JOIN workout_sets ws ON ws.workout_exercise_id = we2.id
         WHERE we2.workout_id = w.id AND ws.completed = true),
        0
      ) AS vol_kg
    FROM workouts w
    WHERE w.user_id IN (SELECT fid FROM friend_ids)
    ORDER BY w.user_id, w.completed_at DESC
  )
  SELECT
    fi.fid                                AS friend_id,
    p.name                                AS friend_name,
    p.avatar_url                          AS friend_avatar,
    (lw.completed_at >= today_start)      AS is_active,
    lw.id                                 AS workout_id,
    lw.name                               AS workout_name,
    lw.duration_seconds                   AS duration_seconds,
    lw.vol_kg                             AS volume_kg,
    lw.completed_at                       AS workout_at,
    lw.completed_at                       AS last_workout_at,
    lw.image_uri                          AS image_uri,
    lw.image_audience                     AS image_audience
  FROM friend_ids fi
  JOIN profiles p ON p.id = fi.fid
  LEFT JOIN latest_workouts lw ON lw.user_id = fi.fid;
END;
$$;
