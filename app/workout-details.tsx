import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { colors, fonts, fontSize, spacing, cardStyle, dividerStyle } from '@/constants/theme';
import {
  getWorkoutById,
  getWorkoutMuscles,
  deleteWorkout,
  type DbWorkout,
  type DbWorkoutExercise,
  type DbWorkoutSet,
  type WorkoutMuscleData,
  type SetType,
} from '@/services/api/workouts';
import * as Haptics from 'expo-haptics';
import { UnitSystem, kgToLbs, getWeightUnit, fromKgForDisplay } from '@/utils/units';
import { formatExerciseNameString } from '@/utils/textFormatters';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { ExerciseImage } from '@/components/ExerciseImage';
import { prefetchExerciseGif } from '@/stores/exerciseStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { getTemplateImageById } from '@/constants/templateImages';

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
    return i18n.t('saveWorkout.hourMinutes', { hours, minutes });
  }
  return i18n.t('saveWorkout.minutes', { minutes });
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

// Superset colors matching active-workout
const SUPERSET_COLORS = ['#64B5F6', '#7AC29A', '#FF8A65', '#E53935', '#BA68C8'];

const getSupersetColor = (supersetId: number): string => {
  return SUPERSET_COLORS[(supersetId - 1) % SUPERSET_COLORS.length];
};

const getSetTypeLabel = (setType: SetType | undefined | null, setIndex: number): string => {
  switch (setType) {
    case 'warmup':
      return 'W';
    case 'failure':
      return 'F';
    case 'dropset':
      return 'D';
    default:
      return (setIndex + 1).toString();
  }
};

