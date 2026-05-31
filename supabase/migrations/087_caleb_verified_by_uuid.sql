-- =============================================
-- MIGRATION 087: Set is_verified TRUE for Caleb's profile (UUID-keyed)
-- =============================================
-- Migration 086 tried to flip is_verified for Caleb by matching
-- auth.users.email = 'calebdean4916@gmail.com'. That matched zero rows on
-- production because his Apple Sign-In uses "Hide My Email" — auth.users.email
-- is the relay address `wkqkrsqwy9@privaterelay.appleid.com`, not his real
-- Apple-ID email.
--
-- His actual row was identified by name ('Caleb') + the matching apple-relay
-- email pattern. Targeting it by UUID is the only reliable approach for any
-- Hide-My-Email user.

UPDATE profiles
SET is_verified = TRUE
WHERE id = '51ae73e5-28a6-43a0-8af2-8ae612e35fe1';
