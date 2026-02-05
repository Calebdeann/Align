import { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Line } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useTemplateStore, TemplateExercise, TemplateSet } from '@/stores/templateStore';
import { useWorkoutStore, PendingExercise } from '@/stores/workoutStore';
import { ExerciseImage } from '@/components/ExerciseImage';
import {
  NumericInputDoneButton,
  NUMERIC_ACCESSORY_ID,
} from '@/components/ui/NumericInputDoneButton';
import { prefetchExerciseGif } from '@/stores/exerciseStore';
import { getWeightUnit, UnitSystem, filterNumericInput, fromKgForDisplay } from '@/utils/units';
import { formatExerciseNameString } from '@/utils/textFormatters';
import {
  getBatchExercisePreviousSets,
  getUserExercisePreferences,
  PreviousSetData,
} from '@/services/api/workouts';
import { getCurrentUser } from '@/services/api/user';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { getSimplifiedMuscleI18nKey } from '@/constants/muscleGroups';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type SetType = 'normal' | 'warmup' | 'failure' | 'dropset';

// Rest timer options in seconds (matches active-workout)
const REST_TIMER_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 5, label: '5s' },
  { value: 10, label: '10s' },
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '1:00' },
  { value: 90, label: '1:30' },
  { value: 120, label: '2:00' },
  { value: 150, label: '2:30' },
  { value: 180, label: '3:00' },
  { value: 210, label: '3:30' },
  { value: 240, label: '4:00' },
  { value: 270, label: '4:30' },
  { value: 300, label: '5:00' },
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
      <Line
        x1={8}
        y1={12}
        x2={16}
        y2={12}
        stroke={colors.textInverse}
        strokeWidth={2}
        strokeLinecap="round"
      />
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
  if (seconds === 0) return i18n.t('workout.restTimerOff');
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
  setTypeLabel: string;
  setType?: SetType;
  onUpdateValue: (
    exerciseIndex: number,
    setIndex: number,
    field: 'targetWeight' | 'targetReps',
    value: string
  ) => void;
  onDelete: (exerciseIndex: number, setIndex: number) => void;
  onSetTypePress?: (exerciseIndex: number, setIndex: number) => void;
  previousWeight?: string;
  previousReps?: string;
}

function SwipeableSetRow({
  set,
  setIndex,
  exerciseIndex,
  weightUnit,
  setTypeLabel,
  setType,
  onUpdateValue,
  onDelete,
  onSetTypePress,
  previousWeight,
  previousReps,
}: SwipeableSetRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const getSetTypeLabelStyle = () => {
    switch (setType) {
      case 'warmup':
        return styles.setTypeTextWarmup;
      case 'failure':
        return styles.setTypeTextFailure;
      case 'dropset':
        return styles.setTypeTextDropset;
      case 'normal':
      default:
        return null;
    }
  };

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    onDelete(exerciseIndex, setIndex);
  }, [exerciseIndex, setIndex, onDelete]);

  const renderRightActions = useCallback(() => {
    return (
      <Pressable
        style={swipeStyles.deleteButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleDelete();
        }}
      >
        <Ionicons name="trash-outline" size={20} color={colors.textInverse} />
      </Pressable>
    );
  }, [handleDelete]);

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      containerStyle={swipeStyles.container}
    >
      <View style={[styles.setRow, { marginHorizontal: 0, backgroundColor: colors.background }]}>
        {/* Set number / type */}
        <Pressable
          style={[styles.setColumn, styles.setNumberButton]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSetTypePress?.(exerciseIndex, setIndex);
          }}
        >
          <Text style={[styles.setText, styles.setNumber, getSetTypeLabelStyle()]}>
            {setTypeLabel}
          </Text>
        </Pressable>

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
          inputAccessoryViewID={NUMERIC_ACCESSORY_ID}
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
          inputAccessoryViewID={NUMERIC_ACCESSORY_ID}
        />
      </View>
    </Swipeable>
  );
}

