import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
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

// Helper: retry a supabase call once if fetch throws (transient network failure).
// Prevents raw TypeErrors from bubbling up to LogBox as red console errors.
async function callRpcWithRetry<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    await new Promise((r) => setTimeout(r, 600));
    try {
      return await fn();
    } catch {
      return fallback;
    }
  }
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
  image_aspect_ratio: number | null;
  image_audience: 'friends' | 'everyone' | null;
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
  imageAspectRatio?: number;
  imageAudience?: 'friends' | 'everyone';
  titleCustomized?: boolean;
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
  imageAspectRatio: number | null;
  imageTemplateId: string | null;
  imageAudience: 'friends' | 'everyone' | null;
}

// Type for previous sets
export interface PreviousSetData {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
}

// =============================================
// WORKOUT PHOTO UPLOAD
// =============================================

async function uploadWorkoutPhoto(
  userId: string,
  localUri: string
): Promise<{ publicUrl: string } | { error: string }> {
  try {
    // RN's fetch().blob() returns an empty blob in production builds, leading
    // to 0-byte uploads. Use FileSystem.uploadAsync with BINARY_CONTENT instead
    // — same pattern as uploadAvatar in user.ts. This streams the file directly.
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      const msg = 'EXPO_PUBLIC_SUPABASE_URL is not set';
      console.error('[uploadWorkoutPhoto]', msg);
      return { error: msg };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      const msg = 'No auth session — cannot upload photo';
      console.error('[uploadWorkoutPhoto]', msg);
      return { error: msg };
    }

    // Template photos come through as Metro bundler URLs (http://192.x.x.x:8081/...).
    // FileSystem.uploadAsync(BINARY_CONTENT) only accepts file:// URIs, so download
    // the source to a temp file first when it isn't already local.
    let sourceUri = localUri;
    const isHttp = localUri.startsWith('http://') || localUri.startsWith('https://');
    const lower = localUri.toLowerCase();
    const ext: 'png' | 'jpg' = lower.includes('.png') ? 'png' : 'jpg';
    if (isHttp) {
      const tmpPath = `${FileSystem.cacheDirectory}wk-upload-${Date.now()}.${ext}`;
      const dl = await FileSystem.downloadAsync(localUri, tmpPath);
      if (dl.status < 200 || dl.status >= 300) {
        const msg = `Failed to fetch template source (HTTP ${dl.status})`;
        console.error('[uploadWorkoutPhoto]', msg);
        return { error: msg };
      }
      sourceUri = dl.uri;
    }

    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const path = `${userId}/${Date.now()}.${ext}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/workout-photos/${path}`;

    const result = await FileSystem.uploadAsync(uploadUrl, sourceUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': contentType,
        'x-upsert': 'false',
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });

    if (result.status !== 200 && result.status !== 201) {
      const msg = `Storage upload failed (HTTP ${result.status}): ${result.body?.slice(0, 200) ?? '<empty body>'}`;
      logger.warn('Failed to upload workout photo', {
        status: result.status,
        body: result.body?.slice(0, 200),
      });
      console.error('[uploadWorkoutPhoto]', msg);
      return { error: msg };
    }

    const { data } = supabase.storage.from('workout-photos').getPublicUrl(path);
    return { publicUrl: data.publicUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn('Error uploading workout photo', { error: e });
    console.error('[uploadWorkoutPhoto] Exception during upload:', msg);
    return { error: msg };
  }
}

function isLocalUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('ph://') || uri.startsWith('/var/');
}

// Any URI that isn't already a persistent Supabase Storage URL needs to be uploaded.
// This catches: file:// (camera/gallery), ph:// (PhotoKit), /var/ (iOS tmp),
// http://localhost:8081 (Metro bundler templates), assets-library://, etc.
function needsCloudUpload(uri: string): boolean {
  if (!uri) return false;
  if (uri.includes('supabase.co/storage/')) return false;
  if (uri.includes('supabase.in/storage/')) return false;
  return true;
}

// =============================================
// SAVE COMPLETED WORKOUT
// =============================================

