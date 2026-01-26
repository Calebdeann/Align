-- =============================================
-- REFERRAL CODE SYSTEM
-- Each user gets a unique, immutable referral code.
-- Tracks who referred whom via the referrals table.
-- =============================================

-- 1. Add referral_code column to profiles (user's own code)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 2. Add referred_by column to profiles (who referred this user)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- 3. Create referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- 4. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- 5. Function to generate a random 6-char alphanumeric code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger function: auto-assign referral code on profile insert (with collision retry)
CREATE OR REPLACE FUNCTION assign_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  max_attempts INT := 10;
  attempt INT := 0;
BEGIN
  -- Only assign if referral_code is NULL (never overwrite existing codes)
  IF NEW.referral_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  LOOP
    attempt := attempt + 1;
    new_code := generate_referral_code();

    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = new_code) THEN
      NEW.referral_code := new_code;
      RETURN NEW;
    END IF;

    IF attempt >= max_attempts THEN
      -- Fallback: use first 8 chars of UUID (extremely unlikely to reach here)
      NEW.referral_code := upper(substr(replace(NEW.id::text, '-', ''), 1, 8));
      RETURN NEW;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger to auto-assign referral code on profile insert
DROP TRIGGER IF EXISTS trigger_assign_referral_code ON profiles;
CREATE TRIGGER trigger_assign_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_referral_code();

-- 8. Trigger function: prevent referral_code from being changed once set
CREATE OR REPLACE FUNCTION prevent_referral_code_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.referral_code IS NOT NULL AND NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
    RAISE EXCEPTION 'referral_code cannot be changed once assigned';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_referral_code_change ON profiles;
CREATE TRIGGER trigger_prevent_referral_code_change
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_referral_code_change();

-- 9. Backfill existing profiles that don't have a code yet
DO $$
DECLARE
  profile_record RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR profile_record IN SELECT id FROM profiles WHERE referral_code IS NULL LOOP
    LOOP
      new_code := generate_referral_code();
      SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;
      IF NOT code_exists THEN
        UPDATE profiles SET referral_code = new_code WHERE id = profile_record.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 10. SECURITY DEFINER function to validate a referral code
-- Bypasses RLS so any authenticated user can look up a code without reading other profiles
CREATE OR REPLACE FUNCTION validate_referral_code(code TEXT)
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE referral_code = upper(code) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- RLS POLICIES FOR REFERRALS TABLE
-- =============================================

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view referrals they made" ON referrals;
DROP POLICY IF EXISTS "Users can view their own referral" ON referrals;
DROP POLICY IF EXISTS "Users can insert referrals for themselves" ON referrals;

CREATE POLICY "Users can view referrals they made"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view their own referral"
  ON referrals FOR SELECT
  USING (auth.uid() = referred_id);

CREATE POLICY "Users can insert referrals for themselves"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_id);
