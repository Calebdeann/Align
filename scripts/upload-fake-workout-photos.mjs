#!/usr/bin/env node
// =============================================
// upload-fake-workout-photos.mjs
// =============================================
// Uploads the buddy + extras workout photo folder structure to Supabase
// Storage and writes a manifest mapping each photo to the buddy it belongs
// to (or to the shared "extra" pool).
//
// Source folder layout:
//   <root>/<BuddyName>/*.png   (one folder per of the 19 buddies)
//   <root>/Random : Extra/*.png (shared pool for pastel-avatar extras)
//
// Storage target:
//   workout-photos/seed/buddy/<buddyId>/<sequentialIndex>.png
//   workout-photos/seed/extra/<sequentialIndex>.png
//
// Manifest output: scripts/seed-data/workout-photos.json
//
// Idempotent: HTTP 409 on existing storage object = skip.
//
// Usage:
//   npm run seed:photos

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { readPngDimensions } from './lib/png-dims.mjs';

const SUPABASE_URL = 'https://dngpsabyqsuunajtotci.supabase.co';
const BUCKET = 'workout-photos';
const SOURCE_ROOT =
  '/Users/caoeh/pfp24.png/Downloads 1/Personal Content/Hub/Caleb/It Girl Main/Dev/Assets/Girl Workout Images';
const MANIFEST_OUT = path.resolve(import.meta.dirname, 'seed-data', 'workout-photos.json');

// Maps the buddy folder name (as it appears on disk) → buddy id from
// src/data/gymBuddies.ts. Folder names are trimmed before lookup so trailing
// spaces on disk ("Remi ") still resolve.
const BUDDY_FOLDER_TO_ID = {
  Emma: 1,
  Tilly: 2,
  Rachel: 3,
  Priya: 4,
  Sarah: 6,
  Bec: 7,
  Mila: 8,
  Hannah: 9,
  Aaliyah: 10,
  Lauren: 11,
  Sofia: 12,
  Jess: 13,
  Liv: 14,
  Cazz: 15,
  Tay: 16,
  Mei: 17,
  Donna: 18,
  Ruby: 19,
  Remi: 20,
};

const EXTRA_FOLDER = 'Random : Extra';

let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  try {
    const envFile = fs.readFileSync(path.resolve(import.meta.dirname, '..', '.env'), 'utf8');
    const match = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (match) SERVICE_KEY = match[1].trim();
  } catch {}
}
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env or env var.');
  process.exit(1);
}

async function uploadStorageObject(filepath, storagePath, contentType) {
  const body = fs.readFileSync(filepath);
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(storagePath)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'false',
    },
    body,
  });
  if (res.status === 200 || res.status === 201) return 'uploaded';
  if (res.status === 409) return 'skipped';
  const text = await res.text();
  throw new Error(`Upload failed (${res.status}): ${text}`);
}

function publicUrl(storagePath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURI(storagePath)}`;
}

function listPngs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort();
}

async function main() {
  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(`Source folder not found: ${SOURCE_ROOT}`);
    process.exit(1);
  }

  const manifest = [];
  let uploaded = 0;
  let skipped = 0;

  // Buddy folders.
  for (const folderName of fs.readdirSync(SOURCE_ROOT)) {
    const trimmed = folderName.trim();
    const buddyId = BUDDY_FOLDER_TO_ID[trimmed];
    if (buddyId == null) continue;
    const folderPath = path.join(SOURCE_ROOT, folderName);
    if (!fs.statSync(folderPath).isDirectory()) continue;
    const files = listPngs(folderPath);
    console.log(`${trimmed} (buddy ${buddyId}): ${files.length} photos`);
    for (let i = 0; i < files.length; i++) {
      const localPath = path.join(folderPath, files[i]);
      const { width, height } = readPngDimensions(localPath);
      const storagePath = `seed/buddy/${buddyId}/${i + 1}.png`;
      const result = await uploadStorageObject(localPath, storagePath, 'image/png');
      if (result === 'uploaded') uploaded++; else skipped++;
      manifest.push({
        kind: 'buddy',
        buddyId,
        buddyFolder: trimmed,
        index: i + 1,
        storagePath,
        publicUrl: publicUrl(storagePath),
        aspectRatio: Number((height / width).toFixed(4)),
      });
    }
  }

  // Extras folder.
  const extraFolderPath = path.join(SOURCE_ROOT, EXTRA_FOLDER);
  if (fs.existsSync(extraFolderPath) && fs.statSync(extraFolderPath).isDirectory()) {
    const files = listPngs(extraFolderPath);
    console.log(`Extras: ${files.length} photos`);
    for (let i = 0; i < files.length; i++) {
      const localPath = path.join(extraFolderPath, files[i]);
      const { width, height } = readPngDimensions(localPath);
      const storagePath = `seed/extra/${i + 1}.png`;
      const result = await uploadStorageObject(localPath, storagePath, 'image/png');
      if (result === 'uploaded') uploaded++; else skipped++;
      manifest.push({
        kind: 'extra',
        index: i + 1,
        storagePath,
        publicUrl: publicUrl(storagePath),
        aspectRatio: Number((height / width).toFixed(4)),
      });
    }
  } else {
    console.warn(`Extras folder not found at: ${extraFolderPath}`);
  }

  fs.mkdirSync(path.dirname(MANIFEST_OUT), { recursive: true });
  fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));

  console.log('---');
  console.log(`Total photos: ${manifest.length}`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Skipped (already present): ${skipped}`);
  console.log(`Manifest: ${MANIFEST_OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
