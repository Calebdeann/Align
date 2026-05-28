import { create } from 'zustand';
import Constants from 'expo-constants';
import { supabase } from '@/services/supabase';
import type { PlacedTrait } from '@/constants/traits';

// Get app version from expo config
const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';

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
  name?: string;
  avatar_url?: string;
  bio?: string;
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
  // Per-user override of which program day runs on which weekday. Keys are
  // weekday names ("Monday", "Tuesday", ...); values are 1-indexed
  // ProgramDay.dayNumber values. NULL/undefined = positional fallback.
  workout_day_assignments?: Record<string, number> | null;
  main_obstacle?: string;
  notifications_enabled?: boolean;
  reminder_time?: string;
  referral_code?: string;
  referred_by?: string;
  app_version?: string;
  last_active_at?: string;
  created_at?: string;
  updated_at?: string;
  traits?: PlacedTrait[];
  plan_id?: string;
}

interface UserProfileState {
  profile: UserProfile | null;
  userId: string | null;
  isLoading: boolean;
  lastFetchedAt: number | null;
  // In-memory override for the current user's avatar — set right after a
  // successful upload to the picker's local file:// URI. Lets every screen
  // showing the user's own avatar render the new photo immediately for the
  // rest of the session, without depending on the DB URL loading correctly.
  // Cleared on sign-out via clearProfile().
  sessionAvatarUri: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>; // Force refresh, ignore cache
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  saveTraits: (traits: PlacedTrait[]) => Promise<boolean>;
  clearProfile: () => void;
  setProfile: (profile: UserProfile | null) => void;
  invalidateCache: () => void; // Invalidate cache so next fetch is fresh
  setSessionAvatarUri: (uri: string | null) => void;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  profile: null,
  userId: null,
  isLoading: false,
  lastFetchedAt: null,
  sessionAvatarUri: null,

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
          // Use upsert with ignoreDuplicates to handle races: if another concurrent call
          // already created the profile, we preserve its existing data (weight, height,
          // custom avatar_url, etc.) rather than overwriting with OAuth defaults.
          const { data: newProfile } = await supabase
            .from('profiles')
            .upsert(
              {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
              },
              { onConflict: 'id', ignoreDuplicates: true }
            )
            .select()
            .single();

          if (newProfile) {
            // Fresh insert succeeded — use the returned row
            set({ profile: newProfile, isLoading: false, lastFetchedAt: Date.now() });
            return;
          }

          // upsert was a no-op (row already existed) — fetch the existing profile so
          // we don't lose any data the user previously saved (weight, height, avatar, etc.)
          const { data: existingProfile, error: refetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!refetchError && existingProfile) {
            set({ profile: existingProfile, isLoading: false, lastFetchedAt: Date.now() });
            return;
          }

          // Profile doesn't exist and couldn't be created — expected for sign-in screens
          // where the user doesn't have an account yet
          set({ isLoading: false, lastFetchedAt: null });
          return;
        }
        console.warn('Error fetching profile:', error);
        set({ isLoading: false, lastFetchedAt: null });
        return;
      }

      set({ profile: data, isLoading: false, lastFetchedAt: Date.now() });

      // Silently update app version, last active timestamp, and plan_id default
      const silentUpdates: Record<string, unknown> = { last_active_at: new Date().toISOString() };
      const localUpdates: Record<string, unknown> = { last_active_at: new Date().toISOString() };

      if (data.app_version !== APP_VERSION) {
        silentUpdates.app_version = APP_VERSION;
        localUpdates.app_version = APP_VERSION;
      }

      if (!data.plan_id) {
        silentUpdates.plan_id = 'summer-body';
        localUpdates.plan_id = 'summer-body';
      }

      supabase
        .from('profiles')
        .update(silentUpdates)
        .eq('id', user.id)
        .then(({ error: updateError }) => {
          if (!updateError) {
            set((state) => ({
              profile: state.profile ? { ...state.profile, ...localUpdates } : null,
            }));
          }
        })
        // Swallow network errors silently — this is a best-effort background sync
        // (app_version / last_active_at / plan_id default). An unhandled rejection
        // here would surface as a generic "Network request failed" console error.
        .then(undefined, () => {});
    } catch (error) {
      console.warn('Error in fetchProfile:', error);
      set({ isLoading: false, lastFetchedAt: null });
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

    const updatedAt = new Date().toISOString();

    try {
      let { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: updatedAt })
        .eq('id', userId)
        .select()
        .single();

      // Backwards-compat: if a NEW column (e.g. workout_day_assignments from
      // migration 083) hasn't been applied on the server yet, the write fails
      // with PGRST204 / 42xxx. Strip the optional new column(s) and retry so
      // the core profile save still succeeds — per backend-rules Rule 3.
      const isSchemaErr =
        !!error &&
        (error.code === 'PGRST204' ||
          error.code === 'PGRST301' ||
          (typeof error.code === 'string' && error.code.startsWith('42')));
      if (isSchemaErr && 'workout_day_assignments' in updates) {
        console.warn(
          'updateProfile: workout_day_assignments column missing (migration 083 not applied). Retrying without it.'
        );
        const { workout_day_assignments: _omit, ...baseUpdates } = updates;
        const retry = await supabase
          .from('profiles')
          .update({ ...baseUpdates, updated_at: updatedAt })
          .eq('id', userId)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('Error updating profile:', error);
        return false;
      }

      // Merge updates into existing profile rather than trusting Supabase's
      // .select() response blindly — column-level RLS or row-level filters can
      // mask returned fields. The values we sent are authoritative for what was
      // just written, so merge them on top of whatever came back.
      set((state) => ({
        profile: {
          ...(state.profile ?? {}),
          ...(data ?? {}),
          ...updates,
          updated_at: updatedAt,
        } as UserProfile,
        lastFetchedAt: Date.now(),
      }));
      return true;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return false;
    }
  },

  saveTraits: async (traits) => {
    const { userId } = get();
    if (!userId) return false;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ traits, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error?.code === 'PGRST204') return true; // column not yet migrated
      if (error) {
        console.error('Error saving traits:', error);
        return false;
      }

      set((state) => ({
        profile: state.profile ? { ...state.profile, traits } : null,
        lastFetchedAt: Date.now(),
      }));
      return true;
    } catch {
      return false;
    }
  },

  clearProfile: () => {
    set({ profile: null, userId: null, lastFetchedAt: null, sessionAvatarUri: null });
  },

  setSessionAvatarUri: (uri) => {
    set({ sessionAvatarUri: uri });
  },

  setProfile: (profile) => {
    set({ profile, lastFetchedAt: Date.now() });
  },

  // Invalidate cache so next fetchProfile will actually fetch
  invalidateCache: () => {
    set({ lastFetchedAt: null });
  },
}));
