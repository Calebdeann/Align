-- =============================================
-- MIGRATION 060: User blocking
-- =============================================
-- Lets a user block another user. Stored as a directed edge so block-state is
-- one-way (A blocks B doesn't imply B blocks A). RLS limits read/write to the
-- blocker's own rows.

CREATE TABLE IF NOT EXISTS blocked_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT blocked_users_unique UNIQUE (blocker_id, blocked_id),
  CONSTRAINT blocked_users_no_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS blocked_users_blocker_idx ON blocked_users (blocker_id);
CREATE INDEX IF NOT EXISTS blocked_users_blocked_idx ON blocked_users (blocked_id);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own blocks" ON blocked_users;
CREATE POLICY "Users can read own blocks"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can insert own blocks" ON blocked_users;
CREATE POLICY "Users can insert own blocks"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can delete own blocks" ON blocked_users;
CREATE POLICY "Users can delete own blocks"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);
