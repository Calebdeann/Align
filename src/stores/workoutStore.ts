import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createUserNamespacedStorage } from '@/lib/userNamespacedStorage';
import { logger } from '@/utils/logger';
import {
  saveScheduledWorkoutToBackend,
  saveScheduledWorkoutsBatch,
  updateScheduledWorkoutInBackend,
  deleteScheduledWorkoutFromBackend,
  deleteScheduledWorkoutsBatch,
  getScheduledWorkoutsFromBackend,
} from '@/services/api/scheduledWorkouts';
import { getProgram, getProgramWorkout, WORKOUT_TYPE_COLORS } from '@/data/programs';
import { isCardioExerciseId } from '@/constants/cardioOptions';

// UUID v4 format check - local IDs like "workout_123_abc" are not valid UUIDs
const isValidUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Prevents concurrent seedPlanWorkouts() calls for the same plan from double-seeding.
const _seedingInProgress = new Set<string>();

// Display name for a scheduled workout. Program-seeded workouts pull their
// title live from program data unless the user has explicitly renamed them
// (titleCustomized=true). This makes program renames (e.g. "Lower 2" →
// "Lower (Session 2)") propagate to already-scheduled rows without a re-seed.
export function getScheduledWorkoutDisplayName(sw: {
  name: string;
  programWorkoutId?: string;
  titleCustomized?: boolean;
}): string {
  if (sw.titleCustomized) return sw.name;
  if (sw.programWorkoutId) {
    const pw = getProgramWorkout(sw.programWorkoutId);
    if (pw?.title) return pw.title;
  }
  return sw.name;
}

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
  // Cardio-only fields. When `isCardioExerciseId(exercise.id)` is true,
  // the active-workout row UI uses these instead of kg/reps.
  difficulty?: string;
  durationMinutes?: string;
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
  planId?: string; // Plan this workout belongs to (e.g. 'hourglass'); set when seeded from a program
  programWorkoutId?: string; // Stable id from the program data (e.g. 'hourglass-w1-d1-main')
  // True once the user has explicitly renamed this workout. Until then,
  // program-seeded workouts pull their display title live from program data
  // so renames in the source (e.g. "Lower 2" → "Lower (Session 2)") propagate
  // without re-seeding. Absent = treat as false.
  titleCustomized?: boolean;
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
  imageAspectRatio?: number | null;
  imageTemplateId: string | null;
  imageAudience?: 'friends' | 'everyone' | null;
  programWorkoutId?: string | null;
  planId?: string | null;
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
  getWorkoutsForDate: (
    date: string,
    userId: string | null,
    options?: { includePlanWorkouts?: boolean }
  ) => ScheduledWorkout[];
  getWorkoutsForMonth: (
    year: number,
    month: number,
    userId: string | null,
    options?: { includePlanWorkouts?: boolean }
  ) => Map<number, ScheduledWorkout[]>;
  // Plan workout seeding
  seedPlanWorkouts: (
    planId: string,
    startDateKey: string,
    userId: string,
    weekdays?: number[],
    startProgramDayIdx?: number,
    // Optional per-weekday → 1-indexed cycle-position override. Keys are
    // weekday names ("Monday", "Tuesday", ...). When provided, the seeder
    // distributes each cycle of program-days according to this mapping
    // instead of the default sorted-positional order.
    dayAssignments?: Record<string, number> | null
  ) => void;
  getPlanWorkoutSeedStatus: (planId: string, userId: string) => { seeded: boolean; count: number };
  // Re-flow plan workouts to a new weekday cadence. Keeps past + today's seeded
  // workouts in place; deletes future plan workouts and re-seeds from tomorrow,
  // continuing the program at the next unseeded day index.
  reflowPlanWorkouts: (
    planId: string,
    userId: string,
    newWeekdays: number[],
    // Optional new per-weekday → 1-indexed cycle-position override. See
    // seedPlanWorkouts above for semantics.
    dayAssignments?: Record<string, number> | null
  ) => { kept: number; rescheduled: number };
  // Remove all future (unstarted) workouts for a plan — called when the user switches plans
  clearFuturePlanWorkouts: (planId: string, userId: string) => void;
  // Restart a plan from today: deletes all future/today uncompleted workouts and
  // re-seeds W1D1 onto today (using the user's current weekday cadence). Past
  // completed workouts are preserved. Lets the user collapse a gap that formed
  // from a stale seeding cursor.
  resyncPlanFromToday: (planId: string, userId: string, weekdays: number[]) => void;
  // Remove today+future plan workouts that don't belong to the user's CURRENT plan.
  // Skips already-completed entries. Self-heals stale data left from earlier plan switches.
  clearStalePlanWorkouts: (userId: string, currentPlanId: string) => void;
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
  removeCachedCompletedWorkout: (workoutId: string) => void;
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
      sets: {
        targetWeight?: number;
        targetReps?: number;
        setType?: string;
        // Cardio-only initial values (used when isCardioExerciseId(exerciseId) is true)
        targetDifficulty?: number;
        targetDurationMinutes?: number;
      }[];
      restTimerSeconds: number;
      supersetId?: number | null;
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

