-- Friendships between users
CREATE TABLE friendships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

CREATE INDEX idx_friendships_req  ON friendships(requester_id);
CREATE INDEX idx_friendships_addr ON friendships(addressee_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "users create requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "parties update status"
  ON friendships FOR UPDATE
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

-- Pokes (nudge a friend to work out)
CREATE TABLE pokes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poker_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pokee_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seen       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pokes_pokee ON pokes(pokee_id, created_at DESC);

ALTER TABLE pokes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own pokes"
  ON pokes FOR SELECT
  USING (auth.uid() = poker_id OR auth.uid() = pokee_id);

CREATE POLICY "users create pokes"
  ON pokes FOR INSERT
  WITH CHECK (auth.uid() = poker_id);

CREATE POLICY "pokee marks seen"
  ON pokes FOR UPDATE
  USING (auth.uid() = pokee_id);

-- SECURITY DEFINER function: get accepted friends with their latest workout stats.
-- Bypasses RLS safely to expose only summary data (name, avatar, workout stats).
-- Called from the client via supabase.rpc('get_friends_with_activity', { p_user_id }).
CREATE OR REPLACE FUNCTION get_friends_with_activity(p_user_id UUID)
RETURNS TABLE (
  friend_id        UUID,
  friend_name      TEXT,
  friend_avatar    TEXT,
  is_active        BOOLEAN,
  workout_name     TEXT,
  duration_seconds INT,
  volume_kg        NUMERIC,
  workout_at       TIMESTAMPTZ,
  last_workout_at  TIMESTAMPTZ
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
      w.user_id,
      w.name,
      w.duration_seconds,
      w.completed_at,
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
    lw.name                               AS workout_name,
    lw.duration_seconds                   AS duration_seconds,
    lw.vol_kg                             AS volume_kg,
    lw.completed_at                       AS workout_at,
    lw.completed_at                       AS last_workout_at
  FROM friend_ids fi
  JOIN profiles p ON p.id = fi.fid
  LEFT JOIN latest_workouts lw ON lw.user_id = fi.fid;
END;
$$;
