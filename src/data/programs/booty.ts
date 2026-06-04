import type { Program, ProgramDay, ProgramExercise, ProgramWorkout, WorkoutType } from './types';
import { BOOTY_DESCRIPTIONS } from './booty-descriptions';

const ex = (name: string, sets: number, reps: string, notes?: string): ProgramExercise =>
  notes ? { name, sets, reps, notes } : { name, sets, reps };

const ABS_HANG_AB: ProgramExercise[] = [
  ex('Hanging Knee Raise', 3, '10'),
  ex('Ab Crunch', 3, '10'),
];
const ABS_HANG_AB_12: ProgramExercise[] = [
  ex('Hanging Knee Raise', 3, '12'),
  ex('Ab Crunch', 3, '12'),
];
const ABS_HANG_DECLINE: ProgramExercise[] = [
  ex('Hanging Straight Leg Raise', 3, '12'),
  ex('Decline Crunch', 3, '12'),
];
const ABS_HANG_DECLINE_10: ProgramExercise[] = [
  ex('Hanging Straight Leg Raise', 3, '10'),
  ex('Decline Crunch', 3, '10'),
];

function buildDay(
  week: number,
  dayInWeek: number,
  type: WorkoutType,
  title: string,
  exercises: ProgramExercise[],
  opts: { abs?: ProgramExercise[] } = {}
): ProgramDay {
  const workouts: ProgramWorkout[] = [
    {
      id: `booty-w${week}-d${dayInWeek}-main`,
      week,
      dayInWeek,
      type,
      title,
      exercises,
    },
  ];
  if (opts.abs && opts.abs.length > 0) {
    workouts.push({
      id: `booty-w${week}-d${dayInWeek}-abs`,
      week,
      dayInWeek,
      type: 'abs',
      title: 'Abs',
      exercises: opts.abs,
    });
  }
  return { week, dayInWeek, workouts };
}

// ── Phase A (Weeks 1-6) ─────────────────────────────────────────────────────
// Foundation glute exercises. Weeks 1-2 identical. Week 3 ups reps on a few
// movements. Week 4 onward adds a set / bumps cable step ups to 4×8.

function phaseAGlutes(week: number, cableStepReps: string): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      4,
      '10',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Romanian Deadlift (Dumbbell)', 3, '10'),
    ex(
      'Step Up (Dumbbell)',
      3,
      cableStepReps,
      'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
    ),
    ex('Cable Kickbacks', 4, '12'),
  ];
}

function phaseAGlutesW4Plus(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      4,
      '10',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Romanian Deadlift (Dumbbell)', 3, '10'),
    ex(
      'Step Up (Dumbbell)',
      4,
      '8',
      'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
    ),
    ex('Cable Kickbacks', 4, '12'),
  ];
}

function phaseAUpperW1(): ProgramExercise[] {
  return [
    ex('Lat Pulldown', 3, '10'),
    ex('Seated Row (Cable)', 3, '10'),
    ex('Shoulder Press (Machine)', 3, '8'),
    ex('Face Pulls', 3, '12'),
    ex('Bicep Curl (Cable)', 3, '8'),
    ex('Hammer Curl (Dumbbell)', 3, '8'),
  ];
}

function phaseAUpperW3Plus(): ProgramExercise[] {
  return [
    ex('Lat Pulldown', 3, '12'),
    ex('Seated Row (Cable)', 3, '10'),
    ex('Shoulder Press (Machine)', 3, '10'),
    ex('Face Pulls', 3, '12'),
    ex('Bicep Curl (Cable)', 3, '10'),
    ex('Hammer Curl (Dumbbell)', 3, '10'),
  ];
}

function phaseAUpperW4(): ProgramExercise[] {
  return [
    ex('Lat Pulldown', 3, '12'),
    ex('Seated Row (Cable)', 3, '12'),
    ex('Shoulder Press (Machine)', 4, '8'),
    ex('Face Pulls', 3, '12'),
    ex('Bicep Curl (Cable)', 3, '10'),
    ex('Hammer Curl (Dumbbell)', 3, '10'),
  ];
}

function phaseAGlutesHamsW1(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      3,
      '10',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Romanian Deadlift (Barbell)', 3, '10'),
    ex(
      'Lying Leg Curl (Machine)',
      3,
      '10',
      'Any leg curl machine works. Use whichever your gym has.'
    ),
    ex(
      'Back Extensions (Hyperextension)',
      3,
      '12',
      'Hold onto a plate or dumbbell at your chest to increase difficulty.'
    ),
  ];
}

function phaseAGlutesHamsW3(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      4,
      '10',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Romanian Deadlift (Barbell)', 3, '10'),
    ex(
      'Lying Leg Curl (Machine)',
      3,
      '12',
      'Any leg curl machine works. Use whichever your gym has.'
    ),
    ex(
      'Back Extensions (Hyperextension)',
      3,
      '12',
      'Hold onto a plate or dumbbell at your chest to increase difficulty.'
    ),
  ];
}

