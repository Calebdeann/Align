import { z } from 'zod';
import { UuidSchema, UnitsSchema } from './common.schema';

// User profile update schema
export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional(),
  // It Girl onboarding answers
  traffic_source: z.string().max(100).optional(),
  achieve_goals: z.array(z.string().max(100)).max(10).optional(),
  ideal_day: z.string().max(50).optional(),
  challenges: z.array(z.string().max(100)).max(10).optional(),
  workout_days: z.array(z.string()).optional(),
  // Per-weekday → 1-indexed program-day mapping. null clears the override
  // and reverts to positional seeding. See migration 083.
  workout_day_assignments: z
    .record(z.string(), z.number().int().min(1).max(7))
    .nullable()
    .optional(),
  program_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'program_start_date must be YYYY-MM-DD')
    .optional(),
  // Body / preferences
  age: z.number().int().min(13).max(120).optional(),
  height: z.number().min(50).max(300).optional(), // inches or cm depending on user unit
  weight: z.number().min(20).max(500).optional(), // kg
  target_weight: z.number().min(20).max(500).optional(),
  notifications_enabled: z.boolean().optional(),
  reminder_time: z.string().max(10).optional(), // "HH:MM"
});

// User preferences schema
export const UserPreferencesSchema = z.object({
  units: UnitsSchema.optional(),
  notifications_enabled: z.boolean().optional(),
  rest_timer_default: z.number().int().min(0).max(600).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

// Onboarding data schema — validates the It Girl onboarding answers only.
// Body / preference fields live on `profiles` (set post-onboarding via personal-details)
// and are validated by UpdateProfileSchema instead.
export const OnboardingDataSchema = z.object({
  traffic_source: z.string().max(100).optional(),
  achieve_goals: z.array(z.string().max(100)).max(10).optional(),
  ideal_day: z.string().max(50).optional(),
  challenges: z.array(z.string().max(100)).max(10).optional(),
  workout_days: z.array(z.string()).optional(),
  program_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'program_start_date must be YYYY-MM-DD')
    .optional(),
});

// Referral code: 6 uppercase alphanumeric characters
export const ReferralCodeSchema = z
  .string()
  .min(6)
  .max(6)
  .regex(/^[A-Za-z0-9]{6}$/, 'Referral code must be 6 alphanumeric characters')
  .transform((val) => val.toUpperCase());

// Type exports
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type OnboardingData = z.infer<typeof OnboardingDataSchema>;