const swipeStyles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  deleteButton: {
    width: DELETE_BUTTON_WIDTH,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Superset colors - each superset group gets a different color
const SUPERSET_COLORS = [
  '#64B5F6', // Blue
  '#7AC29A', // Green
  '#FF8A65', // Orange
  '#E53935', // Red
  '#BA68C8', // Purple
];

// Draggable row for exercises - drag-based reorder with free-flowing movement
const REORDER_ROW_HEIGHT = 72;

interface DraggableExerciseRowProps {
  exercise: TemplateExercise;
  index: number;
  onRemove: () => void;
  isDragging: boolean;
  anyDragging: boolean;
  translateY: Animated.Value;
  onDragStart: (index: number, screenY: number) => void;
  onDragMove: (moveY: number, dy: number) => void;
  onDragEnd: () => void;
}

function DraggableExerciseRow({
  exercise,
  index,
  onRemove,
  isDragging,
  anyDragging,
  translateY,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DraggableExerciseRowProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const indexRef = useRef(index);
  indexRef.current = index;
  const onDragStartRef = useRef(onDragStart);
  onDragStartRef.current = onDragStart;
  const onDragMoveRef = useRef(onDragMove);
  onDragMoveRef.current = onDragMove;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderGrant: (evt) => {
        onDragStartRef.current(indexRef.current, evt.nativeEvent.pageY);
        Animated.spring(scale, { toValue: 1.03, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        onDragMoveRef.current(gestureState.moveY, gestureState.dy);
      },
      onPanResponderRelease: () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        onDragEndRef.current();
      },
      onPanResponderTerminate: () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        onDragEndRef.current();
      },
    })
  ).current;

  const opacity = anyDragging && !isDragging ? 0.5 : 1;

  return (
    <Animated.View
      style={[
        styles.reorderItem,
        {
          transform: [{ translateY }, { scale }],
          opacity,
          zIndex: isDragging ? 100 : 1,
          elevation: isDragging ? 5 : 0,
          ...(isDragging
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              }
            : {}),
        },
      ]}
    >
      <Pressable
        style={styles.removeButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onRemove();
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
      <View style={styles.dragHandle} {...panResponder.panHandlers}>
        <DragHandleIcon />
      </View>
    </Animated.View>
  );
}

