-- Add image columns to workouts table (matching workout_templates pattern)
-- image_type: 'template' (bundled asset), 'camera' (device photo), 'gallery' (device library)
-- image_uri: Device URI for camera/gallery images
-- image_template_id: Lookup ID for bundled template images

ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS image_type TEXT
  CHECK (image_type IS NULL OR image_type IN ('template', 'camera', 'gallery'));

ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS image_uri TEXT;

ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS image_template_id TEXT;
