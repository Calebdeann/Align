-- Returns random platform users the current user is not yet connected to.
-- SECURITY DEFINER bypasses RLS safely — only exposes public profile fields.
CREATE OR REPLACE FUNCTION get_suggested_users(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
  id         UUID,
  name       TEXT,
  avatar_url TEXT,
  bio        TEXT,
  traits     JSONB
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.avatar_url, p.bio, p.traits
  FROM profiles p
  WHERE p.id != p_user_id
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