// Icon for "Add to Superset" menu item
function PlusIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Line
        x1={12}
        y1={5}
        x2={12}
        y2={19}
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1={5}
        y1={12}
        x2={19}
        y2={12}
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Icon for "Remove from Superset" menu item
function CloseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Line
        x1={18}
        y1={6}
        x2={6}
        y2={18}
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1={6}
        y1={6}
        x2={18}
        y2={18}
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function CreateTemplateScreen() {
  const { t } = useTranslation();
  const { templateId, folderId } = useLocalSearchParams<{
    templateId?: string;
    folderId?: string;
  }>();
  const isEditMode = !!templateId;

  const { isNavigating, withLock } = useNavigationLock();
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

  // Drag reorder state
  const draggedIndexRef = useRef<number>(-1);
  const exerciseOrderRef = useRef<TemplateExercise[]>([]);
  const rowTranslateY = useRef<Animated.Value[]>([]);
  const dragTranslateY = useRef(new Animated.Value(0)).current;
  const dragAdjustmentRef = useRef<number>(0);
  const [activeDragIndex, setActiveDragIndex] = useState<number>(-1);
  const reorderKeysRef = useRef<string[]>([]);

  // Superset modal state
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [supersetSelectedIndices, setSupersetSelectedIndices] = useState<number[]>([]);
  const supersetModalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Rest timer modal state
  const [showRestTimerModal, setShowRestTimerModal] = useState(false);
  const [restTimerModalExerciseIndex, setRestTimerModalExerciseIndex] = useState<number | null>(
    null
  );
  const restTimerModalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Set type modal state
  const [showSetTypeModal, setShowSetTypeModal] = useState(false);
  const [setTypeModalExerciseIndex, setSetTypeModalExerciseIndex] = useState<number | null>(null);
  const [setTypeModalSetIndex, setSetTypeModalSetIndex] = useState<number | null>(null);
  const setTypeModalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Load current user for fetching exercise history
  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      if (user) setUserId(user.id);
    }
    loadUser();
  }, []);

  // Sync exerciseOrderRef and rowTranslateY when reorderExercises changes
  useEffect(() => {
    exerciseOrderRef.current = reorderExercises;
    while (rowTranslateY.current.length < reorderExercises.length) {
      rowTranslateY.current.push(new Animated.Value(0));
    }
    rowTranslateY.current.length = reorderExercises.length;
  }, [reorderExercises]);

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

    // Phase 1: Add exercises immediately with defaults for instant UI
    const tempIds = exercisesToAdd.map(() => generateExerciseId());
    const newExercises: TemplateExercise[] = exercisesToAdd.map((pe, i) => ({
      id: tempIds[i],
      exerciseId: pe.id,
      exerciseName: pe.name,
      muscle: pe.muscle,
      gifUrl: pe.gifUrl,
      thumbnailUrl: pe.thumbnailUrl,
      sets: [{ setNumber: 1, targetWeight: undefined, targetReps: undefined }],
      restTimerSeconds: 0,
      supersetId: null,
    }));
    setExercises((prev) => [...prev, ...newExercises]);

    // Phase 2: Fetch history and preferences in background, then patch
    let currentUserId = userId;
    if (!currentUserId) {
      const user = await getCurrentUser();
      if (user) {
        currentUserId = user.id;
        setUserId(user.id);
      }
    }
    if (!currentUserId) return;

    const [prevSetsMap, preferencesMap] = await Promise.all([
      getBatchExercisePreviousSets(currentUserId, exerciseIds),
      getUserExercisePreferences(currentUserId, exerciseIds),
    ]);

    // Merge previous sets into state
    setPreviousSetsMap((prev) => {
      const updated = new Map(prev);
      prevSetsMap.forEach((sets, id) => updated.set(id, sets));
      return updated;
    });

    // Patch exercises in-place with fetched data
    setExercises((prev) =>
      prev.map((ex) => {
        if (!exerciseIds.includes(ex.exerciseId)) return ex;
        const previousSets = prevSetsMap.get(ex.exerciseId);
        const preference = preferencesMap.get(ex.exerciseId);
        const restTimerSeconds = preference?.restTimerSeconds || ex.restTimerSeconds;
        const setCount = previousSets && previousSets.length > 0 ? previousSets.length : 1;
        const sets: TemplateSet[] = Array.from({ length: setCount }, (_, i) => ({
          setNumber: i + 1,
          targetWeight: undefined,
          targetReps: undefined,
        }));
        return { ...ex, sets, restTimerSeconds };
      })
    );
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

  // Set Type Modal Functions
  const openSetTypeModal = (exerciseIndex: number, setIndex: number) => {
    setSetTypeModalExerciseIndex(exerciseIndex);
    setSetTypeModalSetIndex(setIndex);
    setShowSetTypeModal(true);
    Animated.spring(setTypeModalSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeSetTypeModal = () => {
    Animated.timing(setTypeModalSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowSetTypeModal(false);
      setSetTypeModalExerciseIndex(null);
      setSetTypeModalSetIndex(null);
    });
  };

  const updateSetType = (newType: SetType) => {
    if (setTypeModalExerciseIndex === null || setTypeModalSetIndex === null) return;

    setExercises((prev) => {
      const updated = [...prev];
      updated[setTypeModalExerciseIndex].sets[setTypeModalSetIndex] = {
        ...updated[setTypeModalExerciseIndex].sets[setTypeModalSetIndex],
        setType: newType,
      };
      return updated;
    });
    closeSetTypeModal();
  };

  const removeSetFromTypeModal = () => {
    if (setTypeModalExerciseIndex === null || setTypeModalSetIndex === null) return;

    setExercises((prev) => {
      const updated = [...prev];
      const exercise = updated[setTypeModalExerciseIndex];

      if (exercise.sets.length <= 1) {
        closeSetTypeModal();
        return updated.filter((_, i) => i !== setTypeModalExerciseIndex);
      }

      exercise.sets = exercise.sets.filter((_, i) => i !== setTypeModalSetIndex);
      exercise.sets = exercise.sets.map((set, i) => ({ ...set, setNumber: i + 1 }));
      return updated;
    });
    closeSetTypeModal();
  };

  const getSetTypeLabel = (set: TemplateSet, setIndex: number): string => {
    switch (set.setType) {
      case 'warmup':
        return 'W';
      case 'failure':
        return 'F';
      case 'dropset':
        return 'D';
      case 'normal':
      default:
        return (setIndex + 1).toString();
    }
  };

  const handleReorderExercises = () => {
    closeExerciseMenu();
    setTimeout(() => {
      const currentExercises = [...exercises];
      const ts = Date.now();
      reorderKeysRef.current = currentExercises.map((ex, i) => `${ex.exerciseId}-${i}-${ts}`);
      setReorderExercises(currentExercises);
      exerciseOrderRef.current = currentExercises;
      draggedIndexRef.current = -1;
      setActiveDragIndex(-1);
      dragTranslateY.setValue(0);
      rowTranslateY.current = currentExercises.map(() => new Animated.Value(0));
      setShowReorderModal(true);
    }, 300);
  };

  const handleRemoveExercise = () => {
    if (selectedExerciseIndex !== null) {
      setExercises((prev) => prev.filter((_, index) => index !== selectedExerciseIndex));
    }
    // Reset modal index states to prevent stale references after removal
    setRestTimerModalExerciseIndex(null);
    setShowRestTimerModal(false);
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
    if (draggedIndexRef.current !== -1) {
      draggedIndexRef.current = -1;
      setActiveDragIndex(-1);
      dragTranslateY.setValue(0);
      rowTranslateY.current.forEach((val) => val.setValue(0));
    }
    reorderKeysRef.current = reorderKeysRef.current.filter((_, i) => i !== index);
    setReorderExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const saveReorder = () => {
    // Reset modal indices to prevent stale references after reorder
    setRestTimerModalExerciseIndex(null);
    setShowRestTimerModal(false);
    setExercises(reorderExercises);
    setShowReorderModal(false);
  };

  // Drag handler functions
  const handleDragStart = useCallback(
    (index: number, _screenY: number) => {
      draggedIndexRef.current = index;
      dragAdjustmentRef.current = 0;
      dragTranslateY.setValue(0);
      rowTranslateY.current.forEach((val) => val.setValue(0));
      setActiveDragIndex(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [dragTranslateY]
  );

  const handleDragMove = useCallback(
    (_moveY: number, dy: number) => {
      const currentIndex = draggedIndexRef.current;
      if (currentIndex === -1) return;

      const adjustedDy = dy - dragAdjustmentRef.current;
      dragTranslateY.setValue(adjustedDy);

      const rowsCrossed = Math.round(adjustedDy / REORDER_ROW_HEIGHT);
      const targetIndex = Math.max(
        0,
        Math.min(currentIndex + rowsCrossed, exerciseOrderRef.current.length - 1)
      );

      if (targetIndex !== currentIndex) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const updated = [...exerciseOrderRef.current];
        const [draggedItem] = updated.splice(currentIndex, 1);
        updated.splice(targetIndex, 0, draggedItem);
        exerciseOrderRef.current = updated;

        const updatedKeys = [...reorderKeysRef.current];
        const [draggedKey] = updatedKeys.splice(currentIndex, 1);
        updatedKeys.splice(targetIndex, 0, draggedKey);
        reorderKeysRef.current = updatedKeys;

        dragAdjustmentRef.current += (targetIndex - currentIndex) * REORDER_ROW_HEIGHT;
        dragTranslateY.setValue(dy - dragAdjustmentRef.current);

        draggedIndexRef.current = targetIndex;
        setReorderExercises(updated);
        setActiveDragIndex(targetIndex);
      }
    },
    [dragTranslateY]
  );

  const handleDragEnd = useCallback(() => {
    if (draggedIndexRef.current === -1) return;
    draggedIndexRef.current = -1;

    Animated.spring(dragTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 200,
      friction: 20,
    }).start(() => {
      setActiveDragIndex(-1);
      rowTranslateY.current.forEach((val) => val.setValue(0));
    });
  }, [dragTranslateY]);

  // Superset functions
  const getNextSupersetId = (): number => {
    const existingIds = exercises
      .map((e) => e.supersetId)
      .filter((id): id is number => id !== null && id !== undefined);
    if (existingIds.length === 0) return 1;
    return Math.max(...existingIds) + 1;
  };

  const getSupersetColor = (supersetId: number): string => {
    return SUPERSET_COLORS[(supersetId - 1) % SUPERSET_COLORS.length];
  };

  const openSupersetModal = () => {
    const initialSelected = selectedExerciseIndex !== null ? [selectedExerciseIndex] : [];
    setSupersetSelectedIndices(initialSelected);
    setShowSupersetModal(true);
    Animated.spring(supersetModalSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeSupersetModal = () => {
    Animated.timing(supersetModalSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowSupersetModal(false);
      setSupersetSelectedIndices([]);
    });
  };

  const toggleSupersetExercise = (index: number) => {
    setSupersetSelectedIndices((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      return [...prev, index];
    });
  };

  const confirmSuperset = () => {
    if (supersetSelectedIndices.length < 2) {
      Alert.alert('Select Exercises', 'Please select at least 2 exercises for a superset.');
      return;
    }

    const newSupersetId = getNextSupersetId();

    setExercises((prev) => {
      const updated = [...prev];
      supersetSelectedIndices.forEach((index) => {
        updated[index] = { ...updated[index], supersetId: newSupersetId };
      });
      return updated;
    });

    closeSupersetModal();
  };

  const handleAddToSuperset = () => {
    closeExerciseMenu();
    setTimeout(() => {
      openSupersetModal();
    }, 300);
  };

  const handleRemoveFromSuperset = () => {
    if (selectedExerciseIndex === null) return;

    const exercise = exercises[selectedExerciseIndex];
    if (!exercise.supersetId) return;

    const supersetIdToRemove = exercise.supersetId;

    setExercises((prev) => {
      const updated = prev.map((e, index) => {
        if (index === selectedExerciseIndex) {
          return { ...e, supersetId: null };
        }
        return e;
      });

      const remainingInSuperset = updated.filter((e) => e.supersetId === supersetIdToRemove).length;

      if (remainingInSuperset === 1) {
        return updated.map((e) => {
          if (e.supersetId === supersetIdToRemove) {
            return { ...e, supersetId: null };
          }
          return e;
        });
      }

      return updated;
    });

    closeExerciseMenu();
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
    withLock(() => {
      const existingIds = exercises.map((e) => e.exerciseId);
      router.push({
        pathname: '/add-exercise',
        params: { existingExerciseIds: JSON.stringify(existingIds) },
      });
    });
  };

  const handleSave = () => {
    if (exercises.length === 0) {
      Alert.alert(i18n.t('template.noExercises'), i18n.t('template.pleaseAddExercise'));
      return;
    }

    // Navigate to save-template page with exercise data
    withLock(() => {
      router.push({
        pathname: '/save-template',
        params: {
          exercises: JSON.stringify(exercises),
          ...(templateId ? { templateId } : {}),
          ...(folderId ? { folderId } : {}),
        },
      });
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
            <Text style={styles.saveText}>{t('saveWorkout.save')}</Text>
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
            <Ionicons name="add" size={24} color={colors.textInverse} />
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
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="never"
          keyboardDismissMode="interactive"
        >
          {exercises.map((exercise, exerciseIndex) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              {/* Exercise Header */}
              <View style={styles.exerciseHeader}>
                <Pressable
                  onPress={() => {
                    withLock(() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      prefetchExerciseGif(exercise.exerciseId);
                      router.push(`/exercise/${exercise.exerciseId}`);
                    });
                  }}
                >
                  <ExerciseImage
                    gifUrl={exercise.gifUrl}
                    thumbnailUrl={exercise.thumbnailUrl}
                    size={40}
                    borderRadius={8}
                  />
                </Pressable>
                <View style={{ flex: 1, justifyContent: 'center' }} pointerEvents="box-none">
                  <Text
                    style={[styles.exerciseTitle, { alignSelf: 'flex-start' }]}
                    onPress={() => {
                      withLock(() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        prefetchExerciseGif(exercise.exerciseId);
                        router.push(`/exercise/${exercise.exerciseId}`);
                      });
                    }}
                  >
                    {formatExerciseNameString(exercise.exerciseName)}
                  </Text>
                </View>
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

              {/* Superset Badge */}
              {exercise.supersetId != null && (
                <View
                  style={[
                    styles.supersetBadge,
                    { backgroundColor: getSupersetColor(exercise.supersetId) },
                  ]}
                >
                  <Text style={styles.supersetBadgeText}>Superset</Text>
                </View>
              )}

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
                    setTypeLabel={getSetTypeLabel(set, setIndex)}
                    setType={(set.setType || 'normal') as SetType}
                    onUpdateValue={updateSetValue}
                    onDelete={deleteSet}
                    onSetTypePress={openSetTypeModal}
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
            <Ionicons name="add" size={24} color={colors.textInverse} />
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

                {selectedExerciseIndex !== null &&
                exercises[selectedExerciseIndex]?.supersetId != null ? (
                  <Pressable
                    style={styles.menuItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleRemoveFromSuperset();
                    }}
                  >
                    <CloseIcon />
                    <Text style={styles.menuItemText}>Remove from Superset</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.menuItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleAddToSuperset();
                    }}
                  >
                    <PlusIcon />
                    <Text style={styles.menuItemText}>Add to Superset</Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const exerciseIdx = selectedExerciseIndex!;
                    const lastSetIdx = exercises[exerciseIdx].sets.length - 1;
                    closeExerciseMenu();
                    setTimeout(() => openSetTypeModal(exerciseIdx, lastSetIdx), 300);
                  }}
                >
                  <Ionicons name="swap-vertical-outline" size={20} color={colors.text} />
                  <Text style={styles.menuItemText}>{t('workout.setType')}</Text>
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
            <Text style={styles.reorderTitle}>{t('common.reorder')}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.reorderList}>
            {reorderExercises.map((exercise, index) => (
              <DraggableExerciseRow
                key={reorderKeysRef.current[index] || `reorder-${index}`}
                exercise={exercise}
                index={index}
                onRemove={() => removeExerciseFromReorder(index)}
                isDragging={activeDragIndex === index}
                anyDragging={activeDragIndex !== -1}
                translateY={
                  activeDragIndex === index
                    ? dragTranslateY
                    : rowTranslateY.current[index] || new Animated.Value(0)
                }
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              />
            ))}
          </View>

          <View style={styles.reorderBottom}>
            <Pressable
              style={styles.doneButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                saveReorder();
              }}
            >
              <Text style={styles.doneButtonText}>{t('common.done')}</Text>
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
                  <Text style={styles.doneButtonText}>{t('common.done')}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Superset Modal */}
      <Modal
        visible={showSupersetModal}
        transparent
        animationType="none"
        onRequestClose={closeSupersetModal}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            closeSupersetModal();
          }}
        >
          <Animated.View
            style={[
              styles.supersetModalContent,
              { transform: [{ translateY: supersetModalSlideAnim }] },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              <View style={styles.supersetModalHeader}>
                <Text style={styles.supersetModalTitle}>Super Set</Text>
              </View>

              <ScrollView style={styles.supersetExerciseList} showsVerticalScrollIndicator={false}>
                {exercises.map((exercise, index) => {
                  const isSelected = supersetSelectedIndices.includes(index);
                  const existingSuperset = exercise.supersetId;

                  return (
                    <Pressable
                      key={`${exercise.exerciseId}-${index}`}
                      style={styles.supersetExerciseRow}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        toggleSupersetExercise(index);
                      }}
                    >
                      {/* Color indicator bar */}
                      <View
                        style={[
                          styles.supersetColorBar,
                          existingSuperset != null
                            ? { backgroundColor: getSupersetColor(existingSuperset) }
                            : { backgroundColor: 'transparent' },
                        ]}
                      />

                      <ExerciseImage
                        gifUrl={exercise.gifUrl}
                        thumbnailUrl={exercise.thumbnailUrl}
                        size={40}
                        borderRadius={8}
                      />

                      <View style={styles.supersetExerciseInfo}>
                        <Text style={styles.supersetExerciseName}>
                          {formatExerciseNameString(exercise.exerciseName)}
                        </Text>
                        <View style={styles.supersetExerciseSubRow}>
                          <Text style={styles.supersetExerciseMuscle}>
                            {t(getSimplifiedMuscleI18nKey(exercise.muscle || '')) ||
                              exercise.muscle}
                          </Text>
                          {existingSuperset != null && (
                            <View
                              style={[
                                styles.supersetExistingBadge,
                                { backgroundColor: getSupersetColor(existingSuperset) },
                              ]}
                            >
                              <Text style={styles.supersetExistingBadgeText}>
                                Superset {existingSuperset}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Selection checkbox */}
                      <View
                        style={[
                          styles.supersetCheckbox,
                          isSelected && styles.supersetCheckboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.supersetModalBottom}>
                <Pressable
                  style={[
                    styles.supersetConfirmButton,
                    supersetSelectedIndices.length < 2 && styles.supersetConfirmButtonDisabled,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    confirmSuperset();
                  }}
                >
                  <Text style={styles.supersetConfirmButtonText}>
                    Add to Superset {getNextSupersetId()}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Set Type Modal */}
      <Modal
        visible={showSetTypeModal}
        transparent
        animationType="none"
        onRequestClose={closeSetTypeModal}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            closeSetTypeModal();
          }}
        >
          <Animated.View
            style={[
              styles.menuModalContent,
              { transform: [{ translateY: setTypeModalSlideAnim }] },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              <View style={styles.menuContainer}>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSetType('warmup');
                  }}
                >
                  <View style={styles.setTypeLetterContainer}>
                    <Text style={styles.setTypeTextWarmup}>W</Text>
                  </View>
                  <Text style={styles.setTypeTextWarmup}>{t('workout.warmupSet')}</Text>
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSetType('normal');
                  }}
                >
                  <View style={styles.setTypeLetterContainer}>
                    <Text style={styles.menuItemText}>
                      {setTypeModalSetIndex !== null ? setTypeModalSetIndex + 1 : '1'}
                    </Text>
                  </View>
                  <Text style={styles.menuItemText}>{t('workout.normalSet')}</Text>
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSetType('failure');
                  }}
                >
                  <View style={styles.setTypeLetterContainer}>
                    <Text style={styles.setTypeTextFailure}>F</Text>
                  </View>
                  <Text style={styles.setTypeTextFailure}>{t('workout.failureSet')}</Text>
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSetType('dropset');
                  }}
                >
                  <View style={styles.setTypeLetterContainer}>
                    <Text style={styles.setTypeTextDropset}>D</Text>
                  </View>
                  <Text style={styles.setTypeTextDropset}>{t('workout.dropSet')}</Text>
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    removeSetFromTypeModal();
                  }}
                >
                  <View style={styles.setTypeLetterContainer}>
                    <Ionicons name="trash-outline" size={18} color="#E53935" />
                  </View>
                  <Text style={styles.menuItemTextRemove}>{t('workout.removeSet')}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      <NumericInputDoneButton />
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
    color: colors.textInverse,
  },
  discardButtonFull: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: 16,
    marginTop: spacing.md,
    width: '100%',
  },
  discardButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.danger,
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
    alignSelf: 'flex-start',
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
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
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
  setTypeLetterContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setTypeTextWarmup: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#F5A623',
  },
  setTypeTextFailure: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.danger,
  },
  setTypeTextDropset: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#2196F3',
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
    color: colors.textInverse,
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

  // Superset Styles
  supersetBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: spacing.xs,
    marginLeft: 48,
  },
  supersetBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
    color: colors.textInverse,
    letterSpacing: 0.2,
  },
  supersetModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.8,
    paddingBottom: 40,
  },
  supersetModalHeader: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  supersetModalTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    color: colors.text,
  },
  supersetExerciseList: {
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  supersetExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: spacing.lg,
  },
  supersetColorBar: {
    width: 4,
    height: 52,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  supersetExerciseInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  supersetExerciseName: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  supersetExerciseSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  supersetExerciseMuscle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  supersetExistingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  supersetExistingBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.textInverse,
    letterSpacing: 0.2,
  },
  supersetCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supersetCheckboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  supersetModalBottom: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  supersetConfirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  supersetConfirmButtonDisabled: {
    opacity: 0.5,
  },
  supersetConfirmButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.textInverse,
  },
});
