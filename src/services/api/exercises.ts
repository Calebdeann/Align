import { supabase } from '../supabase';
import { searchAndRankExercises } from '@/utils/exerciseSearch';

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment?: string;
  instructions?: string;
  image_url?: string;
}

// Exercise history entry for detail page
export interface ExerciseHistoryEntry {
  workoutId: string;
  workoutName: string | null;
  completedAt: string;
  sets: { setNumber: number; weightKg: number | null; reps: number | null }[];
  sessionVolume: number;
}

// Personal records for exercise
export interface ExercisePersonalRecords {
  heaviestWeight: { weightKg: number; date: string } | null;
  bestOneRepMax: { value: number; weightKg: number; reps: number; date: string } | null;
  bestSetVolume: { volume: number; weightKg: number; reps: number; date: string } | null;
  bestSessionVolume: { volume: number; date: string } | null;
}

// Fetch all exercises from Supabase
export async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase.from('exercises').select('*').order('name');

  if (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }

  return data || [];
}

// Search exercises by name or muscle group
export async function searchExercises(query: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .or(`name.ilike.%${query}%,muscle.ilike.%${query}%`)
    .order('name');

  if (error) {
    console.error('Error searching exercises:', error);
    return [];
  }

  return data || [];
}

// Get a single exercise by ID
export async function getExerciseById(id: string): Promise<Exercise | null> {
  const { data, error } = await supabase.from('exercises').select('*').eq('id', id).single();

  if (error) {
    console.error('Error fetching exercise:', error);
    return null;
  }

  return data;
}

// Filter exercises by muscle group
export async function getExercisesByMuscle(muscle: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('muscle', muscle)
    .order('name');

  if (error) {
    console.error('Error fetching exercises by muscle:', error);
    return [];
  }

  return data || [];
}

// Filter exercises by equipment
export async function getExercisesByEquipment(equipment: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('equipment', equipment)
    .order('name');

  if (error) {
    console.error('Error fetching exercises by equipment:', error);
    return [];
  }

  return data || [];
}

// Filter exercises with combined filters (equipment, muscles, and search query)
interface FilterOptions {
  equipment?: string;
  muscles?: string[]; // Multi-select muscles filter
  query?: string;
}

// Helper function to filter exercises by multiple muscles using exercise_muscles table
async function filterByMuscles(exerciseIds: string[], muscles: string[]): Promise<Set<string>> {
  // Get exercise_muscles mappings for the given exercises
  const { data: muscleMappings, error } = await supabase
    .from('exercise_muscles')
    .select('exercise_id, muscle')
    .in('exercise_id', exerciseIds);

  if (error) {
    console.error('Error fetching exercise muscles:', error);
    return new Set(exerciseIds); // Return all if error
  }

  // Group muscles by exercise
  const exerciseMuscleMap = new Map<string, Set<string>>();
  (muscleMappings || []).forEach((em) => {
    if (!exerciseMuscleMap.has(em.exercise_id)) {
      exerciseMuscleMap.set(em.exercise_id, new Set());
    }
    exerciseMuscleMap.get(em.exercise_id)!.add(em.muscle.toLowerCase());
  });

  // Filter exercises that have ALL selected muscles
  const musclesLower = muscles.map((m) => m.toLowerCase());
  const matchingIds = new Set<string>();

  exerciseIds.forEach((exerciseId) => {
    const exerciseMuscles = exerciseMuscleMap.get(exerciseId);
    if (exerciseMuscles) {
      // Check if exercise works ALL selected muscles
      const hasAllMuscles = musclesLower.every((muscle) => exerciseMuscles.has(muscle));
      if (hasAllMuscles) {
        matchingIds.add(exerciseId);
      }
    }
  });

  return matchingIds;
}

