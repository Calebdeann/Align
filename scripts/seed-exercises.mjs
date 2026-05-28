#!/usr/bin/env node
// =============================================
// seed-exercises.mjs
// =============================================
// Walks every program in src/data/programs/ and ensures every referenced
// exercise has a row in the `exercises` table — fetching from Ascend API for
// any miss. Without this prerequisite, fake-workout detail views render
// exercise rows with no thumbnail (just a name).
//
// Programs are .ts but we extract exercise names with a simple regex against
// the `ex('Name', N, 'reps')` helper format, avoiding any TS compile step.
//
// Usage:
//   npm run seed:exercises

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://dngpsabyqsuunajtotci.supabase.co';
const ASCEND_API_BASE = 'https://www.ascendapi.com/api/v1';
const PROGRAMS_DIR = path.resolve(import.meta.dirname, '..', 'src', 'data', 'programs');

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

// Match ex('Name', n, 'reps') and capture just the name.
const EX_NAME_RE = /\bex\(\s*'([^']+)'/g;

function collectProgramExerciseNames() {
  const names = new Set();
  const files = fs
    .readdirSync(PROGRAMS_DIR)
    .filter((f) => f.endsWith('.ts') && !['types.ts', 'index.ts', 'planImages.ts', 'exerciseMatching.ts'].includes(f) && !f.endsWith('-descriptions.ts'));
  for (const file of files) {
    const src = fs.readFileSync(path.join(PROGRAMS_DIR, file), 'utf8');
    let m;
    while ((m = EX_NAME_RE.exec(src)) !== null) {
      names.add(m[1]);
    }
  }
  return [...names].sort();
}

async function findExistingExercise(name) {
  // Match against both `name` and `display_name`, case-insensitive.
  const url = `${SUPABASE_URL}/rest/v1/exercises?select=id,name,display_name&or=(name.ilike.${encodeURIComponent(name)},display_name.ilike.${encodeURIComponent(name)})&limit=1`;
  const res = await fetch(url, { headers: restHeaders });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

async function searchAscend(query) {
  const url = `${ASCEND_API_BASE}/exercises/search?q=${encodeURIComponent(query)}&limit=5`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    if (!text.startsWith('{') && !text.startsWith('[')) return [];
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.data)) return parsed.data;
    return [];
  } catch {
    return [];
  }
}

function pickBestAscendMatch(programName, candidates) {
  if (candidates.length === 0) return null;
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const target = norm(programName);
  const scored = candidates.map((c) => {
    const candName = norm(c.name ?? '');
    let score = 0;
    if (candName === target) score += 100;
    if (candName.includes(target) || target.includes(candName)) score += 30;
    const targetTokens = target.split(' ');
    const candTokens = candName.split(' ');
    const overlap = targetTokens.filter((t) => candTokens.includes(t)).length;
    score += overlap * 5;
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].score > 0 ? scored[0].c : null;
}

async function insertExercise(asc, programName) {
  // Map Ascend's response shape to our `exercises` table columns.
  const row = {
    id: asc.exerciseId,
    name: asc.name,
    display_name: programName, // keep the program's name as the UI label
    muscle_group: asc.targetMuscles?.[0] ?? null,
    image_url: asc.gifUrl ?? null,
    thumbnail_url: asc.gifUrl ?? null,
    exercise_db_id: asc.exerciseId,
    target_muscles: asc.targetMuscles ?? [],
    secondary_muscles: asc.secondaryMuscles ?? [],
    body_parts: asc.bodyParts ?? [],
    instructions_array: asc.instructions ?? [],
    equipment: asc.equipments ?? [],
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/exercises`, {
    method: 'POST',
    headers: { ...restHeaders, Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(row),
  });
  if (!res.ok && res.status !== 409) {
    const text = await res.text();
    throw new Error(`Insert failed (${res.status}): ${text}`);
  }
}

async function main() {
  const names = collectProgramExerciseNames();
  console.log(`Found ${names.length} unique exercise names referenced by programs.`);

  let hits = 0;
  let inserted = 0;
  const misses = [];

  for (const name of names) {
    const existing = await findExistingExercise(name);
    if (existing) {
      hits++;
      continue;
    }
    const candidates = await searchAscend(name);
    const best = pickBestAscendMatch(name, candidates);
    if (!best) {
      misses.push(name);
      continue;
    }
    try {
      await insertExercise(best, name);
      inserted++;
      console.log(`  + ${name}  →  ${best.name} (${best.exerciseId})`);
    } catch (err) {
      console.warn(`  ! Failed to insert ${name}: ${err.message}`);
      misses.push(name);
    }
  }

  console.log('---');
  console.log(`Already indexed: ${hits}`);
  console.log(`Newly inserted from Ascend: ${inserted}`);
  console.log(`Misses (no Ascend match — need manual review): ${misses.length}`);
  if (misses.length) {
    console.log('\nMisses:');
    misses.forEach((n) => console.log(`  - ${n}`));
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
