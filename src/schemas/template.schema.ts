import { z } from 'zod';
import {
  UuidSchema,
  NonEmptyStringSchema,
  RestTimerSchema,
  DifficultySchema,
  WeightKgSchema,
  RepsSchema,
} from './common.schema';

// Template image types
export const ImageTypeSchema = z.enum(['template', 'camera', 'gallery']);

// Template image
export const WorkoutImageSchema = z.object({
  type: ImageTypeSchema,
  uri: z.string().min(1),
  templateId: z.string().optional(),
});

// Template set (target values for a set)
export const TemplateSetInputSchema = z.object({
  setNumber: z.number().int().min(1).max(50),
  targetWeight: WeightKgSchema.optional(),
  targetReps: RepsSchema.optional(),
});

// Template exercise
export const TemplateExerciseInputSchema = z.object({
  exerciseId: NonEmptyStringSchema,
  exerciseName: z.string().min(1).max(200),
  muscle: z.string().min(1).max(100),
  notes: z.string().max(1000).optional(),
  restTimerSeconds: RestTimerSchema,
  sets: z.array(TemplateSetInputSchema).min(1).max(50),
});

// Create template input
export const CreateTemplateInputSchema = z.object({
  userId: UuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  image: WorkoutImageSchema.optional(),
  tagIds: z.array(z.string()).default([]),
  tagColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#947AFF'),
  estimatedDuration: z.number().int().min(1).max(480).default(60), // 1-480 minutes
  difficulty: DifficultySchema.default('Beginner'),
  equipment: z.string().max(100).default('Gym'),
  exercises: z.array(TemplateExerciseInputSchema).min(1).max(100),
});

// Update template input (all fields optional except what's being changed)
export const UpdateTemplateInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  image: WorkoutImageSchema.optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  tagColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  estimatedDuration: z.number().int().min(1).max(480).optional(),
  difficulty: DifficultySchema.optional(),
  equipment: z.string().max(100).optional(),
  exercises: z.array(TemplateExerciseInputSchema).optional(),
});

// Type exports
export type ImageType = z.infer<typeof ImageTypeSchema>;
export type WorkoutImage = z.infer<typeof WorkoutImageSchema>;
export type TemplateSetInput = z.infer<typeof TemplateSetInputSchema>;
export type TemplateExerciseInput = z.infer<typeof TemplateExerciseInputSchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateInputSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateInputSchema>;
