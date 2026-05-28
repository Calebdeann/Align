#!/usr/bin/env node
// =============================================
// seed-fake-workouts.mjs
// =============================================
// Generates the 30-day drip schedule and inserts fake completed-workout rows
// (workouts + workout_exercises + workout_sets + workout_muscles), with each
// account's workouts pulled from THEIR own plan in sequential plan order.
//
// Inputs:
//   - scripts/seed-data/fake-accounts.json (from seed-fake-accounts.mjs)
//   - scripts/seed-data/workout-photos.json (from upload-fake-workout-photos.mjs)
//   - src/data/programs/*.ts (every program file, regex-parsed)
//
// Behaviour:
//   - Each buddy uses ONLY photos from their own folder.
//   - Extras share the 20 "Random : Extra" photos, distributed evenly.
//   - Each account posts at most once per day; total posts evenly spread.
//   - Day 1 has ~Nlive posts (one per live-plan account) so the feed feels
//     lived-in on first open; subsequent days reveal naturally.
//   - **Stranded accounts** — those whose `plan_id` doesn't yet have a
//     matching `.ts` file in src/data/programs/ — are SKIPPED entirely. They
//     post nothing until their plan is built; re-run with --force after the
//     missing plan lands to fill them in.
//   - **Sequential plan progression**: within each account, slot N gets
//     program workouts[N] in (week ASC, dayInWeek ASC) order. Hannah's first
//     post is W1D1 of her plan, next is W1D2, etc.
//   - Weights are derived deterministically from (account, exercise) so the
//     same person uses consistent weights across sessions.
//   - Each workout row gets `notes = '[seed]'` so teardown can find them.
//
// Usage:
//   npm run seed:workouts            (refuses if any [seed] rows exist)
//   npm run seed:workouts -- --force (deletes existing seed workouts first)

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dngpsabyqsuunajtotci.supabase.co';
const ACCOUNTS_FILE = path.resolve(import.meta.dirname, 'seed-data', 'fake-accounts.json');
const PHOTOS_FILE = path.resolve(import.meta.dirname, 'seed-data', 'workout-photos.json');
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

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const FORCE = process.argv.includes('--force');

// -------- Program loading --------
// Shells out to `npx ts-node scripts/dump-programs.ts` which imports the real
// PROGRAMS map and emits JSON. We used to regex-scrape buildDay(...) calls out
// of each program .ts file, but that broke once program files moved to a
// variable-based pattern (buildDay(week, dayInWeek, ...) inside week-builder
// functions like buildSummerWeek(week)). Importing the modules is the only
// correct way to get the fully-realized week-by-week workout data.
function loadAllPrograms() {
  const ROOT = path.resolve(import.meta.dirname, '..');
  const json = execFileSync(
    'npx',
    [
      'ts-node',
      '--transpile-only',
      '--project',
      path.join('scripts', 'tsconfig.json'),
      path.join('scripts', 'dump-programs.ts'),
    ],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
  );
  const data = JSON.parse(json);
  const programs = new Map();
  for (const [planId, workouts] of Object.entries(data)) {
    // Seed only inserts lifting sessions; free-text cardio/abs/active-rest
    // workouts (empty exercises) are not real workouts to track.
    const lifting = workouts.filter((w) => w.exercises && w.exercises.length > 0);
    if (lifting.length > 0) programs.set(planId, lifting);
  }
  return programs;
}

// Deterministic numeric hash so the same (account, exercise) always picks the
// same base weight — a real person's weights don't randomly fluctuate.
function hash(...parts) {
  const h = crypto.createHash('md5').update(parts.join('|')).digest();
  return h.readUInt32BE(0);
}

