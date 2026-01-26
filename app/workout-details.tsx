import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, fontSize, spacing, cardStyle, dividerStyle } from '@/constants/theme';
import {
  getWorkoutById,
  getWorkoutMuscles,
  deleteWorkout,
  type DbWorkout,
  type DbWorkoutExercise,
  type DbWorkoutSet,
  type WorkoutMuscleData,
} from '@/services/api/workouts';
import { UnitSystem, kgToLbs, getWeightUnit } from '@/utils/units';
import { toTitleCase } from '@/utils/textFormatters';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { ExerciseImage } from '@/components/ExerciseImage';

// Icons
function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Format duration from seconds to "X hour, Y minutes"
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hour, ${minutes} minutes`;
  }
  return `${minutes} minutes`;
}

// Format volume with units
function formatVolume(volumeKg: number, units: UnitSystem): string {
  if (units === 'imperial') {
    return `${Math.round(kgToLbs(volumeKg)).toLocaleString()} lbs`;
  }
  return `${Math.round(volumeKg).toLocaleString()} kg`;
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

// Get color for muscle type
function getMuscleColor(muscle: string): string {
  const muscleColors: Record<string, string> = {
    Legs: colors.workout.legs,
    Arms: colors.workout.arms,
    Back: colors.workout.back,
    Chest: colors.workout.chest,
    Shoulders: colors.workout.shoulders,
    Core: colors.workout.core,
    Abs: colors.workout.core,
    Cardio: colors.workout.cardio,
    'Full Body': colors.workout.fullBody,
    Glutes: colors.workout.legs,
  };
  return muscleColors[muscle] || colors.primary;
}

export default function WorkoutDetailsScreen() {
  const params = useLocalSearchParams();
  const workoutId = params.workoutId as string;

  const { getUnitSystem } = useUserPreferencesStore();
  const units = getUnitSystem();
  const setCachedCompletedWorkouts = useWorkoutStore((s) => s.setCachedCompletedWorkouts);
  const cachedCompletedWorkouts = useWorkoutStore((s) => s.cachedCompletedWorkouts);

  const [isLoading, setIsLoading] = useState(true);
  const [workout, setWorkout] = useState<DbWorkout | null>(null);
  const [exercises, setExercises] = useState<(DbWorkoutExercise & { sets: DbWorkoutSet[] })[]>([]);
  const [detailedMuscles, setDetailedMuscles] = useState<WorkoutMuscleData[]>([]);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

  const toggleExercise = (exerciseId: string) => {
    setExpandedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const weightLabel = getWeightUnit(units);

  useEffect(() => {
    async function fetchWorkout() {
      if (!workoutId) return;

      setIsLoading(true);

      // Fetch workout data and muscle data in parallel
      const [workoutData, muscleData] = await Promise.all([
        getWorkoutById(workoutId),
        getWorkoutMuscles(workoutId),
      ]);

      if (workoutData) {
        setWorkout(workoutData.workout);
        setExercises(workoutData.exercises);
      }
      setDetailedMuscles(muscleData);
      setIsLoading(false);
    }

    fetchWorkout();
  }, [workoutId]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!exercises.length) {
      return { totalVolume: 0, totalSets: 0, muscleSplit: new Map() };
    }

    let totalVolume = 0;
    let totalSets = 0;
    const muscleSplit = new Map<string, number>();

    exercises.forEach((ex) => {
      const completedSets = ex.sets.filter((s) => s.completed);
      totalSets += completedSets.length;

      completedSets.forEach((set) => {
        if (set.weight && set.reps) {
          totalVolume += set.weight * set.reps;
        }
      });

      const muscle = ex.exercise_muscle || 'Other';
      const currentCount = muscleSplit.get(muscle) || 0;
      muscleSplit.set(muscle, currentCount + completedSets.length);
    });

    return { totalVolume, totalSets, muscleSplit };
  }, [exercises]);

  // Sort muscles by percentage for display (basic fallback)
  const sortedMuscles = useMemo(() => {
    const muscles: { name: string; count: number; percentage: number }[] = [];
    const totalSets = stats.totalSets || 1;

    stats.muscleSplit.forEach((count, name) => {
      muscles.push({
        name,
        count,
        percentage: Math.round((count / totalSets) * 100),
      });
    });

    return muscles.sort((a, b) => b.percentage - a.percentage);
  }, [stats]);

  // Calculate detailed muscle split from API data (primary vs secondary)
  const detailedMuscleSplit = useMemo(() => {
    if (detailedMuscles.length === 0) {
      return { primary: [], secondary: [], hasDetailedData: false };
    }

    const primaryMuscles: { name: string; sets: number }[] = [];
    const secondaryMuscles: { name: string; sets: number }[] = [];

    detailedMuscles.forEach((m) => {
      if (m.activation === 'primary') {
        primaryMuscles.push({ name: m.muscle, sets: m.totalSets });
      } else {
        secondaryMuscles.push({ name: m.muscle, sets: m.totalSets });
      }
    });

    // Sort by sets descending
    primaryMuscles.sort((a, b) => b.sets - a.sets);
    secondaryMuscles.sort((a, b) => b.sets - a.sets);

    // Calculate max sets for progress bar scaling
    const maxSets = Math.max(...primaryMuscles.map((m) => m.sets), 1);

    return {
      primary: primaryMuscles.map((m) => ({
        ...m,
        percentage: Math.round((m.sets / maxSets) * 100),
      })),
      secondary: secondaryMuscles,
      hasDetailedData: true,
    };
  }, [detailedMuscles]);

  const handleDeleteWorkout = () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteWorkout(workoutId);
            if (success) {
              // Remove from cached completed workouts
              setCachedCompletedWorkouts(cachedCompletedWorkouts.filter((w) => w.id !== workoutId));
              router.back();
            } else {
              Alert.alert('Error', 'Failed to delete workout. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <BackIcon />
          </Pressable>
          <Text style={styles.headerTitle}>Workout Details</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <BackIcon />
          </Pressable>
          <Text style={styles.headerTitle}>Workout Details</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Workout not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <BackIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Workout Details</Text>
        <Pressable onPress={handleDeleteWorkout} style={styles.backButton}>
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Workout Info Card */}
        <View style={[styles.card, styles.workoutInfoCard]}>
          <Text style={styles.workoutTitle}>{workout.name || 'Workout'}</Text>
          <Text style={styles.workoutDate}>{formatDate(workout.completed_at)}</Text>

          {workout.notes && (
            <>
              <View style={styles.cardDivider} />
              <Text style={styles.workoutNotes}>{workout.notes}</Text>
            </>
          )}
        </View>

        {/* Stats Section */}
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.card}>
          <View style={styles.statRow}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time-outline" size={18} color={colors.text} />
            </View>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{formatDuration(workout.duration_seconds)}</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.statRow}>
            <View style={styles.statIconContainer}>
              <Ionicons name="barbell-outline" size={18} color={colors.text} />
            </View>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>{formatVolume(stats.totalVolume, units)}</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.statRow}>
            <View style={styles.statIconContainer}>
              <Ionicons name="layers-outline" size={18} color={colors.text} />
            </View>
            <Text style={styles.statLabel}>Sets</Text>
            <Text style={styles.statValue}>{stats.totalSets}</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.statRow}>
            <View style={styles.statIconContainer}>
              <Ionicons name="fitness-outline" size={18} color={colors.text} />
            </View>
            <Text style={styles.statLabel}>Exercises</Text>
            <Text style={styles.statValue}>{exercises.length}</Text>
          </View>
        </View>

        {/* Muscles Worked Section - Detailed view with Primary/Secondary */}
        {detailedMuscleSplit.hasDetailedData ? (
          <>
            <Text style={styles.sectionTitle}>Muscles Worked</Text>
            <View style={styles.card}>
              {/* Primary Muscles */}
              {detailedMuscleSplit.primary.length > 0 && (
                <View style={styles.muscleSection}>
                  <Text style={styles.muscleSectionLabel}>Primary</Text>
                  <View style={styles.muscleList}>
                    {detailedMuscleSplit.primary.map((muscle) => (
                      <View key={muscle.name} style={styles.muscleRow}>
                        <Text style={styles.muscleName}>{muscle.name}</Text>
                        <View style={styles.progressBarContainer}>
                          <View
                            style={[
                              styles.progressBar,
                              {
                                width: `${muscle.percentage}%`,
                                backgroundColor: getMuscleColor(muscle.name),
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.muscleSetCount}>{muscle.sets} sets</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Secondary Muscles */}
              {detailedMuscleSplit.secondary.length > 0 && (
                <View style={styles.muscleSection}>
                  <Text style={styles.muscleSectionLabel}>Secondary</Text>
                  <View style={styles.secondaryMuscleList}>
                    {detailedMuscleSplit.secondary.map((muscle) => (
                      <View key={muscle.name} style={styles.secondaryMusclePill}>
                        <Text style={styles.secondaryMuscleText}>{muscle.name}</Text>
                        <Text style={styles.secondaryMuscleSets}>{muscle.sets}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </>
        ) : sortedMuscles.length > 0 ? (
          // Fallback to basic muscle split if no detailed data
          <>
            <Text style={styles.sectionTitle}>Muscle Split</Text>
            <View style={styles.card}>
              <View style={styles.muscleList}>
                {sortedMuscles.map((muscle) => (
                  <View key={muscle.name} style={styles.muscleRow}>
                    <Text style={styles.muscleName}>{muscle.name}</Text>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${muscle.percentage}%`,
                            backgroundColor: getMuscleColor(muscle.name),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.musclePercentage}>{muscle.percentage}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        {/* Exercises Section */}
        <Text style={styles.sectionTitle}>Exercises</Text>
        <View style={styles.card}>
          {exercises.map((ex, index) => {
            const completedSets = ex.sets.filter((s) => s.completed);
            const isExpanded = expandedExercises.has(ex.id);

            return (
              <View key={ex.id}>
                <Pressable style={styles.exerciseRow} onPress={() => toggleExercise(ex.id)}>
                  <ExerciseImage
                    gifUrl={ex.image_url || undefined}
                    thumbnailUrl={ex.thumbnail_url || undefined}
                    size={40}
                    borderRadius={8}
                  />
                  <Text style={styles.exerciseName}>{toTitleCase(ex.exercise_name)}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>

                {/* Expanded Sets */}
                {isExpanded && completedSets.length > 0 && (
                  <View style={styles.setsContainer}>
                    <View style={styles.setsHeader}>
                      <Text style={[styles.setHeaderText, styles.setColumn]}>SET</Text>
                      <Text style={[styles.setHeaderText, styles.weightRepsColumn]}>
                        WEIGHT & REPS
                      </Text>
                    </View>
                    {completedSets.map((set, setIndex) => (
                      <View key={set.id} style={styles.setRow}>
                        <Text style={[styles.setText, styles.setColumn]}>{setIndex + 1}</Text>
                        <Text style={[styles.setText, styles.weightRepsColumn]}>
                          {set.weight && set.reps
                            ? `${units === 'imperial' ? Math.round(kgToLbs(set.weight)) : set.weight} ${weightLabel} × ${set.reps} reps`
                            : set.weight
                              ? `${units === 'imperial' ? Math.round(kgToLbs(set.weight)) : set.weight} ${weightLabel} × - reps`
                              : set.reps
                                ? `- × ${set.reps} reps`
                                : '- × -'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {index < exercises.length - 1 && <View style={styles.exerciseDivider} />}
              </View>
            );
          })}

          {exercises.length === 0 && <Text style={styles.emptyText}>No exercises recorded</Text>}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  card: {
    ...cardStyle,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  workoutInfoCard: {
    marginTop: spacing.md,
  },
  workoutTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  workoutDate: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  workoutNotes: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  cardDivider: {
    ...dividerStyle,
    marginVertical: spacing.sm,
    marginHorizontal: -spacing.sm,
    marginLeft: 0,
    marginRight: 0,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  statIconContainer: {
    width: 24,
    marginRight: spacing.sm,
  },
  statLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  statValue: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  muscleList: {
    gap: spacing.md,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  muscleName: {
    width: 80,
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  musclePercentage: {
    width: 40,
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  muscleSection: {
    marginBottom: spacing.md,
  },
  muscleSectionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  muscleSetCount: {
    width: 50,
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  secondaryMuscleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  secondaryMusclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    gap: spacing.xs,
  },
  secondaryMuscleText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  secondaryMuscleSets: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  exerciseName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  exerciseDivider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.25)',
    marginHorizontal: spacing.md,
  },
  setsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  setsHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 217, 217, 0.25)',
  },
  setHeaderText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  setColumn: {
    flex: 1,
    textAlign: 'center',
  },
  weightRepsColumn: {
    flex: 3,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  setText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  bottomSpacer: {
    height: 40,
  },
});
