/**
 * Per-user namespaced storage adapter for Zustand persist middleware.
 *
 * This adapter namespaces AsyncStorage keys by userId, ensuring each user's
 * data is stored separately. Key format: `{baseKey}-{userId}`
 *
 * Features:
 * - Returns null (empty state) when no user is logged in
 * - Skips writes when no user is logged in (prevents orphaned data)
 * - Migrates legacy data from global keys on first login after upgrade
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';
import { authStateManager } from '@/services/authState';

// Legacy keys that may contain data needing migration
const LEGACY_KEYS = ['workout-store', 'template-store'];

/**
 * Creates a storage adapter that namespaces data by userId.
 *
 * @param baseKey - The base storage key (e.g., 'workout-store')
 * @returns A StateStorage compatible with Zustand's persist middleware
 */
export function createUserNamespacedStorage(baseKey: string): StateStorage {
  return {
    getItem: async (name: string): Promise<string | null> => {
      const userId = await authStateManager.getUserIdAsync();

      // No user logged in - return null to use default state
      if (!userId) {
        return null;
      }

      const namespacedKey = `${baseKey}-${userId}`;

      // Try to get user-specific data
      let data = await AsyncStorage.getItem(namespacedKey);

      // If no user-specific data exists, check for legacy data to migrate
      if (!data && LEGACY_KEYS.includes(baseKey)) {
        data = await migrateLegacyData(baseKey, userId);
      }

      return data;
    },

    setItem: async (name: string, value: string): Promise<void> => {
      const userId = await authStateManager.getUserIdAsync();

      // Don't persist if no user is logged in
      if (!userId) {
        console.warn(`[${baseKey}] Skipping persist - no user logged in`);
        return;
      }

      const namespacedKey = `${baseKey}-${userId}`;
      await AsyncStorage.setItem(namespacedKey, value);
    },

    removeItem: async (name: string): Promise<void> => {
      const userId = await authStateManager.getUserIdAsync();

      if (!userId) {
        return;
      }

      const namespacedKey = `${baseKey}-${userId}`;
      await AsyncStorage.removeItem(namespacedKey);
    },
  };
}

/**
 * Migrates data from legacy global key to user-specific key.
 *
 * Only migrates data that belongs to this user (checked via userId in records).
 * Legacy data is preserved (not deleted) in case other users still need it.
 */
async function migrateLegacyData(baseKey: string, userId: string): Promise<string | null> {
  try {
    const legacyData = await AsyncStorage.getItem(baseKey);
    if (!legacyData) return null;

    const parsed = JSON.parse(legacyData);
    const state = parsed.state;

    if (!state) return null;

    // Filter data to only include this user's records
    const migratedState = filterStateByUserId(baseKey, state, userId);

    if (!migratedState || isEmptyState(migratedState)) {
      return null;
    }

    // Save migrated data to user-specific key
    const namespacedKey = `${baseKey}-${userId}`;
    const migratedData = JSON.stringify({ state: migratedState, version: parsed.version });
    await AsyncStorage.setItem(namespacedKey, migratedData);

    console.log(`[${baseKey}] Migrated legacy data for user ${userId.slice(0, 8)}...`);

    // Note: We don't delete legacy data here in case another user needs it.
    // Legacy cleanup can be done separately after confirming all users migrated.

    return migratedData;
  } catch (error) {
    console.error(`[${baseKey}] Migration error:`, error);
    return null;
  }
}

/**
 * Filters persisted state to only include records belonging to the specified user.
 */
function filterStateByUserId(baseKey: string, state: any, userId: string): any {
  if (baseKey === 'workout-store') {
    return {
      scheduledWorkouts: (state.scheduledWorkouts || []).filter((w: any) => w.userId === userId),
      activeWorkout: state.activeWorkout?.userId === userId ? state.activeWorkout : null,
      cachedCompletedWorkouts: (state.cachedCompletedWorkouts || []).filter(
        (w: any) => w.userId === userId
      ),
      cachedCompletedWorkoutsLastFetch: state.cachedCompletedWorkoutsLastFetch,
    };
  }

  if (baseKey === 'template-store') {
    return {
      templates: (state.templates || []).filter((t: any) => t.userId === userId),
      folders: state.folders || [], // Folders are shared across the user's data
    };
  }

  // Unknown store type - return as-is
  return state;
}

/**
 * Checks if the state is effectively empty (no meaningful data).
 */
function isEmptyState(state: any): boolean {
  if (!state) return true;

  // Check if all arrays are empty
  const arrays = Object.values(state).filter(Array.isArray) as any[][];
  const allArraysEmpty = arrays.every((arr) => arr.length === 0);

  // Check for null/undefined non-array values (except timestamps which can be null)
  const nonArrayEntries = Object.entries(state).filter(([_, v]) => !Array.isArray(v));
  const allNonArraysEmpty = nonArrayEntries.every(
    ([key, value]) => value === null || value === undefined || key.includes('lastFetch') // Timestamps can be null
  );

  return allArraysEmpty && allNonArraysEmpty;
}
