#!/usr/bin/env node
// Audit which program exercise names resolve to the DB via fuzzy / aliased
// matching vs an exact hit. Prints three sections:
//   - Exact matches (silent count)
//   - Fuzzy: query was a SUBSET of a DB row (extra tokens in DB)
//   - Fuzzy: DB was a SUBSET of the query (modifier words in query DB ignores)
//   - Alias used (mapped via the ALIASES table)
//   - Unmatched (nothing resolved — these would be skipped during seed)
//
// Usage:  node scripts/audit-exercise-matches.mjs

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dngpsabyqsuunajtotci.supabase.co';
const ROOT = path.resolve(import.meta.dirname, '..');

let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  try {
    const env = fs.readFileSync(path.resolve(ROOT, '.env'), 'utf8');
    const m = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (m) SERVICE_KEY = m[1].trim();
  } catch {}
}
if (!SERVICE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Matcher (mirrors scripts/seed-fake-workouts.mjs) ──────────────────────

const ALIASES = JSON.parse(
  fs.readFileSync(path.resolve(ROOT, 'src/data/programs/exerciseAliases.json'), 'utf8')
).aliases;

const COMPOUND_SPLITS = [
  [/\bpulldown\b/g, 'pull down'],
  [/\bpullup\b/g, 'pull up'],
  [/\bpullups\b/g, 'pull ups'],
  [/\bpushup\b/g, 'push up'],
  [/\bpushups\b/g, 'push ups'],
  [/\bstepup\b/g, 'step up'],
  [/\bstepups\b/g, 'step ups'],
  [/\bsitup\b/g, 'sit up'],
  [/\bsitups\b/g, 'sit ups'],
  [/\bchinup\b/g, 'chin up'],
  [/\bkickback\b/g, 'kick back'],
  [/\bsideplank\b/g, 'side plank'],
];

const EQUIPMENT_RE = /\b(barbell|dumbbell|bb|db|cable|machine|lever|smith|band|kettlebell|kb|bodyweight|plate)\b/g;

function applyAlias(s) {
  const k = String(s || '').toLowerCase().trim();
  return ALIASES[k] ?? s;
}
function singularizeWord(w) {
  if (w.length <= 2) return w;
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('sses')) return w.slice(0, -2);
  if (w.endsWith('ches') || w.endsWith('shes')) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) return w.slice(0, -1);
  return w;
}
function normalize(s) {
  let r = String(s || '').toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/[()]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/[&+/.,]/g, ' ')
    .replace(/\s+/g, ' ').trim();
  r = r.split(' ').filter(Boolean).map(singularizeWord).join(' ');
  for (const [re, rep] of COMPOUND_SPLITS) r = r.replace(re, rep);
  return r.replace(/\s+/g, ' ').trim();
}
function stripEquipment(s) {
  return s.replace(EQUIPMENT_RE, ' ').replace(/\s+/g, ' ').trim();
}
function tokenize(s) { return normalize(s).split(' ').filter(Boolean); }
function tokenizeBare(s) { return stripEquipment(normalize(s)).split(' ').filter(Boolean); }

function buildMatcher(allExercises) {
  const rows = allExercises.map((row) => {
    const sets = [];
    for (const n of [row.name, row.display_name].filter(Boolean)) {
      const f = new Set(tokenize(n)); if (f.size > 0) sets.push(f);
      const b = new Set(tokenizeBare(n)); if (b.size > 0) sets.push(b);
    }
    return { row, sets };
  });
  function buildQueries(name) {
    const lowerFull = applyAlias(String(name).toLowerCase());
    const trimmedSS = lowerFull.includes(' ss ')
      ? applyAlias(lowerFull.split(/\s+ss\s+/i)[0].trim())
      : lowerFull;
    const out = []; const seen = new Set();
    for (const v of [trimmedSS, lowerFull]) {
      for (const t of [tokenize(v), tokenizeBare(v)]) {
        if (t.length === 0) continue;
        const k = t.slice().sort().join('|');
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(new Set(t));
      }
    }
    return out;
  }
  return function matchExercise(name) {
    const queries = buildQueries(name);
    if (queries.length === 0) return { kind: 'unmatched', resolved: null, extra: null };

    // Pass 1: query ⊆ DB (smallest superset)
    let best = null, bestExtra = Infinity;
    for (const q of queries) {
      for (const entry of rows) {
        for (const r of entry.sets) {
          if (r.size < q.size) continue;
          let subset = true;
          for (const t of q) if (!r.has(t)) { subset = false; break; }
          if (!subset) continue;
          const extra = r.size - q.size;
          if (extra < bestExtra) {
            best = entry.row; bestExtra = extra;
            if (extra === 0) {
              return { kind: 'exact', resolved: best, extra: 0 };
            }
          }
        }
      }
      if (best) return { kind: 'fuzzy-subset', resolved: best, extra: bestExtra };
    }

    // Pass 2: DB ⊆ query (longest subset = closest)
    let bestSub = null, bestSubSize = 0;
    for (const q of queries) {
      for (const entry of rows) {
        for (const r of entry.sets) {
          if (r.size > q.size) continue;
          if (r.size < 2) continue;
          let subset = true;
          for (const t of r) if (!q.has(t)) { subset = false; break; }
          if (!subset) continue;
          if (r.size > bestSubSize) { bestSub = entry.row; bestSubSize = r.size; }
        }
      }
      if (bestSub) return { kind: 'fuzzy-superset', resolved: bestSub, extra: null };
    }

    return { kind: 'unmatched', resolved: null, extra: null };
  };
}

