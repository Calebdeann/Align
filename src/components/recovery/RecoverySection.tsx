import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useUserProfileStore } from '@/stores/userProfileStore';
import {
  getMuscleDataByTimeframe,
  getWorkoutStats,
  type MuscleTimeframe,
  type BodyGraphMuscleData,
  type WorkoutStats,
} from '@/services/api/recovery';
import BodyGraph from './BodyGraph';
import MuscleBarList from './MuscleBarList';
import { getTrainingStatus } from './trainingStatus';

interface AllMuscleData {
  today: BodyGraphMuscleData[];
  week: BodyGraphMuscleData[];
  month: BodyGraphMuscleData[];
}

interface AllStats {
  today: WorkoutStats;
  week: WorkoutStats;
  month: WorkoutStats;
}

const EMPTY_STATS: WorkoutStats = {
  workoutCount: 0,
  daysSinceLastWorkout: null,
  avgSessionsPerWeek: 0,
};

const TIMEFRAMES: { label: string; value: MuscleTimeframe }[] = [
  { label: '24H', value: 'today' },
  { label: '1W', value: 'week' },
  { label: '1M', value: 'month' },
];

export default function RecoverySection() {
  const { t } = useTranslation();
  const userId = useUserProfileStore((s) => s.userId);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allData, setAllData] = useState<AllMuscleData>({ today: [], week: [], month: [] });
  const [allStats, setAllStats] = useState<AllStats>({
    today: EMPTY_STATS,
    week: EMPTY_STATS,
    month: EMPTY_STATS,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const lastFetchedAt = useRef<number | null>(null);
  const isFetchingRef = useRef(false);

  const fetchAllData = useCallback(async () => {
    if (!userId) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setHasError(false);
    setIsLoading(true);
    try {
      const [todayData, weekData, monthData, todayStats, weekStats, monthStats] = await Promise.all(
        [
          getMuscleDataByTimeframe(userId, 'today'),
          getMuscleDataByTimeframe(userId, 'week'),
          getMuscleDataByTimeframe(userId, 'month'),
          getWorkoutStats(userId, 'today'),
          getWorkoutStats(userId, 'week'),
          getWorkoutStats(userId, 'month'),
        ]
      );
      setAllData({ today: todayData, week: weekData, month: monthData });
      setAllStats({ today: todayStats, week: weekStats, month: monthStats });
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
      lastFetchedAt.current = Date.now();
    }
  }, [userId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Re-fetch when the profile tab regains focus, only if data is stale (5+ min).
  useFocusEffect(
    useCallback(() => {
      const STALE_MS = 5 * 60 * 1000;
      const isStale =
        lastFetchedAt.current === null || Date.now() - lastFetchedAt.current > STALE_MS;
      if (isStale) fetchAllData();
    }, [fetchAllData])
  );

  const currentTimeframe = TIMEFRAMES[selectedIndex];
  const currentData: BodyGraphMuscleData[] =
    currentTimeframe.value === 'today'
      ? allData.today
      : currentTimeframe.value === 'week'
        ? allData.week
        : allData.month;

  const currentStats: WorkoutStats =
    currentTimeframe.value === 'today'
      ? allStats.today
      : currentTimeframe.value === 'week'
        ? allStats.week
        : allStats.month;

  const trainingStatus = getTrainingStatus(currentData, currentStats, currentTimeframe.value);

  return (
    <View style={styles.container}>
      {/* Muscles Worked heading — anchored at same offset as Profile tab's "Week 1" */}
      <Text style={styles.sectionHeading}>{t('recovery.muscleWorked')}</Text>

      <BodyGraph muscleData={currentData} isLoading={isLoading} />

      {/* Timeframe selector */}
      <View style={styles.timeframeRow}>
        {TIMEFRAMES.map((tf, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Pressable
              key={tf.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setSelectedIndex(index);
              }}
              style={[styles.timePill, isSelected && styles.timePillSelected]}
            >
              <Text style={[styles.timePillText, isSelected && styles.timePillTextSelected]}>
                {tf.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.divider} />

      {/* Main Muscle Groups */}
      <MuscleBarList muscleData={currentData} isLoading={isLoading} />

      <View style={styles.divider} />

      {/* Training Status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('recovery.trainingStatus')}</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.statusLoader} />
        ) : hasError ? (
          <Text style={styles.errorText}>
            Couldn&apos;t load your training data. Pull down to try again.
          </Text>
        ) : (
          <Text style={styles.statusText}>{trainingStatus}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeading: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#000000',
    letterSpacing: -0.4,
    marginTop: 30,
    marginBottom: 16,
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 12,
  },
  timePill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  timePillSelected: {
    backgroundColor: '#000000',
  },
  timePillText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: '#888888',
  },
  timePillTextSelected: {
    color: '#FFFFFF',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  card: {
    paddingVertical: 20,
    gap: 16,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#000000',
    letterSpacing: -0.3,
  },
  statusLoader: {
    paddingVertical: spacing.md,
  },
  statusText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#444444',
    lineHeight: 22,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
