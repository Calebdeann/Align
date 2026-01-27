/**
 * Converts a string to Title Case (capitalises the first letter of each word).
 * Useful for exercise names that come from the API in lowercase.
 * e.g. "barbell glute bridge" → "Barbell Glute Bridge"
 */
export function toTitleCase(text: string): string {
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Equipment prefixes to detect in exercise names (longest-first for correct matching)
const EQUIPMENT_PREFIXES = [
  'smith machine',
  'leverage machine',
  'sled machine',
  'olympic barbell',
  'ez barbell',
  'trap bar',
  'exercise ball',
  'medicine ball',
  'bosu ball',
  'barbell',
  'dumbbell',
  'kettlebell',
  'cable',
  'band',
  'weighted',
  'assisted',
  'roller',
];

const BODYWEIGHT_EQUIPMENT = ['body weight', 'bodyweight'];

/**
 * Formats an exercise name for display using the structured equipment array.
 * Moves the equipment from the front of the name to parentheses at the end.
 *
 * e.g. ("dumbbell incline bench press", ["dumbbell"]) → "Incline Bench Press (Dumbbell)"
 *      ("push up", ["body weight"]) → "Push Up"
 *      ("cable fly", ["cable"]) → "Fly (Cable)"
 */
export function formatExerciseDisplayName(name: string, equipment?: string[]): string {
  if (!name) return '';

  // If name already has parentheses, just title-case it (e.g. preset template names)
  if (name.includes('(')) return toTitleCase(name);

  if (!equipment || equipment.length === 0) return toTitleCase(name);

  // Find the first non-bodyweight equipment entry
  const primaryEquip = equipment.find((eq) => !BODYWEIGHT_EQUIPMENT.includes(eq.toLowerCase()));

  // Body weight only or no relevant equipment: just title case
  if (!primaryEquip) return toTitleCase(name);

  const nameLower = name.toLowerCase().trim();
  const equipLower = primaryEquip.toLowerCase();

  // Strip equipment from the start of the name if it matches
  if (nameLower.startsWith(equipLower + ' ')) {
    const strippedName = name.trim().substring(primaryEquip.length).trim();
    return toTitleCase(strippedName) + ' (' + toTitleCase(primaryEquip) + ')';
  }

  // Equipment not at start — just title case the name and append equipment
  return toTitleCase(name) + ' (' + toTitleCase(primaryEquip) + ')';
}

/**
 * Formats an exercise name from a plain string (no equipment array available).
 * Detects known equipment prefixes and moves them to parentheses.
 *
 * e.g. "dumbbell incline bench press" → "Incline Bench Press (Dumbbell)"
 *      "push up" → "Push Up"
 */
export function formatExerciseNameString(name: string): string {
  if (!name) return '';

  // If name already has parentheses, just title-case it
  if (name.includes('(')) return toTitleCase(name);

  const nameLower = name.toLowerCase().trim();

  // Check for known equipment prefixes (longest-first)
  for (const prefix of EQUIPMENT_PREFIXES) {
    if (nameLower.startsWith(prefix + ' ')) {
      const strippedName = name.trim().substring(prefix.length).trim();
      return toTitleCase(strippedName) + ' (' + toTitleCase(prefix) + ')';
    }
  }

  return toTitleCase(name);
}