export default function WorkoutDetailsScreen() {
  const params = useLocalSearchParams();
  const workoutId = params.workoutId as string;
  const { t } = useTranslation();

  const { isNavigating, withLock } = useNavigationLock();
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

  const fetchWorkout = useCallback(async () => {
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
  }, [workoutId]);

  // Fetch on mount and re-fetch on focus (e.g. returning from edit)
  useFocusEffect(
    useCallback(() => {
      fetchWorkout();
    }, [fetchWorkout])
  );

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

  const handleEditWorkout = () => {
    if (!workout || !exercises.length) return;

    withLock(() => {
      // Convert DB format to WorkoutData format for save-workout screen
      const workoutExercises = exercises.map((ex) => ({
        exercise: {
          id: ex.exercise_id,
          name: ex.exercise_name,
          muscle: ex.exercise_muscle || '',
          gifUrl: ex.image_url || undefined,
          thumbnailUrl: ex.thumbnail_url || undefined,
        },
        notes: ex.notes || '',
        sets: ex.sets
          .filter((s) => s.completed)
          .map((s, index) => ({
            id: `edit_${s.id}`,
            previous: '-',
            // Convert stored kg to display units for the input fields
            kg: s.weight != null ? fromKgForDisplay(s.weight, units).toString() : '',
            reps: s.reps != null ? s.reps.toString() : '',
            completed: true,
            setType: (s.set_type || 'normal') as 'normal' | 'warmup' | 'failure' | 'dropset',
            rpe: s.rpe ?? null,
          })),
        supersetId: ex.superset_id ?? null,
        restTimerSeconds: ex.rest_timer_seconds ?? 90,
      }));

      const workoutData = {
        exercises: workoutExercises,
        durationSeconds: workout.duration_seconds,
        startedAt: workout.started_at,
        userId: workout.user_id,
        sourceTemplateId: workout.source_template_id || undefined,
      };

      router.push({
        pathname: '/save-workout',
        params: {
          workoutData: JSON.stringify(workoutData),
          editWorkoutId: workoutId,
          editTitle: workout.name || '',
          editNotes: workout.notes || '',
          editImageType: workout.image_type || '',
          editImageUri: workout.image_uri || '',
          editImageTemplateId: workout.image_template_id || '',
        },
      });
    });
  };

  const handleDeleteWorkout = () => {
    Alert.alert(t('workoutDetails.deleteWorkout'), t('workoutDetails.deleteWorkoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const success = await deleteWorkout(workoutId);
          if (success) {
            // Remove from cached completed workouts
            setCachedCompletedWorkouts(cachedCompletedWorkouts.filter((w) => w.id !== workoutId));
            router.back();
          } else {
            Alert.alert(t('common.error'), t('workoutDetails.deleteWorkoutFailed'));
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.backButton}
          >
            <BackIcon />
          </Pressable>
          <Text style={styles.headerTitle}>{t('workoutDetails.title')}</Text>
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
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.backButton}
          >
            <BackIcon />
          </Pressable>
          <Text style={styles.headerTitle}>{t('workoutDetails.title')}</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>{t('workoutDetails.workoutNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <BackIcon />
        </Pressable>
        <Text style={styles.headerTitle}>{t('workoutDetails.title')}</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            handleEditWorkout();
          }}
          style={styles.backButton}
        >
          <Ionicons name="pencil-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Workout Photo */}
        {workout.image_uri ? (
          <Image source={{ uri: workout.image_uri }} style={styles.workoutPhoto} />
        ) : workout.image_template_id ? (
          (() => {
            const templateSource = getTemplateImageById(workout.image_template_id);
            return templateSource ? (
              <Image source={templateSource} style={styles.workoutPhoto} />
            ) : null;
          })()
        ) : null}

        {/* Workout Info Card */}
        <View style={[styles.card, styles.workoutInfoCard]}>
          <Text style={styles.workoutTitle}>{workout.name || t('workout.title')}</Text>
          <Text style={styles.workoutDate}>{formatDate(workout.completed_at)}</Text>

          {workout.notes && (
            <>
              <View style={styles.cardDivider} />
              <Text style={styles.workoutNotes}>{workout.notes}</Text>
            </>
          )}
        </View>

        {/* Stats Section */}
        <Text style={styles.sectionTitle}>{t('workoutDetails.summary')}</Text>
        <View style={styles.card}>
          <View style={styles.statRow}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time-outline" size={18} color={colors.text} />
            </View>
            <Text style={styles.statLabel}>{t('workoutDetails.duration')}</Text>
            <Text style={styles.statValue}>{formatDuration(workout.duration_seconds)}</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.statRow}>
            <View style={styles.statIconContainer}>
              <Ionicons name="barbell-outline" size={18} color={colors.text} />
            </View>
            <Text style={styles.statLabel}>{t('workoutDetails.volume')}</Text>
            <Text style={styles.statValue}>{formatVolume(stats.totalVolume, units)}</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.statRow}>
            <View style={styles.statIconContainer}>
              <Ionicons name="layers-outline" size={18} color={colors.text} />
            </View>
            <Text style={styles.statLabel}>{t('workoutDetails.sets')}</Text>
            <Text style={styles.statValue}>{stats.totalSets}</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.statRow}>
            <View style={styles.statIconContainer}>
              <Ionicons name="fitness-outline" size={18} color={colors.text} />
            </View>
            <Text style={styles.statLabel}>{t('workoutDetails.exercises')}</Text>
            <Text style={styles.statValue}>{exercises.length}</Text>
          </View>
        </View>

        {/* Muscles Worked Section - Detailed view with Primary/Secondary */}
        {detailedMuscleSplit.hasDetailedData ? (
          <>
            <Text style={styles.sectionTitle}>{t('workoutDetails.musclesWorked')}</Text>
            <View style={styles.card}>
              {/* Primary Muscles */}
              {detailedMuscleSplit.primary.length > 0 && (
                <View style={styles.muscleSection}>
                  <Text style={styles.muscleSectionLabel}>{t('workoutDetails.primary')}</Text>
                  <View style={styles.muscleList}>
                    {detailedMuscleSplit.primary.map((muscle) => (
                      <View key={muscle.name} style={styles.muscleRow}>
                        <Text style={styles.muscleName}>
                          {muscle.name.charAt(0).toUpperCase() + muscle.name.slice(1)}
                        </Text>
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
                        <Text style={styles.muscleSetCount}>
                          {t('workoutDetails.setsCount', { count: muscle.sets })}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Secondary Muscles */}
              {detailedMuscleSplit.secondary.length > 0 && (
                <View style={styles.muscleSection}>
                  <Text style={styles.muscleSectionLabel}>{t('workoutDetails.secondary')}</Text>
                  <View style={styles.secondaryMuscleList}>
                    {detailedMuscleSplit.secondary.map((muscle) => (
                      <View key={muscle.name} style={styles.secondaryMusclePill}>
                        <Text style={styles.secondaryMuscleText}>
                          {muscle.name.charAt(0).toUpperCase() + muscle.name.slice(1)}
                        </Text>
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
            <Text style={styles.sectionTitle}>{t('workoutDetails.muscleSplit')}</Text>
            <View style={styles.card}>
              <View style={styles.muscleList}>
                {sortedMuscles.map((muscle) => (
                  <View key={muscle.name} style={styles.muscleRow}>
                    <Text style={styles.muscleName}>
                      {muscle.name.charAt(0).toUpperCase() + muscle.name.slice(1)}
                    </Text>
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
        <Text style={styles.sectionTitle}>{t('workoutDetails.exercises')}</Text>
        <View style={styles.card}>
          {exercises.map((ex, index) => {
            const completedSets = ex.sets.filter((s) => s.completed);
            const isExpanded = expandedExercises.has(ex.id);

            return (
              <View key={ex.id}>
                {ex.superset_id != null && (
                  <View
                    style={[
                      styles.supersetBadge,
                      { backgroundColor: getSupersetColor(ex.superset_id) },
                    ]}
                  >
                    <Text style={styles.supersetBadgeText}>Superset {ex.superset_id}</Text>
                  </View>
                )}
                <Pressable
                  style={styles.exerciseRow}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleExercise(ex.id);
                  }}
                >
                  <Pressable
                    onPress={() => {
                      withLock(() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        prefetchExerciseGif(ex.exercise_id);
                        router.push(`/exercise/${ex.exercise_id}`);
                      });
                    }}
                  >
                    <ExerciseImage
                      gifUrl={ex.image_url || undefined}
                      thumbnailUrl={ex.thumbnail_url || undefined}
                      size={40}
                      borderRadius={8}
                    />
                  </Pressable>
                  <View style={{ flex: 1, justifyContent: 'center' }} pointerEvents="box-none">
                    <Text
                      style={[styles.exerciseName, { alignSelf: 'flex-start' }]}
                      onPress={() => {
                        withLock(() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          prefetchExerciseGif(ex.exercise_id);
                          router.push(`/exercise/${ex.exercise_id}`);
                        });
                      }}
                    >
                      {formatExerciseNameString(ex.exercise_name)}
                    </Text>
                  </View>
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
                      <Text style={[styles.setHeaderText, styles.setColumn]}>
                        {t('template.set')}
                      </Text>
                      <Text style={styles.setHeaderText}>{t('template.weightAndReps')}</Text>
                    </View>
                    {completedSets.map((set, setIndex) => (
                      <View key={set.id} style={styles.setRow}>
                        <Text
                          style={[
                            styles.setNumber,
                            styles.setColumn,
                            set.set_type === 'warmup' && styles.setTypeWarmup,
                            set.set_type === 'failure' && styles.setTypeFailure,
                            set.set_type === 'dropset' && styles.setTypeDropset,
                          ]}
                        >
                          {getSetTypeLabel(set.set_type, setIndex)}
                        </Text>
                        <Text style={styles.setText}>
                          {set.weight && set.reps
                            ? `${units === 'imperial' ? Math.round(kgToLbs(set.weight)) : set.weight} ${weightLabel} x ${set.reps} reps${set.rpe ? ` @ RPE ${set.rpe}` : ''}`
                            : set.weight
                              ? `${units === 'imperial' ? Math.round(kgToLbs(set.weight)) : set.weight} ${weightLabel} x - reps`
                              : set.reps
                                ? `- x ${set.reps} reps`
                                : '- x -'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {index < exercises.length - 1 && <View style={styles.exerciseDivider} />}
              </View>
            );
          })}

          {exercises.length === 0 && (
            <Text style={styles.emptyText}>{t('workoutDetails.noExercisesRecorded')}</Text>
          )}
        </View>

        {/* Delete Workout (text button at bottom) */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            handleDeleteWorkout();
          }}
          style={styles.deleteTextButton}
        >
          <Text style={styles.deleteText}>{t('workoutDetails.deleteWorkout')}</Text>
        </Pressable>

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
  workoutPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: spacing.md,
    backgroundColor: colors.borderLight,
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
    paddingVertical: 12,
    gap: spacing.sm,
  },
  exerciseName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  exerciseDivider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.25)',
  },
  setsContainer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  setsHeader: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
  },
  setHeaderText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  setColumn: {
    width: 40,
    marginRight: spacing.md,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  setNumber: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
  },
  setText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  setTypeWarmup: {
    color: '#F5A623',
  },
  setTypeFailure: {
    color: colors.danger,
  },
  setTypeDropset: {
    color: '#2196F3',
  },
  supersetBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },
  supersetBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textInverse,
    letterSpacing: 0.2,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  deleteTextButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  deleteText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.error,
  },
  bottomSpacer: {
    height: 40,
  },
});
