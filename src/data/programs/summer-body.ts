import type { Program, ProgramDay, ProgramExercise, ProgramWorkout, WorkoutType } from './types';
import { SUMMER_BODY_DESCRIPTIONS } from './summer-body-descriptions';

const ex = (
  name: string,
  sets: number,
  reps: string,
  opts: { supersetGroup?: number; notes?: string } = {}
): ProgramExercise => ({ name, sets, reps, ...opts });

const CARDIO_30 = '30 mins cardio of choice';
const ACTIVE_REST = '30 mins incline walking, stairs or bike';

function buildDay(
  week: number,
  dayInWeek: number,
  type: WorkoutType,
  title: string,
  exercises: ProgramExercise[],
  opts: { mainFreeText?: string; abs?: ProgramExercise[]; cardio?: string } = {}
): ProgramDay {
  const main: ProgramWorkout = {
    id: `summer-body-w${week}-d${dayInWeek}-main`,
    week,
    dayInWeek,
    type,
    title,
    exercises,
  };
  if (opts.mainFreeText) main.freeText = opts.mainFreeText;
  const workouts: ProgramWorkout[] = [main];
  if (opts.abs && opts.abs.length > 0) {
    workouts.push({
      id: `summer-body-w${week}-d${dayInWeek}-abs`,
      week,
      dayInWeek,
      type: 'abs',
      title: 'Abs',
      exercises: opts.abs,
    });
  }
  if (opts.cardio) {
    workouts.push({
      id: `summer-body-w${week}-d${dayInWeek}-cardio`,
      week,
      dayInWeek,
      type: 'cardio',
      title: 'Cardio',
      exercises: [],
      freeText: opts.cardio,
    });
  }
  return { week, dayInWeek, workouts };
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE A — Weeks 1-4 (foundation)
// ════════════════════════════════════════════════════════════════════════════

function pAGlutesAbs(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('Hip Thrusts', 3, '10'),
      ex('Seated Hip Abductions', 3, '10'),
      ex('Cable Step Up', 3, '8'),
      ex('Cable Kickbacks', 3, '8'),
      ex('Cable Ab Crunch', 3, '8'),
      ex('Hanging Knee Raise', 3, '8'),
    ];
  }
  if (week === 2) {
    return [
      ex('Hip Thrusts', 3, '12'),
      ex('Seated Hip Abductions', 3, '12'),
      ex('Cable Step Up', 3, '10'),
      ex('Cable Kickbacks', 3, '10'),
      ex('Cable Ab Crunch', 3, '10'),
      ex('Hanging Knee Raise', 3, '10'),
    ];
  }
  // weeks 3 & 4 — same
  return [
    ex('Hip Thrusts', 3, '8'),
    ex('Seated Hip Abductions', 3, '10'),
    ex('Cable Step Up', 3, '10'),
    ex('Cable Kickbacks', 3, '10'),
    ex('Cable Ab Crunch', 3, '10'),
    ex('Hanging Knee Raise', 3, '10'),
  ];
}

function pAUpperBack(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('Lat Pull Down', 3, '8'),
      ex('Bent Over Row', 3, '8'),
      ex('Face Pull', 3, '8'),
      ex('Seated Cable Row', 3, '10'),
      ex('BB Standing Bicep Curl', 3, '8'),
      ex('Cable Bicep Curl', 3, '10'),
    ];
  }
  if (week === 2) {
    return [
      ex('Lat Pull Down', 3, '10'),
      ex('Bent Over Row', 3, '10'),
      ex('Face Pull', 3, '10'),
      ex('Seated Cable Row', 3, '12'),
      ex('BB Standing Bicep Curl', 3, '10'),
      ex('Cable Bicep Curl', 3, '10'),
    ];
  }
  // weeks 3 & 4 — same
  return [
    ex('Lat Pull Down', 3, '10'),
    ex('Bent Over Row', 3, '8'),
    ex('Face Pull', 3, '10'),
    ex('Seated Cable Row', 3, '10'),
    ex('BB Standing Bicep Curl', 3, '8'),
    ex('Cable Bicep Curl', 3, '8'),
  ];
}

