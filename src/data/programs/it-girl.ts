import type { Program, ProgramDay, ProgramExercise, ProgramWorkout, WorkoutType } from './types';
import { IT_GIRL_DESCRIPTIONS } from './it-girl-descriptions';

const ex = (name: string, sets: number, reps: string, notes?: string): ProgramExercise =>
  notes ? { name, sets, reps, notes } : { name, sets, reps };

const CARDIO_20_30 = '20-30 mins of incline/fast walk, stair master or bike';
const ABS_DEFAULT: ProgramExercise[] = [
  ex('Dead Bug', 3, '10 each side'),
  ex('Plank', 3, '45 sec'),
  ex('Cable Crunch', 3, '12'),
  ex('Hanging Straight Leg Raise', 3, '10'),
];

function buildDay(
  week: number,
  dayInWeek: number,
  type: WorkoutType,
  title: string,
  exercises: ProgramExercise[],
  opts: { mainFreeText?: string; abs?: ProgramExercise[]; cardio?: string } = {}
): ProgramDay {
  const main: ProgramWorkout = {
    id: `it-girl-w${week}-d${dayInWeek}-main`,
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
      id: `it-girl-w${week}-d${dayInWeek}-abs`,
      week,
      dayInWeek,
      type: 'abs',
      title: 'Abs',
      exercises: opts.abs,
    });
  }
  if (opts.cardio) {
    workouts.push({
      id: `it-girl-w${week}-d${dayInWeek}-cardio`,
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

// ── Phase A (Weeks 1-6) — foundation ─────────────────────────────────────────

function phaseAGlutesHams(week: number): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      4,
      '10',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Romanian Deadlift (Barbell)', 3, '10'),
    ex(
      'Step Up (Dumbbell)',
      3,
      '8',
      'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
    ),
    ex('Bulgarian Split Squats', 3, '8'),
    ex('Cable Kickbacks', 4, '12'),
  ];
}

function phaseAUpperW1(): ProgramExercise[] {
  return [
    ex('Lat Pulldown', 3, '10'),
    ex('Seated Row (Cable)', 3, '10'),
    ex('Face Pulls', 3, '12'),
    ex('Shoulder Press (Machine)', 3, '10'),
    ex('Bicep Curl (Cable)', 3, '8'),
    ex('Triceps Pushdown', 3, '8'),
  ];
}

function phaseAUpperW4Plus(): ProgramExercise[] {
  return [
    ex('Lat Pulldown', 3, '12'),
    ex('Seated Row (Cable)', 3, '10'),
    ex('Face Pulls', 3, '12'),
    ex('Shoulder Press (Machine)', 3, '10'),
    ex('Bicep Curl (Cable)', 3, '10'),
    ex('Triceps Pushdown', 3, '10'),
  ];
}

function phaseAGlutesQuadsW1(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      3,
      '8',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Hack Squat', 3, '10'),
    ex('Walking Lunges', 3, '10'),
    ex('Leg Extension (Machine)', 3, '12'),
    ex('Seated Hip Abduction (Machine)', 3, '12'),
  ];
}

function phaseAGlutesQuadsW3(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      3,
      '10',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Hack Squat', 3, '10'),
    ex('Walking Lunges', 3, '10'),
    ex('Leg Extension (Machine)', 3, '12'),
    ex('Seated Hip Abduction (Machine)', 3, '12'),
  ];
}

function phaseAGlutesQuadsW4Plus(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      3,
      '12',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Hack Squat', 3, '10'),
    ex('Walking Lunges', 3, '10'),
    ex('Leg Extension (Machine)', 3, '12'),
    ex('Seated Hip Abduction (Machine)', 3, '12'),
  ];
}

function phaseAUpper2(): ProgramExercise[] {
  return [
    ex('Shoulder Press (Machine)', 3, '8'),
    ex('Straight Arm Pulldown', 3, '10', 'Feel free to use any attachment.'),
    ex('Reverse Fly (Cable)', 3, '10'),
    ex('Lateral to Front Raise (Dumbbell)', 3, '8'),
    ex('Bicep Curl (Barbell)', 3, '8'),
    ex('Overhead Triceps Extension (Cable)', 3, '10'),
  ];
}

// ── Phase B (Weeks 7-12) — new exercise pool ───────────────────────────────

