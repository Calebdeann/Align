import { create } from 'zustand';

interface OnboardingState {
  currentWeight: number;
  targetWeight: number;
  unit: 'kg' | 'lb';
  weeklyGoal: number; // kg per week
  setCurrentWeight: (weight: number) => void;
  setTargetWeight: (weight: number) => void;
  setUnit: (unit: 'kg' | 'lb') => void;
  setWeeklyGoal: (goal: number) => void;
  getWeightDifference: () => number;
  isLosingWeight: () => boolean;
  getGoalDifficulty: () => 'moderate' | 'challenging' | 'difficult';
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentWeight: 132.3,
  targetWeight: 132.3,
  unit: 'lb',
  weeklyGoal: 0.8,

  setCurrentWeight: (weight) => set({ currentWeight: weight }),
  setTargetWeight: (weight) => set({ targetWeight: weight }),
  setUnit: (unit) => set({ unit }),
  setWeeklyGoal: (goal) => set({ weeklyGoal: goal }),

  getWeightDifference: () => {
    const { currentWeight, targetWeight } = get();
    return Math.abs(targetWeight - currentWeight);
  },

  isLosingWeight: () => {
    const { currentWeight, targetWeight } = get();
    return targetWeight < currentWeight;
  },

  getGoalDifficulty: () => {
    const { currentWeight, targetWeight, unit } = get();
    const diff = Math.abs(targetWeight - currentWeight);
    // Convert to percentage of body weight
    const percentChange = (diff / currentWeight) * 100;

    // Thresholds (roughly):
    // < 10% = moderate
    // 10-20% = challenging
    // > 20% = difficult
    if (percentChange < 10) return 'moderate';
    if (percentChange < 20) return 'challenging';
    return 'difficult';
  },
}));
