// Simplified muscle categories that map to granular muscle_group database values.
// The filter UI shows these simplified names instead of anatomy terms like "pectorals" or "delts".

export interface SimplifiedMuscleGroup {
  id: string;
  i18nKey: string;
  muscleGroupValues: string[]; // Values that match exercise.muscle_group in the database
}

export const SIMPLIFIED_MUSCLE_GROUPS: SimplifiedMuscleGroup[] = [
  {
    id: 'back',
    i18nKey: 'muscles.back',
    muscleGroupValues: ['lats', 'upper back', 'traps', 'spine'],
  },
  { id: 'biceps', i18nKey: 'muscles.biceps', muscleGroupValues: ['biceps'] },
  { id: 'chest', i18nKey: 'muscles.chest', muscleGroupValues: ['pectorals'] },
  { id: 'core', i18nKey: 'muscles.core', muscleGroupValues: ['abs'] },
  { id: 'glutes', i18nKey: 'muscles.glutes', muscleGroupValues: ['glutes'] },
  { id: 'calves', i18nKey: 'muscles.calves', muscleGroupValues: ['calves'] },
  {
    id: 'legs',
    i18nKey: 'muscles.legs',
    muscleGroupValues: ['quads', 'hamstrings', 'adductors', 'abductors'],
  },
  {
    id: 'shoulders',
    i18nKey: 'muscles.shoulders',
    muscleGroupValues: ['delts', 'serratus anterior'],
  },
  { id: 'triceps', i18nKey: 'muscles.triceps', muscleGroupValues: ['triceps'] },
  {
    id: 'other',
    i18nKey: 'muscles.other',
    muscleGroupValues: ['forearms', 'cardiovascular system'],
  },
];

// Reverse lookup: maps a raw muscle_group value to its simplified category i18n key.
// e.g., "pectorals" -> "muscles.chest", "quads" -> "muscles.legs", "chest" -> "muscles.chest"
const reverseLookup = new Map<string, string>();
for (const group of SIMPLIFIED_MUSCLE_GROUPS) {
  // Map simplified ID itself (for custom exercises that store "chest", "legs", etc.)
  reverseLookup.set(group.id.toLowerCase(), group.i18nKey);
  for (const val of group.muscleGroupValues) {
    reverseLookup.set(val.toLowerCase(), group.i18nKey);
  }
}

// Returns the i18n key for the simplified category, or falls back to capitalizing the raw value.
export function getSimplifiedMuscleI18nKey(muscleGroup: string): string {
  return reverseLookup.get(muscleGroup.toLowerCase()) || 'muscles.other';
}

// Returns the simplified category name directly (English fallback, no i18n).
// Used when t() is not available.
const reverseNameLookup = new Map<string, string>();
for (const group of SIMPLIFIED_MUSCLE_GROUPS) {
  reverseNameLookup.set(group.id.toLowerCase(), group.id);
  for (const val of group.muscleGroupValues) {
    reverseNameLookup.set(val.toLowerCase(), group.id);
  }
}

export function getSimplifiedMuscleId(muscleGroup: string): string {
  return reverseNameLookup.get(muscleGroup.toLowerCase()) || 'other';
}

// Expands a simplified category ID to its array of muscle_group values for filtering.
// e.g., "legs" -> ["quads", "hamstrings", "adductors", "abductors", "legs"]
// Includes the simplified ID itself so custom exercises (which store the simplified ID
// as muscle_group, e.g. "chest") also match the filter.
export function expandMuscleFilter(simplifiedId: string): string[] {
  const group = SIMPLIFIED_MUSCLE_GROUPS.find((g) => g.id === simplifiedId);
  return group ? [...group.muscleGroupValues, simplifiedId] : [simplifiedId];
}

// =============================================
// BODY GRAPH - Intensity visualization
// =============================================

export type IntensityTier = 0 | 1 | 2 | 3;

export const BODY_GRAPH_COLORS: Record<IntensityTier, string> = {
  0: 'transparent',
  1: '#E0D6FF', // Light purple - low volume
  2: '#B8A8FF', // Medium purple - moderate volume
  3: '#947AFF', // Full purple - high volume
} as const;

// Effective sets = primarySets + (secondarySets * 0.5)
export const INTENSITY_THRESHOLDS = {
  tier1: 1, // 1-6 effective sets
  tier2: 7, // 7-14 effective sets
  tier3: 15, // 15+ effective sets
} as const;

export function getIntensityTier(effectiveSets: number): IntensityTier {
  if (effectiveSets >= INTENSITY_THRESHOLDS.tier3) return 3;
  if (effectiveSets >= INTENSITY_THRESHOLDS.tier2) return 2;
  if (effectiveSets >= INTENSITY_THRESHOLDS.tier1) return 1;
  return 0;
}

// Which simplified muscle groups appear on each body graph view
export const BODY_GRAPH_FRONT_GROUPS = ['chest', 'core', 'biceps', 'shoulders', 'legs'] as const;
export const BODY_GRAPH_BACK_GROUPS = ['back', 'glutes', 'triceps', 'calves'] as const;
