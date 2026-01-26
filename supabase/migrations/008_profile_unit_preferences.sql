-- =============================================
-- PROFILE UNIT PREFERENCES
-- Adds unit preference columns to the profiles table
-- =============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS distance_unit TEXT DEFAULT 'kilometers' CHECK (distance_unit IN ('kilometers', 'miles'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS measurement_unit TEXT DEFAULT 'cm' CHECK (measurement_unit IN ('cm', 'in'));
