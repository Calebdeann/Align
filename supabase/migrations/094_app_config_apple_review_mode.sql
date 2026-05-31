-- =============================================
-- MIGRATION 094: apple_review_mode flag in app_config
-- =============================================
-- Apple's App Review reviewers were getting blocked by the onboarding
-- Superwall paywall (they cannot complete a real purchase). To let them
-- explore the rest of the app, this flag lets the pre-paywall screen route
-- a dismissed paywall into /(tabs) instead of stranding the user.
--
-- Default seed: TRUE while the current App Store submission is under
-- review. Flip to FALSE in the Supabase dashboard the moment Apple
-- approves the build to restore the hard paywall for normal users. No
-- rebuild required either way (pattern mirrors in_app_paywall_enabled
-- from migration 084).

INSERT INTO app_config (key, value)
VALUES ('apple_review_mode', to_jsonb(true))
ON CONFLICT (key) DO NOTHING;
