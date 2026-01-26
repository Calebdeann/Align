import { supabase } from '../supabase';
import {
  UpdateProfileSchema,
  UserPreferencesSchema,
  OnboardingDataSchema,
} from '@/schemas/user.schema';

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
  training_location?: string;
  preferred_equipment?: string[];
  workout_frequency?: number;
  workout_days?: string[];
  main_obstacle?: string;
  accomplish?: string;
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
    console.error('Error fetching user profile:', error);
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
    console.error('Error creating profile:', error);
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
    console.error('Invalid profile update input:', parseResult.error.flatten());
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
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
    console.error('Invalid preferences input:', parseResult.error.flatten());
    return false;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ ...preferences, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user preferences:', error);
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
    console.error('Invalid onboarding data input:', parseResult.error.flatten());
    return false;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ ...onboardingData, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error saving onboarding data:', error);
    return false;
  }

  return true;
}

// Delete user account
export async function deleteUserAccount(userId: string): Promise<boolean> {
  // This will also trigger cascade deletes for related data if set up in Supabase
  const { error } = await supabase.from('profiles').delete().eq('id', userId);

  if (error) {
    console.error('Error deleting user account:', error);
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
      console.error('Error getting current user:', error);
    }
    return null;
  }

  return user;
}

// Sign out
export async function signOut(): Promise<boolean> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    return false;
  }

  return true;
}
