import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, fonts, fontSize, spacing, cardStyle, dividerStyle } from '@/constants/theme';
import { saveCompletedWorkout, getExerciseMuscles, ExerciseMuscle } from '@/services/api/workouts';
import { UnitSystem, kgToLbs } from '@/utils/units';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useTemplateStore, TemplateExercise, TemplateSet } from '@/stores/templateStore';
import { useWorkoutStore } from '@/stores/workoutStore';

// Set types matching the active workout
type SetType = 'normal' | 'warmup' | 'failure' | 'dropset';

// Types for workout data passed from active-workout
interface ExerciseSet {
  id: string;
  previous: string;
  kg: string;
  reps: string;
  completed: boolean;
  setType?: SetType;
}

interface Exercise {
  id: string;
  name: string;
  muscle: string;
}

interface WorkoutExercise {
  exercise: Exercise;
  notes: string;
  sets: ExerciseSet[];
  supersetId?: number | null;
  restTimerSeconds?: number;
}

interface WorkoutData {
  exercises: WorkoutExercise[];
  durationSeconds: number;
  startedAt: string;
  userId: string;
  sourceTemplateId?: string;
  templateName?: string;
}

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

function ImagePlaceholderIcon() {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Rect
          x={3}
          y={3}
          width={18}
          height={18}
          rx={2}
          stroke={colors.textTertiary}
          strokeWidth={1.5}
        />
        <Path
          d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
          stroke={colors.textTertiary}
          strokeWidth={1.5}
        />
        <Path
          d="M21 15l-5-5L5 21"
          stroke={colors.textTertiary}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      {/* Small plus indicator */}
      <View
        style={{
          position: 'absolute',
          bottom: -4,
          right: -4,
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
        </Svg>
      </View>
    </View>
  );
}

function DumbbellIcon() {
  return <Ionicons name="barbell-outline" size={20} color={colors.primary} />;
}

// Calculate muscle distribution from exercises (basic fallback using exercise.muscle)
function calculateBasicMuscleSplit(exercises: WorkoutExercise[]): Map<string, number> {
  const muscleCount = new Map<string, number>();

  exercises.forEach((we) => {
    const completedSets = we.sets.filter((s) => s.completed).length;
    if (completedSets > 0) {
      const muscle = we.exercise.muscle || 'Other';
      const current = muscleCount.get(muscle) || 0;
      muscleCount.set(muscle, current + completedSets);
    }
  });

  return muscleCount;
}

// Calculate detailed muscle distribution using exercise_muscles data
interface DetailedMuscleData {
  name: string;
  sets: number;
  isPrimary: boolean;
}

function calculateDetailedMuscleSplit(
  exercises: WorkoutExercise[],
  exerciseMuscles: Map<string, ExerciseMuscle[]>
): DetailedMuscleData[] {
  const muscleMap = new Map<string, { primarySets: number; secondarySets: number }>();

  exercises.forEach((we) => {
    const completedSets = we.sets.filter((s) => s.completed).length;
    if (completedSets === 0) return;

    const muscles = exerciseMuscles.get(we.exercise.id);
    if (muscles && muscles.length > 0) {
      // Use detailed muscle mappings
      muscles.forEach((m) => {
        const existing = muscleMap.get(m.muscle) || { primarySets: 0, secondarySets: 0 };
        if (m.activation === 'primary') {
          existing.primarySets += completedSets;
        } else {
          existing.secondarySets += completedSets;
        }
        muscleMap.set(m.muscle, existing);
      });
    } else {
      // Fallback to basic muscle from exercise
      const muscle = we.exercise.muscle || 'Other';
      const existing = muscleMap.get(muscle) || { primarySets: 0, secondarySets: 0 };
      existing.primarySets += completedSets;
      muscleMap.set(muscle, existing);
    }
  });

  // Convert to array
  const result: DetailedMuscleData[] = [];
  muscleMap.forEach((data, muscle) => {
    if (data.primarySets > 0) {
      result.push({ name: muscle, sets: data.primarySets, isPrimary: true });
    }
    if (data.secondarySets > 0) {
      result.push({ name: muscle, sets: data.secondarySets, isPrimary: false });
    }
  });

  // Sort: primary first (by sets desc), then secondary (by sets desc)
  return result.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return b.sets - a.sets;
  });
}