function pAGlutesHams(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('Hip Thrusts', 3, '10'),
      ex('BB RDL', 3, '10'),
      ex('Lying Leg Curl', 3, '8'),
      ex('Back Extension', 3, '8'),
      ex('Hip Abductions', 3, '10'),
    ];
  }
  if (week === 2) {
    return [
      ex('Hip Thrusts', 3, '12'),
      ex('BB RDL', 3, '10'),
      ex('Lying Leg Curl', 3, '10'),
      ex('Back Extension', 3, '10'),
      ex('Hip Abductions', 3, '12'),
    ];
  }
  // weeks 3 & 4
  return [
    ex('Hip Thrusts', 3, '8'),
    ex('BB RDL', 3, '8'),
    ex('Lying Leg Curl', 3, '10'),
    ex('Back Extension', 3, '10'),
    ex('Hip Abductions', 3, '10'),
  ];
}

function pAUpper(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('Shoulder Press', 3, '8'),
      ex('Reverse Fly', 3, '8'),
      ex('Face Pull', 3, '10'),
      ex('Lateral Raise', 3, '8'),
      ex('DB Bicep Curl', 3, '8'),
      ex('Tricep Pushdown', 3, '8'),
    ];
  }
  if (week === 2) {
    return [
      ex('Shoulder Press', 3, '10'),
      ex('Reverse Fly', 3, '12'),
      ex('Face Pull', 3, '12'),
      ex('Lateral Raise', 3, '10'),
      ex('DB Bicep Curl', 3, '10'),
      ex('Tricep Pushdown', 3, '10'),
    ];
  }
  // weeks 3 & 4 — same as W2
  return [
    ex('Shoulder Press', 3, '10'),
    ex('Reverse Fly', 3, '12'),
    ex('Face Pull', 3, '12'),
    ex('Lateral Raise', 3, '10'),
    ex('DB Bicep Curl', 3, '10'),
    ex('Tricep Pushdown', 3, '10'),
  ];
}

function pAQuadsAbs(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('BB Back Squat', 3, '10'),
      ex('Walking Lunge', 3, '8'),
      ex('Leg Extension', 3, '8'),
      ex('Cable Ab Crunch', 3, '8'),
      ex('Plank Hold', 3, '60 sec', { supersetGroup: 1 }),
      ex('Hanging Knee Raise', 3, '8', { supersetGroup: 1 }),
    ];
  }
  if (week === 2) {
    return [
      ex('BB Back Squat', 3, '10'),
      ex('Walking Lunge', 3, '10'),
      ex('Leg Extension', 3, '10'),
      ex('Cable Ab Crunch', 3, '10'),
      ex('Plank Hold', 3, '70 sec', { supersetGroup: 1 }),
      ex('Hanging Knee Raise', 3, '10', { supersetGroup: 1 }),
    ];
  }
  // weeks 3 & 4 — same
  return [
    ex('BB Back Squat', 3, '8'),
    ex('Walking Lunge', 3, '8'),
    ex('Leg Extension', 3, '10'),
    ex('Cable Ab Crunch', 3, '10'),
    ex('Plank Hold', 3, '70 sec', { supersetGroup: 1 }),
    ex('Hanging Knee Raise', 3, '10', { supersetGroup: 1 }),
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE B — Weeks 5-8 (new exercises)
// ════════════════════════════════════════════════════════════════════════════

function pBGlutesAbs(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('Hip Thrusts', 3, '8'),
      ex('Smith Machine Reverse Lunge', 3, '10'),
      ex('Cable Step Up', 3, '10'),
      ex('Cable Kickbacks', 3, '10'),
      ex('Side Plank Twist With Rear Fly (DB)', 3, '10'),
      ex('Hanging Knee Oblique Raise', 3, '10'),
    ];
  }
  if (week === 6) {
    return [
      ex('Hip Thrusts', 3, '10'),
      ex('Smith Machine Reverse Lunge', 3, '10'),
      ex('Cable Step Up', 3, '10'),
      ex('Cable Kickbacks', 3, '12'),
      ex('Side Plank Twist With Rear Fly (DB)', 3, '12'),
      ex('Hanging Knee Oblique Raise', 3, '12'),
    ];
  }
  // weeks 7 & 8
  return [
    ex('Hip Thrusts', 3, '8'),
    ex('Smith Machine Reverse Lunge', 3, '8'),
    ex('Cable Step Up', 3, '8'),
    ex('Cable Kickbacks', 3, '12'),
    ex('Side Plank Twist With Rear Fly (DB)', 3, '12'),
    ex('Hanging Knee Oblique Raise', 3, '12'),
  ];
}

