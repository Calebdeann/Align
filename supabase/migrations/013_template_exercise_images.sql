-- Add image URL columns to template_exercises so thumbnails persist after sync
ALTER TABLE template_exercises ADD COLUMN IF NOT EXISTS gif_url TEXT;
ALTER TABLE template_exercises ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
