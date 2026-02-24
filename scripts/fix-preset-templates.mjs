/**
 * Fix preset template exercises by cross-referencing against Supabase DB.
 *
 * For each exercise in presetTemplates.ts, validates that:
 * - exerciseId resolves to the correct exercise in getExerciseById()
 * - gifUrl and thumbnailUrl point to the correct exercise images
 *
 * Prerequisites:
 *   .env has EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/fix-preset-templates.mjs --preview    (show mismatches, no changes)
 *   node scripts/fix-preset-templates.mjs --apply      (fix presetTemplates.ts)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODE = process.argv.includes('--apply') ? 'apply' : 'preview';

// ---------- .env ----------
const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// ---------- Manual overrides ----------
// Template exerciseName (lowercase) -> DB exercise name (lowercase) or null to skip
// These were hand-verified against actual DB names via Supabase queries.
const MANUAL_OVERRIDES = {
  // === Glutes / Hip thrusts ===
  'hip thrust machine': 'machine hip thrust',
  'hip thrust': 'barbell glute bridge',
  'hip thrusts': 'barbell glute bridge',
  'hip thrust (single leg)': 'barbell glute bridge',
  'single leg hip thrust': 'barbell glute bridge',
  'kas glute bridge': 'kas glute bridge',
  'single leg glute bridge': 'single leg bridge with outstretched leg',
  'single-leg glute bridge': 'single leg bridge with outstretched leg',
  'glute bridge': 'low glute bridge on floor',

  // === Legs ===
  'back squat': 'barbell full squat',
  'bulgarian split squats': 'bulgarian split squat',
  'hamstring curl': 'lever lying leg curl',
  'hamstring curl (lying)': 'lever lying leg curl',
  'knee extension': 'lever leg extension',
  'leg extension': 'lever leg extension',
  'leg extensions': 'lever leg extension',
  'hack squat': 'sled hack squat',
  'leg press': 'sled 45\u00b0 leg press',
  'single leg leg press': 'sled 45 degrees one leg press',
  'single leg press': 'sled 45 degrees one leg press',
  'calf raise machine': 'lever standing calf raise',
  'calf raise (smith)': 'smith standing leg calf raise',
  'single leg calf raise': 'lever standing calf raise',
  'single leg calf raises': 'lever standing calf raise',
  'heel elevated squat': 'dumbbell goblet squat',
  'goblet squat (dumbbell)': 'dumbbell goblet squat',
  'goblet squat': 'dumbbell goblet squat',
  'reverse lunge (smith)': 'dumbbell rear lunge',
  'lunge': 'dumbbell lunge',
  'lunges': 'dumbbell lunge',
  'reverse lunges': 'dumbbell rear lunge',
  'walking lunges': 'dumbbell lunge',
  'step ups': 'dumbbell step-up',
  'dumbbell step up': 'dumbbell step-up',
  'cable step ups': 'dumbbell step-up',
  'single leg box squat': 'kettlebell pistol squat',
  'pulse squats': 'quads (Bodyweight squat)',
  'banded squat': 'quads (Bodyweight squat)',
  'cossack squats': 'kettlebell pistol squat',
  'bodyweight squat': 'quads (Bodyweight squat)',
  'squats': 'quads (Bodyweight squat)',
  'sumo squat': 'smith sumo squat',

  // === Glute isolation ===
  'hip abduction': 'lever seated hip abduction',
  'hip abductions': 'lever seated hip abduction',
  'hip abduction machine': 'lever seated hip abduction',
  'cable kickbacks': 'cable kickback',
  'fire hydrants': 'fire hydrant',
  'donkey kicks': 'donkey kick',

  // === Back / Pull ===
  'lat pull down': 'cable bar lateral pulldown',
  'close grip lat pull down': 'cable bar lateral pulldown',
  'close grip pull down': 'cable bar lateral pulldown',
  'wide grip lat pull down': 'cable bar lateral pulldown',
  'straight arm pull down': 'cable straight arm pulldown',
  'bent over row': 'barbell bent over row',
  'bent over rows': 'barbell bent over row',
  'barbell bent over row': 'barbell bent over row',
  'dumbbell bent over row': 'dumbbell bent over row',
  'chest supported row': 'dumbbell incline row',
  'cable rows': 'cable seated row',
  'seated cable row': 'cable seated row',
  'single arm cable row': 'cable seated row',
  'machine row': 'lever seated row',
  'dumbbell one arm row': 'dumbbell one arm bent-over row',
  'face pull': 'face pull',
  'assisted pull ups': 'assisted pull-up',
  'pull ups (band assisted)': 'band assisted pull-up',
  'band assisted pull ups': 'band assisted pull-up',
  'back extensions': 'lever back extension',

  // === Chest / Push ===
  'chest press machine': 'lever chest press',
  'chest flies': 'dumbbell fly',
  'dumbbell bench press': 'dumbbell bench press',
  'push-ups': 'push-up',
  'push-ups (20s on/10s off)': 'push-up',
  'push ups': 'push-up',
  'diamond push-ups': 'diamond push-up',
  'pike push-ups': 'pike-to-cobra push-up',

  // === Shoulders ===
  'shoulder press': 'dumbbell seated shoulder press',
  'dumbbell shoulder press': 'dumbbell seated shoulder press',
  'shoulder press machine': 'lever shoulder press',
  'barbell shoulder press': 'barbell seated behind head military press',
  'barbell overhead press': 'barbell seated overhead press',
  'lateral raise': 'dumbbell lateral raise',
  'cable lateral raise': 'cable lateral raise',
  'lat raise (cable)': 'cable lateral raise',
  'lever lateral raise': 'lever lateral raise',
  'front raise': 'dumbbell front raise',
  'seated incline lateral raise': 'dumbbell seated lateral raise',
  'seated incline front raises': 'dumbbell front raise',
  'rear delt flies': 'dumbbell rear delt raise',
  'rear delt fly': 'dumbbell rear delt raise',
  'reverse flies': 'dumbbell rear delt raise',
  'reverse fly (db)': 'dumbbell rear delt raise',
  'bent over reverse flies': 'dumbbell rear delt raise',
  'front & lateral raise superset': 'dumbbell front raise',
  'lat & front raise superset': 'dumbbell lateral raise',
  'lateral & front raise superset': 'dumbbell lateral raise',
  'standing tricep kickbacks': 'dumbbell kickback',

  // === Arms - Biceps ===
  'bicep curl': 'dumbbell alternate biceps curl',
  'bicep curls': 'dumbbell alternate biceps curl',
  'dumbbell bicep curl': 'dumbbell biceps curl',
  'cable bicep curl': 'cable curl',
  'cable curls': 'cable curl',
  'ez bar bicep curl': 'ez barbell curl',
  'ez barbell curl': 'ez barbell curl',
  'ez barbell preacher curl': 'ez barbell close grip preacher curl',
  'preacher curl': 'barbell preacher curl',
  'hammer curl': 'dumbbell hammer curl',
  'hammer curls': 'dumbbell hammer curl',

  // === Arms - Triceps ===
  'skull crushers': 'barbell lying triceps extension skull crusher',
  'tricep dips': 'triceps dip',
  'tricep dips (chair)': 'triceps dip (bench leg)',
  'tricep pushdown': 'cable pushdown',
  'tricep push down cable': 'cable pushdown',
  'tricep cable push down': 'cable pushdown',
  'tricep single arm push down': 'cable pushdown',
  'tricep cable overhead': 'cable overhead triceps extension (rope attachment)',
  'tricep overhead cable': 'cable overhead triceps extension (rope attachment)',
  'overhead tricep extension (dumbbell)': 'cable overhead triceps extension (rope attachment)',
  'tricep kickback': 'dumbbell kickback',
  'tricep kickbacks': 'dumbbell kickback',

  // === Core ===
  'crunches': '!gif', // use the gif ID from template as exerciseId
  'cable crunches (kneeling)': 'cable kneeling crunch',
  'kneeling cable crunch': 'cable kneeling crunch',
  'hanging knee crunches': 'hanging leg raise',
  'decline sit ups': 'decline crunch',
  'reverse crunches': 'reverse crunch',
  'russian twists': 'russian twist',
  'cable rotations': 'cable twist',
  'leg raises': '!gif',
  'leg lifts into reverse crunch': 'reverse crunch',
  'double leg lifts': '!gif',
  'alternating leg lifts': '!gif',
  'ab roller': 'wheel rollout',
  'dead bugs': 'dead bug',
  'dead bugs (alternating)': 'dead bug',
  'dead bugs (double leg)': 'dead bug',
  'bird dogs': 'bird dog',
  'plank': 'front plank with twist',
  'weighted plank': 'weighted front plank',
  'plank twists': 'front plank with twist',
  'side plank': 'side plank hip adduction',
  'side plank dips': 'side plank hip adduction',
  'side plank with clam': 'side plank hip adduction',
  'table top crunches': '!gif',
  'bicycle crunches': '!gif',
  'heel taps': '!gif',
  'toe crunches': '!gif',
  'alternating toe taps': '!gif',
  'kneeling plank tap shoulders': 'kneeling plank tap shoulder',
  'isometric hold with heel taps': '!gif',
  'pallof press': null,
  'cable wood chop': 'cable twist',

  // === Compound / Full body ===
  'clean and jerk (barbell)': 'barbell clean and press',
  'standing hammer curl and press': 'dumbbell standing alternate hammer curl and press',
  'romanian deadlift': 'barbell romanian deadlift',
  'romanian deadlift (barbell)': 'barbell romanian deadlift',
  'good mornings': 'barbell good morning',
  'stiff leg deadlift (dumbbell)': 'dumbbell stiff leg deadlift',
  'single leg deadlift (dumbbell)': 'dumbbell single leg deadlift',
  'superman': 'superman push-up',
  'superman hold': 'superman push-up',

  // === Cardio / HIIT ===
  'burpees': 'burpee',
  'burpees (20s on/10s off)': 'burpee',
  'jump squats': 'jump squat',
  'jump squats (20s on/10s off)': 'jump squat',
  'high knees': 'high knee against wall',
  'high knees (20s on/10s off)': 'high knee against wall',
  'mountain climbers': 'mountain climber',
  'jumping jacks': '!gif',
  'tuck jumps': 'jump squat',
  'skater hops': '!gif',
  'lateral shuffles': null,
  'grapevine': null,
  'step touch': null,
  'marching in place': null,
  'run on spot': 'run (Equipment)',

  // === Rehab / Stretching ===
  'wall sit': '!gif',
  'wall sits': '!gif',
  'single leg bridges': 'single leg bridge with outstretched leg',
  'cat-cow stretch': '!gif',
  'hip flexor stretch': null,
  'thoracic rotation': null,
  'arm circles': null,
  "world's greatest stretch": null,
  'y prone': null,
  't prone': null,
  'crab walk': '!gif',

  // === Carry ===
  'farmers carry': null,
  'suitcase carry': null,

  // === Jump rope ===
  'jump rope (basic)': 'jump rope',
  'jump rope (high knees)': 'jump rope',
  'double unders': 'jump rope',

  // === Misc ===
  'side flexion with db': 'dumbbell side bend',
  'dumbbell side bend': 'dumbbell side bend',
  'battle ropes': null,
};

// ---------- Supabase helpers ----------

async function fetchAllExercises() {
  const all = [];
  let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/exercises?select=id,exercise_db_id,name,display_name,muscle_group,image_url,thumbnail_url&order=name&offset=${offset}&limit=1000`;
    const resp = await fetch(url, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const data = await resp.json();
    all.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all;
}

// ---------- Matching helpers ----------

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/\(female\)/g, '')
    .replace(/\(back pov\)/g, '')
    .replace(/\(side pov\)/g, '')
    .replace(/v\.\s*\d+/g, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildIndexes(exercises) {
  const byName = new Map();
  const byDisplayName = new Map();
  const byExerciseDbId = new Map();
  const byUuid = new Map();

  for (const ex of exercises) {
    const lowerName = ex.name.toLowerCase();
    if (!byName.has(lowerName) || (ex.image_url && !byName.get(lowerName).image_url)) {
      byName.set(lowerName, ex);
    }

    if (ex.display_name) {
      const lowerDisplay = ex.display_name.toLowerCase();
      if (!byDisplayName.has(lowerDisplay) || (ex.image_url && !byDisplayName.get(lowerDisplay).image_url)) {
        byDisplayName.set(lowerDisplay, ex);
      }
    }

    if (ex.exercise_db_id) {
      byExerciseDbId.set(ex.exercise_db_id, ex);
    }

    byUuid.set(ex.id, ex);
  }

  return { byName, byDisplayName, byExerciseDbId, byUuid };
}

function extractGifId(gifUrl) {
  if (!gifUrl) return null;
  const match = gifUrl.match(/\/(\d{4})\.gif/);
  return match ? match[1] : null;
}

function findBestMatch(exerciseName, gifUrl, indexes, exercises) {
  const lower = exerciseName.toLowerCase().trim();

  // 0. Manual override
  if (lower in MANUAL_OVERRIDES) {
    const target = MANUAL_OVERRIDES[lower];
    if (target === null) return { match: null, method: 'manual-skip' };
    if (target === '!gif') {
      // Use the exercise_db_id from the current GIF URL
      const gifId = extractGifId(gifUrl);
      if (gifId && indexes.byExerciseDbId.has(gifId)) {
        return { match: indexes.byExerciseDbId.get(gifId), method: 'gif-id-override' };
      }
      return { match: null, method: 'gif-id-miss' };
    }
    const found = indexes.byName.get(target.toLowerCase());
    if (found) return { match: found, method: 'manual-override' };
    // Try case-insensitive partial
    for (const ex of exercises) {
      if (ex.name.toLowerCase() === target.toLowerCase()) return { match: ex, method: 'manual-override-ci' };
    }
    return { match: null, method: 'manual-override-miss:' + target };
  }

  // 1. Exact name match (case-insensitive)
  if (indexes.byName.has(lower)) {
    return { match: indexes.byName.get(lower), method: 'exact-name' };
  }

  // 2. Display name match
  if (indexes.byDisplayName.has(lower)) {
    return { match: indexes.byDisplayName.get(lower), method: 'display-name' };
  }

  // 3. Try extracting exercise_db_id from GIF URL and using that
  const gifId = extractGifId(gifUrl);
  if (gifId && indexes.byExerciseDbId.has(gifId)) {
    return { match: indexes.byExerciseDbId.get(gifId), method: 'gif-id-fallback' };
  }

  return { match: null, method: 'no-match' };
}

// ---------- Template parsing ----------

function parseTemplateExercises(content) {
  const exercises = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const exerciseIdMatch = lines[i].match(/exerciseId:\s*'([^']+)'/);
    if (!exerciseIdMatch) continue;

    const exerciseId = exerciseIdMatch[1];
    const exerciseIdLine = i;

    let exerciseName = '';
    let exerciseNameLine = -1;
    for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
      const nameMatch = lines[j].match(/exerciseName:\s*'([^']+)'/);
      if (nameMatch) {
        exerciseName = nameMatch[1];
        exerciseNameLine = j;
        break;
      }
    }

    let gifUrl = '';
    let gifUrlLine = -1;
    for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
      if (lines[j].includes('gifUrl:')) {
        // Check for null value
        const nullMatch = lines[j].match(/gifUrl:\s*null/);
        if (nullMatch) {
          gifUrl = null;
          gifUrlLine = j;
          break;
        }
        // Value might be on same line or next line
        const sameLineMatch = lines[j].match(/gifUrl:\s*'([^']+)'/);
        if (sameLineMatch) {
          gifUrl = sameLineMatch[1];
          gifUrlLine = j;
          break;
        }
        const nextLine = lines[j + 1];
        if (nextLine) {
          const urlMatch = nextLine.match(/'([^']+)'/);
          if (urlMatch) {
            gifUrl = urlMatch[1];
            gifUrlLine = j + 1;
            break;
          }
        }
      }
    }

    let thumbnailUrl = '';
    let thumbnailUrlLine = -1;
    for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
      if (lines[j].includes('thumbnailUrl:')) {
        // Check for null value
        const nullMatch = lines[j].match(/thumbnailUrl:\s*null/);
        if (nullMatch) {
          thumbnailUrl = null;
          thumbnailUrlLine = j;
          break;
        }
        const sameLineMatch = lines[j].match(/thumbnailUrl:\s*'([^']+)'/);
        if (sameLineMatch) {
          thumbnailUrl = sameLineMatch[1];
          thumbnailUrlLine = j;
          break;
        }
        const nextLine = lines[j + 1];
        if (nextLine) {
          const urlMatch = nextLine.match(/'([^']+)'/);
          if (urlMatch) {
            thumbnailUrl = urlMatch[1];
            thumbnailUrlLine = j + 1;
            break;
          }
        }
      }
    }

    exercises.push({
      exerciseId,
      exerciseName,
      gifUrl,
      thumbnailUrl,
      exerciseIdLine,
      exerciseNameLine,
      gifUrlLine,
      thumbnailUrlLine,
    });
  }

  return exercises;
}

// ---------- Correction logic ----------

function getCorrectExerciseId(dbExercise) {
  return dbExercise.id;
}

function getCorrectGifUrl(dbExercise) {
  return dbExercise.image_url || '';
}

function getCorrectThumbnailUrl(dbExercise) {
  return dbExercise.thumbnail_url || '';
}

// ---------- Apply corrections ----------

function applyCorrections(content, corrections) {
  const lines = content.split('\n');

  for (const corr of corrections) {
    // Update exerciseId
    if (corr.newExerciseId && corr.exerciseIdLine >= 0) {
      lines[corr.exerciseIdLine] = lines[corr.exerciseIdLine].replace(
        `'${corr.oldExerciseId}'`,
        `'${corr.newExerciseId}'`
      );
    }

    // Update gifUrl
    if (corr.newGifUrl !== undefined && corr.gifUrlLine >= 0) {
      if (corr.oldGifUrl === null) {
        // Replace null with URL string (preserve indentation)
        const indent = lines[corr.gifUrlLine].match(/^(\s*)/)[1];
        lines[corr.gifUrlLine] = `${indent}gifUrl:\n${indent}  '${corr.newGifUrl}',`;
      } else if (corr.oldGifUrl) {
        lines[corr.gifUrlLine] = lines[corr.gifUrlLine].replace(
          `'${corr.oldGifUrl}'`,
          `'${corr.newGifUrl}'`
        );
      }
    }

    // Update thumbnailUrl
    if (corr.newThumbnailUrl !== undefined && corr.thumbnailUrlLine >= 0) {
      if (corr.oldThumbnailUrl === null) {
        // Replace null with URL string (preserve indentation)
        const indent = lines[corr.thumbnailUrlLine].match(/^(\s*)/)[1];
        lines[corr.thumbnailUrlLine] = `${indent}thumbnailUrl:\n${indent}  '${corr.newThumbnailUrl}',`;
      } else if (corr.oldThumbnailUrl) {
        lines[corr.thumbnailUrlLine] = lines[corr.thumbnailUrlLine].replace(
          `'${corr.oldThumbnailUrl}'`,
          `'${corr.newThumbnailUrl}'`
        );
      }
    }
  }

  return lines.join('\n');
}

// ---------- Main ----------

console.log(`Mode: ${MODE}`);
console.log(`Supabase: ${SUPABASE_URL}`);
console.log('');

console.log('Fetching all exercises from Supabase...');
const exercises = await fetchAllExercises();
console.log(`Total exercises in DB: ${exercises.length}`);
console.log('');

const indexes = buildIndexes(exercises);

const templatePath = resolve(__dirname, '..', 'src', 'stores', 'presetTemplates.ts');
const templateContent = readFileSync(templatePath, 'utf-8');
const templateExercises = parseTemplateExercises(templateContent);
console.log(`Template exercises found: ${templateExercises.length}`);
console.log('');

const corrections = [];
const alreadyCorrect = [];
const skipped = [];
const unmatched = [];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

for (const tmplEx of templateExercises) {
  let match = null;
  let method = '';

  // For exercises that already have a valid UUID, look them up directly
  if (UUID_RE.test(tmplEx.exerciseId)) {
    const dbEx = indexes.byUuid.get(tmplEx.exerciseId);
    if (dbEx) {
      match = dbEx;
      method = 'uuid-lookup';
    }
  }

  // Fall back to name-based matching (for preset-* IDs or UUID not found)
  if (!match) {
    const result = findBestMatch(tmplEx.exerciseName, tmplEx.gifUrl, indexes, exercises);
    match = result.match;
    method = result.method;
  }

  if (method === 'manual-skip') {
    skipped.push({ ...tmplEx, method });
    continue;
  }

  if (!match) {
    unmatched.push({ ...tmplEx, method });
    continue;
  }

  const correctId = getCorrectExerciseId(match);
  const correctGif = getCorrectGifUrl(match);
  const correctThumb = getCorrectThumbnailUrl(match);

  const idChanged = tmplEx.exerciseId !== correctId;
  const gifChanged = correctGif && tmplEx.gifUrl !== correctGif;
  const thumbChanged = correctThumb && tmplEx.thumbnailUrl !== correctThumb;

  if (!idChanged && !gifChanged && !thumbChanged) {
    alreadyCorrect.push({ ...tmplEx, match, method });
    continue;
  }

  corrections.push({
    exerciseName: tmplEx.exerciseName,
    oldExerciseId: tmplEx.exerciseId,
    newExerciseId: idChanged ? correctId : null,
    oldGifUrl: tmplEx.gifUrl,
    newGifUrl: gifChanged ? correctGif : undefined,
    oldThumbnailUrl: tmplEx.thumbnailUrl,
    newThumbnailUrl: thumbChanged ? correctThumb : undefined,
    exerciseIdLine: tmplEx.exerciseIdLine,
    gifUrlLine: tmplEx.gifUrlLine,
    thumbnailUrlLine: tmplEx.thumbnailUrlLine,
    dbName: match.name,
    dbId: match.exercise_db_id,
    method,
  });
}

// ---------- Report ----------

console.log('=== Results ===');
console.log(`Already correct: ${alreadyCorrect.length}`);
console.log(`Need correction: ${corrections.length}`);
console.log(`Skipped (no DB equivalent): ${skipped.length}`);
console.log(`Unmatched (needs manual override): ${unmatched.length}`);
console.log('');

if (corrections.length > 0) {
  console.log('=== Corrections ===');
  for (const c of corrections) {
    console.log(`  "${c.exerciseName}" (${c.method})`);
    console.log(`    DB: "${c.dbName}" (${c.dbId || 'custom'})`);
    if (c.newExerciseId) {
      console.log(`    exerciseId: ${c.oldExerciseId} -> ${c.newExerciseId}`);
    }
    if (c.newGifUrl !== undefined) {
      const oldId = c.oldGifUrl ? (c.oldGifUrl.match(/\/(\d{4})\./)?.[1] || '?') : 'null';
      const newId = c.newGifUrl ? (c.newGifUrl.match(/\/(\d{4})\./)?.[1] || '?') : 'null';
      console.log(`    gifUrl: ${oldId === 'null' ? 'null' : `...${oldId}.gif`} -> ${newId === 'null' ? 'null' : `...${newId}.gif`}`);
    }
    if (c.newThumbnailUrl !== undefined) {
      const oldId = c.oldThumbnailUrl ? (c.oldThumbnailUrl.match(/\/(\d{4})\./)?.[1] || '?') : 'null';
      const newId = c.newThumbnailUrl ? (c.newThumbnailUrl.match(/\/(\d{4})\./)?.[1] || '?') : 'null';
      console.log(`    thumbnailUrl: ${oldId === 'null' ? 'null' : `...${oldId}.png`} -> ${newId === 'null' ? 'null' : `...${newId}.png`}`);
    }
  }
  console.log('');
}

if (skipped.length > 0) {
  console.log('=== Skipped (no DB equivalent) ===');
  const uniqueSkipped = [...new Set(skipped.map(s => s.exerciseName))];
  for (const name of uniqueSkipped) {
    console.log(`  "${name}"`);
  }
  console.log('');
}

if (unmatched.length > 0) {
  console.log('=== UNMATCHED (need manual overrides) ===');
  for (const u of unmatched) {
    console.log(`  "${u.exerciseName}" (${u.method})`);
    console.log(`    current exerciseId: ${u.exerciseId}`);
    console.log(`    current gifUrl: ${u.gifUrl}`);
  }
  console.log('');
}

// ---------- Apply ----------

if (MODE === 'apply' && corrections.length > 0) {
  console.log('Applying corrections to presetTemplates.ts...');
  const corrected = applyCorrections(templateContent, corrections);
  writeFileSync(templatePath, corrected, 'utf-8');
  console.log('Done! File updated.');
} else if (MODE === 'preview') {
  console.log('Preview mode. Use --apply to write changes.');
}

console.log('');
console.log('=== Summary ===');
console.log(`Total template exercises: ${templateExercises.length}`);
console.log(`Already correct: ${alreadyCorrect.length}`);
console.log(`Corrected: ${corrections.length}`);
console.log(`Skipped (no equivalent): ${skipped.length}`);
console.log(`Unmatched: ${unmatched.length}`);
