/**
 * Import missing exercises from ExerciseDB premium dataset into Supabase.
 *
 * Reads exerciseData_complete.json, finds exercises not yet in the DB
 * (by exercise_db_id), uploads their GIFs to Supabase Storage, and
 * inserts the exercise rows.
 *
 * Prerequisites:
 *   1. .env has EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   2. Supabase storage bucket "exercise-gifs" exists and is public
 *
 * Usage:
 *   node scripts/import-missing-exercises.mjs
 *   node scripts/import-missing-exercises.mjs --dry-run    (preview only, no changes)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

// ---------- .env ----------
const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const GIF_BUCKET = 'exercise-gifs';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// ---------- Paths ----------
const JSON_PATH = resolve(
  '/Users/caoeh/pfp24.png/Downloads 1/Personal Content/Hub/Caleb/Align/Exercise API/cross-platform/exerciseData_complete.json'
);
const GIF_DIR = resolve(
  '/Users/caoeh/pfp24.png/Downloads 1/Personal Content/Hub/Caleb/Align/Exercise API/cross-platform/360'
);

// ---------- Helpers ----------

// Map ExerciseDB target muscle to our muscle_group values
function mapMuscleGroup(target) {
  const map = {
    abs: 'abs',
    abductors: 'glutes',
    adductors: 'glutes',
    biceps: 'biceps',
    calves: 'calves',
    'cardiovascular system': 'cardio',
    delts: 'shoulders',
    forearms: 'forearms',
    glutes: 'glutes',
    hamstrings: 'hamstrings',
    lats: 'lats',
    'levator scapulae': 'traps',
    pectorals: 'chest',
    quads: 'quads',
    'serratus anterior': 'chest',
    spine: 'lower back',
    traps: 'traps',
    triceps: 'triceps',
    'upper back': 'upper back',
  };
  return map[target] || target;
}

// Map equipment strings to our simplified set
function mapEquipment(equip) {
  const e = (equip || 'body weight').toLowerCase();
  const map = {
    assisted: 'assisted',
    'assisted (towel)': 'assisted',
    band: 'bands',
    barbell: 'barbell',
    'body weight': 'body weight',
    'body weight (with resistance band)': 'bands',
    'bosu ball': 'exercise ball',
    cable: 'cable',
    dumbbell: 'dumbbell',
    'dumbbell (used as handles for deeper range)': 'dumbbell',
    'dumbbell, exercise ball': 'dumbbell',
    'dumbbell, exercise ball, tennis ball': 'dumbbell',
    'elliptical machine': 'machine',
    'ez barbell': 'barbell',
    'ez barbell, exercise ball': 'barbell',
    hammer: 'dumbbell',
    kettlebell: 'kettlebell',
    'leverage machine': 'machine',
    'medicine ball': 'medicine ball',
    'olympic barbell': 'barbell',
    'resistance band': 'bands',
    roller: 'foam roller',
    rope: 'cable',
    'skierg machine': 'machine',
    'sled machine': 'machine',
    'smith machine': 'smith machine',
    'stability ball': 'exercise ball',
    'stationary bike': 'machine',
    'stepmill machine': 'machine',
    tire: 'body weight',
    'trap bar': 'barbell',
    'upper body ergometer': 'machine',
    weighted: 'body weight',
    'wheel roller': 'ab wheel',
  };
  return map[e] || e;
}

// Clean exercise name: strip (male)/(female) tags, fix caps
function cleanName(name) {
  let cleaned = name.replace(/\s*\((male|female)\)/gi, '').trim();
  return cleaned;
}

// Fetch existing exercise_db_ids from Supabase
async function getExistingIds() {
  const url = `${SUPABASE_URL}/rest/v1/exercises?select=exercise_db_id&exercise_db_id=not.is.null`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch existing exercises: ${res.status}`);
  const data = await res.json();
  return new Set(data.map((e) => e.exercise_db_id));
}

// Upload GIF to Supabase Storage
async function uploadGif(exerciseId) {
  const gifPath = resolve(GIF_DIR, `${exerciseId}.gif`);
  if (!existsSync(gifPath)) return null;

  const fileData = readFileSync(gifPath);
  const fileName = `${exerciseId}.gif`;
  const url = `${SUPABASE_URL}/storage/v1/object/${GIF_BUCKET}/${fileName}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'image/gif',
      'x-upsert': 'true',
    },
    body: fileData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GIF upload failed for ${exerciseId}: ${res.status} ${text}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${GIF_BUCKET}/${fileName}`;
}

// Insert exercise into Supabase
async function insertExercise(exercise, imageUrl) {
  const row = {
    name: cleanName(exercise.name),
    muscle_group: mapMuscleGroup(exercise.target),
    equipment: [mapEquipment(exercise.equipment)],
    image_url: imageUrl,
    exercise_db_id: exercise.id,
    target_muscles: exercise.target ? [exercise.target] : [],
    secondary_muscles: exercise.secondaryMuscles || [],
    body_parts: exercise.bodyPart ? [exercise.bodyPart] : [],
    instructions_array: exercise.instructions || [],
    exercise_type: exercise.category || null,
  };

  const url = `${SUPABASE_URL}/rest/v1/exercises`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Insert failed for "${exercise.name}": ${res.status} ${text}`);
  }
}

// ---------- Main ----------

console.log(DRY_RUN ? '=== DRY RUN (no changes) ===' : '=== IMPORTING MISSING EXERCISES ===');
console.log(`JSON: ${JSON_PATH}`);
console.log(`GIFs: ${GIF_DIR}`);
console.log(`Supabase: ${SUPABASE_URL}\n`);

// Load premium dataset
const allExercises = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));
console.log(`Premium dataset: ${allExercises.length} exercises`);

// Get existing exercise_db_ids from Supabase
const existingIds = await getExistingIds();
console.log(`Already in DB: ${existingIds.size} exercises`);

// Find missing exercises (exclude male variants)
const missing = allExercises.filter(
  (e) => !existingIds.has(e.id) && !e.name.toLowerCase().includes('(male)')
);
console.log(`Missing (non-male): ${missing.length} exercises\n`);

if (DRY_RUN) {
  console.log('Would import:');
  for (const e of missing) {
    const gifExists = existsSync(resolve(GIF_DIR, `${e.id}.gif`));
    console.log(`  ${e.id}: ${cleanName(e.name)} [${e.target}] ${gifExists ? 'GIF OK' : 'NO GIF'}`);
  }
  console.log(`\nTotal: ${missing.length} exercises`);
  console.log(`With GIFs: ${missing.filter((e) => existsSync(resolve(GIF_DIR, `${e.id}.gif`))).length}`);
  console.log(`Without GIFs: ${missing.filter((e) => !existsSync(resolve(GIF_DIR, `${e.id}.gif`))).length}`);
  process.exit(0);
}

// Import missing exercises
const BATCH_SIZE = 5;
let imported = 0;
let skippedNoGif = 0;
let failed = 0;
const failures = [];

for (let i = 0; i < missing.length; i += BATCH_SIZE) {
  const batch = missing.slice(i, i + BATCH_SIZE);

  const results = await Promise.allSettled(
    batch.map(async (exercise) => {
      // Upload GIF first
      const imageUrl = await uploadGif(exercise.id);
      if (!imageUrl) {
        skippedNoGif++;
        return { status: 'skipped', name: exercise.name };
      }

      // Insert exercise row
      await insertExercise(exercise, imageUrl);
      imported++;
      return { status: 'ok', name: exercise.name };
    })
  );

  for (const result of results) {
    if (result.status === 'rejected') {
      failed++;
      failures.push(result.reason.message);
      console.error(`  FAIL: ${result.reason.message}`);
    }
  }

  const total = Math.min(i + BATCH_SIZE, missing.length);
  process.stdout.write(
    `\rProgress: ${total}/${missing.length} (imported: ${imported}, skipped: ${skippedNoGif}, failed: ${failed})`
  );
}

console.log('\n\n=== Done ===');
console.log(`Imported: ${imported}`);
console.log(`Skipped (no GIF): ${skippedNoGif}`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach((f) => console.log(`  - ${f}`));
}

console.log('\nNext steps:');
console.log('  1. Run: node scripts/regenerate-thumbnails.mjs   (generate thumbnails for new exercises)');
console.log('  2. Run rembg on data/thumbs-hires/ to remove backgrounds');
console.log('  3. Run: node scripts/upload-thumbnails-nobg.mjs  (upload thumbnails)');
