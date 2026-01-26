import { z } from 'zod';

// Common validation patterns used across schemas

// UUID validation
export const UuidSchema = z.string().uuid();

// Non-empty string
export const NonEmptyStringSchema = z.string().min(1);

// Positive integer
export const PositiveIntSchema = z.number().int().positive();

// Non-negative number (for weights, reps, etc.)
export const NonNegativeNumberSchema = z.number().min(0);

// Duration in seconds (max 24 hours)
export const DurationSecondsSchema = z.number().int().min(0).max(86400);

// Rest timer (0-10 minutes)
export const RestTimerSchema = z.number().int().min(0).max(600).default(90);

// Weight in kg (0-1000kg reasonable max)
export const WeightKgSchema = z.number().min(0).max(1000).nullable();

// Reps count (0-1000 reasonable max)
export const RepsSchema = z.number().int().min(0).max(1000).nullable();

// Date schema that accepts Date objects or ISO strings
export const DateSchema = z.union([
  z.date(),
  z
    .string()
    .datetime()
    .transform((str) => new Date(str)),
]);

// Common difficulty levels
export const DifficultySchema = z.enum(['Beginner', 'Intermediate', 'Advanced']);

// Units preference
export const UnitsSchema = z.enum(['metric', 'imperial']);
