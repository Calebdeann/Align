/**
 * Remove duplicate exercises from the database.
 *
 * Finds exercises that share the same exercise_db_id (meaning they were
 * imported twice) and removes the lesser copy. Also removes exercises
 * with "male" in the name (Rule #7: women's app only).
 *
 * Usage:
 *   node scripts/remove-duplicate-exercises.mjs --preview   # Show what would be removed
 *   node scripts/remove-duplicate-exercises.mjs --apply      # Actually remove duplicates
 */

import fs from 'fs';
import path from 'path';

// ---------- Config ----------
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dngpsabyqsuunajtotci.supabase.co';
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

const mode = process.argv[2];
if (!mode || !['--preview', '--apply'].includes(mode)) {
  console.error('Usage: node scripts/remove-duplicate-exercises.mjs [--preview | --apply]');
  process.exit(1);
}

const DRY_RUN = mode === '--preview';

// ---------- Helpers ----------
const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

async function supabaseGet(table, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`GET ${table} failed: ${resp.status} ${await resp.text()}`);
  return resp.json();
}

async function supabaseDelete(table, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const resp = await fetch(url, { method: 'DELETE', headers });
  if (!resp.ok) throw new Error(`DELETE ${table} failed: ${resp.status} ${await resp.text()}`);
}

async function supabasePatch(table, query, body) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const resp = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
  if (!resp.ok) throw new Error(`PATCH ${table} failed: ${resp.status} ${await resp.text()}`);
}

// ---------- Fetch all exercises ----------
async function fetchAllExercises() {
  const all = [];
  const batchSize = 1000;
  let offset = 0;

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/exercises?select=id,exercise_db_id,name,display_name,muscle_group,equipment,image_url,thumbnail_url,keywords,popularity&order=name&offset=${offset}&limit=${batchSize}`;
    const resp = await fetch(url, { headers });
    if (!resp.ok) throw new Error(`Fetch exercises failed: ${resp.status} ${await resp.text()}`);
    const data = await resp.json();
    all.push(...data);
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  return all;
}

// ---------- Score an exercise row to determine which to keep ----------
// Higher score = more data = keep this one
function dataScore(ex) {
  let score = 0;
  if (ex.display_name) score += 100;
  if (ex.keywords && ex.keywords.length > 0) score += 50;
  if (ex.popularity) score += 25;
  if (ex.thumbnail_url) score += 10;
  if (ex.image_url) score += 5;
  return score;
}

// ---------- Check for references to an exercise ID ----------
async function getReferenceCounts(exerciseId) {
  const [workoutExercises, templateExercises, userPrefs] = await Promise.all([
    supabaseGet('workout_exercises', `exercise_id=eq.${exerciseId}&select=id&limit=1`),
    supabaseGet('template_exercises', `exercise_id=eq.${exerciseId}&select=id&limit=1`),
    supabaseGet('user_exercise_preferences', `exercise_id=eq.${exerciseId}&select=exercise_id&limit=1`),
  ]);
  return {
    workoutExercises: workoutExercises.length,
    templateExercises: templateExercises.length,
    userPrefs: userPrefs.length,
    total: workoutExercises.length + templateExercises.length + userPrefs.length,
  };
}

// ---------- Update references from old ID to new ID ----------
async function updateReferences(oldId, newId) {
  await Promise.all([
    supabasePatch('workout_exercises', `exercise_id=eq.${oldId}`, { exercise_id: newId }),
    supabasePatch('template_exercises', `exercise_id=eq.${oldId}`, { exercise_id: newId }),
    supabasePatch('user_exercise_preferences', `exercise_id=eq.${oldId}`, { exercise_id: newId }),
  ]);
}

// ---------- Main ----------
async function main() {
  console.log(`Mode: ${DRY_RUN ? 'PREVIEW (no changes)' : 'APPLY (will modify DB)'}\n`);

  const exercises = await fetchAllExercises();
  console.log(`Total exercises in DB: ${exercises.length}\n`);

  // --- Find duplicates (same exercise_db_id) ---
  const byDbId = new Map();
  for (const ex of exercises) {
    if (!ex.exercise_db_id) continue;
    if (!byDbId.has(ex.exercise_db_id)) {
      byDbId.set(ex.exercise_db_id, []);
    }
    byDbId.get(ex.exercise_db_id).push(ex);
  }

  const duplicates = [...byDbId.entries()].filter(([, group]) => group.length > 1);
  console.log(`Duplicate exercise_db_ids: ${duplicates.length}\n`);

  let removedCount = 0;
  let referencesUpdated = 0;

  for (const [dbId, group] of duplicates) {
    // Sort by data score descending - keep the one with most data
    group.sort((a, b) => dataScore(b) - dataScore(a));
    const keep = group[0];
    const toRemove = group.slice(1);

    for (const remove of toRemove) {
      const keepScore = dataScore(keep);
      const removeScore = dataScore(remove);

      console.log(`  exercise_db_id ${dbId}:`);
      console.log(`    KEEP:   "${keep.name}" (score=${keepScore}, id=${keep.id})`);
      console.log(`    REMOVE: "${remove.name}" (score=${removeScore}, id=${remove.id})`);

      if (!DRY_RUN) {
        // Check for references before deleting
        const refs = await getReferenceCounts(remove.id);
        if (refs.total > 0) {
          console.log(`    → Updating ${refs.total} reference(s) to point to kept row...`);
          await updateReferences(remove.id, keep.id);
          referencesUpdated += refs.total;
        }
        await supabaseDelete('exercises', `id=eq.${remove.id}`);
        console.log(`    → Deleted`);
      }
      removedCount++;
    }
  }

  // --- Find male-gendered exercises ---
  console.log(`\n--- Male-gendered exercises (Rule #7) ---`);
  const maleExercises = exercises.filter(ex =>
    /\bmale\b/i.test(ex.name) && !/\bfemale\b/i.test(ex.name)
  );

  console.log(`Found: ${maleExercises.length}\n`);

  for (const ex of maleExercises) {
    console.log(`  REMOVE: "${ex.name}" (db_id=${ex.exercise_db_id}, id=${ex.id})`);

    if (!DRY_RUN) {
      const refs = await getReferenceCounts(ex.id);
      if (refs.total > 0) {
        // Try to find the female equivalent
        const femaleEquiv = exercises.find(e =>
          e.id !== ex.id &&
          e.name.replace(/\bmale\b/i, 'female').toLowerCase() === ex.name.replace(/\bmale\b/i, 'female').toLowerCase()
        );
        if (femaleEquiv) {
          console.log(`    → Updating ${refs.total} reference(s) to female equivalent: "${femaleEquiv.name}"`);
          await updateReferences(ex.id, femaleEquiv.id);
        } else {
          console.log(`    → WARNING: ${refs.total} reference(s) exist but no female equivalent found. Skipping.`);
          continue;
        }
        referencesUpdated += refs.total;
      }
      await supabaseDelete('exercises', `id=eq.${ex.id}`);
      console.log(`    → Deleted`);
    }
    removedCount++;
  }

  // --- Summary ---
  console.log(`\n=== Summary ===`);
  console.log(`Duplicate exercises to remove: ${duplicates.reduce((sum, [, g]) => sum + g.length - 1, 0)}`);
  console.log(`Male-gendered exercises to remove: ${maleExercises.length}`);
  console.log(`Total exercises to remove: ${removedCount}`);

  if (!DRY_RUN) {
    console.log(`References updated: ${referencesUpdated}`);
    console.log(`\nDone! Removed ${removedCount} exercises.`);
  } else {
    console.log(`\nThis was a preview. Run with --apply to execute.`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
