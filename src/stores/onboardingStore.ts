import { create } from 'zustand';
import {
  saveOnboardingField,
  linkOnboardingToUser,
  saveSkippedField,
} from '@/services/api/onboarding';
import { clearAnonymousSession } from '@/services/anonymousSession';

// Simple retry helper for save operations
async function saveWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      if (attempt === maxRetries) {
        console.error(`Failed after ${maxRetries} attempts:`, err);
        return null;
      }
      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  return null;
}

// All onboarding data fields
// NOTE: All weights (currentWeight, targetWeight) are stored in kg
// Height is stored in inches
export interface OnboardingData {
  experienceLevel: string | null;
  mainGoal: string | null;
  otherGoals: string[];
  referralSource: string | null;
  age: number | null;
  heightInches: number | null;
  currentWeight: number; // Always stored in kg
  targetWeight: number; // Always stored in kg
  unit: 'kg' | 'lb'; // User's display preference (for legacy compatibility)
  weeklyGoal: number;
  trainingLocation: string | null;
  equipment: string[];
  workoutFrequency: string | null;
  workoutDays: string[];
  mainObstacle: string | null;
  accomplish: string | null;
  notificationsEnabled: boolean;
  reminderTime: string | null;
}

interface OnboardingState extends OnboardingData {
  // Individual setters (for local state without saving)
  setExperienceLevel: (level: string) => void;
  setMainGoal: (goal: string) => void;
  setOtherGoals: (goals: string[]) => void;
  setReferralSource: (source: string) => void;
  setAge: (age: number) => void;
  setHeightInches: (height: number) => void;
  setCurrentWeight: (weight: number) => void;
  setTargetWeight: (weight: number) => void;
  setUnit: (unit: 'kg' | 'lb') => void;
  setWeeklyGoal: (goal: number) => void;
  setTrainingLocation: (location: string) => void;
  setEquipment: (equipment: string[]) => void;
  setWorkoutFrequency: (frequency: string) => void;
  setWorkoutDays: (days: string[]) => void;
  setMainObstacle: (obstacle: string) => void;
  setAccomplish: (accomplish: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setReminderTime: (time: string) => void;

  // Save a field to both store and Supabase
  setAndSave: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => Promise<void>;

  // Link anonymous session to authenticated user
  linkToUser: (userId: string) => Promise<boolean>;

  // Track when a field is skipped
  skipField: (field: keyof OnboardingData) => Promise<void>;

  // Helper functions
  getWeightDifference: () => number;
  isLosingWeight: () => boolean;
  getGoalDifficulty: () => 'moderate' | 'challenging' | 'difficult';

  // Reset store
  reset: () => void;
}

const initialState: OnboardingData = {
  experienceLevel: null,
  mainGoal: null,
  otherGoals: [],
  referralSource: null,
  age: null,
  heightInches: null,
  currentWeight: 0, // Will be set by weight screen (in kg)
  targetWeight: 0, // Will be set by target-weight screen (in kg)
  unit: 'lb', // Default, will be overridden by userPreferencesStore
  weeklyGoal: 0.8,
  trainingLocation: null,
  equipment: [],
  workoutFrequency: null,
  workoutDays: [],
  mainObstacle: null,
  accomplish: null,
  notificationsEnabled: false,
  reminderTime: null,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialState,

  // Individual setters
  setExperienceLevel: (level) => set({ experienceLevel: level }),
  setMainGoal: (goal) => set({ mainGoal: goal }),
  setOtherGoals: (goals) => set({ otherGoals: goals }),
  setReferralSource: (source) => set({ referralSource: source }),
  setAge: (age) => set({ age }),
  setHeightInches: (height) => set({ heightInches: height }),
  setCurrentWeight: (weight) => set({ currentWeight: weight }),
  setTargetWeight: (weight) => set({ targetWeight: weight }),
  setUnit: (unit) => set({ unit }),
  setWeeklyGoal: (goal) => set({ weeklyGoal: goal }),
  setTrainingLocation: (location) => set({ trainingLocation: location }),
  setEquipment: (equipment) => set({ equipment }),
  setWorkoutFrequency: (frequency) => set({ workoutFrequency: frequency }),
  setWorkoutDays: (days) => set({ workoutDays: days }),
  setMainObstacle: (obstacle) => set({ mainObstacle: obstacle }),
  setAccomplish: (accomplish) => set({ accomplish }),
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  setReminderTime: (time) => set({ reminderTime: time }),

  // Save to both store and Supabase
  setAndSave: async (field, value) => {
    // Update local state
    set({ [field]: value } as Partial<OnboardingData>);

    // Save to Supabase with retry (don't block UI, but retry on failure)
    saveWithRetry(() => saveOnboardingField(field, value));
  },

  // Link to authenticated user
  linkToUser: async (userId: string) => {
    return linkOnboardingToUser(userId);
  },

  // Track when a field is skipped
  skipField: async (field) => {
    // Save with retry (don't block UI)
    saveWithRetry(() => saveSkippedField(field));
  },

  // Helper functions
  getWeightDifference: () => {
    const { currentWeight, targetWeight } = get();
    return Math.abs(targetWeight - currentWeight);
  },

  isLosingWeight: () => {
    const { currentWeight, targetWeight } = get();
    return targetWeight < currentWeight;
  },

  getGoalDifficulty: () => {
    const { currentWeight, targetWeight } = get();
    const diff = Math.abs(targetWeight - currentWeight);
    const percentChange = (diff / currentWeight) * 100;

    if (percentChange < 10) return 'moderate';
    if (percentChange < 20) return 'challenging';
    return 'difficult';
  },

  // Reset to initial state and clear anonymous session
  reset: () => {
    set(initialState);
    // Also clear the anonymous session from SecureStore
    clearAnonymousSession().catch((err) => {
      console.error('Failed to clear anonymous session:', err);
    });
  },
}));