function phaseBGlutesHams(): ProgramExercise[] {
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
      '10',
      'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
    ),
    ex(
      'Sumo Squat (Dumbbell)',
      3,
      '10',
      'Can be done with a barbell, dumbbell, any weight, or no weight at all.'
    ),
    ex(
      'Back Extensions (Hyperextension)',
      3,
      '10',
      'Hold onto a plate or dumbbell at your chest to increase difficulty.'
    ),
  ];
}

function phaseBGlutesHamsW9(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      4,
      '10',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Romanian Deadlift (Dumbbell)', 3, '12'),
    ex(
      'Step Up (Dumbbell)',
      3,
      '12',
      'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
    ),
    ex(
      'Sumo Squat (Dumbbell)',
      3,
      '10',
      'Can be done with a barbell, dumbbell, any weight, or no weight at all.'
    ),
    ex(
      'Back Extensions (Hyperextension)',
      3,
      '12',
      'Hold onto a plate or dumbbell at your chest to increase difficulty.'
    ),
  ];
}

function phaseBGlutesHamsW10Plus(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      3,
      '8',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Romanian Deadlift (Dumbbell)', 3, '10'),
    ex(
      'Step Up (Dumbbell)',
      3,
      '8',
      'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.'
    ),
    ex(
      'Sumo Squat (Dumbbell)',
      3,
      '10',
      'Can be done with a barbell, dumbbell, any weight, or no weight at all.'
    ),
    ex(
      'Back Extensions (Hyperextension)',
      3,
      '10',
      'Hold onto a plate or dumbbell at your chest to increase difficulty.'
    ),
  ];
}

function phaseBUpperPull(): ProgramExercise[] {
  return [
    ex('Assisted Pull Up', 3, '12'),
    ex('Single Arm Row (Dumbbell)', 3, '10'),
    ex('Half Kneeling Face Pull (Cable)', 3, '12'),
    ex('Arnold Press (Dumbbell)', 3, '10'),
    ex('Bicep Curl (Barbell)', 3, '10'),
    ex('Triceps Pushdown', 3, '10'),
  ];
}

function phaseBUpperPullW9(): ProgramExercise[] {
  return [
    ex('Assisted Pull Up', 3, '12'),
    ex('Single Arm Row (Dumbbell)', 3, '12'),
    ex('Half Kneeling Face Pull (Cable)', 3, '12'),
    ex('Arnold Press (Dumbbell)', 3, '10'),
    ex('Bicep Curl (Barbell)', 3, '10'),
    ex('Triceps Pushdown', 3, '10'),
  ];
}

function phaseBUpperPullW10Plus(): ProgramExercise[] {
  return [
    ex('Assisted Pull Up', 3, '6'),
    ex('Single Arm Row (Dumbbell)', 3, '8'),
    ex('Half Kneeling Face Pull (Cable)', 3, '10'),
    ex('Arnold Press (Dumbbell)', 3, '8'),
    ex('Bicep Curl (Barbell)', 3, '10'),
    ex('Triceps Pushdown', 3, '10'),
  ];
}

function phaseBGlutesQuads(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      4,
      '10',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Leg Press (Machine)', 3, '10'),
    ex('Lunge (Barbell)', 3, '10'),
    ex('Leg Extension (Machine)', 3, '12'),
    ex('Cable Kickbacks', 3, '12'),
    ex(
      'Goblet Squat (Dumbbell)',
      3,
      '10',
      'These can be done with a dumbbell, kettlebell, plate, or without weight.'
    ),
  ];
}

function phaseBGlutesQuadsW9(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      4,
      '10',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Leg Press (Machine)', 3, '10'),
    ex('Lunge (Barbell)', 3, '10'),
    ex('Leg Extension (Machine)', 3, '12'),
    ex('Cable Kickbacks', 3, '12'),
    ex(
      'Goblet Squat (Dumbbell)',
      3,
      '12',
      'These can be done with a dumbbell, kettlebell, plate, or without weight.'
    ),
  ];
}

function phaseBGlutesQuadsW10Plus(): ProgramExercise[] {
  return [
    ex(
      'Hip Thrust (Barbell)',
      3,
      '8',
      'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.'
    ),
    ex('Leg Press (Machine)', 3, '10'),
    ex('Lunge (Barbell)', 3, '8'),
    ex('Leg Extension (Machine)', 3, '10'),
    ex('Cable Kickbacks', 3, '8'),
    ex(
      'Goblet Squat (Dumbbell)',
      3,
      '10',
      'These can be done with a dumbbell, kettlebell, plate, or without weight.'
    ),
  ];
}

