import { z } from 'zod';
import { UuidSchema, UnitsSchema } from './common.schema';

// User profile update schema
export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional(),
  // Onboarding data
  experience_level: z.string().max(50).optional(),
  main_goal: z.string().max(100).optional(),
  goals: z.array(z.string().max(100)).optional(),
  referral_source: z.string().max(100).optional(),
  age: z.number().int().min(13).max(120).optional(),
  height: z.number().min(50).max(300).optional(), // cm
  weight: z.number().min(20).max(500).optional(), // kg
  target_weight: z.number().min(20).max(500).optional(),
  units: UnitsSchema.optional(),
  training_location: z.string().max(100).optional(),
  preferred_equipment: z.array(z.string().max(100)).optional(),
  workout_frequency: z.number().int().min(1).max(7).optional(),
  workout_days: z.array(z.string()).optional(),
  main_obstacle: z.string().max(200).optional(),
  accomplish: z.string().max(500).optional(),
  notifications_enabled: z.boolean().optional(),
  reminder_time: z.string().max(10).optional(), // "HH:MM" format
});

// User preferences schema
export const UserPreferencesSchema = z.object({
  units: UnitsSchema.optional(),
  notifications_enabled: z.boolean().optional(),
  rest_timer_default: z.number().int().min(0).max(600).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

// Onboarding data schema (subset of profile for onboarding flow)
export const OnboardingDataSchema = z.object({
  experience_level: z.string().max(50).optional(),
  main_goal: z.string().max(100).optional(),
  goals: z.array(z.string().max(100)).optional(),
  referral_source: z.string().max(100).optional(),
  age: z.number().int().min(13).max(120).optional(),
  height: z.number().min(50).max(300).optional(),
  weight: z.number().min(20).max(500).optional(),
  target_weight: z.number().min(20).max(500).optional(),
  units: UnitsSchema.optional(),
  training_location: z.string().max(100).optional(),
  preferred_equipment: z.array(z.string().max(100)).optional(),
  workout_frequency: z.number().int().min(1).max(7).optional(),
  workout_days: z.array(z.string()).optional(),
  main_obstacle: z.string().max(200).optional(),
  accomplish: z.string().max(500).optional(),
  notifications_enabled: z.boolean().optional(),
  reminder_time: z.string().max(10).optional(),
});

// Type exports
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type OnboardingData = z.infer<typeof OnboardingDataSchema>;