// Plausible women's-fitness weights (kg) keyed by exercise name patterns.
// Falls back to a moderate dumbbell range if no match.
function pickBaseWeightKg(accountId, exerciseName) {
  const n = exerciseName.toLowerCase();
  let lo, hi;
  if (/squat|deadlift|hip thrust|rdl/.test(n)) { lo = 30; hi = 80; }
  else if (/bench|shoulder press|overhead press/.test(n)) { lo = 15; hi = 35; }
  else if (/row|pull[\s-]?down|pull[\s-]?up|lat/.test(n)) { lo = 20; hi = 45; }
  else if (/bulgarian|lunge|step[\s-]?up/.test(n)) { lo = 8; hi = 20; }
  else if (/curl|raise|extension|kickback|fly|crunch/.test(n)) { lo = 4; hi = 14; }
  else { lo = 8; hi = 25; }
  const h = hash(accountId, exerciseName);
  const span = hi - lo;
  // Round to nearest 2.5kg (standard dumbbell jump).
  const raw = lo + (h % (span * 10)) / 10;
  return Math.round(raw / 2.5) * 2.5;
}

// Reps string from program might be "12", "8-10", "10 each", "AMRAP", "12-15".
// Extract the first integer found; fall back to 10.
function parseReps(reps) {
  const m = String(reps).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 10;
}

// Pick a realistic hour of day. Weighted toward morning (6-9), lunch (12-14),
// evening (17-22). Never 0-5am or 14-16 (work hours).
function pickWorkoutHour(rand) {
  const buckets = [
    { start: 6, end: 9, weight: 0.30 },    // morning
    { start: 12, end: 14, weight: 0.10 },  // lunch
    { start: 17, end: 22, weight: 0.55 },  // evening
    { start: 22, end: 24, weight: 0.05 },  // late night
  ];
  let r = rand;
  let chosen = buckets[0];
  for (const b of buckets) {
    if (r < b.weight) { chosen = b; break; }
    r -= b.weight;
  }
  return chosen.start + Math.random() * (chosen.end - chosen.start);
}

// -------- Schedule generation --------

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Pick a midday hour (12:00-13:30) for pastel-extra posts. Sandwiched between
// the buddy morning bucket (6-9) and the buddy evening bucket (17-22), this
// guarantees ≥2-3 buddy posts before and after each extra in the chronological
// feed — enforcing the "≥3 buddies between any two extras" spacing rule across
// day boundaries, since combined with the 1-extra-per-day cap, two consecutive
// daily extras are always separated by both days' worth of evening + morning
// buddy posts.
function pickExtraHour() {
  return 12 + Math.random() * 1.5;
}

