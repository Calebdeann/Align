import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

export interface ActiveExercise {
  id: string;
  name: string;
  muscle: string;
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
}

export interface ScheduledWorkout {
  id: string;
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
  templateId?: string; // Optional link to a workout template
}

interface WorkoutStore {
  // Scheduled workouts
  scheduledWorkouts: ScheduledWorkout[];
  addWorkout: (workout: Omit<ScheduledWorkout, 'id' | 'createdAt' | 'completedDates'>) => void;
  removeWorkout: (id: string) => void;
  toggleWorkoutCompletion: (workoutId: string, dateKey: string) => void;
  isWorkoutCompleted: (workoutId: string, dateKey: string) => boolean;
  getWorkoutsForDate: (date: string) => ScheduledWorkout[];
  getWorkoutsForMonth: (year: number, month: number) => Map<number, ScheduledWorkout[]>;
  // Auto-mark scheduled workouts as complete when a workout is saved
  markScheduledWorkoutComplete: (
    dateKey: string,
    templateId?: string,
    workoutName?: string
  ) => void;

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

      getWorkoutsForDate: (dateKey) => {
        const { scheduledWorkouts } = get();
        const checkDate = new Date(dateKey);
        return scheduledWorkouts.filter((workout) => workoutOccursOnDate(workout, checkDate));
      },

      getWorkoutsForMonth: (year, month) => {
        const { scheduledWorkouts } = get();
        const workoutsByDay = new Map<number, ScheduledWorkout[]>();

        // Get number of days in the month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Check each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
          const checkDate = new Date(year, month, day);
          const workoutsForDay = scheduledWorkouts.filter((workout) =>
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
      markScheduledWorkoutComplete: (dateKey, templateId, workoutName) => {
        const { scheduledWorkouts } = get();
        const checkDate = new Date(dateKey);

        // Find workouts scheduled for this date
        const workoutsForDate = scheduledWorkouts.filter((w) => workoutOccursOnDate(w, checkDate));

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
    }),
    {
      name: 'workout-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist scheduled workouts and active workout, not transient pendingExercises
      partialize: (state) => ({
        scheduledWorkouts: state.scheduledWorkouts,
        activeWorkout: state.activeWorkout,
      }),
    }
  )
);
