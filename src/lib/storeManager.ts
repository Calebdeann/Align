/**
 * Store lifecycle manager for handling auth state changes.
 *
 * This manager:
 * - Subscribes to auth state changes
 * - Resets stores to initial state on logout
 * - Triggers rehydration from user-specific storage on login
 * - Provides utility to clear user data on account deletion
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStateManager } from '@/services/authState';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTemplateStore } from '@/stores/templateStore';
import { useRecentExercisesStore } from '@/stores/recentExercisesStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { logger } from '@/utils/logger';

// Initial default states (must match store definitions)
const WORKOUT_STORE_INITIAL = {
  scheduledWorkouts: [],
  activeWorkout: null,
  pendingExercises: [],
  cachedCompletedWorkouts: [],
  cachedCompletedWorkoutsLastFetch: null,
};

const TEMPLATE_STORE_INITIAL = {
  templates: [],
  folders: [],
  isSyncing: false,
  lastSyncError: null,
};

const RECENT_EXERCISES_STORE_INITIAL = {
  recentExerciseIds: [],
};

let isInitialized = false;

/**
 * Initializes the store manager to listen for auth changes.
 * Call this once in the app root layout.
 */
export function initializeStoreManager() {
  if (isInitialized) {
    logger.warn('[StoreManager] Already initialized');
    return;
  }

  isInitialized = true;
  let previousUserId: string | null = authStateManager.getUserId();

  logger.info(`[StoreManager] Initialized with userId: ${previousUserId?.slice(0, 8) ?? 'null'}`);

  authStateManager.subscribe(async (newUserId) => {
    try {
      logger.info(
        `[StoreManager] Auth changed: ${previousUserId?.slice(0, 8) ?? 'null'} -> ${newUserId?.slice(0, 8) ?? 'null'}`
      );

      if (previousUserId === newUserId) return;

      // User logged out or switched accounts
      if (previousUserId !== null) {
        resetStores();
      }

      // New user logged in
      if (newUserId !== null) {
        await rehydrateStores();
        useUserProfileStore.getState().refreshProfile();
      }

      previousUserId = newUserId;
    } catch (e) {
      logger.error('[StoreManager] Auth change handler error', { error: e });
    }
  });
}

/**
 * Resets stores to their initial empty state.
 * Called on logout to clear the previous user's data from memory.
 */
function resetStores() {
  logger.info('[StoreManager] Resetting stores to initial state...');

  // Reset workout store
  useWorkoutStore.setState(WORKOUT_STORE_INITIAL);

  // Reset template store (keep presetTemplates - they're hardcoded)
  useTemplateStore.setState({
    ...TEMPLATE_STORE_INITIAL,
    presetTemplates: useTemplateStore.getState().presetTemplates,
  });

  // Reset recent exercises
  useRecentExercisesStore.setState(RECENT_EXERCISES_STORE_INITIAL);

  // Reset user preferences so the next user doesn't inherit the previous user's units/settings
  useUserPreferencesStore.getState().reset();

  // Clear profile so the next user doesn't see the previous user's data
  useUserProfileStore.getState().clearProfile();
}

/**
 * Triggers rehydration of stores from the new user's storage.
 * Zustand persist middleware handles this via the storage adapter.
 */
async function rehydrateStores() {
  logger.info('[StoreManager] Rehydrating stores from user storage...');

  try {
    // Zustand persist exposes a rehydrate method on the store
    // This triggers the storage adapter to read from the new user's keys
    const workoutPersist = (useWorkoutStore as any).persist;
    const templatePersist = (useTemplateStore as any).persist;

    if (workoutPersist?.rehydrate) {
      await workoutPersist.rehydrate();
    }

    if (templatePersist?.rehydrate) {
      await templatePersist.rehydrate();
    }

    const recentExercisesPersist = (useRecentExercisesStore as any).persist;
    if (recentExercisesPersist?.rehydrate) {
      await recentExercisesPersist.rehydrate();
    }

    logger.info('[StoreManager] Stores rehydrated successfully');
  } catch (error) {
    logger.error('[StoreManager] Rehydration error', { error });
  }
}

/**
 * Clears all stored data for a specific user.
 * Call this when deleting an account to remove all local data.
 */
export async function clearUserDataFromStorage(userId: string): Promise<void> {
  const keysToDelete = [
    `workout-store-${userId}`,
    `template-store-${userId}`,
    `recent-exercises-${userId}`,
  ];

  try {
    await AsyncStorage.multiRemove(keysToDelete);
    logger.info(`[StoreManager] Cleared storage for user ${userId.slice(0, 8)}...`);
  } catch (error) {
    logger.error('[StoreManager] Failed to clear user storage', { error });
  }
}

/**
 * Clears legacy (non-namespaced) storage keys.
 * Call this after confirming all users have migrated to namespaced storage.
 * This is optional cleanup - legacy data doesn't affect new functionality.
 */
export async function clearLegacyStorage(): Promise<void> {
  const legacyKeys = ['workout-store', 'template-store'];

  try {
    await AsyncStorage.multiRemove(legacyKeys);
    logger.info('[StoreManager] Cleared legacy storage keys');
  } catch (error) {
    logger.error('[StoreManager] Failed to clear legacy storage', { error });
  }
}
