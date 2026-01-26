// Seed script using Ascend API (ExerciseDB) - searches for specific exercises
// API: https://www.ascendapi.com/api/v1
// GIF format: https://static.exercisedb.dev/media/{exerciseId}.gif

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ASCEND_API = 'https://www.ascendapi.com/api/v1';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (text.startsWith('{') || text.startsWith('[')) {
        return JSON.parse(text);
      }
      console.log(`Rate limited, waiting ${(i + 1) * 2}s...`);
      await delay((i + 1) * 2000);
    } catch (err) {
      console.error(`Fetch error:`, err.message);
      await delay((i + 1) * 1000);
    }
  }
  return null;
}

// Exercises we want with their correct muscle groups
const EXERCISES_TO_FIND = [
  // GLUTES
  { search: 'hip thrust', muscle_group: 'glutes' },
  { search: 'glute bridge', muscle_group: 'glutes' },
  { search: 'romanian deadlift', muscle_group: 'glutes' },
  { search: 'kickback', muscle_group: 'glutes' },
  { search: 'sumo deadlift', muscle_group: 'glutes' },
  { search: 'fire hydrant', muscle_group: 'glutes' },
  { search: 'donkey kick', muscle_group: 'glutes' },
  { search: 'step up', muscle_group: 'glutes' },
  { search: 'lunge', muscle_group: 'glutes' },
  { search: 'split squat', muscle_group: 'glutes' },
  { search: 'hip abduction', muscle_group: 'glutes' },
  { search: 'clamshell', muscle_group: 'glutes' },
  { search: 'frog', muscle_group: 'glutes' },
  { search: 'good morning', muscle_group: 'glutes' },
  { search: 'single leg deadlift', muscle_group: 'glutes' },
  { search: 'kettlebell swing', muscle_group: 'glutes' },
  { search: 'pull through', muscle_group: 'glutes' },

  // QUADS
  { search: 'squat', muscle_group: 'quads' },
  { search: 'leg press', muscle_group: 'quads' },
  { search: 'leg extension', muscle_group: 'quads' },
  { search: 'hack squat', muscle_group: 'quads' },
  { search: 'wall sit', muscle_group: 'quads' },
  { search: 'pistol', muscle_group: 'quads' },
  { search: 'sissy squat', muscle_group: 'quads' },

  // HAMSTRINGS
  { search: 'leg curl', muscle_group: 'hamstrings' },
  { search: 'nordic', muscle_group: 'hamstrings' },
  { search: 'stiff leg', muscle_group: 'hamstrings' },
  { search: 'deadlift', muscle_group: 'hamstrings' },

  // CALVES
  { search: 'calf raise', muscle_group: 'calves' },
  { search: 'calf press', muscle_group: 'calves' },

  // BACK
  { search: 'lat pulldown', muscle_group: 'lats' },
  { search: 'pull up', muscle_group: 'lats' },
  { search: 'chin up', muscle_group: 'lats' },
  { search: 'pulldown', muscle_group: 'lats' },
  { search: 'row', muscle_group: 'upper back' },
  { search: 'face pull', muscle_group: 'upper back' },
  { search: 'reverse fly', muscle_group: 'upper back' },
  { search: 'hyperextension', muscle_group: 'lower back' },
  { search: 'back extension', muscle_group: 'lower back' },
  { search: 'superman', muscle_group: 'lower back' },
  { search: 'shrug', muscle_group: 'traps' },

  // CHEST
  { search: 'bench press', muscle_group: 'chest' },
  { search: 'push up', muscle_group: 'chest' },
  { search: 'pushup', muscle_group: 'chest' },
  { search: 'chest fly', muscle_group: 'chest' },
  { search: 'dumbbell fly', muscle_group: 'chest' },
  { search: 'cable fly', muscle_group: 'chest' },
  { search: 'crossover', muscle_group: 'chest' },
  { search: 'pec deck', muscle_group: 'chest' },
  { search: 'chest press', muscle_group: 'chest' },

  // SHOULDERS
  { search: 'shoulder press', muscle_group: 'shoulders' },
  { search: 'overhead press', muscle_group: 'shoulders' },
  { search: 'lateral raise', muscle_group: 'shoulders' },
  { search: 'front raise', muscle_group: 'shoulders' },
  { search: 'rear delt', muscle_group: 'shoulders' },
  { search: 'arnold press', muscle_group: 'shoulders' },
  { search: 'upright row', muscle_group: 'shoulders' },
  { search: 'military press', muscle_group: 'shoulders' },
  { search: 'pike push', muscle_group: 'shoulders' },

  // BICEPS
  { search: 'bicep curl', muscle_group: 'biceps' },
  { search: 'barbell curl', muscle_group: 'biceps' },
  { search: 'dumbbell curl', muscle_group: 'biceps' },
  { search: 'hammer curl', muscle_group: 'biceps' },
  { search: 'preacher curl', muscle_group: 'biceps' },
  { search: 'concentration curl', muscle_group: 'biceps' },
  { search: 'incline curl', muscle_group: 'biceps' },
  { search: 'cable curl', muscle_group: 'biceps' },
  { search: 'ez bar curl', muscle_group: 'biceps' },

  // TRICEPS
  { search: 'tricep pushdown', muscle_group: 'triceps' },
  { search: 'tricep extension', muscle_group: 'triceps' },
  { search: 'skull crusher', muscle_group: 'triceps' },
  { search: 'tricep dip', muscle_group: 'triceps' },
  { search: 'bench dip', muscle_group: 'triceps' },
  { search: 'close grip bench', muscle_group: 'triceps' },
  { search: 'kickback', muscle_group: 'triceps' },
  { search: 'rope pushdown', muscle_group: 'triceps' },

  // ABS
  { search: 'crunch', muscle_group: 'abs' },
  { search: 'plank', muscle_group: 'abs' },
  { search: 'leg raise', muscle_group: 'abs' },
  { search: 'mountain climber', muscle_group: 'abs' },
  { search: 'russian twist', muscle_group: 'abs' },
  { search: 'sit up', muscle_group: 'abs' },
  { search: 'bicycle', muscle_group: 'abs' },
  { search: 'dead bug', muscle_group: 'abs' },
  { search: 'bird dog', muscle_group: 'abs' },
  { search: 'flutter kick', muscle_group: 'abs' },
  { search: 'v up', muscle_group: 'abs' },
  { search: 'ab wheel', muscle_group: 'abs' },
  { search: 'hanging knee', muscle_group: 'abs' },
  { search: 'woodchop', muscle_group: 'abs' },
];