// ── Load all programs via the same ts-node dumper the seed uses ──────────

function loadAllPrograms() {
  const json = execFileSync(
    'npx',
    ['ts-node', '--transpile-only', '--project', path.join('scripts', 'tsconfig.json'),
     path.join('scripts', 'dump-programs.ts')],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
  );
  return JSON.parse(json);
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log('Loading exercises from DB...');
  const { data: allEx, error } = await supabase
    .from('exercises')
    .select('id, name, display_name, image_url, thumbnail_url, video_url')
    .limit(2000);
  if (error) throw new Error(error.message);
  console.log(`Loaded ${allEx.length} exercises.\n`);

  const match = buildMatcher(allEx);

  console.log('Loading programs...');
  const programs = loadAllPrograms();

  // Per unique program-exercise-name, collect: usages (program × count) and resolution.
  const byName = new Map(); // name → { kind, resolved, programs: Map<planId, count> }

  for (const [planId, workouts] of Object.entries(programs)) {
    for (const w of workouts) {
      for (const ex of w.exercises) {
        if (!byName.has(ex.name)) byName.set(ex.name, { name: ex.name, programs: new Map() });
        const entry = byName.get(ex.name);
        entry.programs.set(planId, (entry.programs.get(planId) ?? 0) + 1);
      }
    }
  }

  // Resolve each
  const aliasKeys = new Set(Object.keys(ALIASES));
  for (const entry of byName.values()) {
    const aliasHit = aliasKeys.has(entry.name.toLowerCase().trim());
    const r = match(entry.name);
    entry.kind = aliasHit && r.kind === 'exact' ? 'alias-exact'
               : aliasHit ? 'alias-' + r.kind
               : r.kind;
    entry.resolved = r.resolved;
    entry.extra = r.extra;
  }

  const all = [...byName.values()];
  const exact = all.filter((e) => e.kind === 'exact');
  const aliasExact = all.filter((e) => e.kind.startsWith('alias-'));
  const fuzzySubset = all.filter((e) => e.kind === 'fuzzy-subset');
  const fuzzySuperset = all.filter((e) => e.kind === 'fuzzy-superset');
  const unmatched = all.filter((e) => e.kind === 'unmatched');

  // A resolved DB row may still have no media — the workout-preview / detail
  // view shows a placeholder gray box for these. Flag separately so the user
  // can decide whether to upload media to those rows or re-alias to a row that
  // does have an image.
  const noImage = all.filter(
    (e) => e.resolved && !e.resolved.image_url && !e.resolved.thumbnail_url
  );

  const total = all.length;
  console.log(`Total unique program exercise names: ${total}`);
  console.log(`  • Exact match:                      ${exact.length}`);
  console.log(`  • Resolved via ALIAS table:         ${aliasExact.length}`);
  console.log(`  • Fuzzy (query ⊆ DB, DB has extra): ${fuzzySubset.length}`);
  console.log(`  • Fuzzy (DB ⊆ query, query has extra modifiers): ${fuzzySuperset.length}`);
  console.log(`  • Unmatched:                        ${unmatched.length}`);
  console.log(`  • Resolved but DB row has NO image: ${noImage.length} (UI shows placeholder)`);
  console.log();

  const fmtProgs = (m) => [...m.entries()].sort((a, b) => b[1] - a[1])
    .map(([p, n]) => `${p}×${n}`).join(', ');

  function dump(label, list, includeExtra = false) {
    if (list.length === 0) return;
    console.log(`\n${label} (${list.length}):`);
    list.sort((a, b) => a.name.localeCompare(b.name));
    for (const e of list) {
      const arrow = e.resolved
        ? `→ ${e.resolved.display_name ?? e.resolved.name}${includeExtra && e.extra != null ? ` (+${e.extra} DB tokens)` : ''}`
        : '→ (none)';
      console.log(`  • ${e.name.padEnd(42)} ${arrow}`);
      console.log(`      used by: ${fmtProgs(e.programs)}`);
    }
  }

  dump('ALIASED matches (program shorthand → canonical DB name)', aliasExact);
  dump('FUZZY: query is subset of DB (DB row has extra qualifiers)', fuzzySubset, true);
  dump('FUZZY: DB is subset of query (program has extra modifier words DB ignores)', fuzzySuperset);
  dump('UNMATCHED (nothing in DB — would be skipped during seed)', unmatched);
  dump('NO IMAGE on the resolved DB row (UI shows placeholder gray box)', noImage);
}

main().catch((e) => { console.error(e); process.exit(1); });
