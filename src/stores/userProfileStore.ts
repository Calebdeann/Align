import { create } from 'zustand';
import { supabase } from '@/services/supabase';

// Get high-resolution avatar URL (Google returns small images by default)
export function getHighResAvatarUrl(
  url: string | undefined | null,
  size: number = 400
): string | null {
  if (!url) return null;

  // Google profile pictures: replace size parameter
  // Format: https://lh3.googleusercontent.com/a/...=s96-c
  if (url.includes('googleusercontent.com')) {
    // Remove existing size param and add larger one
    return url.replace(/=s\d+-c/, `=s${size}-c`);
  }

  // For other providers (Apple, etc.), return as-is
  return url;
}

export interface UserProfile {
  id: string;
  email?: string;
  name?: string; // Display name (unique across users)
  avatar_url?: string;
  experience_level?: string;
  main_goal?: string;
  primary_goal?: string;
  goals?: string[];
  referral_source?: string;
  age?: number;
  date_of_birth?: string;
  height?: number;
  weight?: number;
  target_weight?: number;
  units?: 'imperial' | 'metric';
  weight_unit?: 'kg' | 'lbs';
  distance_unit?: 'kilometers' | 'miles';
  measurement_unit?: 'cm' | 'in';
  language?: string;
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
  created_at?: string;
  updated_at?: string;
}

interface UserProfileState {
  profile: UserProfile | null;
  userId: string | null;
  isLoading: boolean;
  lastFetchedAt: number | null;

  // Actions
  fetchProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>; // Force refresh, ignore cache
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  checkNameAvailable: (name: string) => Promise<boolean>;
  clearProfile: () => void;
  setProfile: (profile: UserProfile | null) => void;
  invalidateCache: () => void; // Invalidate cache so next fetch is fresh
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  profile: null,
  userId: null,
  isLoading: false,
  lastFetchedAt: null,

  fetchProfile: async () => {
    const { lastFetchedAt, isLoading } = get();

    // Skip if already loading
    if (isLoading) return;

    // Skip if cache is still valid
    if (lastFetchedAt && Date.now() - lastFetchedAt < CACHE_DURATION) {
      return;
    }

    set({ isLoading: true });

    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        set({ profile: null, userId: null, isLoading: false });
        return;
      }

      set({ userId: user.id });

      // Fetch profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            })
            .select()
            .single();

          if (!createError && newProfile) {
            set({ profile: newProfile, isLoading: false, lastFetchedAt: Date.now() });
            return;
          }
          // Profile doesn't exist and couldn't be created - expected for sign-in attempts without an account
          set({ isLoading: false });
          return;
        }
        console.error('Error fetching profile:', error);
        set({ isLoading: false });
        return;
      }

      set({ profile: data, isLoading: false, lastFetchedAt: Date.now() });
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      set({ isLoading: false });
    }
  },

  // Force refresh profile, ignoring cache
  refreshProfile: async () => {
    // Invalidate cache first
    set({ lastFetchedAt: null });
    // Then fetch
    await get().fetchProfile();
  },

  updateProfile: async (updates) => {
    const { userId } = get();

    if (!userId) return false;

    try {
      // If updating name, check if it's available first
      if (updates.name) {
        const isAvailable = await get().checkNameAvailable(updates.name);
        if (!isAvailable) {
          return false; // Name is taken
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return false;
      }

      // Update local state with new data
      set({ profile: data, lastFetchedAt: Date.now() });
      return true;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return false;
    }
  },

  checkNameAvailable: async (name: string) => {
    const { userId, profile } = get();
    const trimmedName = name.trim();

    if (!trimmedName) return false;

    // If the name is the same as the current user's name (case-insensitive), it's available
    if (profile?.name && profile.name.toLowerCase() === trimmedName.toLowerCase()) {
      return true;
    }

    // If we don't have a userId, we can't properly exclude our own record
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .ilike('name', trimmedName)
        .neq('id', userId)
        .limit(1);

      if (error) {
        console.error('Error checking name availability:', error);
        return false;
      }

      // Name is available if no results found
      return data.length === 0;
    } catch (error) {
      console.error('Error in checkNameAvailable:', error);
      return false;
    }
  },

  clearProfile: () => {
    set({ profile: null, userId: null, lastFetchedAt: null });
  },

  setProfile: (profile) => {
    set({ profile, lastFetchedAt: Date.now() });
  },

  // Invalidate cache so next fetchProfile will actually fetch
  invalidateCache: () => {
    set({ lastFetchedAt: null });
  },
}));
