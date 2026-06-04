import type { Program, ProgramDay, ProgramExercise, ProgramWorkout, WorkoutType } from './types';
import { HOME_DESCRIPTIONS } from './home-descriptions';

const ex = (name: string, sets: number, reps: string, notes?: string): ProgramExercise =>
  notes ? { name, sets, reps, notes } : { name, sets, reps };

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
      ex('Romanian Deadlift (Dumbbell)', 3, '10'),
      ex(
        'Sumo Squat (Dumbbell)',
        3,
        '12',
        'Can be done with a barbell, dumbbell, any weight, or no weight at all.'
      ),
      ex('Single Leg Hip Thrust (Dumbbell)', 3, '10'),
      ex('Reverse Lunge (Dumbbell)', 3, '8', 'Can be done with any weight or no weight at all.'),
    ];
  }
  if (week === 2 || week === 3) {
    return [
      ex('Romanian Deadlift (Dumbbell)', 3, '12'),
      ex(
        'Sumo Squat (Dumbbell)',
        3,
        '15',
        'Can be done with a barbell, dumbbell, any weight, or no weight at all.'
      ),
      ex('Single Leg Hip Thrust (Dumbbell)', 4, '8'),
      ex('Reverse Lunge (Dumbbell)', 3, '10', 'Can be done with any weight or no weight at all.'),
    ];
  }
  // week 4 — increase sets
  return [
    ex('Romanian Deadlift (Dumbbell)', 4, '8'),
    ex(
      'Sumo Squat (Dumbbell)',
      4,
      '10',
      'Can be done with a barbell, dumbbell, any weight, or no weight at all.'
    ),
    ex('Single Leg Hip Thrust (Dumbbell)', 4, '8'),
    ex('Reverse Lunge (Dumbbell)', 3, '10', 'Can be done with any weight or no weight at all.'),
  ];
}

function phaseAAbsCardioDay2(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('Dead Bug', 3, '10'),
      ex('Heel Taps', 3, '12'),
      ex('Reverse Crunch', 3, '10'),
      ex('Bicycle Crunches', 3, '10'),
    ];
  }
  // weeks 2-4
  return [
    ex('Dead Bug', 3, '12'),
    ex('Heel Taps', 3, '15'),
    ex('Reverse Crunch', 3, '12'),
    ex('Bicycle Crunches', 3, '12'),
  ];
}

function phaseAUpper(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex('Standing Shoulder Press (Dumbbell)', 3, '10'),
      ex('Single Arm Row (Dumbbell)', 3, '10'),
      ex('Lateral Raise (Dumbbell)', 3, '10'),
      ex('Bicep Curl (Dumbbell)', 3, '10'),
      ex('Standing Triceps Kickback (Dumbbell)', 3, '10'),
    ];
  }
  if (week === 2 || week === 3) {
    return [
      ex('Standing Shoulder Press (Dumbbell)', 3, '12'),
      ex('Single Arm Row (Dumbbell)', 3, '12'),
      ex('Lateral Raise (Dumbbell)', 3, '12'),
      ex('Bicep Curl (Dumbbell)', 3, '12'),
      ex('Standing Triceps Kickback (Dumbbell)', 3, '12'),
    ];
  }
  // week 4
  return [
    ex('Standing Shoulder Press (Dumbbell)', 4, '8'),
    ex('Single Arm Row (Dumbbell)', 4, '10'),
    ex('Lateral Raise (Dumbbell)', 4, '10'),
    ex('Bicep Curl (Dumbbell)', 4, '10'),
    ex('Standing Triceps Kickback (Dumbbell)', 3, '12'),
  ];
}

function phaseAAbsCardioDay4(week: number): ProgramExercise[] {
  if (week <= 3) {
    return [
      ex('Mountain Climber', 2, '12'),
      ex('Ab Crunch', 2, '10'),
      ex('Elbow to Knee Crunch', 2, '10'),
      ex('Plank', 3, week === 3 ? '70 sec' : '60 sec'),
    ];
  }
  // week 4
  return [
    ex('Mountain Climber', 2, '12'),
    ex('Ab Crunch', 3, '10'),
    ex('Elbow to Knee Crunch', 3, '10'),
    ex('Plank', 3, '80 sec'),
  ];
}

function phaseALower(week: number): ProgramExercise[] {
  if (week === 1) {
    return [
      ex(
        'Goblet Squat (Dumbbell)',
        3,
        '10',
        'These can be done with a dumbbell, kettlebell, plate, or without weight.'
      ),
      ex('Single Leg Romanian Deadlift (Dumbbell)', 3, '10'),
      ex('Single Leg Standing Calf Raise', 3, '10'),
      ex('Good Morning (Barbell)', 3, '8'),
      ex('Bulgarian Split Squat (Dumbbell)', 3, '8'),
    ];
  }
  if (week === 2 || week === 3) {
    return [
      ex(
        'Goblet Squat (Dumbbell)',
        3,
        '12',
        'These can be done with a dumbbell, kettlebell, plate, or without weight.'
      ),
      ex('Single Leg Romanian Deadlift (Dumbbell)', 3, '12'),
      ex('Single Leg Standing Calf Raise', 3, '12'),
      ex('Good Morning (Barbell)', 3, '10'),
      ex('Bulgarian Split Squat (Dumbbell)', 3, '10'),
    ];
  }
  // week 4
  return [
    ex(
      'Goblet Squat (Dumbbell)',
      4,
      '10',
      'These can be done with a dumbbell, kettlebell, plate, or without weight.'
    ),
    ex('Single Leg Romanian Deadlift (Dumbbell)', 4, '10'),
    ex('Single Leg Standing Calf Raise', 3, '12'),
    ex('Good Morning (Barbell)', 3, '12'),
    ex('Bulgarian Split Squat (Dumbbell)', 4, '8'),
  ];
}

