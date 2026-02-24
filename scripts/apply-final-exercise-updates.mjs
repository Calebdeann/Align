#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://dngpsabyqsuunajtotci.supabase.co';
let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  try {
    const envFile = fs.readFileSync(path.resolve(import.meta.dirname, '..', '.env'), 'utf8');
    const match = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (match) SERVICE_KEY = match[1].trim();
  } catch {}
}

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env or as environment variable.');
  process.exit(1);
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

// Load the clean JSON
const dataPath = path.resolve(import.meta.dirname, '..', 'assets', 'exercise-updates-final.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const renames = data.renames.map(r => ({
  id: r.id,
  display_name: r.new_display.trim(),
}));

const binned = data.binned.map(b => b.id);

const isPreview = process.argv.includes('--preview');

if (isPreview) {
  console.log('=== PREVIEW MODE (no changes will be made) ===\n');
}

async function run() {
  // --- Renames ---
  console.log(`\nRenaming ${renames.length} exercises...`);

  if (isPreview) {
    renames.forEach(r => console.log(`  ${r.id} -> "${r.display_name}"`));
    console.log(`\n${renames.length} exercises would be renamed.\n`);
  } else {
    let renameSuccess = 0;
    let renameFailed = 0;

    for (const change of renames) {
      try {
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/exercises?id=eq.${change.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ display_name: change.display_name }),
        });
        if (resp.ok) {
          renameSuccess++;
        } else {
          renameFailed++;
          const text = await resp.text();
          console.log(`  FAIL ${change.display_name}: ${resp.status} ${text}`);
        }
      } catch (err) {
        renameFailed++;
        console.log(`  FAIL ${change.display_name}: ${err.message}`);
      }
    }
    console.log(`Renames: ${renameSuccess} updated, ${renameFailed} failed.\n`);
  }

  // --- Deletes ---
  console.log(`Deleting ${binned.length} binned exercises...`);
  const BATCH_SIZE = 20;

  if (isPreview) {
    binned.forEach(id => console.log(`  ${id}`));
    console.log(`\n${binned.length} exercises would be deleted.\n`);
  } else {
    let deleted = 0;
    let deleteFailed = 0;

    for (let i = 0; i < binned.length; i += BATCH_SIZE) {
      const batch = binned.slice(i, i + BATCH_SIZE);
      const ids = batch.map(id => `"${id}"`).join(',');
      try {
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/exercises?id=in.(${ids})`, {
          method: 'DELETE',
          headers,
        });
        if (resp.ok) {
          deleted += batch.length;
          console.log(`  Deleted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} exercises`);
        } else {
          deleteFailed += batch.length;
          const text = await resp.text();
          console.log(`  ERROR batch ${Math.floor(i / BATCH_SIZE) + 1}: ${resp.status} ${text}`);
        }
      } catch (err) {
        deleteFailed += batch.length;
        console.log(`  ERROR batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err.message}`);
      }
    }
    console.log(`\nDeletes: ${deleted} processed, ${deleteFailed} failed.`);
  }

  console.log('\nDone!');
}

run().catch(console.error);
