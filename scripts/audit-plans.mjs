#!/usr/bin/env node
// audit-plans.mjs
// Comprehensive audit of all 8 workout plans. For every workout in every plan,
// verifies:
//   1. getPlanSquareImage(id)    resolves to a non-null asset
//   2. getPlanRectangleImage(id) resolves to a non-null asset
//   3. Description present (unless workout is intentionally free-text only)
//   4. Every exercise resolves to a real DB row (no unmatched)
//   5. Resolved DB row has an image/animation (no placeholder gray box)
//
// Mirrors the day→key mapping logic in src/data/programs/planImages.ts and the
// matcher logic in src/data/programs/exerciseAliases.ts (or the local fallback
// matcher if the shared module doesn't exist yet).
//
// Usage:  node scripts/audit-plans.mjs

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

// ── Image lookup (mirrors src/data/programs/planImages.ts) ────────────────────
// Each plan has its own day→sub→asset-path mapping. We hard-code the same
// mapping here and verify the file exists on disk.

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function planAssetRoot(planFolder, weekRange, kind) {
  return `assets/Plan Images/${planFolder}/Week ${weekRange}/${kind === 'square' ? 'Square' : 'Rectangle'}`;
}

function hgWeekRange(w) { return w <= 4 ? '1-4' : w <= 8 ? '5-8' : '9-12'; }
function bootyWeekRange(w) { return w <= 4 ? '1-4' : w <= 8 ? '5-9' : '9-12'; }
function itGirlWeekRange(w) { return w <= 4 ? '1-4' : w <= 8 ? '5-9' : '9-12'; }
function mmWeekRange(w) { return w <= 4 ? '1-4' : w <= 8 ? '5-9' : '9-12'; }
function ppWeekRange(w) { return w <= 4 ? '1-4' : '5-9'; }
function bgWeekRange(w) { return w <= 4 ? '1-4' : w <= 9 ? '5-9' : '9-12'; }
function homeWeekRange(w) { return w <= 4 ? '1-4' : w <= 9 ? '5-9' : '9-12'; }
function sbWeekRange(w) { return w <= 4 ? '1-4' : w <= 9 ? '5-9' : '9-12'; }

