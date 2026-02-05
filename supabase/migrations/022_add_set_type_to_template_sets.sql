-- Add set_type column to template_sets table
-- Allows templates to specify set types (warmup, normal, failure, dropset)
ALTER TABLE template_sets
ADD COLUMN IF NOT EXISTS set_type TEXT NOT NULL DEFAULT 'normal';
