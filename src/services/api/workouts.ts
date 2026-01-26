import { supabase } from '../supabase';
import { z } from 'zod';
import {
  SaveWorkoutInputSchema,
  UserExercisePreferenceSchema,
  type SaveWorkoutInput as ValidatedSaveWorkoutInput,
} from '@/schemas/workout.schema';

// =============================================
// TYPES - Normalized Database Schema
// =============================================

// Set types available in the app
export type SetType = 'normal' | 'warmup' | 'failure' | 'dropset';

export interface DbWorkout {
  id: string;
  user_id: string;
  name: string | null;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  notes: string | null;
  source_template_id: string | null;
  created_at: string;
}

export interface DbWorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_name: string;
  exercise_muscle: string | null;
  notes: string | null;
  order_index: number;
  superset_id: number | null;
  rest_timer_seconds: number;
  created_at: string;
}

export interface DbWorkoutSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  set_type: SetType;
  completed: boolean;
  created_at: string;
}

export interface DbExerciseMuscle {
  id: string;
  exercise_id: string;
  muscle: string;
  activation: 'primary' | 'secondary';
  created_at: string;
}

export interface DbWorkoutMuscle {
  id: string;
  workout_id: string;
  muscle: string;
  total_sets: number;
  activation: 'primary' | 'secondary';
  created_at: string;
}

// Types for saving a new workout
export interface SaveWorkoutInput {
  userId: string;
  name?: string;
  startedAt: Date;
  completedAt: Date;
  durationSeconds: number;
  notes?: string;
  sourceTemplateId?: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    exerciseMuscle: string;
    notes: string;
    supersetId: number | null;
    restTimerSeconds: number;
    sets: {
      setNumber: number;
      weightKg: number | null;
      reps: number | null;
      setType: SetType;
      completed: boolean;
    }[];
  }[];
}

// Type for workout history display
export interface WorkoutHistoryItem {
  id: string;
  userId: string;
  name: string | null;
  completedAt: string;
  durationSeconds: number;
  exerciseCount: number;
  totalSets: number;
}

// Type for previous sets
export interface PreviousSetData {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
}

// =============================================
// SAVE COMPLETED WORKOUT
// =============================================