// Calculate total volume (weight x reps)
function calculateTotalVolume(exercises: WorkoutExercise[]): number {
  let total = 0;
  exercises.forEach((we) => {
    we.sets.forEach((set) => {
      if (set.completed && set.kg && set.reps) {
        const weight = parseFloat(set.kg);
        const reps = parseInt(set.reps, 10);
        if (!isNaN(weight) && !isNaN(reps)) {
          total += weight * reps;
        }
      }
    });
  });
  return total;
}

// Calculate total completed sets
function calculateTotalSets(exercises: WorkoutExercise[]): number {
  return exercises.reduce((total, we) => {
    return total + we.sets.filter((s) => s.completed).length;
  }, 0);
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

export default function SaveWorkoutScreen() {
  const params = useLocalSearchParams();
  const { getUnitSystem } = useUserPreferencesStore();
  const units = getUnitSystem();

  // Template store
  const getTemplateById = useTemplateStore((state) => state.getTemplateById);
  const updateTemplateFromWorkout = useTemplateStore((state) => state.updateTemplateFromWorkout);

  // Workout store - for marking scheduled workouts as complete
  const markScheduledWorkoutComplete = useWorkoutStore(
    (state) => state.markScheduledWorkoutComplete
  );

  // Parse workout data from params
  const workoutData: WorkoutData = useMemo(() => {
    try {
      return JSON.parse(params.workoutData as string);
    } catch {
      return { exercises: [], durationSeconds: 0, startedAt: '', userId: '' };
    }
  }, [params.workoutData]);

  const [workoutTitle, setWorkoutTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showExerciseChangeModal, setShowExerciseChangeModal] = useState(false);
  const [pendingSaveCallback, setPendingSaveCallback] = useState<(() => void) | null>(null);

  // Detailed muscle data from exercise_muscles table
  const [exerciseMusclesMap, setExerciseMusclesMap] = useState<Map<string, ExerciseMuscle[]>>(
    new Map()
  );
  const [isLoadingMuscles, setIsLoadingMuscles] = useState(true);

  // Fetch detailed muscle mappings on mount
  useEffect(() => {
    async function fetchMuscleData() {
      const exerciseIds = workoutData.exercises.map((we) => we.exercise.id);
      if (exerciseIds.length === 0) {
        setIsLoadingMuscles(false);
        return;
      }

      const muscleData = await getExerciseMuscles(exerciseIds);
      setExerciseMusclesMap(muscleData);
      setIsLoadingMuscles(false);
    }

    fetchMuscleData();
  }, [workoutData.exercises]);

  // Calculate stats
  const totalVolume = useMemo(
    () => calculateTotalVolume(workoutData.exercises),
    [workoutData.exercises]
  );
  const totalSets = useMemo(
    () => calculateTotalSets(workoutData.exercises),
    [workoutData.exercises]
  );

  // Calculate detailed muscle split using exercise_muscles data
  const detailedMuscles = useMemo(() => {
    return calculateDetailedMuscleSplit(workoutData.exercises, exerciseMusclesMap);
  }, [workoutData.exercises, exerciseMusclesMap]);

  // Calculate total sets for percentage calculation
  const totalPrimarySets = useMemo(() => {
    return detailedMuscles.filter((m) => m.isPrimary).reduce((sum, m) => sum + m.sets, 0);
  }, [detailedMuscles]);

  // Separate primary and secondary muscles for display
  const primaryMuscles = useMemo(() => {
    return detailedMuscles
      .filter((m) => m.isPrimary)
      .map((m) => ({
        ...m,
        percentage: totalPrimarySets > 0 ? Math.round((m.sets / totalPrimarySets) * 100) : 0,
      }));
  }, [detailedMuscles, totalPrimarySets]);

  const secondaryMuscles = useMemo(() => {
    return detailedMuscles.filter((m) => !m.isPrimary);
  }, [detailedMuscles]);

  // Get exercises with completed sets
  const completedExercises = useMemo(() => {
    return workoutData.exercises.filter((we) => we.sets.some((s) => s.completed));
  }, [workoutData.exercises]);

  // Check if exercises have changed from the original template
  const exercisesChanged = useMemo(() => {
    if (!workoutData.sourceTemplateId) return false;

    const template = getTemplateById(workoutData.sourceTemplateId);
    if (!template) return false;

    const templateExerciseIds = template.exercises.map((e) => e.exerciseId);
    const workoutExerciseIds = workoutData.exercises.map((e) => e.exercise.id);

    // Check if exercises were added or removed
    if (templateExerciseIds.length !== workoutExerciseIds.length) return true;

    // Check if the exercise IDs are the same (in the same order)
    for (let i = 0; i < templateExerciseIds.length; i++) {
      if (templateExerciseIds[i] !== workoutExerciseIds[i]) return true;
    }

    return false;
  }, [workoutData.sourceTemplateId, workoutData.exercises, getTemplateById]);

  // Convert workout exercises to template exercises format
  const convertToTemplateExercises = (): TemplateExercise[] => {
    return workoutData.exercises.map((we, index) => ({
      id: `tex_${Date.now()}_${index}`,
      exerciseId: we.exercise.id,
      exerciseName: we.exercise.name,
      muscle: we.exercise.muscle,
      sets: we.sets
        .filter((s) => s.completed)
        .map((s, setIndex) => ({
          setNumber: setIndex + 1,
          targetWeight: s.kg ? parseFloat(s.kg) : undefined,
          targetReps: s.reps ? parseInt(s.reps, 10) : undefined,
        })),
      notes: we.notes || undefined,
      restTimerSeconds: we.restTimerSeconds ?? 90,
    }));
  };

  // Update template with new weights/reps (silent update)
  const updateTemplateWeights = () => {
    if (!workoutData.sourceTemplateId) return;

    const template = getTemplateById(workoutData.sourceTemplateId);
    if (!template) return;

    // Create updated exercises with new weights/reps but keeping original structure
    const updatedExercises: TemplateExercise[] = template.exercises.map((templateEx) => {
      const workoutEx = workoutData.exercises.find(
        (we) => we.exercise.id === templateEx.exerciseId
      );

      if (!workoutEx) return templateEx;

      // Update sets with completed values
      const completedSets = workoutEx.sets.filter((s) => s.completed);
      const updatedSets: TemplateSet[] = completedSets.map((s, index) => ({
        setNumber: index + 1,
        targetWeight: s.kg ? parseFloat(s.kg) : templateEx.sets[index]?.targetWeight,
        targetReps: s.reps ? parseInt(s.reps, 10) : templateEx.sets[index]?.targetReps,
      }));

      return {
        ...templateEx,
        sets: updatedSets.length > 0 ? updatedSets : templateEx.sets,
      };
    });

    updateTemplateFromWorkout(workoutData.sourceTemplateId, updatedExercises);
  };

  // Handle updating template with new exercises
  const handleUpdateTemplate = () => {
    if (!workoutData.sourceTemplateId) return;

    const newExercises = convertToTemplateExercises();
    updateTemplateFromWorkout(workoutData.sourceTemplateId, newExercises);
    setShowExerciseChangeModal(false);

    // Continue with save
    if (pendingSaveCallback) {
      pendingSaveCallback();
      setPendingSaveCallback(null);
    }
  };

  // Keep original template
  const handleKeepOriginal = () => {
    setShowExerciseChangeModal(false);

    // Still update weights/reps silently for matching exercises
    updateTemplateWeights();

    // Continue with save
    if (pendingSaveCallback) {
      pendingSaveCallback();
      setPendingSaveCallback(null);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // The actual save logic (extracted to be callable after modal confirmation)
  const performSave = async () => {
    setIsSaving(true);

    try {
      const completedAt = new Date();
      const startedAt = new Date(workoutData.startedAt);

      // Filter exercises that have completed sets
      const exercisesWithCompletedSets = workoutData.exercises.filter((we) =>
        we.sets.some((s) => s.completed)
      );

      const workoutId = await saveCompletedWorkout({
        userId: workoutData.userId,
        name: workoutTitle || undefined,
        startedAt,
        completedAt,
        durationSeconds: workoutData.durationSeconds,
        notes: description || undefined,
        sourceTemplateId: workoutData.sourceTemplateId,
        exercises: exercisesWithCompletedSets.map((we) => ({
          exerciseId: we.exercise.id,
          exerciseName: we.exercise.name,
          exerciseMuscle: we.exercise.muscle,
          notes: we.notes,
          supersetId: we.supersetId ?? null,
          restTimerSeconds: we.restTimerSeconds ?? 90,
          sets: we.sets
            .filter((set) => set.completed)
            .map((set, index) => ({
              setNumber: index + 1,
              weightKg: set.kg ? parseFloat(set.kg) : null,
              reps: set.reps ? parseInt(set.reps, 10) : null,
              setType: set.setType || 'normal',
              completed: true,
            })),
        })),
      });

      if (workoutId) {
        // Auto-mark any matching scheduled workout as complete for today
        // Use local date to match how calendar displays dates
        const todayKey = `${completedAt.getFullYear()}-${String(completedAt.getMonth() + 1).padStart(2, '0')}-${String(completedAt.getDate()).padStart(2, '0')}`;
        markScheduledWorkoutComplete(
          todayKey,
          workoutData.userId,
          workoutData.sourceTemplateId,
          workoutTitle || workoutData.templateName
        );

        Alert.alert('Workout Saved!', 'Great job on completing your workout.', [
          {
            text: 'OK',
            onPress: () => {
              router.dismissAll();
              // Navigate to Planner tab so user can see their saved workout
              router.replace('/(tabs)');
            },
          },
        ]);
      } else {
        Alert.alert(
          'Save Failed',
          'Could not save workout to database. The workout tables may not be set up yet.'
        );
      }
    } catch (error: any) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', `Failed to save workout: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!workoutData.userId) {
      Alert.alert('Error', 'You must be logged in to save workouts.');
      return;
    }

    // Filter exercises that have completed sets
    const exercisesWithCompletedSets = workoutData.exercises.filter((we) =>
      we.sets.some((s) => s.completed)
    );

    if (exercisesWithCompletedSets.length === 0) {
      Alert.alert('No Completed Sets', 'You need at least one completed set to save.');
      return;
    }

    // Check if this workout came from a template and exercises have changed
    if (workoutData.sourceTemplateId && exercisesChanged) {
      // Show modal to ask user if they want to update template
      setPendingSaveCallback(() => performSave);
      setShowExerciseChangeModal(true);
      return;
    }

    // If from template but exercises haven't changed, silently update weights/reps
    if (workoutData.sourceTemplateId && !exercisesChanged) {
      updateTemplateWeights();
    }

    // Proceed with save
    await performSave();
  };

  // Get color for muscle type
  const getMuscleColor = (muscle: string): string => {
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
    };
    return muscleColors[muscle] || colors.primary;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <BackIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Save Workout</Text>
        <Pressable onPress={handleSave} disabled={isSaving} style={styles.saveButton}>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveText}>SAVE</Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Workout Info Card */}
        <View style={[styles.card, styles.workoutInfoCard]}>
          <View style={styles.workoutInfoRow}>
            <Pressable
              style={styles.imagePlaceholder}
              onPress={() => {
                // TODO: Implement image picker
                Alert.alert('Coming Soon', 'Image upload will be available soon.');
              }}
            >
              <ImagePlaceholderIcon />
            </Pressable>
            <View style={styles.workoutTextInputs}>
              <TextInput
                style={styles.titleInput}
                placeholder="Workout Title"
                placeholderTextColor={colors.textTertiary}
                value={workoutTitle}
                onChangeText={setWorkoutTitle}
              />
              <TextInput
                style={styles.descriptionInput}
                placeholder="Description (Optional)"
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Routine Row */}
          <Pressable style={styles.infoRow}>
            <Text style={styles.infoLabel}>Routine</Text>
            <View style={styles.infoValueRow}>
              <Text style={styles.infoValue}>Default Routine</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </View>
          </Pressable>

          <View style={styles.cardDivider} />

          {/* Tags Row */}
          <Pressable style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tags</Text>
            <View style={styles.tagsContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>No Tag</Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Date & Time Section */}
        <Text style={styles.sectionTitle}>Date & Time</Text>
        <View style={styles.card}>
          <View style={styles.statRow}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time-outline" size={18} color={colors.text} />
            </View>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{formatDuration(workoutData.durationSeconds)}</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.statRow}>
            <View style={styles.statIconContainer}>
              <Ionicons name="barbell-outline" size={18} color={colors.text} />
            </View>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>{formatVolume(totalVolume, units)}</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.statRow}>
            <View style={styles.statIconContainer}>
              <Ionicons name="layers-outline" size={18} color={colors.text} />
            </View>
            <Text style={styles.statLabel}>Sets</Text>
            <Text style={styles.statValue}>{totalSets}</Text>
          </View>
        </View>

        {/* Muscles Worked Section */}
        <Text style={styles.sectionTitle}>Muscles Worked</Text>
        <View style={styles.card}>
          {isLoadingMuscles ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ paddingVertical: spacing.md }}
            />
          ) : (
            <>
              {/* Primary Muscles */}
              {primaryMuscles.length > 0 && (
                <View style={styles.muscleSection}>
                  <Text style={styles.muscleSectionLabel}>Primary</Text>
                  <View style={styles.muscleList}>
                    {primaryMuscles.map((muscle) => (
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
                        <Text style={styles.musclePercentage}>{muscle.sets} sets</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Secondary Muscles */}
              {secondaryMuscles.length > 0 && (
                <View style={styles.muscleSection}>
                  {primaryMuscles.length > 0 && <View style={styles.cardDivider} />}
                  <Text style={styles.muscleSectionLabel}>Secondary</Text>
                  <View style={styles.secondaryMuscleList}>
                    {secondaryMuscles.map((muscle) => (
                      <View key={muscle.name} style={styles.secondaryMusclePill}>
                        <Text style={styles.secondaryMuscleText}>{muscle.name}</Text>
                        <Text style={styles.secondaryMuscleSets}>{muscle.sets}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {primaryMuscles.length === 0 && secondaryMuscles.length === 0 && (
                <Text style={styles.emptyText}>No muscle data available</Text>
              )}
            </>
          )}
        </View>

        {/* Exercises Section */}
        <Text style={styles.sectionTitle}>Exercises</Text>
        <View style={styles.card}>
          <View style={styles.exerciseList}>
            {completedExercises.map((we, index) => (
              <View key={`${we.exercise.id}-${index}`} style={styles.exerciseRow}>
                <View style={styles.exerciseIconContainer}>
                  <DumbbellIcon />
                </View>
                <Text style={styles.exerciseName}>{we.exercise.name}</Text>
              </View>
            ))}

            {completedExercises.length === 0 && (
              <Text style={styles.emptyText}>No completed exercises</Text>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Exercise Change Modal */}
      <Modal visible={showExerciseChangeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.exerciseChangeModal}>
            <Text style={styles.modalTitle}>Update Template?</Text>
            <Text style={styles.modalSubtitle}>
              You added or removed exercises from your workout. Would you like to update your
              template with these changes?
            </Text>

            <Pressable style={styles.updateTemplateButton} onPress={handleUpdateTemplate}>
              <Text style={styles.updateTemplateButtonText}>Update Template</Text>
            </Pressable>

            <Pressable style={styles.keepOriginalButton} onPress={handleKeepOriginal}>
              <Text style={styles.keepOriginalButtonText}>Keep Original</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  saveButton: {
    padding: spacing.xs,
  },
  saveText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.primary,
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
  workoutInfoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  workoutTextInputs: {
    flex: 1,
    justifyContent: 'center',
  },
  titleInput: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  descriptionInput: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingVertical: spacing.xs,
  },
  cardDivider: {
    ...dividerStyle,
    marginVertical: spacing.sm,
    marginHorizontal: -spacing.sm,
    marginLeft: 0,
    marginRight: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoValue: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
  },
  tagText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
  muscleSection: {
    gap: spacing.xs,
  },
  muscleSectionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
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
    width: 100,
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
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  secondaryMuscleSets: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  exerciseList: {
    gap: spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  exerciseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
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

  // Exercise Change Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  exerciseChangeModal: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  updateTemplateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  updateTemplateButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
  keepOriginalButton: {
    backgroundColor: '#F5F4FA',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  keepOriginalButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
});
