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
  ex('Bicycle crunch', 3, '12'),
  ex('Table top crunch', 3, '12'),
  ex('Plank + twists', 3, '12'),
  ex('Heel taps', 3, '12'),
];
const ABS_CORE_W5: ProgramExercise[] = [
  ex('Dead bugs', 3, '12'),
  ex('Elbow to knee crunch', 3, '12'),
  ex('Lying leg raise', 3, '12'),
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
    ex('Hip Thrusts', 3, '12'),
    ex('DB RDL', 3, '10'),
    ex('DB Step Up', 3, '8'),
    ex('Sumo Squat', 3, '10'),
    ex('Hip Abductors', 3, '12'),
  ];
}

function phaseAGlutesW3(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '8'),
    ex('DB RDL', 3, '12'),
    ex('DB Step Up', 3, '10'),
    ex('Sumo Squat', 3, '12'),
    ex('Hip Abductors', 3, '12'),
  ];
}

function phaseAGlutesW4(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '8'),
    ex('DB RDL', 3, '10'),
    ex('DB Step Up', 3, '10'),
    ex('Sumo Squat', 3, '12'),
    ex('Hip Abductors', 3, '12'),
  ];
}

function phaseAUpperW1(): ProgramExercise[] {
  return [
    ex('Lat Pull Down', 3, '10'),
    ex('Face Pull', 3, '12'),
    ex('Shoulder Press', 3, '12'),
    ex('Tricep Kickbacks', 3, '10'),
    ex('Lateral into Frontal Raises', 3, '8 each'),
    ex('Bicep Curl', 3, '10', { supersetGroup: 1 }),
    ex('Hammer Curl', 3, '10', { supersetGroup: 1 }),
  ];
}

function phaseAUpperW3(): ProgramExercise[] {
  return [
    ex('Lat Pull Down', 3, '12'),
    ex('Face Pull', 3, '12'),
    ex('Shoulder Press', 3, '12'),
    ex('Tricep Kickbacks', 3, '12'),
    ex('Lateral into Frontal Raises', 3, '10 each'),
    ex('Bicep Curl', 3, '10', { supersetGroup: 1 }),
    ex('Hammer Curl', 3, '10', { supersetGroup: 1 }),
  ];
}

function phaseAUpperW4(): ProgramExercise[] {
  return [
    ex('Lat Pull Down', 3, '10'),
    ex('Face Pull', 3, '12'),
    ex('Shoulder Press', 3, '10'),
    ex('Tricep Kickbacks', 3, '8'),
    ex('Lateral into Frontal Raises', 3, '10 each'),
    ex('Bicep Curl', 3, '10', { supersetGroup: 1 }),
    ex('Hammer Curl', 3, '10', { supersetGroup: 1 }),
  ];
}

function phaseAGlutesDay4W1(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 3, '12'),
    ex('Bulgarian Split Squat', 3, '8'),
    ex('B-Stance RDL', 3, '10'),
    ex('Cable Kickback', 3, '12'),
    ex('Back Extensions', 3, '10'),
  ];
}

function phaseAGlutesDay4W3(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '8'),
    ex('Bulgarian Split Squat', 3, '10'),
    ex('B-Stance RDL', 3, '10'),
    ex('Cable Kickback', 3, '12'),
    ex('Back Extensions', 3, '12'),
  ];
}

// ── Phase B (Weeks 5-8) — exercise change ───────────────────────────────────

function phaseBGlutesHamsW5(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '8'),
    ex('Reverse Deficit Lunge', 3, '8'),
    ex('BB RDL', 3, '8'),
    ex('Leg Curls', 3, '10'),
    ex('Hip Abductors', 3, '12'),
  ];
}

function phaseBGlutesHamsW7(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('Reverse Deficit Lunge', 3, '10'),
    ex('BB RDL', 3, '10'),
    ex('Leg Curls', 3, '10'),
    ex('Hip Abductors', 3, '12'),
  ];
}

function phaseBUpperW5(): ProgramExercise[] {
  return [
    ex('Lat Pull Down', 3, '10'),
    ex('Seated Cable Row', 3, '10'),
    ex('Reverse Fly', 3, '10'),
    ex('Tricep Extension DB', 3, '8'),
    ex('Around the Worlds', 3, '10 each'),
    ex('Alt Bicep Curl', 3, '10', { supersetGroup: 1 }),
    ex('Cable Bicep Curl', 3, '10', { supersetGroup: 1 }),
  ];
}

function phaseBUpperW7(): ProgramExercise[] {
  return [
    ex('Lat Pull Down', 3, '12'),
    ex('Seated Cable Row', 3, '12'),
    ex('Reverse Fly', 3, '12'),
    ex('Tricep Extension DB', 3, '10'),
    ex('Around the Worlds', 3, '12 each'),
    ex('Alt Bicep Curl', 3, '10', { supersetGroup: 1 }),
    ex('Cable Bicep Curl', 3, '10', { supersetGroup: 1 }),
  ];
}

function phaseBGlutesDay4W5(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '8'),
    ex('Good Mornings', 3, '10'),
    ex('DB Step Ups', 3, '10'),
    ex('Cable Kickback', 3, '12'),
    ex('Hip Abductions', 3, '12'),
  ];
}

function phaseBGlutesDay4W7(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('Good Mornings', 3, '10'),
    ex('DB Step Ups', 3, '10'),
    ex('Cable Kickback', 3, '12'),
    ex('Hip Abductions', 3, '12'),
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
