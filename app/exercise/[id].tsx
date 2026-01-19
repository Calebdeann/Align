import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import {
  Exercise,
  ExerciseHistoryEntry,
  ExercisePersonalRecords,
  getExerciseById,
  getExerciseHistory,
  getExercisePersonalRecords,
} from '@/services/api/exercises';
import { getCurrentUser } from '@/services/api/user';
import { UnitSystem, kgToLbs, getWeightUnit } from '@/utils/units';
import {
  AnimationPlaceholder,
  ExerciseTabBar,
  ExerciseDetailTab,
  StatCard,
  HistoryItem,
} from '@/components/exercise';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<ExerciseDetailTab>('summary');
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [personalRecords, setPersonalRecords] = useState<ExercisePersonalRecords | null>(null);
  const [history, setHistory] = useState<ExerciseHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [units] = useState<UnitSystem>('metric');

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [id]);

  async function loadData() {
    if (!id) return;

    setIsLoading(true);

    try {
      // Load exercise details
      const exerciseData = await getExerciseById(id);
      if (!isMountedRef.current) return;
      setExercise(exerciseData);

      // Load user data and exercise stats
      const user = await getCurrentUser();
      if (!isMountedRef.current) return;

      if (user) {
        const [recordsData, historyData] = await Promise.all([
          getExercisePersonalRecords(user.id, id),
          getExerciseHistory(user.id, id),
        ]);
        if (!isMountedRef.current) return;
        setPersonalRecords(recordsData);
        setHistory(historyData);
      }
    } catch (error) {
      console.error('Error loading exercise data:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }

  const handleBack = () => {
    router.back();
  };

  const formatWeight = (weightKg: number): string => {
    const weight = units === 'imperial' ? Math.round(kgToLbs(weightKg)) : Math.round(weightKg);
    return `${weight} ${getWeightUnit(units)}`;
  };

  const formatVolume = (volumeKg: number): string => {
    const volume = units === 'imperial' ? Math.round(kgToLbs(volumeKg)) : Math.round(volumeKg);
    return `${volume.toLocaleString()} ${getWeightUnit(units)}`;
  };

  // Parse instructions into numbered steps
  const parseInstructions = (instructions: string | undefined): string[] => {
    if (!instructions) return [];

    // Split by newlines or numbered format (1. 2. etc.)
    const lines = instructions
      .split(/\n|(?=\d+\.)/)
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line) => line.length > 0);

    return lines;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Exercise</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Exercise</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Exercise not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const instructions = parseInstructions(exercise.instructions);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {exercise.name}
          </Text>
          <Text style={styles.headerSubtitle}>{exercise.muscle}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Bar */}
      <ExerciseTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'summary' && (
          <View>
            <Text style={styles.sectionTitle}>Personal Records</Text>

            {personalRecords &&
            (personalRecords.heaviestWeight ||
              personalRecords.bestOneRepMax ||
              personalRecords.bestSetVolume ||
              personalRecords.bestSessionVolume) ? (
              <View style={styles.statsGrid}>
                <View style={styles.statsRow}>
                  <StatCard
                    icon={<Ionicons name="barbell" size={24} color={colors.primary} />}
                    label="Heaviest Weight"
                    value={
                      personalRecords.heaviestWeight
                        ? formatWeight(personalRecords.heaviestWeight.weightKg)
                        : '-'
                    }
                  />
                  <View style={styles.statsSpacer} />
                  <StatCard
                    icon={<Ionicons name="trophy" size={24} color={colors.primary} />}
                    label="Best 1RM"
                    value={
                      personalRecords.bestOneRepMax
                        ? formatWeight(personalRecords.bestOneRepMax.value)
                        : '-'
                    }
                    subValue={
                      personalRecords.bestOneRepMax
                        ? `${formatWeight(personalRecords.bestOneRepMax.weightKg)} x ${personalRecords.bestOneRepMax.reps}`
                        : undefined
                    }
                  />
                </View>
                <View style={styles.statsRow}>
                  <StatCard
                    icon={<Ionicons name="flame" size={24} color={colors.primary} />}
                    label="Best Set Volume"
                    value={
                      personalRecords.bestSetVolume
                        ? formatVolume(personalRecords.bestSetVolume.volume)
                        : '-'
                    }
                    subValue={
                      personalRecords.bestSetVolume
                        ? `${formatWeight(personalRecords.bestSetVolume.weightKg)} x ${personalRecords.bestSetVolume.reps}`
                        : undefined
                    }
                  />
                  <View style={styles.statsSpacer} />
                  <StatCard
                    icon={<Ionicons name="stats-chart" size={24} color={colors.primary} />}
                    label="Best Session"
                    value={
                      personalRecords.bestSessionVolume
                        ? formatVolume(personalRecords.bestSessionVolume.volume)
                        : '-'
                    }
                  />
                </View>
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="fitness-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyStateText}>No personal records yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Complete a workout with this exercise to see your stats!
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'history' && (
          <View>
            {history.length > 0 ? (
              history.map((entry) => (
                <HistoryItem key={entry.workoutId} entry={entry} units={units} />
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="time-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyStateText}>No history yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Complete a workout with this exercise to see your history!
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'howto' && (
          <View>
            {/* Only show animation placeholder if there are instructions */}
            {instructions.length > 0 && <AnimationPlaceholder height={200} />}

            <Text style={styles.sectionTitle}>How to Perform</Text>

            {instructions.length > 0 ? (
              <View style={styles.instructionsContainer}>
                {instructions.map((step, index) => (
                  <View key={index} style={styles.instructionStep}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="help-circle-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyStateText}>Instructions coming soon</Text>
                <Text style={styles.emptyStateSubtext}>
                  Search YouTube for "{exercise.name}" to learn proper form.
                </Text>
              </View>
            )}

            {exercise.equipment && (
              <View style={styles.equipmentContainer}>
                <Text style={styles.equipmentLabel}>Equipment</Text>
                <Text style={styles.equipmentValue}>{exercise.equipment}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  statsGrid: {
    paddingHorizontal: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  statsSpacer: {
    width: spacing.sm,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  instructionsContainer: {
    paddingHorizontal: spacing.lg,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  stepNumberText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },
  equipmentContainer: {
    ...cardStyle,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  equipmentLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  equipmentValue: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  bottomSpacer: {
    height: 40,
  },
});
