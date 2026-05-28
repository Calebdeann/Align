-- Add a per-exercise default note that the active-workout / template-builder
-- shows as the notes placeholder. When the user types over it the value
-- replaces the placeholder; clearing the field restores it.
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS default_note TEXT;
