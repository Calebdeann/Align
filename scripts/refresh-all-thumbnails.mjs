/**
 * Refresh ALL exercise thumbnails from original ExerciseDB GIFs.
 *
 * Downloads each exercise GIF, extracts the first frame as a clean 200x200 PNG
 * (no background removal), uploads to Supabase Storage, and updates the DB.
 * This overwrites any previously degraded thumbnails.
 *
 * Prerequisites:
 *   1. npm install sharp (dev dependency)
 *   2. .env has EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/refresh-all-thumbnails.mjs                (preview - no changes)
 *   node scripts/refresh-all-thumbnails.mjs --apply        (refresh all thumbnails)
 *   node scripts/refresh-all-thumbnails.mjs --apply --batch-size 10
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
const BUCKET = 'exercise-thumbnails';
const THUMB_SIZE = 200;
const CACHE_BUSTER = `v=${Date.now()}`;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// ---------- CLI args ----------
const MODE = process.argv.includes('--apply') ? 'apply' : 'preview';
const batchArgIdx = process.argv.indexOf('--batch-size');
const BATCH_SIZE = batchArgIdx !== -1 ? parseInt(process.argv[batchArgIdx + 1], 10) : 5;

// ---------- Helpers ----------

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchAllExercises() {
  const all = [];
  let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/exercises?select=id,exercise_db_id,name,image_url,thumbnail_url&image_url=not.is.null&order=name&offset=${offset}&limit=1000`;
    const resp = await fetch(url, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    if (!resp.ok) {
      throw new Error(`Fetch exercises failed: ${resp.status} ${await resp.text()}`);
    }
    const data = await resp.json();
    all.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all;
}

async function extractThumbnail(gifUrl) {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    throw new Error('sharp is not installed. Run: npm install sharp');
  }

  const res = await fetch(gifUrl);
  if (!res.ok) {
    throw new Error(`GIF download failed: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  return sharp(buffer, { animated: false, pages: 1 })
    .resize(THUMB_SIZE, THUMB_SIZE, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function uploadThumbnail(fileName, pngBuffer) {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
    body: pngBuffer,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Upload failed for ${fileName}: ${resp.status} ${text}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}?${CACHE_BUSTER}`;
}

async function updateThumbnailUrl(exerciseId, thumbnailUrl) {
  const url = `${SUPABASE_URL}/rest/v1/exercises?id=eq.${exerciseId}`;
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ thumbnail_url: thumbnailUrl }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`DB update failed for ${exerciseId}: ${resp.status} ${text}`);
  }
}

async function processExercise(exercise) {
  const fileName = exercise.exercise_db_id
    ? `${exercise.exercise_db_id}.png`
    : `custom-${exercise.id}.png`;

  const pngBuffer = await extractThumbnail(exercise.image_url);
  const publicUrl = await uploadThumbnail(fileName, pngBuffer);
  await updateThumbnailUrl(exercise.id, publicUrl);

  return { name: exercise.name, fileName };
}

// ---------- Main ----------

console.log(`Mode: ${MODE}`);
console.log(`Supabase: ${SUPABASE_URL}`);
console.log(`Bucket: ${BUCKET}`);
console.log(`Thumbnail size: ${THUMB_SIZE}x${THUMB_SIZE}`);
console.log(`Batch size: ${BATCH_SIZE}`);
console.log(`Cache buster: ${CACHE_BUSTER}\n`);

console.log('Fetching exercises with image_url...');
const exercises = await fetchAllExercises();

const withThumbnail = exercises.filter((e) => e.thumbnail_url);
const withoutThumbnail = exercises.filter((e) => !e.thumbnail_url);

console.log(`Found ${exercises.length} exercises with image_url`);
console.log(`  - Currently have thumbnail_url: ${withThumbnail.length}`);
console.log(`  - Missing thumbnail_url: ${withoutThumbnail.length}`);
console.log(`  - All ${exercises.length} will be refreshed\n`);

if (MODE === 'preview') {
  console.log('Preview mode. No changes made.');
  console.log('Run with --apply to refresh all thumbnails.');
  process.exit(0);
}

// Apply mode
let processed = 0;
let failed = 0;
const failures = [];

for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
  const batch = exercises.slice(i, i + BATCH_SIZE);

  const results = await Promise.allSettled(
    batch.map((ex) => processExercise(ex))
  );

  for (let j = 0; j < results.length; j++) {
    const result = results[j];
    if (result.status === 'fulfilled') {
      processed++;
    } else {
      failed++;
      const name = batch[j].name;
      const msg = `${name}: ${result.reason.message}`;
      failures.push(msg);
      console.error(`  FAIL: ${msg}`);
    }
  }

  const total = Math.min(i + BATCH_SIZE, exercises.length);
  console.log(
    `Progress: ${total}/${exercises.length} (ok: ${processed}, failed: ${failed})`
  );

  // Small delay between batches to be gentle on the network
  if (i + BATCH_SIZE < exercises.length) {
    await sleep(200);
  }
}

console.log('\n=== Done ===');
console.log(`Processed: ${processed}`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
}
