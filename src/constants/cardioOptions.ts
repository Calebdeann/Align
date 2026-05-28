// Cardio options shown in the picker before starting a cardio sub-workout.
// Each option points to a real exercise row in the Supabase `exercises` table
// (exercise_type = 'cardio'), so selecting one creates a workout exercise with
// the real DB id — animations, thumbnails, and the exercise detail screen
// all work like any other exercise.
//
// Cardio detection in the active-workout tracker keys off membership in
// CARDIO_EXERCISE_IDS rather than the old `cardio-{slug}` prefix.

export type CardioOption = {
  id: string; // Supabase exercises.id (UUID) — used directly as exerciseId
  slug: string; // stable picker-local key for icon / color lookups
  name: string; // user-facing label (matches DB display_name)
  difficultyLabel: string; // hint shown above the difficulty input
  defaultDifficulty: number;
};

export const CARDIO_OPTIONS: CardioOption[] = [
  {
    id: '4ba6b2e4-e543-4611-9da6-5dbae9dbec0f',
    slug: 'treadmill-run',
    name: 'Treadmill Running',
    difficultyLabel: 'Speed',
    defaultDifficulty: 8,
  },
  {
    id: '44762178-8769-4c0a-bc98-e0d6ba6742f1',
    slug: 'incline-walk',
    name: 'Incline Treadmill Walking',
    difficultyLabel: 'Incline',
    defaultDifficulty: 10,
  },
  {
    id: '21fbdc01-3ea9-4f22-b9b7-e4613ef83ef5',
    slug: 'bike',
    name: 'Stationary Bike',
    difficultyLabel: 'Resistance',
    defaultDifficulty: 8,
  },
  {
    id: 'afdf70a6-a7b6-404f-9e0b-fe26fa27ca6d',
    slug: 'stairmaster',
    name: 'Stairmaster',
    difficultyLabel: 'Level',
    defaultDifficulty: 8,
  },
  {
    id: 'f8bc406d-df35-43d1-ad6d-8b6c147f7223',
    slug: 'rower',
    name: 'Rowing Machine',
    difficultyLabel: 'Resistance',
    defaultDifficulty: 6,
  },
  {
    id: 'e4af5c6a-b30a-419b-bff5-6ece0d7c63ba',
    slug: 'elliptical',
    name: 'Elliptical Trainer',
    difficultyLabel: 'Resistance',
    defaultDifficulty: 8,
  },
  {
    id: '43546095-c4b6-4e07-a1f5-0eabac54c42d',
    slug: 'outdoor-run',
    name: 'Run',
    difficultyLabel: 'Pace',
    defaultDifficulty: 7,
  },
  {
    id: 'eebc9da2-f79b-43bd-b108-05c66d727d88',
    slug: 'outdoor-walk',
    name: 'Walking',
    difficultyLabel: 'Pace',
    defaultDifficulty: 5,
  },
];

const CARDIO_EXERCISE_IDS = new Set(CARDIO_OPTIONS.map((o) => o.id));

/** Whether an exercise id corresponds to one of the cardio picker options. */
export function isCardioExerciseId(exerciseId: string | undefined | null): boolean {
  if (!exerciseId) return false;
  if (CARDIO_EXERCISE_IDS.has(exerciseId)) return true;
  // Backwards-compat: any workout/template persisted before the UUID swap
  // still carries `cardio-{slug}` ids — keep treating those as cardio so
  // the tracker shows difficulty/duration instead of weight/reps.
  return exerciseId.startsWith('cardio-');
}

/** Pull the recommended duration (minutes) from a freeText string like "30 mins cardio…". */
export function parseRecommendedMinutes(freeText: string | undefined | null): number | null {
  if (!freeText) return null;
  const m = freeText.match(/(\d+)\s*min/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