// ── Phase B (Weeks 5-8) — BB exercises introduced ───────────────────────────

function phaseBGlutes(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('Romanian Deadlift (Barbell)', 3, '8'),
      ex('Single Leg Squat (Dumbbell)', 3, '6', 'Can be done with any weight or no weight at all.'),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Lunge (Dumbbell)', 3, '10'),
    ];
  }
  if (week === 6 || week === 7) {
    return [
      ex('Romanian Deadlift (Barbell)', 3, '10'),
      ex('Single Leg Squat (Dumbbell)', 3, '8', 'Can be done with any weight or no weight at all.'),
      ex(
        'Step Up (Dumbbell)',
        3,
        '8',
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
      ),
      ex('Lunge (Dumbbell)', 3, '10'),
    ];
  }
  // week 8
  return [
    ex('Romanian Deadlift (Barbell)', 3, '10'),
    ex('Single Leg Squat (Dumbbell)', 3, '10', 'Can be done with any weight or no weight at all.'),
    ex(
      'Step Up (Dumbbell)',
      3,
      '10',
      'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
    ),
    ex('Lunge (Dumbbell)', 3, '12'),
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
      ex('Bent Over Row (Barbell)', 3, '8'),
      ex('Incline Push Up', 3, '6'),
      ex('Standing Around World (Dumbbell)', 3, '6'),
      ex('Hammer Curl (Dumbbell)', 3, '12'),
      ex('Assisted Triceps Dip', 3, '8'),
    ];
  }
  if (week === 6) {
    return [
      ex('Bent Over Row (Barbell)', 3, '8'),
      ex('Incline Push Up', 3, '8'),
      ex('Standing Around World (Dumbbell)', 3, '8'),
      ex('Hammer Curl (Dumbbell)', 3, '12'),
      ex('Assisted Triceps Dip', 3, '10'),
    ];
  }
  if (week === 7) {
    return [
      ex('Bent Over Row (Barbell)', 3, '10'),
      ex('Incline Push Up', 3, '8'),
      ex('Standing Around World (Dumbbell)', 3, '8'),
      ex('Hammer Curl (Dumbbell)', 3, '12'),
      ex('Assisted Triceps Dip', 3, '10'),
    ];
  }
  // week 8
  return [
    ex('Bent Over Row (Barbell)', 3, '10'),
    ex('Incline Push Up', 3, '10'),
    ex('Standing Around World (Dumbbell)', 3, '10'),
    ex('Hammer Curl (Dumbbell)', 3, '12'),
    ex('Assisted Triceps Dip', 3, '10'),
  ];
}

function phaseBAbsCardioDay4(week: number): ProgramExercise[] {
  const plankSec = week === 5 ? '60 sec' : week === 6 ? '70 sec' : week === 7 ? '80 sec' : '90 sec';
  const sidePlankSec =
    week === 5 ? '30 sec' : week === 6 ? '40 sec' : week === 7 ? '50 sec' : '60 sec';
  const tableTopSets = week <= 6 ? 2 : 3;
  return [
    ex('Plank', 3, plankSec),
    ex('Side Plank', 3, sidePlankSec),
    ex('Table Top Crunch (Weighted)', tableTopSets, '10', 'Can be done with or without weight.'),
  ];
}

function phaseBLower(week: number): ProgramExercise[] {
  if (week === 5) {
    return [
      ex('Back Squat (Barbell)', 3, '10'),
      ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '8'),
      ex('Standing Calf Raise (Dumbbell)', 3, '10'),
      ex('Lateral Lunge (Barbell)', 3, '6'),
      ex('Bulgarian Split Squat (Dumbbell)', 3, '10'),
    ];
  }
  if (week === 6) {
    return [
      ex('Back Squat (Barbell)', 3, '10'),
      ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '8'),
      ex('Standing Calf Raise (Dumbbell)', 3, '10'),
      ex('Lateral Lunge (Barbell)', 3, '8'),
      ex('Bulgarian Split Squat (Dumbbell)', 3, '10'),
    ];
  }
  if (week === 7) {
    return [
      ex('Back Squat (Barbell)', 3, '10'),
      ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '10'),
      ex('Standing Calf Raise (Dumbbell)', 3, '12'),
      ex('Lateral Lunge (Barbell)', 3, '10'),
      ex('Bulgarian Split Squat (Dumbbell)', 3, '10'),
    ];
  }
  // week 8
  return [
    ex('Back Squat (Barbell)', 3, '12'),
    ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '10'),
    ex('Standing Calf Raise (Dumbbell)', 3, '12'),
    ex('Lateral Lunge (Barbell)', 3, '10'),
    ex('Bulgarian Split Squat (Dumbbell)', 3, '12'),
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