function phaseAGlutesHamsW4(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      4,
      '10',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Romanian Deadlift (Barbell)', 3, '10'),
    ex(
      'Lying Leg Curl (Machine)',
      4,
      '12',
      'Any leg curl machine works. Use whichever your gym has.'
    ),
    ex(
      'Back Extensions (Hyperextension)',
      3,
      '12',
      'Hold onto a plate or dumbbell at your chest to increase difficulty.'
    ),
  ];
}

function phaseAUpper2W1(): ProgramExercise[] {
  return [
    ex('Shoulder Press (Machine)', 3, '8'),
    ex('Single Arm Row (Dumbbell)', 3, '10'),
    ex('Reverse Fly (Cable)', 3, '10'),
    ex('Lateral Raise (Dumbbell)', 3, '8'),
    ex('Triceps Pushdown', 3, '10'),
  ];
}

function phaseAUpper2W3(): ProgramExercise[] {
  return [
    ex('Shoulder Press (Machine)', 3, '10'),
    ex('Single Arm Row (Dumbbell)', 3, '10'),
    ex('Reverse Fly (Cable)', 3, '12'),
    ex('Lateral Raise (Dumbbell)', 3, '10'),
    ex('Triceps Pushdown', 3, '12'),
  ];
}

function phaseAUpper2W4(): ProgramExercise[] {
  return [
    ex('Shoulder Press (Machine)', 4, '8'),
    ex('Single Arm Row (Dumbbell)', 3, '10'),
    ex('Reverse Fly (Cable)', 3, '12'),
    ex('Lateral Raise (Dumbbell)', 3, '10'),
    ex('Triceps Pushdown', 3, '12'),
  ];
}

function phaseAGlutesQuadsW1(): ProgramExercise[] {
  return [
    ex('Leg Press (Machine)', 4, '10'),
    ex('Hack Squat', 3, '10'),
    ex('Reverse Lunges (Barbell)', 3, '8'),
    ex('Leg Extension (Machine)', 3, '10'),
    ex('Seated Hip Abduction (Machine)', 3, '12'),
  ];
}

function phaseAGlutesQuadsW3Plus(): ProgramExercise[] {
  return [
    ex('Leg Press (Machine)', 4, '10'),
    ex('Hack Squat', 4, '8'),
    ex('Reverse Lunges (Barbell)', 3, '10'),
    ex('Leg Extension (Machine)', 3, '12'),
    ex('Seated Hip Abduction (Machine)', 3, '12'),
  ];
}

// ── Phase B (Weeks 7-12) ─────────────────────────────────────────────────────
// New exercise pool: B-stance RDL, hip ABDuctions in day-1 slot, assisted pull
// ups, iso row, chest press, single leg press, etc. Week 10 ups weights so reps
// shift on a few movements.

function phaseBGlutes(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      4,
      '10',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '10'),
    ex(
      'Step Up (Dumbbell)',
      4,
      '8',
      'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
    ),
    ex('Seated Hip Abduction (Machine)', 4, '12'),
  ];
}

function phaseBGlutesW10(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      4,
      '10',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '10'),
    ex(
      'Step Up (Dumbbell)',
      4,
      '10',
      'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
    ),
    ex('Seated Hip Abduction (Machine)', 4, '12'),
  ];
}

function phaseBUpper(): ProgramExercise[] {
  return [
    ex('Assisted Pull Up', 3, '12'),
    ex('Iso Lateral Row (Machine)', 3, '12'),
    ex('Chest Press (Machine)', 4, '8'),
    ex('Face Pulls', 3, '12'),
    ex('Bicep Curl (Cable)', 3, '10'),
    ex('Bicep Curl (Barbell)', 3, '10'),
  ];
}

function phaseBUpperW10(): ProgramExercise[] {
  return [
    ex('Assisted Pull Up', 3, '10'),
    ex('Iso Lateral Row (Machine)', 3, '10'),
    ex('Chest Press (Machine)', 4, '10'),
    ex('Face Pulls', 3, '12'),
    ex('Bicep Curl (Cable)', 3, '10'),
    ex('Bicep Curl (Barbell)', 3, '10'),
  ];
}

function phaseBGlutesHams(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      4,
      '10',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Good Morning (Barbell)', 3, '10'),
    ex('Bulgarian Split Squats', 3, '10'),
    ex(
      'Lying Leg Curl (Machine)',
      4,
      '12',
      'Any leg curl machine works. Use whichever your gym has.'
    ),
    ex('Cable Kickbacks', 3, '12'),
  ];
}

function phaseBGlutesHamsW10(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      4,
      '10',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Good Morning (Barbell)', 3, '10'),
    ex('Bulgarian Split Squats', 3, '8'),
    ex(
      'Lying Leg Curl (Machine)',
      3,
      '10',
      'Any leg curl machine works. Use whichever your gym has.'
    ),
    ex('Cable Kickbacks', 3, '10'),
  ];
}

function phaseBUpper2(): ProgramExercise[] {
  return [
    ex('Standing Shoulder Press (Dumbbell)', 3, '8'),
    ex('Single Arm Lat Pulldown (Machine)', 3, '8'),
    ex('Chest Fly (Dumbbell)', 3, '10'),
    ex('Lateral Raise (Machine)', 3, '10'),
    ex('Triceps Pushdown', 3, '10'),
  ];
}