function pBUpperBack(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('Assisted Pull Up', 3, '6'),
      ex('Single Arm DB Row', 3, '8'),
      ex('Reverse Fly', 3, '10'),
      ex('Straight Arm Pulldown', 3, '10'),
      ex('BB Standing Bicep Curl', 3, '8'),
      ex('Cable Bicep Curl', 3, '8'),
    ];
  }
  if (week === 6) {
    return [
      ex('Assisted Pull Up', 3, '8'),
      ex('Single Arm DB Row', 3, '10'),
      ex('Reverse Fly', 3, '10'),
      ex('Straight Arm Pulldown', 3, '10'),
      ex('BB Standing Bicep Curl', 3, '10'),
      ex('Cable Bicep Curl', 3, '10'),
    ];
  }
  // weeks 7 & 8
  return [
    ex('Assisted Pull Up', 3, '8'),
    ex('Single Arm DB Row', 3, '10'),
    ex('Reverse Fly', 3, '10'),
    ex('Straight Arm Pulldown', 3, '8'),
    ex('BB Standing Bicep Curl', 3, '8'),
    ex('Cable Bicep Curl', 3, '8'),
  ];
}

function pBGlutesHams(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('Hip Thrusts', 3, '10'),
      ex('Smith Machine Good Mornings', 3, '8'),
      ex('Lying Leg Curl', 3, '10'),
      ex('Back Extension', 3, '10'),
      ex('B Stance RDL', 3, '10'),
    ];
  }
  if (week === 6) {
    return [
      ex('Hip Thrusts', 3, '10'),
      ex('Smith Machine Good Mornings', 3, '10'),
      ex('Lying Leg Curl', 3, '10'),
      ex('Back Extension', 3, '12'),
      ex('B Stance RDL', 3, '10'),
    ];
  }
  // weeks 7 & 8
  return [
    ex('Hip Thrusts', 3, '8'),
    ex('Smith Machine Good Mornings', 3, '10'),
    ex('Lying Leg Curl', 3, '8'),
    ex('Back Extension', 3, '12'),
    ex('B Stance RDL', 3, '8'),
  ];
}

function pBUpper(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('Shoulder Press', 3, '10'),
      ex('Chest Press Machine', 3, '8'),
      ex('Iso Lateral High Row', 3, '10'),
      ex('Lateral Raise To Front Raise', 3, '6'),
      ex('Alternating DB Bicep Curl', 3, '10'),
      ex('Overhead Tricep Extension', 3, '10'),
    ];
  }
  if (week === 6) {
    return [
      ex('Shoulder Press', 3, '10'),
      ex('Chest Press Machine', 3, '10'),
      ex('Iso Lateral High Row', 3, '10'),
      ex('Lateral Raise To Front Raise', 3, '8'),
      ex('Alternating DB Bicep Curl', 3, '10'),
      ex('Overhead Tricep Extension', 3, '10'),
    ];
  }
  // weeks 7 & 8
  return [
    ex('Shoulder Press', 3, '8'),
    ex('Chest Press Machine', 3, '10'),
    ex('Iso Lateral High Row', 3, '8'),
    ex('Lateral Raise To Front Raise', 3, '8'),
    ex('Alternating DB Bicep Curl', 3, '10'),
    ex('Overhead Tricep Extension', 3, '10'),
  ];
}

