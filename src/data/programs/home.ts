import type { Program, ProgramDay, ProgramExercise, ProgramWorkout, WorkoutType } from './types';
import { HOME_DESCRIPTIONS } from './home-descriptions';

const ex = (name: string, sets: number, reps: string): ProgramExercise => ({ name, sets, reps });

const CARDIO_30 = '30 mins cardio of choice';

function buildDay(
  week: number,
  dayInWeek: number,
  type: WorkoutType,
  title: string,
  exercises: ProgramExercise[],
  opts: { abs?: ProgramExercise[]; cardio?: string } = {}
): ProgramDay {
  const workouts: ProgramWorkout[] = [
    {
      id: `home-w${week}-d${dayInWeek}-main`,
      week,
      dayInWeek,
      type,
      title,
      exercises,
    },
  ];
  if (opts.abs && opts.abs.length > 0) {
    workouts.push({
      id: `home-w${week}-d${dayInWeek}-abs`,
      week,
      dayInWeek,
      type: 'abs',
      title: 'Abs',
      exercises: opts.abs,
    });
  }
  if (opts.cardio) {
    workouts.push({
      id: `home-w${week}-d${dayInWeek}-cardio`,
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

// ── Phase A (Weeks 1-4) — DB and bodyweight foundation ──────────────────────

function phaseAGlutes(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('DB RDL', 3, '10'),
      ex('Sumo Squat', 3, '12'),
      ex('Single Leg Hip Thrust (DB)', 3, '10'),
      ex('Reverse Lunge (DB)', 3, '8'),
    ];
  }
  if (week === 2 || week === 3) {
    return [
      ex('DB RDL', 3, '12'),
      ex('Sumo Squat', 3, '15'),
      ex('Single Leg Hip Thrust (DB)', 4, '8'),
      ex('Reverse Lunge (DB)', 3, '10'),
    ];
  }
  // week 4 — increase sets
  return [
    ex('DB RDL', 4, '8'),
    ex('Sumo Squat', 4, '10'),
    ex('Single Leg Hip Thrust (DB)', 4, '8'),
    ex('Reverse Lunge (DB)', 3, '10'),
  ];
}

function phaseAAbsCardioDay2(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('Dead Bug', 3, '10'),
      ex('Heel Taps', 3, '12'),
      ex('Reverse Crunch', 3, '10'),
      ex('Bicycle Crunch', 3, '10'),
    ];
  }
  // weeks 2-4
  return [
    ex('Dead Bug', 3, '12'),
    ex('Heel Taps', 3, '15'),
    ex('Reverse Crunch', 3, '12'),
    ex('Bicycle Crunch', 3, '12'),
  ];
}

function phaseAUpper(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('Shoulder Press', 3, '10'),
      ex('Single Arm Dumbbell Row', 3, '10'),
      ex('Lateral Raise', 3, '10'),
      ex('Bicep Curl', 3, '10'),
      ex('Tricep Kickback', 3, '10'),
    ];
  }
  if (week === 2 || week === 3) {
    return [
      ex('Shoulder Press', 3, '12'),
      ex('Single Arm Dumbbell Row', 3, '12'),
      ex('Lateral Raise', 3, '12'),
      ex('Bicep Curl', 3, '12'),
      ex('Tricep Kickback', 3, '12'),
    ];
  }
  // week 4
  return [
    ex('Shoulder Press', 4, '8'),
    ex('Single Arm Dumbbell Row', 4, '10'),
    ex('Lateral Raise', 4, '10'),
    ex('Bicep Curl', 4, '10'),
    ex('Tricep Kickback', 3, '12'),
  ];
}

