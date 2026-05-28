import type { Program, ProgramDay, ProgramExercise, ProgramWorkout, WorkoutType } from './types';
import { BOOTY_DESCRIPTIONS } from './booty-descriptions';

const ex = (name: string, sets: number, reps: string): ProgramExercise => ({ name, sets, reps });

const ABS_HANG_AB: ProgramExercise[] = [
  ex('Hanging knee raise', 3, '10'),
  ex('Ab crunch', 3, '10'),
];
const ABS_HANG_AB_12: ProgramExercise[] = [
  ex('Hanging knee raise', 3, '12'),
  ex('Ab crunch', 3, '12'),
];
const ABS_HANG_DECLINE: ProgramExercise[] = [
  ex('Hanging leg raise', 3, '12'),
  ex('Decline ab crunch', 3, '12'),
];
const ABS_HANG_DECLINE_10: ProgramExercise[] = [
  ex('Hanging leg raise', 3, '10'),
  ex('Decline ab crunch', 3, '10'),
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
    ex('Hip Thrusts', 4, '10'),
    ex('DB RDL', 3, '10'),
    ex('Cable Step Ups', 3, cableStepReps),
    ex('Cable Kickbacks', 4, '12'),
  ];
}

function phaseAGlutesW4Plus(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('DB RDL', 3, '10'),
    ex('Cable Step Ups', 4, '8'),
    ex('Cable Kickbacks', 4, '12'),
  ];
}

function phaseAUpperW1(): ProgramExercise[] {
  return [
    ex('Lat Pull Down', 3, '10'),
    ex('Seated Cable Row', 3, '10'),
    ex('Shoulder Press Machine', 3, '8'),
    ex('Face Pull', 3, '12'),
    ex('Cable Bicep Curl', 3, '8'),
    ex('Hammer Curl', 3, '8'),
  ];
}

function phaseAUpperW3Plus(): ProgramExercise[] {
  return [
    ex('Lat Pull Down', 3, '12'),
    ex('Seated Cable Row', 3, '10'),
    ex('Shoulder Press Machine', 3, '10'),
    ex('Face Pull', 3, '12'),
    ex('Cable Bicep Curl', 3, '10'),
    ex('Hammer Curl', 3, '10'),
  ];
}

function phaseAUpperW4(): ProgramExercise[] {
  return [
    ex('Lat Pull Down', 3, '12'),
    ex('Seated Cable Row', 3, '12'),
    ex('Shoulder Press Machine', 4, '8'),
    ex('Face Pull', 3, '12'),
    ex('Cable Bicep Curl', 3, '10'),
    ex('Hammer Curl', 3, '10'),
  ];
}

function phaseAGlutesHamsW1(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 3, '10'),
    ex('Single Leg Hip Thrusts', 3, '8'),
    ex('BB RDL', 3, '10'),
    ex('Leg Curls', 3, '10'),
    ex('Back Extensions', 3, '12'),
  ];
}

function phaseAGlutesHamsW3(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('Single Leg Hip Thrusts', 3, '10'),
    ex('BB RDL', 3, '10'),
    ex('Leg Curls', 3, '12'),
    ex('Back Extensions', 3, '12'),
  ];
}

function phaseAGlutesHamsW4(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('Single Leg Hip Thrusts', 3, '10'),
    ex('BB RDL', 3, '10'),
    ex('Leg Curls', 4, '12'),
    ex('Back Extensions', 3, '12'),
  ];
}

function phaseAUpper2W1(): ProgramExercise[] {
  return [
    ex('Shoulder Press Machine', 3, '8'),
    ex('Single Arm DB Row', 3, '10'),
    ex('Reverse Fly', 3, '10'),
    ex('Lateral Raise DB', 3, '8'),
    ex('Tricep Pushdown', 3, '10'),
  ];
}

function phaseAUpper2W3(): ProgramExercise[] {
  return [
    ex('Shoulder Press Machine', 3, '10'),
    ex('Single Arm DB Row', 3, '10'),
    ex('Reverse Fly', 3, '12'),
    ex('Lateral Raise DB', 3, '10'),
    ex('Tricep Pushdown', 3, '12'),
  ];
}

