import { Alert } from 'react-native';
import { supabase } from '../supabase';
import { z } from 'zod';
import {
  SaveWorkoutInputSchema,
  UserExercisePreferenceSchema,
  type SaveWorkoutInput as ValidatedSaveWorkoutInput,
} from '@/schemas/workout.schema';
import { logger } from '@/utils/logger';

// Helper: detect Supabase schema/column errors (e.g. migration not applied yet)
function isSchemaError(error: any): boolean {
  if (!error?.code) return false;
  const code = String(error.code);
  // PGRST204 = column not found in schema cache
  // PGRST301 = could not find relation
  // 42xxx = PostgreSQL schema errors
  return code === 'PGRST204' || code === 'PGRST301' || code.startsWith('42');
}

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
  image_type: string | null;
  image_uri: string | null;
  image_template_id: string | null;
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
  image_url?: string | null;
  thumbnail_url?: string | null;
}

export interface DbWorkoutSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  set_type: SetType;
  completed: boolean;
  rpe: number | null;
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
  imageType?: 'template' | 'camera' | 'gallery';
  imageUri?: string;
  imageTemplateId?: string;
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
  imageType: string | null;
  imageUri: string | null;
  imageTemplateId: string | null;
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
    logger.warn('Invalid workout input', { error: parseResult.error.flatten() });
    Alert.alert('Save Error', 'Unable to save workout. Please try again.');
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
    // Base insert uses only established columns (always works)
    const baseWorkoutInsert: Record<string, any> = {
      user_id: validatedInput.userId,
      name: workoutName,
      started_at: validatedInput.startedAt.toISOString(),
      completed_at: validatedInput.completedAt.toISOString(),
      duration_seconds: validatedInput.durationSeconds,
      notes: validatedInput.notes || null,
      source_template_id: validatedInput.sourceTemplateId || null,
    };

    // Add optional image columns when an image was selected
    // (requires migration 010_workout_image.sql)
    const workoutInsert = { ...baseWorkoutInsert };
    const hasImageFields = !!validatedInput.imageType;
    if (hasImageFields) {
      workoutInsert.image_type = validatedInput.imageType;
      workoutInsert.image_uri = validatedInput.imageUri || null;
      workoutInsert.image_template_id = validatedInput.imageTemplateId || null;
    }

    // Try insert; if schema error from image columns, retry without them
    let workout: { id: string } | null = null;

    const { data: firstAttempt, error: firstError } = await supabase
      .from('workouts')
      .insert(workoutInsert)
      .select('id')
      .single();

    if (firstError && hasImageFields && isSchemaError(firstError)) {
      logger.warn(
        'Image columns not found in database (migration 010 not applied). Saving workout without image.'
      );
      const { data: retryAttempt, error: retryError } = await supabase
        .from('workouts')
        .insert(baseWorkoutInsert)
        .select('id')
        .single();

      if (retryError || !retryAttempt) {
        logger.warn('Error saving workout (retry without image)', { error: retryError });
        Alert.alert('Save Error', 'Unable to save workout. Please try again.');
        return null;
      }
      workout = retryAttempt;
    } else if (firstError || !firstAttempt) {
      logger.warn('Error saving workout', { error: firstError });
      Alert.alert('Save Error', 'Unable to save workout. Please try again.');
      return null;
    } else {
      workout = firstAttempt;
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
        logger.warn('Error saving workout exercise', { error: exerciseError });
        continue;
      }

      // 3. Insert workout_sets for this exercise
      const setsToInsert = exercise.sets.map((set) => ({
        workout_exercise_id: workoutExercise.id,
        set_number: set.setNumber,
        weight: set.weightKg,
        reps: set.reps,
        set_type: set.setType || 'normal',
        completed: set.completed,
        rpe: set.rpe ?? null,
      }));

      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase.from('workout_sets').insert(setsToInsert);

        if (setsError) {
          logger.warn('Error saving workout sets', { error: setsError });
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
        logger.warn('Error saving workout muscles', { error: musclesError });
      }
    }

    return workoutId;
  } catch (error) {
    logger.warn('Error in saveCompletedWorkout', { error });
    Alert.alert('Save Error', 'Unable to save workout. Please try again.');
    return null;
  }
}

// =============================================
// UPDATE COMPLETED WORKOUT
// =============================================

