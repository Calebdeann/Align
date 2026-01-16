import { create } from 'zustand';

export interface ScheduledWorkout {
  id: string;
  name: string;
  description?: string;
  tagId: string | null;
  tagColor: string;
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
}

interface WorkoutStore {
  scheduledWorkouts: ScheduledWorkout[];
  addWorkout: (workout: Omit<ScheduledWorkout, 'id' | 'createdAt'>) => void;
  removeWorkout: (id: string) => void;
  getWorkoutsForDate: (date: string) => ScheduledWorkout[];
  getWorkoutsForMonth: (year: number, month: number) => Map<number, ScheduledWorkout[]>;
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

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  scheduledWorkouts: [],

  addWorkout: (workout) => {
    const newWorkout: ScheduledWorkout = {
      ...workout,
      id: generateId(),
      createdAt: new Date().toISOString(),
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
}));
