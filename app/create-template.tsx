import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Line } from 'react-native-svg';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useTemplateStore, TemplateExercise, TemplateSet } from '@/stores/templateStore';
import { useWorkoutStore, PendingExercise } from '@/stores/workoutStore';
import { ExerciseImage } from '@/components/ExerciseImage';
import { getWeightUnit, UnitSystem, filterNumericInput, fromKgForDisplay } from '@/utils/units';
import { formatExerciseNameString } from '@/utils/textFormatters';
import {
  getBatchExercisePreviousSets,
  getUserExercisePreferences,
  PreviousSetData,
} from '@/services/api/workouts';
import { getCurrentUser } from '@/services/api/user';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Rest timer options in seconds
const REST_TIMER_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '1:00' },
  { value: 90, label: '1:30' },
  { value: 120, label: '2:00' },
  { value: 150, label: '2:30' },
  { value: 180, label: '3:00' },
];

// Generate a simple unique ID
const generateExerciseId = () => `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Icons
function ReorderIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 10l5-5 5 5"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 14l5 5 5-5"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RemoveIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Line x1={18} y1={6} x2={6} y2={18} stroke="#C75050" strokeWidth={2} strokeLinecap="round" />
      <Line x1={6} y1={6} x2={18} y2={18} stroke="#C75050" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function DragHandleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Line
        x1={4}
        y1={8}
        x2={20}
        y2={8}
        stroke={colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1={4}
        y1={12}
        x2={20}
        y2={12}
        stroke={colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1={4}
        y1={16}
        x2={20}
        y2={16}
        stroke={colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MinusCircleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
        fill="#C75050"
      />
      <Line x1={8} y1={12} x2={16} y2={12} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function CheckIconSmall() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={colors.primary}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function formatRestTimerDisplay(seconds: number): string {
  if (seconds === 0) return 'OFF';
  const option = REST_TIMER_OPTIONS.find((o) => o.value === seconds);
  return (
    option?.label || `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
  );
}

const DELETE_BUTTON_WIDTH = 80;

interface SwipeableSetRowProps {
  set: TemplateSet;
  setIndex: number;
  exerciseIndex: number;
  weightUnit: string;
  onUpdateValue: (
    exerciseIndex: number,
    setIndex: number,
    field: 'targetWeight' | 'targetReps',
    value: string
  ) => void;
  onDelete: (exerciseIndex: number, setIndex: number) => void;
  previousWeight?: string;
  previousReps?: string;
}

