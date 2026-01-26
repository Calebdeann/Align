// Final seed script - uses pre-fetched ExerciseDB data
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Load pre-processed exercise data
const exercises = JSON.parse(fs.readFileSync('/tmp/seed_data.json', 'utf8'));

async function seed() {
  console.log(`Seeding ${exercises.length} exercises...\n`);

  // First, clear existing non-referenced exercises
  const { data: refs } = await supabase.from('workout_exercises').select('exercise_id');
  const referencedIds = new Set((refs || []).map(r => r.exercise_id));
  console.log(`${referencedIds.size} exercises are referenced by workouts`);

  const { data: existing } = await supabase.from('exercises').select('id');
  let deleted = 0;
  for (const ex of existing || []) {
    if (!referencedIds.has(ex.id)) {
      await supabase.from('exercises').delete().eq('id', ex.id);
      deleted++;
    }
  }
  console.log(`Deleted ${deleted} unreferenced exercises\n`);

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const exercise of exercises) {
    const data = {
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      equipment: [exercise.equipment],
      image_url: exercise.image_url,
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
        if (error.code === '23505') {
          // Duplicate - try update
          updated++;
        } else {
          console.error(`Failed to insert ${exercise.name}:`, error.message);
          failed++;
        }
      } else {
        inserted++;
      }
    }

    // Progress indicator
    if ((inserted + updated + failed) % 100 === 0) {
      process.stdout.write('.');
    }
  }

  console.log('\n\n=== SEED COMPLETE ===');
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);

  // Show final distribution
  const { data: final } = await supabase.from('exercises').select('muscle_group');
  const counts = {};
  (final || []).forEach(e => counts[e.muscle_group] = (counts[e.muscle_group] || 0) + 1);

  console.log('\n=== Final Distribution ===');
  Object.entries(counts).sort((a,b) => b[1]-a[1]).forEach(([m, c]) => console.log(`${m}: ${c}`));
  console.log(`\nTotal: ${final?.length || 0}`);
}

seed().catch(console.error);