// Schedule rules:
//   Day 0   — one post per buddy account + ONE pastel extra (max). The other
//             extras' day-0 photo defers into the drip. Anti-adjacency rule
//             applies to day 0 too: combined with the midday extra hour, the
//             single extra is sandwiched by buddy posts.
//   Days 1-N — target 5 posts per day with three constraints:
//     • at most 1 pastel extra per day (same anti-adjacency rule)
//     • prefer plan variety (don't pile multiple buddies of the same plan on
//       one day; falls back to relaxed picking if we can't hit the quota)
//     • accounts with more remaining photos picked first (prevents any one
//       account running dry before the drip window closes)
// N is computed from the photo count so every photo finds a slot (drip
// window auto-extends when accounts have lots of photos).
//
// Within each account, slots are sorted by day ASC and paired sequentially with
// the account's plan workouts (W1D1, W1D2, …) so the buddy's posts read as
// genuine plan progression.
function buildSchedule(accounts, programMap) {
  const TARGET_PER_DAY = 5;
  const totalPhotos = accounts.reduce((s, a) => s + a.photos.length, 0);

  // Per-account FIFO photo queue (shuffled so reseeds give different pairings).
  // Also per-account list of (day, hour) slots — sorted later for pairing.
  const queues = new Map();        // accountId → mutable photos[] queue
  const accountSlots = new Map();  // accountId → slot[]
  for (const acc of accounts) {
    queues.set(acc.userId, shuffleInPlace([...acc.photos]));
    accountSlots.set(acc.userId, []);
  }

  function placeSlot(acc, day) {
    const photo = queues.get(acc.userId).shift();
    if (!photo) return false;
    const hour = acc.kind === 'extra' ? pickExtraHour() : pickWorkoutHour(Math.random());
    accountSlots.get(acc.userId).push({ day, hour, photo });
    return true;
  }

  // ── Day 0 — one per buddy account + (at most) one extra ────────────────
  const buddies = accounts.filter((a) => a.kind !== 'extra');
  const extras = accounts.filter((a) => a.kind === 'extra' && a.photos.length > 0);
  for (const acc of buddies) placeSlot(acc, 0);
  if (extras.length > 0) {
    // Day-0 extra: pick the one with the most photos (longest drip tail).
    const day0Extra = [...extras].sort((a, b) => b.photos.length - a.photos.length)[0];
    placeSlot(day0Extra, 0);
  }

  // Auto-extend drip window so every remaining photo lands somewhere.
  const remainingAfterDay0 = totalPhotos - (buddies.length + (extras.length > 0 ? 1 : 0));
  const dripDays = Math.max(29, Math.ceil(remainingAfterDay0 / TARGET_PER_DAY));
  const TOTAL_DAYS = 1 + dripDays;

  // ── Days 1..N — distribute remaining with constraints ─────────────────
  for (let day = 1; day < TOTAL_DAYS; day++) {
    const candidates = accounts.filter((a) => queues.get(a.userId).length > 0);
    if (candidates.length === 0) break;
    candidates.sort((a, b) => queues.get(b.userId).length - queues.get(a.userId).length);

    const picked = new Set();
    const usedPlans = new Set();

    // Reserve 1 slot for a pastel extra if any extras still have photos left.
    // Without this reservation, Pass 1 fills all 5 slots with buddies (who have
    // larger photo queues and sort first) and extras are systematically
    // starved. With it, extras drain at ~1/day until empty.
    const extrasRemaining = candidates.some((a) => a.kind === 'extra');
    const buddyTarget = extrasRemaining ? TARGET_PER_DAY - 1 : TARGET_PER_DAY;

    // Pass 1: pick buddies enforcing plan variety
    for (const acc of candidates) {
      if (picked.size >= buddyTarget) break;
      if (acc.kind === 'extra') continue;
      if (usedPlans.has(acc.planId)) continue;
      picked.add(acc);
      usedPlans.add(acc.planId);
    }

    // Pass 2: pick the one extra (highest-photo-count by sort order)
    if (extrasRemaining) {
      const e = candidates.find((a) => a.kind === 'extra');
      if (e) picked.add(e);
    }

    // Pass 3: fill remaining buddy slots, relaxing plan-variety
    for (const acc of candidates) {
      if (picked.size >= TARGET_PER_DAY) break;
      if (picked.has(acc)) continue;
      if (acc.kind === 'extra') continue;
      picked.add(acc);
    }

    for (const acc of picked) placeSlot(acc, day);
  }

  // ── Pair each account's slots with sequential plan workouts ───────────
  const slots = [];
  for (const acc of accounts) {
    const accSlotList = accountSlots.get(acc.userId);
    if (accSlotList.length === 0) continue;
    accSlotList.sort((a, b) => a.day - b.day);
    const planWorkouts = programMap.get(acc.planId);
    if (!planWorkouts || planWorkouts.length === 0) continue;
    for (let i = 0; i < accSlotList.length; i++) {
      const s = accSlotList[i];
      const workout = planWorkouts[i % planWorkouts.length];
      slots.push({
        accountId: acc.userId,
        accountName: acc.name,
        accountPlanId: acc.planId,
        accountKind: acc.kind,
        photo: s.photo,
        day: s.day,
        hour: s.hour,
        workout,
      });
    }
  }
  return slots;
}