function phaseAUpper2W4(): ProgramExercise[] {
  return [
    ex('Shoulder Press Machine', 4, '8'),
    ex('Single Arm DB Row', 3, '10'),
    ex('Reverse Fly', 3, '12'),
    ex('Lateral Raise DB', 3, '10'),
    ex('Tricep Pushdown', 3, '12'),
  ];
}

function phaseAGlutesQuadsW1(): ProgramExercise[] {
  return [
    ex('Leg Press', 4, '10'),
    ex('Hack Squats', 3, '10'),
    ex('Reverse Lunges', 3, '8'),
    ex('Leg Extensions', 3, '10'),
    ex('Hip Abductions', 3, '12'),
  ];
}

function phaseAGlutesQuadsW3Plus(): ProgramExercise[] {
  return [
    ex('Leg Press', 4, '10'),
    ex('Hack Squats', 4, '8'),
    ex('Reverse Lunges', 3, '10'),
    ex('Leg Extensions', 3, '12'),
    ex('Hip Abductions', 3, '12'),
  ];
}

// ── Phase B (Weeks 7-12) ─────────────────────────────────────────────────────
// New exercise pool: B-stance RDL, hip ABDuctions in day-1 slot, assisted pull
// ups, iso row, chest press, single leg press, etc. Week 10 ups weights so reps
// shift on a few movements.

function phaseBGlutes(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('B-Stance RDL DB', 3, '10'),
    ex('Cable Step Ups', 4, '8'),
    ex('Hip Abductions', 4, '12'),
  ];
}

function phaseBGlutesW10(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('B-Stance RDL DB', 3, '10'),
    ex('Cable Step Ups', 4, '10'),
    ex('Hip Abductions', 4, '12'),
  ];
}

function phaseBUpper(): ProgramExercise[] {
  return [
    ex('Assisted Pull Up', 3, '12'),
    ex('Iso Row Machine', 3, '12'),
    ex('Chest Press Machine', 4, '8'),
    ex('Face Pull', 3, '12'),
    ex('Cable Bicep Curl', 3, '10'),
    ex('Bicep Curl', 3, '10'),
  ];
}

function phaseBUpperW10(): ProgramExercise[] {
  return [
    ex('Assisted Pull Up', 3, '10'),
    ex('Iso Row Machine', 3, '10'),
    ex('Chest Press Machine', 4, '10'),
    ex('Face Pull', 3, '12'),
    ex('Cable Bicep Curl', 3, '10'),
    ex('Bicep Curl', 3, '10'),
  ];
}

function phaseBGlutesHams(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('Good Mornings', 3, '10'),
    ex('Bulgarian Split Squat', 3, '10'),
    ex('Lying Leg Curls', 4, '12'),
    ex('Cable Kickbacks', 3, '12'),
  ];
}

function phaseBGlutesHamsW10(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('Good Mornings', 3, '10'),
    ex('Bulgarian Split Squat', 3, '8'),
    ex('Lying Leg Curls', 3, '10'),
    ex('Cable Kickbacks', 3, '10'),
  ];
}

function phaseBUpper2(): ProgramExercise[] {
  return [
    ex('Shoulder Press DB', 3, '8'),
    ex('Single Arm Lat Pull Down', 3, '8'),
    ex('Chest Fly', 3, '10'),
    ex('Lateral Raise Machine', 3, '10'),
    ex('Tricep Pushdown', 3, '10'),
  ];
}

function phaseBUpper2W10(): ProgramExercise[] {
  return [
    ex('Shoulder Press DB', 3, '10'),
    ex('Single Arm Lat Pull Down', 3, '10'),
    ex('Chest Fly', 3, '10'),
    ex('Lateral Raise Machine', 3, '10'),
    ex('Tricep Pushdown', 3, '10'),
  ];
}

function phaseBGlutesQuads(): ProgramExercise[] {
  return [
    ex('Single Leg Press', 3, '8'),
    ex('Goblet Squats', 3, '10'),
    ex('Walking Lunges', 3, '10'),
    ex('Leg Extensions', 3, '10'),
    ex('Hip Adductors', 3, '8'),
  ];
}

function phaseBGlutesQuadsW10(): ProgramExercise[] {
  return [
    ex('Single Leg Press', 3, '10'),
    ex('Goblet Squats', 3, '10'),
    ex('Walking Lunges', 3, '10'),
    ex('Leg Extensions', 3, '10'),
    ex('Hip Adductors', 3, '8'),
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
