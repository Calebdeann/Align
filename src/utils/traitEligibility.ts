import { useMemo } from 'react';
import { useWorkoutStore, type ScheduledWorkout } from '@/stores/workoutStore';

/** Inclusive YYYY-MM-DD comparison. */
function diffDaysInclusive(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime();
  const to = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

/**
 * Was `workout` scheduled to happen on `dateKey` (YYYY-MM-DD)?
 *
 * Mirrors the recurrence semantics used by other parts of the store but kept
 * local so this util doesn't drag in the full ScheduledWorkout logic.
 */
function isScheduledOn(workout: ScheduledWorkout, dateKey: string): boolean {
  if (workout.excludedDates?.includes(dateKey)) return false;
  if (workout.endDate && dateKey > workout.endDate) return false;
  if (dateKey < workout.date) return false;

  const target = new Date(`${dateKey}T00:00:00Z`);
  const base = new Date(`${workout.date}T00:00:00Z`);
  const targetDow = target.getUTCDay();
  const baseDow = base.getUTCDay();
  const daysSinceBase = diffDaysInclusive(workout.date, dateKey);

  switch (workout.repeat.type) {
    case 'never':
      return dateKey === workout.date;
    case 'daily':
      return true;
    case 'weekly':
      return targetDow === baseDow;
    case 'biweekly':
      return targetDow === baseDow && Math.floor(daysSinceBase / 7) % 2 === 0;
    case 'monthly':
      return target.getUTCDate() === base.getUTCDate();
    case 'custom':
      return (workout.repeat.customDays ?? []).includes(targetDow);
    case 'interval': {
      const n = workout.repeat.intervalDays ?? 0;
      return n > 0 && daysSinceBase % n === 0;
    }
    default:
      return false;
  }
}

function isoDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Returns the set of `verifyKey`s the user has unlocked for the Workout Stats
 * trait category. Computed entirely from locally cached data — no network call.
 *
 * Currently verifies:
 *   - workouts_25 / workouts_50 / workouts_100 (from `cachedCompletedWorkouts.length`)
 *   - streak_30 / streak_60 / streak_100 (walks scheduled vs completed history)
 *   - plan_first (any plan with no outstanding scheduled occurrences)
 *
 * Deferred (always locked until a server-side PR summary lands):
 *   - hipthrust_100, hipthrust_120
 *   - squat_60, squat_80
 *   - deadlift_80, deadlift_100
 *   - bench_40
 *   - pullup_first
 */
export function useStatTraitEligibility(): Set<string> {
  const completed = useWorkoutStore((s) => s.cachedCompletedWorkouts);
  const scheduled = useWorkoutStore((s) => s.scheduledWorkouts);

  return useMemo(() => {
    const unlocked = new Set<string>();
    const n = completed.length;

    // Workout count
    if (n >= 1) unlocked.add('workout_first');
    if (n >= 10) unlocked.add('workouts_10');
    if (n >= 25) unlocked.add('workouts_25');
    if (n >= 50) unlocked.add('workouts_50');
    if (n >= 100) unlocked.add('workouts_100');

    // Streak — walk back day-by-day from today.
    // - Day with no scheduled workout: skip (doesn't count or break).
    // - Scheduled day fully completed: streak counter advances.
    // - Scheduled day with any incomplete workout: streak breaks.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const day = new Date(today);
      day.setUTCDate(today.getUTCDate() - i);
      const dateKey = isoDateKey(day);
      const scheduledForDay = scheduled.filter((w) => isScheduledOn(w, dateKey));
      if (scheduledForDay.length === 0) continue;
      const allDone = scheduledForDay.every((w) => w.completedDates.includes(dateKey));
      if (!allDone) break;
      streak++;
    }
    if (streak >= 7) unlocked.add('streak_7');
    if (streak >= 30) unlocked.add('streak_30');
    if (streak >= 60) unlocked.add('streak_60');
    if (streak >= 100) unlocked.add('streak_100');

    // First plan done — any planId with at least one completion and no remaining
    // scheduled occurrences for today or later.
    const completedPlanIds = new Set(
      completed.map((c) => c.planId).filter((p): p is string => !!p)
    );
    if (completedPlanIds.size > 0) {
      const todayKey = isoDateKey(today);
      const planIdsWithOutstanding = new Set<string>();
      for (const w of scheduled) {
        if (!w.planId) continue;
        if (!completedPlanIds.has(w.planId)) continue;
        // Check if any future occurrence of w exists that hasn't been completed.
        // Cheap heuristic: if w.date >= today OR w is recurring without an endDate
        // before today, treat as outstanding.
        const hasFutureOrOpenSchedule =
          w.date >= todayKey ||
          (w.repeat.type !== 'never' && (!w.endDate || w.endDate >= todayKey));
        if (hasFutureOrOpenSchedule) {
          planIdsWithOutstanding.add(w.planId);
        }
      }
      for (const pid of completedPlanIds) {
        if (!planIdsWithOutstanding.has(pid)) {
          unlocked.add('plan_first');
          break;
        }
      }
    }

    return unlocked;
  }, [completed, scheduled]);
}
