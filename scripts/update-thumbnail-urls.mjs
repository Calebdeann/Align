/**
 * Update exercises table with thumbnail URLs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'exercise-gifs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updateThumbnailUrls() {
  console.log('Updating database with thumbnail URLs...');

  const { data: exercises, error: fetchError } = await supabase
    .from('exercises')
    .select('id, exercise_db_id');

  if (fetchError) {
    console.error('Error fetching exercises:', fetchError);
    return;
  }

  console.log(`Found ${exercises?.length || 0} exercises`);

  let updated = 0;
  let skipped = 0;

  for (const exercise of exercises || []) {
    if (!exercise.exercise_db_id) {
      skipped++;
      continue;
    }

    const thumbUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/thumbnails/${exercise.exercise_db_id}.jpg`;

    const { error } = await supabase
      .from('exercises')
      .update({ thumbnail_url: thumbUrl })
      .eq('id', exercise.id);

    if (!error) updated++;

    if (updated % 100 === 0) {
      process.stdout.write(`\rUpdated: ${updated}`);
    }
  }

  console.log(`\n\nDatabase update complete:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (no exercise_db_id): ${skipped}`);
}

updateThumbnailUrls();
