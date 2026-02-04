import { Alert } from 'react-native';
import { supabase } from '../supabase';
import { searchAndRankExercises } from '@/utils/exerciseSearch';
import { searchAscendExercises, AscendExercise } from './ascendExercises';
import { logger } from '@/utils/logger';

// Sanitize input for PostgREST filter strings to prevent filter injection
function sanitizePostgrestFilter(input: string): string {
  return input.replace(/[%_,().]/g, '');
}

// Extended exercise detail from Ascend API
export interface ExerciseDetail {
  id: string;
  name: string;
  muscle_group: string;
  equipment?: string[];
  image_url?: string;
  // From Ascend API
  instructions: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

export interface Exercise {
  id: string;
  name: string;
  display_name?: string; // Human-friendly name for UI (falls back to name if not set)
  muscle_group: string;
  equipment?: string[];
  instructions?: string;
  image_url?: string;
  thumbnail_url?: string; // Static thumbnail for fast list loading
  // New fields from ExerciseDB premium
  exercise_db_id?: string;
  target_muscles?: string[];
  secondary_muscles?: string[];
  body_parts?: string[];
  instructions_array?: string[];
  exercise_type?: string;
  keywords?: string[]; // Search aliases (e.g., "lat pulldown" for "cable pulldown (pro lat bar)")
  popularity?: number; // 0 = default, 1-5 = popular (used as search ranking tiebreaker)
  // Computed property for backward compatibility
  muscle?: string;
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

// Translation data for a single exercise
export interface ExerciseTranslation {
  exercise_id: string;
  name: string;
  display_name: string | null;
  instructions_array: string[] | null;
  keywords: string[] | null;
}

// Fetch all exercise translations for a given language
// Returns a Map keyed by exercise_id for O(1) lookup
export async function fetchExerciseTranslations(
  language: string
): Promise<Map<string, ExerciseTranslation>> {
  // English is the source language, no translations needed
  if (language === 'en') return new Map();

  // Fetch all translations - need to paginate since Supabase defaults to 1000 rows
  const allRows: ExerciseTranslation[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('exercise_translations')
      .select('exercise_id, name, display_name, instructions_array, keywords')
      .eq('language', language)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      logger.warn('Error fetching exercise translations', { error, language });
      break;
    }

    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const map = new Map<string, ExerciseTranslation>();
  for (const row of allRows) {
    map.set(row.exercise_id, row);
  }
  return map;
}

// Fetch all exercises from Supabase
export async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase.from('exercises').select('*').order('name');

  if (error) {
    logger.warn('Error fetching exercises', { error });
    Alert.alert(
      'Connection Error',
      'Unable to load exercises. Please check your connection and try again.'
    );
    return [];
  }

  // Add muscle as alias for muscle_group for backward compatibility
  return (data || []).map((e) => ({
    ...e,
    muscle: e.muscle_group,
  }));
}

// Search exercises by name or muscle group
export async function searchExercises(query: string): Promise<Exercise[]> {
  const sanitized = sanitizePostgrestFilter(query.trim());
  if (!sanitized) return [];

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .or(`name.ilike.%${sanitized}%,muscle_group.ilike.%${sanitized}%`)
    .order('name')
    .limit(50);

  if (error) {
    logger.warn('Error searching exercises', { error });
    return [];
  }

  return (data || []).map((e) => ({
    ...e,
    muscle: e.muscle_group,
  }));
}

// Get a single exercise by ID (supports UUID, exercise_db_id, and slug-style IDs)
export async function getExerciseById(id: string): Promise<Exercise | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (isUuid) {
    const { data, error } = await supabase.from('exercises').select('*').eq('id', id).single();
    if (error) {
      logger.warn('Error fetching exercise', { error });
      return null;
    }
    return data ? { ...data, muscle: data.muscle_group } : null;
  }

  // Try exercise_db_id lookup (numeric ExerciseDB IDs like "0085", "3236")
  const isExerciseDbId = /^\d{4}$/.test(id);
  if (isExerciseDbId) {
    const { data: dbIdResults, error: dbIdError } = await supabase
      .from('exercises')
      .select('*')
      .eq('exercise_db_id', id)
      .limit(1);

    if (!dbIdError && dbIdResults && dbIdResults.length > 0) {
      return { ...dbIdResults[0], muscle: dbIdResults[0].muscle_group };
    }
  }