function pBQuadsAbs(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('BB Pendulum Squat', 3, '8'),
      ex('Smith Machine Bulgarian Split Squat', 3, '10'),
      ex('Seated Leg Press', 3, '8'),
      ex('Leg Extension', 3, '10'),
      ex('Decline Crunch', 3, '6', { supersetGroup: 1 }),
      ex('Hanging Oblique Knee Raise', 3, '10', { supersetGroup: 1 }),
    ];
  }
  if (week === 6) {
    return [
      ex('BB Pendulum Squat', 3, '10'),
      ex('Smith Machine Bulgarian Split Squat', 3, '10'),
      ex('Seated Leg Press', 3, '10'),
      ex('Leg Extension', 3, '10'),
      ex('Decline Crunch', 3, '8', { supersetGroup: 1 }),
      ex('Hanging Oblique Knee Raise', 3, '12', { supersetGroup: 1 }),
    ];
  }
  // weeks 7 & 8
  return [
    ex('BB Pendulum Squat', 3, '10'),
    ex('Smith Machine Bulgarian Split Squat', 3, '8'),
    ex('Seated Leg Press', 3, '10'),
    ex('Leg Extension', 3, '10'),
    ex('Decline Crunch', 3, '8', { supersetGroup: 1 }),
    ex('Hanging Oblique Knee Raise', 3, '12', { supersetGroup: 1 }),
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE C — Weeks 9-12 (new program)
// ════════════════════════════════════════════════════════════════════════════

function pCGlutesAbs(week: number): ProgramExercise[] {
  if (week === 9 || week === 10) {
    return [
      ex('Hip Thrusts', 4, '8'),
      ex('Hip Abductions', 3, '8'),
      ex('Cable Step Up', 3, '8'),
      ex('Back Extension', 3, '12'),
      ex('Dead Bug', 3, '10'),
      ex('Hanging Leg Raise', 3, '8'),
    ];
  }
  // weeks 11 & 12
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('Hip Abductions', 3, '10'),
    ex('Cable Step Up', 3, '10'),
    ex('Back Extension', 3, '12'),
    ex('Dead Bug', 3, '12'),
    ex('Hanging Leg Raise', 3, '10'),
  ];
}

function pCUpperBack(week: number): ProgramExercise[] {
  if (week === 9 || week === 10) {
    return [
      ex('Seated Cable Row', 3, '8'),
      ex('T Bar Row', 3, '8'),
      ex('Seated Face Pull', 3, '10'),
      ex('Lateral Raise Machine', 3, '8'),
      ex('Hammer Curl', 3, '8', { supersetGroup: 1 }),
      ex('Seated Bicep Curl', 3, '8', { supersetGroup: 1 }),
    ];
  }
  // weeks 11 & 12
  return [
    ex('Seated Cable Row', 3, '10'),
    ex('T Bar Row', 3, '8'),
    ex('Seated Face Pull', 3, '10'),
    ex('Lateral Raise Machine', 3, '8'),
    ex('Hammer Curl', 3, '8', { supersetGroup: 1 }),
    ex('Seated Bicep Curl', 3, '8', { supersetGroup: 1 }),
  ];
}

function pCGlutesHams(week: number): ProgramExercise[] {
  if (week === 9 || week === 10) {
    return [
      ex('Hip Thrusts', 3, '8'),
      ex('Deficit Reverse Lunge', 3, '10'),
      ex('Cable Step Up', 3, '8'),
      ex('Seated Leg Curl', 3, '8'),
      ex('DB RDL', 3, '8'),
    ];
  }
  // weeks 11 & 12
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('Deficit Reverse Lunge', 3, '10'),
    ex('Cable Step Up', 3, '8'),
    ex('Seated Leg Curl', 3, '8'),
    ex('DB RDL', 3, '8'),
  ];
}

