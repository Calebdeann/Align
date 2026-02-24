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
  rpe: z.number().min(6).max(10).nullable().optional(),
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

// Image type for workout/template photos
export const ImageTypeSchema = z.enum(['template', 'camera', 'gallery']);

// Complete workout save input
export const SaveWorkoutInputSchema = z.object({
  userId: UuidSchema,
  name: z.string().max(200).optional(),
  startedAt: DateSchema,
  completedAt: DateSchema,
  durationSeconds: DurationSecondsSchema,
  notes: z.string().max(2000).optional(),
  sourceTemplateId: NonEmptyStringSchema.optional(),
  imageType: ImageTypeSchema.optional(),
  imageUri: z.string().max(2000).optional(),
  imageTemplateId: z.string().max(200).optional(),
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
