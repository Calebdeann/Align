// Seed script using Ascend API (ExerciseDB) for exercise GIFs
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

// Rate limit helper - wait between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch with retry for rate limiting
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      const text = await res.text();

      if (text.startsWith('{') || text.startsWith('[')) {
        return JSON.parse(text);
      }

      // Rate limited - wait and retry
      console.log(`Rate limited, waiting ${(i + 1) * 2}s...`);
      await delay((i + 1) * 2000);
    } catch (err) {
      console.error(`Fetch error (attempt ${i + 1}):`, err.message);
      await delay((i + 1) * 1000);
    }
  }
  return null;
}

// Curated list of exercise names we want (women-focused)
const CURATED_EXERCISES = [
  // GLUTES (30+)
  'barbell hip thrust', 'dumbbell hip thrust', 'glute bridge', 'single leg glute bridge',
  'cable kickback', 'romanian deadlift', 'dumbbell romanian deadlift', 'single leg deadlift',
  'sumo deadlift', 'kettlebell swing', 'fire hydrant', 'donkey kicks', 'clamshell',
  'step up', 'dumbbell step up', 'reverse lunge', 'curtsy lunge', 'bulgarian split squat',
  'hip abduction machine', 'cable hip abduction', 'frog pump', 'good morning',
  'cable pull through', 'band walk', 'glute ham raise', 'kickback',

  // QUADS (20+)
  'barbell squat', 'goblet squat', 'dumbbell squat', 'front squat', 'leg press',
  'hack squat', 'smith machine squat', 'leg extension', 'walking lunge', 'dumbbell lunge',
  'barbell lunge', 'split squat', 'wall sit', 'bodyweight squat', 'jump squat',
  'pistol squat', 'sissy squat', 'pendulum squat', 'narrow stance leg press',

  // HAMSTRINGS (15+)
  'lying leg curl', 'seated leg curl', 'standing leg curl', 'nordic curl',
  'stiff leg deadlift', 'dumbbell stiff leg deadlift', 'swiss ball leg curl',
  'cable leg curl', 'deadlift', 'trap bar deadlift',

  // BACK (20+)
  'lat pulldown', 'wide grip lat pulldown', 'close grip lat pulldown', 'pull up', 'chin up',
  'assisted pull up', 'barbell row', 'dumbbell row', 'one arm dumbbell row', 'seated cable row',
  't bar row', 'face pull', 'reverse fly', 'straight arm pulldown', 'inverted row',
  'hyperextension', 'back extension', 'superman', 'machine row',

  // CHEST (15+)
  'bench press', 'dumbbell bench press', 'incline bench press', 'incline dumbbell press',
  'decline bench press', 'push up', 'wide push up', 'diamond push up', 'knee push up',
  'incline push up', 'dumbbell fly', 'incline dumbbell fly', 'cable fly', 'cable crossover',
  'machine chest press', 'pec deck',

  // SHOULDERS (15+)
  'overhead press', 'dumbbell shoulder press', 'seated dumbbell press', 'arnold press',
  'lateral raise', 'cable lateral raise', 'front raise', 'upright row', 'rear delt fly',
  'reverse pec deck', 'machine shoulder press', 'pike push up', 'barbell shrug', 'dumbbell shrug',

  // BICEPS (10+)
  'barbell curl', 'dumbbell curl', 'hammer curl', 'concentration curl', 'preacher curl',
  'cable curl', 'incline dumbbell curl', 'ez bar curl', 'spider curl', 'reverse curl',

  // TRICEPS (10+)
  'tricep pushdown', 'rope pushdown', 'overhead tricep extension', 'cable overhead extension',
  'skull crusher', 'dumbbell skull crusher', 'tricep dip', 'bench dip', 'close grip bench press',
  'tricep kickback',

  // ABS/CORE (15+)
  'crunch', 'bicycle crunch', 'reverse crunch', 'cable crunch', 'plank', 'side plank',
  'mountain climber', 'leg raise', 'hanging leg raise', 'hanging knee raise', 'russian twist',
  'dead bug', 'bird dog', 'ab wheel rollout', 'flutter kick', 'v up', 'sit up',

  // CALVES (5+)
  'standing calf raise', 'seated calf raise', 'dumbbell calf raise', 'calf raise',
];

