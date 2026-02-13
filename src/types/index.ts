/**
 * Shared TypeScript types for Align
 *
 * Add types here that are used across multiple files.
 * Feature-specific types can go in their own files (e.g., workout.ts, schedule.ts)
 */

// User profile type
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
  onboardingCompleted: boolean;
}

// Workout type colors (matches theme.ts workout colors)
export type WorkoutType =
  | 'back'
  | 'biceps'
  | 'calves'
  | 'cardio'
  | 'chest'
  | 'core'
  | 'glutes'
  | 'legs'
  | 'other'
  | 'shoulders'
  | 'triceps'
  | 'fullBody'
  | 'rest';

// Basic exercise type
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: WorkoutType;
  equipment?: string;
  instructions?: string;
}

// Workout template (preset workouts)
export interface WorkoutTemplate {
  id: string;
  name: string;
  type: WorkoutType;
  exercises: Exercise[];
  isAlignTemplate: boolean; // true = made by Align, false = user-created
  createdBy?: string; // user ID if user-created
}

// Scheduled workout entry
export interface ScheduledWorkout {
  id: string;
  userId: string;
  templateId: string;
  date: string; // ISO date string
  time?: string; // HH:mm format
  isRecurring: boolean;
  recurringDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  completed: boolean;
}

// Workout session (active or completed workout log)
export interface WorkoutSession {
  id: string;
  userId: string;
  templateId?: string;
  startedAt: string;
  completedAt?: string;
  exercises: SessionExercise[];
}

// Individual exercise in a session
export interface SessionExercise {
  exerciseId: string;
  sets: ExerciseSet[];
}

// Single set data
export interface ExerciseSet {
  setNumber: number;
  reps?: number;
  weight?: number;
  restTime?: number; // in seconds
  notes?: string;
  completed: boolean;
}
