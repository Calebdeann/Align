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
  groupId: string; // Simplified group (e.g., "chest", "legs")
  effectiveSets: number; // primary + (secondary * 0.5)
  intensityTier: IntensityTier;
  color: string; // Resolved color from BODY_GRAPH_COLORS
}

// =============================================
// GET MUSCLE DATA BY TIMEFRAME
// =============================================

function getDateRangeForTimeframe(
  timeframe: MuscleTimeframe
): { start: string; end: string } | null {
  const now = new Date();
  const end = now.toISOString();

  switch (timeframe) {
    case 'today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end };
    }
    case 'week': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end };
    }
    case 'month': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end };
    }
    case 'total':
      return null; // No date filter
  }
}

export async function getMuscleDataByTimeframe(
  userId: string,
  timeframe: MuscleTimeframe
): Promise<BodyGraphMuscleData[]> {
  try {
    // 1. Get workout IDs in the date range
    const dateRange = getDateRangeForTimeframe(timeframe);

    let query = supabase.from('workouts').select('id').eq('user_id', userId);

    if (dateRange) {
      query = query.gte('completed_at', dateRange.start).lte('completed_at', dateRange.end);
    }

    const { data: workouts, error: workoutsError } = await query;

    if (workoutsError || !workouts || workouts.length === 0) {
      if (workoutsError) {
        logger.warn('Error fetching workouts for recovery', { error: workoutsError });
      }
      return [];
    }

    const workoutIds = workouts.map((w) => w.id);

    // 2. Get all workout_muscles for those workouts
    const { data: muscleRows, error: muscleError } = await supabase
      .from('workout_muscles')
      .select('muscle, total_sets, activation')
      .in('workout_id', workoutIds);

    if (muscleError || !muscleRows || muscleRows.length === 0) {
      if (muscleError) {
        logger.warn('Error fetching workout muscles for recovery', { error: muscleError });
      }
      return [];
    }

    // 3. Aggregate by simplified muscle group
    const groupAgg = new Map<string, { primary: number; secondary: number }>();

    muscleRows.forEach((row) => {
      const groupId = getSimplifiedMuscleId(row.muscle);
      if (groupId === 'other') return; // Skip non-visual muscles

      const current = groupAgg.get(groupId) || { primary: 0, secondary: 0 };
      if (row.activation === 'primary') {
        current.primary += row.total_sets;
      } else {
        current.secondary += row.total_sets;
      }
      groupAgg.set(groupId, current);
    });

    // 4. Calculate intensity tiers
    const result: BodyGraphMuscleData[] = [];
    groupAgg.forEach((counts, groupId) => {
      const effectiveSets = counts.primary + counts.secondary * 0.5;
      const tier = getIntensityTier(effectiveSets);
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
