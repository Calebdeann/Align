// Seed script - fetches exercises in batches with delays
// API: https://www.ascendapi.com/api/v1

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

// Map target muscle to our categories
function mapMuscleGroup(targetMuscles, bodyParts, exerciseName) {
  const name = exerciseName.toLowerCase();
  const target = (targetMuscles?.[0] || '').toLowerCase();

  // Name-based overrides for accuracy
  if (name.includes('hip thrust') || name.includes('glute bridge') || name.includes('kickback') ||
      name.includes('donkey kick') || name.includes('fire hydrant') || name.includes('clamshell') ||
      name.includes('hip abduction') || name.includes('frog')) {
    return 'glutes';
  }
  if (name.includes('squat') && !name.includes('sissy')) return 'quads';
  if (name.includes('leg press') || name.includes('leg extension') || name.includes('lunge') ||
      name.includes('split squat')) return 'quads';
  if (name.includes('leg curl') || name.includes('hamstring') || name.includes('nordic')) return 'hamstrings';
  if (name.includes('calf')) return 'calves';
  if (name.includes('deadlift')) {
    if (name.includes('romanian') || name.includes('stiff')) return 'glutes';
    return 'hamstrings';
  }
  if (name.includes('pulldown') || name.includes('pull up') || name.includes('pullup') ||
      name.includes('chin up') || name.includes('chinup') || name.includes('lat ')) return 'lats';
  if (name.includes('row') || name.includes('face pull') || name.includes('reverse fly')) return 'upper back';
  if (name.includes('hyperextension') || name.includes('back extension') || name.includes('superman')) return 'lower back';
  if (name.includes('shrug')) return 'traps';
  if (name.includes('bench press') || name.includes('push up') || name.includes('pushup') ||
      name.includes('chest') || name.includes('fly') || name.includes('pec')) return 'chest';
  if (name.includes('shoulder press') || name.includes('overhead press') || name.includes('lateral raise') ||
      name.includes('front raise') || name.includes('rear delt') || name.includes('arnold') ||
      name.includes('military press') || name.includes('pike')) return 'shoulders';
  if (name.includes('curl') && !name.includes('leg') && !name.includes('nordic')) {
    if (name.includes('hammer') || name.includes('bicep') || name.includes('preacher') ||
        name.includes('concentration') || name.includes('incline') || name.includes('barbell curl') ||
        name.includes('dumbbell curl') || name.includes('cable curl') || name.includes('ez bar')) {
      return 'biceps';
    }
  }
  if (name.includes('tricep') || name.includes('skull') || name.includes('pushdown') ||
      name.includes('close grip bench') || name.includes('dip')) return 'triceps';
  if (name.includes('crunch') || name.includes('plank') || name.includes('leg raise') ||
      name.includes('mountain climb') || name.includes('russian twist') || name.includes('sit up') ||
      name.includes('bicycle') || name.includes('dead bug') || name.includes('bird dog') ||
      name.includes('flutter') || name.includes('v up') || name.includes('ab ') ||
      name.includes('hanging knee') || name.includes('woodchop')) return 'abs';

  // Fallback to API data
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
    'pectorals': 'chest',
    'delts': 'shoulders',
    'biceps': 'biceps',
    'triceps': 'triceps',
    'abs': 'abs',
    'abductors': 'glutes',
    'adductors': 'quads',
    'serratus anterior': 'chest',
  };

  return muscleMap[target] || target || 'other';
}

function mapEquipment(equipments) {
  const equip = (equipments?.[0] || 'body weight').toLowerCase();
  const map = {
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
    'rope': 'cable',
    'trap bar': 'barbell',
    'wheel roller': 'ab wheel',
    'stability ball': 'exercise ball',
    'bosu ball': 'exercise ball',
    'medicine ball': 'medicine ball',
  };
  return map[equip] || equip;
}

