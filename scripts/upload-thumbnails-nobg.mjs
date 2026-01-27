/**
 * Upload background-removed exercise thumbnails to Supabase Storage
 *
 * Prerequisites:
 *   1. Run the SQL from supabase/migrations/012_exercise_thumbnails_bucket.sql
 *      in the Supabase SQL Editor to create the storage bucket + policies
 *   2. Ensure .env has SUPABASE_SERVICE_ROLE_KEY set
 *
 * Usage: node scripts/upload-thumbnails-nobg.mjs
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

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
const BUCKET = 'exercise-thumbnails';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const thumbsDir = resolve(__dirname, '..', 'data', 'thumbs-nobg');
const files = readdirSync(thumbsDir).filter((f) => f.endsWith('.png')).sort();

console.log(`Found ${files.length} thumbnails to upload`);
console.log(`Bucket: ${BUCKET}`);
console.log(`Supabase: ${SUPABASE_URL}\n`);

// Upload a single file to Supabase Storage
async function uploadFile(filePath, fileName) {
  const fileData = readFileSync(filePath);
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
    body: fileData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed for ${fileName}: ${res.status} ${text}`);
  }

  return res.json();
}

// Update thumbnail_url in exercises table for a given exercise_db_id
async function updateThumbnailUrl(exerciseDbId, thumbnailUrl) {
  const url = `${SUPABASE_URL}/rest/v1/exercises?exercise_db_id=eq.${exerciseDbId}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ thumbnail_url: thumbnailUrl }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DB update failed for ${exerciseDbId}: ${res.status} ${text}`);
  }
}

// Process files in batches
const BATCH_SIZE = 10;
let uploaded = 0;
let updated = 0;
let failed = 0;
const failures = [];

for (let i = 0; i < files.length; i += BATCH_SIZE) {
  const batch = files.slice(i, i + BATCH_SIZE);

  const results = await Promise.allSettled(
    batch.map(async (file) => {
      const filePath = resolve(thumbsDir, file);
      const exerciseDbId = basename(file, extname(file)); // "0001" from "0001.png"

      // Upload to storage
      await uploadFile(filePath, file);
      uploaded++;

      // Update database row
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${file}`;
      await updateThumbnailUrl(exerciseDbId, publicUrl);
      updated++;
    })
  );

  for (const result of results) {
    if (result.status === 'rejected') {
      failed++;
      failures.push(result.reason.message);
      console.error(`  FAIL: ${result.reason.message}`);
    }
  }

  const total = Math.min(i + BATCH_SIZE, files.length);
  console.log(`Progress: ${total}/${files.length} (uploaded: ${uploaded}, db updated: ${updated}, failed: ${failed})`);
}

console.log('\n=== Done ===');
console.log(`Uploaded: ${uploaded}`);
console.log(`DB updated: ${updated}`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach((f) => console.log(`  - ${f}`));
}