export async function saveCompletedWorkout(
  input: SaveWorkoutInput
): Promise<{ workoutId: string; partialWarning?: string } | { error: string }> {
  // Validate input before any database operations
  const parseResult = SaveWorkoutInputSchema.safeParse(input);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    const detail = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Unknown';
    logger.warn('Invalid workout input', { error: parseResult.error.flatten() });
    return { error: `Validation failed (${detail})` };
  }

  // Use validated input from here on
  const validatedInput = parseResult.data;

  try {
    // Generate a default workout name if none provided
    const workoutName =
      validatedInput.name ||
      `Workout - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // Upload any non-cloud URI to Supabase Storage before inserting the workout row.
    // This covers file:// (camera/gallery), ph:// (PhotoKit), Metro bundler URLs for
    // templates, and anything else that isn't already a persistent cloud URL.
    let resolvedImageUri = validatedInput.imageUri;
    if (validatedInput.imageUri && needsCloudUpload(validatedInput.imageUri)) {
      console.log('[saveCompletedWorkout] uploading image:', {
        imageUri: validatedInput.imageUri,
        imageType: validatedInput.imageType,
        isLocal: isLocalUri(validatedInput.imageUri),
      });
      const uploadResult = await uploadWorkoutPhoto(validatedInput.userId, validatedInput.imageUri);
      if ('error' in uploadResult) {
        throw new Error(`Photo upload failed: ${uploadResult.error}`);
      }
      console.log('[saveCompletedWorkout] upload success, public URL:', uploadResult.publicUrl);
      resolvedImageUri = uploadResult.publicUrl;
    } else if (validatedInput.imageUri) {
      console.log(
        '[saveCompletedWorkout] skipping upload (already cloud URL):',
        validatedInput.imageUri
      );
    } else {
      console.log('[saveCompletedWorkout] no image URI provided');
    }

    // 1. Insert the workout record
    // Base insert uses only established columns (always works)
    const baseWorkoutInsert: Record<string, any> = {
      user_id: validatedInput.userId,
      name: workoutName,
      started_at: validatedInput.startedAt.toISOString(),
      completed_at: validatedInput.completedAt.toISOString(),
      duration_seconds: validatedInput.durationSeconds,
      notes: validatedInput.notes || null,
      // Only store UUID template IDs — preset templates use slug IDs (e.g. "preset-fullbody-bang")
      // which are not valid UUIDs and would cause a DB error
      source_template_id:
        validatedInput.sourceTemplateId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          validatedInput.sourceTemplateId
        )
          ? validatedInput.sourceTemplateId
          : null,
    };

    // Add optional image columns when an image was selected
    // (requires migration 010_workout_image.sql + 042_workout_photo_storage.sql)
    const workoutInsert = { ...baseWorkoutInsert };
    const hasImageFields = !!validatedInput.imageType;
    if (hasImageFields) {
      workoutInsert.image_type = validatedInput.imageType;
      workoutInsert.image_uri = resolvedImageUri || null;
      workoutInsert.image_template_id = validatedInput.imageTemplateId || null;
      if (validatedInput.imageAudience) {
        workoutInsert.image_audience = validatedInput.imageAudience;
      }
      if (validatedInput.imageAspectRatio != null) {
        workoutInsert.image_aspect_ratio = validatedInput.imageAspectRatio;
      }
    }
    // title_customized (migration 051) — kept on workoutInsert only so a schema
    // error falls back to baseWorkoutInsert per CLAUDE.md backwards-compat rule.
    if (validatedInput.titleCustomized != null) {
      workoutInsert.title_customized = validatedInput.titleCustomized;
    }

    // Try insert; if schema error from any optional column, retry stripping all of them.
    let workout: { id: string } | null = null;
    const wroteOptionalColumns = hasImageFields || validatedInput.titleCustomized != null;

    const { data: firstAttempt, error: firstError } = await supabase
      .from('workouts')
      .insert(workoutInsert)
      .select('id')
      .single();

    if (firstError && wroteOptionalColumns && isSchemaError(firstError)) {
      logger.warn(
        'Optional workout columns not found in database (migration not applied). Saving workout without them.'
      );
      const { data: retryAttempt, error: retryError } = await supabase
        .from('workouts')
        .insert(baseWorkoutInsert)
        .select('id')
        .single();

      if (retryError || !retryAttempt) {
        logger.warn('Error saving workout (retry without image)', { error: retryError });
        return { error: retryError?.message || 'Database insert failed (retry)' };
      }
      workout = retryAttempt;
    } else if (firstError || !firstAttempt) {
      logger.warn('Error saving workout', { error: firstError });
      return { error: firstError?.message || 'Database insert failed' };
    } else {
      workout = firstAttempt;
    }

    const workoutId = workout.id;

    // Track muscles worked for aggregate storage
    const muscleSetCounts = new Map<string, { primary: number; secondary: number }>();
    const failedExercises: { name: string; error: string }[] = [];
    let failedSetsCount = 0;

    // Batch-fetch target_muscles + secondary_muscles for all exercises in one query
    const allExerciseIds = validatedInput.exercises.map((e) => e.exerciseId);
    const { data: exerciseDetails } = await supabase
      .from('exercises')
      .select('id, target_muscles, secondary_muscles')
      .in('id', allExerciseIds);
    const exerciseMuscleMap = new Map<string, { target: string[]; secondary: string[] }>();
    exerciseDetails?.forEach((e) => {
      exerciseMuscleMap.set(e.id, {
        target: e.target_muscles || [],
        secondary: e.secondary_muscles || [],
      });
    });

    // 2. Insert workout_exercises for each exercise
    for (let i = 0; i < validatedInput.exercises.length; i++) {
      const exercise = validatedInput.exercises[i];
      const completedSetsCount = exercise.sets.filter((s) => s.completed).length;

      let { data: workoutExercise, error: exerciseError } = await supabase
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

      // If first attempt fails, retry with minimum columns
      if (exerciseError) {
        logger.warn('Error saving workout exercise, retrying with minimal columns', {
          exerciseName: exercise.exerciseName,
          error: exerciseError,
        });
        const { data: retryExercise, error: retryError } = await supabase
          .from('workout_exercises')
          .insert({
            workout_id: workoutId,
            exercise_id: exercise.exerciseId,
            exercise_name: exercise.exerciseName,
            order_index: i + 1,
          })
          .select('id')
          .single();

        if (retryError || !retryExercise) {
          logger.warn('Error saving workout exercise (retry failed) — deleting orphan workout', {
            exerciseName: exercise.exerciseName,
            workoutId,
            error: retryError,
            originalError: exerciseError,
          });
          await supabase.from('workouts').delete().eq('id', workoutId);
          throw new Error(
            `Failed to save exercise "${exercise.exerciseName}": ${retryError?.message || exerciseError.message}`
          );
        }
        workoutExercise = retryExercise;
      }

      if (!workoutExercise) {
        await supabase.from('workouts').delete().eq('id', workoutId);
        throw new Error(
          `Failed to save exercise "${exercise.exerciseName}": no row returned from insert`
        );
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
        // Cardio fields (migration 074). Nullable; null for non-cardio sets.
        difficulty: set.difficulty ?? null,
        duration_seconds: set.durationSeconds ?? null,
      }));

      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase.from('workout_sets').insert(setsToInsert);

        if (setsError && isSchemaError(setsError)) {
          // set_type / difficulty / duration_seconds columns may not exist yet
          // on older databases (migrations 028 / 074). Retry stripping all
          // optional new columns.
          const setsWithoutOptional = setsToInsert.map((s) => {
            const { set_type, difficulty, duration_seconds, ...rest } = s;
            return rest;
          });
          const { error: retryError } = await supabase
            .from('workout_sets')
            .insert(setsWithoutOptional);
          if (retryError) {
            logger.warn(
              'Error saving workout sets (retry without optional cols) — deleting orphan workout',
              {
                workoutId,
                error: retryError,
              }
            );
            await supabase.from('workouts').delete().eq('id', workoutId);
            throw new Error(
              `Failed to save sets for "${exercise.exerciseName}": ${retryError.message}`
            );
          }
        } else if (setsError) {
          logger.warn('Error saving workout sets — deleting orphan workout', {
            workoutId,
            error: setsError,
          });
          await supabase.from('workouts').delete().eq('id', workoutId);
          throw new Error(
            `Failed to save sets for "${exercise.exerciseName}": ${setsError.message}`
          );
        }
      }

      // 4. Aggregate muscle data using target_muscles + secondary_muscles from exercises table
      if (completedSetsCount > 0) {
        const muscleDetail = exerciseMuscleMap.get(exercise.exerciseId);
        const targetMuscles = muscleDetail?.target ?? [];
        const secondaryMuscles = muscleDetail?.secondary ?? [];

        if (targetMuscles.length > 0 || secondaryMuscles.length > 0) {
          targetMuscles.forEach((muscle) => {
            const current = muscleSetCounts.get(muscle) || { primary: 0, secondary: 0 };
            current.primary += completedSetsCount;
            muscleSetCounts.set(muscle, current);
          });
          secondaryMuscles.forEach((muscle) => {
            // Skip if already counted as primary to avoid 1.5x inflation
            if (targetMuscles.includes(muscle)) return;
            const current = muscleSetCounts.get(muscle) || { primary: 0, secondary: 0 };
            current.secondary += completedSetsCount;
            muscleSetCounts.set(muscle, current);
          });
        } else if (exercise.exerciseMuscle) {
          // Fallback: exercise has no muscle arrays — use the generic muscle field.
          const current = muscleSetCounts.get(exercise.exerciseMuscle) || {
            primary: 0,
            secondary: 0,
          };
          current.primary += completedSetsCount;
          muscleSetCounts.set(exercise.exerciseMuscle, current);
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

    // Build partial save warning if some exercises or sets failed
    let partialWarning: string | undefined;
    if (failedExercises.length > 0 || failedSetsCount > 0) {
      const parts: string[] = [];
      if (failedExercises.length > 0) {
        const names = failedExercises.map((f) => f.name).join(', ');
        parts.push(`${failedExercises.length} exercise(s) (${names})`);
      }
      if (failedSetsCount > 0) parts.push(`set data for ${failedSetsCount} exercise(s)`);
      const errorDetail = failedExercises[0]?.error ? `\n\nError: ${failedExercises[0].error}` : '';
      partialWarning = `Workout saved, but ${parts.join(' and ')} could not be saved.${errorDetail}`;
    }

    return { workoutId, partialWarning };
  } catch (error) {
    logger.warn('Error in saveCompletedWorkout', { error });
    return { error: error instanceof Error ? error.message : 'Unknown error saving workout' };
  }
}

// =============================================
// UPDATE COMPLETED WORKOUT
// =============================================

export async function updateCompletedWorkout(
  workoutId: string,
  input: SaveWorkoutInput
): Promise<{ success: true; partialWarning?: string } | { error: string }> {
  // Validate input before any database operations
  const parseResult = SaveWorkoutInputSchema.safeParse(input);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    const detail = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Unknown';
    logger.warn('Invalid workout input', { error: parseResult.error.flatten() });
    return { error: `Validation failed (${detail})` };
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
      if (validatedInput.imageAspectRatio != null) {
        workoutUpdate.image_aspect_ratio = validatedInput.imageAspectRatio;
      }
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
        return { error: retryError?.message || 'Database update failed (retry)' };
      }
      updateSuccess = true;
    } else if (updateError) {
      logger.warn('Error updating workout', { error: updateError });
      return { error: updateError?.message || 'Database update failed' };
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
      return { error: deleteExError?.message || 'Failed to clear existing exercises' };
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
    const failedExercises: { name: string; error: string }[] = [];
    let failedSetsCount = 0;

    // Batch-fetch target_muscles + secondary_muscles for all exercises in one query
    const allExerciseIds = validatedInput.exercises.map((e) => e.exerciseId);
    const { data: exerciseDetails } = await supabase
      .from('exercises')
      .select('id, target_muscles, secondary_muscles')
      .in('id', allExerciseIds);
    const exerciseMuscleMap = new Map<string, { target: string[]; secondary: string[] }>();
    exerciseDetails?.forEach((e) => {
      exerciseMuscleMap.set(e.id, {
        target: e.target_muscles || [],
        secondary: e.secondary_muscles || [],
      });
    });

    for (let i = 0; i < validatedInput.exercises.length; i++) {
      const exercise = validatedInput.exercises[i];
      const completedSetsCount = exercise.sets.filter((s) => s.completed).length;

      let { data: workoutExercise, error: exerciseError } = await supabase
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

      // If first attempt fails, retry with minimum columns
      if (exerciseError) {
        logger.warn('Error saving workout exercise, retrying with minimal columns', {
          exerciseName: exercise.exerciseName,
          error: exerciseError,
        });
        const { data: retryExercise, error: retryError } = await supabase
          .from('workout_exercises')
          .insert({
            workout_id: workoutId,
            exercise_id: exercise.exerciseId,
            exercise_name: exercise.exerciseName,
            order_index: i + 1,
          })
          .select('id')
          .single();

        if (retryError || !retryExercise) {
          logger.warn('Error saving workout exercise (retry failed)', {
            exerciseName: exercise.exerciseName,
            error: retryError,
            originalError: exerciseError,
          });
          failedExercises.push({
            name: exercise.exerciseName,
            error: retryError?.message || exerciseError.message,
          });
          continue;
        }
        workoutExercise = retryExercise;
      }

      if (!workoutExercise) {
        failedExercises.push({ name: exercise.exerciseName, error: 'No data returned' });
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

        if (setsError && isSchemaError(setsError)) {
          const setsWithoutSetType = setsToInsert.map(({ set_type, ...rest }) => rest);
          const { error: retryError } = await supabase
            .from('workout_sets')
            .insert(setsWithoutSetType);
          if (retryError) {
            logger.warn('Error saving workout sets (retry without set_type)', {
              error: retryError,
            });
            failedSetsCount++;
          }
        } else if (setsError) {
          logger.warn('Error saving workout sets', { error: setsError });
          failedSetsCount++;
        }
      }

      if (completedSetsCount > 0) {
        const muscleDetail = exerciseMuscleMap.get(exercise.exerciseId);
        const targetMuscles = muscleDetail?.target ?? [];
        const secondaryMuscles = muscleDetail?.secondary ?? [];

        if (targetMuscles.length > 0 || secondaryMuscles.length > 0) {
          targetMuscles.forEach((muscle) => {
            const current = muscleSetCounts.get(muscle) || { primary: 0, secondary: 0 };
            current.primary += completedSetsCount;
            muscleSetCounts.set(muscle, current);
          });
          secondaryMuscles.forEach((muscle) => {
            // Skip if already counted as primary to avoid 1.5x inflation
            if (targetMuscles.includes(muscle)) return;
            const current = muscleSetCounts.get(muscle) || { primary: 0, secondary: 0 };
            current.secondary += completedSetsCount;
            muscleSetCounts.set(muscle, current);
          });
        } else if (exercise.exerciseMuscle) {
          const current = muscleSetCounts.get(exercise.exerciseMuscle) || {
            primary: 0,
            secondary: 0,
          };
          current.primary += completedSetsCount;
          muscleSetCounts.set(exercise.exerciseMuscle, current);
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

    // Build partial save warning if some exercises or sets failed
    let partialWarning: string | undefined;
    if (failedExercises.length > 0 || failedSetsCount > 0) {
      const parts: string[] = [];
      if (failedExercises.length > 0) {
        const names = failedExercises.map((f) => f.name).join(', ');
        parts.push(`${failedExercises.length} exercise(s) (${names})`);
      }
      if (failedSetsCount > 0) parts.push(`set data for ${failedSetsCount} exercise(s)`);
      const errorDetail = failedExercises[0]?.error ? `\n\nError: ${failedExercises[0].error}` : '';
      partialWarning = `Workout updated, but ${parts.join(' and ')} could not be saved.${errorDetail}`;
    }

    return { success: true, partialWarning };
  } catch (error) {
    logger.warn('Error in updateCompletedWorkout', { error });
    return { error: error instanceof Error ? error.message : 'Unknown error updating workout' };
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
    // Sort by date desc + cap row count so users with long history don't pay
    // an unbounded payload here — we only need the most recent per exercise,
    // and PAGE_SIZE_HARD_CAP comfortably covers that for any sane history.
    const PAGE_SIZE_HARD_CAP = 200;
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
      .eq('workouts.user_id', userId)
      .order('completed_at', { referencedTable: 'workouts', ascending: false })
      .limit(PAGE_SIZE_HARD_CAP);

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
        image_aspect_ratio,
        image_template_id,
        image_audience,
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
        imageAspectRatio:
          workout.image_aspect_ratio != null ? Number(workout.image_aspect_ratio) : null,
        imageTemplateId: workout.image_template_id ?? null,
        imageAudience: (workout.image_audience as 'friends' | 'everyone' | null) ?? 'everyone',
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

export async function getWorkoutById(
  workoutId: string,
  userId?: string
): Promise<{
  workout: DbWorkout;
  exercises: (DbWorkoutExercise & { sets: DbWorkoutSet[] })[];
} | null> {
  try {
    let query = supabase.from('workouts').select('*').eq('id', workoutId);
    if (userId) query = query.eq('user_id', userId);
    const { data: workout, error: workoutError } = await query.single();

    if (workoutError || !workout) {
      return null;
    }

    const { data: exercises, error: exercisesError } = await supabase
      .from('workout_exercises')
      .select('*, workout_sets(*)')
      .eq('workout_id', workoutId)
      .order('order_index');

    if (exercisesError) {
      logger.warn('Error fetching workout exercises', { error: exercisesError });
      return { workout, exercises: [] };
    }

    // Fetch image data from both library and custom exercises
    const exerciseIds = exercises.map((e: any) => e.exercise_id);
    const imageMap = new Map<string, { image_url: string | null; thumbnail_url: string | null }>();

    if (exerciseIds.length > 0) {
      const [libraryResult, customResult] = await Promise.all([
        supabase.from('exercises').select('id, image_url, thumbnail_url').in('id', exerciseIds),
        supabase
          .from('custom_exercises')
          .select('id, image_url, thumbnail_url')
          .in('id', exerciseIds),
      ]);

      libraryResult.data?.forEach((e: any) => imageMap.set(e.id, e));
      customResult.data?.forEach((e: any) => imageMap.set(e.id, e));
    }

    return {
      workout,
      exercises: exercises.map((ex: any) => ({
        ...ex,
        sets: ex.workout_sets || [],
        image_url: imageMap.get(ex.exercise_id)?.image_url || null,
        thumbnail_url: imageMap.get(ex.exercise_id)?.thumbnail_url || null,
      })),
    };
  } catch (error) {
    logger.warn('Error in getWorkoutById', { error });
    return null;
  }
}

// Fetches a publicly-viewable workout (image_audience = 'everyone') with full
// exercises + sets + muscles via the get_public_workout_details RPC. Used when
// viewing another user's workout from the Discover feed — RLS blocks the
// direct table read so this SECURITY DEFINER RPC is the only path.
export async function getPublicWorkoutDetails(workoutId: string): Promise<{
  workout: DbWorkout;
  exercises: (DbWorkoutExercise & { sets: DbWorkoutSet[] })[];
  muscles: WorkoutMuscleData[];
} | null> {
  const { data, error } = await callRpcWithRetry(
    () => supabase.rpc('get_public_workout_details', { p_workout_id: workoutId }),
    { data: null, error: null } as any
  );
  if (error || !data) return null;

  const muscles: WorkoutMuscleData[] = (data.muscles ?? []).map((m: any) => ({
    muscle: m.muscle,
    totalSets: m.total_sets,
    activation: m.activation,
  }));

  return {
    workout: data.workout,
    exercises: data.exercises ?? [],
    muscles,
  };
}

// =============================================
// DELETE WORKOUT
// =============================================

export async function deleteWorkout(workoutId: string, userId?: string): Promise<boolean> {
  try {
    let query = supabase.from('workouts').delete().eq('id', workoutId);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;

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
// UPDATE WORKOUT AUDIENCE (public/private toggle)
// =============================================

export async function updateWorkoutAudience(
  workoutId: string,
  audience: 'friends' | 'everyone'
): Promise<boolean> {
  const { error } = await supabase
    .from('workouts')
    .update({ image_audience: audience })
    .eq('id', workoutId);
  if (error) {
    logger.warn('updateWorkoutAudience failed', { workoutId, audience, error });
    return false;
  }
  return true;
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
        image_aspect_ratio,
        image_template_id,
        image_audience,
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
      imageAspectRatio:
        workout.image_aspect_ratio != null ? Number(workout.image_aspect_ratio) : null,
      imageTemplateId: workout.image_template_id ?? null,
      imageAudience: (workout.image_audience as 'friends' | 'everyone' | null) ?? 'everyone',
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

// =============================================
// PUBLIC DISCOVER FEED
// =============================================

export type PublicWorkoutPhoto = {
  workoutId: string;
  workoutName: string | null;
  completedAt: string;
  imageUri: string | null;
  aspectRatio: number | null;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  titleCustomized: boolean;
  isOfficial?: boolean;
};

export async function getPublicWorkoutPhotos(
  limit = 20,
  cursor?: string,
  visibility: 'public' | 'friends' = 'public'
): Promise<PublicWorkoutPhoto[]> {
  const { data, error } = await callRpcWithRetry(
    () =>
      supabase.rpc('get_public_workout_photos', {
        p_limit: limit,
        p_cursor: cursor ?? null,
        p_visibility: visibility,
      } as any),
    { data: [], error: null } as any
  );

  if (error) {
    logger.warn('getPublicWorkoutPhotos error', { error });
    return [];
  }

  return (data ?? []).map((row: any) => ({
    workoutId: row.workout_id,
    workoutName: row.workout_name ?? null,
    completedAt: row.completed_at,
    imageUri: row.image_uri,
    aspectRatio: row.image_aspect_ratio != null ? Number(row.image_aspect_ratio) : null,
    userId: row.user_id,
    userName: row.user_name ?? null,
    userAvatar: row.user_avatar ?? null,
    titleCustomized: !!row.title_customized,
  }));
}
