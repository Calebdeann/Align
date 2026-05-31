-- =============================================
-- MIGRATION 093: Discover RPCs filter blocks + moderation status
-- =============================================
-- Apple Guideline 1.2: blocking instantly removes blocked-user content from
-- the blocker's feed, and rejected content must never appear in any public
-- surface. This migration extends every workout-bearing public RPC with
-- two filters:
--
--   1. moderation: w.moderation_status = 'visible'
--   2. mutual block (bidirectional):
--        NOT EXISTS (SELECT 1 FROM blocked_users b
--                    WHERE (b.blocker_id = <viewer> AND b.blocked_id = <other>)
--                       OR (b.blocker_id = <other>  AND b.blocked_id = <viewer>))
--
-- Bidirectional symmetry matters: if A blocks B, B should also stop seeing
-- A's content (otherwise B can keep harassing through context A no longer
-- sees). When <viewer> is NULL (anonymous), the EXISTS subquery has nothing
-- to match and the filter is a no-op.
--
-- Each function keeps its exact existing signature so client RPC calls
-- don't need updating. The body is a minimal diff against the last
-- redefinition (077 for get_public_workouts / get_public_workout_details,
-- 086 for get_public_workout_photos / get_friends_with_activity /
-- get_suggested_users).

-- ---------------------------------------------
-- 1. get_public_workouts — per-profile feed
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION get_public_workouts(p_viewer_id UUID, p_target_id UUID, p_limit INT DEFAULT 30)
RETURNS TABLE(id UUID, name TEXT, completed_at TIMESTAMPTZ, image_uri TEXT, duration_seconds INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_are_friends    BOOLEAN;
  v_cutoff         TIMESTAMPTZ;
  v_target_is_seed BOOLEAN;
  v_blocked        BOOLEAN;
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

  -- Mutual block check: short-circuit before the main query because the
  -- target / viewer pair is fixed at function entry.
  SELECT EXISTS (
    SELECT 1 FROM blocked_users b
    WHERE (b.blocker_id = p_viewer_id AND b.blocked_id = p_target_id)
       OR (b.blocker_id = p_target_id AND b.blocked_id = p_viewer_id)
  ) INTO v_blocked;

  IF v_blocked THEN
    RETURN;
  END IF;

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
      AND w.moderation_status = 'visible'
      AND (NOT v_target_is_seed OR w.completed_at <= v_cutoff)
    ORDER BY w.completed_at DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_workouts(UUID, UUID, INT) TO authenticated;

-- ---------------------------------------------
-- 2. get_public_workout_details — tap-to-view detail
-- ---------------------------------------------
-- Extended too: if a workout was rejected after a Discover card was already
-- cached on a client, tapping it must still return NULL.
CREATE OR REPLACE FUNCTION get_public_workout_details(p_workout_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_cutoff TIMESTAMPTZ;
  v_viewer UUID;
BEGIN
  SELECT COALESCE(NULLIF(value, '')::TIMESTAMPTZ, NOW()) INTO v_cutoff
  FROM app_config WHERE key = 'discover_visibility_cutoff_iso';
  v_cutoff := COALESCE(v_cutoff, NOW());

  v_viewer := auth.uid();

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
    AND w.moderation_status = 'visible'
    AND (NOT p.is_seed OR w.completed_at <= v_cutoff)
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users b
      WHERE (b.blocker_id = v_viewer AND b.blocked_id = w.user_id)
         OR (b.blocker_id = w.user_id AND b.blocked_id = v_viewer)
    );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_workout_details(UUID) TO authenticated;

-- ---------------------------------------------
-- 3. get_public_workout_photos — main Discover feed
-- ---------------------------------------------
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
  title_customized   BOOLEAN,
  user_is_verified   BOOLEAN
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
      COALESCE(w.title_customized, FALSE)  AS title_customized,
      p.is_verified                        AS user_is_verified
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
      AND w.moderation_status = 'visible'
      AND (NOT p.is_seed OR w.completed_at <= v_cutoff)
      AND (p_cursor IS NULL OR w.completed_at < p_cursor)
      AND NOT EXISTS (
        SELECT 1 FROM blocked_users b
        WHERE (b.blocker_id = v_viewer AND b.blocked_id = w.user_id)
           OR (b.blocker_id = w.user_id AND b.blocked_id = v_viewer)
      )
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
      COALESCE(w.title_customized, FALSE)  AS title_customized,
      p.is_verified                        AS user_is_verified
    FROM workouts w
    JOIN profiles p ON p.id = w.user_id
    WHERE w.image_audience = 'everyone'
      AND w.image_uri IS NOT NULL
      AND w.moderation_status = 'visible'
      AND (NOT p.is_seed OR w.completed_at <= v_cutoff)
      AND (p_cursor IS NULL OR w.completed_at < p_cursor)
      AND NOT EXISTS (
        SELECT 1 FROM blocked_users b
        WHERE (b.blocker_id = v_viewer AND b.blocked_id = w.user_id)
           OR (b.blocker_id = w.user_id AND b.blocked_id = v_viewer)
      )
    ORDER BY w.completed_at DESC
    LIMIT p_limit;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_workout_photos(INT, TIMESTAMPTZ, TEXT) TO authenticated;

-- ---------------------------------------------
-- 4. get_friends_with_activity — friends tab
-- ---------------------------------------------
-- Mutual blocks remove the friend entirely from the list (their latest
-- workout would be empty anyway, and showing a blocked friend's card with
-- a blanked-out photo would surface a name the blocker doesn't want to
-- see). The latest_workouts CTE additionally filters on moderation_status
-- so a rejected workout doesn't leak through the friend card.
CREATE OR REPLACE FUNCTION get_friends_with_activity(p_user_id UUID)
RETURNS TABLE (
  friend_id          UUID,
  friend_name        TEXT,
  friend_avatar      TEXT,
  is_active          BOOLEAN,
  workout_id         UUID,
  workout_name       TEXT,
  duration_seconds   INT,
  volume_kg          NUMERIC,
  workout_at         TIMESTAMPTZ,
  last_workout_at    TIMESTAMPTZ,
  image_uri          TEXT,
  image_audience     TEXT,
  friend_is_verified BOOLEAN
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
  unblocked_friend_ids AS (
    SELECT fi.fid
    FROM friend_ids fi
    WHERE NOT EXISTS (
      SELECT 1 FROM blocked_users b
      WHERE (b.blocker_id = p_user_id AND b.blocked_id = fi.fid)
         OR (b.blocker_id = fi.fid     AND b.blocked_id = p_user_id)
    )
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
        (SELECT SUM(ws.weight * ws.reps)
         FROM workout_exercises we2
         JOIN workout_sets ws ON ws.workout_exercise_id = we2.id
         WHERE we2.workout_id = w.id AND ws.completed = true),
        0
      ) AS vol_kg
    FROM workouts w
    WHERE w.user_id IN (SELECT fid FROM unblocked_friend_ids)
      AND w.completed_at <= NOW()
      AND w.moderation_status = 'visible'
    ORDER BY w.user_id, w.completed_at DESC
  )
  SELECT
    ufi.fid                               AS friend_id,
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
    lw.image_audience                     AS image_audience,
    p.is_verified                         AS friend_is_verified
  FROM unblocked_friend_ids ufi
  JOIN profiles p ON p.id = ufi.fid
  LEFT JOIN latest_workouts lw ON lw.user_id = ufi.fid;
END;
$$;

GRANT EXECUTE ON FUNCTION get_friends_with_activity(UUID) TO authenticated;

-- ---------------------------------------------
-- 5. get_suggested_users — friend suggestions
-- ---------------------------------------------
-- Excludes any profile the user has blocked AND any profile that has
-- blocked the user (so the abuser can't reappear as a suggestion).
CREATE OR REPLACE FUNCTION get_suggested_users(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
  id          UUID,
  name        TEXT,
  avatar_url  TEXT,
  bio         TEXT,
  traits      JSONB,
  is_verified BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  legacy_cutoff TIMESTAMPTZ := '2026-05-21 00:00:00+00';
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.avatar_url, p.bio, p.traits, p.is_verified
  FROM profiles p
  WHERE p.id != p_user_id
    AND p.created_at >= legacy_cutoff
    AND p.avatar_url IS NOT NULL
    AND p.avatar_url <> ''
    AND COALESCE(p.traffic_source, '') NOT LIKE 'seed-extra-%'
    AND p.id NOT IN (
      SELECT CASE
        WHEN requester_id = p_user_id THEN addressee_id
        ELSE requester_id
      END
      FROM friendships
      WHERE requester_id = p_user_id OR addressee_id = p_user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users b
      WHERE (b.blocker_id = p_user_id AND b.blocked_id = p.id)
         OR (b.blocker_id = p.id      AND b.blocked_id = p_user_id)
    )
  ORDER BY random()
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_suggested_users(UUID, INT) TO authenticated;
