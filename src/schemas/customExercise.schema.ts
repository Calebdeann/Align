import { z } from 'zod';
import { UuidSchema } from './common.schema';

export const CreateCustomExerciseSchema = z.object({
  userId: UuidSchema,
  name: z.string().min(1, 'Exercise name is required').max(200).trim(),
  equipment: z.string().min(1).max(50),
  primaryMuscle: z.string().min(1, 'Primary muscle group is required').max(50),
  secondaryMuscles: z.array(z.string().max(50)).max(10).default([]),
  imageUrl: z.string().url().nullable().optional(),
});

export type CreateCustomExerciseInput = z.infer<typeof CreateCustomExerciseSchema>;
