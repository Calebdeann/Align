import { supabase } from '../supabase';
import { logger } from '@/utils/logger';
import {
  getSimplifiedMuscleId,
  getIntensityTier,
  BODY_GRAPH_COLORS,
  type IntensityTier,
} from '@/constants/muscleGroups';

// =============================================
// TYPES
// =============================================

export type MuscleTimeframe = 'today' | 'week' | 'month' | 'total';

export interface BodyGraphMuscleData {
  // DB simplified group ID: "biceps", "triceps", "core", "chest", "legs", etc.
  // BodyGraph.tsx maps these to the correct image keys per view.
  groupId: string;
  effectiveSets: number;
  intensityTier: IntensityTier;
  color: string;
}

export interface WorkoutStats {
  workoutCount: number; // Total sessions in the timeframe
  daysSinceLastWorkout: number | null; // null = no workouts at all
  avgSessionsPerWeek: number; // For month view context
}

// =============================================
// HELPERS
// =============================================

function getDateRangeForTimeframe(
  timeframe: MuscleTimeframe
): { start: string; end: string } | null {
  const now = new Date();
  const end = now.toISOString();

  switch (timeframe) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start: start.toISOString(), end };
    }
    case 'week': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      return { start: start.toISOString(), end };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return { start: start.toISOString(), end };
    }
    case 'total':
      return null;
  }
}

// =============================================
// GET MUSCLE DATA BY TIMEFRAME
// =============================================

export async function getMuscleDataByTimeframe(
  userId: string,
  timeframe: MuscleTimeframe
): Promise<BodyGraphMuscleData[]> {
  try {
    const dateRange = getDateRangeForTimeframe(timeframe);

    let query = supabase.from('workouts').select('id').eq('user_id', userId);
    if (dateRange) {
      query = query.gte('completed_at', dateRange.start).lte('completed_at', dateRange.end);
    }

    const { data: workouts, error: workoutsError } = await query;
    if (workoutsError || !workouts || workouts.length === 0) {
      if (workoutsError)
        logger.warn('Error fetching workouts for recovery', { error: workoutsError });
      return [];
    }

    const workoutIds = workouts.map((w) => w.id);

    const { data: muscleRows, error: muscleError } = await supabase
      .from('workout_muscles')
      .select('muscle, total_sets, activation')
      .in('workout_id', workoutIds);

    if (muscleError || !muscleRows || muscleRows.length === 0) {
      if (muscleError)
        logger.warn('Error fetching workout muscles for recovery', { error: muscleError });
      return [];
    }

    // Aggregate by DB simplified group ID (biceps and triceps stay separate)
    const groupAgg = new Map<string, { primary: number; secondary: number }>();
    muscleRows.forEach((row) => {
      const groupId = getSimplifiedMuscleId(row.muscle);
      if (groupId === 'other') return;

      const current = groupAgg.get(groupId) || { primary: 0, secondary: 0 };
      if (row.activation === 'primary') {
        current.primary += row.total_sets;
      } else {
        current.secondary += row.total_sets;
      }
      groupAgg.set(groupId, current);
    });

    const tierTimeframe = timeframe === 'month' ? 'month' : timeframe === 'week' ? 'week' : 'today';

    const result: BodyGraphMuscleData[] = [];
    groupAgg.forEach((counts, groupId) => {
      const effectiveSets = counts.primary + counts.secondary * 0.5;
      const tier = getIntensityTier(effectiveSets, tierTimeframe);
      result.push({
        groupId,
        effectiveSets,
        intensityTier: tier,
        color: BODY_GRAPH_COLORS[tier],
      });
    });

    return result;
  } catch (error) {
    logger.warn('Error in getMuscleDataByTimeframe', { error });
    return [];
  }
}

// =============================================
// GET WORKOUT STATS BY TIMEFRAME
// =============================================

export async function getWorkoutStats(
  userId: string,
  timeframe: MuscleTimeframe
): Promise<WorkoutStats> {
  const empty: WorkoutStats = {
    workoutCount: 0,
    daysSinceLastWorkout: null,
    avgSessionsPerWeek: 0,
  };

  try {
    const dateRange = getDateRangeForTimeframe(timeframe);

    let query = supabase
      .from('workouts')
      .select('completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (dateRange) {
      query = query.gte('completed_at', dateRange.start).lte('completed_at', dateRange.end);
    }

    const { data: workouts, error } = await query;
    if (error || !workouts || workouts.length === 0) return empty;

    const workoutCount = workouts.length;

    // Days since the most recent workout in this timeframe
    const lastDate = new Date(workouts[0].completed_at);
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysSinceLastWorkout = Math.floor((now.getTime() - lastDate.getTime()) / msPerDay);

    // Average sessions per week (relevant for month view)
    const weeksInPeriod = timeframe === 'month' ? 4.3 : timeframe === 'week' ? 1 : 1 / 7;
    const avgSessionsPerWeek = workoutCount / weeksInPeriod;

    return { workoutCount, daysSinceLastWorkout, avgSessionsPerWeek };
  } catch (error) {
    logger.warn('Error in getWorkoutStats', { error });
    return empty;
  }
}
