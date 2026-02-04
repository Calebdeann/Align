/**
 * Fix exercises with missing images by:
 * 1. Matching custom exercises against existing DB exercises that have GIFs
 * 2. Generating thumbnails for exercises that have GIFs but no thumbnail
 * 3. Uploading thumbnails to Supabase Storage and updating the DB
 *
 * Prerequisites:
 *   1. npm install sharp (for thumbnail generation)
 *   2. .env has EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/fix-missing-images.mjs --preview    (show matches, no changes)
 *   node scripts/fix-missing-images.mjs --apply      (apply all changes)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODE = process.argv.includes('--apply') ? 'apply' : 'preview';

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
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'exercise-thumbnails';
const THUMB_SIZE = 200;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ---------- Supabase helpers ----------

async function fetchAllExercises() {
  const all = [];
  let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/exercises?select=id,exercise_db_id,name,display_name,muscle_group,equipment,image_url,thumbnail_url&order=name&offset=${offset}&limit=1000`;
    const resp = await fetch(url, {
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
    });
    const data = await resp.json();
    all.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all;
}

async function updateExercise(id, updates) {
  const url = `${SUPABASE_URL}/rest/v1/exercises?id=eq.${id}`;
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(updates),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`PATCH failed for id=${id}: ${resp.status} ${text}`);
  }
}

async function uploadThumbnail(fileName, pngBuffer) {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
    body: pngBuffer,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Upload failed for ${fileName}: ${resp.status} ${text}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;
}

// ---------- DB-based matching ----------

// Hand-verified mappings: custom exercise name -> name of an existing DB exercise with a GIF.
// These are exercises where the movement is visually similar enough that the GIF is helpful.
// We searched the 1,632 exercises with images and picked the closest match for each.
const MANUAL_DB_MATCHES = {
  // --- Hip thrusts ---
  'barbell hip thrust':       'barbell glute bridge',
  'dumbbell hip thrust':      'barbell glute bridge',
  'machine hip thrust':       'lever hip extension v. 2',
  'smith machine hip thrust': 'barbell glute bridge',
  'single leg hip thrust':    'barbell glute bridge',
  'banded hip thrust':        'resistance band hip thrusts on knees',
  'b stance hip thrust':      'barbell glute bridge',
  'kas glute bridge':         'barbell glute bridge',

  // --- Glute isolation ---
  'fire hydrant':             'band bent-over hip extension',
  'clamshell':                'side lying hip adduction',
  'donkey kick':              'band bent-over hip extension',
  'frog pump':                'low glute bridge on floor',
  'ankle weight kickback':    'cable kickback',
  'glute kickback machine':   'cable standing hip extension',
  'hip abduction machine':    'lever seated hip abduction',
  'cable hip abduction':      'side hip abduction',

  // --- Legs ---
  'bulgarian split squat':    'dumbbell rear lunge',
  'curtsy lunge':             'dumbbell rear lunge',
  'nordic curl':              null, // Truly unique
  'box squat':                'barbell full squat (back pov)',
  'pendulum squat':           null, // No equivalent
  'belt squat':               null, // No equivalent

  // --- Back & shoulders ---
  'face pull':                'cable standing rear delt row (with rope)',
  'band face pull':           'band standing rear delt row',
  'band pull apart':          'band reverse fly',
  'landmine press':           'landmine 180',
  'meadows row':              'barbell one arm bent over row',
  'chest supported row':      'dumbbell incline row',
  'seal row':                 null, // Truly unique

  // --- Chest ---
  'cable fly':                'cable middle fly',
  'svend press':              null, // Unique plate squeeze press

  // --- Arms ---
  'bayesian curl':            'cable one arm curl',

  // --- Core ---
  'cable wood chop':          'cable twist',
  'hollow hold':              null, // Unique isometric
  'dragon flag':              null, // Unique movement
  'pallof press':             null, // Unique anti-rotation

  // --- Other ---
  'battle ropes':             null, // Unique movement
  'bird dog':                 null, // Unique movement
  'sled push':                null, // Unique movement
  'sled pull':                null, // Unique movement
};

function findMatchInDB(customName, allExercises) {
  const targetName = MANUAL_DB_MATCHES[customName];

  // null = explicitly no match
  if (targetName === null) return null;
  // undefined = not in manual list, skip
  if (targetName === undefined) return null;

  // Find the target exercise in our DB
  const match = allExercises.find(e =>
    e.name.toLowerCase() === targetName.toLowerCase() &&
    e.image_url
  );

  if (!match) {
    // Try partial match
    const lowerTarget = targetName.toLowerCase();
    const partial = allExercises.find(e =>
      e.name.toLowerCase().includes(lowerTarget) && e.image_url
    );
    return partial || null;
  }

  return match;
}

// ---------- Thumbnail generation ----------

async function generateThumbnail(gifUrl) {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    return null;
  }

  const res = await fetch(gifUrl);
  if (!res.ok) {
    throw new Error(`GIF download failed: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  const pngBuffer = await sharp(buffer, { animated: false, pages: 1 })
    .resize(THUMB_SIZE, THUMB_SIZE, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  return pngBuffer;
}

// ---------- Main ----------

console.log(`Mode: ${MODE}`);
console.log(`Supabase: ${SUPABASE_URL}\n`);

console.log('Fetching all exercises from Supabase...');
const exercises = await fetchAllExercises();
console.log(`Total exercises: ${exercises.length}\n`);

// Categorize
const withImages = exercises.filter(e => e.image_url);
const noImageUrl = exercises.filter(e => !e.image_url);
const noThumbnail = exercises.filter(e => e.image_url && !e.thumbnail_url);
const customNoImage = noImageUrl.filter(e => !e.exercise_db_id);

console.log(`Exercises with images: ${withImages.length}`);
console.log(`Missing image_url (custom): ${customNoImage.length}`);
console.log(`Have image_url but missing thumbnail_url: ${noThumbnail.length}`);
console.log('');

// ===== STEP 1: Match custom exercises to DB exercises =====
console.log('=== Step 1: Matching custom exercises to existing DB exercises ===\n');

const matches = [];
const noMatches = [];

for (const exercise of customNoImage) {
  const match = findMatchInDB(exercise.name, exercises);
  if (match) {
    console.log(`  MATCH: "${exercise.name}" -> "${match.name}" (${match.exercise_db_id})`);
    matches.push({ exercise, match });
  } else {
    console.log(`  NO MATCH: "${exercise.name}" -> placeholder`);
    noMatches.push(exercise);
  }
}

console.log(`\nMatched: ${matches.length}`);
console.log(`Placeholder: ${noMatches.length}\n`);

if (matches.length > 0) {
  console.log('--- Matches to apply ---');
  for (const { exercise, match } of matches) {
    console.log(`  ${exercise.name}`);
    console.log(`    -> ${match.name} (${match.exercise_db_id})`);
    console.log(`    GIF: ${match.image_url.substring(0, 70)}...`);
  }
  console.log('');
}

if (noMatches.length > 0) {
  console.log('--- Will remain as placeholder ---');
  for (const ex of noMatches) {
    console.log(`  ${ex.name} [${ex.muscle_group}]`);
  }
  console.log('');
}

// ===== STEP 2: Apply image_url updates =====
if (MODE === 'apply' && matches.length > 0) {
  console.log('=== Step 2: Updating image_url in Supabase ===\n');

  let updated = 0;
  let failed = 0;

  for (const { exercise, match } of matches) {
    try {
      // Copy image_url from the matched exercise. Also copy thumbnail_url if available.
      const updates = { image_url: match.image_url };
      if (match.thumbnail_url) {
        updates.thumbnail_url = match.thumbnail_url;
      }
      await updateExercise(exercise.id, updates);
      console.log(`  Updated: ${exercise.name}`);
      updated++;
    } catch (err) {
      console.error(`  FAILED: ${exercise.name} - ${err.message}`);
      failed++;
    }
  }

  console.log(`\nUpdated: ${updated}, Failed: ${failed}\n`);
} else if (MODE === 'preview') {
  console.log('(Preview mode. Use --apply to push changes.)\n');
}

// ===== STEP 3: Generate + upload thumbnails =====
// Exercises that have image_url but no thumbnail_url (including newly matched ones)
const needThumbnails = [...noThumbnail];
if (MODE === 'apply') {
  // After step 2, some matched exercises now have image_url but still no thumbnail
  for (const { exercise, match } of matches) {
    if (!match.thumbnail_url) {
      needThumbnails.push({
        ...exercise,
        image_url: match.image_url,
        exercise_db_id: match.exercise_db_id,
      });
    }
  }
}

// Filter to only those with exercise_db_id (needed for filename)
const thumbnailable = needThumbnails.filter(e => e.exercise_db_id && e.image_url);
const notThumbnailable = needThumbnails.filter(e => !e.exercise_db_id || !e.image_url);

if (thumbnailable.length > 0 && MODE === 'apply') {
  console.log(`=== Step 3: Generating thumbnails for ${thumbnailable.length} exercises ===\n`);

  let generated = 0;
  let thumbFailed = 0;

  for (const exercise of thumbnailable) {
    try {
      process.stdout.write(`  ${exercise.name} (${exercise.exercise_db_id})... `);
      const pngBuffer = await generateThumbnail(exercise.image_url);

      if (!pngBuffer) {
        console.log('SKIPPED (sharp not available)');
        break; // If sharp isn't available, none will work
      }

      const fileName = `${exercise.exercise_db_id}.png`;
      const publicUrl = await uploadThumbnail(fileName, pngBuffer);
      await updateExercise(exercise.id, { thumbnail_url: publicUrl });
      console.log('OK');
      generated++;
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      thumbFailed++;
    }

    await sleep(300);
  }

  console.log(`\nThumbnails generated + uploaded: ${generated}`);
  console.log(`Failed: ${thumbFailed}\n`);
} else if (thumbnailable.length > 0 && MODE === 'preview') {
  console.log(`=== Step 3: Would generate thumbnails for ${thumbnailable.length} exercises ===`);
  for (const ex of thumbnailable) {
    console.log(`  ${ex.name} (${ex.exercise_db_id})`);
  }
  console.log('');
}

if (notThumbnailable.length > 0) {
  console.log(`Note: ${notThumbnailable.length} exercise(s) need thumbnails but have no exercise_db_id:`);
  for (const ex of notThumbnailable) {
    console.log(`  ${ex.name} - image_url: ${ex.image_url ? 'yes' : 'no'}, db_id: ${ex.exercise_db_id || 'none'}`);
  }
  console.log('');
}

// ===== Summary =====
console.log('=== Summary ===');
console.log(`Custom exercises matched (will get images): ${matches.length}`);
console.log(`Remaining placeholder (no good match): ${noMatches.length}`);
console.log(`Exercises needing thumbnails: ${thumbnailable.length}`);
if (MODE === 'preview') {
  console.log('\nRun with --apply to push changes to Supabase.');
}
