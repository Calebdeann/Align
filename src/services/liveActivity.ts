import { Platform } from 'react-native';

// Module-level activity ID — only one workout Live Activity at a time
let currentActivityId: string | null = null;

function isSupported(): boolean {
  return Platform.OS === 'ios';
}

/**
 * Build the subtitle string for the Live Activity.
 */
function buildSubtitle(exerciseCount: number, completedSets: number): string {
  const ex = exerciseCount === 1 ? '1 exercise' : `${exerciseCount} exercises`;
  const sets = completedSets === 1 ? '1 set' : `${completedSets} sets`;
  return `${ex} \u2022 ${sets} completed`;
}

/**
 * Start a Live Activity for an active workout.
 * The elapsed timer counts up natively from startedAt via ActivityKit.
 */
export async function startWorkoutLiveActivity(
  workoutName: string,
  exerciseCount: number,
  completedSets: number,
  startedAt: string
): Promise<void> {
  if (!isSupported()) return;

  // Dynamically import to avoid crashes on Android
  const LiveActivity = await import('expo-live-activity');

  // End any existing activity first
  if (currentActivityId) {
    try {
      LiveActivity.stopActivity(currentActivityId, { title: 'Workout Complete' });
    } catch (e) {
      console.warn('[LiveActivity] Failed to stop previous:', e);
    }
    currentActivityId = null;
  }

  try {
    const id = LiveActivity.startActivity(
      {
        title: workoutName || 'Workout',
        subtitle: buildSubtitle(exerciseCount, completedSets),
        progressBar: {
          // Pass the workout start time as epoch ms — ActivityKit renders an elapsed timer
          date: new Date(startedAt).getTime(),
        },
      },
      {
        titleColor: '#1A1A1A',
        subtitleColor: '#666666',
        progressViewTint: '#947AFF',
        progressViewLabelColor: '#947AFF',
        deepLinkUrl: 'align://active-workout',
        timerType: 'digital',
      }
    );

    if (id) {
      currentActivityId = id;
    }
  } catch (e) {
    console.error('[LiveActivity] Failed to start:', e);
  }
}

/**
 * Update the Live Activity with new exercise/set counts.
 * The timer keeps counting automatically — only subtitle changes.
 */
export async function updateWorkoutLiveActivity(
  workoutName: string,
  exerciseCount: number,
  completedSets: number,
  startedAt: string
): Promise<void> {
  if (!isSupported() || !currentActivityId) return;

  const LiveActivity = await import('expo-live-activity');

  try {
    LiveActivity.updateActivity(currentActivityId, {
      title: workoutName || 'Workout',
      subtitle: buildSubtitle(exerciseCount, completedSets),
      progressBar: {
        date: new Date(startedAt).getTime(),
      },
    });
  } catch (e) {
    console.error('[LiveActivity] Failed to update:', e);
  }
}

/**
 * End the Live Activity (workout saved or discarded).
 */
export async function endWorkoutLiveActivity(): Promise<void> {
  if (!isSupported() || !currentActivityId) return;

  const LiveActivity = await import('expo-live-activity');

  try {
    LiveActivity.stopActivity(currentActivityId, {
      title: 'Workout Complete',
    });
  } catch (e) {
    console.error('[LiveActivity] Failed to stop:', e);
  }
  currentActivityId = null;
}

/**
 * Check if there is a Live Activity running.
 */
export function hasActiveLiveActivity(): boolean {
  return currentActivityId !== null;
}
