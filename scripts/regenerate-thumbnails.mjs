/**
 * Regenerate exercise thumbnails at higher resolution (200x200)
 *
 * Downloads GIFs from ExerciseDB, extracts the first frame,
 * and resizes to 200x200 PNG for crisp Retina display.
 *
 * Prerequisites:
 *   1. npm install sharp (dev dependency)
 *   2. .env has EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: node scripts/regenerate-thumbnails.mjs
 *
 * After running this script:
 *   1. Run rembg on data/thumbs-hires/ to remove backgrounds
 *   2. Run: node scripts/upload-thumbnails-nobg.mjs --dir data/thumbs-hires-nobg
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env
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
const OUTPUT_SIZE = 200;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const outputDir = resolve(__dirname, '..', 'data', 'thumbs-hires');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Fetch all exercises with their image URLs from Supabase
async function fetchExercises() {
  const url = `${SUPABASE_URL}/rest/v1/exercises?select=exercise_db_id,image_url&exercise_db_id=not.is.null&image_url=not.is.null&order=exercise_db_id`;

  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Range: '0-1999', // Override default 1000-row limit
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch exercises: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

// Download a GIF and extract first frame at target size
async function processExercise(exerciseDbId, gifUrl) {
  const outputPath = resolve(outputDir, `${exerciseDbId}.png`);

  // Skip if already processed
  if (existsSync(outputPath)) {
    return { status: 'skipped', exerciseDbId };
  }

  // Download the GIF
  const res = await fetch(gifUrl);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  // Extract first frame, resize to 200x200, save as PNG
  await sharp(buffer, { animated: false, pages: 1 })
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(outputPath);

  return { status: 'ok', exerciseDbId };
}

// Main
console.log(`Output directory: ${outputDir}`);
console.log(`Target size: ${OUTPUT_SIZE}x${OUTPUT_SIZE}\n`);

const exercises = await fetchExercises();
console.log(`Found ${exercises.length} exercises with image URLs\n`);

const BATCH_SIZE = 5;
let processed = 0;
let skipped = 0;
let failed = 0;
const failures = [];

for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
  const batch = exercises.slice(i, i + BATCH_SIZE);

  const results = await Promise.allSettled(
    batch.map(async (ex) => processExercise(ex.exercise_db_id, ex.image_url))
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      if (result.value.status === 'skipped') {
        skipped++;
      } else {
        processed++;
      }
    } else {
      failed++;
      failures.push(result.reason.message);
      console.error(`  FAIL: ${result.reason.message}`);
    }
  }

  const total = Math.min(i + BATCH_SIZE, exercises.length);
  console.log(`Progress: ${total}/${exercises.length} (new: ${processed}, skipped: ${skipped}, failed: ${failed})`);
}

console.log('\n=== Done ===');
console.log(`Processed: ${processed}`);
console.log(`Skipped (already exist): ${skipped}`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach((f) => console.log(`  - ${f}`));
}

console.log(`\nNext steps:`);
console.log(`  1. Run rembg on ${outputDir} to remove backgrounds`);
console.log(`  2. Upload with: node scripts/upload-thumbnails-nobg.mjs`);
