-- Migration: Duplicate "21s Bicep Curl" as "Bicep Curl (Barbell)"
-- Copies core exercise data from the 21s Bicep Curl entry but with a new name.
-- Both exercises will appear in the exercise library.

INSERT INTO exercises (
  id,
  name,
  display_name,
  muscle_group,
  equipment,
  image_url,
  thumbnail_url,
  keywords,
  popularity
)
SELECT
  gen_random_uuid(),
  'bicep curl barbell',
  'Bicep Curl (Barbell)',
  muscle_group,
  equipment,
  image_url,
  thumbnail_url,
  ARRAY['bicep curl', 'barbell curl', 'bb curl', 'biceps curl', 'standing curl', 'barbell bicep curl'],
  COALESCE(popularity, 0)
FROM exercises
WHERE display_name = '21s Bicep Curl'
   OR (display_name IS NULL AND name ILIKE '%21s%bicep%curl%')
LIMIT 1;
