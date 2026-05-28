import { create } from 'zustand';
import {
  saveOnboardingField,
  linkOnboardingToUser,
  saveSkippedField,
} from '@/services/api/onboarding';
import { clearAnonymousSession } from '@/services/anonymousSession';

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
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  return null;
}

// It Girl onboarding answers — every field corresponds to a screen in the current flow.
export interface OnboardingData {
  name: string | null;
  trafficSource: string | null;
  achieveGoals: string[];
  idealDay: string | null;
  challenges: string[];
  workoutDays: string[];
  selectedPlanId: string | null;
  matchedBuddyIndex: number | null;
  programStartDate: string | null; // YYYY-MM-DD
}

interface OnboardingState extends OnboardingData {
  setName: (name: string) => void;
  setTrafficSource: (source: string) => void;
  setAchieveGoals: (goals: string[]) => void;
  setIdealDay: (value: string) => void;
  setChallenges: (challenges: string[]) => void;
  setWorkoutDays: (days: string[]) => void;
  setSelectedPlanId: (id: string) => void;
  setProgramStartDate: (date: string) => void;

  setAndSave: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => Promise<void>;
  linkToUser: (userId: string) => Promise<boolean>;
  skipField: (field: keyof OnboardingData) => Promise<void>;

  reset: () => void;
}

const initialState: OnboardingData = {
  name: null,
  trafficSource: null,
  achieveGoals: [],
  idealDay: null,
  challenges: [],
  workoutDays: [],
  selectedPlanId: null,
  matchedBuddyIndex: null,
  programStartDate: null,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setName: (name) => set({ name }),
  setTrafficSource: (trafficSource) => set({ trafficSource }),
  setAchieveGoals: (achieveGoals) => set({ achieveGoals }),
  setIdealDay: (idealDay) => set({ idealDay }),
  setChallenges: (challenges) => set({ challenges }),
  setWorkoutDays: (workoutDays) => set({ workoutDays }),
  setSelectedPlanId: (selectedPlanId) => set({ selectedPlanId }),
  setProgramStartDate: (programStartDate) => set({ programStartDate }),

  setAndSave: async (field, value) => {
    set({ [field]: value } as Partial<OnboardingData>);
    const result = await saveWithRetry(() => saveOnboardingField(field, value));
    if (result === null) {
      console.warn(`Onboarding field '${field}' failed to save to Supabase after retries`);
    }
  },

  linkToUser: async (userId: string) => {
    return linkOnboardingToUser(userId);
  },

  skipField: async (field) => {
    const result = await saveWithRetry(() => saveSkippedField(field));
    if (result === null) {
      console.warn(`Onboarding field '${field}' failed to mark as skipped after retries`);
    }
  },

  reset: () => {
    set(initialState);
    clearAnonymousSession().catch((err) => {
      console.error('Failed to clear anonymous session:', err);
    });
  },
}));
