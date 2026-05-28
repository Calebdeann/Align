import { HOURGLASS_PROGRAM } from './hourglass';
import { BOOTY_PROGRAM } from './booty';
import { IT_GIRL_PROGRAM } from './it-girl';
import { MUSCLE_MOMMY_PROGRAM } from './muscle-mommy';
import { PILATES_PRINCESS_PROGRAM } from './pilates-princess';
import { SUMMER_BODY_PROGRAM } from './summer-body';
import { BUSY_GIRL_PROGRAM } from './busy-girl';
import { HOME_PROGRAM } from './home';
import type { Program, ProgramWorkout } from './types';

export const PROGRAMS: Record<string, Program> = {
  hourglass: HOURGLASS_PROGRAM,
  booty: BOOTY_PROGRAM,
  'it-girl': IT_GIRL_PROGRAM,
  'muscle-mommy': MUSCLE_MOMMY_PROGRAM,
  'pilates-princess': PILATES_PRINCESS_PROGRAM,
  'summer-body': SUMMER_BODY_PROGRAM,
  'busy-girl': BUSY_GIRL_PROGRAM,
  home: HOME_PROGRAM,
};

export function getProgram(planId: string): Program | null {
  return PROGRAMS[planId] ?? null;
}

export function getProgramWorkout(programWorkoutId: string): ProgramWorkout | null {
  for (const program of Object.values(PROGRAMS)) {
    for (const day of program.days) {
      const found = day.workouts.find((w) => w.id === programWorkoutId);
      if (found) return found;
    }
  }
  return null;
}

// Compute the projected calendar duration in weeks given the user's chosen weekdays.
// We cap the effective per-week count at program.daysPerWeek (we never schedule more
// per week than the plan was designed for); fewer chosen weekdays stretches the plan.
export function projectedProgramWeeks(
  program: Program,
  userWeekdays: number[] | undefined
): number {
  const requested =
    userWeekdays && userWeekdays.length > 0 ? userWeekdays.length : program.daysPerWeek;
  const effective = Math.min(program.daysPerWeek, requested);
  if (effective <= 0) return program.durationWeeks;
  return Math.ceil(program.days.length / effective);
}

// Find the ProgramDay index (0-based into program.days[]) that a given
// programWorkoutId belongs to. Returns -1 if not found.
export function findProgramDayIdx(program: Program, programWorkoutId: string): number {
  for (let i = 0; i < program.days.length; i++) {
    if (program.days[i].workouts.some((w) => w.id === programWorkoutId)) return i;
  }
  return -1;
}

export * from './types';