// Returns a path candidate or null if the id doesn't map.
function expectedAssetPath(id, kind) {
  // hourglass-wN-dN-sub
  let m = id.match(/^hourglass-w(\d+)-d(\d+)-(.+)$/);
  if (m) {
    const w = +m[1], d = +m[2], sub = m[3];
    const root = planAssetRoot('HourGlass', hgWeekRange(w), kind);
    if (kind === 'square') {
      if (sub === 'abs') return `${root}/Hourglass_week${hgWeekRange(w)}_abs_square.png`;
      if (sub === 'cardio') return `${root}/Hourglass_week${hgWeekRange(w)}_cardio_square.png`;
      if (sub === 'main') {
        const key = d === 1 ? 'lower' : d === 2 ? 'upper' : d === 3 ? 'lower2' : d === 4 ? 'fullbody' : null;
        return key ? `${root}/Hourglass_week${hgWeekRange(w)}_${key}_square.png` : null;
      }
      return null;
    } else {
      if (sub !== 'main') return null; // rectangles only on main
      const key = d === 1 ? 'lower' : d === 2 ? 'upper' : d === 3 ? 'lower' : d === 4 ? 'upper-4' : null;
      return key ? `${root}/Hourglass_week${hgWeekRange(w)}_${key.replace('-4', '_rectangle-4').replace(/^([^_]+)$/, '$1_rectangle')}.png` : null;
    }
  }
  m = id.match(/^booty-w(\d+)-d(\d+)-(.+)$/);
  if (m) {
    const w = +m[1], d = +m[2], sub = m[3];
    const range = bootyWeekRange(w);
    const root = planAssetRoot('Booty', range, kind);
    const hamsFile = range === '1-4' ? 'glutes+hamstrings' : 'glutes+hamstring';
    if (sub === 'abs') return `${root}/Booty_week${range}_abs_${kind === 'square' ? 'square' : 'rectangle'}.png`;
    if (sub === 'main') {
      const keyFile = d === 1 ? 'glutes'
        : d === 2 ? 'upper'
        : d === 3 ? hamsFile
        : d === 4 ? 'upper2'
        : d === 5 ? 'glutes+quads'
        : null;
      return keyFile ? `${root}/Booty_week${range}_${keyFile}_${kind === 'square' ? 'square' : 'rectangle'}.png` : null;
    }
    return null;
  }
  m = id.match(/^it-girl-w(\d+)-d(\d+)-(.+)$/);
  if (m) {
    const w = +m[1], d = +m[2], sub = m[3];
    const range = itGirlWeekRange(w);
    const root = planAssetRoot('It Girl', range, kind);
    if (sub === 'abs') return `${root}/ItGirl_week${range}_abs_${kind === 'square' ? 'square' : 'rectangle'}.png`;
    if (sub === 'cardio') return `${root}/ItGirl_week${range}_cardio_${kind === 'square' ? 'square' : 'rectangle'}.png`;
    if (sub === 'main') {
      const keyFile = d === 1 ? 'glutes+hamstrings'
        : d === 2 ? 'upper'
        : d === 3 ? 'glutes+quads'
        : d === 4 ? 'upper2'
        : d === 5 ? 'cardio'
        : null;
      return keyFile ? `${root}/ItGirl_week${range}_${keyFile}_${kind === 'square' ? 'square' : 'rectangle'}.png` : null;
    }
    return null;
  }
  m = id.match(/^muscle-mommy-w(\d+)-d(\d+)-(.+)$/);
  if (m) {
    const w = +m[1], d = +m[2], sub = m[3];
    const range = mmWeekRange(w);
    const root = planAssetRoot('Muscle Mommy', range, kind);
    if (sub === 'abs') return `${root}/Musclemommy_week${range}_abs_${kind === 'square' ? 'square' : 'rectangle'}.png`;
    if (sub === 'main') {
      const keyFile = d === 1 ? 'glutes+abs'
        : d === 2 ? 'pull'
        : d === 3 ? 'lower'
        : d === 4 ? 'push'
        : d === 5 ? 'fullbody'
        : null;
      return keyFile ? `${root}/Musclemommy_week${range}_${keyFile}_${kind === 'square' ? 'square' : 'rectangle'}.png` : null;
    }
    return null;
  }
  m = id.match(/^pilates-princess-w(\d+)-d(\d+)-(.+)$/);
  if (m) {
    const w = +m[1], d = +m[2], sub = m[3];
    const range = ppWeekRange(w);
    const root = planAssetRoot('Pilates Princess', range, kind);
    if (sub === 'abs') return `${root}/PilatesPrincess_week${range}_abs_${kind === 'square' ? 'square' : 'rectangle'}.png`;
    if (sub === 'cardio') return `${root}/PilatesPrincess_week${range}_cardio_${kind === 'square' ? 'square' : 'rectangle'}.png`;
    if (sub === 'main') {
      const keyFile = d === 1 ? 'glutes'
        : d === 2 ? 'pilates'
        : d === 3 ? 'upper'
        : d === 4 ? 'glutes2'
        : d === 5 ? 'pilates2'
        : null;
      return keyFile ? `${root}/PilatesPrincess_week${range}_${keyFile}_${kind === 'square' ? 'square' : 'rectangle'}.png` : null;
    }
    return null;
  }
  m = id.match(/^busy-girl-w(\d+)-d(\d+)-(.+)$/);
  if (m) {
    const w = +m[1], d = +m[2], sub = m[3];
    const range = bgWeekRange(w);
    const root = planAssetRoot('Busy Girl', range, kind);
    if (sub === 'main') {
      const keyFile = d === 1 ? 'glutes+abs'
        : d === 2 ? 'upper'
        : d === 3 ? 'full'
        : null;
      return keyFile ? `${root}/Busygirl_week${range}_${keyFile}_${kind === 'square' ? 'square' : 'rectangle'}.png` : null;
    }
    return null;
  }
  m = id.match(/^home-w(\d+)-d(\d+)-(.+)$/);
  if (m) {
    const w = +m[1], d = +m[2], sub = m[3];
    const range = homeWeekRange(w);
    const root = planAssetRoot('Home', range, kind);
    if (sub === 'main' || sub === 'cardio') {
      const keyFile = d === 1 ? 'glutes'
        : d === 2 ? 'abs+cardio'
        : d === 3 ? 'upper'
        : d === 4 ? 'abs+cardio2'
        : d === 5 ? 'lowerbody'
        : null;
      return keyFile ? `${root}/Home_week${range}_${keyFile}_${kind === 'square' ? 'square' : 'rectangle'}.png` : null;
    }
    return null;
  }
  m = id.match(/^summer-body-w(\d+)-d(\d+)-(.+)$/);
  if (m) {
    const w = +m[1], d = +m[2], sub = m[3];
    const range = sbWeekRange(w);
    const root = planAssetRoot('Summer Body', range, kind);
    if (sub === 'cardio') return `${root}/Summerbody_week${range}_cardio_${kind === 'square' ? 'square' : 'rectangle'}.png`;
    if (sub === 'main') {
      const keyFile = d === 1 ? 'glutes+abs'
        : d === 2 ? 'upper(backfocus)'
        : d === 3 ? 'glutes+hamstrings'
        : d === 4 ? 'upper'
        : d === 5 ? 'quads+abs'
        : d === 6 ? 'cardio'
        : null;
      return keyFile ? `${root}/Summerbody_week${range}_${keyFile}_${kind === 'square' ? 'square' : 'rectangle'}.png` : null;
    }
    return null;
  }
  return null;
}

