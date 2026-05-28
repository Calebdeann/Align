#!/usr/bin/env node
/**
 * Applies the It Girl exercise edits from the user's doc:
 *   - display_name renames
 *   - default_note (placeholder coaching note shown in the workout tracker)
 *   - instructions_array fixes (full replacements + targeted string edits)
 *   - one delete (Face pull (band) — duplicate of half kneeling face pull)
 *
 * Each edit looks up the exercise by current display_name (case-insensitive,
 * with a fallback to the lowercase `name` column). Run AFTER the migration
 * `075_add_exercise_default_note.sql` is applied.
 *
 * Run with:
 *   node scripts/apply-itgirl-exercise-edits.mjs
 */
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
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

// ── Full-text instruction blocks the doc provided verbatim ─────────────────────

const SINGLE_ARM_ROW_STEPS = [
  'Place one knee and the same-side hand on a bench.',
  'Plant your other foot firmly on the ground beside the bench.',
  'Hold a dumbbell in your free hand with your arm extended toward the floor.',
  'Keep your back flat and chest up.',
  'Pull the dumbbell toward your hip by driving your elbow back.',
  'Lower the dumbbell slowly back to the starting position.',
  'Repeat for the desired number of repetitions, then switch sides.',
];

const SUMO_SQUAT_STEPS = [
  'Stand with your feet wider than shoulder-width apart and your toes pointed slightly outward.',
  'Hold a dumbbell at chest height or with your arms extended toward the ground.',
  'Keep your chest up and your back straight.',
  'Lower your body by bending your knees and pushing your hips back.',
  'Lower yourself until your thighs are parallel to the ground or as low as comfortable.',
  'Push through your heels to return to the starting position.',
  'Repeat for the desired number of repetitions.',
];

const STEP_UP_CABLE_STEPS = [
  'Set up a bench or box in front of a cable machine.',
  'Attach a handle to the lowest setting on the cable machine.',
  'Stand with one foot on the bench and hold onto the machine (to stabilise only, not to pull yourself up).',
  'Have a slight forward lean in your torso and hinge at the hips, keeping your shins vertical the whole time.',
  'Drive through the foot on the bench to a near standing position.',
  'Slowly lower back down, only tapping the back foot on the floor before driving back up.',
  'Repeat for the desired number of repetitions.',
  'Swap legs and repeat.',
];

// ── Edits ───────────────────────────────────────────────────────────────────────
// Each entry: { lookup, rename?, default_note?, instructions_array?, copy_instructions_from?,
//               replace_step_1?, description_replacements?, delete? }

const edits = [
  // ── Renames only ─────────────────────────────────────────────────────────────
  { lookup: 'Cross over lateral pull down (cable)', rename: 'Wide-grip lat pulldown (cable)' },
  { lookup: '21s bicep curl', rename: 'Standing bicep curl (dumbbell)' },
  { lookup: 'Incline pushdown (cable)', rename: 'Triceps pushdown' },
  { lookup: 'Straight arm pull down (rope)', rename: 'Straight arm pulldown (cable)' },
  {
    lookup: 'Seated overhead triceps extension (barbell)',
    rename: 'Overhead tricep extension (cable)',
  },
  { lookup: 'Band pullaparts', rename: 'Seated reverse fly (machine)' },
  { lookup: 'Goblet squat', rename: 'Goblet squat (dumbbell)' },
  { lookup: 'Lateral raise crossovers (cable)', rename: 'Single arm lateral raise (cable)' },
  { lookup: 'Single leg press (horizontal)', rename: 'Leg press' },

  // ── Rename + note + full new description ─────────────────────────────────────
  {
    lookup: 'Step up (dumbbell)',
    rename: 'Step up (cable)',
    instructions_array: STEP_UP_CABLE_STEPS,
    default_note:
      'These can be done on a bench using a dumbbell, smith machine, cable machine or barbell.',
  },

  // ── Rename + copy description from the (dumbbell) variant ────────────────────
  // The current "Bulgarian split squat" has a description that actually describes
  // a regular squat. The dumbbell variant ("Bulgarian split squat (dumbbells)")
  // has the correct one — copy it across, then rename the basic one.
  {
    lookup: 'Bulgarian split squat',
    rename: 'Bulgarian split squat (dumbbell)',
    copy_instructions_from: ['Bulgarian split squat (dumbbells)', 'Bulgarian split squat (dumbbell)'],
  },

  // ── Rename + note + targeted text fixes ──────────────────────────────────────
  // Description currently mentions "straight bar" / "upper abdo or chest";
  // should be "rope" / "face". Lookup matches the half-symbol or "1/2" form.
  {
    lookup: ['½ kneeling face pull', '1/2 kneeling face pull', 'Half kneeling face pull'],
    rename: 'Half kneeling face pull',
    default_note: 'This can be done sitting if more comfortable.',
    description_replacements: [
      [/straight bar/gi, 'rope'],
      [/upper abdo(?:men)? or chest/gi, 'face'],
      [/upper abdo(?:men)?/gi, 'face'],
    ],
  },

  // ── Notes only (no rename, no description change) ────────────────────────────
  {
    lookup: 'Hip thrusts',
    default_note:
      'These can be done with a barbell, smith machine or hip thrust machine if your gym has one.',
  },
  {
    lookup: 'Walking lunges',
    default_note: 'Increase difficulty by holding a dumbbell or kettlebell in each hand.',
  },
  {
    lookup: ['Back extension (hyperextension)', 'Back extension'],
    default_note: 'Hold onto a plate or dumbbell at your chest to increase difficulty.',
  },
  {
    lookup: 'Lunge (barbell)',
    default_note: 'This can be done with a barbell or smith machine.',
  },

  // ── Targeted step-1 replacement ──────────────────────────────────────────────
  {
    lookup: 'Hack squat',
    replace_step_1: 'Position yourself with your back against the pad.',
  },

  // ── Full new description (verbatim from doc) ─────────────────────────────────
  { lookup: 'Single arm dumbbell row', instructions_array: SINGLE_ARM_ROW_STEPS },
  { lookup: 'Sumo squat', instructions_array: SUMO_SQUAT_STEPS },

  // ── Copy description from another exercise ───────────────────────────────────
  // "Bicep curl (barbell)" has no description. Doc says: make it the same as
  // "21s bicep curl" (which we rename, but copy is done before that takes effect
  // since we read the source by current name from the cached list).
  {
    lookup: 'Bicep curl (barbell)',
    copy_instructions_from: ['21s bicep curl', 'Standing bicep curl (dumbbell)'],
  },

  // ── Delete ───────────────────────────────────────────────────────────────────
  // Face pull (band) is a duplicate of the half-kneeling one per user — drop it.
  { lookup: 'Face pull (band)', delete: true },
];

