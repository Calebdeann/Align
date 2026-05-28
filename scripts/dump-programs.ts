// Standalone helper for seed scripts. Imports the real PROGRAMS map (which the
// regex-based parser couldn't handle once program files moved to variable-based
// buildDay calls inside week-builder functions) and writes a JSON-serialized
// shape that the seed runner consumes via child_process.
//
// Output schema (stdout):
//   { [planId: string]: Array<{
//       id: string; week: number; dayInWeek: number; type: string; title: string;
//       description?: string; freeText?: string;
//       exercises: Array<{ name: string; sets: number; reps: string; supersetGroup?: number }>
//     }> }
//
// All workouts are emitted (including cardio/abs/active-rest free-text sub-workouts).
// Seed runners can filter out empty-exercise workouts if they only want lift sessions;
// audit runners need the full set to verify descriptions and images.
//
// Run via: npx ts-node --transpile-only --project scripts/tsconfig.json scripts/dump-programs.ts
import { PROGRAMS } from '../src/data/programs';

type DumpedWorkout = {
  id: string;
  week: number;
  dayInWeek: number;
  type: string;
  title: string;
  description?: string;
  freeText?: string;
  exercises: Array<{ name: string; sets: number; reps: string; supersetGroup?: number }>;
};

const out: Record<string, DumpedWorkout[]> = {};

for (const [planId, program] of Object.entries(PROGRAMS)) {
  const workouts: DumpedWorkout[] = [];
  for (const day of program.days) {
    for (const workout of day.workouts) {
      workouts.push({
        id: workout.id,
        week: workout.week,
        dayInWeek: workout.dayInWeek,
        type: workout.type,
        title: workout.title,
        ...(workout.description ? { description: workout.description } : {}),
        ...(workout.freeText ? { freeText: workout.freeText } : {}),
        exercises: (workout.exercises ?? []).map((e) => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          ...(e.supersetGroup != null ? { supersetGroup: e.supersetGroup } : {}),
        })),
      });
    }
  }
  workouts.sort((a, b) => a.week - b.week || a.dayInWeek - b.dayInWeek);
  out[planId] = workouts;
}

process.stdout.write(JSON.stringify(out));
