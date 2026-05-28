import type { Program, ProgramDay, ProgramExercise, ProgramWorkout, WorkoutType } from './types';
import { MUSCLE_MOMMY_DESCRIPTIONS } from './muscle-mommy-descriptions';

const ex = (name: string, sets: number, reps: string): ProgramExercise => ({ name, sets, reps });

const ABS_FAV: ProgramExercise[] = [
  ex('Hanging knee raise', 3, '12'),
  ex('Plank', 3, '45 sec'),
  ex('Russian twist', 3, '20 (10 each side)'),
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
      id: `muscle-mommy-w${week}-d${dayInWeek}-main`,
      week,
      dayInWeek,
      type,
      title,
      exercises,
    },
  ];
  if (opts.abs && opts.abs.length > 0) {
    workouts.push({
      id: `muscle-mommy-w${week}-d${dayInWeek}-abs`,
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

function phaseAGlutes(week: number): ProgramExercise[] {
  // Weeks 1-2: cable step ups 3×8. Weeks 3-6: cable step ups 3×10.
  const stepReps = week <= 2 ? '8' : '10';
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('RDL BB', 3, '10'),
    ex('Cable Step Ups', 3, stepReps),
    ex('Cable Kickbacks', 4, '12'),
  ];
}

function phaseAPull(): ProgramExercise[] {
  return [
    ex('Lat Pull Down', 3, '10'),
    ex('Seated Cable Row', 3, '10'),
    ex('Single Arm Wide Grip Machine Row', 3, '8'),
    ex('Face Pull', 3, '12'),
    ex('Cable Bicep Curl', 3, '8'),
    ex('Preacher Curl', 3, '8'),
  ];
}

function phaseALower(): ProgramExercise[] {
  return [
    ex('Leg Press', 3, '8'),
    ex('Hack Squat', 3, '10'),
    ex('Walking Lunges', 3, '10'),
    ex('Leg Extensions', 3, '12'),
    ex('Hip Abduction', 3, '12'),
  ];
}

function phaseAPushW1(): ProgramExercise[] {
  return [
    ex('Shoulder Press DB', 3, '8'),
    ex('Chest Press Machine', 3, '10'),
    ex('Reverse Fly', 3, '10'),
    ex('Lateral Raise Cable', 3, '8'),
    ex('Front Raises', 3, '10'),
    ex('Overhead Tricep Extension', 3, '10'),
  ];
}

function phaseAPushW3Plus(): ProgramExercise[] {
  return [
    ex('Shoulder Press DB', 3, '10'),
    ex('Chest Press Machine', 3, '12'),
    ex('Reverse Fly', 3, '12'),
    ex('Lateral Raise Cable', 3, '10'),
    ex('Front Raises', 3, '10'),
    ex('Overhead Tricep Extension', 3, '12'),
  ];
}

function phaseAFullBodyW1(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('Bulgarian Split Squats', 3, '10'),
    ex('Sumo Squat', 3, '8'),
    ex('Bent Over Row', 3, '8'),
    ex('Rear Delt Fly', 4, '8'),
    ex('Machine Shoulder Press', 3, '8'),
    ex('Hammer Curl', 4, '8'),
  ];
}

function phaseAFullBodyW3Plus(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('Bulgarian Split Squats', 3, '10'),
    ex('Sumo Squat', 3, '10'),
    ex('Bent Over Row', 3, '10'),
    ex('Rear Delt Fly', 4, '10'),
    ex('Machine Shoulder Press', 3, '10'),
    ex('Hammer Curl', 4, '8'),
  ];
}

// ── Phase B (Weeks 7-12) ─────────────────────────────────────────────────────

function phaseBGlutes(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('Bulgarian Split Squats (Smith Machine)', 3, '10'),
    ex('Back Extensions', 3, '10'),
    ex('Cable Kickbacks', 4, '12'),
  ];
}

function phaseBGlutesW10Plus(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('Bulgarian Split Squats (Smith Machine)', 3, '12'),
    ex('Back Extensions', 3, '12'),
    ex('Cable Kickbacks', 4, '12'),
  ];
}

function phaseBPull(): ProgramExercise[] {
  return [
    ex('Close Grip Lat Pull Down', 3, '10'),
    ex('Single Arm Dumbbell Row', 3, '10'),
    ex('T-Bar Row Machine', 3, '8'),
    ex('Face Pull', 3, '12'),
    ex('Hammer Curl', 3, '8'),
    ex('Bicep Curl BB', 3, '8'),
  ];
}

function phaseBPullW10Plus(): ProgramExercise[] {
  return [
    ex('Close Grip Lat Pull Down', 3, '10'),
    ex('Single Arm Dumbbell Row', 4, '8'),
    ex('T-Bar Row Machine', 3, '10'),
    ex('Face Pull', 4, '8'),
    ex('Hammer Curl', 3, '10'),
    ex('Bicep Curl BB', 3, '10'),
  ];
}

