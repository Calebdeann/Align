import { supabase } from '../supabase';
import { ScheduledWorkout } from '@/stores/workoutStore';
import { logger } from '@/utils/logger';

// UUID v4 format check - local IDs like "workout_123_abc" are not valid UUIDs
const isValidUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Detect schema errors for backward-compatible fallback (rule 8)
function isSchemaError(error: any): boolean {
  if (!error?.code) return false;
  const code = String(error.code);
  return code === 'PGRST204' || code === 'PGRST301' || code.startsWith('42');
}

// Convert local ScheduledWorkout to DB row format
function toDbRow(workout: ScheduledWorkout) {
  const row: Record<string, any> = {
    user_id: workout.userId,
    name: workout.name,
    description: workout.description || null,
    date: workout.date,
    image: workout.image || null,
    tag_id: workout.tagId || null,
    tag_color: workout.tagColor,
    template_name: workout.templateName || null,
    template_id: workout.templateId || null,
    time: workout.time || null,
    repeat: workout.repeat,
    reminder: workout.reminder || null,
    completed_dates: workout.completedDates || [],
    excluded_dates: workout.excludedDates || [],
    end_date: workout.endDate || null,
  };
  if (workout.planId) row.plan_id = workout.planId;
  if (workout.programWorkoutId) row.program_workout_id = workout.programWorkoutId;
  return row;
}

// Columns added by migration 042 — strip on PGRST204 retry for back-compat.
const OPTIONAL_NEW_COLUMNS = ['plan_id', 'program_workout_id'] as const;
function stripOptionalNewColumns<T extends Record<string, any>>(row: T): T {
  const copy: Record<string, any> = { ...row };
  for (const col of OPTIONAL_NEW_COLUMNS) delete copy[col];
  return copy as T;
}

// Convert DB row to local ScheduledWorkout format
function fromDbRow(row: any): ScheduledWorkout {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || undefined,
    date: row.date,
    image: row.image || undefined,
    tagId: row.tag_id || null,
    tagColor: row.tag_color || '#947AFF',
    templateName: row.template_name || null,
    templateId: row.template_id || undefined,
    time: row.time || undefined,
    repeat: row.repeat || { type: 'never' },
    reminder: row.reminder || undefined,
    createdAt: row.created_at,
    completedDates: row.completed_dates || [],
    excludedDates: row.excluded_dates || undefined,
    endDate: row.end_date || undefined,
    planId: row.plan_id || undefined,
    programWorkoutId: row.program_workout_id || undefined,
  };
}

/**
 * Save a new scheduled workout to Supabase.
 * Returns the generated UUID on success, or null on failure.
 */
export async function saveScheduledWorkoutToBackend(
  workout: ScheduledWorkout
): Promise<string | null> {
  try {
    const row = toDbRow(workout);

    let { data, error } = await supabase
      .from('scheduled_workouts')
      .insert(row)
      .select('id')
      .single();

    // If the new plan columns don't exist in DB yet, retry without them.
    if (error && isSchemaError(error) && (row.plan_id || row.program_workout_id)) {
      const fallback = stripOptionalNewColumns(row);
      const retry = await supabase
        .from('scheduled_workouts')
        .insert(fallback)
        .select('id')
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      if (isSchemaError(error)) {
        logger.warn('[ScheduledWorkouts] Schema error on save, table may not exist yet');
        return null;
      }
      logger.warn('[ScheduledWorkouts] Error saving', { error });
      return null;
    }

    return data?.id ?? null;
  } catch (error) {
    logger.warn('[ScheduledWorkouts] Unexpected error saving', { error });
    return null;
  }
}

/**
 * Update an existing scheduled workout in Supabase.
 * Skips if the ID is not a valid UUID (local-only workout not yet synced).
 */
export async function updateScheduledWorkoutInBackend(
  workoutId: string,
  updates: Partial<ScheduledWorkout>
): Promise<boolean> {
  if (!isValidUuid(workoutId)) return false;

  try {
    // Map TS field names to DB column names
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description || null;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.image !== undefined) dbUpdates.image = updates.image || null;
    if (updates.tagId !== undefined) dbUpdates.tag_id = updates.tagId || null;
    if (updates.tagColor !== undefined) dbUpdates.tag_color = updates.tagColor;
    if (updates.templateName !== undefined) dbUpdates.template_name = updates.templateName || null;
    if (updates.templateId !== undefined) dbUpdates.template_id = updates.templateId || null;
    if (updates.time !== undefined) dbUpdates.time = updates.time || null;
    if (updates.repeat !== undefined) dbUpdates.repeat = updates.repeat;
    if (updates.reminder !== undefined) dbUpdates.reminder = updates.reminder || null;
    if (updates.completedDates !== undefined) dbUpdates.completed_dates = updates.completedDates;
    if (updates.excludedDates !== undefined) dbUpdates.excluded_dates = updates.excludedDates || [];
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate || null;

    if (Object.keys(dbUpdates).length === 0) return true;

    const { error } = await supabase
      .from('scheduled_workouts')
      .update(dbUpdates)
      .eq('id', workoutId);

    if (error) {
      if (isSchemaError(error)) return false;
      logger.warn('[ScheduledWorkouts] Error updating', { error });
      return false;
    }

    return true;
  } catch (error) {
    logger.warn('[ScheduledWorkouts] Unexpected error updating', { error });
    return false;
  }
}