// Normalize exercise name for matching
function normalize(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if exercise matches any curated name
function matchesCurated(exerciseName) {
  const normalized = normalize(exerciseName);
  return CURATED_EXERCISES.some(curated => {
    const normalizedCurated = normalize(curated);
    return normalized.includes(normalizedCurated) || normalizedCurated.includes(normalized);
  });
}

// Map target muscle to our muscle_group
function mapMuscleGroup(targetMuscles, bodyParts) {
  const target = (targetMuscles?.[0] || '').toLowerCase();
  const bodyPart = (bodyParts?.[0] || '').toLowerCase();

  // Direct mappings
  const muscleMap = {
    'glutes': 'glutes',
    'quads': 'quads',
    'quadriceps': 'quads',
    'hamstrings': 'hamstrings',
    'calves': 'calves',
    'lats': 'lats',
    'upper back': 'upper back',
    'traps': 'traps',
    'lower back': 'lower back',
    'spine': 'lower back',
    'pectorals': 'chest',
    'chest': 'chest',
    'delts': 'shoulders',
    'shoulders': 'shoulders',
    'biceps': 'biceps',
    'triceps': 'triceps',
    'forearms': 'forearms',
    'abs': 'abs',
    'abductors': 'glutes',
    'adductors': 'quads',
    'cardiovascular system': 'cardio',
    'serratus anterior': 'chest',
  };

  if (muscleMap[target]) return muscleMap[target];
  if (muscleMap[bodyPart]) return muscleMap[bodyPart];

  // Fallback by body part
  if (bodyPart === 'back') return 'upper back';
  if (bodyPart === 'waist') return 'abs';
  if (bodyPart === 'upper arms') return target.includes('bicep') ? 'biceps' : 'triceps';
  if (bodyPart === 'upper legs') return 'quads';
  if (bodyPart === 'lower legs') return 'calves';

  return target || 'other';
}

// Map equipment
function mapEquipment(equipments) {
  const equip = (equipments?.[0] || 'body weight').toLowerCase();

  const equipMap = {
    'body weight': 'body weight',
    'bodyweight': 'body weight',
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

async function fetchAllExercises() {
  const allExercises = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  console.log('Fetching exercises from Ascend API...\n');

  while (hasMore && offset < 1500) {
    const url = `${ASCEND_API}/exercises?limit=${limit}&offset=${offset}`;
    console.log(`Fetching offset ${offset}...`);

    const response = await fetchWithRetry(url);

    if (!response || !response.data || response.data.length === 0) {
      hasMore = false;
      break;
    }

    allExercises.push(...response.data);
    offset += limit;

    // Rate limit protection
    await delay(500);
  }

  console.log(`\nFetched ${allExercises.length} total exercises`);
  return allExercises;
}

async function seed() {
  // Fetch all exercises from API
  const allExercises = await fetchAllExercises();

  // Filter to curated exercises
  const curated = allExercises.filter(ex => matchesCurated(ex.name));
  console.log(`\nFiltered to ${curated.length} curated exercises\n`);

  // If we don't have enough, also include popular ones
  if (curated.length < 150) {
    console.log('Adding more exercises to reach target...');
    const remaining = allExercises.filter(ex => !matchesCurated(ex.name));
    const additional = remaining.slice(0, 200 - curated.length);
    curated.push(...additional);
    console.log(`Total exercises to seed: ${curated.length}\n`);
  }

  // First, clear existing exercises that aren't referenced
  console.log('Updating exercises in Supabase...\n');

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const exercise of curated) {
    const muscleGroup = mapMuscleGroup(exercise.targetMuscles, exercise.bodyParts);
    const equipment = mapEquipment(exercise.equipments);

    const data = {
      name: exercise.name,
      muscle_group: muscleGroup,
      equipment: [equipment],
      image_url: exercise.gifUrl,
      instructions: exercise.instructions?.join('\n') || null,
    };

    // Check if exists
    const { data: existing } = await supabase
      .from('exercises')
      .select('id')
      .ilike('name', exercise.name)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('exercises')
        .update(data)
        .eq('id', existing.id);

      if (error) {
        console.error(`Failed to update ${exercise.name}:`, error.message);
        failed++;
      } else {
        updated++;
      }
    } else {
      const { error } = await supabase.from('exercises').insert(data);

      if (error) {
        console.error(`Failed to insert ${exercise.name}:`, error.message);
        failed++;
      } else {
        inserted++;
      }
    }
  }

  console.log('\n=== SEED COMPLETE ===');
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${inserted + updated}`);

  // Final count
  const { count } = await supabase.from('exercises').select('*', { count: 'exact', head: true });
  console.log(`\nTotal exercises in database: ${count}`);
}

seed().catch(console.error);
