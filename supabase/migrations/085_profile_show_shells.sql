-- Add a per-user toggle controlling whether the shell-letter row appears under
-- the user's name on their profile (and on their public profile when others view it).
-- Default ON so existing users keep the current behavior.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_shells BOOLEAN NOT NULL DEFAULT TRUE;

-- Extend get_public_profile to expose show_shells so the public profile screen
-- can hide shells when the target user has the toggle off.
-- DROP first because we're changing the RETURNS TABLE signature.
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
  show_shells BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
    SELECT p.id, p.name, p.avatar_url, p.bio, p.traits, p.plan_id, p.created_at, p.show_shells
    FROM profiles p
    WHERE p.id = p_target_id;
END;
$$;
