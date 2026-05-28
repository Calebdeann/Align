// Workout categorisation used by program data (Hourglass, future plans).
// Drives the placeholder colour on the planner and workout-preview hero card.
export type WorkoutType = 'lower' | 'upper' | 'full-body' | 'recovery' | 'abs' | 'cardio';

export interface ProgramExercise {
  name: string;
  sets: number;
  reps: string;
  notes?: string;
  // Two exercises in the same workout sharing this number form a superset.
  // Per-workout numbering (1, 2, ...) — workouts typically have at most 1-2.
  supersetGroup?: number;
}

export interface ProgramWorkout {
  id: string;
  week: number;
  dayInWeek: number;
  type: WorkoutType;
  title: string;
  exercises: ProgramExercise[];
  freeText?: string;
  description?: string;
}

export interface ProgramDay {
  week: number;
  dayInWeek: number;
  workouts: ProgramWorkout[];
}

export interface Program {
  id: string;
  planId: string;
  durationWeeks: number;
  daysPerWeek: number;
  defaultWeekdays: number[];
  days: ProgramDay[];
}

export const WORKOUT_TYPE_COLORS: Record<WorkoutType, string> = {
  lower: '#FFB6C1',
  upper: '#C8B6FF',
  'full-body': '#B6E0FF',
  recovery: '#B6FFD9',
  abs: '#FFE08A',
  cardio: '#FFA585',
};
