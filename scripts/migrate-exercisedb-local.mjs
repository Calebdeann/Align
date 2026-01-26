/**
 * Migration script for ExerciseDB Premium (Local Dataset)
 *
 * This script will:
 * 1. Upload GIFs to Supabase Storage (360p quality for mobile)
 * 2. Seed the exercises table with the new data
 *
 * Usage:
 *   node scripts/migrate-exercisedb-local.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables:');
  console.error('  - EXPO_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Paths
const DATA_DIR = path.join(process.cwd(), 'data', 'exercisedb');
const JSON_PATH = path.join(DATA_DIR, 'exerciseData_complete.json');
const GIF_DIR = path.join(DATA_DIR, '360'); // Using 360p for mobile

// Supabase Storage bucket name
const BUCKET_NAME = 'exercise-gifs';

async function ensureBucketExists() {
  console.log('Checking storage bucket...');

  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET_NAME);

  if (!exists) {
    console.log(`Creating bucket: ${BUCKET_NAME}`);
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });
    if (error) {
      console.error('Failed to create bucket:', error.message);
      console.log('Please create the bucket manually in Supabase Dashboard');
      console.log('Settings: Name="exercise-gifs", Public=true');
      process.exit(1);
    }
  }
  console.log('Bucket ready.');
}

async function uploadGifs(exercises) {
  console.log('\nUploading GIFs to Supabase Storage...');
  console.log(`Source: ${GIF_DIR}`);

  const gifMap = new Map(); // id -> public URL
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const exercise of exercises) {
    const gifPath = path.join(GIF_DIR, `${exercise.id}.gif`);

    if (!fs.existsSync(gifPath)) {
      skipped++;
      continue;
    }

    const fileName = `${exercise.id}.gif`;

    // Check if already uploaded
    const { data: existing } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { search: fileName });

    if (existing && existing.length > 0) {
      // Already exists, get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);
      gifMap.set(exercise.id, urlData.publicUrl);
      skipped++;
      continue;
    }

    // Upload file
    const fileBuffer = fs.readFileSync(gifPath);
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: 'image/gif',
        upsert: true,
      });

    if (error) {
      console.error(`Failed to upload ${fileName}:`, error.message);
      failed++;
      continue;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    gifMap.set(exercise.id, urlData.publicUrl);
    uploaded++;

    // Progress
    if ((uploaded + skipped + failed) % 50 === 0) {
      process.stdout.write(`\rProgress: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);
    }
  }

  console.log(`\nGIF upload complete: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);
  return gifMap;
}

async function seedExercises(exercises, gifMap) {
  console.log('\nSeeding exercises to database...');

  // First, clear non-referenced exercises
  const { data: refs } = await supabase
    .from('workout_exercises')
    .select('exercise_id');
  const referencedIds = new Set((refs || []).map(r => r.exercise_id));

  const { data: existing } = await supabase.from('exercises').select('id');
  let deleted = 0;
  for (const ex of existing || []) {
    if (!referencedIds.has(ex.id)) {
      await supabase.from('exercises').delete().eq('id', ex.id);
      deleted++;
    }
  }
  console.log(`Cleared ${deleted} unreferenced exercises`);

  // Insert new exercises
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const exercise of exercises) {
    const gifUrl = gifMap.get(exercise.id) || null;

    const data = {
      name: exercise.name,
      muscle_group: exercise.target || exercise.bodyPart || 'Unknown',
      equipment: exercise.equipment ? [exercise.equipment] : [],
      image_url: gifUrl,
      exercise_db_id: exercise.id,
      target_muscles: exercise.target ? [exercise.target] : [],
      secondary_muscles: exercise.secondaryMuscles || [],
      body_parts: exercise.bodyPart ? [exercise.bodyPart] : [],
      instructions_array: exercise.instructions || [],
      exercise_type: exercise.category,
    };

    // Check if exists by exercise_db_id or name
    const { data: existingEx } = await supabase
      .from('exercises')
      .select('id')
      .or(`exercise_db_id.eq.${exercise.id},name.ilike.${exercise.name}`)
      .single();

    if (existingEx) {
      const { error } = await supabase
        .from('exercises')
        .update(data)
        .eq('id', existingEx.id);

      if (error) {
        failed++;
      } else {
        updated++;
      }
    } else {
      const { error } = await supabase
        .from('exercises')
        .insert(data);

      if (error) {
        if (error.code !== '23505') { // Not a duplicate
          console.error(`Failed to insert ${exercise.name}:`, error.message);
        }
        failed++;
      } else {
        inserted++;
      }
    }

    // Progress
    if ((inserted + updated + failed) % 50 === 0) {
      process.stdout.write(`\rProgress: ${inserted + updated + failed}/${exercises.length}`);
    }
  }

  console.log(`\n\nDatabase seeding complete:`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Failed: ${failed}`);
}

async function main() {
  console.log('='.repeat(50));
  console.log('ExerciseDB Local Migration');
  console.log('='.repeat(50));
  console.log('');

  // Check files exist
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`JSON not found: ${JSON_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(GIF_DIR)) {
    console.error(`GIF directory not found: ${GIF_DIR}`);
    process.exit(1);
  }

  // Load exercises
  console.log('Loading exercise data...');
  const exercises = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  console.log(`Found ${exercises.length} exercises`);

  // Ensure bucket exists
  await ensureBucketExists();

  // Upload GIFs
  const gifMap = await uploadGifs(exercises);

  // Seed database
  await seedExercises(exercises, gifMap);

  // Show final stats
  const { data: final } = await supabase.from('exercises').select('muscle_group');
  const counts = {};
  (final || []).forEach(e => {
    const muscle = e.muscle_group || 'Unknown';
    counts[muscle] = (counts[muscle] || 0) + 1;
  });

  console.log('\n' + '='.repeat(50));
  console.log('Final Distribution:');
  console.log('='.repeat(50));
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([muscle, count]) => console.log(`  ${muscle}: ${count}`));
  console.log(`\nTotal: ${final?.length || 0} exercises`);
}

main().catch(console.error);