// Exercise name patterns we want
const WANTED_PATTERNS = [
  // Glutes
  'hip thrust', 'glute bridge', 'romanian deadlift', 'kickback', 'donkey kick',
  'fire hydrant', 'clamshell', 'step up', 'good morning', 'pull through',
  'hip abduction', 'frog pump',
  // Quads
  'squat', 'leg press', 'leg extension', 'lunge', 'split squat', 'wall sit',
  // Hamstrings
  'leg curl', 'deadlift', 'nordic',
  // Calves
  'calf raise', 'calf press',
  // Back
  'pulldown', 'pull up', 'pullup', 'chin up', 'chinup', 'row', 'face pull',
  'reverse fly', 'hyperextension', 'back extension', 'superman', 'shrug',
  // Chest
  'bench press', 'push up', 'pushup', 'fly', 'crossover', 'chest press', 'pec deck',
  // Shoulders
  'shoulder press', 'overhead press', 'lateral raise', 'front raise', 'rear delt',
  'arnold press', 'upright row', 'military press', 'pike push',
  // Biceps
  'bicep curl', 'barbell curl', 'dumbbell curl', 'hammer curl', 'preacher curl',
  'concentration curl', 'incline curl', 'cable curl', 'ez bar curl', 'spider curl',
  // Triceps
  'tricep', 'skull crusher', 'pushdown', 'close grip bench', 'bench dip',
  // Abs
  'crunch', 'plank', 'leg raise', 'mountain climb', 'russian twist', 'sit up',
  'bicycle', 'dead bug', 'bird dog', 'flutter kick', 'v up', 'ab wheel',
  'hanging knee', 'woodchop',
];

function isWanted(exerciseName) {
  const name = exerciseName.toLowerCase();
  return WANTED_PATTERNS.some(pattern => name.includes(pattern));
}

async function seed() {
  console.log('Clearing non-referenced exercises...');

  // Get referenced exercise IDs
  const { data: refs } = await supabase.from('workout_exercises').select('exercise_id');
  const referencedIds = new Set((refs || []).map(r => r.exercise_id));
  console.log(`${referencedIds.size} exercises are referenced\n`);

  // Delete unreferenced
  const { data: existing } = await supabase.from('exercises').select('id');
  let deleted = 0;
  for (const ex of existing || []) {
    if (!referencedIds.has(ex.id)) {
      await supabase.from('exercises').delete().eq('id', ex.id);
      deleted++;
    }
  }
  console.log(`Deleted ${deleted} unreferenced exercises\n`);

  console.log('Fetching exercises from API (this may take a while)...\n');

  const allExercises = new Map();
  let offset = 0;
  const limit = 30;
  let consecutiveErrors = 0;

  while (offset < 1500 && consecutiveErrors < 5) {
    const url = `${ASCEND_API}/exercises?limit=${limit}&offset=${offset}`;

    try {
      const res = await fetch(url);
      const text = await res.text();

      if (!text.startsWith('{')) {
        console.log(`Rate limited at offset ${offset}, waiting 15s...`);
        await delay(15000);
        consecutiveErrors++;
        continue;
      }

      const response = JSON.parse(text);

      if (!response.data || response.data.length === 0) break;

      for (const ex of response.data) {
        if (isWanted(ex.name) && !allExercises.has(ex.name.toLowerCase())) {
          allExercises.set(ex.name.toLowerCase(), ex);
        }
      }

      console.log(`Offset ${offset}: found ${response.data.length} exercises, ${allExercises.size} total wanted`);
      offset += limit;
      consecutiveErrors = 0;
      await delay(3000); // 3 second delay between requests

    } catch (err) {
      console.error(`Error at offset ${offset}:`, err.message);
      await delay(10000);
      consecutiveErrors++;
    }
  }

  console.log(`\nCollected ${allExercises.size} wanted exercises\n`);

  // Insert into Supabase
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const [, ex] of allExercises) {
    const data = {
      name: ex.name,
      muscle_group: mapMuscleGroup(ex.targetMuscles, ex.bodyParts, ex.name),
      equipment: [mapEquipment(ex.equipments)],
      image_url: ex.gifUrl,
      instructions: ex.instructions?.join('\n') || null,
    };

    const { data: exists } = await supabase
      .from('exercises')
      .select('id')
      .ilike('name', ex.name)
      .single();

    if (exists) {
      const { error } = await supabase.from('exercises').update(data).eq('id', exists.id);
      if (error) failed++; else updated++;
    } else {
      const { error } = await supabase.from('exercises').insert(data);
      if (error) failed++; else inserted++;
    }
  }

  console.log('=== SEED COMPLETE ===');
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);

  // Distribution
  const { data: final } = await supabase.from('exercises').select('muscle_group');
  const counts = {};
  (final || []).forEach(e => counts[e.muscle_group] = (counts[e.muscle_group] || 0) + 1);

  console.log('\n=== Distribution ===');
  Object.entries(counts).sort((a,b) => b[1] - a[1]).forEach(([m, c]) => console.log(`${m}: ${c}`));
  console.log(`\nTotal: ${final?.length || 0}`);
}

seed().catch(console.error);
