import type { Program, ProgramDay, ProgramExercise, ProgramWorkout, WorkoutType } from './types';
import { PILATES_PRINCESS_DESCRIPTIONS } from './pilates-princess-descriptions';

const ex = (
  name: string,
  sets: number,
  reps: string,
  opts: { supersetGroup?: number; notes?: string } = {}
): ProgramExercise => ({ name, sets, reps, ...opts });

const PILATES_CLASS = '45-60 mins reformer or mat pilates class';
const CARDIO_30 = '30 mins cardio of choice';
const ABS_CORE_W1: ProgramExercise[] = [
  ex('Bicycle Crunches', 3, '12'),
  ex('Table Top Crunch', 3, '12'),
  ex('Plank with Twist', 3, '12'),
  ex('Heel Taps', 3, '12'),
];
const ABS_CORE_W5: ProgramExercise[] = [
  ex('Dead Bug', 3, '12'),
  ex('Elbow to Knee Crunch', 3, '12'),
  ex('Lying Leg Raise', 3, '12'),
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
    id: `pilates-princess-w${week}-d${dayInWeek}-main`,
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
      id: `pilates-princess-w${week}-d${dayInWeek}-abs`,
      week,
      dayInWeek,
      type: 'abs',
      title: 'Abs',
      exercises: opts.abs,
    });
  }
  if (opts.cardio) {
    workouts.push({
      id: `pilates-princess-w${week}-d${dayInWeek}-cardio`,
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

// ── Phase A (Weeks 1-4) — foundation glutes + upper ─────────────────────────

function phaseAGlutesW1(): ProgramExercise[] {
  return [
    ex('Hip Thrust (Barbell)', 3, '12', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Romanian Deadlift (Dumbbell)', 3, '10'),
    ex('Step Up (Dumbbell)', 3, '8', {
      notes:
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
    }),
    ex('Sumo Squat (Dumbbell)', 3, '10', {
      notes: 'Can be done with a barbell, dumbbell, any weight, or no weight at all.',
    }),
    ex('Seated Hip Abduction (Machine)', 3, '12'),
  ];
}

function phaseAGlutesW3(): ProgramExercise[] {
  return [
    ex('Hip Thrust (Barbell)', 4, '8', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Romanian Deadlift (Dumbbell)', 3, '12'),
    ex('Step Up (Dumbbell)', 3, '10', {
      notes:
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
    }),
    ex('Sumo Squat (Dumbbell)', 3, '12', {
      notes: 'Can be done with a barbell, dumbbell, any weight, or no weight at all.',
    }),
    ex('Seated Hip Abduction (Machine)', 3, '12'),
  ];
}

function phaseAGlutesW4(): ProgramExercise[] {
  return [
    ex('Hip Thrust (Barbell)', 4, '8', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Romanian Deadlift (Dumbbell)', 3, '10'),
    ex('Step Up (Dumbbell)', 3, '10', {
      notes:
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
    }),
    ex('Sumo Squat (Dumbbell)', 3, '12', {
      notes: 'Can be done with a barbell, dumbbell, any weight, or no weight at all.',
    }),
    ex('Seated Hip Abduction (Machine)', 3, '12'),
  ];
}

function phaseAUpperW1(): ProgramExercise[] {
  return [
    ex('Lat Pulldown', 3, '10'),
    ex('Face Pulls', 3, '12'),
    ex('Seated Shoulder Press (Dumbbell)', 3, '12'),
    ex('Standing Triceps Kickback (Dumbbell)', 3, '10'),
    ex('Lateral to Front Raise (Dumbbell)', 3, '8 each'),
    ex('Bicep Curl (Dumbbell)', 3, '10', { supersetGroup: 1 }),
    ex('Hammer Curl (Dumbbell)', 3, '10', { supersetGroup: 1 }),
  ];
}

function phaseAUpperW3(): ProgramExercise[] {
  return [
    ex('Lat Pulldown', 3, '12'),
    ex('Face Pulls', 3, '12'),
    ex('Seated Shoulder Press (Dumbbell)', 3, '12'),
    ex('Standing Triceps Kickback (Dumbbell)', 3, '12'),
    ex('Lateral to Front Raise (Dumbbell)', 3, '10 each'),
    ex('Bicep Curl (Dumbbell)', 3, '10', { supersetGroup: 1 }),
    ex('Hammer Curl (Dumbbell)', 3, '10', { supersetGroup: 1 }),
  ];
}

function phaseAUpperW4(): ProgramExercise[] {
  return [
    ex('Lat Pulldown', 3, '10'),
    ex('Face Pulls', 3, '12'),
    ex('Seated Shoulder Press (Dumbbell)', 3, '10'),
    ex('Standing Triceps Kickback (Dumbbell)', 3, '8'),
    ex('Lateral to Front Raise (Dumbbell)', 3, '10 each'),
    ex('Bicep Curl (Dumbbell)', 3, '10', { supersetGroup: 1 }),
    ex('Hammer Curl (Dumbbell)', 3, '10', { supersetGroup: 1 }),
  ];
}

function phaseAGlutesDay4W1(): ProgramExercise[] {
  return [
    ex('Hip Thrust (Barbell)', 3, '12', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Bulgarian Split Squats', 3, '8'),
    ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '10'),
    ex('Cable Kickbacks', 3, '12'),
    ex('Back Extensions (Hyperextension)', 3, '10', {
      notes: 'Hold onto a plate or dumbbell at your chest to increase difficulty.',
    }),
  ];
}

function phaseAGlutesDay4W3(): ProgramExercise[] {
  return [
    ex('Hip Thrust (Barbell)', 4, '8', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Bulgarian Split Squats', 3, '10'),
    ex('B-Stance Single Leg Deadlift (Dumbbell)', 3, '10'),
    ex('Cable Kickbacks', 3, '12'),
    ex('Back Extensions (Hyperextension)', 3, '12', {
      notes: 'Hold onto a plate or dumbbell at your chest to increase difficulty.',
    }),
  ];
}

// ── Phase B (Weeks 5-8) — exercise change ───────────────────────────────────

function phaseBGlutesHamsW5(): ProgramExercise[] {
  return [
    ex('Hip Thrust (Barbell)', 4, '8', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Deficit Reverse Lunge', 3, '8', { notes: 'Can also be done on the smith machine.' }),
    ex('Romanian Deadlift (Barbell)', 3, '8'),
    ex('Lying Leg Curl (Machine)', 3, '10', {
      notes: 'Any leg curl machine works. Use whichever your gym has.',
    }),
    ex('Seated Hip Abduction (Machine)', 3, '12'),
  ];
}

function phaseBGlutesHamsW7(): ProgramExercise[] {
  return [
    ex('Hip Thrust (Barbell)', 4, '10', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Deficit Reverse Lunge', 3, '10', { notes: 'Can also be done on the smith machine.' }),
    ex('Romanian Deadlift (Barbell)', 3, '10'),
    ex('Lying Leg Curl (Machine)', 3, '10', {
      notes: 'Any leg curl machine works. Use whichever your gym has.',
    }),
    ex('Seated Hip Abduction (Machine)', 3, '12'),
  ];
}

function phaseBUpperW5(): ProgramExercise[] {
  return [
    ex('Lat Pulldown', 3, '10'),
    ex('Seated Row (Cable)', 3, '10'),
    ex('Reverse Fly (Cable)', 3, '10'),
    ex('Triceps Extension (Dumbbell)', 3, '8'),
    ex('Standing Around World (Dumbbell)', 3, '10 each'),
    ex('Alternating Bicep Curl (Dumbbell)', 3, '10', { supersetGroup: 1 }),
    ex('Bicep Curl (Cable)', 3, '10', { supersetGroup: 1 }),
  ];
}

function phaseBUpperW7(): ProgramExercise[] {
  return [
    ex('Lat Pulldown', 3, '12'),
    ex('Seated Row (Cable)', 3, '12'),
    ex('Reverse Fly (Cable)', 3, '12'),
    ex('Triceps Extension (Dumbbell)', 3, '10'),
    ex('Standing Around World (Dumbbell)', 3, '12 each'),
    ex('Alternating Bicep Curl (Dumbbell)', 3, '10', { supersetGroup: 1 }),
    ex('Bicep Curl (Cable)', 3, '10', { supersetGroup: 1 }),
  ];
}

function phaseBGlutesDay4W5(): ProgramExercise[] {
  return [
    ex('Hip Thrust (Barbell)', 4, '8', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Good Morning (Barbell)', 3, '10'),
    ex('Step Up (Dumbbell)', 3, '10', {
      notes:
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
    }),
    ex('Cable Kickbacks', 3, '12'),
    ex('Seated Hip Abduction (Machine)', 3, '12'),
  ];
}

function phaseBGlutesDay4W7(): ProgramExercise[] {
  return [
    ex('Hip Thrust (Barbell)', 4, '10', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Good Morning (Barbell)', 3, '10'),
    ex('Step Up (Dumbbell)', 3, '10', {
      notes:
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
    }),
    ex('Cable Kickbacks', 3, '12'),
    ex('Seated Hip Abduction (Machine)', 3, '12'),
  ];
}

// ── Week assembler ──────────────────────────────────────────────────────────

function buildPilatesWeek(week: number): ProgramDay[] {
  let glutesDay1: ProgramExercise[];
  let upper: ProgramExercise[];
  let glutesDay4: ProgramExercise[];
  let absDay4: ProgramExercise[];

  if (week <= 2) {
    glutesDay1 = phaseAGlutesW1();
    upper = phaseAUpperW1();
    glutesDay4 = phaseAGlutesDay4W1();
    absDay4 = ABS_CORE_W1;
  } else if (week === 3) {
    glutesDay1 = phaseAGlutesW3();
    upper = phaseAUpperW3();
    glutesDay4 = phaseAGlutesDay4W3();
    absDay4 = ABS_CORE_W1;
  } else if (week === 4) {
    glutesDay1 = phaseAGlutesW4();
    upper = phaseAUpperW4();
    glutesDay4 = phaseAGlutesDay4W3();
    absDay4 = ABS_CORE_W1;
  } else if (week <= 6) {
    glutesDay1 = phaseBGlutesHamsW5();
    upper = phaseBUpperW5();
    glutesDay4 = phaseBGlutesDay4W5();
    absDay4 = ABS_CORE_W5;
  } else if (week === 7) {
    glutesDay1 = phaseBGlutesHamsW7();
    upper = phaseBUpperW7();
    glutesDay4 = phaseBGlutesDay4W7();
    absDay4 = ABS_CORE_W5;
  } else {
    // Week 8 — same as week 5 ("increase weights" cue)
    glutesDay1 = phaseBGlutesHamsW5();
    upper = phaseBUpperW5();
    glutesDay4 = phaseBGlutesDay4W5();
    absDay4 = ABS_CORE_W5;
  }

  // Day 5 (pilates) gets cardio addon from week 5 onward
  const day5Cardio = week >= 5 ? CARDIO_30 : undefined;

  return [
    buildDay(week, 1, 'lower', 'Glutes (Session 1)', glutesDay1, { cardio: CARDIO_30 }),
    buildDay(week, 2, 'full-body', 'Pilates (Session 1)', [], { mainFreeText: PILATES_CLASS }),
    buildDay(week, 3, 'upper', 'Upper', upper, { cardio: CARDIO_30 }),
    buildDay(week, 4, 'lower', 'Glutes (Session 2)', glutesDay4, { abs: absDay4 }),
    buildDay(week, 5, 'full-body', 'Pilates (Session 2)', [], {
      mainFreeText: PILATES_CLASS,
      cardio: day5Cardio,
    }),
  ];
}

const DAYS: ProgramDay[] = [];
for (let w = 1; w <= 8; w++) {
  DAYS.push(...buildPilatesWeek(w));
}

DAYS.forEach((day) => {
  day.workouts.forEach((w) => {
    w.description = PILATES_PRINCESS_DESCRIPTIONS[w.id];
    if (!w.description) {
      console.warn(`[pilates-princess] missing description for ${w.id}`);
    }
  });
});

export const PILATES_PRINCESS_PROGRAM: Program = {
  id: 'pilates-princess',
  planId: 'pilates-princess',
  durationWeeks: 8,
  daysPerWeek: 5,
  defaultWeekdays: [1, 2, 3, 5, 6], // Mon, Tue, Wed, Fri, Sat
  days: DAYS,
};

export default PILATES_PRINCESS_PROGRAM;
