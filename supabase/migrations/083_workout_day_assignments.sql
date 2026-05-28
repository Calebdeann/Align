-- =============================================
-- MIGRATION 083: Per-user workout day → program-day assignment override
-- =============================================
-- Today the planner seeder walks the user's chosen weekdays in calendar order
-- and assigns the next program day positionally. That makes it impossible for
-- a user to say "I want Pilates on Tuesday, not Monday" without changing
-- their plan entirely.
--
-- This column stores an explicit mapping from weekday name to a 1-indexed
-- program day number (matching ProgramDay.dayNumber). The new Workout
-- Schedule screen writes here; the seeder reads from here when present and
-- falls back to positional assignment when NULL.
--
-- Example: { "Monday": 2, "Tuesday": 1, "Thursday": 4 }
--   → On Mondays seed program.days[dayNumber=2]
--   → On Tuesdays seed program.days[dayNumber=1]
--   → On Thursdays seed program.days[dayNumber=4]
--
-- NULL = no override, use today's positional behavior. Fully backwards-
-- compatible: existing users see no change until they save on the new screen.

ALTER TABLE profiles
  ADD COLUMN workout_day_assignments JSONB;
