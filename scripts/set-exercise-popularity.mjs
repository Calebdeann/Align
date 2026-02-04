/**
 * Set popularity scores for exercises based on how commonly they are used.
 *
 * Popularity scores (1-5) affect search ranking as a tiebreaker when
 * relevance scores are equal. Higher popularity = appears first.
 *
 * Scoring tiers:
 *   5 = Staple exercises (bench press, squat, hip thrust, deadlift, etc.)
 *   4 = Very popular variations (incline press, front squat, sumo deadlift)
 *   3 = Common exercises (cable fly, leg press, lat raise)
 *   2 = Used regularly (preacher curl, close grip bench, hack squat)
 *   1 = Known but less common (wrist curl, reverse fly, sissy squat)
 *
 * Usage:
 *   node scripts/set-exercise-popularity.mjs --preview   # Show what would change
 *   node scripts/set-exercise-popularity.mjs --apply      # Push to Supabase
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
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const mode = process.argv[2];
if (!mode || !['--preview', '--apply'].includes(mode)) {
  console.error('Usage: node scripts/set-exercise-popularity.mjs [--preview | --apply]');
  process.exit(1);
}

// ---------- Popularity rules ----------
// Each rule: { match: regex on exercise name, popularity: 1-5 }
// Rules are checked in order; first match wins.
// More specific patterns should come before general ones.
const POPULARITY_RULES = [
  // ===== TIER 5: Staple exercises =====
  // Compound movements and essential isolation exercises
  { match: /\bhip thrust\b/i, popularity: 5 },
  { match: /\bglute bridge\b.*\bbarbell\b|\bbarbell\b.*\bglute bridge\b/i, popularity: 5 },
  { match: /\bbench press\b/i, popularity: 5 },
  { match: /\bsquat\b/i, notMatch: /pistol|sissy|split|goblet|hack|zercher|overhead/i, popularity: 5 },
  { match: /\bdeadlift\b/i, notMatch: /single|one/i, popularity: 5 },
  { match: /\blat pulldown\b/i, popularity: 5 },
  { match: /\bshoulder press\b|\bmilitary press\b|\boverhead press\b/i, popularity: 5 },
  { match: /\blateral raise\b|\bside raise\b/i, popularity: 5 },
  { match: /\bbicep curl\b|\bbiceps curl\b|\bdumbbell curl\b|\bbarbell curl\b/i, popularity: 5 },
  { match: /\btricep pushdown\b|\btriceps pushdown\b/i, popularity: 5 },
  { match: /\bleg press\b/i, popularity: 5 },
  { match: /\bleg curl\b|\bhamstring curl\b/i, popularity: 5 },
  { match: /\bleg extension\b/i, popularity: 5 },
  { match: /\bpull[- ]?up\b/i, notMatch: /inverted|muscle/i, popularity: 5 },
  { match: /\bpush[- ]?up\b/i, notMatch: /hindu|diamond|pike|archer|clap|plyometric|explosive|typewriter|bosu/i, popularity: 5 },
  { match: /\brow\b.*\b(barbell|dumbbell|cable|seated|bent over)\b|\b(barbell|dumbbell|cable|seated|bent over)\b.*\brow\b/i, popularity: 5 },
  { match: /\bcalf raise\b/i, notMatch: /single leg|donkey/i, popularity: 5 },
  { match: /\bplank\b/i, notMatch: /side|reverse|hip/i, popularity: 5 },
  { match: /\blunge\b/i, notMatch: /curtsy|lateral|clock/i, popularity: 5 },
  { match: /\bcrunch\b/i, notMatch: /bicycle|oblique|reverse|cross|twisting/i, popularity: 5 },
  { match: /\bhip abduction\b.*\bmachine\b|\bmachine\b.*\bhip abduction\b|\blever\b.*\bhip abduction\b/i, popularity: 5 },
  { match: /\bhip adduction\b.*\bmachine\b|\bmachine\b.*\bhip adduction\b|\blever\b.*\bhip adduction\b/i, popularity: 5 },
  { match: /\bface pull\b/i, popularity: 5 },
  { match: /\bcable fly\b|\bcable flye\b/i, popularity: 5 },
  { match: /\bchest press\b.*\bmachine\b|\blever\b.*\bchest press\b/i, popularity: 5 },
  { match: /\bseated row\b.*\b(cable|machine)\b|\b(cable|machine)\b.*\bseated row\b|\blever\b.*\bseated row\b/i, popularity: 5 },

  // ===== TIER 4: Very popular variations =====
  { match: /\bincline\b.*\bpress\b/i, popularity: 4 },
  { match: /\bdecline\b.*\bpress\b/i, popularity: 4 },
  { match: /\bfront squat\b/i, popularity: 4 },
  { match: /\bgoblet squat\b/i, popularity: 4 },
  { match: /\bsplit squat\b|\bbulgarian\b/i, popularity: 4 },
  { match: /\bromanian deadlift\b|\brdl\b|\bstiff leg deadlift\b/i, popularity: 4 },
  { match: /\bsumo deadlift\b/i, popularity: 4 },
  { match: /\bchin[- ]?up\b/i, popularity: 4 },
  { match: /\bdip\b|\bdips\b/i, notMatch: /hip/i, popularity: 4 },
  { match: /\bskull crusher\b/i, popularity: 4 },
  { match: /\btricep extension\b|\btriceps extension\b/i, popularity: 4 },
  { match: /\bhammer curl\b/i, popularity: 4 },
  { match: /\bpreacher curl\b/i, popularity: 4 },
  { match: /\bfront raise\b/i, popularity: 4 },
  { match: /\brear delt\b/i, popularity: 4 },
  { match: /\bglute bridge\b/i, notMatch: /barbell/i, popularity: 4 },
  { match: /\bdumbbell fly\b|\bdumbbell flye\b/i, popularity: 4 },
  { match: /\bback extension\b|\bhyperextension\b/i, popularity: 4 },
  { match: /\bshrug\b/i, popularity: 4 },
  { match: /\bleg raise\b/i, popularity: 4 },
  { match: /\bgood morning\b/i, popularity: 4 },
  { match: /\bkettlebell swing\b/i, popularity: 4 },
  { match: /\bglute kickback\b|\bcable kickback\b/i, popularity: 4 },
  { match: /\bcable pulldown\b/i, popularity: 4 },
  { match: /\bcable row\b/i, popularity: 4 },
  { match: /\bbicycle crunch\b/i, popularity: 4 },
  { match: /\brussian twist\b/i, popularity: 4 },
  { match: /\bstep[- ]?up\b/i, popularity: 4 },
  { match: /\bconcentration curl\b/i, popularity: 4 },
  { match: /\bincline curl\b/i, popularity: 4 },
  { match: /\bpull[- ]?over\b/i, popularity: 4 },
  { match: /\bhip thrust\b/i, popularity: 4 },
  { match: /\bt[- ]?bar row\b/i, popularity: 4 },
  { match: /\bcable curl\b/i, popularity: 4 },

  // ===== TIER 3: Common exercises =====
  { match: /\bhack squat\b/i, popularity: 3 },
  { match: /\bsissy squat\b/i, popularity: 3 },
  { match: /\bpistol squat\b|\bsingle leg squat\b/i, popularity: 3 },
  { match: /\bcurtsy lunge\b/i, popularity: 3 },
  { match: /\blateral lunge\b|\bside lunge\b/i, popularity: 3 },
  { match: /\bmountain climber\b/i, popularity: 3 },
  { match: /\bburpee\b/i, popularity: 3 },
  { match: /\bjump\b.*\bsquat\b|\bsquat\b.*\bjump\b/i, popularity: 3 },
  { match: /\bpull[- ]?through\b/i, popularity: 3 },
  { match: /\bclose[- ]?grip\b.*\bpress\b/i, popularity: 3 },
  { match: /\btricep kickback\b/i, popularity: 3 },
  { match: /\bpec deck\b|\bpec fly\b/i, popularity: 3 },
  { match: /\breverse fly\b|\breverse flye\b/i, popularity: 3 },
  { match: /\bupright row\b/i, popularity: 3 },
  { match: /\bwrist curl\b/i, popularity: 3 },
  { match: /\bsit[- ]?up\b/i, popularity: 3 },
  { match: /\bside plank\b/i, popularity: 3 },
  { match: /\bv[- ]?up\b/i, popularity: 3 },
  { match: /\bwood\s*chop\b/i, popularity: 3 },
  { match: /\bknee raise\b/i, popularity: 3 },
  { match: /\bhip extension\b/i, popularity: 3 },
  { match: /\bpulldown\b/i, popularity: 3 },
  { match: /\bpelvic tilt\b/i, popularity: 3 },
  { match: /\bsingle leg bridge\b/i, popularity: 3 },
  { match: /\bdrag curl\b/i, popularity: 3 },
  { match: /\bab\s*wheel\b|\brollout\b/i, popularity: 3 },
  { match: /\bnordic\b.*\bcurl\b/i, popularity: 3 },
  { match: /\bglute[- ]?ham raise\b/i, popularity: 3 },
  { match: /\bcable crossover\b/i, popularity: 3 },
  { match: /\band pull apart\b|\bband pull[- ]apart\b/i, popularity: 3 },
  { match: /\breverse crunch\b/i, popularity: 3 },
  { match: /\boblique\b/i, popularity: 3 },
  { match: /\bpallof\b/i, popularity: 3 },
  { match: /\breverse lunge\b/i, popularity: 3 },
  { match: /\bwalking lunge\b/i, popularity: 3 },
  { match: /\bdonkey kick\b/i, popularity: 3 },
  { match: /\bfire hydrant\b/i, popularity: 3 },
  { match: /\bclamshell\b|\bclam\b/i, popularity: 3 },
  { match: /\bhip circle\b/i, popularity: 3 },
  { match: /\bdead bug\b/i, popularity: 3 },
  { match: /\bbird\s*dog\b/i, popularity: 3 },
  { match: /\bsingle leg\b.*\bdeadlift\b/i, popularity: 3 },
  { match: /\bface down\b.*\bfly\b|\bprone\b.*\bfly\b/i, popularity: 3 },

  // ===== TIER 2: Used regularly =====
  { match: /\brack pull\b/i, popularity: 2 },
  { match: /\bzercher\b/i, popularity: 2 },
  { match: /\bclean\b/i, notMatch: /floor|room|clean up/i, popularity: 2 },
  { match: /\bsnatch\b/i, popularity: 2 },
  { match: /\bjerk\b/i, notMatch: /knee/i, popularity: 2 },
  { match: /\bcross[- ]?body\b/i, popularity: 2 },
  { match: /\breverse\b.*\bcurl\b/i, popularity: 2 },
  { match: /\bscott curl\b/i, popularity: 2 },
  { match: /\bspider curl\b/i, popularity: 2 },
  { match: /\bdiamond\b.*\bpush[- ]?up\b/i, popularity: 2 },
  { match: /\bpike\b.*\bpush[- ]?up\b/i, popularity: 2 },
  { match: /\bserratus\b/i, popularity: 2 },
  { match: /\blandmine\b/i, popularity: 2 },
  { match: /\btrap bar\b|\bhex bar\b/i, popularity: 2 },
  { match: /\bsmith\b/i, popularity: 2 },
  { match: /\bfrog\b.*\bpump\b/i, popularity: 2 },
  { match: /\bbooty\b/i, popularity: 2 },
  { match: /\breverse hyper\b/i, popularity: 2 },
  { match: /\bseated\b.*\bcalf\b|\bcalf\b.*\bseated\b/i, popularity: 2 },
  { match: /\bsuper\s*man\b/i, popularity: 2 },
  { match: /\bflutter kick\b/i, popularity: 2 },
  { match: /\btoe touch\b/i, popularity: 2 },
  { match: /\by[- ]?raise\b/i, popularity: 2 },
  { match: /\boverhead squat\b/i, popularity: 2 },
  { match: /\bheel touch\b|\bheel toucher\b/i, popularity: 2 },
  { match: /\barcher\b/i, popularity: 2 },
  { match: /\bbench dip\b/i, popularity: 2 },
  { match: /\bcable cross\b/i, popularity: 2 },

  // ===== TIER 1: Known but less common =====
  { match: /\bzottman\b/i, popularity: 1 },
  { match: /\bjefferson\b/i, popularity: 1 },
  { match: /\bhigh pull\b/i, popularity: 1 },
  { match: /\bwindmill\b/i, popularity: 1 },
  { match: /\btoe raise\b/i, popularity: 1 },
  { match: /\binchworm\b/i, popularity: 1 },
  { match: /\bfrog\b/i, notMatch: /pump/i, popularity: 1 },
  { match: /\bscissor\b/i, popularity: 1 },
  { match: /\bjack\s*knife\b/i, popularity: 1 },
  { match: /\bmorning\b/i, popularity: 1 },
  { match: /\bstretch\b/i, popularity: 1 },
  { match: /\brotation\b/i, popularity: 1 },
  { match: /\btwist\b/i, notMatch: /russian/i, popularity: 1 },
];

// ---------- Helpers ----------
const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

async function fetchAllExercises() {
  const all = [];
  let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/exercises?select=id,exercise_db_id,name,display_name,popularity,muscle_group&order=name&offset=${offset}&limit=1000`;
    const resp = await fetch(url, { headers });
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
    const data = await resp.json();
    all.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all;
}

function getPopularity(exercise) {
  const name = exercise.name.toLowerCase();
  const displayName = (exercise.display_name || '').toLowerCase();
  const combined = name + ' ' + displayName;

  for (const rule of POPULARITY_RULES) {
    if (rule.match.test(combined)) {
      if (rule.notMatch && rule.notMatch.test(combined)) continue;
      return rule.popularity;
    }
  }
  return 0;
}

// ---------- Main ----------
async function main() {
  const exercises = await fetchAllExercises();
  console.log(`Total exercises: ${exercises.length}\n`);

  // Calculate new popularity for each exercise
  const updates = [];
  for (const ex of exercises) {
    const newPop = getPopularity(ex);
    if (newPop !== (ex.popularity || 0)) {
      updates.push({ id: ex.id, name: ex.name, displayName: ex.display_name, oldPop: ex.popularity || 0, newPop });
    }
  }

  // Distribution
  const newDist = {};
  for (const ex of exercises) {
    const pop = getPopularity(ex);
    newDist[pop] = (newDist[pop] || 0) + 1;
  }

  console.log('=== NEW POPULARITY DISTRIBUTION ===\n');
  for (const [pop, count] of Object.entries(newDist).sort((a, b) => Number(b[0]) - Number(a[0]))) {
    console.log(`  Popularity ${pop}: ${count} exercises`);
  }

  console.log(`\n${updates.length} exercises need updating.\n`);

  if (mode === '--preview') {
    // Show samples per tier
    for (let tier = 5; tier >= 1; tier--) {
      const tierUpdates = updates.filter(u => u.newPop === tier);
      const allInTier = exercises.filter(ex => getPopularity(ex) === tier);
      console.log(`\n--- Tier ${tier} (${allInTier.length} total, ${tierUpdates.length} to update) ---`);
      for (const u of tierUpdates.slice(0, 10)) {
        const display = u.displayName || u.name;
        console.log(`  "${display}" (was pop=${u.oldPop} → ${u.newPop})`);
      }
      if (tierUpdates.length > 10) console.log(`  ... and ${tierUpdates.length - 10} more`);
    }

    // Show exercises being downgraded
    const downgrades = updates.filter(u => u.newPop < u.oldPop);
    if (downgrades.length > 0) {
      console.log(`\n--- DOWNGRADES (${downgrades.length}) ---`);
      for (const d of downgrades) {
        console.log(`  "${d.displayName || d.name}": ${d.oldPop} → ${d.newPop}`);
      }
    }
  }

  if (mode === '--apply') {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < updates.length; i += 10) {
      const batch = updates.slice(i, i + 10);
      const promises = batch.map(async (u) => {
        const url = `${SUPABASE_URL}/rest/v1/exercises?id=eq.${u.id}`;
        const resp = await fetch(url, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ popularity: u.newPop }),
        });
        if (!resp.ok) {
          failed++;
        } else {
          success++;
        }
      });
      await Promise.all(promises);
      process.stdout.write(`  Processed ${Math.min(i + 10, updates.length)}/${updates.length}\r`);
    }

    console.log(`\n\nDone!`);
    console.log(`  Updated: ${success}`);
    console.log(`  Failed: ${failed}`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
