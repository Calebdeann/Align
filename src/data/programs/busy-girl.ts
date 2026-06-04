import type { Program, ProgramDay, ProgramExercise, ProgramWorkout, WorkoutType } from './types';
import { BUSY_GIRL_DESCRIPTIONS } from './busy-girl-descriptions';

const ex = (
  name: string,
  sets: number,
  reps: string,
  opts: { supersetGroup?: number; notes?: string } = {}
): ProgramExercise => ({ name, sets, reps, ...opts });

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
      id: `busy-girl-w${week}-d${dayInWeek}-main`,
      week,
      dayInWeek,
      type,
      title,
      exercises,
    },
  ];
  if (opts.abs && opts.abs.length > 0) {
    workouts.push({
      id: `busy-girl-w${week}-d${dayInWeek}-abs`,
      week,
      dayInWeek,
      type: 'abs',
      title: 'Abs',
      exercises: opts.abs,
    });
  }
  return { week, dayInWeek, workouts };
}

// ── Phase A (Weeks 1-4) ─────────────────────────────────────────────────────
// Foundation lifts. W1 baseline, W2 ups reps, W3 same as W2 with heavier load,
// W4 ups select reps/durations again.

function phaseAGlutesAbs(week: number): ProgramExercise[] {
  const hipThrustReps = week === 1 ? '8' : '10';
  const rdlReps = week === 1 ? '8' : '10';
  const hipAbReps = week === 1 ? '8' : '10';
  const cableCrunchReps = week === 4 ? '12' : '8';
  const plankSecs = week === 4 ? '70 sec' : '60 sec';
  return [
    ex('Hip Thrust (Barbell)', 3, hipThrustReps, {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Romanian Deadlift (Barbell)', 3, rdlReps),
    ex('Step Up (Dumbbell)', 3, '8', {
      notes:
        'These can be done on a bench using a dumbbell, smith machine, cable machine, or barbell.',
    }),
    ex('Seated Hip Abduction (Machine)', 3, hipAbReps),
    ex('Cable Crunch', 3, cableCrunchReps),
    ex('Plank', 3, plankSecs, { supersetGroup: 1 }),
    ex('Dead Bug', 3, '12', { supersetGroup: 1 }),
  ];
}

function phaseAUpper(week: number): ProgramExercise[] {
  const lastReps = week === 4 ? '10' : '8';
  return [
    ex('Lat Pulldown', 3, '10'),
    ex('Seated Row (Cable)', 3, '10'),
    ex('Shoulder Press (Machine)', 3, '10'),
    ex('Lateral to Front Raise (Dumbbell)', 3, lastReps),
    ex('Bicep Curl (Barbell)', 3, lastReps, { supersetGroup: 1 }),
    ex('Triceps Pushdown', 3, lastReps, { supersetGroup: 1 }),
  ];
}

function phaseAFullBody(week: number): ProgramExercise[] {
  const hipThrustReps = week === 1 ? '8' : '10';
  const closeGripReps = week === 4 ? '10' : '8';
  const facePullReps = week === 4 ? '12' : '10';
  const finisherReps = week === 4 ? '12' : '8';
  return [
    ex('Hip Thrust (Barbell)', 3, hipThrustReps, {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Leg Press (Machine)', 3, '10'),
    ex('Bulgarian Split Squats', 3, '10'),
    ex('Lat Pulldown', 3, closeGripReps, { notes: 'Close Grip' }),
    ex('Face Pulls', 3, facePullReps),
    ex('Cable Crunch', 3, finisherReps, { supersetGroup: 1 }),
    ex('Hanging Knee Raise', 3, finisherReps, { supersetGroup: 1 }),
  ];
}

// ── Phase B (Weeks 5-8) ─────────────────────────────────────────────────────
// New exercise selection. W5/W6 baseline, W7 ups reps, W8 ups one more rep.

function phaseBGlutesAbs(week: number): ProgramExercise[] {
  const sumoReps = week >= 7 ? '12' : '10';
  const kickbackReps = week === 8 ? '12' : week === 7 ? '10' : '8';
  const backExtReps = week >= 7 ? '12' : '10';
  const abWheelReps = week >= 7 ? '8' : '6';
  const sidePlankSecs = week >= 7 ? '40 sec' : '30 sec';
  return [
    ex('Hip Thrust (Barbell)', 3, '10', {
      notes:
        'These can be done with a barbell, smith machine, or hip thrust machine if your gym has one.',
    }),
    ex('Sumo Squat (Dumbbell)', 3, sumoReps, {
      notes: 'Can be done with a barbell, dumbbell, any weight, or no weight at all.',
    }),
    ex('Cable Kickbacks', 3, kickbackReps),
    ex('Back Extensions (Hyperextension)', 3, backExtReps, {
      notes: 'Hold onto a plate or dumbbell at your chest to increase difficulty.',
    }),
    ex('Ab Wheel Rollout', 3, abWheelReps),
    ex('Russian Twist', 3, '12', { supersetGroup: 1 }),
    ex('Side Plank', 3, sidePlankSecs, { supersetGroup: 1 }),
  ];
}

function phaseBUpper(week: number): ProgramExercise[] {
  const lastReps = week >= 7 ? '10' : '8';
  return [
    ex('Shoulder Press (Machine)', 3, '10'),
    ex('Single Arm Row (Dumbbell)', 3, '10'),
    ex('Reverse Fly (Cable)', 3, '10'),
    ex('Lateral Raise (Machine)', 3, lastReps),
    ex('Bicep Curl (Cable)', 3, lastReps, { supersetGroup: 1 }),
    ex('Triceps Extension (Cable)', 3, lastReps, { supersetGroup: 1 }),
  ];
}

function phaseBFullBody(week: number): ProgramExercise[] {
  const squatReps = week >= 7 ? '10' : '8';
  const singleLegReps = week >= 7 ? '10' : '8';
  const pullupReps = week >= 7 ? '8' : '6';
  const bentRowReps = week >= 7 ? '8' : '6';
  const declineReps = week >= 7 ? '10' : '8';
  const hangingReps = week >= 7 ? '10' : '8';
  return [
    ex('Back Squat (Barbell)', 3, squatReps),
    ex('Reverse Lunges (Barbell)', 3, '10'),
    ex('Single Leg Romanian Deadlift (Barbell)', 3, singleLegReps),
    ex('Assisted Pull Up', 3, pullupReps),
    ex('Bent Over Row (Barbell)', 3, bentRowReps),
    ex('Decline Crunch', 3, declineReps),
    ex('Hanging Straight Leg Raise', 3, hangingReps),
  ];
}

function buildBusyGirlWeek(week: number): ProgramDay[] {
  const isPhaseA = week <= 4;
  const glutesAbs = isPhaseA ? phaseAGlutesAbs(week) : phaseBGlutesAbs(week);
  const upper = isPhaseA ? phaseAUpper(week) : phaseBUpper(week);
  const fullBody = isPhaseA ? phaseAFullBody(week) : phaseBFullBody(week);
  return [
    buildDay(week, 1, 'lower', 'Glutes & Abs', glutesAbs),
    buildDay(week, 2, 'upper', 'Upper Body', upper),
    buildDay(week, 3, 'full-body', 'Full Body', fullBody),
  ];
}

const DAYS: ProgramDay[] = [];
for (let w = 1; w <= 8; w++) DAYS.push(...buildBusyGirlWeek(w));

for (const day of DAYS) {
  for (const w of day.workouts) {
    const desc = BUSY_GIRL_DESCRIPTIONS[w.id];
    if (desc) w.description = desc;
  }
}

export const BUSY_GIRL_PROGRAM: Program = {
  id: 'busy-girl',
  planId: 'busy-girl',
  durationWeeks: 8,
  daysPerWeek: 3,
  defaultWeekdays: [1, 3, 5],
  days: DAYS,
};

export default BUSY_GIRL_PROGRAM;