function pCUpper(week: number): ProgramExercise[] {
  if (week === 9) {
    return [
      ex('Shoulder Press Machine', 3, '8'),
      ex('Incline DB Chest Press', 3, '8'),
      ex('Single Arm DB Row', 3, '8'),
      ex('Cable Lateral Raise', 3, '8'),
      ex('Alternating DB Bicep Curl', 3, '10'),
    ];
  }
  if (week === 10) {
    return [
      ex('Shoulder Press Machine', 3, '8'),
      ex('Incline DB Chest Press', 3, '8'),
      ex('Single Arm DB Row', 3, '8'),
      ex('Cable Lateral Raise', 3, '8'),
      ex('Alternating DB Bicep Curl', 3, '10'),
    ];
  }
  // weeks 11 & 12
  return [
    ex('Shoulder Press Machine', 3, '8'),
    ex('Incline DB Chest Press', 3, '8'),
    ex('Single Arm DB Row', 3, '10'),
    ex('Cable Lateral Raise', 3, '10'),
    ex('Alternating DB Bicep Curl', 3, '10'),
  ];
}

function pCQuadsAbs(week: number): ProgramExercise[] {
  if (week === 9 || week === 10) {
    return [
      ex('Hack Squat', 3, '10'),
      ex('Goblet Squat', 3, '8'),
      ex('Single Leg Leg Press', 3, '8'),
      ex('Single Leg Extension', 3, '8'),
      ex('Cable Crunch', 3, '8'),
      ex('Hanging Leg Raise', 3, '8'),
    ];
  }
  // weeks 11 & 12
  return [
    ex('Hack Squat', 3, '10'),
    ex('Goblet Squat', 3, '10'),
    ex('Single Leg Leg Press', 3, '10'),
    ex('Single Leg Extension', 3, '10'),
    ex('Cable Crunch', 3, '10'),
    ex('Hanging Leg Raise', 3, '8'),
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// Week builder — picks the right phase and assembles all 6 days
// ════════════════════════════════════════════════════════════════════════════

function buildSummerWeek(week: number): ProgramDay[] {
  let glutesAbs: ProgramExercise[];
  let upperBack: ProgramExercise[];
  let glutesHams: ProgramExercise[];
  let upper: ProgramExercise[];
  let quadsAbs: ProgramExercise[];

  if (week <= 4) {
    glutesAbs = pAGlutesAbs(week);
    upperBack = pAUpperBack(week);
    glutesHams = pAGlutesHams(week);
    upper = pAUpper(week);
    quadsAbs = pAQuadsAbs(week);
  } else if (week <= 8) {
    glutesAbs = pBGlutesAbs(week);
    upperBack = pBUpperBack(week);
    glutesHams = pBGlutesHams(week);
    upper = pBUpper(week);
    quadsAbs = pBQuadsAbs(week);
  } else {
    glutesAbs = pCGlutesAbs(week);
    upperBack = pCUpperBack(week);
    glutesHams = pCGlutesHams(week);
    upper = pCUpper(week);
    quadsAbs = pCQuadsAbs(week);
  }

  return [
    buildDay(week, 1, 'lower', 'Glutes & Abs', glutesAbs),
    buildDay(week, 2, 'upper', 'Upper Body (Back)', upperBack, { cardio: CARDIO_30 }),
    buildDay(week, 3, 'lower', 'Glutes & Hamstrings', glutesHams),
    buildDay(week, 4, 'upper', 'Upper Body', upper, { cardio: CARDIO_30 }),
    buildDay(week, 5, 'lower', 'Quads & Abs', quadsAbs),
    buildDay(week, 6, 'cardio', 'Active Rest', [], { mainFreeText: ACTIVE_REST }),
  ];
}

const DAYS: ProgramDay[] = [];
for (let w = 1; w <= 12; w++) DAYS.push(...buildSummerWeek(w));

for (const day of DAYS) {
  for (const w of day.workouts) {
    const desc = SUMMER_BODY_DESCRIPTIONS[w.id];
    if (desc) w.description = desc;
  }
}

export const SUMMER_BODY_PROGRAM: Program = {
  id: 'summer-body',
  planId: 'summer-body',
  durationWeeks: 12,
  daysPerWeek: 6,
  defaultWeekdays: [1, 2, 3, 4, 5, 6],
  days: DAYS,
};

export default SUMMER_BODY_PROGRAM;