// Pretty path-from-id helper for hourglass rectangles. Hourglass doesn't have
// dedicated abs/cardio rectangles — fall back to the day's main rectangle.
function hourglassRectKeyPath(week, day) {
  const range = hgWeekRange(week);
  const root = `assets/Plan Images/HourGlass/Week ${range}/Rectangle`;
  if (day === 1) return `${root}/Hourglass_week${range}_lower_rectangle.png`;
  if (day === 2) return `${root}/Hourglass_week${range}_upper_rectangle.png`;
  if (day === 3) return `${root}/Hourglass_week${range}_lower_rectangle.png`;
  if (day === 4) return `${root}/Hourglass_week${range}_upper_rectangle-4.png`;
  return null;
}

function imageOk(id, kind) {
  // Hourglass rectangle (any sub) falls back to day's main rectangle
  const hg = id.match(/^hourglass-w(\d+)-d(\d+)-/);
  if (hg && kind === 'rectangle') {
    const p = hourglassRectKeyPath(+hg[1], +hg[2]);
    return { ok: !!p && exists(p), path: p };
  }
  const p = expectedAssetPath(id, kind);
  if (!p) return { ok: false, path: null };
  return { ok: exists(p), path: p };
}

// ── Matcher (mirrors scripts/seed-fake-workouts.mjs ALIASES + matcher) ────────

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
function stripEquipment(s) { return s.replace(EQUIPMENT_RE, ' ').replace(/\s+/g, ' ').trim(); }
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
    if (queries.length === 0) return { kind: 'unmatched', resolved: null };

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
            if (extra === 0) return { kind: 'exact', resolved: best };
          }
        }
      }
      if (best) return { kind: 'fuzzy-subset', resolved: best };
    }

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
      if (bestSub) return { kind: 'fuzzy-superset', resolved: bestSub };
    }
    return { kind: 'unmatched', resolved: null };
  };
}

// ── Load programs (uses ts-node bridge) ───────────────────────────────────────
function loadAllPrograms() {
  const json = execFileSync(
    'npx',
    ['ts-node', '--transpile-only', '--project', path.join('scripts', 'tsconfig.json'),
     path.join('scripts', 'dump-programs.ts')],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
  );
  return JSON.parse(json);
}

