-- =============================================
-- MIGRATION 077: Suggested users must have an avatar
-- =============================================
-- The friend-suggestions panel was returning profiles with no avatar_url,
-- which surface as a flat colored placeholder. These accounts look like
-- empty shells next to real users and undermine the "this app is populated"
-- vibe. Filter them out at the source — anyone with no avatar simply
-- doesn't get suggested.

CREATE OR REPLACE FUNCTION get_suggested_users(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
  id         UUID,
  name       TEXT,
  avatar_url TEXT,
  bio        TEXT,
  traits     JSONB
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  legacy_cutoff TIMESTAMPTZ := '2026-05-21 00:00:00+00';
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.avatar_url, p.bio, p.traits
  FROM profiles p
  WHERE p.id != p_user_id
    AND p.created_at >= legacy_cutoff
    AND p.avatar_url IS NOT NULL
    AND p.avatar_url <> ''
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
