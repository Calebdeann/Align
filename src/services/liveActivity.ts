import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Persisted key for surviving app restarts
const ACTIVITY_ID_KEY = 'live-activity-id';

// Module-level activity ID — only one workout Live Activity at a time
let currentActivityId: string | null = null;
let isStarting = false;

export interface CurrentExerciseInfo {
  exerciseName: string;
  currentSetNumber: number;
  totalSets: number;
  weight: string;
  reps: string;
  weightUnit: string;
  imageUrl?: string;
}

function isSupported(): boolean {
  return Platform.OS === 'ios';
}

/**
 * Safely import expo-live-activity. Returns null if the module is unavailable.
 */
async function getLiveActivityModule() {
  try {
    return await import('expo-live-activity');
  } catch {
    return null;
  }
}

async function persistActivityId(id: string | null): Promise<void> {
  try {
    if (id) {
      await AsyncStorage.setItem(ACTIVITY_ID_KEY, id);
    } else {
      await AsyncStorage.removeItem(ACTIVITY_ID_KEY);
    }
  } catch {
    // Storage failure is non-critical
  }
}

async function getPersistedActivityId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVITY_ID_KEY);
  } catch {
    return null;
  }
}

function buildTitle(info: CurrentExerciseInfo | null): string {
  if (!info) return '';
  return info.exerciseName;
}

function buildSubtitle(info: CurrentExerciseInfo | null): string {
  if (!info) return '';
  const setStr = `Set ${info.currentSetNumber} of ${info.totalSets}`;
  const hasWeight = info.weight !== '';
  const hasReps = info.reps !== '';
  if (!hasWeight && !hasReps) {
    return `${setStr} \u00B7 No values`;
  }
  const weightStr = hasWeight ? `${info.weight}${info.weightUnit}` : '';
  const repsStr = hasReps ? info.reps : '';
  if (weightStr && repsStr) {
    return `${setStr} \u00B7 ${weightStr} \u00D7 ${repsStr}`;
  }
  return `${setStr} \u00B7 ${weightStr || repsStr}`;
}

/**
 * Clean up any stale Live Activity from a previous app session.
 * Call this on app mount (e.g. in root _layout.tsx).
 */
export async function cleanupStaleLiveActivities(): Promise<void> {
  if (!isSupported()) return;

  const LiveActivity = await getLiveActivityModule();
  if (!LiveActivity) return;

  const persistedId = await getPersistedActivityId();
  if (persistedId && persistedId !== currentActivityId) {
    try {
      LiveActivity.stopActivity(persistedId, { title: 'Workout Complete' });
    } catch {
      // Activity may already be expired
    }
    await persistActivityId(null);
  }
}

/**
 * Start a Live Activity for an active workout.
 * The elapsed timer counts up natively from startedAt via ActivityKit.
 */
export async function startWorkoutLiveActivity(
  startedAt: string,
  currentExercise: CurrentExerciseInfo | null
): Promise<void> {
  if (!isSupported() || isStarting) return;
  isStarting = true;

  try {
    const LiveActivity = await getLiveActivityModule();
    if (!LiveActivity) return;

    // End any existing activity first (in-memory or persisted)
    const idToStop = currentActivityId || (await getPersistedActivityId());
    if (idToStop) {
      try {
        LiveActivity.stopActivity(idToStop, { title: 'Workout Complete' });
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch {
        // Previous activity may already be expired
      }
      currentActivityId = null;
      await persistActivityId(null);
    }

    const id = LiveActivity.startActivity(
      {
        title: buildTitle(currentExercise),
        subtitle: buildSubtitle(currentExercise),
        imageName: currentExercise?.imageUrl || undefined,
        progressBar: {
          date: new Date(startedAt).getTime(),
        },
      },
      {
        titleColor: '#1A1A1A',
        subtitleColor: '#666666',
        progressViewTint: '#947AFF',
        progressViewLabelColor: '#947AFF',
        deepLinkUrl: 'align://active-workout',
        timerType: 'digital' as const,
      }
    );

    if (id) {
      currentActivityId = id;
      await persistActivityId(id);
    }
  } catch (e) {
    console.warn('[LiveActivity] Failed to start:', e);
  } finally {
    isStarting = false;
  }
}

/**
 * Update the Live Activity with current exercise info.
 * The timer keeps counting automatically — only title/subtitle change.
 */
export async function updateWorkoutLiveActivity(
  startedAt: string,
  currentExercise: CurrentExerciseInfo | null
): Promise<void> {
  if (!isSupported() || !currentActivityId) return;

  const LiveActivity = await getLiveActivityModule();
  if (!LiveActivity) return;

  try {
    LiveActivity.updateActivity(currentActivityId, {
      title: buildTitle(currentExercise),
      subtitle: buildSubtitle(currentExercise),
      imageName: currentExercise?.imageUrl || undefined,
      progressBar: {
        date: new Date(startedAt).getTime(),
      },
    });
  } catch (e) {
    console.warn('[LiveActivity] Failed to update:', e);
  }
}

/**
 * End the Live Activity (workout saved or discarded).
 */
export async function endWorkoutLiveActivity(): Promise<void> {
  if (!isSupported() || !currentActivityId) return;

  const LiveActivity = await getLiveActivityModule();
  if (!LiveActivity) return;

  try {
    LiveActivity.stopActivity(currentActivityId, {
      title: 'Workout Complete',
    });
  } catch (e) {
    console.warn('[LiveActivity] Failed to stop:', e);
  }
  currentActivityId = null;
  await persistActivityId(null);
}

/**
 * Check if there is a Live Activity running.
 */
export function hasActiveLiveActivity(): boolean {
  return currentActivityId !== null;
}
