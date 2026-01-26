/**
 * Seed script to populate Supabase exercises table with curated exercises
 *
 * Run with: node scripts/seed-exercises.mjs
 *
 * This fetches exercises from Ascend API and inserts them into Supabase.
 * GIF URLs point to Ascend's CDN (they host the files for free).
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  console.error('SUPABASE_URL:', SUPABASE_URL ? 'found' : 'missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? 'found' : 'missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ASCEND_API_BASE = 'https://www.ascendapi.com/api/v1';

// Curated list of popular exercises for women (~200 exercises)
const CURATED_EXERCISES = [
  // GLUTES (30 exercises)
  { name: 'barbell hip thrust', muscle: 'glutes', equipment: 'barbell' },
  { name: 'dumbbell hip thrust', muscle: 'glutes', equipment: 'dumbbell' },
  { name: 'glute bridge', muscle: 'glutes', equipment: 'body weight' },
  { name: 'single leg glute bridge', muscle: 'glutes', equipment: 'body weight' },
  { name: 'cable kickback', muscle: 'glutes', equipment: 'cable' },
  { name: 'cable pull through', muscle: 'glutes', equipment: 'cable' },
  { name: 'romanian deadlift', muscle: 'glutes', equipment: 'barbell' },
  { name: 'dumbbell romanian deadlift', muscle: 'glutes', equipment: 'dumbbell' },
  { name: 'single leg deadlift', muscle: 'glutes', equipment: 'dumbbell' },
  { name: 'sumo deadlift', muscle: 'glutes', equipment: 'barbell' },
  { name: 'kettlebell swing', muscle: 'glutes', equipment: 'kettlebell' },
  { name: 'fire hydrant', muscle: 'glutes', equipment: 'body weight' },
  { name: 'donkey kick', muscle: 'glutes', equipment: 'body weight' },
  { name: 'frog pump', muscle: 'glutes', equipment: 'body weight' },
  { name: 'clamshell', muscle: 'glutes', equipment: 'body weight' },
  { name: 'banded clamshell', muscle: 'glutes', equipment: 'resistance band' },
  { name: 'banded glute bridge', muscle: 'glutes', equipment: 'resistance band' },
  { name: 'step up', muscle: 'glutes', equipment: 'body weight' },
  { name: 'dumbbell step up', muscle: 'glutes', equipment: 'dumbbell' },
  { name: 'reverse lunge', muscle: 'glutes', equipment: 'body weight' },
  { name: 'curtsy lunge', muscle: 'glutes', equipment: 'body weight' },
  { name: 'bulgarian split squat', muscle: 'glutes', equipment: 'body weight' },
  { name: 'dumbbell bulgarian split squat', muscle: 'glutes', equipment: 'dumbbell' },
  { name: 'cable hip abduction', muscle: 'glutes', equipment: 'cable' },
  { name: 'lying hip abduction', muscle: 'glutes', equipment: 'body weight' },
  { name: 'side lying hip raise', muscle: 'glutes', equipment: 'body weight' },
  { name: 'smith machine hip thrust', muscle: 'glutes', equipment: 'smith machine' },
  { name: 'standing kickback', muscle: 'glutes', equipment: 'body weight' },
  { name: 'kneeling kickback', muscle: 'glutes', equipment: 'body weight' },
  { name: 'hip abductor machine', muscle: 'glutes', equipment: 'leverage machine' },

  // QUADS/LEGS (25 exercises)
  { name: 'barbell squat', muscle: 'quads', equipment: 'barbell' },
  { name: 'goblet squat', muscle: 'quads', equipment: 'dumbbell' },
  { name: 'dumbbell squat', muscle: 'quads', equipment: 'dumbbell' },
  { name: 'front squat', muscle: 'quads', equipment: 'barbell' },
  { name: 'leg press', muscle: 'quads', equipment: 'leverage machine' },
  { name: 'hack squat', muscle: 'quads', equipment: 'sled machine' },
  { name: 'smith machine squat', muscle: 'quads', equipment: 'smith machine' },
  { name: 'leg extension', muscle: 'quads', equipment: 'leverage machine' },
  { name: 'walking lunge', muscle: 'quads', equipment: 'body weight' },
  { name: 'dumbbell lunge', muscle: 'quads', equipment: 'dumbbell' },
  { name: 'barbell lunge', muscle: 'quads', equipment: 'barbell' },
  { name: 'split squat', muscle: 'quads', equipment: 'body weight' },
  { name: 'sissy squat', muscle: 'quads', equipment: 'body weight' },
  { name: 'wall sit', muscle: 'quads', equipment: 'body weight' },
  { name: 'box squat', muscle: 'quads', equipment: 'barbell' },
  { name: 'sumo squat', muscle: 'quads', equipment: 'dumbbell' },
  { name: 'bodyweight squat', muscle: 'quads', equipment: 'body weight' },
  { name: 'jump squat', muscle: 'quads', equipment: 'body weight' },
  { name: 'pistol squat', muscle: 'quads', equipment: 'body weight' },
  { name: 'single leg press', muscle: 'quads', equipment: 'leverage machine' },

  // HAMSTRINGS (15 exercises)
  { name: 'lying leg curl', muscle: 'hamstrings', equipment: 'leverage machine' },
  { name: 'seated leg curl', muscle: 'hamstrings', equipment: 'leverage machine' },
  { name: 'standing leg curl', muscle: 'hamstrings', equipment: 'leverage machine' },
  { name: 'nordic curl', muscle: 'hamstrings', equipment: 'body weight' },
  { name: 'good morning', muscle: 'hamstrings', equipment: 'barbell' },
  { name: 'dumbbell good morning', muscle: 'hamstrings', equipment: 'dumbbell' },
  { name: 'stiff leg deadlift', muscle: 'hamstrings', equipment: 'barbell' },
  { name: 'dumbbell stiff leg deadlift', muscle: 'hamstrings', equipment: 'dumbbell' },
  { name: 'cable leg curl', muscle: 'hamstrings', equipment: 'cable' },
  { name: 'stability ball leg curl', muscle: 'hamstrings', equipment: 'stability ball' },
  { name: 'slider leg curl', muscle: 'hamstrings', equipment: 'body weight' },
  { name: 'kettlebell deadlift', muscle: 'hamstrings', equipment: 'kettlebell' },

  // BACK (22 exercises)
  { name: 'lat pulldown', muscle: 'lats', equipment: 'cable' },
  { name: 'wide grip lat pulldown', muscle: 'lats', equipment: 'cable' },
  { name: 'close grip lat pulldown', muscle: 'lats', equipment: 'cable' },
  { name: 'pull up', muscle: 'lats', equipment: 'body weight' },
  { name: 'assisted pull up', muscle: 'lats', equipment: 'leverage machine' },
  { name: 'chin up', muscle: 'lats', equipment: 'body weight' },
  { name: 'barbell row', muscle: 'upper back', equipment: 'barbell' },
  { name: 'dumbbell row', muscle: 'upper back', equipment: 'dumbbell' },
  { name: 'single arm dumbbell row', muscle: 'upper back', equipment: 'dumbbell' },
  { name: 'cable row', muscle: 'upper back', equipment: 'cable' },
  { name: 'seated cable row', muscle: 'upper back', equipment: 'cable' },
  { name: 'chest supported row', muscle: 'upper back', equipment: 'dumbbell' },
  { name: 't bar row', muscle: 'upper back', equipment: 'leverage machine' },
  { name: 'face pull', muscle: 'upper back', equipment: 'cable' },
  { name: 'reverse fly', muscle: 'upper back', equipment: 'dumbbell' },
  { name: 'cable reverse fly', muscle: 'upper back', equipment: 'cable' },
  { name: 'straight arm pulldown', muscle: 'lats', equipment: 'cable' },
  { name: 'inverted row', muscle: 'upper back', equipment: 'body weight' },
  { name: 'machine row', muscle: 'upper back', equipment: 'leverage machine' },
  { name: 'hyperextension', muscle: 'lower back', equipment: 'body weight' },
  { name: 'back extension', muscle: 'lower back', equipment: 'body weight' },
  { name: 'superman', muscle: 'lower back', equipment: 'body weight' },

  // CHEST (16 exercises)
  { name: 'bench press', muscle: 'chest', equipment: 'barbell' },
  { name: 'dumbbell bench press', muscle: 'chest', equipment: 'dumbbell' },
  { name: 'incline bench press', muscle: 'chest', equipment: 'barbell' },
  { name: 'incline dumbbell press', muscle: 'chest', equipment: 'dumbbell' },
  { name: 'decline bench press', muscle: 'chest', equipment: 'barbell' },
  { name: 'push up', muscle: 'chest', equipment: 'body weight' },
  { name: 'wide push up', muscle: 'chest', equipment: 'body weight' },
  { name: 'diamond push up', muscle: 'chest', equipment: 'body weight' },
  { name: 'knee push up', muscle: 'chest', equipment: 'body weight' },
  { name: 'incline push up', muscle: 'chest', equipment: 'body weight' },
  { name: 'dumbbell fly', muscle: 'chest', equipment: 'dumbbell' },
  { name: 'incline dumbbell fly', muscle: 'chest', equipment: 'dumbbell' },
  { name: 'cable fly', muscle: 'chest', equipment: 'cable' },
  { name: 'cable crossover', muscle: 'chest', equipment: 'cable' },
  { name: 'machine chest press', muscle: 'chest', equipment: 'leverage machine' },
  { name: 'pec deck fly', muscle: 'chest', equipment: 'leverage machine' },

  // SHOULDERS (18 exercises)
  { name: 'overhead press', muscle: 'shoulders', equipment: 'barbell' },
  { name: 'dumbbell shoulder press', muscle: 'shoulders', equipment: 'dumbbell' },
  { name: 'seated dumbbell press', muscle: 'shoulders', equipment: 'dumbbell' },
  { name: 'arnold press', muscle: 'shoulders', equipment: 'dumbbell' },
  { name: 'lateral raise', muscle: 'shoulders', equipment: 'dumbbell' },
  { name: 'cable lateral raise', muscle: 'shoulders', equipment: 'cable' },
  { name: 'front raise', muscle: 'shoulders', equipment: 'dumbbell' },
  { name: 'cable front raise', muscle: 'shoulders', equipment: 'cable' },
  { name: 'upright row', muscle: 'shoulders', equipment: 'barbell' },
  { name: 'dumbbell upright row', muscle: 'shoulders', equipment: 'dumbbell' },
  { name: 'rear delt fly', muscle: 'shoulders', equipment: 'dumbbell' },
  { name: 'reverse pec deck', muscle: 'shoulders', equipment: 'leverage machine' },
  { name: 'machine shoulder press', muscle: 'shoulders', equipment: 'leverage machine' },
  { name: 'pike push up', muscle: 'shoulders', equipment: 'body weight' },
  { name: 'barbell shrug', muscle: 'traps', equipment: 'barbell' },
  { name: 'dumbbell shrug', muscle: 'traps', equipment: 'dumbbell' },
  { name: 'cable shrug', muscle: 'traps', equipment: 'cable' },

  // BICEPS (12 exercises)
  { name: 'barbell curl', muscle: 'biceps', equipment: 'barbell' },
  { name: 'dumbbell curl', muscle: 'biceps', equipment: 'dumbbell' },
  { name: 'hammer curl', muscle: 'biceps', equipment: 'dumbbell' },
  { name: 'concentration curl', muscle: 'biceps', equipment: 'dumbbell' },
  { name: 'preacher curl', muscle: 'biceps', equipment: 'barbell' },
  { name: 'dumbbell preacher curl', muscle: 'biceps', equipment: 'dumbbell' },
  { name: 'cable curl', muscle: 'biceps', equipment: 'cable' },
  { name: 'incline dumbbell curl', muscle: 'biceps', equipment: 'dumbbell' },
  { name: 'ez bar curl', muscle: 'biceps', equipment: 'ez barbell' },
  { name: 'spider curl', muscle: 'biceps', equipment: 'dumbbell' },
  { name: 'cable hammer curl', muscle: 'biceps', equipment: 'cable' },
  { name: 'reverse curl', muscle: 'biceps', equipment: 'barbell' },

  // TRICEPS (12 exercises)
  { name: 'tricep pushdown', muscle: 'triceps', equipment: 'cable' },
  { name: 'rope pushdown', muscle: 'triceps', equipment: 'cable' },
  { name: 'overhead tricep extension', muscle: 'triceps', equipment: 'dumbbell' },
  { name: 'cable overhead tricep extension', muscle: 'triceps', equipment: 'cable' },
  { name: 'skull crusher', muscle: 'triceps', equipment: 'barbell' },
  { name: 'dumbbell skull crusher', muscle: 'triceps', equipment: 'dumbbell' },
  { name: 'tricep dip', muscle: 'triceps', equipment: 'body weight' },
  { name: 'bench dip', muscle: 'triceps', equipment: 'body weight' },
  { name: 'close grip bench press', muscle: 'triceps', equipment: 'barbell' },
  { name: 'tricep kickback', muscle: 'triceps', equipment: 'dumbbell' },
  { name: 'cable kickback', muscle: 'triceps', equipment: 'cable' },
  { name: 'machine tricep extension', muscle: 'triceps', equipment: 'leverage machine' },

  // CORE/ABS (22 exercises)
  { name: 'crunch', muscle: 'abs', equipment: 'body weight' },
  { name: 'bicycle crunch', muscle: 'abs', equipment: 'body weight' },
  { name: 'reverse crunch', muscle: 'abs', equipment: 'body weight' },
  { name: 'cable crunch', muscle: 'abs', equipment: 'cable' },
  { name: 'plank', muscle: 'abs', equipment: 'body weight' },
  { name: 'side plank', muscle: 'abs', equipment: 'body weight' },
  { name: 'mountain climber', muscle: 'abs', equipment: 'body weight' },
  { name: 'leg raise', muscle: 'abs', equipment: 'body weight' },
  { name: 'hanging leg raise', muscle: 'abs', equipment: 'body weight' },
  { name: 'hanging knee raise', muscle: 'abs', equipment: 'body weight' },
  { name: 'russian twist', muscle: 'abs', equipment: 'body weight' },
  { name: 'weighted russian twist', muscle: 'abs', equipment: 'dumbbell' },
  { name: 'dead bug', muscle: 'abs', equipment: 'body weight' },
  { name: 'bird dog', muscle: 'abs', equipment: 'body weight' },
  { name: 'ab wheel rollout', muscle: 'abs', equipment: 'wheel roller' },
  { name: 'toe touch', muscle: 'abs', equipment: 'body weight' },
  { name: 'flutter kick', muscle: 'abs', equipment: 'body weight' },
  { name: 'scissor kick', muscle: 'abs', equipment: 'body weight' },
  { name: 'hollow body hold', muscle: 'abs', equipment: 'body weight' },
  { name: 'v up', muscle: 'abs', equipment: 'body weight' },
  { name: 'sit up', muscle: 'abs', equipment: 'body weight' },
  { name: 'cable woodchop', muscle: 'abs', equipment: 'cable' },

  // CALVES (5 exercises)
  { name: 'standing calf raise', muscle: 'calves', equipment: 'leverage machine' },
  { name: 'seated calf raise', muscle: 'calves', equipment: 'leverage machine' },
  { name: 'dumbbell calf raise', muscle: 'calves', equipment: 'dumbbell' },
  { name: 'bodyweight calf raise', muscle: 'calves', equipment: 'body weight' },
  { name: 'donkey calf raise', muscle: 'calves', equipment: 'leverage machine' },
];

async function fetchFromAscend(query) {
  try {
    const url = `${ASCEND_API_BASE}/exercises/search?query=${encodeURIComponent(query)}&limit=5`;
    const res = await fetch(url);
    const text = await res.text();

    if (!text.startsWith('{') && !text.startsWith('[')) {
      console.log(`  Rate limited for: ${query}`);
      return null;
    }

    const data = JSON.parse(text);
    const exercises = Array.isArray(data) ? data : data.data || [];

    // Find best match (case-insensitive, prefer exact match)
    const queryLower = query.toLowerCase();
    const exactMatch = exercises.find((e) =>
      e.name.toLowerCase() === queryLower
    );

    if (exactMatch) return exactMatch;

    // Return first result if it contains all words from query
    const queryWords = queryLower.split(' ');
    const closeMatch = exercises.find((e) => {
      const nameLower = e.name.toLowerCase();
      return queryWords.every(word => nameLower.includes(word));
    });

    return closeMatch || exercises[0] || null;
  } catch (err) {
    console.log(`  Error fetching: ${query}`, err);
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function seedExercises() {
  console.log(`\nSeeding ${CURATED_EXERCISES.length} curated exercises...\n`);

  // Clear existing exercises
  console.log('Clearing existing exercises...');
  const { error: deleteError } = await supabase.from('exercises').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) {
    console.error('Error clearing exercises:', deleteError);
  }

  let inserted = 0;
  let failed = 0;
  let rateLimited = 0;

  for (let i = 0; i < CURATED_EXERCISES.length; i++) {
    const exercise = CURATED_EXERCISES[i];
    console.log(`[${i + 1}/${CURATED_EXERCISES.length}] Fetching: ${exercise.name}`);

    // Fetch from Ascend API
    const ascendData = await fetchFromAscend(exercise.name);

    if (!ascendData) {
      rateLimited++;
      // Wait longer when rate limited
      await sleep(2000);
      continue;
    }

    // Insert into Supabase
    const { error } = await supabase.from('exercises').insert({
      name: ascendData.name,
      muscle: exercise.muscle, // Use our curated muscle group
      equipment: exercise.equipment,
      instructions: ascendData.instructions?.join('\n') || null,
      image_url: ascendData.gifUrl,
    });

    if (error) {
      console.log(`  Failed to insert: ${error.message}`);
      failed++;
    } else {
      console.log(`  Inserted: ${ascendData.name}`);
      inserted++;
    }

    // Rate limit delay
    await sleep(350);
  }

  console.log(`\n--- Summary ---`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Failed: ${failed}`);
  console.log(`Rate limited (skipped): ${rateLimited}`);
  console.log(`\nDone!`);
}

// Run the seed
seedExercises().catch(console.error);
