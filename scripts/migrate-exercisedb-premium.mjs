/**
 * Migration script for ExerciseDB Premium Dataset
 *
 * This script will:
 * 1. Read the downloaded JSON dataset
 * 2. Upload GIFs to Supabase Storage (optional - can use their CDN)
 * 3. Seed the exercises table with new data (female animations only)
 *
 * Usage:
 *   node scripts/migrate-exercisedb-premium.mjs <path-to-json-file>
 *
 * Example:
 *   node scripts/migrate-exercisedb-premium.mjs ~/Downloads/exercisedb/exercises.json
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

// Configuration
const USE_FEMALE_ONLY = true; // Only import female exercise animations
const BATCH_SIZE = 100;

async function main() {
  const jsonPath = process.argv[2];

  if (!jsonPath) {
    console.log('Usage: node scripts/migrate-exercisedb-premium.mjs <path-to-json-file>');
    console.log('');
    console.log('First, examine your downloaded data structure:');
    console.log('  - Look for a JSON file in your download');
    console.log('  - Check if GIFs are separate files or URLs in the JSON');
    console.log('');
    console.log('Common structures:');
    console.log('  exercises.json - Single file with all data');
    console.log('  data/ folder - May contain JSON + GIF folders');
    process.exit(1);
  }

  // Check if path exists
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }

  // Check if it's a directory or file
  const stats = fs.statSync(jsonPath);

  if (stats.isDirectory()) {
    console.log('Directory detected. Looking for JSON files...');
    const files = fs.readdirSync(jsonPath);
    console.log('Files found:', files.slice(0, 20));
    console.log('');
    console.log('Please run again with the specific JSON file path.');
    process.exit(0);
  }

  console.log('='.repeat(50));
  console.log('ExerciseDB Premium Migration');
  console.log('='.repeat(50));
  console.log('');

  // Read and parse JSON
  console.log(`Reading: ${jsonPath}`);
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  let exercises;

  try {
    exercises = JSON.parse(rawData);
  } catch (err) {
    console.error('Failed to parse JSON:', err.message);
    process.exit(1);
  }

  // Handle different data structures
  if (exercises.data) {
    exercises = exercises.data;
  }
  if (!Array.isArray(exercises)) {
    console.log('Data structure:', Object.keys(exercises));
    console.error('Expected an array of exercises');
    process.exit(1);
  }

  console.log(`Found ${exercises.length} exercises`);
  console.log('');

  // Show sample exercise structure
  console.log('Sample exercise structure:');
  console.log(JSON.stringify(exercises[0], null, 2).substring(0, 1000));
  console.log('');

  // Filter to female exercise animations only (this is a women's workout tracker)
  let filteredExercises = exercises;
  if (USE_FEMALE_ONLY) {
    filteredExercises = exercises.filter(e =>
      e.gender === 'female' ||
      e.gender === 'Female' ||
      !e.gender // Include if no gender specified
    );
    console.log(`Filtered to ${filteredExercises.length} female exercises`);
  }

  // Check for duplicates by name
  const nameMap = new Map();
  filteredExercises.forEach(e => {
    const name = e.name?.toLowerCase();
    if (name && !nameMap.has(name)) {
      nameMap.set(name, e);
    }
  });
  const uniqueExercises = Array.from(nameMap.values());
  console.log(`Unique exercises by name: ${uniqueExercises.length}`);
  console.log('');

  // Confirm before proceeding
  console.log('This will:');
  console.log(`  1. Clear existing exercises (that aren't referenced)`);
  console.log(`  2. Insert ${uniqueExercises.length} new exercises`);
  console.log('');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Clear non-referenced exercises
  console.log('Clearing unreferenced exercises...');
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
  console.log(`Deleted ${deleted} unreferenced exercises`);

  // Insert new exercises in batches
  console.log('Inserting new exercises...');
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < uniqueExercises.length; i += BATCH_SIZE) {
    const batch = uniqueExercises.slice(i, i + BATCH_SIZE);

    const records = batch.map(e => ({
      name: e.name,
      muscle_group: e.targetMuscles?.[0] || e.target || e.muscle || 'Unknown',
      equipment: Array.isArray(e.equipments) ? e.equipments :
                 Array.isArray(e.equipment) ? e.equipment :
                 e.equipment ? [e.equipment] : [],
      image_url: e.gifUrl || e.imageUrl || e.gif_url || e.image_url,
      exercise_db_id: e.exerciseId || e.id,
      gender: e.gender || 'female',
      video_url: e.videoUrl || e.video_url,
      gif_url_male: null, // Unused - women's tracker only
      gif_url_female: e.gifUrl || e.imageUrl,
      target_muscles: e.targetMuscles || (e.target ? [e.target] : []),
      secondary_muscles: e.secondaryMuscles || [],
      body_parts: e.bodyParts || (e.bodyPart ? [e.bodyPart] : []),
      instructions_array: e.instructions || [],
      exercise_type: e.exerciseType || e.type,
      keywords: e.keywords || [],
    }));

    const { error } = await supabase.from('exercises').insert(records);

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, error.message);
      failed += batch.length;
    } else {
      inserted += batch.length;
    }

    // Progress indicator
    process.stdout.write(`\rProgress: ${inserted + failed}/${uniqueExercises.length}`);
  }

  console.log('');
  console.log('');
  console.log('='.repeat(50));
  console.log('Migration Complete!');
  console.log('='.repeat(50));
  console.log(`Inserted: ${inserted}`);
  console.log(`Failed: ${failed}`);

  // Show distribution
  const { data: final } = await supabase.from('exercises').select('muscle_group');
  const counts = {};
  (final || []).forEach(e => {
    counts[e.muscle_group] = (counts[e.muscle_group] || 0) + 1;
  });

  console.log('');
  console.log('Distribution by muscle group:');
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([muscle, count]) => console.log(`  ${muscle}: ${count}`));
  console.log(`Total: ${final?.length || 0}`);
}

main().catch(console.error);
