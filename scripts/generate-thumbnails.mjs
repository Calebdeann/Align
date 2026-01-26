/**
 * Generate static PNG thumbnails from GIFs
 * Extracts the first frame and creates small, optimized thumbnails
 *
 * Usage: node scripts/generate-thumbnails.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Paths
const GIF_DIR = path.join(process.cwd(), 'data', 'exercisedb', '180'); // Use 180p for smallest source
const THUMB_DIR = path.join(process.cwd(), 'data', 'exercisedb', 'thumbnails');
const BUCKET_NAME = 'exercise-gifs';

// Check if ImageMagick is installed
function checkDependencies() {
  try {
    execSync('which convert', { stdio: 'ignore' });
    return true;
  } catch {
    console.error('ImageMagick is required. Install with: brew install imagemagick');
    return false;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('Thumbnail Generator');
  console.log('='.repeat(50));
  console.log('');

  if (!checkDependencies()) {
    process.exit(1);
  }

  // Create thumbnails directory
  if (!fs.existsSync(THUMB_DIR)) {
    fs.mkdirSync(THUMB_DIR, { recursive: true });
  }

  // Get list of GIFs
  const gifFiles = fs.readdirSync(GIF_DIR).filter(f => f.endsWith('.gif'));
  console.log(`Found ${gifFiles.length} GIFs to process`);

  // Generate thumbnails
  console.log('\nGenerating thumbnails...');
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const gifFile of gifFiles) {
    const gifPath = path.join(GIF_DIR, gifFile);
    const thumbFile = gifFile.replace('.gif', '.jpg');
    const thumbPath = path.join(THUMB_DIR, thumbFile);

    // Skip if already exists
    if (fs.existsSync(thumbPath)) {
      skipped++;
      continue;
    }

    try {
      // Extract first frame and resize to 88x88 (2x for retina)
      // Using JPEG for smallest file size
      execSync(
        `convert "${gifPath}[0]" -resize 88x88 -quality 80 "${thumbPath}"`,
        { stdio: 'ignore' }
      );
      generated++;
    } catch (err) {
      failed++;
    }

    if ((generated + skipped + failed) % 100 === 0) {
      process.stdout.write(`\rProgress: ${generated} generated, ${skipped} skipped, ${failed} failed`);
    }
  }

  console.log(`\n\nThumbnail generation complete:`);
  console.log(`  Generated: ${generated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed: ${failed}`);

  // Upload thumbnails to Supabase
  console.log('\nUploading thumbnails to Supabase Storage...');
  const thumbFiles = fs.readdirSync(THUMB_DIR).filter(f => f.endsWith('.jpg'));

  let uploaded = 0;
  let uploadSkipped = 0;
  let uploadFailed = 0;

  for (const thumbFile of thumbFiles) {
    const thumbPath = path.join(THUMB_DIR, thumbFile);
    const storagePath = `thumbnails/${thumbFile}`;

    // Check if already exists
    const { data: existing } = await supabase.storage
      .from(BUCKET_NAME)
      .list('thumbnails', { search: thumbFile });

    if (existing && existing.length > 0) {
      uploadSkipped++;
      continue;
    }

    const fileBuffer = fs.readFileSync(thumbPath);
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      uploadFailed++;
    } else {
      uploaded++;
    }

    if ((uploaded + uploadSkipped + uploadFailed) % 50 === 0) {
      process.stdout.write(`\rUpload progress: ${uploaded} uploaded, ${uploadSkipped} skipped, ${uploadFailed} failed`);
    }
  }

  console.log(`\n\nThumbnail upload complete:`);
  console.log(`  Uploaded: ${uploaded}`);
  console.log(`  Skipped: ${uploadSkipped}`);
  console.log(`  Failed: ${uploadFailed}`);

  // Update database with thumbnail URLs
  console.log('\nUpdating database with thumbnail URLs...');

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, exercise_db_id');

  let dbUpdated = 0;
  for (const exercise of exercises || []) {
    if (!exercise.exercise_db_id) continue;

    const thumbUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/thumbnails/${exercise.exercise_db_id}.jpg`;

    const { error } = await supabase
      .from('exercises')
      .update({ thumbnail_url: thumbUrl })
      .eq('id', exercise.id);

    if (!error) dbUpdated++;

    if (dbUpdated % 100 === 0) {
      process.stdout.write(`\rDatabase updates: ${dbUpdated}`);
    }
  }

  console.log(`\n\nDatabase updated: ${dbUpdated} exercises`);
  console.log('\nDone!');
}

main().catch(console.error);