  // Strategy 1: Slug-based ILIKE (ordered words)
  // "cable-crunches-kneeling" → "%cable%crunches%kneeling%"
  const sanitizedSlug = sanitizePostgrestFilter(id.replace(/-/g, ' ')).trim();
  const namePattern = `%${sanitizedSlug.replace(/\s+/g, '%')}%`;
  const { data: results, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('name', namePattern)
    .limit(1);

  if (error) {
    logger.warn('Error fetching exercise by slug', { error });
  }

  if (results && results.length > 0) {
    return { ...results[0], muscle: results[0].muscle_group };
  }

  // Strategy 2: Word-order-independent matching (handles reordered words)
  // "hip-thrust-barbell" → name ILIKE '%hip%' AND name ILIKE '%thrust%' AND name ILIKE '%barbell%'
  const words = id
    .split('-')
    .map((w) => sanitizePostgrestFilter(w))
    .filter((w) => w.length > 2);
  if (words.length > 0) {
    let query = supabase.from('exercises').select('*');
    for (const word of words) {
      query = query.ilike('name', `%${word}%`);
    }
    const { data: wordResults, error: wordError } = await query.limit(5);

    if (!wordError && wordResults && wordResults.length > 0) {
      // Prefer exact word count match to avoid false positives
      const bestMatch =
        wordResults.find((e) => {
          const nameWords = e.name.toLowerCase().split(/\s+/);
          return words.every((w) => nameWords.some((nw) => nw.includes(w)));
        }) || wordResults[0];
      return { ...bestMatch, muscle: bestMatch.muscle_group };
    }
  }

  return null;
}

// Filter exercises by muscle group
export async function getExercisesByMuscle(muscle: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('muscle_group', muscle)
    .order('name');

  if (error) {
    logger.warn('Error fetching exercises by muscle', { error });
    return [];
  }

  return (data || []).map((e) => ({
    ...e,
    muscle: e.muscle_group,
  }));
}

// Filter exercises by equipment (equipment is an array column)
export async function getExercisesByEquipment(equipment: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .contains('equipment', [equipment])
    .order('name');

  if (error) {
    logger.warn('Error fetching exercises by equipment', { error });
    return [];
  }

  return (data || []).map((e) => ({
    ...e,
    muscle: e.muscle_group,
  }));
}

// Filter exercises with combined filters (equipment, muscles, and search query)
interface FilterOptions {
  equipment?: string;
  muscles?: string[]; // Multi-select muscles filter
  query?: string;
}

// Equipment values that map to "Other" category
const OTHER_EQUIPMENT = [
  'smith machine',
  'weighted',
  'exercise ball',
  'medicine ball',
  'assisted',
  'roller',
  'bosu ball',
];

// Client-side filtering for cached exercises (no API call)
export function filterExercisesClient(exercises: Exercise[], options: FilterOptions): Exercise[] {
  let filtered = [...exercises];

  // Equipment filter
  if (options.equipment && options.equipment !== 'all') {
    const equipmentLower = options.equipment.toLowerCase();

    if (equipmentLower === 'other') {
      // "Other" includes misc equipment types
      filtered = filtered.filter(
        (e) => e.equipment && e.equipment.some((eq) => OTHER_EQUIPMENT.includes(eq.toLowerCase()))
      );
    } else if (equipmentLower === 'body weight' || equipmentLower === 'none') {
      // Body weight / None
      filtered = filtered.filter(
        (e) =>
          !e.equipment ||
          e.equipment.length === 0 ||
          e.equipment.some(
            (eq) => eq.toLowerCase() === 'body weight' || eq.toLowerCase() === 'bodyweight'
          )
      );
    } else if (equipmentLower === 'machine') {
      // Machine filter - match all machine types (leverage machine, smith machine, sled machine, etc.)
      filtered = filtered.filter(
        (e) => e.equipment && e.equipment.some((eq) => eq.toLowerCase().includes('machine'))
      );
    } else {
      // Specific equipment type
      filtered = filtered.filter(
        (e) => e.equipment && e.equipment.some((eq) => eq.toLowerCase() === equipmentLower)
      );
    }
  }

  // Muscle filter
  if (options.muscles && options.muscles.length > 0) {
    const musclesLower = options.muscles.map((m) => m.toLowerCase());
    filtered = filtered.filter(
      (e) => e.muscle_group && musclesLower.includes(e.muscle_group.toLowerCase())
    );
  }

  // Search query with smart ranking
  if (options.query && options.query.trim()) {
    return searchAndRankExercises(filtered, options.query);
  }

  return filtered;
}

// Helper function to filter exercises by multiple muscles using exercise_muscles table
async function filterByMuscles(exerciseIds: string[], muscles: string[]): Promise<Set<string>> {
  // Get exercise_muscles mappings for the given exercises
  const { data: muscleMappings, error } = await supabase
    .from('exercise_muscles')
    .select('exercise_id, muscle')
    .in('exercise_id', exerciseIds);

  if (error) {
    logger.warn('Error fetching exercise muscles', { error });
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

  // Fetch all exercises
  const { data, error } = await supabase.from('exercises').select('*').order('name');

  if (error) {
    logger.warn('Error filtering exercises', { error });
    return [];
  }

  // Add muscle alias for backward compatibility
  let exercises = (data || []).map((e) => ({
    ...e,
    muscle: e.muscle_group,
  }));

  // Apply equipment filter (equipment is an array column)
  if (equipment) {
    const equipmentLower = equipment.toLowerCase();
    if (
      equipment === 'none' ||
      equipmentLower === 'body weight' ||
      equipmentLower === 'bodyweight'
    ) {
      exercises = exercises.filter(
        (e) =>
          !e.equipment ||
          e.equipment.length === 0 ||
          e.equipment.some(
            (eq: string) => eq.toLowerCase() === 'body weight' || eq.toLowerCase() === 'bodyweight'
          )
      );
    } else {
      exercises = exercises.filter(
        (e) => e.equipment && e.equipment.some((eq: string) => eq.toLowerCase() === equipmentLower)
      );
    }
  }

  // Apply muscle filter using muscle_group column
  if (muscles && muscles.length > 0) {
    const musclesLower = muscles.map((m) => m.toLowerCase());
    exercises = exercises.filter(
      (e) => e.muscle_group && musclesLower.includes(e.muscle_group.toLowerCase())
    );
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
    if (weError) {
      logger.warn('Error fetching workout exercises', { error: weError });
      Alert.alert('Connection Error', 'Unable to load exercise history. Please try again.');
    }
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
    if (wError) {
      logger.warn('Error fetching workouts', { error: wError });
      Alert.alert('Connection Error', 'Unable to load exercise history. Please try again.');
    }
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
    .select('workout_exercise_id, set_number, weight, reps')
    .in('workout_exercise_id', workoutExerciseIds);

  if (sError) {
    logger.warn('Error fetching workout sets', { error: sError });
  }

  // Build the history entries
  return workouts.map((workout) => {
    const workoutExercise = relevantWorkoutExercises.find((we) => we.workout_id === workout.id);
    const workoutSets = (sets || [])
      .filter((s) => s.workout_exercise_id === workoutExercise?.id)
      .sort((a, b) => a.set_number - b.set_number)
      .map((s) => ({
        setNumber: s.set_number,
        weightKg: s.weight,
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
    if (weError) logger.warn('Error fetching workout exercises', { error: weError });
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
    if (wError) logger.warn('Error fetching workouts', { error: wError });
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
    .select('workout_exercise_id, weight, reps')
    .in('workout_exercise_id', workoutExerciseIds);

  if (sError || !sets || sets.length === 0) {
    if (sError) logger.warn('Error fetching workout sets', { error: sError });
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
    const weightKg = set.weight;
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

// Fetch detailed exercise info from Ascend API (includes instructions and muscles)
// Returns null if not found or on error
export async function getExerciseDetailFromAscend(
  exerciseName: string
): Promise<ExerciseDetail | null> {
  try {
    // Search Ascend API by exercise name
    const results = await searchAscendExercises(exerciseName, 10);

    if (!results || results.length === 0) {
      logger.warn('No Ascend results for exercise', { exerciseName });
      return null;
    }

    // Find exact or close match
    const nameLower = exerciseName.toLowerCase().trim();
    const exactMatch = results.find((r) => r.name.toLowerCase().trim() === nameLower);
    const closeMatch = results.find(
      (r) => r.name.toLowerCase().includes(nameLower) || nameLower.includes(r.name.toLowerCase())
    );

    const match = exactMatch || closeMatch || results[0];

    if (!match) {
      return null;
    }

    return {
      id: match.exerciseId,
      name: match.name,
      muscle_group: match.targetMuscles?.[0] || 'Unknown',
      equipment: match.equipments || [],
      image_url: match.gifUrl,
      instructions: match.instructions || [],
      primaryMuscles: match.targetMuscles || [],
      secondaryMuscles: match.secondaryMuscles || [],
    };
  } catch (error) {
    logger.warn('Error fetching from Ascend API', { error });
    return null;
  }
}
