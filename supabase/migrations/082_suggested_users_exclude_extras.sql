-- =============================================
-- MIGRATION 082: Friend suggestions exclude seed-extra (pastel-pfp) accounts
-- =============================================
-- Seed-extras are the 8 pastel-color filler accounts (Avery, Madison, Quinn,
-- Skylar, Charlie, Reese, Harper, Sloane) created by seed-fake-accounts.mjs.
-- They exist solely to populate the Discover feed with anonymous-feeling
-- posts — they're not meant to be people you'd friend.
--
-- Before this migration, they passed the suggestions filter because they have
-- valid avatar_url values (pastel PNGs generated via sharp). Worse, when the
-- user did send a request to one, the auto-accept chain only fires for
-- traffic_source LIKE 'seed-buddy-%' (see migration 076), so requests to
-- extras would stay pending forever.
--
-- Fix: filter them out at the source by excluding any profile whose
-- traffic_source starts with 'seed-extra-'. Seed-buddies and real users
-- remain unaffected.

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
