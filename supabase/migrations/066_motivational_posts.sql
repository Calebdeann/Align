-- =============================================
-- MIGRATION 066: Motivational ("It Girl" official) posts in the discover feed
-- =============================================
-- Adds a brand-owned content stream that's interleaved into the Pinterest-style
-- discover feed. Each row points to an image in the `motivational-posts`
-- storage bucket; the client fetches "the next N for this user" via the RPC
-- below, which produces a deterministic per-user permutation so each user
-- cycles through ALL images before any repeat, then reshuffles on the next
-- cycle.

-- ---------------------------------------------
-- Table
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS motivational_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,
  aspect_ratio NUMERIC NOT NULL,
  caption TEXT,
  display_order INT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE motivational_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS motivational_posts_read ON motivational_posts;
CREATE POLICY motivational_posts_read ON motivational_posts
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------
-- Storage bucket (public read, service-role-only write)
-- ---------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('motivational-posts', 'motivational-posts', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public read access for motivational posts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'motivational-posts');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- No INSERT/UPDATE/DELETE policies for anon or authenticated — only the
-- service role (used by the upload script) can write.

-- ---------------------------------------------
-- RPC: next official posts for this viewer
-- ---------------------------------------------
-- Returns up to p_count rows starting at position p_offset in this viewer's
-- deterministic permutation of motivational_posts. The permutation seed is
-- (viewer_id, cycle_index), so once a viewer has consumed all rows in one
-- cycle, the next cycle uses a different shuffle.
--
-- Cross-cycle boundary handling: if (p_offset % total) + p_count exceeds the
-- total count, this call returns only the remaining rows of the current cycle.
-- The client tops up with a second call at p_offset += returned_count.
CREATE OR REPLACE FUNCTION get_next_official_posts(
  p_viewer_id UUID,
  p_count INT,
  p_offset INT
)
RETURNS TABLE(
  id UUID,
  storage_path TEXT,
  aspect_ratio NUMERIC,
  caption TEXT,
  display_order INT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total INT;
  v_cycle INT;
  v_pos_in_cycle INT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM motivational_posts;
  IF v_total = 0 OR p_count <= 0 THEN RETURN; END IF;

  v_cycle := p_offset / v_total;
  v_pos_in_cycle := p_offset % v_total;

  RETURN QUERY
    WITH permuted AS (
      SELECT
        m.id,
        m.storage_path,
        m.aspect_ratio,
        m.caption,
        m.display_order,
        ROW_NUMBER() OVER (
          ORDER BY md5(p_viewer_id::text || v_cycle::text || m.display_order::text)
        ) - 1 AS pos
      FROM motivational_posts m
    )
    SELECT permuted.id, permuted.storage_path, permuted.aspect_ratio, permuted.caption, permuted.display_order
    FROM permuted
    WHERE permuted.pos >= v_pos_in_cycle
      AND permuted.pos < LEAST(v_pos_in_cycle + p_count, v_total)
    ORDER BY permuted.pos;
END;
$$;

GRANT EXECUTE ON FUNCTION get_next_official_posts(UUID, INT, INT) TO authenticated;
