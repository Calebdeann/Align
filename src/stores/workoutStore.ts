import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createUserNamespacedStorage } from '@/lib/userNamespacedStorage';
import { logger } from '@/utils/logger';
import {
  saveScheduledWorkoutToBackend,
  updateScheduledWorkoutInBackend,
  deleteScheduledWorkoutFromBackend,
  getScheduledWorkoutsFromBackend,
} from '@/services/api/scheduledWorkouts';

// UUID v4 format check - local IDs like "workout_123_abc" are not valid UUIDs
const isValidUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export interface WorkoutImage {
  type: 'template' | 'camera' | 'gallery';
  uri: string;
  templateId?: string;
}

// Types for active (in-progress) workout session
export interface ActiveExerciseSet {
  id: string;
  previous: string;
  kg: string;
  reps: string;
  completed: boolean;
  setType?: string;
  rpe: number | null;
}

export interface ActiveExercise {
  id: string;
  name: string;
  muscle: string;
  gifUrl?: string;
  thumbnailUrl?: string;
  is_custom?: boolean;
}

export interface PreviousSetData {
  setNumber?: number;
  weightKg: number | null;
  reps: number | null;
}

export interface ActiveWorkoutExercise {
  exercise: ActiveExercise;
  notes: string;
  restTimerSeconds: number;
  sets: ActiveExerciseSet[];
  previousSets: PreviousSetData[] | null;
  supersetId: number | null;
}

export interface ActiveWorkoutSession {
  exercises: ActiveWorkoutExercise[];
  elapsedSeconds: number;
  startedAt: string;
  userId: string | null;
  isMinimized: boolean;
  sourceTemplateId?: string; // Track which template this workout came from
  templateName?: string; // Store template name for display
  scheduledWorkoutId?: string; // Track which scheduled workout this came from (for auto-tick)
}

// Exercises selected in add-exercise screen, pending addition to workout
export interface PendingExercise {
  id: string;
  name: string;
  muscle: string;
  gifUrl?: string;
  thumbnailUrl?: string;
  is_custom?: boolean;
}

export interface ScheduledWorkout {
  id: string;
  userId: string; // Owner of this workout - used for per-user data isolation
  name: string;
  description?: string;
  image?: WorkoutImage;
  tagId: string | null; // Now stores colour id (e.g., 'purple', 'green')
  tagColor: string;
  templateName: string | null; // Template name for display, or null if no template
  date: string; // ISO date string (YYYY-MM-DD)
  time?: {
    hour: number;
    minute: number;
  };
  repeat: {
    type: 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom' | 'interval';
    customDays?: number[]; // 0-6 for Sun-Sat (used by 'custom')
    intervalDays?: number; // e.g., 3 for "every 3 days" (used by 'interval')
  };
  reminder?: {
    enabled: boolean;
    hour: number;
    minute: number;
  };
  createdAt: string;
  completedDates: string[]; // Array of YYYY-MM-DD dates when workout was completed
  excludedDates?: string[]; // Array of YYYY-MM-DD dates to skip for recurring workouts
  endDate?: string; // YYYY-MM-DD - if set, no occurrences generated after this date
  templateId?: string; // Optional link to a workout template
}

// Cached completed workout from Supabase (for instant loading)
export interface CachedCompletedWorkout {
  id: string;
  userId: string; // Owner of this workout
  name: string | null;
  completedAt: string;
  durationSeconds: number;
  exerciseCount: number;
  totalSets: number;
  imageType: string | null;
  imageUri: string | null;
  imageTemplateId: string | null;
}