// ── Main ──────────────────────────────────────────────────────────────────────

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

  const planIds = Object.keys(programs).sort();
  console.log(`Auditing ${planIds.length} plans.\n`);

  const totals = { workouts: 0, missingSquare: 0, missingRect: 0, missingDesc: 0, unmatched: 0, placeholder: 0 };
  const planReports = [];

  for (const planId of planIds) {
    const workouts = programs[planId];
    const report = {
      planId,
      workouts: workouts.length,
      missingSquare: [],
      missingRect: [],
      missingDesc: [],
      unmatched: [], // {id, exercises: [names]}
      placeholder: [], // {id, exercises: [names → dbName]}
    };

    for (const w of workouts) {
      totals.workouts++;

      // Image checks
      const sq = imageOk(w.id, 'square');
      if (!sq.ok) { report.missingSquare.push({ id: w.id, expected: sq.path }); totals.missingSquare++; }
      const rect = imageOk(w.id, 'rectangle');
      if (!rect.ok) { report.missingRect.push({ id: w.id, expected: rect.path }); totals.missingRect++; }

      // Description check (skip if workout is empty-exercises freeText — those are optional)
      const isFreeTextOnly = (w.exercises ?? []).length === 0 && w.freeText;
      if (!w.description && !isFreeTextOnly) {
        report.missingDesc.push({ id: w.id, title: w.title });
        totals.missingDesc++;
      }

      // Exercise checks
      const unmatchedNames = [];
      const placeholderNames = [];
      for (const ex of w.exercises ?? []) {
        const r = match(ex.name);
        if (!r.resolved) {
          unmatchedNames.push(ex.name);
        } else if (!r.resolved.image_url && !r.resolved.thumbnail_url) {
          placeholderNames.push(`${ex.name} → ${r.resolved.display_name ?? r.resolved.name}`);
        }
      }
      if (unmatchedNames.length > 0) {
        report.unmatched.push({ id: w.id, exercises: unmatchedNames });
        totals.unmatched += unmatchedNames.length;
      }
      if (placeholderNames.length > 0) {
        report.placeholder.push({ id: w.id, exercises: placeholderNames });
        totals.placeholder += placeholderNames.length;
      }
    }
    planReports.push(report);
  }

  // ── Print summary ─────────────────────────────────────────────────────────
  console.log('═'.repeat(72));
  console.log('SUMMARY');
  console.log('═'.repeat(72));
  console.log(`Total workouts audited:         ${totals.workouts}`);
  console.log(`Missing square images:          ${totals.missingSquare}`);
  console.log(`Missing rectangle images:       ${totals.missingRect}`);
  console.log(`Missing descriptions:           ${totals.missingDesc}`);
  console.log(`Unmatched exercise names:       ${totals.unmatched}`);
  console.log(`Placeholder DB rows (no image): ${totals.placeholder}`);
  console.log();

  // ── Per-plan detail ───────────────────────────────────────────────────────
  for (const r of planReports) {
    const hasIssues = r.missingSquare.length + r.missingRect.length + r.missingDesc.length +
                      r.unmatched.length + r.placeholder.length > 0;
    if (!hasIssues) {
      console.log(`✓ ${r.planId.padEnd(20)} (${r.workouts} workouts, clean)`);
      continue;
    }
    console.log(`\n─── ${r.planId} (${r.workouts} workouts) ───`);
    if (r.missingSquare.length > 0) {
      console.log(`  MISSING SQUARE IMAGES (${r.missingSquare.length}):`);
      for (const m of r.missingSquare.slice(0, 20)) {
        console.log(`    • ${m.id}  → ${m.expected ?? '(no mapping)'}`);
      }
      if (r.missingSquare.length > 20) console.log(`    ... (+${r.missingSquare.length - 20} more)`);
    }
    if (r.missingRect.length > 0) {
      console.log(`  MISSING RECTANGLE IMAGES (${r.missingRect.length}):`);
      for (const m of r.missingRect.slice(0, 20)) {
        console.log(`    • ${m.id}  → ${m.expected ?? '(no mapping)'}`);
      }
      if (r.missingRect.length > 20) console.log(`    ... (+${r.missingRect.length - 20} more)`);
    }
    if (r.missingDesc.length > 0) {
      console.log(`  MISSING DESCRIPTIONS (${r.missingDesc.length}):`);
      for (const m of r.missingDesc.slice(0, 20)) {
        console.log(`    • ${m.id}  (${m.title})`);
      }
      if (r.missingDesc.length > 20) console.log(`    ... (+${r.missingDesc.length - 20} more)`);
    }
    if (r.unmatched.length > 0) {
      console.log(`  UNMATCHED EXERCISES (${r.unmatched.length} workouts):`);
      const uniqueNames = new Set();
      for (const u of r.unmatched) for (const n of u.exercises) uniqueNames.add(n);
      console.log(`    Unique unmatched names: ${[...uniqueNames].sort().join(', ')}`);
    }
    if (r.placeholder.length > 0) {
      console.log(`  PLACEHOLDER (resolved but no image) (${r.placeholder.length} workouts):`);
      const uniqueNames = new Set();
      for (const u of r.placeholder) for (const n of u.exercises) uniqueNames.add(n);
      for (const n of [...uniqueNames].sort()) console.log(`    • ${n}`);
    }
  }

  console.log();
  const clean = totals.missingSquare + totals.missingRect + totals.missingDesc + totals.unmatched === 0;
  if (clean) {
    console.log('✓ All plans pass image, description, and exercise-match checks.');
    if (totals.placeholder > 0) {
      console.log(`  (${totals.placeholder} placeholder occurrences remain — DB rows without media)`);
    }
  } else {
    console.log('✗ Issues found. Address the per-plan items above.');
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