const DAY_NAME_TO_WEEKDAY: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const WEEKDAY_TO_DAY_NAME: string[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function workoutDaysToWeekdays(days: string[]): number[] {
  return days
    .map((d) => DAY_NAME_TO_WEEKDAY[d] ?? -1)
    .filter((n) => n >= 0)
    .sort((a, b) => a - b);
}

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
          sets: te.sets.map((s, index) => {
            const isCardio = isCardioExerciseId(te.exerciseId);
            return {
              id: `set_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
              // "Previous" always starts as '-' on first render; the
              // history-fetch effect in active-workout populates it with
              // real prior-workout values when the user has done this
              // exercise before. Showing template targets here would
              // misrepresent unfinished plans as historical performance.
              previous: '-',
              kg: isCardio ? '' : s.targetWeight?.toString() || '',
              reps: isCardio ? '' : s.targetReps?.toString() || '',
              difficulty: isCardio ? (s.targetDifficulty?.toString() ?? '') : undefined,
              durationMinutes: isCardio ? (s.targetDurationMinutes?.toString() ?? '') : undefined,
              completed: false,
              setType: s.setType || 'normal',
              rpe: null,
            };
          }),
          // `previousSets` is the source of truth for the "Previous" column
          // *and* the auto-fill-on-complete behavior. Start null so neither
          // path can echo back the template's plan as if it were history;
          // the history fetcher populates this with real data when present.
          previousSets: null,
          supersetId: te.supersetId ?? null,
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

      getWorkoutsForDate: (dateKey, userId, options) => {
        const { scheduledWorkouts } = get();
        const checkDate = new Date(dateKey);
        const includePlan = options?.includePlanWorkouts ?? true;
        return scheduledWorkouts.filter((workout) => {
          if (workout.userId !== userId) return false;
          if (!includePlan && workout.planId) return false;
          return workoutOccursOnDate(workout, checkDate);
        });
      },

      getWorkoutsForMonth: (year, month, userId, options) => {
        const { scheduledWorkouts } = get();
        const workoutsByDay = new Map<number, ScheduledWorkout[]>();
        const includePlan = options?.includePlanWorkouts ?? true;

        const userWorkouts = scheduledWorkouts.filter((w) => {
          if (w.userId !== userId) return false;
          if (!includePlan && w.planId) return false;
          return true;
        });

        const daysInMonth = new Date(year, month + 1, 0).getDate();

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

      seedPlanWorkouts: (
        planId,
        startDateKey,
        userId,
        weekdays,
        startProgramDayIdx,
        dayAssignments
      ) => {
        const lockKey = `${userId}:${planId}`;
        if (_seedingInProgress.has(lockKey)) return;
        _seedingInProgress.add(lockKey);
        try {
          const program = getProgram(planId);
          if (!program) return;

          // Only dedupe against FUTURE workouts for THIS plan. Past completed
          // workouts share the same program-workout-id (e.g. `hourglass-w1-d1-main`)
          // and would otherwise block re-seeding for a user who's done these days
          // before and switched plans away then back.
          const todayKey = formatDateKey(new Date());
          const existing = get().scheduledWorkouts;
          const existingProgramIds = new Set(
            existing
              .filter(
                (w) =>
                  w.userId === userId &&
                  w.planId === planId &&
                  w.date >= todayKey &&
                  !!w.programWorkoutId
              )
              .map((w) => w.programWorkoutId as string)
          );

          // SLOT-BASED SEEDING (see project_workout_plan_stretch.md memory):
          //   Each weekday maps to a fixed plan dayInWeek slot. Plan runs in
          //   exactly program.durationWeeks calendar weeks. Slots not picked by
          //   the user are skipped permanently.
          //
          // Build weekday-number → 1-indexed dayInWeek slot. When dayAssignments
          // is provided, honor it. Otherwise default to sorted-positional from
          // `weekdays` (Mon=slot1, Tue=slot2, …), clipped to program.daysPerWeek.
          const userWeekdays = weekdays && weekdays.length > 0 ? weekdays : program.defaultWeekdays;
          const slotByWeekday = new Map<number, number>();
          if (dayAssignments && Object.keys(dayAssignments).length > 0) {
            for (const [name, slot] of Object.entries(dayAssignments)) {
              const wd = DAY_NAME_TO_WEEKDAY[name];
              if (wd === undefined) continue;
              if (typeof slot !== 'number') continue;
              if (slot < 1 || slot > program.daysPerWeek) continue;
              slotByWeekday.set(wd, slot);
            }
          } else {
            const sorted = [...userWeekdays].sort((a, b) => a - b).slice(0, program.daysPerWeek);
            sorted.forEach((wd, i) => slotByWeekday.set(wd, i + 1));
          }
          if (slotByWeekday.size === 0) return;

          // Determine which program week startDateKey lives in. If the user
          // already has plan workouts seeded for THIS plan, find the earliest
          // one — that's the plan's anchor. Otherwise treat startDateKey as
          // program week 1.
          const allPlanWorkouts = existing.filter(
            (w) => w.userId === userId && w.planId === planId && !!w.programWorkoutId
          );
          let planAnchorKey = startDateKey;
          for (const w of allPlanWorkouts) {
            if (w.date < planAnchorKey) planAnchorKey = w.date;
          }
          const anchorMs = new Date(planAnchorKey + 'T00:00:00').getTime();
          const startMs = new Date(startDateKey + 'T00:00:00').getTime();
          const offsetDays = Math.max(0, Math.round((startMs - anchorMs) / 86400000));
          const startWeekIdx = Math.floor(offsetDays / 7) + 1; // 1-indexed
          const remainingWeeks = program.durationWeeks - (startWeekIdx - 1);
          if (remainingWeeks <= 0) return;
          const totalDays = remainingWeeks * 7;

          const toAdd: ScheduledWorkout[] = [];
          const cursor = new Date(startDateKey + 'T00:00:00');
          // Index program.days by (week, dayInWeek) once for O(1) lookups.
          const programDayByKey = new Map<string, (typeof program.days)[number]>();
          for (const pd of program.days) {
            programDayByKey.set(`${pd.week}-${pd.dayInWeek}`, pd);
          }

          for (let offset = 0; offset < totalDays; offset++) {
            const d = new Date(cursor);
            d.setDate(d.getDate() + offset);
            const weekdayNum = d.getDay();
            const slot = slotByWeekday.get(weekdayNum);
            if (slot === undefined) continue;
            const programWeek = startWeekIdx + Math.floor(offset / 7);
            if (programWeek > program.durationWeeks) break;
            const programDay = programDayByKey.get(`${programWeek}-${slot}`);
            if (!programDay) continue;
            const dateKey = formatDateKey(d);
            for (const pw of programDay.workouts) {
              if (existingProgramIds.has(pw.id)) continue;
              const color = WORKOUT_TYPE_COLORS[pw.type] ?? '#CCCCCC';
              toAdd.push({
                id: generateId(),
                userId,
                name: pw.title,
                description: undefined,
                tagId: pw.type,
                tagColor: color,
                templateName: null,
                date: dateKey,
                repeat: { type: 'never' },
                createdAt: new Date().toISOString(),
                completedDates: [],
                planId,
                programWorkoutId: pw.id,
              });
            }
          }

          if (toAdd.length === 0) return;

          set((state) => ({
            scheduledWorkouts: [...state.scheduledWorkouts, ...toAdd],
          }));

          // Best-effort backend sync via single batch insert; failures tolerated
          // (CLAUDE.md rule #9). Critical for performance: one round-trip + one
          // `set` call instead of N — avoids the multi-second plan-switch freeze
          // that hit users when seeding 50+ workouts.
          saveScheduledWorkoutsBatch(toAdd)
            .then((idMap) => {
              if (idMap.size === 0) return;
              set((state) => ({
                scheduledWorkouts: state.scheduledWorkouts.map((sw) =>
                  idMap.has(sw.id) ? { ...sw, id: idMap.get(sw.id)! } : sw
                ),
              }));
            })
            .catch(() => {});
        } finally {
          _seedingInProgress.delete(lockKey);
        }
      },

      getPlanWorkoutSeedStatus: (planId, userId) => {
        // Only count future + today workouts. Past completed workouts don't
        // count as "seeded" because they don't represent what the user will see
        // going forward — a user who switched plans away and back should be
        // able to re-seed even if they have past completions for this plan.
        const todayKey = formatDateKey(new Date());
        const count = get().scheduledWorkouts.filter(
          (w) => w.userId === userId && w.planId === planId && w.date >= todayKey
        ).length;
        return { seeded: count > 0, count };
      },

      reflowPlanWorkouts: (planId, userId, newWeekdays, dayAssignments) => {
        const program = getProgram(planId);
        if (!program) return { kept: 0, rescheduled: 0 };

        // Slot-based reflow: delete future plan workouts and let seedPlanWorkouts
        // re-seed from tomorrow. The seeder figures out the program-week offset
        // from the EARLIEST remaining plan workout (the plan anchor stays put).
        const todayKey = formatDateKey(new Date());
        const planWorkouts = get().scheduledWorkouts.filter(
          (w) => w.userId === userId && w.planId === planId && w.programWorkoutId
        );

        const futureWorkouts = planWorkouts.filter((w) => w.date > todayKey);
        const futureIds = new Set(futureWorkouts.map((w) => w.id));

        if (futureIds.size > 0) {
          set((state) => ({
            scheduledWorkouts: state.scheduledWorkouts.filter((w) => !futureIds.has(w.id)),
          }));
          for (const id of futureIds) {
            deleteScheduledWorkoutFromBackend(id).catch(() => {});
          }
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowKey = formatDateKey(tomorrow);

        get().seedPlanWorkouts(planId, tomorrowKey, userId, newWeekdays, undefined, dayAssignments);

        const kept = planWorkouts.length - futureWorkouts.length;
        const rescheduled = futureWorkouts.length;
        return { kept, rescheduled };
      },

      clearFuturePlanWorkouts: (planId, userId) => {
        const todayKey = formatDateKey(new Date());
        // Clear today + future plan workouts on a plan switch, but preserve any
        // the user has already completed (don't undo today's completion just
        // because they swapped plans afterward).
        const toDelete = get().scheduledWorkouts.filter(
          (w) =>
            w.userId === userId &&
            w.planId === planId &&
            w.date >= todayKey &&
            !w.completedDates.includes(w.date)
        );
        if (toDelete.length === 0) return;
        const ids = new Set(toDelete.map((w) => w.id));
        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.filter((w) => !ids.has(w.id)),
        }));
        // Single batch delete instead of N individual calls — same perf
        // motivation as the seedPlanWorkouts batch insert above.
        deleteScheduledWorkoutsBatch(Array.from(ids)).catch(() => {});
      },

      // Wipes today + future uncompleted plan workouts AND any past uncompleted
      // workouts (so a stale W1D1 stuck on a future date can't block the dedupe).
      // Then re-seeds the program from W1D1 onto today, walking forward on the
      // user's chosen weekdays. Past *completed* workouts are preserved as
      // history. Use this to collapse a gap created by an earlier reflow or
      // partial seeding.
      resyncPlanFromToday: (planId, userId, weekdays) => {
        const todayKey = formatDateKey(new Date());

        // Delete every uncompleted plan workout — past and future. We must drop
        // future ones (they'd block re-seeding via the programWorkoutId dedupe);
        // past uncompleted ones are stale and irrelevant to the new schedule.
        const toDelete = get().scheduledWorkouts.filter(
          (w) =>
            w.userId === userId &&
            w.planId === planId &&
            !!w.programWorkoutId &&
            !w.completedDates.includes(w.date)
        );
        if (toDelete.length > 0) {
          const ids = new Set(toDelete.map((w) => w.id));
          set((state) => ({
            scheduledWorkouts: state.scheduledWorkouts.filter((w) => !ids.has(w.id)),
          }));
          deleteScheduledWorkoutsBatch(Array.from(ids)).catch(() => {});
        }

        // Re-seed from today at program day 0 (W1D1). seedPlanWorkouts itself
        // dedupes by programWorkoutId for date >= today, but the wipe above
        // cleared those; any past completions are date < today so untouched.
        get().seedPlanWorkouts(planId, todayKey, userId, weekdays, 0);
      },

      clearStalePlanWorkouts: (userId, currentPlanId) => {
        const todayKey = formatDateKey(new Date());
        // Wipe any scheduled workout from a *different* plan than the user's
        // current one — but only future/today and only if not yet completed.
        // This catches data left over from earlier plan switches that didn't
        // get fully cleaned up.
        const toDelete = get().scheduledWorkouts.filter(
          (w) =>
            w.userId === userId &&
            !!w.planId &&
            w.planId !== currentPlanId &&
            w.date >= todayKey &&
            !w.completedDates.includes(w.date)
        );
        if (toDelete.length === 0) return;
        const ids = new Set(toDelete.map((w) => w.id));
        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.filter((w) => !ids.has(w.id)),
        }));
        // Single batch delete instead of N individual calls — same perf
        // motivation as the seedPlanWorkouts batch insert above.
        deleteScheduledWorkoutsBatch(Array.from(ids)).catch(() => {});
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

          // Drop local workouts whose programWorkoutId is already covered by a backend entry.
          // This prevents duplicates during the async window where local IDs haven't been
          // replaced with UUIDs yet but the backend has already accepted the record.
          const backendProgramIds = new Set(
            backendWorkouts.map((w) => w.programWorkoutId).filter(Boolean)
          );
          const localOnly = currentLocal.filter(
            (w) => !isValidUuid(w.id) && !backendProgramIds.has(w.programWorkoutId ?? '')
          );

          if (backendWorkouts.length > 0 || localOnly.length > 0) {
            // Final safety: deduplicate merged list by programWorkoutId (backend wins).
            // Collect dropped IDs so we can delete them from Supabase too.
            const seenPwIds = new Set<string>();
            const droppedIds: string[] = [];
            const merged = [...backendWorkouts, ...localOnly].filter((w) => {
              if (!w.programWorkoutId) return true;
              if (seenPwIds.has(w.programWorkoutId)) {
                if (isValidUuid(w.id)) droppedIds.push(w.id);
                return false;
              }
              seenPwIds.add(w.programWorkoutId);
              return true;
            });
            set({ scheduledWorkouts: merged });
            // Clean up duplicate records from Supabase in the background.
            for (const id of droppedIds) {
              deleteScheduledWorkoutFromBackend(id).catch(() => {});
            }
            if (droppedIds.length > 0) {
              logger.info(
                `[WorkoutStore] Deleted ${droppedIds.length} duplicate plan workouts from backend`
              );
            }
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

      removeCachedCompletedWorkout: (workoutId) => {
        set((state) => ({
          cachedCompletedWorkouts: state.cachedCompletedWorkouts.filter((w) => w.id !== workoutId),
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

        // One-time dedup: remove duplicate plan workouts by programWorkoutId.
        // Keeps the UUID-based (backend-synced) record when both exist.
        const seen = new Set<string>();
        const deduped = [...state.scheduledWorkouts]
          .sort((a, b) => (isValidUuid(a.id) ? -1 : 1) - (isValidUuid(b.id) ? -1 : 1))
          .filter((w) => {
            if (!w.programWorkoutId) return true;
            if (seen.has(w.programWorkoutId)) return false;
            seen.add(w.programWorkoutId);
            return true;
          });
        if (deduped.length < state.scheduledWorkouts.length) {
          useWorkoutStore.setState({ scheduledWorkouts: deduped });
          logger.info(
            `[WorkoutStore] Removed ${state.scheduledWorkouts.length - deduped.length} duplicate plan workouts on rehydration`
          );
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
