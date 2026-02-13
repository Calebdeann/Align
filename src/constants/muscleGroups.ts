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
// e.g., "pectorals" -> "muscles.chest", "quads" -> "muscles.legs"
const reverseLookup = new Map<string, string>();
for (const group of SIMPLIFIED_MUSCLE_GROUPS) {
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
  for (const val of group.muscleGroupValues) {
    reverseNameLookup.set(val.toLowerCase(), group.id);
  }
}

export function getSimplifiedMuscleId(muscleGroup: string): string {
  return reverseNameLookup.get(muscleGroup.toLowerCase()) || 'other';
}

// Expands a simplified category ID to its array of muscle_group values for filtering.
// e.g., "legs" -> ["quads", "hamstrings", "calves"]
export function expandMuscleFilter(simplifiedId: string): string[] {
  const group = SIMPLIFIED_MUSCLE_GROUPS.find((g) => g.id === simplifiedId);
  return group ? group.muscleGroupValues : [simplifiedId];
}
