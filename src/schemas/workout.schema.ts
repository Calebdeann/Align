import { z } from 'zod';
import {
  UuidSchema,
  NonEmptyStringSchema,
  RestTimerSchema,
  WeightKgSchema,
  RepsSchema,
  DurationSecondsSchema,
  DateSchema,
} from './common.schema';

// Set types available in the app (matches database constraint)
export const SetTypeSchema = z.enum(['normal', 'warmup', 'failure', 'dropset']);

// Individual workout set
export const WorkoutSetInputSchema = z.object({
  setNumber: z.number().int().min(1).max(50),
  weightKg: WeightKgSchema,
  reps: RepsSchema,
  setType: SetTypeSchema.default('normal'),
  completed: z.boolean(),
});

// Exercise in a workout
export const WorkoutExerciseInputSchema = z.object({
  exerciseId: NonEmptyStringSchema,
  exerciseName: z.string().min(1).max(200),
  exerciseMuscle: z.string().max(100),
  notes: z.string().max(1000).default(''),
  supersetId: z.number().int().nullable(),
  restTimerSeconds: RestTimerSchema,
  sets: z.array(WorkoutSetInputSchema).min(1).max(50),
});

// Complete workout save input
export const SaveWorkoutInputSchema = z.object({
  userId: UuidSchema,
  name: z.string().max(200).optional(),
  startedAt: DateSchema,
  completedAt: DateSchema,
  durationSeconds: DurationSecondsSchema,
  notes: z.string().max(2000).optional(),
  sourceTemplateId: UuidSchema.optional(),
  exercises: z.array(WorkoutExerciseInputSchema).min(1).max(100),
});

// User exercise preference
export const UserExercisePreferenceSchema = z.object({
  userId: UuidSchema,
  exerciseId: NonEmptyStringSchema,
  restTimerSeconds: RestTimerSchema,
});

// Type exports (inferred from schemas)
export type SetType = z.infer<typeof SetTypeSchema>;
export type WorkoutSetInput = z.infer<typeof WorkoutSetInputSchema>;
export type WorkoutExerciseInput = z.infer<typeof WorkoutExerciseInputSchema>;
export type SaveWorkoutInput = z.infer<typeof SaveWorkoutInputSchema>;
export type UserExercisePreference = z.infer<typeof UserExercisePreferenceSchema>;