interface WorkoutStore {
  // Scheduled workouts
  scheduledWorkouts: ScheduledWorkout[];
  addWorkout: (workout: Omit<ScheduledWorkout, 'id' | 'createdAt' | 'completedDates'>) => void;
  updateWorkout: (id: string, updates: Partial<Omit<ScheduledWorkout, 'id' | 'createdAt'>>) => void;
  editSingleOccurrence: (
    originalId: string,
    originalDateKey: string,
    newWorkoutData: Omit<ScheduledWorkout, 'id' | 'createdAt' | 'completedDates'>
  ) => void;
  editFromDateForward: (
    originalId: string,
    fromDateKey: string,
    newWorkoutData: Omit<ScheduledWorkout, 'id' | 'createdAt' | 'completedDates'>
  ) => void;
  removeWorkout: (id: string) => void;
  removeWorkoutOccurrence: (id: string, dateKey: string) => void; // Remove single occurrence from recurring
  getScheduledWorkoutById: (id: string) => ScheduledWorkout | undefined;
  clearAllScheduledWorkouts: () => void;
  toggleWorkoutCompletion: (workoutId: string, dateKey: string) => void;
  isWorkoutCompleted: (workoutId: string, dateKey: string) => boolean;
  getWorkoutsForDate: (date: string, userId: string | null) => ScheduledWorkout[];
  getWorkoutsForMonth: (
    year: number,
    month: number,
    userId: string | null
  ) => Map<number, ScheduledWorkout[]>;
  // Cascade template edits (name, color, image) to all scheduled workouts referencing that template
  updateScheduledWorkoutsForTemplate: (
    templateId: string,
    updates: { name?: string; tagColor?: string; image?: WorkoutImage }
  ) => void;
  // Get scheduled workouts linked to a template (for checking before deletion)
  getScheduledWorkoutsForTemplate: (templateId: string) => ScheduledWorkout[];
  // Detach scheduled workouts from a deleted template (keeps workouts, clears templateId)
  detachScheduledWorkoutsFromTemplate: (templateId: string) => void;
  // Remove all scheduled workouts linked to a template
  removeScheduledWorkoutsForTemplate: (templateId: string) => void;
  // Auto-mark scheduled workouts as complete when a workout is saved
  markScheduledWorkoutComplete: (
    dateKey: string,
    userId: string | null,
    templateId?: string,
    workoutName?: string
  ) => void;

  // Sync scheduled workouts from Supabase (called on login/rehydrate)
  syncScheduledWorkoutsFromBackend: (userId: string) => Promise<void>;

  // Cached completed workouts from Supabase (for instant loading)
  cachedCompletedWorkouts: CachedCompletedWorkout[];
  cachedCompletedWorkoutsLastFetch: string | null; // ISO timestamp
  setCachedCompletedWorkouts: (workouts: CachedCompletedWorkout[]) => void;
  addCachedCompletedWorkout: (workout: CachedCompletedWorkout) => void;
  getCachedCompletedWorkoutsForDate: (
    dateKey: string,
    userId: string | null
  ) => CachedCompletedWorkout[];

  // Active workout session
  activeWorkout: ActiveWorkoutSession | null;
  startActiveWorkout: (userId: string | null, scheduledWorkoutId?: string) => void;
  startWorkoutFromTemplate: (
    templateId: string,
    templateName: string,
    exercises: {
      exerciseId: string;
      exerciseName: string;
      muscle: string;
      gifUrl?: string;
      thumbnailUrl?: string;
      notes?: string;
      is_custom?: boolean;
      sets: { targetWeight?: number; targetReps?: number; setType?: string }[];
      restTimerSeconds: number;
    }[],
    userId: string | null,
    scheduledWorkoutId?: string
  ) => void;
  setActiveWorkoutExercises: (exercises: ActiveWorkoutExercise[]) => void;
  updateActiveWorkoutTime: (seconds: number) => void;
  minimizeActiveWorkout: () => void;
  restoreActiveWorkout: () => void;
  discardActiveWorkout: () => void;
  hasActiveWorkout: () => boolean;

  // Pending exercises from add-exercise screen
  pendingExercises: PendingExercise[];
  setPendingExercises: (exercises: PendingExercise[]) => void;
  clearPendingExercises: () => void;
}