export async function saveCompletedWorkout(input: SaveWorkoutInput): Promise<string | null> {
  // Validate input before any database operations
  const parseResult = SaveWorkoutInputSchema.safeParse(input);
  if (!parseResult.success) {
    console.error('Invalid workout input:', parseResult.error.flatten());
    return null;
  }

  // Use validated input from here on
  const validatedInput = parseResult.data;

  try {
    // Generate a default workout name if none provided
    const workoutName =
      validatedInput.name ||
      `Workout - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // 1. Insert the workout record
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        user_id: validatedInput.userId,
        name: workoutName,
        started_at: validatedInput.startedAt.toISOString(),
        completed_at: validatedInput.completedAt.toISOString(),
        duration_seconds: validatedInput.durationSeconds,
        notes: validatedInput.notes || null,
        source_template_id: validatedInput.sourceTemplateId || null,
      })
      .select('id')
      .single();

    if (workoutError || !workout) {
      console.error('Error saving workout:', workoutError);
      return null;
    }

    const workoutId = workout.id;

    // Track muscles worked for aggregate storage
    const muscleSetCounts = new Map<string, { primary: number; secondary: number }>();

    // 2. Insert workout_exercises for each exercise
    for (let i = 0; i < validatedInput.exercises.length; i++) {
      const exercise = validatedInput.exercises[i];
      const completedSetsCount = exercise.sets.filter((s) => s.completed).length;

      const { data: workoutExercise, error: exerciseError } = await supabase
        .from('workout_exercises')
        .insert({
          workout_id: workoutId,
          exercise_id: exercise.exerciseId,
          exercise_name: exercise.exerciseName,
          exercise_muscle: exercise.exerciseMuscle || null,
          notes: exercise.notes || null,
          order_index: i + 1,
          superset_id: exercise.supersetId,
          rest_timer_seconds: exercise.restTimerSeconds || 90,
        })
        .select('id')
        .single();

      if (exerciseError || !workoutExercise) {
        console.error('Error saving workout exercise:', exerciseError);
        continue;
      }

      // 3. Insert workout_sets for this exercise
      const setsToInsert = exercise.sets.map((set) => ({
        workout_exercise_id: workoutExercise.id,
        set_number: set.setNumber,
        weight_kg: set.weightKg,
        reps: set.reps,
        set_type: set.setType || 'normal',
        completed: set.completed,
      }));

      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase.from('workout_sets').insert(setsToInsert);

        if (setsError) {
          console.error('Error saving workout sets:', setsError);
        }
      }

      // 4. Fetch muscle mappings for this exercise and aggregate
      if (completedSetsCount > 0) {
        const { data: exerciseMuscles } = await supabase
          .from('exercise_muscles')
          .select('muscle, activation')
          .eq('exercise_id', exercise.exerciseId);

        if (exerciseMuscles) {
          exerciseMuscles.forEach((em) => {
            const current = muscleSetCounts.get(em.muscle) || { primary: 0, secondary: 0 };
            if (em.activation === 'primary') {
              current.primary += completedSetsCount;
            } else {
              current.secondary += completedSetsCount;
            }
            muscleSetCounts.set(em.muscle, current);
          });
        }
      }
    }

    // 5. Insert aggregate workout_muscles data
    const musclesToInsert: {
      workout_id: string;
      muscle: string;
      total_sets: number;
      activation: string;
    }[] = [];
    muscleSetCounts.forEach((counts, muscle) => {
      if (counts.primary > 0) {
        musclesToInsert.push({
          workout_id: workoutId,
          muscle,
          total_sets: counts.primary,
          activation: 'primary',
        });
      }
      if (counts.secondary > 0) {
        musclesToInsert.push({
          workout_id: workoutId,
          muscle,
          total_sets: counts.secondary,
          activation: 'secondary',
        });
      }
    });

    if (musclesToInsert.length > 0) {
      const { error: musclesError } = await supabase
        .from('workout_muscles')
        .insert(musclesToInsert);

      if (musclesError) {
        console.error('Error saving workout muscles:', musclesError);
      }
    }

    return workoutId;
  } catch (error) {
    console.error('Error in saveCompletedWorkout:', error);
    return null;
  }
}

// =============================================
// GET PREVIOUS SETS FOR AN EXERCISE
// =============================================

export async function getExercisePreviousSets(
  userId: string,
  exerciseId: string
): Promise<PreviousSetData[] | null> {
  const result = await getBatchExercisePreviousSets(userId, [exerciseId]);
  return result.get(exerciseId) || null;
}

// Batch version - fetches previous sets for multiple exercises in fewer queries
export async function getBatchExercisePreviousSets(
  userId: string,
  exerciseIds: string[]
): Promise<Map<string, PreviousSetData[]>> {
  const result = new Map<string, PreviousSetData[]>();

  if (exerciseIds.length === 0) return result;

  try {
    // Single query to get the most recent workout exercise for each exercise_id
    // Uses a subquery approach to get the latest workout for each exercise
    const { data: workoutExercises, error } = await supabase
      .from('workout_exercises')
      .select(
        `
        id,
        exercise_id,
        workout:workouts!inner(
          user_id,
          completed_at
        )
      `
      )
      .in('exercise_id', exerciseIds)
      .eq('workout.user_id', userId)
      .order('workout(completed_at)', { ascending: false });

    if (error || !workoutExercises || workoutExercises.length === 0) {
      return result;
    }

    // Group by exercise_id and take only the most recent one for each
    const latestByExercise = new Map<string, string>();
    for (const we of workoutExercises) {
      if (!latestByExercise.has(we.exercise_id)) {
        latestByExercise.set(we.exercise_id, we.id);
      }
    }

    const workoutExerciseIds = Array.from(latestByExercise.values());

    if (workoutExerciseIds.length === 0) return result;

    // Single query to get all sets for all relevant workout exercises
    const { data: sets, error: setsError } = await supabase
      .from('workout_sets')
      .select('workout_exercise_id, set_number, weight_kg, reps')
      .in('workout_exercise_id', workoutExerciseIds)
      .order('set_number');

    if (setsError || !sets) {
      return result;
    }

    // Create reverse lookup: workout_exercise_id -> exercise_id
    const weIdToExerciseId = new Map<string, string>();
    for (const [exerciseId, weId] of latestByExercise.entries()) {
      weIdToExerciseId.set(weId, exerciseId);
    }

    // Group sets by exercise_id
    for (const set of sets) {
      const exerciseId = weIdToExerciseId.get(set.workout_exercise_id);
      if (!exerciseId) continue;

      if (!result.has(exerciseId)) {
        result.set(exerciseId, []);
      }
      result.get(exerciseId)!.push({
        setNumber: set.set_number,
        weightKg: set.weight_kg,
        reps: set.reps,
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching batch previous sets:', error);
    return result;
  }
}

// =============================================
// GET WORKOUT HISTORY
// =============================================

export async function getWorkoutHistory(userId: string, limit = 20): Promise<WorkoutHistoryItem[]> {
  try {
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select(
        `
        id,
        name,
        completed_at,
        duration_seconds,
        workout_exercises(
          id,
          workout_sets(id)
        )
      `
      )
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error || !workouts) {
      console.error('Error fetching workout history:', error);
      return [];
    }

    return workouts.map((workout) => {
      const exercises = workout.workout_exercises || [];
      const totalSets = exercises.reduce((sum, ex) => sum + (ex.workout_sets?.length || 0), 0);

      return {
        id: workout.id,
        userId, // Include userId for per-user filtering
        name: workout.name,
        completedAt: workout.completed_at,
        durationSeconds: workout.duration_seconds,
        exerciseCount: exercises.length,
        totalSets,
      };
    });
  } catch (error) {
    console.error('Error in getWorkoutHistory:', error);
    return [];
  }
}

// =============================================
// GET SINGLE WORKOUT WITH FULL DETAILS
// =============================================

export async function getWorkoutById(workoutId: string): Promise<{
  workout: DbWorkout;
  exercises: (DbWorkoutExercise & { sets: DbWorkoutSet[] })[];
} | null> {
  try {
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single();

    if (workoutError || !workout) {
      return null;
    }

    const { data: exercises, error: exercisesError } = await supabase
      .from('workout_exercises')
      .select(
        `
        *,
        workout_sets(*)
      `
      )
      .eq('workout_id', workoutId)
      .order('order_index');

    if (exercisesError) {
      console.error('Error fetching workout exercises:', exercisesError);
      return { workout, exercises: [] };
    }

    return {
      workout,
      exercises: exercises.map((ex) => ({
        ...ex,
        sets: ex.workout_sets || [],
      })),
    };
  } catch (error) {
    console.error('Error in getWorkoutById:', error);
    return null;
  }
}

// =============================================
// DELETE WORKOUT
// =============================================

export async function deleteWorkout(workoutId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('workouts').delete().eq('id', workoutId);

    if (error) {
      console.error('Error deleting workout:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteWorkout:', error);
    return false;
  }
}

// =============================================
// USER EXERCISE PREFERENCES (Rest Timer, etc.)
// =============================================

export interface UserExercisePreference {
  exerciseId: string;
  restTimerSeconds: number;
}

// Get user's preference for a specific exercise
export async function getUserExercisePreference(
  userId: string,
  exerciseId: string
): Promise<UserExercisePreference | null> {
  try {
    const { data, error } = await supabase
      .from('user_exercise_preferences')
      .select('exercise_id, rest_timer_seconds')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      exerciseId: data.exercise_id,
      restTimerSeconds: data.rest_timer_seconds || 0,
    };
  } catch (error) {
    console.error('Error fetching exercise preference:', error);
    return null;
  }
}

// Get user's preferences for multiple exercises at once
export async function getUserExercisePreferences(
  userId: string,
  exerciseIds: string[]
): Promise<Map<string, UserExercisePreference>> {
  const preferencesMap = new Map<string, UserExercisePreference>();

  if (exerciseIds.length === 0) return preferencesMap;

  try {
    const { data, error } = await supabase
      .from('user_exercise_preferences')
      .select('exercise_id, rest_timer_seconds')
      .eq('user_id', userId)
      .in('exercise_id', exerciseIds);

    if (error || !data) {
      return preferencesMap;
    }

    data.forEach((pref) => {
      preferencesMap.set(pref.exercise_id, {
        exerciseId: pref.exercise_id,
        restTimerSeconds: pref.rest_timer_seconds || 0,
      });
    });

    return preferencesMap;
  } catch (error) {
    console.error('Error fetching exercise preferences:', error);
    return preferencesMap;
  }
}

// Save/update user's preference for a specific exercise
export async function saveUserExercisePreference(
  userId: string,
  exerciseId: string,
  restTimerSeconds: number
): Promise<boolean> {
  // Validate input
  const parseResult = UserExercisePreferenceSchema.safeParse({
    userId,
    exerciseId,
    restTimerSeconds,
  });
  if (!parseResult.success) {
    console.error('Invalid exercise preference input:', parseResult.error.flatten());
    return false;
  }

  try {
    const { error } = await supabase.from('user_exercise_preferences').upsert(
      {
        user_id: userId,
        exercise_id: exerciseId,
        rest_timer_seconds: restTimerSeconds,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,exercise_id',
      }
    );

    if (error) {
      console.error('Error saving exercise preference:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveUserExercisePreference:', error);
    return false;
  }
}

// =============================================
// GET WORKOUTS FOR DATE RANGE (Calendar)
// =============================================

export async function getWorkoutsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<WorkoutHistoryItem[]> {
  try {
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select(
        `
        id,
        name,
        completed_at,
        duration_seconds,
        workout_exercises(id)
      `
      )
      .eq('user_id', userId)
      .gte('completed_at', startDate)
      .lte('completed_at', endDate)
      .order('completed_at');

    if (error || !workouts) {
      console.error('Error fetching workouts by date range:', error);
      return [];
    }

    return workouts.map((workout) => ({
      id: workout.id,
      userId, // Include userId for per-user filtering in store
      name: workout.name,
      completedAt: workout.completed_at,
      durationSeconds: workout.duration_seconds,
      exerciseCount: workout.workout_exercises?.length || 0,
      totalSets: 0, // Not fetching sets for calendar view
    }));
  } catch (error) {
    console.error('Error in getWorkoutsByDateRange:', error);
    return [];
  }
}

// =============================================
// EXERCISE MUSCLE MAPPINGS
// =============================================

export interface ExerciseMuscle {
  muscle: string;
  activation: 'primary' | 'secondary';
}

// Get muscle mappings for multiple exercises at once (for save-workout preview)
export async function getExerciseMuscles(
  exerciseIds: string[]
): Promise<Map<string, ExerciseMuscle[]>> {
  const result = new Map<string, ExerciseMuscle[]>();

  if (exerciseIds.length === 0) return result;

  try {
    const { data, error } = await supabase
      .from('exercise_muscles')
      .select('exercise_id, muscle, activation')
      .in('exercise_id', exerciseIds);

    if (error || !data) {
      console.error('Error fetching exercise muscles:', error);
      return result;
    }

    // Group by exercise_id
    data.forEach((em) => {
      if (!result.has(em.exercise_id)) {
        result.set(em.exercise_id, []);
      }
      result.get(em.exercise_id)!.push({
        muscle: em.muscle,
        activation: em.activation as 'primary' | 'secondary',
      });
    });

    return result;
  } catch (error) {
    console.error('Error in getExerciseMuscles:', error);
    return result;
  }
}

// =============================================
// GET WORKOUT MUSCLES (for saved workout details)
// =============================================

export interface WorkoutMuscleData {
  muscle: string;
  totalSets: number;
  activation: 'primary' | 'secondary';
}

export async function getWorkoutMuscles(workoutId: string): Promise<WorkoutMuscleData[]> {
  try {
    const { data, error } = await supabase
      .from('workout_muscles')
      .select('muscle, total_sets, activation')
      .eq('workout_id', workoutId);

    if (error || !data) {
      console.error('Error fetching workout muscles:', error);
      return [];
    }

    return data.map((wm) => ({
      muscle: wm.muscle,
      totalSets: wm.total_sets,
      activation: wm.activation as 'primary' | 'secondary',
    }));
  } catch (error) {
    console.error('Error in getWorkoutMuscles:', error);
    return [];
  }
}

// Aggregate muscle data for display (combines primary and secondary)
export function aggregateMuscleData(
  muscles: WorkoutMuscleData[]
): { name: string; sets: number; isPrimary: boolean }[] {
  // Group by muscle name, keeping track of primary sets
  const muscleMap = new Map<string, { primarySets: number; secondarySets: number }>();

  muscles.forEach((m) => {
    const existing = muscleMap.get(m.muscle) || { primarySets: 0, secondarySets: 0 };
    if (m.activation === 'primary') {
      existing.primarySets += m.totalSets;
    } else {
      existing.secondarySets += m.totalSets;
    }
    muscleMap.set(m.muscle, existing);
  });

  // Convert to array and sort by primary sets first, then secondary
  const result: { name: string; sets: number; isPrimary: boolean }[] = [];

  muscleMap.forEach((data, muscle) => {
    // Primary muscles (if any primary sets)
    if (data.primarySets > 0) {
      result.push({
        name: muscle,
        sets: data.primarySets,
        isPrimary: true,
      });
    }
    // Secondary muscles (if only secondary sets for this muscle)
    if (data.primarySets === 0 && data.secondarySets > 0) {
      result.push({
        name: muscle,
        sets: data.secondarySets,
        isPrimary: false,
      });
    }
  });

  // Sort: primary first (by sets), then secondary (by sets)
  return result.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return b.sets - a.sets;
  });
}
