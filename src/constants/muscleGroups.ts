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
  { id: 'biceps', i18nKey: 'muscles.biceps', muscleGroupValues: ['biceps', 'arms'] },
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

export type IntensityTier = 0 | 1 | 2 | 3 | 4;

export const BODY_GRAPH_COLORS: Record<IntensityTier, string> = {
  0: 'transparent',
  1: '#C4B0FF', // Light
  2: '#947AFF', // Moderate
  3: '#B066E8', // Heavy
  4: '#FF6AC2', // Overreached
} as const;

// Thresholds scale with the timeframe.
// Source: weekly volume landmarks (MEV/MAV/MRV) from sports science research.
// Weekly: MEV ~6-8 sets, MAV ~10-20, MRV ~20-30, overreaching 30+
// Daily: divide weekly by ~4 sessions. Monthly: multiply weekly by 4.3 weeks.
export const INTENSITY_THRESHOLDS: Record<
  'today' | 'week' | 'month',
  [number, number, number, number]
> = {
  //           tier1  tier2  tier3  tier4
  today: [1, 5, 10, 15], // per session
  week: [1, 10, 20, 30], // weekly volume (MEV/MAV/MRV)
  month: [1, 40, 80, 120], // monthly volume (weekly * 4.3)
};

export function getIntensityTier(
  effectiveSets: number,
  timeframe: 'today' | 'week' | 'month' = 'today'
): IntensityTier {
  const [t1, t2, t3, t4] = INTENSITY_THRESHOLDS[timeframe];
  if (effectiveSets >= t4) return 4;
  if (effectiveSets >= t3) return 3;
  if (effectiveSets >= t2) return 2;
  if (effectiveSets >= t1) return 1;
  return 0;
}

// Body graph image keys per view (match the asset filenames).
// Mapping from DB group IDs to image keys happens in BodyGraph.tsx:
//   biceps  → front "arms"  (Front_Arms shows bicep + forearm area)
//   triceps → back "arms"   (Back_Arms shows tricep + forearm area)
//   core    → front "abs"   (asset is named Abs)
//   all others: same key on both views
export const BODY_GRAPH_FRONT_GROUPS = [
  'chest',
  'abs',
  'arms',
  'shoulders',
  'legs',
  'calves',
] as const;
export const BODY_GRAPH_BACK_GROUPS = [
  'back',
  'glutes',
  'arms',
  'shoulders',
  'legs',
  'calves',
] as const;
