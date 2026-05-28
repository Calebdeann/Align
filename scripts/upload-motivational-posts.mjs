#!/usr/bin/env node
// =============================================
// upload-motivational-posts.mjs
// =============================================
// Uploads all images from a local Quotes folder into the `motivational-posts`
// Supabase Storage bucket and indexes them in the `motivational_posts` table.
// Also uploads the It Girl logo as the brand avatar.
//
// Idempotent: skips storage uploads if the object already exists (409), and
// PostgREST inserts use `Prefer: resolution=ignore-duplicates` on the
// `storage_path` unique constraint.
//
// Usage:
//   npm run upload:motivational
//
// To add more images later: drop files into QUOTES_DIR and rerun. New files
// are appended with `display_order = (existing_max + 1..N)`.

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { readPngDimensions } from './lib/png-dims.mjs';

const SUPABASE_URL = 'https://dngpsabyqsuunajtotci.supabase.co';
const BUCKET = 'motivational-posts';
const QUOTES_DIR =
  '/Users/caoeh/pfp24.png/Downloads 1/Personal Content/Hub/Caleb/It Girl Main/Dev/Assets/Quotes';
const LOGO_PATH = path.resolve(import.meta.dirname, '..', 'assets', 'It Girl LOGO.png');
const LOGO_STORAGE_PATH = 'branding/itgirl-avatar.png';

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

const restHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function uploadStorageObject(filepath, storagePath, contentType) {
  const body = fs.readFileSync(filepath);
  // encodeURI keeps slash separators intact but percent-encodes any unsafe
  // characters (spaces, etc) in path segments.
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

async function getExistingDisplayOrders() {
  const url = `${SUPABASE_URL}/rest/v1/motivational_posts?select=display_order`;
  const res = await fetch(url, { headers: restHeaders });
  if (!res.ok) throw new Error(`Fetching existing display_orders failed: ${res.status}`);
  const rows = await res.json();
  return new Set(rows.map((r) => r.display_order));
}

async function insertRow(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/motivational_posts`, {
    method: 'POST',
    headers: {
      ...restHeaders,
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok && res.status !== 409) {
    const text = await res.text();
    throw new Error(`Insert failed (${res.status}): ${text}`);
  }
}

async function uploadLogo() {
  if (!fs.existsSync(LOGO_PATH)) {
    console.warn(`Logo missing at ${LOGO_PATH} — skipping`);
    return;
  }
  const result = await uploadStorageObject(LOGO_PATH, LOGO_STORAGE_PATH, 'image/png');
  console.log(`Logo: ${result} (${LOGO_STORAGE_PATH})`);
}

async function main() {
  if (!fs.existsSync(QUOTES_DIR)) {
    console.error(`Quotes dir not found: ${QUOTES_DIR}`);
    process.exit(1);
  }

  await uploadLogo();

  const files = fs
    .readdirSync(QUOTES_DIR)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort();
  console.log(`Found ${files.length} PNG files in ${QUOTES_DIR}`);

  // Idempotency: each file's display_order is determined by its alphabetical
  // index (1-based). Skip a slot if that display_order is already indexed.
  // This makes the script safe to re-run after partial failures and works
  // when new files are dropped in later (they sort into the same positions,
  // and any new ones append at the end).
  const existingDisplayOrders = await getExistingDisplayOrders();
  console.log(`Existing rows: ${existingDisplayOrders.size}.`);

  let uploaded = 0;
  let skipped = 0;
  let inserted = 0;

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const displayOrder = i + 1;

    if (existingDisplayOrders.has(displayOrder)) {
      skipped++;
      continue;
    }

    const filepath = path.join(QUOTES_DIR, filename);
    const { width, height } = readPngDimensions(filepath);
    const aspectRatio = height / width;

    // Safe, predictable storage paths — no spaces, no original-filename
    // dependence. The browser/SDK getPublicUrl will produce the same path.
    const storagePath = `quotes/${displayOrder}.png`;

    const storageResult = await uploadStorageObject(filepath, storagePath, 'image/png');
    if (storageResult === 'uploaded') uploaded++;

    await insertRow({
      storage_path: storagePath,
      aspect_ratio: Number(aspectRatio.toFixed(4)),
      display_order: displayOrder,
    });
    inserted++;

    if (inserted % 25 === 0) {
      console.log(`  ${inserted}/${files.length - existingDisplayOrders.size}...`);
    }
  }

  console.log('---');
  console.log(`Storage uploaded: ${uploaded}`);
  console.log(`Already indexed (skipped): ${skipped}`);
  console.log(`New DB rows inserted: ${inserted}`);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