function phaseBLower(): ProgramExercise[] {
  return [
    ex('RDL BB', 3, '8'),
    ex('Back Squat', 3, '10'),
    ex('Reverse Lunge', 3, '10'),
    ex('Leg Curl', 3, '12'),
    ex('Leg Extensions', 3, '12'),
    ex('Hip Abductors', 3, '12'),
  ];
}

function phaseBLowerW10Plus(): ProgramExercise[] {
  return [
    ex('RDL BB', 3, '10'),
    ex('Back Squat', 3, '12'),
    ex('Reverse Lunge', 4, '6'),
    ex('Leg Curl', 3, '12'),
    ex('Leg Extensions', 3, '12'),
    ex('Hip Abductors', 3, '12'),
  ];
}

function phaseBPush(): ProgramExercise[] {
  return [
    ex('Shoulder Press Machine', 3, '10'),
    ex('Incline DB Chest Press', 3, '10'),
    ex('Cable Reverse Fly', 3, '12'),
    ex('Lateral Raise Machine', 3, '10'),
    ex('Chest Fly', 3, '8'),
    ex('Tricep Extensions', 4, '8'),
  ];
}

function phaseBPushW10Plus(): ProgramExercise[] {
  return [
    ex('Shoulder Press Machine', 4, '8'),
    ex('Incline DB Chest Press', 3, '10'),
    ex('Cable Reverse Fly', 3, '12'),
    ex('Lateral Raise Machine', 3, '12'),
    ex('Chest Fly', 3, '10'),
    ex('Tricep Extensions', 4, '8'),
  ];
}

function phaseBFullBody(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '10'),
    ex('Reverse Lunge', 3, '10'),
    ex('Step Ups DB', 3, '10'),
    ex('Assisted Pull Up', 3, '10'),
    ex('Face Pulls', 4, '10'),
    ex('Arnold Press', 3, '10'),
  ];
}

function phaseBFullBodyW10Plus(): ProgramExercise[] {
  return [
    ex('Hip Thrusts', 4, '12'),
    ex('Reverse Lunge', 3, '10'),
    ex('Step Ups DB', 3, '12'),
    ex('Assisted Pull Up', 3, '8'),
    ex('Face Pulls', 4, '10'),
    ex('Arnold Press', 3, '12'),
  ];
}

// ── Week assembler ──────────────────────────────────────────────────────────

function buildMuscleMommyWeek(week: number): ProgramDay[] {
  let glutes: ProgramExercise[];
  let pull: ProgramExercise[];
  let lower: ProgramExercise[];
  let push: ProgramExercise[];
  let fullBody: ProgramExercise[];

  if (week <= 6) {
    glutes = phaseAGlutes(week);
    pull = phaseAPull();
    lower = phaseALower();
    push = week <= 2 ? phaseAPushW1() : phaseAPushW3Plus();
    fullBody = week <= 2 ? phaseAFullBodyW1() : phaseAFullBodyW3Plus();
  } else if (week <= 9) {
    glutes = phaseBGlutes();
    pull = phaseBPull();
    lower = phaseBLower();
    push = phaseBPush();
    fullBody = phaseBFullBody();
  } else {
    // Weeks 10, 11, 12 — phase B with bumps
    glutes = phaseBGlutesW10Plus();
    pull = phaseBPullW10Plus();
    lower = phaseBLowerW10Plus();
    push = phaseBPushW10Plus();
    fullBody = phaseBFullBodyW10Plus();
  }

  return [
    buildDay(week, 1, 'lower', 'Glutes and Abs', glutes, { abs: ABS_FAV }),
    buildDay(week, 2, 'upper', 'Pull', pull),
    buildDay(week, 3, 'lower', 'Lower Body', lower),
    buildDay(week, 4, 'upper', 'Push', push),
    buildDay(week, 5, 'full-body', 'Full Body', fullBody),
  ];
}

const DAYS: ProgramDay[] = [];
for (let w = 1; w <= 12; w++) {
  DAYS.push(...buildMuscleMommyWeek(w));
}

DAYS.forEach((day) => {
  day.workouts.forEach((w) => {
    w.description = MUSCLE_MOMMY_DESCRIPTIONS[w.id];
    if (!w.description) {
      console.warn(`[muscle-mommy] missing description for ${w.id}`);
    }
  });
});

export const MUSCLE_MOMMY_PROGRAM: Program = {
  id: 'muscle-mommy',
  planId: 'muscle-mommy',
  durationWeeks: 12,
  daysPerWeek: 5,
  defaultWeekdays: [1, 2, 3, 5, 6], // Mon, Tue, Wed, Fri, Sat
  days: DAYS,
};

export default MUSCLE_MOMMY_PROGRAM;