function mapEquipment(equipments) {
  const equip = (equipments?.[0] || 'body weight').toLowerCase();
  const equipMap = {
    'body weight': 'body weight',
    'barbell': 'barbell',
    'dumbbell': 'dumbbell',
    'cable': 'cable',
    'machine': 'machine',
    'leverage machine': 'machine',
    'sled machine': 'machine',
    'smith machine': 'smith machine',
    'kettlebell': 'kettlebell',
    'ez barbell': 'barbell',
    'olympic barbell': 'barbell',
    'band': 'bands',
    'resistance band': 'bands',
    'medicine ball': 'medicine ball',
    'stability ball': 'exercise ball',
    'bosu ball': 'exercise ball',
    'roller': 'foam roller',
    'wheel roller': 'ab wheel',
    'assisted': 'machine',
    'weighted': 'body weight',
    'rope': 'cable',
    'trap bar': 'barbell',
  };
  return equipMap[equip] || equip;
}

async function seed() {
  // First, clear all existing exercises
  console.log('Clearing existing exercises...');

  // Get exercises that are referenced by workouts
  const { data: referenced } = await supabase
    .from('workout_exercises')
    .select('exercise_id');

  const referencedIds = new Set((referenced || []).map(r => r.exercise_id));
  console.log(`${referencedIds.size} exercises are referenced by workouts\n`);

  // Delete unreferenced exercises
  const { data: allExercises } = await supabase.from('exercises').select('id');
  for (const ex of allExercises || []) {
    if (!referencedIds.has(ex.id)) {
      await supabase.from('exercises').delete().eq('id', ex.id);
    }
  }

  console.log('Searching for exercises from API...\n');

  const foundExercises = new Map(); // name -> exercise data

  for (const { search, muscle_group } of EXERCISES_TO_FIND) {
    const url = `${ASCEND_API}/exercises/search?query=${encodeURIComponent(search)}&limit=10`;
    const response = await fetchWithRetry(url);

    if (response && response.data) {
      for (const ex of response.data) {
        // Skip if already found
        if (foundExercises.has(ex.name.toLowerCase())) continue;

        // Use our muscle group override
        foundExercises.set(ex.name.toLowerCase(), {
          name: ex.name,
          muscle_group: muscle_group,
          equipment: [mapEquipment(ex.equipments)],
          image_url: ex.gifUrl,
          instructions: ex.instructions?.join('\n') || null,
        });
      }
    }

    await delay(300); // Rate limit protection
    process.stdout.write('.');
  }

  console.log(`\n\nFound ${foundExercises.size} unique exercises\n`);

  // Insert into Supabase
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const [, exercise] of foundExercises) {
    // Check if exists
    const { data: existing } = await supabase
      .from('exercises')
      .select('id')
      .ilike('name', exercise.name)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('exercises')
        .update(exercise)
        .eq('id', existing.id);

      if (error) {
        failed++;
      } else {
        updated++;
      }
    } else {
      const { error } = await supabase.from('exercises').insert(exercise);

      if (error) {
        failed++;
      } else {
        inserted++;
      }
    }
  }

  console.log('=== SEED COMPLETE ===');
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);

  // Show distribution
  const { data: final } = await supabase.from('exercises').select('muscle_group');
  const counts = {};
  final.forEach(e => {
    counts[e.muscle_group] = (counts[e.muscle_group] || 0) + 1;
  });

  console.log('\n=== Distribution ===');
  Object.entries(counts).sort((a,b) => b[1] - a[1]).forEach(([muscle, count]) => {
    console.log(`${muscle}: ${count}`);
  });
  console.log(`\nTotal: ${final.length}`);
}

seed().catch(console.error);
