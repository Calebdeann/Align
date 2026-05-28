-- Per-row scheduled accept time for friend requests sent to seed-buddy accounts.
-- NULL for normal user-to-user requests (no auto-accept).
ALTER TABLE friendships
  ADD COLUMN scheduled_accept_at TIMESTAMPTZ;

-- Partial index so the processor can find eligible rows cheaply.
CREATE INDEX idx_friendships_scheduled_accept
  ON friendships (scheduled_accept_at)
  WHERE status = 'pending' AND scheduled_accept_at IS NOT NULL;

-- SECURITY DEFINER processor: flips any pending requests the caller has sent
-- to seed buddies whose scheduled_accept_at has passed. Returns count of rows
-- updated. RLS-safe: the function only operates on rows where the caller is
-- the requester, so it cannot be used to forge accepts between other users.
CREATE OR REPLACE FUNCTION process_seed_buddy_accepts()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE friendships f
  SET status = 'accepted',
      updated_at = now()
  WHERE f.requester_id = auth.uid()
    AND f.status = 'pending'
    AND f.scheduled_accept_at IS NOT NULL
    AND f.scheduled_accept_at <= now()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = f.addressee_id
        AND p.traffic_source LIKE 'seed-buddy-%'
    );

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION process_seed_buddy_accepts() TO authenticated;
