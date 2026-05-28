-- =============================================
-- MIGRATION 064: Filter friend Suggestions to It Girl-era accounts only
-- =============================================
-- Profiles created in the legacy Align/Snatched apps remain in the DB but
-- should NOT appear as suggested friends in It Girl. Apply the same hard
-- cutoff used by the Discover feed (migration 058): only profiles created
-- on or after 2026-05-21 00:00 UTC are surfaced.
--
-- We will add curated fake accounts later — they will be created post-cutoff
-- and so will pass through this filter automatically.

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
  -- Profiles created before this timestamp are legacy Align/Snatched accounts,
  -- hidden from It Girl friend suggestions.
  legacy_cutoff TIMESTAMPTZ := '2026-05-21 00:00:00+00';
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.avatar_url, p.bio, p.traits
  FROM profiles p
  WHERE p.id != p_user_id
    AND p.created_at >= legacy_cutoff
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
