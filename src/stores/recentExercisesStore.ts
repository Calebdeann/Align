import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createUserNamespacedStorage } from '@/lib/userNamespacedStorage';
import { Exercise } from '@/services/api/exercises';

const MAX_RECENT = 20;

interface RecentExercisesStore {
  recentExerciseIds: string[];
  addRecentExercises: (ids: string[]) => void;
  getRecentExercises: (allExercises: Exercise[]) => Exercise[];
  clearRecent: () => void;
}

export const useRecentExercisesStore = create<RecentExercisesStore>()(
  persist(
    (set, get) => ({
      recentExerciseIds: [],

      addRecentExercises: (ids: string[]) => {
        set((state) => {
          // Remove duplicates of the new IDs from existing list
          const filtered = state.recentExerciseIds.filter((id) => !ids.includes(id));
          // Prepend new IDs and cap at MAX_RECENT
          return { recentExerciseIds: [...ids, ...filtered].slice(0, MAX_RECENT) };
        });
      },

      getRecentExercises: (allExercises: Exercise[]) => {
        const { recentExerciseIds } = get();
        const exerciseMap = new Map(allExercises.map((e) => [e.id, e]));
        // Map IDs to exercises, filtering out any that no longer exist in DB
        return recentExerciseIds
          .map((id) => exerciseMap.get(id))
          .filter((e): e is Exercise => e !== undefined);
      },

      clearRecent: () => set({ recentExerciseIds: [] }),
    }),
    {
      name: 'recent-exercises',
      storage: createJSONStorage(() => createUserNamespacedStorage('recent-exercises')),
      partialize: (state) => ({ recentExerciseIds: state.recentExerciseIds }),
    }
  )
);