// -------- Exercise matching --------
// The DB has ~462 exercises with two naming styles per row (`name` lowercased
// like "barbell hip thrust", `display_name` like "Hip Thrust (Barbell)"). The
// program files use looser names ("Hip Thrusts", "Cable Step Ups", "BB RDL",
// "Plank SS Dead Bug"). Exact ilike misses almost all of those, so we do
// token-based subset matching in memory:
//
//   1. Apply hand-curated ALIASES first (irreducible mismatches like
//      "RDL" → "Romanian Deadlift", which would never resolve via fuzzy rules).
//   2. Normalize: lowercase, strip punctuation, split compound words like
//      "pulldown"→"pull down" so "Lat Pull Down" can find "Lat Pulldown".
//   3. Tokenize and singularize each word (fixing "ups"→"up" etc.).
//   4. Strip equipment tokens (barbell, dumbbell, cable, lever, smith, band, …)
//      from both sides so "Reverse Fly" finds "Seated Reverse Fly (Machine)".
//   5. Find DB rows whose token set is a SUPERSET of the query tokens; pick
//      the row with the smallest extra-token count (= closest match).
//   6. If the query is a superset (compound superset name like "Cable Crunch
//      SS Hanging Knee Raise"), retry with the first half before " ss ".

// ALIASES are loaded from the shared JSON (single source of truth so the
// runtime app matcher and the seed/audit scripts agree on what each program
// name resolves to). Edit src/data/programs/exerciseAliases.json to change.
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
  const key = String(s || '').toLowerCase().trim();
  return ALIASES[key] ?? s;
}

function singularizeWord(w) {
  if (w.length <= 2) return w;
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('sses')) return w.slice(0, -2);
  if (w.endsWith('ches') || w.endsWith('shes')) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) {
    return w.slice(0, -1);
  }
  return w;
}