function SwipeableSetRow({
  set,
  setIndex,
  exerciseIndex,
  weightUnit,
  onUpdateValue,
  onDelete,
  previousWeight,
  previousReps,
}: SwipeableSetRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isSwipedOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        // Capture horizontal swipes with lower threshold
        return (
          Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderGrant: () => {
        // Stop any ongoing animations
      },
      onPanResponderMove: (_, gestureState) => {
        // Swipe left (negative dx) to reveal delete on right
        if (gestureState.dx < 0 && !isSwipedOpen.current) {
          const newValue = Math.max(gestureState.dx, -DELETE_BUTTON_WIDTH);
          translateX.setValue(newValue);
        } else if (isSwipedOpen.current) {
          // Already open, allow closing by swiping right
          const newValue = Math.min(
            Math.max(-DELETE_BUTTON_WIDTH + gestureState.dx, -DELETE_BUTTON_WIDTH),
            0
          );
          translateX.setValue(newValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Opening: swipe left past threshold
        if (gestureState.dx < -DELETE_BUTTON_WIDTH / 3 && !isSwipedOpen.current) {
          Animated.spring(translateX, {
            toValue: -DELETE_BUTTON_WIDTH,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
          isSwipedOpen.current = true;
        } else if (gestureState.dx > 20 && isSwipedOpen.current) {
          // Closing: swipe right when open
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
          isSwipedOpen.current = false;
        } else {
          // Snap back to current state
          Animated.spring(translateX, {
            toValue: isSwipedOpen.current ? -DELETE_BUTTON_WIDTH : 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDelete(exerciseIndex, setIndex);
    });
  };

  return (
    <View style={swipeStyles.container}>
      {/* Delete button revealed on right side when swiping left */}
      <View style={swipeStyles.deleteButtonContainer}>
        <Pressable
          style={swipeStyles.deleteButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleDelete();
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Swipeable row */}
      <Animated.View
        style={[styles.setRow, swipeStyles.swipeableRow, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {/* Set number */}
        <View style={[styles.setColumn, styles.setNumberButton]}>
          <Text style={[styles.setText, styles.setNumber]}>{set.setNumber}</Text>
        </View>

        {/* Previous column */}
        <Text style={[styles.setText, styles.previousColumn, styles.previousText]}>
          {previousWeight && previousReps ? `${previousWeight} x ${previousReps}` : '-'}
        </Text>

        {/* Weight Input */}
        <TextInput
          style={[styles.setText, styles.kgColumn, styles.setInput]}
          value={set.targetWeight?.toString() || ''}
          onChangeText={(value) =>
            onUpdateValue(exerciseIndex, setIndex, 'targetWeight', filterNumericInput(value))
          }
          keyboardType="numeric"
          placeholder={previousWeight || '0'}
          placeholderTextColor={colors.textTertiary}
        />

        {/* Reps Input */}
        <TextInput
          style={[styles.setText, styles.repsColumn, styles.setInput]}
          value={set.targetReps?.toString() || ''}
          onChangeText={(value) =>
            onUpdateValue(exerciseIndex, setIndex, 'targetReps', filterNumericInput(value, false))
          }
          keyboardType="numeric"
          placeholder={previousReps || '0'}
          placeholderTextColor={colors.textTertiary}
        />
      </Animated.View>
    </View>
  );
}

const swipeStyles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BUTTON_WIDTH,
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(229, 57, 53, 0.5)',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  swipeableRow: {
    backgroundColor: colors.background,
  },
});

export default function CreateTemplateScreen() {
  const { templateId, folderId } = useLocalSearchParams<{
    templateId?: string;
    folderId?: string;
  }>();
  const isEditMode = !!templateId;

  const getTemplateById = useTemplateStore((state) => state.getTemplateById);

  const pendingExercises = useWorkoutStore((state) => state.pendingExercises);
  const clearPendingExercises = useWorkoutStore((state) => state.clearPendingExercises);

  // Exercise state
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const units = useUserPreferencesStore((s) => s.getUnitSystem());

  // Previous sets data for history suggestions
  const [userId, setUserId] = useState<string | null>(null);
  const [previousSetsMap, setPreviousSetsMap] = useState<Map<string, PreviousSetData[]>>(new Map());

  // Modal states
  const [showExerciseMenu, setShowExerciseMenu] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const menuSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Reorder modal state
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderExercises, setReorderExercises] = useState<TemplateExercise[]>([]);

  // Rest timer modal state
  const [showRestTimerModal, setShowRestTimerModal] = useState(false);
  const [restTimerModalExerciseIndex, setRestTimerModalExerciseIndex] = useState<number | null>(
    null
  );
  const restTimerModalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Load current user for fetching exercise history
  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      if (user) setUserId(user.id);
    }
    loadUser();
  }, []);

  // Fetch previous sets for a list of exercise IDs and merge into state
  const fetchPreviousSets = async (exerciseIds: string[]) => {
    if (!userId || exerciseIds.length === 0) return new Map<string, PreviousSetData[]>();
    const prevSetsMap = await getBatchExercisePreviousSets(userId, exerciseIds);
    setPreviousSetsMap((prev) => {
      const updated = new Map(prev);
      prevSetsMap.forEach((sets, id) => updated.set(id, sets));
      return updated;
    });
    return prevSetsMap;
  };

  // Load existing template if in edit mode
  useEffect(() => {
    if (templateId) {
      const existing = getTemplateById(templateId);
      if (existing) {
        setExercises(existing.exercises);
        // Fetch previous sets for existing template exercises
        const exerciseIds = existing.exercises.map((e) => e.exerciseId);
        if (userId && exerciseIds.length > 0) {
          fetchPreviousSets(exerciseIds);
        }
      }
    }
  }, [templateId, userId]);

  // Handle pending exercises from add-exercise screen
  const processedPendingRef = useRef<string | null>(null);

  useEffect(() => {
    if (pendingExercises.length > 0) {
      const pendingKey = pendingExercises.map((pe) => pe.id).join(',');
      if (processedPendingRef.current === pendingKey) return;
      processedPendingRef.current = pendingKey;

      const exercisesToAdd = [...pendingExercises];
      clearPendingExercises();
      handlePendingExercisesAsync(exercisesToAdd);
    }
  }, [pendingExercises, clearPendingExercises]);

  // Async handler that fetches history and preferences for new exercises
  const handlePendingExercisesAsync = async (exercisesToAdd: PendingExercise[]) => {
    const exerciseIds = exercisesToAdd.map((e) => e.id);

    // If userId isn't loaded yet, fetch it now
    let currentUserId = userId;
    if (!currentUserId) {
      const user = await getCurrentUser();
      if (user) {
        currentUserId = user.id;
        setUserId(user.id);
      }
    }

    // Fetch previous sets and rest timer preferences in parallel
    const [prevSetsMap, preferencesMap] = await Promise.all([
      currentUserId
        ? getBatchExercisePreviousSets(currentUserId, exerciseIds)
        : Promise.resolve(new Map<string, PreviousSetData[]>()),
      currentUserId
        ? getUserExercisePreferences(currentUserId, exerciseIds)
        : Promise.resolve(new Map()),
    ]);

    // Merge previous sets into state
    setPreviousSetsMap((prev) => {
      const updated = new Map(prev);
      prevSetsMap.forEach((sets, id) => updated.set(id, sets));
      return updated;
    });

    const newExercises: TemplateExercise[] = exercisesToAdd.map((pe) => {
      const previousSets = prevSetsMap.get(pe.id);
      const preference = preferencesMap.get(pe.id);
      const restTimerSeconds = preference?.restTimerSeconds || 0;

      // Create sets matching previous workout count, or default to 1
      const setCount = previousSets && previousSets.length > 0 ? previousSets.length : 1;
      const sets: TemplateSet[] = Array.from({ length: setCount }, (_, i) => ({
        setNumber: i + 1,
        targetWeight: undefined,
        targetReps: undefined,
      }));

      return {
        id: generateExerciseId(),
        exerciseId: pe.id,
        exerciseName: pe.name,
        muscle: pe.muscle,
        gifUrl: pe.gifUrl,
        thumbnailUrl: pe.thumbnailUrl,
        sets,
        restTimerSeconds,
      };
    });

    setExercises((prev) => [...prev, ...newExercises]);
  };

  // Exercise menu functions
  const openExerciseMenu = (index: number) => {
    setSelectedExerciseIndex(index);
    setShowExerciseMenu(true);
    Animated.spring(menuSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeExerciseMenu = () => {
    Animated.timing(menuSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowExerciseMenu(false);
      setSelectedExerciseIndex(null);
    });
  };

  const handleReorderExercises = () => {
    closeExerciseMenu();
    setTimeout(() => {
      setReorderExercises([...exercises]);
      setShowReorderModal(true);
    }, 300);
  };

  const handleRemoveExercise = () => {
    if (selectedExerciseIndex !== null) {
      setExercises((prev) => prev.filter((_, index) => index !== selectedExerciseIndex));
    }
    closeExerciseMenu();
  };

  // Rest timer modal functions
  const openRestTimerModal = (exerciseIndex: number) => {
    setRestTimerModalExerciseIndex(exerciseIndex);
    setShowRestTimerModal(true);
    Animated.spring(restTimerModalSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeRestTimerModal = () => {
    Animated.timing(restTimerModalSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowRestTimerModal(false);
      setRestTimerModalExerciseIndex(null);
    });
  };

  const updateRestTimer = (exerciseIndex: number, seconds: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex] = { ...updated[exerciseIndex], restTimerSeconds: seconds };
      return updated;
    });
  };

  // Reorder functions
  const removeExerciseFromReorder = (index: number) => {
    setReorderExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const saveReorder = () => {
    setExercises(reorderExercises);
    setShowReorderModal(false);
  };

  // Set management
  const addSet = (exerciseIndex: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const exercise = updated[exerciseIndex];
      const newSetNumber = exercise.sets.length + 1;

      exercise.sets = [
        ...exercise.sets,
        { setNumber: newSetNumber, targetWeight: undefined, targetReps: undefined },
      ];
      return updated;
    });
  };

  const deleteSet = (exerciseIndex: number, setIndex: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const exercise = updated[exerciseIndex];
      // If this is the last set, remove the entire exercise
      if (exercise.sets.length <= 1) {
        return updated.filter((_, i) => i !== exerciseIndex);
      }

      exercise.sets = exercise.sets.filter((_, i) => i !== setIndex);
      // Renumber sets
      exercise.sets = exercise.sets.map((set, i) => ({ ...set, setNumber: i + 1 }));
      return updated;
    });
  };

  const updateSetValue = (
    exerciseIndex: number,
    setIndex: number,
    field: 'targetWeight' | 'targetReps',
    value: string
  ) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex] = {
        ...updated[exerciseIndex].sets[setIndex],
        [field]: value ? parseFloat(value) : undefined,
      };
      return updated;
    });
  };

  const updateNotes = (exerciseIndex: number, notes: string) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex] = { ...updated[exerciseIndex], notes };
      return updated;
    });
  };

  const handleAddExercise = () => {
    const existingIds = exercises.map((e) => e.exerciseId);
    router.push({
      pathname: '/add-exercise',
      params: { existingExerciseIds: JSON.stringify(existingIds) },
    });
  };

  const handleSave = () => {
    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Please add at least one exercise');
      return;
    }

    // Navigate to save-template page with exercise data
    router.push({
      pathname: '/save-template',
      params: {
        exercises: JSON.stringify(exercises),
        ...(templateId ? { templateId } : {}),
        ...(folderId ? { folderId } : {}),
      },
    });
  };

  const handleDiscard = () => {
    Alert.alert(
      isEditMode ? 'Discard Changes?' : 'Discard Template?',
      isEditMode ? 'Your changes will not be saved.' : 'Your template will not be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleBack = () => {
    // Only show confirmation if user has added exercises
    if (exercises.length > 0) {
      Alert.alert(
        isEditMode ? 'Discard Changes?' : 'Discard Template?',
        isEditMode ? 'Your changes will not be saved.' : 'Your template will not be saved.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const weightLabel = getWeightUnit(units).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - Clean tracker style (no title) */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleBack();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.headerRight}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleSave();
            }}
          >
            <Text style={styles.saveText}>SAVE</Text>
          </Pressable>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {exercises.length === 0 ? (
        // Empty State - Similar to active-workout
        <View style={styles.content}>
          <View style={styles.checkmarkContainer}>
            <Ionicons name="document-outline" size={26} color={colors.border} />
          </View>
          <Text style={styles.title}>Get Started</Text>
          <Text style={styles.subtitle}>Add an exercise to build your template</Text>
          <Pressable
            style={styles.addExerciseButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleAddExercise();
            }}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </Pressable>
          <Pressable
            style={styles.discardButtonFull}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleDiscard();
            }}
          >
            <Text style={styles.discardButtonText}>Discard</Text>
          </Pressable>
        </View>
      ) : (
        // Filled State with Exercises - Matching active-workout UI
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {exercises.map((exercise, exerciseIndex) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              {/* Exercise Header */}
              <View style={styles.exerciseHeader}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/exercise/${exercise.exerciseId}`);
                  }}
                >
                  <ExerciseImage
                    gifUrl={exercise.gifUrl}
                    thumbnailUrl={exercise.thumbnailUrl}
                    size={40}
                    borderRadius={8}
                  />
                </Pressable>
                <Pressable
                  style={{ flex: 1, justifyContent: 'center' }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/exercise/${exercise.exerciseId}`);
                  }}
                >
                  <Text style={styles.exerciseTitle}>
                    {formatExerciseNameString(exercise.exerciseName)}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.moreButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    openExerciseMenu(exerciseIndex);
                  }}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
                </Pressable>
              </View>

              {/* Notes Input */}
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes here..."
                placeholderTextColor={colors.textSecondary}
                value={exercise.notes || ''}
                onChangeText={(text) => updateNotes(exerciseIndex, text)}
              />

              {/* Rest Timer */}
              <Pressable
                style={styles.restTimerRow}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openRestTimerModal(exerciseIndex);
                }}
              >
                <Ionicons name="stopwatch-outline" size={18} color={colors.primary} />
                <Text style={styles.restTimerText}>
                  Rest Timer: {formatRestTimerDisplay(exercise.restTimerSeconds)}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </Pressable>

              {/* Sets Table Header */}
              <View style={styles.setsHeader}>
                <Text style={[styles.setHeaderText, styles.setColumn]}>SET</Text>
                <Text style={[styles.setHeaderText, styles.previousColumn]}>PREVIOUS</Text>
                <Text style={[styles.setHeaderText, styles.kgColumn]}>{weightLabel}</Text>
                <Text style={[styles.setHeaderText, styles.repsColumn]}>REPS</Text>
              </View>

              {/* Sets Rows */}
              {exercise.sets.map((set, setIndex) => {
                const prevSet = previousSetsMap.get(exercise.exerciseId)?.[setIndex];
                const prevWeight =
                  prevSet?.weightKg != null
                    ? fromKgForDisplay(prevSet.weightKg, units).toString()
                    : undefined;
                const prevReps = prevSet?.reps != null ? prevSet.reps.toString() : undefined;
                return (
                  <SwipeableSetRow
                    key={`${exercise.id}-set-${setIndex}`}
                    set={set}
                    setIndex={setIndex}
                    exerciseIndex={exerciseIndex}
                    weightUnit={weightLabel}
                    onUpdateValue={updateSetValue}
                    onDelete={deleteSet}
                    previousWeight={prevWeight}
                    previousReps={prevReps}
                  />
                );
              })}

              {/* Add Set Button */}
              <Pressable
                style={styles.addSetButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  addSet(exerciseIndex);
                }}
              >
                <Text style={styles.addSetText}>+ Add Set</Text>
              </Pressable>
            </View>
          ))}

          {/* Bottom Buttons */}
          <Pressable
            style={styles.addExerciseButtonFilled}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleAddExercise();
            }}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </Pressable>

          <Pressable
            style={styles.discardButtonFilled}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              handleDiscard();
            }}
          >
            <Text style={styles.discardButtonText}>Discard</Text>
          </Pressable>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* Exercise Menu Bottom Sheet */}
      <Modal
        visible={showExerciseMenu}
        transparent
        animationType="none"
        onRequestClose={closeExerciseMenu}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            closeExerciseMenu();
          }}
        >
          <Animated.View
            style={[styles.menuModalContent, { transform: [{ translateY: menuSlideAnim }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              <View style={styles.menuContainer}>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleReorderExercises();
                  }}
                >
                  <ReorderIcon />
                  <Text style={styles.menuItemText}>Reorder Exercises</Text>
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleRemoveExercise();
                  }}
                >
                  <RemoveIcon />
                  <Text style={styles.menuItemTextRemove}>Remove Exercise</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Reorder Modal */}
      <Modal
        visible={showReorderModal}
        animationType="slide"
        onRequestClose={() => setShowReorderModal(false)}
      >
        <SafeAreaView style={styles.reorderContainer} edges={['top']}>
          <View style={styles.reorderHeader}>
            <Text style={styles.reorderTitle}>Reorder</Text>
          </View>
          <View style={styles.divider} />

          <ScrollView style={styles.reorderList}>
            {reorderExercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.reorderItem}>
                <Pressable
                  style={styles.removeButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    removeExerciseFromReorder(index);
                  }}
                >
                  <MinusCircleIcon />
                </Pressable>
                <ExerciseImage
                  gifUrl={exercise.gifUrl}
                  thumbnailUrl={exercise.thumbnailUrl}
                  size={48}
                  borderRadius={8}
                />
                <Text style={styles.reorderExerciseName}>
                  {formatExerciseNameString(exercise.exerciseName)}
                </Text>
                <View style={styles.dragHandle}>
                  <DragHandleIcon />
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.reorderBottom}>
            <Pressable
              style={styles.doneButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                saveReorder();
              }}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Rest Timer Modal */}
      <Modal
        visible={showRestTimerModal}
        transparent
        animationType="none"
        onRequestClose={closeRestTimerModal}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            closeRestTimerModal();
          }}
        >
          <Animated.View
            style={[
              styles.restTimerModalContent,
              { transform: [{ translateY: restTimerModalSlideAnim }] },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              <View style={styles.restTimerModalHeader}>
                <Text style={styles.restTimerModalTitle}>Rest Timer</Text>
                {restTimerModalExerciseIndex !== null && (
                  <Text style={styles.restTimerModalSubtitle}>
                    {formatExerciseNameString(
                      exercises[restTimerModalExerciseIndex]?.exerciseName || ''
                    )}
                  </Text>
                )}
              </View>

              <ScrollView style={styles.restTimerOptionsList} showsVerticalScrollIndicator={false}>
                {REST_TIMER_OPTIONS.map((option) => {
                  const isSelected =
                    restTimerModalExerciseIndex !== null &&
                    exercises[restTimerModalExerciseIndex]?.restTimerSeconds === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.restTimerOption, isSelected && styles.restTimerOptionSelected]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (restTimerModalExerciseIndex !== null) {
                          updateRestTimer(restTimerModalExerciseIndex, option.value);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.restTimerOptionText,
                          isSelected && styles.restTimerOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {isSelected && <CheckIconSmall />}
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.restTimerModalBottom}>
                <Pressable
                  style={styles.doneButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    closeRestTimerModal();
                  }}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
    position: 'absolute',
    left: spacing.lg,
    zIndex: 1,
  },
  headerRight: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 1,
  },
  saveText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
  },
  checkmarkContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    width: '100%',
    gap: spacing.sm,
  },
  addExerciseText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
  discardButtonFull: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F4FA',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: spacing.md,
    width: '100%',
  },
  discardButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#E53935',
  },
  scrollView: {
    flex: 1,
  },
  exerciseCard: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exerciseImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.primary,
  },
  moreButton: {
    padding: spacing.xs,
  },
  notesInput: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingVertical: spacing.sm,
  },
  restTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  restTimerText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
    flex: 1,
  },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  setHeaderText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  setColumn: {
    flex: 1,
    textAlign: 'center',
  },
  previousColumn: {
    flex: 1.5,
    textAlign: 'center',
  },
  kgColumn: {
    flex: 1,
    textAlign: 'center',
  },
  repsColumn: {
    flex: 1,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
    borderRadius: 8,
  },
  setText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  setNumber: {
    fontFamily: fonts.bold,
  },
  previousText: {
    color: colors.textSecondary,
  },
  setNumberButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  setInput: {
    textAlign: 'center',
    padding: 0,
  },
  addSetButton: {
    ...cardStyle,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addSetText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  addExerciseButtonFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    gap: spacing.sm,
  },
  discardButtonFilled: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F4FA',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
  },
  bottomSpacer: {
    height: 40,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  menuContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  menuItemText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  menuItemTextRemove: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#C75050',
  },

  // Reorder Modal Styles
  reorderContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  reorderHeader: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  reorderTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  reorderList: {
    flex: 1,
  },
  reorderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  removeButton: {
    padding: spacing.xs,
  },
  reorderImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderExerciseName: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  dragHandle: {
    padding: spacing.xs,
  },
  reorderBottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },

  // Rest Timer Modal Styles
  restTimerModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  restTimerModalHeader: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  restTimerModalTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    color: colors.text,
  },
  restTimerModalSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  restTimerOptionsList: {
    maxHeight: 300,
    paddingHorizontal: spacing.lg,
  },
  restTimerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  restTimerOptionSelected: {
    backgroundColor: 'rgba(148, 122, 255, 0.1)',
  },
  restTimerOptionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  restTimerOptionTextSelected: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
  },
  restTimerModalBottom: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
});