export async function updateCompletedWorkout(
  workoutId: string,
  input: SaveWorkoutInput
): Promise<boolean> {
  // Validate input before any database operations
  const parseResult = SaveWorkoutInputSchema.safeParse(input);
  if (!parseResult.success) {
    logger.warn('Invalid workout input', { error: parseResult.error.flatten() });
    Alert.alert('Save Error', 'Unable to update workout. Please try again.');
    return false;
  }

  const validatedInput = parseResult.data;

  try {
    const workoutName =
      validatedInput.name ||
      `Workout - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // 1. Update the workout record
    const baseWorkoutUpdate: Record<string, any> = {
      name: workoutName,
      duration_seconds: validatedInput.durationSeconds,
      notes: validatedInput.notes || null,
    };

    const workoutUpdate = { ...baseWorkoutUpdate };
    const hasImageFields = !!validatedInput.imageType;
    if (hasImageFields) {
      workoutUpdate.image_type = validatedInput.imageType;
      workoutUpdate.image_uri = validatedInput.imageUri || null;
      workoutUpdate.image_template_id = validatedInput.imageTemplateId || null;
    }

    let updateSuccess = false;

    const { error: updateError } = await supabase
      .from('workouts')
      .update(workoutUpdate)
      .eq('id', workoutId);

    if (updateError && hasImageFields && isSchemaError(updateError)) {
      logger.warn('Image columns not found. Updating workout without image.');
      const { error: retryError } = await supabase
        .from('workouts')
        .update(baseWorkoutUpdate)
        .eq('id', workoutId);

      if (retryError) {
        logger.warn('Error updating workout (retry)', { error: retryError });
        Alert.alert('Save Error', 'Unable to update workout. Please try again.');
        return false;
      }
      updateSuccess = true;
    } else if (updateError) {
      logger.warn('Error updating workout', { error: updateError });
      Alert.alert('Save Error', 'Unable to update workout. Please try again.');
      return false;
    } else {
      updateSuccess = true;
    }

    // 2. Delete existing exercises (cascades to workout_sets via FK)
    const { error: deleteExError } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('workout_id', workoutId);

    if (deleteExError) {
      logger.warn('Error deleting existing exercises', { error: deleteExError });
      Alert.alert('Save Error', 'Unable to update workout exercises. Please try again.');
      return false;
    }

    // 3. Delete existing muscle data
    const { error: deleteMuscleError } = await supabase
      .from('workout_muscles')
      .delete()
      .eq('workout_id', workoutId);

    if (deleteMuscleError) {
      logger.warn('Error deleting existing muscles', { error: deleteMuscleError });
      // Non-fatal, continue
    }

    // 4. Re-insert exercises, sets, and muscles (same logic as saveCompletedWorkout)
    const muscleSetCounts = new Map<string, { primary: number; secondary: number }>();

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
        logger.warn('Error saving workout exercise', { error: exerciseError });
        continue;
      }

      const setsToInsert = exercise.sets.map((set) => ({
        workout_exercise_id: workoutExercise.id,
        set_number: set.setNumber,
        weight: set.weightKg,
        reps: set.reps,
        set_type: set.setType || 'normal',
        completed: set.completed,
        rpe: set.rpe ?? null,
      }));

      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase.from('workout_sets').insert(setsToInsert);
        if (setsError) {
          logger.warn('Error saving workout sets', { error: setsError });
        }
      }

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

    // 5. Re-insert aggregate workout_muscles
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
        logger.warn('Error saving workout muscles', { error: musclesError });
      }
    }

    return true;
  } catch (error) {
    logger.warn('Error in updateCompletedWorkout', { error });
    Alert.alert('Save Error', 'Unable to update workout. Please try again.');
    return false;
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
    // Single query using Supabase relation joins instead of 3 sequential queries.
    // !inner join on workouts ensures only this user's data is returned.
    const { data, error } = await supabase
      .from('workout_exercises')
      .select(
        `
        id,
        exercise_id,
        workout_id,
        workouts!inner(completed_at, user_id),
        workout_sets(set_number, weight, reps)
      `
      )
      .in('exercise_id', exerciseIds)
      .eq('workouts.user_id', userId);

    if (error || !data || data.length === 0) {
      return result;
    }

    // Sort by workout date (most recent first), then pick latest per exercise
    const sorted = [...data].sort((a: any, b: any) => {
      const dateA = a.workouts?.completed_at || '';
      const dateB = b.workouts?.completed_at || '';
      return dateB.localeCompare(dateA);
    });

    const seen = new Set<string>();
    for (const we of sorted) {
      if (seen.has(we.exercise_id)) continue;
      seen.add(we.exercise_id);

      const sets = (we as any).workout_sets || [];
      if (sets.length > 0) {
        const sortedSets = [...sets].sort((a: any, b: any) => a.set_number - b.set_number);
        result.set(
          we.exercise_id,
          sortedSets.map((s: any) => ({
            setNumber: s.set_number,
            weightKg: s.weight,
            reps: s.reps,
          }))
        );
      }
    }

    return result;
  } catch (error) {
    logger.warn('Error fetching batch previous sets', { error });
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
        image_type,
        image_uri,
        image_template_id,
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
      logger.warn('Error fetching workout history', { error });
      Alert.alert('Connection Error', 'Unable to load workout history. Please try again.');
      return [];
    }

    return workouts.map((workout) => {
      const exercises = workout.workout_exercises || [];
      const totalSets = exercises.reduce((sum, ex) => sum + (ex.workout_sets?.length || 0), 0);

      return {
        id: workout.id,
        userId,
        name: workout.name,
        completedAt: workout.completed_at,
        durationSeconds: workout.duration_seconds,
        exerciseCount: exercises.length,
        totalSets,
        imageType: workout.image_type ?? null,
        imageUri: workout.image_uri ?? null,
        imageTemplateId: workout.image_template_id ?? null,
      };
    });
  } catch (error) {
    logger.warn('Error in getWorkoutHistory', { error });
    Alert.alert('Connection Error', 'Unable to load workout history. Please try again.');
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
        workout_sets(*),
        exercises(image_url, thumbnail_url)
      `
      )
      .eq('workout_id', workoutId)
      .order('order_index');

    if (exercisesError) {
      logger.warn('Error fetching workout exercises', { error: exercisesError });
      return { workout, exercises: [] };
    }

    return {
      workout,
      exercises: exercises.map((ex: any) => ({
        ...ex,
        sets: ex.workout_sets || [],
        image_url: ex.exercises?.image_url || null,
        thumbnail_url: ex.exercises?.thumbnail_url || null,
      })),
    };
  } catch (error) {
    logger.warn('Error in getWorkoutById', { error });
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
      logger.warn('Error deleting workout', { error });
      Alert.alert('Error', 'Unable to delete workout. Please try again.');
      return false;
    }

    return true;
  } catch (error) {
    logger.warn('Error in deleteWorkout', { error });
    Alert.alert('Error', 'Unable to delete workout. Please try again.');
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
    logger.warn('Error fetching exercise preference', { error });
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
    logger.warn('Error fetching exercise preferences', { error });
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
    logger.warn('Invalid exercise preference input', { error: parseResult.error.flatten() });
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
      logger.warn('Error saving exercise preference', { error });
      return false;
    }

    return true;
  } catch (error) {
    logger.warn('Error in saveUserExercisePreference', { error });
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
        image_type,
        image_uri,
        image_template_id,
        workout_exercises(id)
      `
      )
      .eq('user_id', userId)
      .gte('completed_at', startDate)
      .lte('completed_at', endDate)
      .order('completed_at');

    if (error || !workouts) {
      logger.warn('Error fetching workouts by date range', { error });
      return [];
    }

    return workouts.map((workout) => ({
      id: workout.id,
      userId,
      name: workout.name,
      completedAt: workout.completed_at,
      durationSeconds: workout.duration_seconds,
      exerciseCount: workout.workout_exercises?.length || 0,
      totalSets: 0,
      imageType: workout.image_type ?? null,
      imageUri: workout.image_uri ?? null,
      imageTemplateId: workout.image_template_id ?? null,
    }));
  } catch (error) {
    logger.warn('Error in getWorkoutsByDateRange', { error });
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
      logger.warn('Error fetching exercise muscles', { error });
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
    logger.warn('Error in getExerciseMuscles', { error });
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
      logger.warn('Error fetching workout muscles', { error });
      return [];
    }

    return data.map((wm) => ({
      muscle: wm.muscle,
      totalSets: wm.total_sets,
      activation: wm.activation as 'primary' | 'secondary',
    }));
  } catch (error) {
    logger.warn('Error in getWorkoutMuscles', { error });
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

export async function getCompletedWorkoutCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      logger.warn('Error fetching workout count', { error });
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    logger.warn('Error in getCompletedWorkoutCount', { error });
    return 0;
  }
}
