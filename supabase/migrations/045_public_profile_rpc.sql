-- Returns limited public profile fields for any user (bypasses RLS safely).
-- Viewer must be authenticated; only non-sensitive fields are exposed.
CREATE OR REPLACE FUNCTION get_public_profile(p_viewer_id UUID, p_target_id UUID)
RETURNS TABLE(id UUID, name TEXT, avatar_url TEXT, bio TEXT, traits JSONB, plan_id TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
    SELECT p.id, p.name, p.avatar_url, p.bio, p.traits, p.plan_id, p.created_at
    FROM profiles p
    WHERE p.id = p_target_id;
END;
$$;

-- Returns completed workouts for a target user.
-- Photo is hidden (image_uri = NULL) when audience restricts and viewer is not a friend.
-- The workout card itself (name, date) always shows regardless of photo visibility.
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
    ORDER BY w.completed_at DESC
    LIMIT p_limit;
END;
$$;
