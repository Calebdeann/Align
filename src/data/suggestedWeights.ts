// Suggested starting weight in kg per exercise name. Values are sensible
// intermediate-female starting points — heavy enough that a posted workout
// looks "real" on the Discover / Friends feeds (real volume, real weights),
// light enough not to be intimidating defaults for new users.
//
// Used by `workoutStore` when initialising sets for a program-sourced active
// workout: if the user hasn't typed a weight yet, this is what pre-fills the
// kg input. User can edit any value during the workout.
//
// Bodyweight or "no obvious weight" exercises map to 0 — the user can add a
// plate / DB if they want.
//
// IMPORTANT: keys must match the exact strings used in the `ex('Name', …)`
// calls inside the 5 program files. I've covered every unique name found by
// grep across hourglass.ts / booty.ts / it-girl.ts / muscle-mommy.ts /
// pilates-princess.ts. When adding new programs, append any new exercise
// names below.

export const SUGGESTED_WEIGHTS_KG: Record<string, number> = {
  // ── Hip thrust / glute focus ────────────────────────────────────────────────
  'Hip Thrusts': 60,
  'Single Leg Hip Thrusts': 25,

  // ── RDL / hinge ─────────────────────────────────────────────────────────────
  'BB RDL': 40,
  'RDL BB': 40,
  'DB RDL': 12,
  'RDL DB': 12,
  'DB RDLs': 12,
  RDLs: 40,
  'B-Stance RDL DB': 10,
  'B-Stance RDL': 10,
  'B Stance or Single Leg RDL': 10,
  'Deadlift or RDL (BB)': 40,
  'Good Mornings': 20,
  'Good Mornings (Smith)': 25,
  'Back Extensions': 0, // bodyweight; user can hug a plate

  // ── Squat / quad ────────────────────────────────────────────────────────────
  'Back Squat': 40,
  'Hack Squat': 50,
  'Hack Squats': 50,
  'Leg Press': 80,
  'Horizontal Leg Press': 80,
  'Single Leg Press': 50,
  'Bulgarian Split Squat': 10,
  'Bulgarian Split Squats': 10,
  'Bulgarian Split Squats (Smith Machine)': 30,
  'Sumo Squat': 20,
  'Goblet Squat': 12,
  'Goblet Squats': 12,

  // ── Lunges + step ups ──────────────────────────────────────────────────────
  'Walking Lunges': 10,
  'Reverse Lunges': 10,
  'Reverse Lunge': 10,
  'Reverse Deficit Lunge': 8,
  'Deficit Reverse Lunge': 8,
  'BB Lunge': 25,
  'DB Step Up': 8,
  'DB Step Ups': 8,
  'Step Ups DB': 8,
  'Step Up Dumbbells': 8,
  'Cable Step Ups': 12,

  // ── Hamstring / glute accessories ──────────────────────────────────────────
  'Cable Kickback': 10,
  'Cable Kickbacks': 10,
  'Leg Curls': 25,
  'Leg Curl': 25,
  'Lying Leg Curls': 25,
  'Hamstring Curls': 25,
  'Leg Extensions': 30,

  // ── Hip abduction / adduction ──────────────────────────────────────────────
  'Hip Abductors': 50,
  'Hip Abductions': 50,
  'Hip Abduction': 50,
  'Hip Adductors': 40,

  // ── Pull / back ─────────────────────────────────────────────────────────────
  'Lat Pull Down': 30,
  'Lat Pull Downs': 30,
  'Lat Pull Down Machine': 30,
  'Close Grip Lat Pull Down': 30,
  'Single Arm Lat Pull Down': 15,
  'Straight Arm Lat Pull Down': 20,
  'Straight Arm Pulldown': 20,
  'Seated Cable Row': 30,
  'Seated Row': 30,
  'Iso Row Machine': 30,
  'T-Bar Row Machine': 25,
  'Single Arm DB Row': 10,
  'Single Arm Dumbbell Row': 10,
  'Single Arm Wide Grip Machine Row': 20,
  'Single Arm Machine Rows (Wide Grip)': 20,
  'Bent Over Row': 25,
  'Assisted Pull Up': 30, // assistance weight
  'Face Pull': 18,
  'Face Pulls': 18,
  '½ Kneeling Face Pull': 15,

  // ── Push / shoulders / chest ───────────────────────────────────────────────
  'Shoulder Press': 20,
  'Shoulder Press Machine': 20,
  'Machine Shoulder Press': 20,
  'Shoulder Press DB': 8,
  'Arnold Press': 7,
  'Chest Press Machine': 25,
  'Incline DB Chest Press': 10,
  'Chest Fly': 12,
  'Lateral Raise DB': 5,
  'Lateral Raises': 5,
  'Lateral Raise Machine': 10,
  'Lateral Raise Cable': 5,
  'Lateral Raise into Front Raise': 5,
  'Lateral into Frontal Raises': 5,
  'Front Raises': 5,
  'Incline Front Raise': 5,
  'Reverse Fly': 6,
  'Reverse Flies': 6,
  'Rear Delt Fly': 6,
  'Cable Reverse Fly': 7,
  'Around the Worlds': 4,

  // ── Biceps ──────────────────────────────────────────────────────────────────
  'Bicep Curl': 8,
  'BB Bicep Curl': 15,
  'Bicep Curl BB': 15,
  'DB Bicep Curls': 8,
  'Cable Bicep Curl': 10,
  'Cable Bicep Curls': 10,
  'Alt Bicep Curl SS Cable Bicep Curl': 8,
  'Bicep Curl SS Hammer Curl': 8,
  'Hammer Curl': 8,
  'Preacher Curl': 12,

  // ── Triceps ─────────────────────────────────────────────────────────────────
  'Tricep Pushdown': 18,
  'Tricep Kickbacks': 5,
  'Overhead Tricep Extension': 8,
  'Tricep Extension DB': 7,
  'Tricep Extensions': 7,
  'Tricep Extension Machine': 20,
};

/**
 * Returns the suggested starting weight in kg for the given exercise name,
 * or 0 if the exercise is unknown / intentionally bodyweight. Used to pre-fill
 * the `kg` field when initialising a program-sourced active workout.
 */
export function getSuggestedWeightKg(exerciseName: string): number {
  return SUGGESTED_WEIGHTS_KG[exerciseName] ?? 0;
}
