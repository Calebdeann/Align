import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabase = createClient(
  'https://app.aligntracker.app',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZ3BzYWJ5cXN1dW5hanRvdGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MzMyODgsImV4cCI6MjA4NDEwOTI4OH0.1uYlpa65jGJDvZ-z9OH18p5HdFYllRS6jXezNIBELh8'
);

async function exportExercises() {
  const allExercises = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  // Paginate through all exercises
  while (true) {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, name, display_name, muscle_group, target_muscles, secondary_muscles, equipment, instructions_array, image_url, exercise_type')
      .order('name')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching exercises:', error);
      break;
    }

    if (!data || data.length === 0) break;
    allExercises.push(...data);
    offset += PAGE_SIZE;
    console.log(`Fetched ${allExercises.length} exercises so far...`);
  }

  // Filter to only exercises that have instructions
  const withInstructions = allExercises.filter(
    (e) => e.instructions_array && e.instructions_array.length > 0
  );

  // Clean up step prefixes (same logic as the app)
  const cleaned = withInstructions.map((e) => ({
    name: e.display_name || e.name,
    muscle_group: e.muscle_group,
    target_muscles: e.target_muscles || [],
    secondary_muscles: e.secondary_muscles || [],
    equipment: e.equipment || [],
    exercise_type: e.exercise_type || null,
    gif_url: e.image_url || null,
    steps: e.instructions_array.map((step, i) => ({
      step: i + 1,
      instruction: step.replace(/^step\s*:?\s*\d+\s*:?\s*/i, '').trim(),
    })),
  }));

  const output = {
    total_exercises: allExercises.length,
    exercises_with_instructions: cleaned.length,
    exercises: cleaned,
  };

  writeFileSync('exercises-export.json', JSON.stringify(output, null, 2));
  console.log(`\nDone! Exported ${cleaned.length} exercises with instructions (${allExercises.length} total) to exercises-export.json`);
}

exportExercises();
