import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { colors, fonts, fontSize, spacing, cardStyle, dividerStyle } from '@/constants/theme';
import { saveCompletedWorkout, updateCompletedWorkout } from '@/services/api/workouts';
import { UnitSystem, kgToLbs, toKgForStorage, getWeightUnit } from '@/utils/units';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useTemplateStore, TemplateExercise, TemplateSet } from '@/stores/templateStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import {
  ImagePickerSheet,
  ImagePlaceholderIcon,
  SelectedImageData,
} from '@/components/ImagePickerSheet';
import { consumePendingTemplateImage } from '@/lib/imagePickerState';
import { getTemplateImageById } from '@/constants/templateImages';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { cancelWorkoutInProgressReminder } from '@/services/notifications';
import { endWorkoutLiveActivity } from '@/services/liveActivity';
import { resolveExerciseDisplayName } from '@/stores/exerciseStore';

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
  rpe?: number | null;
}

interface Exercise {
  id: string;
  name: string;
  muscle: string;
  gifUrl?: string;
  thumbnailUrl?: string;
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
  scheduledWorkoutId?: string;
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function DurationPickerModal({
  visible,
  durationSeconds,
  onSave,
  onClose,
}: {
  visible: boolean;
  durationSeconds: number;
  onSave: (seconds: number) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [selectedSeconds, setSelectedSeconds] = useState(durationSeconds);

  useEffect(() => {
    if (visible) {
      setSelectedSeconds(durationSeconds);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const adjust = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSeconds((prev) => Math.max(60, prev + delta));
  };

  const displayHours = Math.floor(selectedSeconds / 3600);
  const displayMinutes = Math.floor((selectedSeconds % 3600) / 60);

  const durationDisplay =
    displayHours > 0 ? `${displayHours}h ${displayMinutes}min` : `${displayMinutes}min`;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        style={pickerStyles.overlay}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onClose();
        }}
      >
        <Animated.View style={[pickerStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={pickerStyles.handle} />

            <View style={pickerStyles.header}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                }}
              >
                <Text style={pickerStyles.cancelText}>{i18n.t('common.cancel')}</Text>
              </Pressable>
              <Text style={pickerStyles.title}>{i18n.t('saveWorkout.duration')}</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  onSave(selectedSeconds);
                }}
              >
                <Text style={pickerStyles.saveText}>{i18n.t('common.save')}</Text>
              </Pressable>
            </View>

            <View style={pickerStyles.durationDisplay}>
              <Text style={pickerStyles.durationText}>{durationDisplay}</Text>
            </View>

            <View style={pickerStyles.buttonRow}>
              <Pressable style={pickerStyles.adjustButton} onPress={() => adjust(-5 * 60)}>
                <Text style={pickerStyles.adjustButtonText}>-5</Text>
              </Pressable>
              <Pressable style={pickerStyles.adjustButton} onPress={() => adjust(-60)}>
                <Text style={pickerStyles.adjustButtonText}>-1</Text>
              </Pressable>
              <Text style={pickerStyles.unitLabel}>min</Text>
              <Pressable style={pickerStyles.adjustButton} onPress={() => adjust(60)}>
                <Text style={pickerStyles.adjustButtonText}>+1</Text>
              </Pressable>
              <Pressable style={pickerStyles.adjustButton} onPress={() => adjust(5 * 60)}>
                <Text style={pickerStyles.adjustButtonText}>+5</Text>
              </Pressable>
            </View>

            <View style={pickerStyles.buttonRow}>
              <Pressable style={pickerStyles.adjustButton} onPress={() => adjust(-15 * 60)}>
                <Text style={pickerStyles.adjustButtonText}>-15</Text>
              </Pressable>
              <Pressable style={pickerStyles.adjustButton} onPress={() => adjust(-60 * 60)}>
                <Text style={pickerStyles.adjustButtonText}>-1h</Text>
              </Pressable>
              <Text style={pickerStyles.unitLabel}>hour</Text>
              <Pressable style={pickerStyles.adjustButton} onPress={() => adjust(60 * 60)}>
                <Text style={pickerStyles.adjustButtonText}>+1h</Text>
              </Pressable>
              <Pressable style={pickerStyles.adjustButton} onPress={() => adjust(15 * 60)}>
                <Text style={pickerStyles.adjustButtonText}>+15</Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  saveText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  durationDisplay: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  durationText: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  adjustButton: {
    width: 56,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  unitLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    width: 36,
    textAlign: 'center',
  },
});

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