// ── Helpers ─────────────────────────────────────────────────────────────────────

function normalise(s) {
  if (!s) return '';
  return s
    .toString()
    .toLowerCase()
    .replace(/½/g, '1/2')
    .replace(/\s+/g, ' ')
    .trim();
}

function findExercise(all, lookup) {
  const candidates = Array.isArray(lookup) ? lookup : [lookup];
  for (const cand of candidates) {
    const target = normalise(cand);
    const hit = all.find(
      (e) => normalise(e.display_name) === target || normalise(e.name) === target
    );
    if (hit) return hit;
  }
  return null;
}

async function fetchAllExercises() {
  const out = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/exercises?select=id,name,display_name,instructions_array&order=name.asc&limit=${PAGE}&offset=${offset}`,
      { headers: { ...headers, Prefer: 'count=exact' } }
    );
    if (!resp.ok) {
      throw new Error(`Failed to fetch exercises: ${resp.status} ${await resp.text()}`);
    }
    const data = await resp.json();
    out.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

async function patchExercise(id, patch) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/exercises?id=eq.${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patch),
  });
  if (!resp.ok) throw new Error(`PATCH ${id}: ${resp.status} ${await resp.text()}`);
}

async function deleteExercise(id) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/exercises?id=eq.${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!resp.ok) throw new Error(`DELETE ${id}: ${resp.status} ${await resp.text()}`);
}

// ── Main ────────────────────────────────────────────────────────────────────────

async function run() {
  console.log('Fetching all exercises…');
  const all = await fetchAllExercises();
  console.log(`  loaded ${all.length} exercises\n`);

  const successes = [];
  const failures = [];

  for (const edit of edits) {
    const lookupLabel = Array.isArray(edit.lookup) ? edit.lookup[0] : edit.lookup;
    const match = findExercise(all, edit.lookup);
    if (!match) {
      failures.push({ lookup: lookupLabel, reason: 'no match in exercises table' });
      continue;
    }

    try {
      if (edit.delete) {
        await deleteExercise(match.id);
        successes.push(`✗ deleted: ${lookupLabel} (${match.id})`);
        continue;
      }

      const patch = {};
      if (edit.rename) patch.display_name = edit.rename;
      if (edit.default_note !== undefined) patch.default_note = edit.default_note;
      if (edit.instructions_array) patch.instructions_array = edit.instructions_array;

      if (edit.copy_instructions_from) {
        const source = findExercise(all, edit.copy_instructions_from);
        if (!source) {
          failures.push({
            lookup: lookupLabel,
            reason: `copy source not found: ${JSON.stringify(edit.copy_instructions_from)}`,
          });
          continue;
        }
        if (!source.instructions_array || source.instructions_array.length === 0) {
          failures.push({
            lookup: lookupLabel,
            reason: `copy source "${source.display_name || source.name}" has no instructions_array`,
          });
          continue;
        }
        patch.instructions_array = source.instructions_array;
      }

      if (edit.replace_step_1) {
        const current = match.instructions_array || [];
        if (current.length === 0) {
          failures.push({
            lookup: lookupLabel,
            reason: 'replace_step_1 requested but exercise has no instructions_array',
          });
          continue;
        }
        patch.instructions_array = [edit.replace_step_1, ...current.slice(1)];
      }

      if (edit.description_replacements) {
        const current = match.instructions_array || [];
        if (current.length === 0) {
          failures.push({
            lookup: lookupLabel,
            reason: 'description_replacements requested but exercise has no instructions_array',
          });
          continue;
        }
        patch.instructions_array = current.map((step) => {
          let s = step;
          for (const [find, replace] of edit.description_replacements) {
            s = s.replace(find, replace);
          }
          return s;
        });
      }

      if (Object.keys(patch).length === 0) {
        failures.push({ lookup: lookupLabel, reason: 'nothing to patch' });
        continue;
      }

      await patchExercise(match.id, patch);
      const fields = Object.keys(patch).join(', ');
      successes.push(`✓ ${lookupLabel} (${match.id}) → updated: ${fields}`);
    } catch (err) {
      failures.push({ lookup: lookupLabel, reason: err.message });
    }
  }

  console.log('\n──────── RESULTS ────────');
  for (const s of successes) console.log(s);
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  ✗ ${f.lookup}: ${f.reason}`);
  }
  console.log(`\n${successes.length} succeeded, ${failures.length} failed.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