export async function filterExercises(options: FilterOptions): Promise<Exercise[]> {
  const { equipment, muscles, query } = options;

  // Fetch all exercises first (we need to filter by muscles using exercise_muscles table)
  const { data, error } = await supabase.from('exercises').select('*').order('name');

  if (error) {
    console.error('Error filtering exercises:', error);
    return [];
  }

  let exercises = data || [];

  // Apply equipment filter
  if (equipment) {
    const equipmentLower = equipment.toLowerCase();
    if (equipment === 'none') {
      exercises = exercises.filter(
        (e) =>
          !e.equipment ||
          e.equipment.toLowerCase() === 'none' ||
          e.equipment.toLowerCase() === 'bodyweight'
      );
    } else {
      exercises = exercises.filter(
        (e) => e.equipment && e.equipment.toLowerCase() === equipmentLower
      );
    }
  }

  // Apply multi-muscle filter using exercise_muscles table
  if (muscles && muscles.length > 0) {
    const exerciseIds = exercises.map((e) => e.id);
    const matchingIds = await filterByMuscles(exerciseIds, muscles);
    exercises = exercises.filter((e) => matchingIds.has(e.id));
  }

  // Apply search query with smart ranking
  if (query && query.trim()) {
    return searchAndRankExercises(exercises, query);
  }

  return exercises;
}

// Get exercise history for a specific exercise
export async function getExerciseHistory(
  userId: string,
  exerciseId: string,
  limit: number = 20
): Promise<ExerciseHistoryEntry[]> {
  // First, get all workouts for this user that contain this exercise
  const { data: workoutExercises, error: weError } = await supabase
    .from('workout_exercises')
    .select('id, workout_id')
    .eq('exercise_id', exerciseId);

  if (weError || !workoutExercises || workoutExercises.length === 0) {
    if (weError) console.error('Error fetching workout exercises:', weError);
    return [];
  }

  const workoutIds = [...new Set(workoutExercises.map((we) => we.workout_id))];

  // Get the workouts for this user
  const { data: workouts, error: wError } = await supabase
    .from('workouts')
    .select('id, name, completed_at')
    .eq('user_id', userId)
    .in('id', workoutIds)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (wError || !workouts) {
    if (wError) console.error('Error fetching workouts:', wError);
    return [];
  }

  // Get the workout_exercise IDs for these workouts
  const relevantWorkoutExercises = workoutExercises.filter((we) =>
    workouts.some((w) => w.id === we.workout_id)
  );
  const workoutExerciseIds = relevantWorkoutExercises.map((we) => we.id);

  // Get all sets for these workout exercises
  const { data: sets, error: sError } = await supabase
    .from('workout_sets')
    .select('workout_exercise_id, set_number, weight_kg, reps')
    .in('workout_exercise_id', workoutExerciseIds);

  if (sError) {
    console.error('Error fetching workout sets:', sError);
  }

  // Build the history entries
  return workouts.map((workout) => {
    const workoutExercise = relevantWorkoutExercises.find((we) => we.workout_id === workout.id);
    const workoutSets = (sets || [])
      .filter((s) => s.workout_exercise_id === workoutExercise?.id)
      .sort((a, b) => a.set_number - b.set_number)
      .map((s) => ({
        setNumber: s.set_number,
        weightKg: s.weight_kg,
        reps: s.reps,
      }));

    const sessionVolume = workoutSets.reduce((total, set) => {
      if (set.weightKg && set.reps) {
        return total + set.weightKg * set.reps;
      }
      return total;
    }, 0);

    return {
      workoutId: workout.id,
      workoutName: workout.name || null,
      completedAt: workout.completed_at,
      sets: workoutSets,
      sessionVolume,
    };
  });
}