function phaseBUpper2(): ProgramExercise[] {
  return [
    ex('Shoulder Press (Machine)', 3, '8'),
    ex('Lat Pulldown (Machine)', 3, '10'),
    ex('Reverse Fly (Cable)', 3, '10'),
    ex('Lateral Raise (Cable)', 3, '8'),
    ex('Bicep Curl (Cable)', 3, '8'),
    ex('Triceps Extension (Machine)', 3, '10'),
  ];
}

function phaseBUpper2W10Plus(): ProgramExercise[] {
  return [
    ex('Shoulder Press (Machine)', 3, '10'),
    ex('Lat Pulldown (Machine)', 3, '10'),
    ex('Reverse Fly (Cable)', 3, '8'),
    ex('Lateral Raise (Cable)', 3, '8'),
    ex('Bicep Curl (Cable)', 3, '10'),
    ex('Triceps Extension (Machine)', 3, '10'),
  ];
}

// ── Week assembler ──────────────────────────────────────────────────────────

function buildITGirlWeek(week: number): ProgramDay[] {
  let glutesHams: ProgramExercise[];
  let upper1: ProgramExercise[];
  let glutesQuads: ProgramExercise[];
  let upper2: ProgramExercise[];

  if (week <= 2) {
    glutesHams = phaseAGlutesHams(week);
    upper1 = phaseAUpperW1();
    glutesQuads = phaseAGlutesQuadsW1();
    upper2 = phaseAUpper2();
  } else if (week === 3) {
    glutesHams = phaseAGlutesHams(week);
    upper1 = phaseAUpperW1();
    glutesQuads = phaseAGlutesQuadsW3();
    upper2 = phaseAUpper2();
  } else if (week <= 6) {
    glutesHams = phaseAGlutesHams(week);
    upper1 = phaseAUpperW4Plus();
    glutesQuads = phaseAGlutesQuadsW4Plus();
    upper2 = phaseAUpper2();
  } else if (week <= 8) {
    glutesHams = phaseBGlutesHams();
    upper1 = phaseBUpperPull();
    glutesQuads = phaseBGlutesQuads();
    upper2 = phaseBUpper2();
  } else if (week === 9) {
    glutesHams = phaseBGlutesHamsW9();
    upper1 = phaseBUpperPullW9();
    glutesQuads = phaseBGlutesQuadsW9();
    upper2 = phaseBUpper2();
  } else {
    // Weeks 10, 11, 12 — heavier
    glutesHams = phaseBGlutesHamsW10Plus();
    upper1 = phaseBUpperPullW10Plus();
    glutesQuads = phaseBGlutesQuadsW10Plus();
    upper2 = phaseBUpper2W10Plus();
  }

  return [
    buildDay(week, 1, 'lower', 'Glutes and Hamstrings', glutesHams, {
      cardio: CARDIO_20_30,
      abs: ABS_DEFAULT,
    }),
    buildDay(week, 2, 'upper', 'Upper Body (Session 1)', upper1, {
      cardio: CARDIO_20_30,
    }),
    buildDay(week, 3, 'lower', 'Glutes and Quads', glutesQuads),
    buildDay(week, 4, 'upper', 'Upper Body (Session 2)', upper2, {
      cardio: CARDIO_20_30,
    }),
    {
      week,
      dayInWeek: 5,
      workouts: [
        {
          id: `it-girl-w${week}-d5-abs`,
          week,
          dayInWeek: 5,
          type: 'abs',
          title: 'Abs',
          exercises: ABS_DEFAULT,
        },
        {
          id: `it-girl-w${week}-d5-cardio`,
          week,
          dayInWeek: 5,
          type: 'cardio',
          title: 'Cardio',
          exercises: [],
          freeText: CARDIO_20_30,
        },
      ],
    },
  ];
}

const DAYS: ProgramDay[] = [];
for (let w = 1; w <= 12; w++) {
  DAYS.push(...buildITGirlWeek(w));
}

DAYS.forEach((day) => {
  day.workouts.forEach((w) => {
    w.description = IT_GIRL_DESCRIPTIONS[w.id];
    if (!w.description) {
      console.warn(`[it-girl] missing description for ${w.id}`);
    }
  });
});

export const IT_GIRL_PROGRAM: Program = {
  id: 'it-girl',
  planId: 'it-girl',
  durationWeeks: 12,
  daysPerWeek: 5,
  defaultWeekdays: [1, 2, 3, 5, 6], // Mon, Tue, Wed, Fri, Sat
  days: DAYS,
};

export default IT_GIRL_PROGRAM;