function phaseAAbsCardioDay4(week: number): ProgramExercise[] {
  if (week <= 3) {
    return [
      ex('Mountain Climber', 2, '12'),
      ex('Ab Crunch', 2, '10'),
      ex('Elbow To Knee Crunch', 2, '10'),
      ex('Plank Hold', 3, week === 3 ? '70 sec' : '60 sec'),
    ];
  }
  // week 4
  return [
    ex('Mountain Climber', 2, '12'),
    ex('Ab Crunch', 3, '10'),
    ex('Elbow To Knee Crunch', 3, '10'),
    ex('Plank Hold', 3, '80 sec'),
  ];
}

function phaseALower(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('Goblet Squat (DB)', 3, '10'),
      ex('Single Leg RDL', 3, '10'),
      ex('Single Leg Standing Calf Raise', 3, '10'),
      ex('BB Good Mornings', 3, '8'),
      ex('Split Squat (DB)', 3, '8'),
    ];
  }
  if (week === 2 || week === 3) {
    return [
      ex('Goblet Squat (DB)', 3, '12'),
      ex('Single Leg RDL', 3, '12'),
      ex('Single Leg Standing Calf Raise', 3, '12'),
      ex('BB Good Mornings', 3, '10'),
      ex('Split Squat (DB)', 3, '10'),
    ];
  }
  // week 4
  return [
    ex('Goblet Squat (DB)', 4, '10'),
    ex('Single Leg RDL', 4, '10'),
    ex('Single Leg Standing Calf Raise', 3, '12'),
    ex('BB Good Mornings', 3, '12'),
    ex('Split Squat (DB)', 4, '8'),
  ];
}

// ── Phase B (Weeks 5-8) — BB exercises introduced ───────────────────────────

function phaseBGlutes(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('BB RDL', 3, '8'),
      ex('Single Leg Squat', 3, '6'),
      ex('Step Up (DB)', 3, '8'),
      ex('Lunge (DB)', 3, '10'),
    ];
  }
  if (week === 6 || week === 7) {
    return [
      ex('BB RDL', 3, '10'),
      ex('Single Leg Squat', 3, '8'),
      ex('Step Up (DB)', 3, '8'),
      ex('Lunge (DB)', 3, '10'),
    ];
  }
  // week 8
  return [
    ex('BB RDL', 3, '10'),
    ex('Single Leg Squat', 3, '10'),
    ex('Step Up (DB)', 3, '10'),
    ex('Lunge (DB)', 3, '12'),
  ];
}

function phaseBAbsCardioDay2(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('Russian Twist (Legs Up)', 3, '8'),
      ex('Lying Leg Raise', 3, '8'),
      ex('Otis Up', 3, '8'),
    ];
  }
  if (week === 6 || week === 7) {
    return [
      ex('Russian Twist (Legs Up)', 3, '10'),
      ex('Lying Leg Raise', 3, '10'),
      ex('Otis Up', 3, '8'),
    ];
  }
  // week 8
  return [
    ex('Russian Twist (Legs Up)', 3, '12'),
    ex('Lying Leg Raise', 3, '10'),
    ex('Otis Up', 3, '8'),
  ];
}

function phaseBUpper(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('BB Bent Over Row', 3, '8'),
      ex('Incline Push Up', 3, '6'),
      ex('Standing Around The World', 3, '6'),
      ex('Hammer Curl', 3, '12'),
      ex('Tricep Dip', 3, '8'),
    ];
  }
  if (week === 6) {
    return [
      ex('BB Bent Over Row', 3, '8'),
      ex('Incline Push Up', 3, '8'),
      ex('Standing Around The World', 3, '8'),
      ex('Hammer Curl', 3, '12'),
      ex('Tricep Dip', 3, '10'),
    ];
  }
  if (week === 7) {
    return [
      ex('BB Bent Over Row', 3, '10'),
      ex('Incline Push Up', 3, '8'),
      ex('Standing Around The World', 3, '8'),
      ex('Hammer Curl', 3, '12'),
      ex('Tricep Dip', 3, '10'),
    ];
  }
  // week 8
  return [
    ex('BB Bent Over Row', 3, '10'),
    ex('Incline Push Up', 3, '10'),
    ex('Standing Around The World', 3, '10'),
    ex('Hammer Curl', 3, '12'),
    ex('Tricep Dip', 3, '10'),
  ];
}

