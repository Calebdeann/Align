import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createUserNamespacedStorage } from '@/lib/userNamespacedStorage';

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
  rpe?: number | null;
}

export interface ActiveExercise {
  id: string;
  name: string;
  muscle: string;
  gifUrl?: string;
  thumbnailUrl?: string;
}

export interface PreviousSetData {
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
}

// Exercises selected in add-exercise screen, pending addition to workout
export interface PendingExercise {
  id: string;
  name: string;
  muscle: string;
  gifUrl?: string;
  thumbnailUrl?: string;
}

export interface ScheduledWorkout {
  id: string;
  userId: string; // Owner of this workout - used for per-user data isolation
  name: string;
  description?: string;
  image?: WorkoutImage;
  tagId: string | null; // Now stores colour id (e.g., 'purple', 'green')
  tagColor: string;
  templateName: string; // Display name: 'Default Workout' or template name
  date: string; // ISO date string (YYYY-MM-DD)
  time?: {
    hour: number;
    minute: number;
  };
  repeat: {
    type: 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
    customDays?: number[]; // 0-6 for Sun-Sat
  };
  reminder?: {
    enabled: boolean;
    hour: number;
    minute: number;
  };
  createdAt: string;
  completedDates: string[]; // Array of YYYY-MM-DD dates when workout was completed
  excludedDates?: string[]; // Array of YYYY-MM-DD dates to skip for recurring workouts
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
}

interface WorkoutStore {
  // Scheduled workouts
  scheduledWorkouts: ScheduledWorkout[];
  addWorkout: (workout: Omit<ScheduledWorkout, 'id' | 'createdAt' | 'completedDates'>) => void;
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
  // Auto-mark scheduled workouts as complete when a workout is saved
  markScheduledWorkoutComplete: (
    dateKey: string,
    userId: string | null,
    templateId?: string,
    workoutName?: string
  ) => void;

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
  startActiveWorkout: (userId: string | null) => void;
  startWorkoutFromTemplate: (
    templateId: string,
    templateName: string,
    exercises: {
      exerciseId: string;
      exerciseName: string;
      muscle: string;
      gifUrl?: string;
      thumbnailUrl?: string;
      sets: { targetWeight?: number; targetReps?: number }[];
      restTimerSeconds: number;
    }[],
    userId: string | null
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
      startActiveWorkout: (userId) => {
        set({
          activeWorkout: {
            exercises: [],
            elapsedSeconds: 0,
            startedAt: new Date().toISOString(),
            userId,
            isMinimized: false,
          },
        });
      },

      startWorkoutFromTemplate: (templateId, templateName, templateExercises, userId) => {
        // Convert template exercises to active workout exercises
        const activeExercises: ActiveWorkoutExercise[] = templateExercises.map((te) => ({
          exercise: {
            id: te.exerciseId,
            name: te.exerciseName,
            muscle: te.muscle,
            gifUrl: te.gifUrl,
            thumbnailUrl: te.thumbnailUrl,
          },
          notes: '',
          restTimerSeconds: te.restTimerSeconds,
          sets: te.sets.map((s, index) => ({
            id: `set_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
            previous:
              s.targetWeight && s.targetReps ? `${s.targetWeight}kg x ${s.targetReps}` : '-',
            kg: s.targetWeight?.toString() || '',
            reps: s.targetReps?.toString() || '',
            completed: false,
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
        const newWorkout: ScheduledWorkout = {
          ...workout,
          id: generateId(),
          createdAt: new Date().toISOString(),
          completedDates: [],
        };
        set((state) => ({
          scheduledWorkouts: [...state.scheduledWorkouts, newWorkout],
        }));
      },

      removeWorkout: (id) => {
        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.filter((w) => w.id !== id),
        }));
      },

      // Remove a single occurrence from a recurring workout by adding to excludedDates
      // For non-recurring workouts, this just removes the whole workout
      removeWorkoutOccurrence: (id, dateKey) => {
        const workout = get().scheduledWorkouts.find((w) => w.id === id);
        if (!workout) return;

        // If it's a non-recurring workout or it's the original date, just delete the whole workout
        if (workout.repeat.type === 'never' || workout.date === dateKey) {
          set((state) => ({
            scheduledWorkouts: state.scheduledWorkouts.filter((w) => w.id !== id),
          }));
        } else {
          // For recurring workouts, add this date to excludedDates
          set((state) => ({
            scheduledWorkouts: state.scheduledWorkouts.map((w) => {
              if (w.id !== id) return w;
              const excludedDates = w.excludedDates || [];
              if (excludedDates.includes(dateKey)) return w;
              return {
                ...w,
                excludedDates: [...excludedDates, dateKey],
              };
            }),
          }));
        }
      },

      getScheduledWorkoutById: (id) => {
        return get().scheduledWorkouts.find((w) => w.id === id);
      },

      clearAllScheduledWorkouts: () => {
        set({ scheduledWorkouts: [] });
      },

      toggleWorkoutCompletion: (workoutId, dateKey) => {
        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.map((workout) => {
            if (workout.id !== workoutId) return workout;

            const isCompleted = workout.completedDates.includes(dateKey);
            return {
              ...workout,
              completedDates: isCompleted
                ? workout.completedDates.filter((d) => d !== dateKey)
                : [...workout.completedDates, dateKey],
            };
          }),
        }));
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
          set((state) => ({
            scheduledWorkouts: state.scheduledWorkouts.map((workout) => {
              if (workout.id !== matchedWorkout!.id) return workout;
              return {
                ...workout,
                completedDates: [...workout.completedDates, dateKey],
              };
            }),
          }));
        }
      },

      // Cached completed workouts methods
      setCachedCompletedWorkouts: (workouts) => {
        set({
          cachedCompletedWorkouts: workouts,
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
    }
  )
);
