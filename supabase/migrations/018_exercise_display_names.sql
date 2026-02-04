-- Migration: Add display_name and keywords columns for better exercise search
-- display_name: Human-friendly name shown in UI (e.g., "Lat Pulldown" instead of "cable lat pulldown full range of motion")
-- keywords: Search aliases array (e.g., ["lat pulldown", "pull down", "cable pulldown"])

ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- GIN index on keywords array for fast @> (contains) and && (overlap) queries
CREATE INDEX IF NOT EXISTS idx_exercises_keywords ON exercises USING GIN (keywords);
