import { supabase } from '../supabase';
import {
  UpdateProfileSchema,
  UserPreferencesSchema,
  OnboardingDataSchema,
} from '@/schemas/user.schema';
import { logger } from '@/utils/logger';

export interface UserProfile {
  id: string;
  email?: string;
  name?: string; // Display name (unique)
  avatar_url?: string;
  // Onboarding data
  experience_level?: string;
  main_goal?: string;
  goals?: string[];
  referral_source?: string;
  age?: number;
  height?: number;
  weight?: number;
  target_weight?: number;
  units?: 'imperial' | 'metric';
  tried_other_apps?: string;
  body_change_goal?: string;
  training_location?: string;
  workout_frequency?: number;
  workout_days?: string[];
  main_obstacle?: string;
  notifications_enabled?: boolean;
  reminder_time?: string;
  referral_code?: string;
  referred_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  units?: 'metric' | 'imperial';
  notifications_enabled?: boolean;
  rest_timer_default?: number;
  theme?: 'light' | 'dark' | 'system';
}

// Get user profile - creates one if it doesn't exist
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (error) {
    // If profile doesn't exist (PGRST116 = no rows), try to create it
    if (error.code === 'PGRST116') {
      const created = await createProfileIfMissing(userId);
      return created;
    }
    logger.warn('Error fetching user profile', { error });
    return null;
  }

  return data;
}

// Create profile for user if it doesn't exist (fallback for trigger failures)
async function createProfileIfMissing(userId: string): Promise<UserProfile | null> {
  // Get user info from auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: user.email,
      name: null, // Name will be set in onboarding
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    })
    .select()
    .single();

  if (error) {
    logger.warn('Error creating profile', { error });
    return null;
  }

  return data;
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  // Validate updates
  const parseResult = UpdateProfileSchema.safeParse(updates);
  if (!parseResult.success) {
    logger.warn('Invalid profile update input', { error: parseResult.error.flatten() });
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    logger.warn('Error updating user profile', { error });
    return null;
  }

  return data;
}

// Update user preferences
export async function updateUserPreferences(
  userId: string,
  preferences: UserPreferences
): Promise<boolean> {
  // Validate preferences
  const parseResult = UserPreferencesSchema.safeParse(preferences);
  if (!parseResult.success) {
    logger.warn('Invalid preferences input', { error: parseResult.error.flatten() });
    return false;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ ...preferences, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    logger.warn('Error updating user preferences', { error });
    return false;
  }

  return true;
}

// Save onboarding data
export async function saveOnboardingData(
  userId: string,
  onboardingData: Partial<UserProfile>
): Promise<boolean> {
  // Validate onboarding data
  const parseResult = OnboardingDataSchema.safeParse(onboardingData);
  if (!parseResult.success) {
    logger.warn('Invalid onboarding data input', { error: parseResult.error.flatten() });
    return false;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ ...onboardingData, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    logger.warn('Error saving onboarding data', { error });
    return false;
  }

  return true;
}

// Upload avatar image to Supabase Storage and return the public URL
export async function uploadAvatar(userId: string, imageUri: string): Promise<string | null> {
  try {
    // Fetch the image as a blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Validate file size (max 5MB)
    const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
    if (blob.size > MAX_AVATAR_SIZE) {
      logger.warn('Avatar too large', { size: blob.size });
      return null;
    }

    // Validate content type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (blob.type && !validImageTypes.includes(blob.type)) {
      logger.warn('Invalid avatar type', { type: blob.type });
      return null;
    }

    const filePath = `${userId}/avatar.jpg`;

    // Upload to Supabase Storage (upsert to replace existing)
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    if (uploadError) {
      logger.warn('Error uploading avatar', { error: uploadError });
      return null;
    }

    // Get the public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

    // Append cache-buster so the new image loads immediately
    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (error) {
    logger.warn('Error in uploadAvatar', { error });
    return null;
  }
}

// Delete user account (uses SECURITY DEFINER function to delete auth user + all data)
export async function deleteUserAccount(): Promise<boolean> {
  const { error } = await supabase.rpc('delete_own_account');

  if (error) {
    logger.warn('Error deleting user account', { error });
    return false;
  }

  return true;
}

// Get current authenticated user
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    // Don't log "Auth session missing" - this is expected when user isn't logged in
    if (error.name !== 'AuthSessionMissingError') {
      logger.warn('Error getting current user', { error });
    }
    return null;
  }

  return user;
}

// Sign out
export async function signOut(): Promise<boolean> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    logger.warn('Error signing out', { error });
    return false;
  }

  return true;
}