function phaseBUpper2W10(): ProgramExercise[] {
  return [
    ex('Standing Shoulder Press (Dumbbell)', 3, '10'),
    ex('Single Arm Lat Pulldown (Machine)', 3, '10'),
    ex('Chest Fly (Dumbbell)', 3, '10'),
    ex('Lateral Raise (Machine)', 3, '10'),
    ex('Triceps Pushdown', 3, '10'),
  ];
}

function phaseBGlutesQuads(): ProgramExercise[] {
  return [
    ex('Single Leg Press (Horizontal Machine)', 3, '8'),
    ex(
      'Goblet Squat (Dumbbell)',
      3,
      '10',
      'These can be done with a dumbbell, kettlebell, plate, or without weight.'
    ),
    ex('Walking Lunges', 3, '10'),
    ex('Leg Extension (Machine)', 3, '10'),
    ex('Hip Adductors (Machine)', 3, '8'),
  ];
}

function phaseBGlutesQuadsW10(): ProgramExercise[] {
  return [
    ex('Single Leg Press (Horizontal Machine)', 3, '10'),
    ex(
      'Goblet Squat (Dumbbell)',
      3,
      '10',
      'These can be done with a dumbbell, kettlebell, plate, or without weight.'
    ),
    ex('Walking Lunges', 3, '10'),
    ex('Leg Extension (Machine)', 3, '10'),
    ex('Hip Adductors (Machine)', 3, '8'),
  ];
}

// ── Week assembler ──────────────────────────────────────────────────────────

function buildBootyWeek(week: number): ProgramDay[] {
  // Choose exercise variants by week
  let glutes: ProgramExercise[];
  let upper: ProgramExercise[];
  let glutesHams: ProgramExercise[];
  let upper2: ProgramExercise[];
  let glutesQuads: ProgramExercise[];
  let absDay1: ProgramExercise[];

  if (week <= 2) {
    glutes = phaseAGlutes(week, '8');
    upper = phaseAUpperW1();
    glutesHams = phaseAGlutesHamsW1();
    upper2 = phaseAUpper2W1();
    glutesQuads = phaseAGlutesQuadsW1();
    absDay1 = ABS_HANG_AB;
  } else if (week === 3) {
    glutes = phaseAGlutes(week, '10');
    upper = phaseAUpperW3Plus();
    glutesHams = phaseAGlutesHamsW3();
    upper2 = phaseAUpper2W3();
    glutesQuads = phaseAGlutesQuadsW3Plus();
    absDay1 = ABS_HANG_AB;
  } else if (week <= 6) {
    // Weeks 4, 5, 6 — same plate
    glutes = phaseAGlutesW4Plus();
    upper = phaseAUpperW4();
    glutesHams = phaseAGlutesHamsW4();
    upper2 = phaseAUpper2W4();
    glutesQuads = phaseAGlutesQuadsW3Plus();
    absDay1 = ABS_HANG_AB_12;
  } else if (week === 10) {
    // Week 10 — phase B "up weights"
    glutes = phaseBGlutesW10();
    upper = phaseBUpperW10();
    glutesHams = phaseBGlutesHamsW10();
    upper2 = phaseBUpper2W10();
    glutesQuads = phaseBGlutesQuadsW10();
    absDay1 = ABS_HANG_DECLINE;
  } else {
    // Weeks 7, 8, 9, 11, 12 — phase B baseline
    glutes = phaseBGlutes();
    upper = phaseBUpper();
    glutesHams = phaseBGlutesHams();
    upper2 = phaseBUpper2();
    glutesQuads = phaseBGlutesQuads();
    absDay1 = ABS_HANG_DECLINE;
  }

  const absDay3 = week <= 6 ? ABS_HANG_AB : ABS_HANG_DECLINE_10;

  return [
    buildDay(week, 1, 'lower', 'Glutes', glutes, { abs: absDay1 }),
    buildDay(week, 2, 'upper', 'Upper Body (Session 1)', upper),
    buildDay(week, 3, 'lower', 'Glutes and Hamstrings', glutesHams, { abs: absDay3 }),
    buildDay(week, 4, 'upper', 'Upper Body (Session 2)', upper2),
    buildDay(week, 5, 'lower', 'Glutes and Quads', glutesQuads),
  ];
}

const DAYS: ProgramDay[] = [];
for (let w = 1; w <= 12; w++) {
  DAYS.push(...buildBootyWeek(w));
}

// Attach descriptions
DAYS.forEach((day) => {
  day.workouts.forEach((w) => {
    w.description = BOOTY_DESCRIPTIONS[w.id];
    if (!w.description) {
      console.warn(`[booty] missing description for ${w.id}`);
    }
  });
});

export const BOOTY_PROGRAM: Program = {
  id: 'booty',
  planId: 'booty',
  durationWeeks: 12,
  daysPerWeek: 5,
  defaultWeekdays: [1, 2, 3, 5, 6], // Mon, Tue, Wed, Fri, Sat
  days: DAYS,
};

export default BOOTY_PROGRAM;
