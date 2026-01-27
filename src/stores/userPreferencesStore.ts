import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

export type WeightUnit = 'kg' | 'lbs';
export type DistanceUnit = 'kilometers' | 'miles';
export type MeasurementUnit = 'cm' | 'in';
export type UnitSystem = 'metric' | 'imperial';
export type TimerSoundId = 'chime' | 'bell' | 'ding';

// Countries that use imperial system (US, Liberia, Myanmar)
const IMPERIAL_COUNTRIES = ['US', 'LR', 'MM'];

interface UserPreferences {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  measurementUnit: MeasurementUnit;
  hasInitialized: boolean;

  // Workout settings
  defaultRestTimerSeconds: number;
  rpeTrackingEnabled: boolean;
  timerSoundId: TimerSoundId;
  vibrationEnabled: boolean;
}

interface UserPreferencesState extends UserPreferences {
  // Get the overall unit system
  getUnitSystem: () => UnitSystem;

  // Setters
  setWeightUnit: (unit: WeightUnit) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  setMeasurementUnit: (unit: MeasurementUnit) => void;

  // Workout settings setters
  setDefaultRestTimerSeconds: (seconds: number) => void;
  setRpeTrackingEnabled: (enabled: boolean) => void;
  setTimerSoundId: (soundId: TimerSoundId) => void;
  setVibrationEnabled: (enabled: boolean) => void;

  // Initialize based on device locale (only runs once)
  initializeFromLocale: () => void;

  // Sync from database (when user logs in)
  syncFromProfile: (profile: {
    weight_unit?: WeightUnit;
    distance_unit?: DistanceUnit;
    measurement_unit?: MeasurementUnit;
  }) => void;

  // Reset to defaults
  reset: () => void;
}

function detectUnitSystemFromLocale(): UnitSystem {
  try {
    const region = Localization.getLocales()[0]?.regionCode;
    if (region && IMPERIAL_COUNTRIES.includes(region)) {
      return 'imperial';
    }
  } catch (error) {
    console.warn('Failed to detect locale:', error);
  }
  return 'metric';
}

function getDefaultUnits(): Pick<
  UserPreferences,
  'weightUnit' | 'distanceUnit' | 'measurementUnit'
> {
  const system = detectUnitSystemFromLocale();
  if (system === 'imperial') {
    return {
      weightUnit: 'lbs',
      distanceUnit: 'miles',
      measurementUnit: 'in',
    };
  }
  return {
    weightUnit: 'kg',
    distanceUnit: 'kilometers',
    measurementUnit: 'cm',
  };
}

const initialState: UserPreferences = {
  ...getDefaultUnits(),
  hasInitialized: false,
  defaultRestTimerSeconds: 0,
  rpeTrackingEnabled: false,
  timerSoundId: 'chime',
  vibrationEnabled: true,
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      ...initialState,

      getUnitSystem: () => {
        const { weightUnit } = get();
        return weightUnit === 'lbs' ? 'imperial' : 'metric';
      },

      setWeightUnit: (unit) => set({ weightUnit: unit }),
      setDistanceUnit: (unit) => set({ distanceUnit: unit }),
      setMeasurementUnit: (unit) => set({ measurementUnit: unit }),

      setDefaultRestTimerSeconds: (seconds) => set({ defaultRestTimerSeconds: seconds }),
      setRpeTrackingEnabled: (enabled) => set({ rpeTrackingEnabled: enabled }),
      setTimerSoundId: (soundId) => set({ timerSoundId: soundId }),
      setVibrationEnabled: (enabled) => set({ vibrationEnabled: enabled }),

      initializeFromLocale: () => {
        const { hasInitialized } = get();
        if (hasInitialized) return;

        const defaults = getDefaultUnits();
        set({
          ...defaults,
          hasInitialized: true,
        });
      },

      syncFromProfile: (profile) => {
        const updates: Partial<UserPreferences> = {};
        if (profile.weight_unit) updates.weightUnit = profile.weight_unit;
        if (profile.distance_unit) updates.distanceUnit = profile.distance_unit;
        if (profile.measurement_unit) updates.measurementUnit = profile.measurement_unit;

        if (Object.keys(updates).length > 0) {
          set(updates);
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