/**
 * Delete a scheduled workout from Supabase.
 * Skips if the ID is not a valid UUID.
 */
export async function deleteScheduledWorkoutFromBackend(workoutId: string): Promise<boolean> {
  if (!isValidUuid(workoutId)) return false;

  try {
    const { error } = await supabase.from('scheduled_workouts').delete().eq('id', workoutId);

    if (error) {
      if (isSchemaError(error)) return false;
      logger.warn('[ScheduledWorkouts] Error deleting', { error });
      return false;
    }

    return true;
  } catch (error) {
    logger.warn('[ScheduledWorkouts] Unexpected error deleting', { error });
    return false;
  }
}

/**
 * Fetch all scheduled workouts for a user from Supabase.
 * Returns empty array on any error (fails gracefully).
 */
export async function getScheduledWorkoutsFromBackend(userId: string): Promise<ScheduledWorkout[]> {
  try {
    const { data, error } = await supabase
      .from('scheduled_workouts')
      .select('*')
      .eq('user_id', userId)
      .order('date');

    if (error) {
      if (isSchemaError(error)) return [];
      logger.warn('[ScheduledWorkouts] Error fetching', { error });
      return [];
    }

    return (data || []).map(fromDbRow);
  } catch (error) {
    logger.warn('[ScheduledWorkouts] Unexpected error fetching', { error });
    return [];
  }
}

/**
 * Bulk upsert scheduled workouts (for initial migration of local data).
 * Uses the workout ID as the conflict key.
 */
export async function bulkSaveScheduledWorkouts(
  workouts: ScheduledWorkout[]
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>(); // localId -> backendId

  // Save one at a time to get individual IDs back
  for (const workout of workouts) {
    const backendId = await saveScheduledWorkoutToBackend(workout);
    if (backendId) {
      idMap.set(workout.id, backendId);
    }
  }

  return idMap;
}

/**
 * Batch-insert N scheduled workouts in a single Supabase round trip.
 * Returns `Map<tempLocalId, backendUuid>` for client to swap ids.
 *
 * Critical for plan-switch performance: seeding a fresh plan can produce 50+
 * workouts. Serial inserts (the old pattern) caused 50+ separate Zustand `set`
 * calls and 50+ React reconciliations — the source of the multi-second freeze.
 *
 * Preserves the `isSchemaError` retry fallback for unmigrated optional columns.
 */
export async function saveScheduledWorkoutsBatch(
  workouts: ScheduledWorkout[]
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  if (workouts.length === 0) return idMap;

  try {
    const rows = workouts.map(toDbRow);

    let { data, error } = await supabase.from('scheduled_workouts').insert(rows).select('id');

    if (error && isSchemaError(error)) {
      const fallback = rows.map(stripOptionalNewColumns);
      const retry = await supabase.from('scheduled_workouts').insert(fallback).select('id');
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      if (!isSchemaError(error)) {
        logger.warn('[ScheduledWorkouts] Error batch saving', { error });
      }
      return idMap;
    }

    // Postgres preserves insert order in the RETURNING clause, so the returned
    // rows align positionally with the input rows.
    if (data && data.length === workouts.length) {
      for (let i = 0; i < workouts.length; i++) {
        const backendId = data[i]?.id;
        if (backendId) idMap.set(workouts[i].id, backendId);
      }
    }

    return idMap;
  } catch (error) {
    logger.warn('[ScheduledWorkouts] Unexpected error batch saving', { error });
    return idMap;
  }
}

/**
 * Batch-delete N scheduled workouts from Supabase in a single round trip.
 * Skips ids that aren't valid UUIDs (local-only workouts not yet synced).
 */
export async function deleteScheduledWorkoutsBatch(workoutIds: string[]): Promise<void> {
  const validIds = workoutIds.filter(isValidUuid);
  if (validIds.length === 0) return;

  try {
    const { error } = await supabase.from('scheduled_workouts').delete().in('id', validIds);

    if (error && !isSchemaError(error)) {
      logger.warn('[ScheduledWorkouts] Error batch deleting', { error });
    }
  } catch (error) {
    logger.warn('[ScheduledWorkouts] Unexpected error batch deleting', { error });
  }
}
