-- =============================================
-- MIGRATION 090: Moderation primitives (Phase 1 of Apple UGC compliance)
-- =============================================
-- Apple Guideline 1.2 rejection requires:
--   - A way to flag objectionable content (reports table)
--   - A 24-hour admin response loop (status / resolver columns)
--   - Admin gating that scales beyond a hardcoded UUID (admin_emails table)
--
-- The existing `blocked_users` table (migration 065) is reused as-is for block
-- handling. This file does NOT define a duplicate. Phase 3's blockUser API
-- writes there, and migration 093 teaches the discover RPCs to filter against
-- it bidirectionally.

-- ---------------------------------------------
-- 1. admin_emails — gating list for moderation tooling
-- ---------------------------------------------
-- No RLS policies defined: only the service-role key can read/write.
-- Authenticated clients hit admin_emails indirectly through the is_admin()
-- SECURITY DEFINER function below, so direct access is unnecessary.
-- Pattern matches app_config (migration 084) which is locked the same way.

CREATE TABLE IF NOT EXISTS admin_emails (
  email      TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

INSERT INTO admin_emails (email)
VALUES ('calebdean4916@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------
-- 2. is_admin(uid) — boolean check used by RLS on reports
-- ---------------------------------------------
-- SECURITY DEFINER so the caller doesn't need direct read access to
-- auth.users or admin_emails. Falls back to FALSE for NULL / unknown ids.
-- Apple OAuth (Sign in with Apple) may store the email on auth.users.email
-- OR in raw_user_meta_data->>'email' depending on Apple's relay; check both.

CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_match BOOLEAN;
BEGIN
  IF uid IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN admin_emails ae
      ON ae.email = u.email
      OR ae.email = u.raw_user_meta_data->>'email'
    WHERE u.id = uid
  ) INTO v_match;

  RETURN COALESCE(v_match, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;

-- ---------------------------------------------
-- 3. reports — user-submitted moderation flags
-- ---------------------------------------------
-- target_type: 'workout' | 'profile' | 'photo'.
-- target_id is intentionally a plain UUID (no FK) because the rows it points
-- to may be removed by moderation action, and we want the report record to
-- outlive removal for audit. status default 'open' so newest reports are
-- naturally surfaced to the admin queue.

CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type  TEXT NOT NULL CHECK (target_type IN ('workout','profile','photo')),
  target_id    UUID NOT NULL,
  reason       TEXT NOT NULL,
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','resolved','dismissed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ,
  resolver_id  UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS reports_status_created_idx
  ON reports (status, created_at DESC) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS reports_target_idx
  ON reports (target_type, target_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can file a report, but only for themselves.
DROP POLICY IF EXISTS "reports_insert_self" ON reports;
CREATE POLICY "reports_insert_self"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Only admins can read the queue. Non-admin reporters never see their own
-- submissions back — by design, so users can't tell whether their report
-- moved the needle (Apple's spec wants action, not transparency).
DROP POLICY IF EXISTS "reports_select_admin" ON reports;
CREATE POLICY "reports_select_admin"
  ON reports FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Only admins can resolve / dismiss reports.
DROP POLICY IF EXISTS "reports_update_admin" ON reports;
CREATE POLICY "reports_update_admin"
  ON reports FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