// Calculate personal records for a specific exercise
export async function getExercisePersonalRecords(
  userId: string,
  exerciseId: string
): Promise<ExercisePersonalRecords> {
  const emptyResult: ExercisePersonalRecords = {
    heaviestWeight: null,
    bestOneRepMax: null,
    bestSetVolume: null,
    bestSessionVolume: null,
  };

  // First, get all workout_exercises for this exercise
  const { data: workoutExercises, error: weError } = await supabase
    .from('workout_exercises')
    .select('id, workout_id')
    .eq('exercise_id', exerciseId);

  if (weError || !workoutExercises || workoutExercises.length === 0) {
    if (weError) console.error('Error fetching workout exercises:', weError);
    return emptyResult;
  }

  const workoutIds = [...new Set(workoutExercises.map((we) => we.workout_id))];

  // Get workouts for this user only
  const { data: workouts, error: wError } = await supabase
    .from('workouts')
    .select('id, completed_at')
    .eq('user_id', userId)
    .in('id', workoutIds);

  if (wError || !workouts || workouts.length === 0) {
    if (wError) console.error('Error fetching workouts:', wError);
    return emptyResult;
  }

  // Filter workout_exercises to only those belonging to this user's workouts
  const userWorkoutIds = new Set(workouts.map((w) => w.id));
  const userWorkoutExercises = workoutExercises.filter((we) => userWorkoutIds.has(we.workout_id));
  const workoutExerciseIds = userWorkoutExercises.map((we) => we.id);

  if (workoutExerciseIds.length === 0) {
    return emptyResult;
  }

  // Get all sets for these workout exercises
  const { data: sets, error: sError } = await supabase
    .from('workout_sets')
    .select('workout_exercise_id, weight_kg, reps')
    .in('workout_exercise_id', workoutExerciseIds);

  if (sError || !sets || sets.length === 0) {
    if (sError) console.error('Error fetching workout sets:', sError);
    return emptyResult;
  }

  // Create a map of workout_exercise_id to workout completed_at
  const workoutDateMap = new Map<string, string>();
  userWorkoutExercises.forEach((we) => {
    const workout = workouts.find((w) => w.id === we.workout_id);
    if (workout) {
      workoutDateMap.set(we.id, workout.completed_at);
    }
  });

  let heaviestWeight: ExercisePersonalRecords['heaviestWeight'] = null;
  let bestOneRepMax: ExercisePersonalRecords['bestOneRepMax'] = null;
  let bestSetVolume: ExercisePersonalRecords['bestSetVolume'] = null;

  // Track volume per workout for best session volume
  const workoutVolumes = new Map<string, { volume: number; date: string }>();

  // Process each set
  sets.forEach((set) => {
    const completedAt = workoutDateMap.get(set.workout_exercise_id) || '';
    const weightKg = set.weight_kg;
    const reps = set.reps;

    if (weightKg !== null && weightKg !== undefined) {
      // Check heaviest weight
      if (!heaviestWeight || weightKg > heaviestWeight.weightKg) {
        heaviestWeight = { weightKg, date: completedAt };
      }
    }

    if (weightKg && reps) {
      // Calculate estimated 1RM using Epley formula: weight * (1 + reps/30)
      const estimated1RM = weightKg * (1 + reps / 30);
      if (!bestOneRepMax || estimated1RM > bestOneRepMax.value) {
        bestOneRepMax = { value: estimated1RM, weightKg, reps, date: completedAt };
      }

      // Calculate set volume
      const setVolume = weightKg * reps;
      if (!bestSetVolume || setVolume > bestSetVolume.volume) {
        bestSetVolume = { volume: setVolume, weightKg, reps, date: completedAt };
      }

      // Accumulate workout volume
      const workoutExercise = userWorkoutExercises.find((we) => we.id === set.workout_exercise_id);
      if (workoutExercise) {
        const existing = workoutVolumes.get(workoutExercise.workout_id);
        if (existing) {
          existing.volume += setVolume;
        } else {
          workoutVolumes.set(workoutExercise.workout_id, {
            volume: setVolume,
            date: completedAt,
          });
        }
      }
    }
  });

  // Find best session volume
  let bestSessionVolume: ExercisePersonalRecords['bestSessionVolume'] = null;
  workoutVolumes.forEach((data) => {
    if (!bestSessionVolume || data.volume > bestSessionVolume.volume) {
      bestSessionVolume = { volume: data.volume, date: data.date };
    }
  });

  return {
    heaviestWeight,
    bestOneRepMax,
    bestSetVolume,
    bestSessionVolume,
  };
}