function normalize(s) {
  let r = String(s || '')
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/[()]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/[&+/.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Singularize FIRST so "kickbacks" → "kickback" can then be split by the
  // compound rules below (otherwise the \b boundary inside "kickbacks" fails).
  r = r.split(' ').filter(Boolean).map(singularizeWord).join(' ');
  for (const [re, rep] of COMPOUND_SPLITS) r = r.replace(re, rep);
  return r.replace(/\s+/g, ' ').trim();
}

function stripEquipment(s) {
  return s.replace(EQUIPMENT_RE, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(s) {
  return normalize(s).split(' ').filter(Boolean);
}

function tokenizeBare(s) {
  return stripEquipment(normalize(s)).split(' ').filter(Boolean);
}

function buildExerciseMatcher(allExercises) {
  // Pre-compute every row's possible token sets (full + equipment-stripped,
  // for both `name` and `display_name`). The matcher iterates these to find
  // the smallest superset of the query tokens.
  const rows = allExercises.map((row) => {
    const sets = [];
    for (const n of [row.name, row.display_name].filter(Boolean)) {
      const full = new Set(tokenize(n));
      const bare = new Set(tokenizeBare(n));
      if (full.size > 0) sets.push(full);
      if (bare.size > 0) sets.push(bare);
    }
    return { row, sets };
  });

  function buildQueries(name) {
    // Aliases applied to BOTH the full name and the SS-trimmed half — programs
    // sometimes phrase a superset like "Plank Hold SS Hanging Knee Raise" where
    // the lead movement ("Plank Hold") needs its own alias lookup.
    const lowerFull = applyAlias(String(name).toLowerCase());
    const trimmedSS = lowerFull.includes(' ss ')
      ? applyAlias(lowerFull.split(/\s+ss\s+/i)[0].trim())
      : lowerFull;
    const out = [];
    const seen = new Set();
    for (const variant of [trimmedSS, lowerFull]) {
      for (const tokens of [tokenize(variant), tokenizeBare(variant)]) {
        if (tokens.length === 0) continue;
        const key = tokens.slice().sort().join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(new Set(tokens));
      }
    }
    return out;
  }

  return function matchExercise(name) {
    const queries = buildQueries(name);
    if (queries.length === 0) return null;

    // First pass: find the smallest DB token-set that is a SUPERSET of the
    // query (i.e. the query name fully appears inside a DB exercise name).
    // Smallest superset = closest semantic match.
    let best = null;
    let bestExtra = Infinity;
    for (const q of queries) {
      for (const entry of rows) {
        for (const r of entry.sets) {
          if (r.size < q.size) continue;
          let subset = true;
          for (const t of q) {
            if (!r.has(t)) { subset = false; break; }
          }
          if (!subset) continue;
          const extra = r.size - q.size;
          if (extra < bestExtra) {
            best = entry.row;
            bestExtra = extra;
            if (extra === 0) return best; // exact match
          }
        }
      }
      if (best) return best;
    }

    // Fallback: the query has MORE tokens than any DB row (e.g. "Close Grip
    // Lat Pull Down" vs DB "Lat Pulldown"). Find the longest DB row whose
    // tokens are a SUBSET of the query — that's the closest variant.
    let bestSub = null;
    let bestSubSize = 0;
    for (const q of queries) {
      for (const entry of rows) {
        for (const r of entry.sets) {
          if (r.size > q.size) continue;
          if (r.size < 2) continue; // 1-word matches are too weak
          let subset = true;
          for (const t of r) {
            if (!q.has(t)) { subset = false; break; }
          }
          if (!subset) continue;
          if (r.size > bestSubSize) {
            bestSub = entry.row;
            bestSubSize = r.size;
          }
        }
      }
      if (bestSub) return bestSub;
    }

    return null;
  };
}

async function prefetchAllExercises() {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, display_name, target_muscles, secondary_muscles, muscle_group')
    .limit(2000);
  if (error) throw new Error(`exercise prefetch failed: ${error.message}`);
  return data ?? [];
}

// -------- Insertion --------

async function insertWorkout(slot, baseDate, matchExercise, unmatched) {
  // The schedule has already paired this slot with the right plan workout
  // (sequential within the account's plan). Just read it.
  const workout = slot.workout;

  // Compute timestamps.
  const completedAtMs =
    baseDate.getTime() +
    slot.day * 86400000 +
    slot.hour * 3600000 +
    Math.random() * 3600000; // 0-60 min jitter
  const completedAt = new Date(completedAtMs);

  // Resolve each program exercise to a DB row. Drop unmatched names — the
  // workout still gets created with the remaining exercises (or skipped
  // entirely if none match). Each unmatched name is counted for the end-of-run
  // report so the user can rename them in src/data/programs/* later.
  const exerciseRows = [];
  let totalSets = 0;
  for (let ei = 0; ei < workout.exercises.length; ei++) {
    const def = workout.exercises[ei];
    const exDb = matchExercise(def.name);
    if (!exDb) {
      unmatched.set(def.name, (unmatched.get(def.name) ?? 0) + 1);
      continue;
    }
    const setsArr = [];
    const baseWeight = pickBaseWeightKg(slot.accountId, def.name);
    const reps = parseReps(def.reps);
    for (let si = 0; si < def.sets; si++) {
      // Slight variation across sets for realism (rest-pause drops).
      const sVar = (si - (def.sets - 1) / 2) * 1.0;
      const weight = Math.max(0, Math.round((baseWeight + sVar) * 2) / 2);
      setsArr.push({
        set_number: si + 1,
        weight,
        reps,
        set_type: 'normal',
        completed: true,
        rpe: null,
      });
      totalSets++;
    }
    exerciseRows.push({ def, exDb, sets: setsArr });
  }

  if (exerciseRows.length === 0) {
    throw new Error(`no exercises matched DB for "${workout.title}" — workout skipped`);
  }

  // Re-index after filtering so order_index is contiguous 0..N-1.
  exerciseRows.forEach((er, i) => { er.order_index = i; });

  // Resolve superset_id per row: a program supersetGroup becomes a workout-
  // scoped numeric superset_id, but ONLY if both halves of the pair survived
  // the exercise-match filter. If a lone half remains, its superset_id is
  // null (becomes a solo exercise — better than emitting a lopsided pair).
  const groupCounts = new Map();
  for (const er of exerciseRows) {
    const g = er.def.supersetGroup;
    if (g != null) groupCounts.set(g, (groupCounts.get(g) ?? 0) + 1);
  }
  for (const er of exerciseRows) {
    const g = er.def.supersetGroup;
    er.superset_id = g != null && groupCounts.get(g) >= 2 ? g : null;
  }

  const durationSeconds = totalSets * 90 + 600; // ~90s/set + 10min warmup

  const startedAt = new Date(completedAtMs - durationSeconds * 1000);

  // 1. INSERT workouts.
  const { data: workoutRows, error: wErr } = await supabase
    .from('workouts')
    .insert({
      user_id: slot.accountId,
      name: workout.title,
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
      duration_seconds: durationSeconds,
      notes: '[seed]',
      image_uri: slot.photo.publicUrl,
      image_aspect_ratio: slot.photo.aspectRatio,
      image_audience: 'everyone',
      image_type: 'gallery',
      // Workout name comes from the program ("Lower", "Upper", etc.) so it's
      // NOT a user rename — leave the caption-under-card off. Same convention
      // a real user would land on if they didn't rename their workout.
      title_customized: false,
    })
    .select('id')
    .single();
  if (wErr || !workoutRows) {
    throw new Error(`workouts insert failed for ${slot.accountName}: ${wErr?.message}`);
  }
  const workoutId = workoutRows.id;

  // 2. INSERT workout_exercises. exDb is guaranteed non-null now because
  // unmatched rows were filtered above; exercise_id NOT NULL is satisfied.
  const weInsert = exerciseRows.map((er) => ({
    workout_id: workoutId,
    exercise_id: er.exDb.id,
    exercise_name: er.def.name,
    exercise_muscle: er.exDb.target_muscles?.[0] ?? er.exDb.muscle_group ?? null,
    notes: '',
    order_index: er.order_index,
    superset_id: er.superset_id,
    rest_timer_seconds: 90,
  }));
  const { data: weData, error: weErr } = await supabase
    .from('workout_exercises')
    .insert(weInsert)
    .select('id, order_index');
  if (weErr) throw new Error(`workout_exercises insert failed: ${weErr.message}`);

  // 3. INSERT workout_sets (flatten across exercises).
  const setsInsert = [];
  const byOrder = new Map(weData.map((r) => [r.order_index, r.id]));
  for (const er of exerciseRows) {
    const weId = byOrder.get(er.order_index);
    for (const s of er.sets) {
      setsInsert.push({ workout_exercise_id: weId, ...s });
    }
  }
  const { error: setsErr } = await supabase.from('workout_sets').insert(setsInsert);
  if (setsErr) throw new Error(`workout_sets insert failed: ${setsErr.message}`);

  // 4. INSERT workout_muscles aggregated from exercises target/secondary muscles.
  const muscleAccum = new Map(); // muscle → {primarySets, secondarySets}
  for (const er of exerciseRows) {
    const setsCount = er.sets.length;
    const primary = er.exDb.target_muscles ?? [];
    const secondary = er.exDb.secondary_muscles ?? [];
    for (const m of primary) {
      if (!m) continue;
      const cur = muscleAccum.get(m) ?? { primary: 0, secondary: 0 };
      cur.primary += setsCount;
      muscleAccum.set(m, cur);
    }
    for (const m of secondary) {
      if (!m) continue;
      const cur = muscleAccum.get(m) ?? { primary: 0, secondary: 0 };
      cur.secondary += setsCount;
      muscleAccum.set(m, cur);
    }
  }
  const musclesInsert = [...muscleAccum.entries()].map(([muscle, c]) => ({
    workout_id: workoutId,
    muscle,
    total_sets: c.primary + c.secondary,
    activation: c.primary >= c.secondary ? 'primary' : 'secondary',
  }));
  if (musclesInsert.length > 0) {
    const { error: mErr } = await supabase.from('workout_muscles').insert(musclesInsert);
    if (mErr) console.warn(`workout_muscles insert non-fatal failure: ${mErr.message}`);
  }

  return workoutId;
}

// -------- Main --------

async function main() {
  // Idempotency check.
  const { count, error: countErr } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })
    .eq('notes', '[seed]');
  if (countErr) throw countErr;
  if ((count ?? 0) > 0) {
    if (!FORCE) {
      console.error(`Refusing to run: ${count} existing [seed] workouts. Re-run with --force to wipe and reseed.`);
      process.exit(1);
    }
    console.log(`--force passed: deleting ${count} existing [seed] workouts...`);
    const { error: delErr } = await supabase.from('workouts').delete().eq('notes', '[seed]');
    if (delErr) throw delErr;
    console.log('Deleted.');
  }

  if (!fs.existsSync(ACCOUNTS_FILE)) {
    console.error(`Accounts manifest missing: ${ACCOUNTS_FILE}\nRun seed:accounts first.`);
    process.exit(1);
  }
  if (!fs.existsSync(PHOTOS_FILE)) {
    console.error(`Photos manifest missing: ${PHOTOS_FILE}\nRun seed:photos first.`);
    process.exit(1);
  }

  // Pre-fetch the exercise library once and build an in-memory fuzzy matcher.
  console.log('Loading exercises from DB...');
  const allExercises = await prefetchAllExercises();
  console.log(`Loaded ${allExercises.length} exercises.`);
  const matchExercise = buildExerciseMatcher(allExercises);

  const accountsRaw = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
  const photosRaw = JSON.parse(fs.readFileSync(PHOTOS_FILE, 'utf8'));

  // Build account → photo[] mapping.
  const buddyPhotos = new Map(); // buddyId → photos[]
  const extraPhotos = []; // shared pool
  for (const p of photosRaw) {
    if (p.kind === 'buddy') {
      if (!buddyPhotos.has(p.buddyId)) buddyPhotos.set(p.buddyId, []);
      buddyPhotos.get(p.buddyId).push(p);
    } else if (p.kind === 'extra') {
      extraPhotos.push(p);
    }
  }

  const extras = accountsRaw.filter((a) => a.kind === 'extra');
  const extraPerAccount = Math.floor(extraPhotos.length / extras.length);
  const extraRemainder = extraPhotos.length - extraPerAccount * extras.length;

  // Distribute extras' shared photos round-robin: first N extras get +1.
  const extraAssignment = new Map(); // extraIdx → photos[]
  let pi = 0;
  for (let i = 0; i < extras.length; i++) {
    const ex = extras[i];
    const count = extraPerAccount + (i < extraRemainder ? 1 : 0);
    extraAssignment.set(ex.extraIdx, extraPhotos.slice(pi, pi + count));
    pi += count;
  }

  // Build the assembled accounts list with their photos attached.
  const accounts = accountsRaw.map((a) => {
    let photos = [];
    if (a.kind === 'buddy') photos = buddyPhotos.get(a.buddyId) ?? [];
    else photos = extraAssignment.get(a.extraIdx) ?? [];
    return { ...a, photos };
  });

  // Load every program in src/data/programs/. planId → workouts[] (sorted W,D).
  const programMap = loadAllPrograms();
  const livePlanIds = new Set(programMap.keys());
  console.log(`Live plans (${livePlanIds.size}): ${[...livePlanIds].sort().join(', ')}`);

  // Partition accounts: those whose planId has a program file vs those who
  // don't. Stranded accounts get skipped — they'll fill in on a future
  // --force reseed once their plan ships.
  const live = [];
  const stranded = [];
  for (const a of accounts) {
    if (a.photos.length === 0) continue;
    if (livePlanIds.has(a.planId)) live.push(a);
    else stranded.push(a);
  }

  const missingPlanIds = [...new Set(stranded.map((a) => a.planId))].sort();
  console.log(`Missing plans (${missingPlanIds.length}): ${missingPlanIds.join(', ') || '(none)'}`);
  console.log(`Live accounts (${live.length}):`);
  for (const a of live) {
    console.log(`  ✓ ${a.name} (${a.kind}, ${a.planId}): ${a.photos.length} photos`);
  }
  console.log(`Skipping ${stranded.length} stranded accounts:`);
  for (const a of stranded) {
    console.log(`  - ${a.name} (${a.kind}, ${a.planId}): ${a.photos.length} photos waiting`);
  }
  const liveTotalPhotos = live.reduce((s, a) => s + a.photos.length, 0);
  const strandedTotalPhotos = stranded.reduce((s, a) => s + a.photos.length, 0);
  console.log(`Will insert ${liveTotalPhotos} workouts. Skipping ${strandedTotalPhotos} (stranded photos).`);

  // Schedule. Sequential workout-per-slot pairing happens inside buildSchedule.
  const slots = buildSchedule(live, programMap);
  const maxDay = slots.reduce((m, s) => Math.max(m, s.day), 0);
  console.log(`Generated ${slots.length} slots over ${maxDay + 1} days.`);
  const byDay = new Map();
  const extrasByDay = new Map();
  for (const s of slots) {
    byDay.set(s.day, (byDay.get(s.day) ?? 0) + 1);
    if (s.accountKind === 'extra') extrasByDay.set(s.day, (extrasByDay.get(s.day) ?? 0) + 1);
  }
  for (let d = 0; d <= maxDay; d++) {
    process.stdout.write(`day ${d + 1}: ${byDay.get(d) ?? 0}${d < maxDay ? ', ' : '\n'}`);
  }
  const maxExtras = Math.max(0, ...extrasByDay.values());
  console.log(`Max pastel-extra posts on any single day: ${maxExtras} (target: ≤1).`);

  // Anchor "day 0" to start-of-yesterday so day 0 posts have a past completed_at
  // and are immediately visible once the visibility cutoff sits at end-of-day-0.
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  baseDate.setDate(baseDate.getDate() - 1);

  const unmatched = new Map(); // exercise name → unmatched count
  let inserted = 0;
  let failed = 0;
  for (const slot of slots) {
    try {
      await insertWorkout(slot, baseDate, matchExercise, unmatched);
      inserted++;
      if (inserted % 20 === 0) console.log(`  inserted ${inserted}/${slots.length}...`);
    } catch (err) {
      failed++;
      console.warn(`  ! ${slot.accountName} day ${slot.day + 1}: ${err.message}`);
    }
  }

  console.log('---');
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped (no matching exercises): ${failed}`);

  // Always print the summary line so silent drops can't sneak through. Only
  // expand the per-name list if there's something to fix.
  const unmatchedTotal = [...unmatched.values()].reduce((a, b) => a + b, 0);
  console.log(`\nUnmatched exercise names: ${unmatched.size} unique, ${unmatchedTotal} total occurrences.`);
  if (unmatched.size > 0) {
    console.log('Rename these in src/data/programs/*.ts or add to the ALIASES table in this script:');
    const sorted = [...unmatched.entries()].sort((a, b) => b[1] - a[1]);
    for (const [name, count] of sorted) {
      console.log(`  ×${String(count).padStart(3)}  ${name}`);
    }
  }

  // Reminder about visibility cutoff (migration 071): cutoff_iso controls which
  // [seed] posts the discover feed reveals. After re-seed, you typically want
  // to advance the cutoff to end-of-day-0 so today's 27 posts go live and the
  // rest stay queued for the drip.
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0); // today 00:00 — anything dated yesterday is past the cutoff
  console.log(`\nTo make day-0 posts visible immediately (and freeze the drip):`);
  console.log(`  UPDATE app_config SET value = '${cutoff.toISOString()}' WHERE key = 'discover_visibility_cutoff_iso';`);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