// Generate a simple unique ID
const generateId = () => `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Format date to YYYY-MM-DD
const formatDateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Check if a workout occurs on a specific date based on its repeat settings
const workoutOccursOnDate = (workout: ScheduledWorkout, checkDate: Date): boolean => {
  const workoutDate = new Date(workout.date);
  const checkDateKey = formatDateKey(checkDate);
  const workoutDateKey = workout.date;

  // Check if this date is excluded
  if (workout.excludedDates?.includes(checkDateKey)) return false;

  // Check if past the end date (for split recurring series)
  if (workout.endDate && checkDateKey > workout.endDate) return false;

  // If it's the original date, always show
  if (checkDateKey === workoutDateKey) return true;

  // If the check date is before the workout start date, don't show
  if (checkDate < workoutDate) return false;

  const { type, customDays } = workout.repeat;

  if (type === 'never') return false;

  if (type === 'daily') return true;

  if (type === 'weekly') {
    const daysDiff = Math.floor(
      (checkDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff % 7 === 0;
  }

  if (type === 'biweekly') {
    const daysDiff = Math.floor(
      (checkDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff % 14 === 0;
  }

  if (type === 'monthly') {
    return workoutDate.getDate() === checkDate.getDate();
  }

  if (type === 'custom' && customDays && customDays.length > 0) {
    return customDays.includes(checkDate.getDay());
  }

  if (type === 'interval' && workout.repeat.intervalDays) {
    const daysDiff = Math.floor(
      (checkDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff % workout.repeat.intervalDays === 0;
  }

  return false;
};

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      scheduledWorkouts: [],
      activeWorkout: null,
      pendingExercises: [],
      cachedCompletedWorkouts: [],
      cachedCompletedWorkoutsLastFetch: null,

      // Pending exercises methods
      setPendingExercises: (exercises) => {
        set({ pendingExercises: exercises });
      },

      clearPendingExercises: () => {
        set({ pendingExercises: [] });
      },

      // Active workout methods
      startActiveWorkout: (userId, scheduledWorkoutId) => {
        set({
          activeWorkout: {
            exercises: [],
            elapsedSeconds: 0,
            startedAt: new Date().toISOString(),
            userId,
            isMinimized: false,
            scheduledWorkoutId,
          },
        });
      },

      startWorkoutFromTemplate: (
        templateId,
        templateName,
        templateExercises,
        userId,
        scheduledWorkoutId
      ) => {
        // Convert template exercises to active workout exercises
        const activeExercises: ActiveWorkoutExercise[] = templateExercises.map((te) => ({
          exercise: {
            id: te.exerciseId,
            name: te.exerciseName,
            muscle: te.muscle,
            gifUrl: te.gifUrl,
            thumbnailUrl: te.thumbnailUrl,
            is_custom: te.is_custom,
          },
          notes: te.notes || '',
          restTimerSeconds: te.restTimerSeconds,
          sets: te.sets.map((s, index) => ({
            id: `set_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
            previous:
              s.targetWeight && s.targetReps ? `${s.targetWeight}kg x ${s.targetReps}` : '-',
            kg: s.targetWeight?.toString() || '',
            reps: s.targetReps?.toString() || '',
            completed: false,
            setType: s.setType || 'normal',
            rpe: null,
          })),
          previousSets: te.sets.map((s) => ({
            weightKg: s.targetWeight || null,
            reps: s.targetReps || null,
          })),
          supersetId: null,
        }));

        set({
          activeWorkout: {
            exercises: activeExercises,
            elapsedSeconds: 0,
            startedAt: new Date().toISOString(),
            userId,
            isMinimized: false,
            sourceTemplateId: templateId,
            templateName,
            scheduledWorkoutId,
          },
        });
      },

      setActiveWorkoutExercises: (exercises) => {
        set((state) => ({
          activeWorkout: state.activeWorkout ? { ...state.activeWorkout, exercises } : null,
        }));
      },

      updateActiveWorkoutTime: (seconds) => {
        set((state) => ({
          activeWorkout: state.activeWorkout
            ? { ...state.activeWorkout, elapsedSeconds: seconds }
            : null,
        }));
      },

      minimizeActiveWorkout: () => {
        set((state) => ({
          activeWorkout: state.activeWorkout ? { ...state.activeWorkout, isMinimized: true } : null,
        }));
      },

      restoreActiveWorkout: () => {
        set((state) => ({
          activeWorkout: state.activeWorkout
            ? { ...state.activeWorkout, isMinimized: false }
            : null,
        }));
      },

      discardActiveWorkout: () => {
        set({ activeWorkout: null });
      },

      hasActiveWorkout: () => {
        return get().activeWorkout !== null;
      },

      // Scheduled workout methods
      addWorkout: (workout) => {
        const localId = generateId();
        const newWorkout: ScheduledWorkout = {
          ...workout,
          id: localId,
          createdAt: new Date().toISOString(),
          completedDates: [],
        };
        set((state) => ({
          scheduledWorkouts: [...state.scheduledWorkouts, newWorkout],
        }));

        // Background sync to Supabase
        if (workout.userId) {
          saveScheduledWorkoutToBackend(newWorkout)
            .then((backendId) => {
              if (backendId) {
                set((state) => ({
                  scheduledWorkouts: state.scheduledWorkouts.map((w) =>
                    w.id === localId ? { ...w, id: backendId } : w
                  ),
                }));
              }
            })
            .catch(() => {});
        }
      },

      updateWorkout: (id, updates) => {
        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.map((w) => {
            if (w.id !== id) return w;
            return { ...w, ...updates };
          }),
        }));

        // Background sync
        updateScheduledWorkoutInBackend(id, updates).catch(() => {});
      },

      updateScheduledWorkoutsForTemplate: (templateId, updates) => {
        const affected = get().scheduledWorkouts.filter((w) => w.templateId === templateId);

        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.map((w) => {
            if (w.templateId !== templateId) return w;

            const result = { ...w };

            if (updates.name) {
              const oldTemplateName = result.templateName;
              result.templateName = updates.name;
              if (result.name === oldTemplateName) {
                result.name = updates.name;
              }
            }

            if (updates.tagColor) {
              result.tagColor = updates.tagColor;
            }

            if (updates.image !== undefined) {
              result.image = updates.image;
            }

            return result;
          }),
        }));

        // Background sync each affected workout
        for (const w of affected) {
          const dbUpdates: Partial<ScheduledWorkout> = {};
          if (updates.name) {
            dbUpdates.templateName = updates.name;
            if (w.name === w.templateName) dbUpdates.name = updates.name;
          }
          if (updates.tagColor) dbUpdates.tagColor = updates.tagColor;
          if (updates.image !== undefined) dbUpdates.image = updates.image;
          updateScheduledWorkoutInBackend(w.id, dbUpdates).catch(() => {});
        }
      },

      getScheduledWorkoutsForTemplate: (templateId) => {
        return get().scheduledWorkouts.filter((w) => w.templateId === templateId);
      },

      detachScheduledWorkoutsFromTemplate: (templateId) => {
        const affected = get().scheduledWorkouts.filter((w) => w.templateId === templateId);

        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.map((w) => {
            if (w.templateId !== templateId) return w;
            return { ...w, templateId: undefined, templateName: null };
          }),
        }));

        // Background sync
        for (const w of affected) {
          updateScheduledWorkoutInBackend(w.id, {
            templateId: undefined,
            templateName: null,
          }).catch(() => {});
        }
      },

      removeScheduledWorkoutsForTemplate: (templateId) => {
        const toDelete = get().scheduledWorkouts.filter((w) => w.templateId === templateId);

        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.filter((w) => w.templateId !== templateId),
        }));

        // Background sync
        for (const w of toDelete) {
          deleteScheduledWorkoutFromBackend(w.id).catch(() => {});
        }
      },

      editSingleOccurrence: (originalId, originalDateKey, newWorkoutData) => {
        const original = get().scheduledWorkouts.find((w) => w.id === originalId);
        if (!original) return;

        const wasCompleted = original.completedDates.includes(originalDateKey);
        const localId = generateId();

        const newWorkout: ScheduledWorkout = {
          ...newWorkoutData,
          repeat: { type: 'never' },
          id: localId,
          createdAt: new Date().toISOString(),
          completedDates: wasCompleted ? [newWorkoutData.date] : [],
        };

        const updatedExcludedDates = [...(original.excludedDates || [])];
        if (!updatedExcludedDates.includes(originalDateKey)) {
          updatedExcludedDates.push(originalDateKey);
        }

        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts
            .map((w) => {
              if (w.id !== originalId) return w;
              return { ...w, excludedDates: updatedExcludedDates };
            })
            .concat(newWorkout),
        }));

        // Background sync: update original's excludedDates + save new workout
        updateScheduledWorkoutInBackend(originalId, { excludedDates: updatedExcludedDates }).catch(
          () => {}
        );
        if (newWorkoutData.userId) {
          saveScheduledWorkoutToBackend(newWorkout)
            .then((backendId) => {
              if (backendId) {
                set((state) => ({
                  scheduledWorkouts: state.scheduledWorkouts.map((w) =>
                    w.id === localId ? { ...w, id: backendId } : w
                  ),
                }));
              }
            })
            .catch(() => {});
        }
      },

      editFromDateForward: (originalId, fromDateKey, newWorkoutData) => {
        const original = get().scheduledWorkouts.find((w) => w.id === originalId);
        if (!original) return;

        const fromDate = new Date(fromDateKey);
        const dayBefore = new Date(fromDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const endDateKey = formatDateKey(dayBefore);

        const futureCompletedDates = original.completedDates.filter((d) => d >= fromDateKey);
        const pastCompletedDates = original.completedDates.filter((d) => d < fromDateKey);
        const localId = generateId();

        const newWorkout: ScheduledWorkout = {
          ...newWorkoutData,
          id: localId,
          createdAt: new Date().toISOString(),
          completedDates: futureCompletedDates,
        };

        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts
            .map((w) => {
              if (w.id !== originalId) return w;
              return {
                ...w,
                endDate: endDateKey,
                completedDates: pastCompletedDates,
              };
            })
            .concat(newWorkout),
        }));

        // Background sync: update original + save new
        updateScheduledWorkoutInBackend(originalId, {
          endDate: endDateKey,
          completedDates: pastCompletedDates,
        }).catch(() => {});
        if (newWorkoutData.userId) {
          saveScheduledWorkoutToBackend(newWorkout)
            .then((backendId) => {
              if (backendId) {
                set((state) => ({
                  scheduledWorkouts: state.scheduledWorkouts.map((w) =>
                    w.id === localId ? { ...w, id: backendId } : w
                  ),
                }));
              }
            })
            .catch(() => {});
        }
      },

      removeWorkout: (id) => {
        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.filter((w) => w.id !== id),
        }));

        // Background sync
        deleteScheduledWorkoutFromBackend(id).catch(() => {});
      },

      // Remove a single occurrence from a recurring workout by adding to excludedDates
      // For non-recurring workouts, this just removes the whole workout
      removeWorkoutOccurrence: (id, dateKey) => {
        const workout = get().scheduledWorkouts.find((w) => w.id === id);
        if (!workout) return;

        if (workout.repeat.type === 'never' || workout.date === dateKey) {
          set((state) => ({
            scheduledWorkouts: state.scheduledWorkouts.filter((w) => w.id !== id),
          }));
          // Background sync
          deleteScheduledWorkoutFromBackend(id).catch(() => {});
        } else {
          const updatedExcludedDates = [...(workout.excludedDates || [])];
          if (!updatedExcludedDates.includes(dateKey)) {
            updatedExcludedDates.push(dateKey);
          }
          set((state) => ({
            scheduledWorkouts: state.scheduledWorkouts.map((w) => {
              if (w.id !== id) return w;
              return { ...w, excludedDates: updatedExcludedDates };
            }),
          }));
          // Background sync
          updateScheduledWorkoutInBackend(id, { excludedDates: updatedExcludedDates }).catch(
            () => {}
          );
        }
      },

      getScheduledWorkoutById: (id) => {
        return get().scheduledWorkouts.find((w) => w.id === id);
      },

      clearAllScheduledWorkouts: () => {
        set({ scheduledWorkouts: [] });
      },

      toggleWorkoutCompletion: (workoutId, dateKey) => {
        const workout = get().scheduledWorkouts.find((w) => w.id === workoutId);
        if (!workout) return;

        const isCompleted = workout.completedDates.includes(dateKey);
        const newCompletedDates = isCompleted
          ? workout.completedDates.filter((d) => d !== dateKey)
          : [...workout.completedDates, dateKey];

        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.map((w) => {
            if (w.id !== workoutId) return w;
            return { ...w, completedDates: newCompletedDates };
          }),
        }));

        // Background sync
        updateScheduledWorkoutInBackend(workoutId, { completedDates: newCompletedDates }).catch(
          () => {}
        );
      },

      isWorkoutCompleted: (workoutId, dateKey) => {
        const { scheduledWorkouts } = get();
        const workout = scheduledWorkouts.find((w) => w.id === workoutId);
        return workout?.completedDates.includes(dateKey) ?? false;
      },

      getWorkoutsForDate: (dateKey, userId) => {
        const { scheduledWorkouts } = get();
        const checkDate = new Date(dateKey);
        // Filter by userId first, then check if workout occurs on date
        return scheduledWorkouts.filter(
          (workout) => workout.userId === userId && workoutOccursOnDate(workout, checkDate)
        );
      },

      getWorkoutsForMonth: (year, month, userId) => {
        const { scheduledWorkouts } = get();
        const workoutsByDay = new Map<number, ScheduledWorkout[]>();

        // Filter workouts by userId first
        const userWorkouts = scheduledWorkouts.filter((w) => w.userId === userId);

        // Get number of days in the month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Check each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
          const checkDate = new Date(year, month, day);
          const workoutsForDay = userWorkouts.filter((workout) =>
            workoutOccursOnDate(workout, checkDate)
          );
          if (workoutsForDay.length > 0) {
            workoutsByDay.set(day, workoutsForDay);
          }
        }

        return workoutsByDay;
      },

      // Mark scheduled workouts as complete when a workout is saved
      // Matches by templateId first, then by name if no templateId match
      markScheduledWorkoutComplete: (dateKey, userId, templateId, workoutName) => {
        const { scheduledWorkouts } = get();
        const checkDate = new Date(dateKey);

        // Find workouts scheduled for this date AND belonging to this user
        const workoutsForDate = scheduledWorkouts.filter(
          (w) => w.userId === userId && workoutOccursOnDate(w, checkDate)
        );

        if (workoutsForDate.length === 0) return;

        // Try to find a match by templateId first
        let matchedWorkout = templateId
          ? workoutsForDate.find((w) => w.templateId === templateId)
          : undefined;

        // If no templateId match, try matching by name (case-insensitive)
        if (!matchedWorkout && workoutName) {
          const normalizedName = workoutName.toLowerCase().trim();
          matchedWorkout = workoutsForDate.find(
            (w) => w.name.toLowerCase().trim() === normalizedName
          );
        }

        // If still no match and there's only one workout scheduled, mark it complete
        if (!matchedWorkout && workoutsForDate.length === 1) {
          matchedWorkout = workoutsForDate[0];
        }

        if (matchedWorkout && !matchedWorkout.completedDates.includes(dateKey)) {
          const newCompletedDates = [...matchedWorkout.completedDates, dateKey];
          set((state) => ({
            scheduledWorkouts: state.scheduledWorkouts.map((workout) => {
              if (workout.id !== matchedWorkout!.id) return workout;
              return { ...workout, completedDates: newCompletedDates };
            }),
          }));

          // Background sync
          updateScheduledWorkoutInBackend(matchedWorkout.id, {
            completedDates: newCompletedDates,
          }).catch(() => {});
        }
      },

      // Sync scheduled workouts from Supabase on login/rehydrate
      syncScheduledWorkoutsFromBackend: async (userId) => {
        try {
          const backendWorkouts = await getScheduledWorkoutsFromBackend(userId);

          // Get current local-only workouts (not yet synced to Supabase)
          const currentLocal = get().scheduledWorkouts;
          const localOnly = currentLocal.filter((w) => !isValidUuid(w.id));

          if (backendWorkouts.length > 0 || localOnly.length > 0) {
            // Backend workouts take precedence; keep local-only ones that aren't in backend
            set({ scheduledWorkouts: [...backendWorkouts, ...localOnly] });
          }

          // Upload any local-only workouts to Supabase
          for (const w of localOnly) {
            if (w.userId !== userId) continue;
            const backendId = await saveScheduledWorkoutToBackend(w);
            if (backendId) {
              set((state) => ({
                scheduledWorkouts: state.scheduledWorkouts.map((sw) =>
                  sw.id === w.id ? { ...sw, id: backendId } : sw
                ),
              }));
            }
          }

          if (backendWorkouts.length > 0) {
            logger.info(
              `[WorkoutStore] Synced ${backendWorkouts.length} scheduled workouts from backend`
            );
          }
        } catch (error) {
          logger.warn('[WorkoutStore] Failed to sync scheduled workouts from backend', { error });
        }
      },

      // Cached completed workouts methods
      setCachedCompletedWorkouts: (workouts) => {
        // Cap at 200 entries to prevent AsyncStorage bloat over time
        const limited = workouts.length > 200 ? workouts.slice(0, 200) : workouts;
        set({
          cachedCompletedWorkouts: limited,
          cachedCompletedWorkoutsLastFetch: new Date().toISOString(),
        });
      },

      addCachedCompletedWorkout: (workout) => {
        set((state) => ({
          cachedCompletedWorkouts: [...state.cachedCompletedWorkouts, workout],
        }));
      },

      getCachedCompletedWorkoutsForDate: (dateKey, userId) => {
        const { cachedCompletedWorkouts } = get();
        return cachedCompletedWorkouts.filter((w) => {
          if (w.userId !== userId) return false;
          const completedDate = new Date(w.completedAt);
          const localDateKey = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, '0')}-${String(completedDate.getDate()).padStart(2, '0')}`;
          return localDateKey === dateKey;
        });
      },
    }),
    {
      name: 'workout-store',
      storage: createJSONStorage(() => createUserNamespacedStorage('workout-store')),
      partialize: (state) => ({
        scheduledWorkouts: state.scheduledWorkouts,
        activeWorkout: state.activeWorkout,
        cachedCompletedWorkouts: state.cachedCompletedWorkouts,
        cachedCompletedWorkoutsLastFetch: state.cachedCompletedWorkoutsLastFetch,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Auto-minimize active workout on cold start so the widget banner shows
        // and the workout tab doesn't silently discard it as "stale state"
        if (state.activeWorkout && !state.activeWorkout.isMinimized) {
          useWorkoutStore.setState({
            activeWorkout: { ...state.activeWorkout, isMinimized: true },
          });
        }

        // Wait for template store to rehydrate before checking for orphans.
        // setTimeout(0) is NOT enough because template store reads from AsyncStorage.
        let orphanAttempts = 0;
        const orphanInterval = setInterval(() => {
          try {
            orphanAttempts++;
            const { useTemplateStore } = require('@/stores/templateStore');
            const templatePersist = (useTemplateStore as any).persist;

            // Wait until template store has finished loading from storage
            if (!templatePersist?.hasHydrated?.() && orphanAttempts < 30) return;

            clearInterval(orphanInterval);

            const { getTemplateById } = useTemplateStore.getState();
            const workoutState = useWorkoutStore.getState();
            const orphaned = workoutState.scheduledWorkouts.filter(
              (w: ScheduledWorkout) => w.templateId && !getTemplateById(w.templateId)
            );
            if (orphaned.length > 0) {
              useWorkoutStore.setState((prev: { scheduledWorkouts: ScheduledWorkout[] }) => ({
                scheduledWorkouts: prev.scheduledWorkouts.map((w: ScheduledWorkout) => {
                  if (!w.templateId || getTemplateById(w.templateId)) return w;
                  return { ...w, templateId: undefined, templateName: null };
                }),
              }));
              logger.info(
                `Detached ${orphaned.length} orphaned scheduled workout(s) from deleted templates`
              );
            }
          } catch (err) {
            clearInterval(orphanInterval);
          }
        }, 100);
      },
    }
  )
);
