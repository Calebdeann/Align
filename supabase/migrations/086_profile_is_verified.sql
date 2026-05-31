-- =============================================
-- MIGRATION 086: Verified-badge flag on profiles + RPC plumbing
-- =============================================
-- Today the gold "verified" badge (src/components/ui/VerifiedBadge.tsx) only
-- renders on Discover posts whose `isOfficial` flag is hardcoded by the
-- motivationalPosts client wrapper (synthetic "It Girl" account). There's no
-- way to mark a real user as verified.
--
-- This migration:
--   1. Adds `is_verified BOOLEAN` to profiles (default FALSE).
--   2. Sets TRUE for Caleb's account (signed up via Apple as
--      calebdean4916@gmail.com — email may live on auth.users.email OR in
--      raw_user_meta_data depending on Apple relay).
--   3. Sets TRUE for the synthetic It Girl UUID (no-op if not seeded into
--      profiles — kept here so the badge mechanism unifies once / if it is).
--   4. Extends the four name-bearing RPCs (get_public_profile,
--      get_friends_with_activity, get_public_workout_photos,
--      get_suggested_users) to return is_verified so every surface can render
--      the badge.

-- ---------------------------------------------
-- 1. Column + backfill
-- ---------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE profiles SET is_verified = TRUE
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email = 'calebdean4916@gmail.com'
     OR raw_user_meta_data->>'email' = 'calebdean4916@gmail.com'
);

UPDATE profiles SET is_verified = TRUE
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ---------------------------------------------
-- 2. get_public_profile — append is_verified
-- ---------------------------------------------
DROP FUNCTION IF EXISTS get_public_profile(UUID, UUID);

CREATE OR REPLACE FUNCTION get_public_profile(p_viewer_id UUID, p_target_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  traits JSONB,
  plan_id TEXT,
  created_at TIMESTAMPTZ,
  show_shells BOOLEAN,
  is_verified BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
    SELECT p.id, p.name, p.avatar_url, p.bio, p.traits, p.plan_id,
           p.created_at, p.show_shells, p.is_verified
    FROM profiles p
    WHERE p.id = p_target_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_profile(UUID, UUID) TO authenticated;

-- ---------------------------------------------
-- 3. get_friends_with_activity — append friend_is_verified
-- ---------------------------------------------
DROP FUNCTION IF EXISTS get_friends_with_activity(UUID);

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
    WHERE w.user_id IN (SELECT fid FROM friend_ids)
      AND w.completed_at <= NOW()
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
    lw.image_audience                     AS image_audience,
    p.is_verified                         AS friend_is_verified
  FROM friend_ids fi
  JOIN profiles p ON p.id = fi.fid
  LEFT JOIN latest_workouts lw ON lw.user_id = fi.fid;
END;
$$;

GRANT EXECUTE ON FUNCTION get_friends_with_activity(UUID) TO authenticated;

-- ---------------------------------------------
-- 4. get_public_workout_photos — append user_is_verified (both branches)
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
      COALESCE(w.title_customized, FALSE)  AS title_customized,
      p.is_verified                        AS user_is_verified
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
-- 5. get_suggested_users — append is_verified
-- ---------------------------------------------
DROP FUNCTION IF EXISTS get_suggested_users(UUID, INT);

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
  ORDER BY random()
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_suggested_users(UUID, INT) TO authenticated;
