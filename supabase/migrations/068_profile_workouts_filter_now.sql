-- =============================================
-- MIGRATION 068: Gate the per-profile workouts RPC on completed_at <= NOW()
-- =============================================
-- Migration 067 fixed the discover-feed RPC but missed `get_public_workouts`,
-- which the public profile screen uses to list a user's completed workouts.
-- Without this filter, tapping a fake account's avatar reveals every drip-
-- seeded workout (including the ~155 future-dated ones), which breaks the
-- "this person just did this workout today" illusion.
--
-- Adds `AND w.completed_at <= NOW()` to mirror migration 067.

CREATE OR REPLACE FUNCTION get_public_workouts(p_viewer_id UUID, p_target_id UUID, p_limit INT DEFAULT 30)
RETURNS TABLE(id UUID, name TEXT, completed_at TIMESTAMPTZ, image_uri TEXT, duration_seconds INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_are_friends BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
      AND ((requester_id = p_viewer_id AND addressee_id = p_target_id)
        OR (requester_id = p_target_id AND addressee_id = p_viewer_id))
  ) INTO v_are_friends;

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
      AND w.completed_at <= NOW()
    ORDER BY w.completed_at DESC
    LIMIT p_limit;
END;
$$;