function phaseBAbsCardioDay4(week: number): ProgramExercise[] {
  const plankSec = week === 5 ? '60 sec' : week === 6 ? '70 sec' : week === 7 ? '80 sec' : '90 sec';
  const sidePlankSec =
    week === 5 ? '30 sec' : week === 6 ? '40 sec' : week === 7 ? '50 sec' : '60 sec';
  const tableTopSets = week <= 6 ? 2 : 3;
  return [
    ex('Weighted Plank', 3, plankSec),
    ex('Side Plank', 3, sidePlankSec),
    ex('Weighted Table Top Crunch', tableTopSets, '10'),
  ];
}

function phaseBLower(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('BB Back Squat', 3, '10'),
      ex('B Stance RDL', 3, '8'),
      ex('Standing Calf Raise (DB)', 3, '10'),
      ex('BB Lateral Lunge', 3, '6'),
      ex('Bulgarian Split Squat (DB)', 3, '10'),
    ];
  }
  if (week === 6) {
    return [
      ex('BB Back Squat', 3, '10'),
      ex('B Stance RDL', 3, '8'),
      ex('Standing Calf Raise (DB)', 3, '10'),
      ex('BB Lateral Lunge', 3, '8'),
      ex('Bulgarian Split Squat (DB)', 3, '10'),
    ];
  }
  if (week === 7) {
    return [
      ex('BB Back Squat', 3, '10'),
      ex('B Stance RDL', 3, '10'),
      ex('Standing Calf Raise (DB)', 3, '12'),
      ex('BB Lateral Lunge', 3, '10'),
      ex('Bulgarian Split Squat (DB)', 3, '10'),
    ];
  }
  // week 8
  return [
    ex('BB Back Squat', 3, '12'),
    ex('B Stance RDL', 3, '10'),
    ex('Standing Calf Raise (DB)', 3, '12'),
    ex('BB Lateral Lunge', 3, '10'),
    ex('Bulgarian Split Squat (DB)', 3, '12'),
  ];
}

function buildHomeWeek(week: number): ProgramDay[] {
  const isPhaseA = week <= 4;
  const glutes = isPhaseA ? phaseAGlutes(week) : phaseBGlutes(week);
  const absDay2 = isPhaseA ? phaseAAbsCardioDay2(week) : phaseBAbsCardioDay2(week);
  const upper = isPhaseA ? phaseAUpper(week) : phaseBUpper(week);
  const absDay4 = isPhaseA ? phaseAAbsCardioDay4(week) : phaseBAbsCardioDay4(week);
  const lower = isPhaseA ? phaseALower(week) : phaseBLower(week);
  return [
    buildDay(week, 1, 'lower', 'Glutes', glutes),
    buildDay(week, 2, 'abs', 'Abs & Cardio (Session 1)', absDay2, { cardio: CARDIO_30 }),
    buildDay(week, 3, 'upper', 'Upper Body', upper),
    buildDay(week, 4, 'abs', 'Abs & Cardio (Session 2)', absDay4, { cardio: CARDIO_30 }),
    buildDay(week, 5, 'lower', 'Lower Body', lower),
  ];
}

const DAYS: ProgramDay[] = [];
for (let w = 1; w <= 8; w++) DAYS.push(...buildHomeWeek(w));

for (const day of DAYS) {
  for (const w of day.workouts) {
    const desc = HOME_DESCRIPTIONS[w.id];
    if (desc) w.description = desc;
  }
}

export const HOME_PROGRAM: Program = {
  id: 'home',
  planId: 'home',
  durationWeeks: 8,
  daysPerWeek: 5,
  defaultWeekdays: [1, 2, 3, 4, 5],
  days: DAYS,
};

export default HOME_PROGRAM;