export default function SaveWorkoutScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { getUnitSystem } = useUserPreferencesStore();
  const units = getUnitSystem();
  const { isNavigating, withLock } = useNavigationLock();

  // Edit mode params
  const editWorkoutId = params.editWorkoutId as string | undefined;
  const isEditMode = !!editWorkoutId;

  // Template store
  const getTemplateById = useTemplateStore((state) => state.getTemplateById);
  const updateTemplateFromWorkout = useTemplateStore((state) => state.updateTemplateFromWorkout);

  // Workout store - for marking scheduled workouts as complete and clearing active workout
  const markScheduledWorkoutComplete = useWorkoutStore(
    (state) => state.markScheduledWorkoutComplete
  );
  const toggleWorkoutCompletion = useWorkoutStore((state) => state.toggleWorkoutCompletion);
  const isWorkoutCompleted = useWorkoutStore((state) => state.isWorkoutCompleted);
  const discardActiveWorkout = useWorkoutStore((state) => state.discardActiveWorkout);

  // Parse workout data from params
  const workoutData: WorkoutData = useMemo(() => {
    try {
      return JSON.parse(params.workoutData as string);
    } catch {
      return { exercises: [], durationSeconds: 0, startedAt: '', userId: '' };
    }
  }, [params.workoutData]);

  const [workoutTitle, setWorkoutTitle] = useState(
    isEditMode && params.editTitle ? (params.editTitle as string) : workoutData.templateName || ''
  );
  const [description, setDescription] = useState(
    isEditMode && params.editNotes ? (params.editNotes as string) : ''
  );
  const [editDuration, setEditDuration] = useState(workoutData.durationSeconds);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showExerciseChangeModal, setShowExerciseChangeModal] = useState(false);
  const [pendingSaveCallback, setPendingSaveCallback] = useState<(() => void) | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Initialize image from edit params if editing an existing workout
  const [selectedImage, setSelectedImage] = useState<SelectedImageData | null>(() => {
    if (!isEditMode) return null;
    const editImageType = params.editImageType as string | undefined;
    const editImageUri = params.editImageUri as string | undefined;
    const editImageTemplateId = params.editImageTemplateId as string | undefined;
    if (!editImageType) return null;

    if (editImageType === 'template' && editImageTemplateId) {
      const localSource = getTemplateImageById(editImageTemplateId);
      return {
        type: 'template' as const,
        uri: '',
        localSource: localSource || undefined,
        templateImageId: editImageTemplateId,
      };
    }
    if ((editImageType === 'camera' || editImageType === 'gallery') && editImageUri) {
      return {
        type: editImageType as 'camera' | 'gallery',
        uri: editImageUri,
      };
    }
    return null;
  });

  // Pick up template image selection when returning from template-images screen
  useFocusEffect(
    useCallback(() => {
      const pending = consumePendingTemplateImage();
      if (pending) {
        setSelectedImage({
          type: 'template',
          uri: '',
          localSource: pending.source,
          templateImageId: pending.id,
        });
      }
    }, [])
  );

  // Calculate stats
  const totalVolume = useMemo(
    () => calculateTotalVolume(workoutData.exercises),
    [workoutData.exercises]
  );
  const totalSets = useMemo(
    () => calculateTotalSets(workoutData.exercises),
    [workoutData.exercises]
  );

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
      exerciseName: resolveExerciseDisplayName(we.exercise.id, we.exercise.name),
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // The current effective duration (always editable)
  const currentDuration = editDuration;

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

      const saveInput = {
        userId: workoutData.userId,
        name: workoutTitle || undefined,
        startedAt,
        completedAt,
        durationSeconds: currentDuration,
        notes: description || undefined,
        sourceTemplateId: workoutData.sourceTemplateId,
        imageType: selectedImage?.type,
        imageUri: selectedImage?.uri || undefined,
        imageTemplateId: selectedImage?.templateImageId || undefined,
        exercises: exercisesWithCompletedSets.map((we) => ({
          exerciseId: we.exercise.id,
          exerciseName: resolveExerciseDisplayName(we.exercise.id, we.exercise.name),
          exerciseMuscle: we.exercise.muscle,
          notes: we.notes,
          supersetId: we.supersetId ?? null,
          restTimerSeconds: we.restTimerSeconds ?? 90,
          sets: we.sets
            .filter((set) => set.completed)
            .map((set, index) => ({
              setNumber: index + 1,
              // User enters weight in display units (kg or lbs); convert to kg for storage
              weightKg: set.kg ? toKgForStorage(parseFloat(set.kg), units) : null,
              reps: set.reps ? parseInt(set.reps, 10) : null,
              setType: set.setType || 'normal',
              completed: true,
              rpe: set.rpe ?? null,
            })),
        })),
      };

      if (isEditMode) {
        // Update existing workout
        const success = await updateCompletedWorkout(editWorkoutId, saveInput);
        if (success) {
          Alert.alert(
            i18n.t('saveWorkout.workoutUpdated'),
            i18n.t('saveWorkout.workoutUpdatedMessage'),
            [
              {
                text: i18n.t('common.ok'),
                onPress: () => {
                  router.dismissAll();
                  router.push({
                    pathname: '/workout-details',
                    params: { workoutId: editWorkoutId },
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert(
            i18n.t('saveWorkout.updateFailed'),
            i18n.t('saveWorkout.updateFailedMessage')
          );
        }
      } else {
        // Save new workout
        const workoutId = await saveCompletedWorkout(saveInput);

        if (workoutId) {
          // Clear active workout now that save is confirmed
          cancelWorkoutInProgressReminder();
          endWorkoutLiveActivity();
          discardActiveWorkout();
          // Auto-mark the scheduled workout as complete for today
          const todayKey = `${completedAt.getFullYear()}-${String(completedAt.getMonth() + 1).padStart(2, '0')}-${String(completedAt.getDate()).padStart(2, '0')}`;
          if (workoutData.scheduledWorkoutId) {
            if (!isWorkoutCompleted(workoutData.scheduledWorkoutId, todayKey)) {
              toggleWorkoutCompletion(workoutData.scheduledWorkoutId, todayKey);
            }
          } else {
            markScheduledWorkoutComplete(
              todayKey,
              workoutData.userId,
              workoutData.sourceTemplateId,
              workoutTitle || workoutData.templateName || undefined
            );
          }

          const displayTitle = workoutTitle || workoutData.templateName || 'Workout';
          router.dismissAll();
          router.push({
            pathname: '/workout-complete',
            params: {
              workoutTitle: displayTitle,
              durationSeconds: String(currentDuration),
              totalVolume: String(
                Math.round(units === 'imperial' ? kgToLbs(totalVolume) : totalVolume)
              ),
              volumeUnit: getWeightUnit(units),
              exerciseCount: String(exercisesWithCompletedSets.length),
              totalSets: String(totalSets),
              userId: workoutData.userId,
            },
          });
        } else {
          Alert.alert(i18n.t('saveWorkout.saveFailed'), i18n.t('saveWorkout.saveFailedMessage'));
        }
      }
    } catch (error: any) {
      console.error('Error saving workout:', error);
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('saveWorkout.saveError', { error: error?.message || 'Unknown error' })
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!workoutData.userId) {
      Alert.alert(i18n.t('common.error'), i18n.t('saveWorkout.mustBeLoggedIn'));
      return;
    }

    // Filter exercises that have completed sets
    const exercisesWithCompletedSets = workoutData.exercises.filter((we) =>
      we.sets.some((s) => s.completed)
    );

    if (exercisesWithCompletedSets.length === 0) {
      Alert.alert(
        i18n.t('saveWorkout.noCompletedSets'),
        i18n.t('saveWorkout.noCompletedSetsMessage')
      );
      return;
    }

    // Skip template update logic when editing an existing workout
    if (!isEditMode) {
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
    }

    // Proceed with save
    await performSave();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <BackIcon />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditMode ? t('saveWorkout.editWorkout') : t('saveWorkout.saveWorkout')}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            handleSave();
          }}
          disabled={isSaving}
          style={styles.saveButton}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveText}>
              {isEditMode ? t('saveWorkout.update') : t('saveWorkout.save')}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Workout Info Card */}
        <View style={[styles.card, styles.workoutInfoCard]}>
          <View style={styles.workoutInfoRow}>
            <Pressable
              style={[styles.imagePlaceholder, selectedImage && styles.imagePlaceholderFilled]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowImagePicker(true);
              }}
            >
              {selectedImage ? (
                selectedImage.localSource ? (
                  <Image
                    source={selectedImage.localSource}
                    style={styles.selectedImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.selectedImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                )
              ) : (
                <ImagePlaceholderIcon />
              )}
            </Pressable>
            <View style={styles.workoutTextInputs}>
              <TextInput
                style={styles.titleInput}
                placeholder={t('saveWorkout.workoutTitle')}
                placeholderTextColor={colors.textTertiary}
                value={workoutTitle}
                onChangeText={setWorkoutTitle}
              />
              <TextInput
                style={styles.descriptionInput}
                placeholder={t('saveWorkout.descriptionOptional')}
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <Text style={styles.sectionTitle}>{t('saveWorkout.stats')}</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.statRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowDurationModal(true);
            }}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="time-outline" size={18} color={colors.text} />
            </View>
            <Text style={styles.statLabel}>{t('saveWorkout.duration')}</Text>
            <Text style={styles.statValue}>{formatDuration(currentDuration)}</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textSecondary}
              style={{ marginLeft: 8 }}
            />
          </Pressable>

          <View style={styles.cardDivider} />

          <View style={styles.statRow}>
            <View style={styles.statIconContainer}>
              <Ionicons name="barbell-outline" size={18} color={colors.text} />
            </View>
            <Text style={styles.statLabel}>{t('saveWorkout.volume')}</Text>
            <Text style={styles.statValue}>{formatVolume(totalVolume, units)}</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.statRow}>
            <View style={styles.statIconContainer}>
              <Ionicons name="layers-outline" size={18} color={colors.text} />
            </View>
            <Text style={styles.statLabel}>{t('saveWorkout.sets')}</Text>
            <Text style={styles.statValue}>{totalSets}</Text>
          </View>
        </View>

        {!isEditMode && (
          <Pressable
            style={styles.discardButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(t('saveWorkout.discardWorkout'), t('saveWorkout.discardWorkoutMessage'), [
                { text: i18n.t('common.cancel'), style: 'cancel' },
                {
                  text: t('saveWorkout.discard'),
                  style: 'destructive',
                  onPress: () => {
                    cancelWorkoutInProgressReminder();
                    endWorkoutLiveActivity();
                    discardActiveWorkout();
                    router.dismissAll();
                    router.replace('/(tabs)');
                  },
                },
              ]);
            }}
          >
            <Text style={styles.discardButtonText}>{t('saveWorkout.discardWorkout')}</Text>
          </Pressable>
        )}

        {isEditMode && (
          <Pressable
            style={styles.editExercisesButton}
            onPress={() => {
              withLock(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                // Navigate to active-workout with edit data
                const editData = {
                  exercises: workoutData.exercises,
                  durationSeconds: currentDuration,
                  startedAt: workoutData.startedAt,
                  userId: workoutData.userId,
                  editWorkoutId,
                  editTitle: workoutTitle,
                  editNotes: description,
                };
                router.push({
                  pathname: '/active-workout',
                  params: { editData: JSON.stringify(editData) },
                });
              });
            }}
            disabled={isNavigating}
          >
            <Ionicons name="pencil-outline" size={18} color={colors.primary} />
            <Text style={styles.editExercisesText}>{t('saveWorkout.editExercises')}</Text>
          </Pressable>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Image Picker Bottom Sheet */}
      <ImagePickerSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={(image) => setSelectedImage(image)}
      />

      {/* Exercise Change Modal */}
      <Modal visible={showExerciseChangeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.exerciseChangeModal}>
            <Text style={styles.modalTitle}>{t('saveWorkout.updateTemplateTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('saveWorkout.updateTemplateMessage')}</Text>

            <Pressable
              style={styles.updateTemplateButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                handleUpdateTemplate();
              }}
            >
              <Text style={styles.updateTemplateButtonText}>{t('saveWorkout.updateTemplate')}</Text>
            </Pressable>

            <Pressable
              style={styles.keepOriginalButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleKeepOriginal();
              }}
            >
              <Text style={styles.keepOriginalButtonText}>{t('saveWorkout.keepOriginal')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Duration Picker Modal - Apple style bottom sheet */}
      <DurationPickerModal
        visible={showDurationModal}
        durationSeconds={currentDuration}
        onSave={(seconds) => {
          setEditDuration(seconds);
          setShowDurationModal(false);
        }}
        onClose={() => setShowDurationModal(false)}
      />
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
    overflow: 'hidden',
  },
  imagePlaceholderFilled: {
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderWidth: 0,
  },
  selectedImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
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
  discardButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  discardButtonText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.danger,
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
  editExercisesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  editExercisesText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
});
