import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Line } from 'react-native-svg';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import {
  getBatchExercisePreviousSets,
  PreviousSetData,
  getUserExercisePreferences,
  saveUserExercisePreference,
} from '@/services/api/workouts';
import { getCurrentUser } from '@/services/api/user';
import {
  formatPreviousSet,
  getWeightUnit,
  UnitSystem,
  filterNumericInput,
  fromKgForDisplay,
} from '@/utils/units';
import { formatExerciseNameString } from '@/utils/textFormatters';
import ClockModal from '@/components/workout/ClockModal';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useTemplateStore } from '@/stores/templateStore';
import { ExerciseImage } from '@/components/ExerciseImage';
import { playTimerSound } from '@/utils/sounds';
import {
  startWorkoutLiveActivity,
  updateWorkoutLiveActivity,
  endWorkoutLiveActivity,
} from '@/services/liveActivity';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Exercise {
  id: string;
  name: string;
  muscle: string;
  gifUrl?: string;
  thumbnailUrl?: string;
}

// Set types: 'normal' shows the set number, others show their first letter
type SetType = 'normal' | 'warmup' | 'failure' | 'dropset';

interface ExerciseSet {
  id: string;
  previous: string;
  kg: string;
  reps: string;
  completed: boolean;
  setType: SetType;
  rpe: number | null;
}

interface WorkoutExercise {
  exercise: Exercise;
  notes: string;
  restTimerSeconds: number; // 0 means off
  sets: ExerciseSet[];
  previousSets: PreviousSetData[] | null;
  supersetId: number | null; // null = not in a superset, 1+ = superset group number
}

// Superset colors - each superset group gets a different color
const SUPERSET_COLORS = [
  '#64B5F6', // Blue (Superset 1)
  '#7AC29A', // Green (Superset 2)
  '#FF8A65', // Orange (Superset 3)
  '#E53935', // Red (Superset 4)
  '#BA68C8', // Purple (Superset 5)
];

// Rest timer options in seconds
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

// Icons for the menu
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

// Draggable row for exercises - improved drag-based reorder
const REORDER_ROW_HEIGHT = 72;

interface DraggableExerciseRowProps {
  workoutExercise: WorkoutExercise;
  index: number;
  onRemove: () => void;
  isDragging: boolean;
  draggedIndex: number | null;
  onDragStart: (index: number) => void;
  onDragMove: (gestureY: number) => void;
  onDragEnd: () => void;
}

function DraggableExerciseRow({
  workoutExercise,
  index,
  onRemove,
  isDragging,
  draggedIndex,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DraggableExerciseRowProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onDragStart(index);
        Animated.spring(scale, {
          toValue: 1.02,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        onDragMove(gestureState.moveY);
      },
      onPanResponderRelease: () => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
        onDragEnd();
      },
      onPanResponderTerminate: () => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
        onDragEnd();
      },
    })
  ).current;

  // Visual feedback: dim non-dragged items when dragging
  const opacity = draggedIndex !== null && draggedIndex !== index ? 0.5 : 1;

  return (
    <Animated.View
      style={[
        styles.reorderItem,
        {
          transform: [{ scale }],
          opacity,
          zIndex: isDragging ? 100 : 1,
          elevation: isDragging ? 5 : 0,
        },
      ]}
    >
      <Pressable style={styles.removeButton} onPress={onRemove}>
        <MinusCircleIcon />
      </Pressable>
      <ExerciseImage
        gifUrl={workoutExercise.exercise.gifUrl}
        thumbnailUrl={workoutExercise.exercise.thumbnailUrl}
        size={48}
        borderRadius={8}
      />
      <Text style={styles.reorderExerciseName}>
        {formatExerciseNameString(workoutExercise.exercise.name)}
      </Text>
      <View style={styles.dragHandle} {...panResponder.panHandlers}>
        <DragHandleIcon />
      </View>
    </Animated.View>
  );
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatRestTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatRestTimerDisplay(seconds: number): string {
  if (seconds === 0) return 'OFF';
  const option = REST_TIMER_OPTIONS.find((o) => o.value === seconds);
  return option?.label || formatRestTime(seconds);
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

function createDefaultSets(
  previousSets: PreviousSetData[] | null,
  units: UnitSystem
): ExerciseSet[] {
  if (previousSets && previousSets.length > 0) {
    return previousSets.map((prev, index) => ({
      id: (index + 1).toString(),
      previous:
        prev.weightKg !== null && prev.reps !== null
          ? formatPreviousSet(prev.weightKg, prev.reps, units)
          : '-',
      kg: '',
      reps: '',
      completed: false,
      setType: 'normal' as SetType,
      rpe: null,
    }));
  }
  return [
    {
      id: '1',
      previous: '-',
      kg: '',
      reps: '',
      completed: false,
      setType: 'normal' as SetType,
      rpe: null,
    },
  ];
}

const DELETE_BUTTON_WIDTH = 72;

interface SwipeableSetRowProps {
  set: ExerciseSet;
  setIndex: number;
  exerciseIndex: number;
  setTypeLabel: string;
  setType: SetType;
  onUpdateValue: (
    exerciseIndex: number,
    setIndex: number,
    field: 'kg' | 'reps',
    value: string
  ) => void;
  onToggleCompletion: (exerciseIndex: number, setIndex: number) => void;
  onDelete: (exerciseIndex: number, setIndex: number) => void;
  onSetTypePress: (exerciseIndex: number, setIndex: number) => void;
  previousWeight?: string;
  previousReps?: string;
  suggestedWeight?: string;
  suggestedReps?: string;
  rpeEnabled: boolean;
  onRpePress: (exerciseIndex: number, setIndex: number) => void;
}

function SwipeableSetRow({
  set,
  setIndex,
  exerciseIndex,
  setTypeLabel,
  setType,
  onUpdateValue,
  onToggleCompletion,
  onDelete,
  onSetTypePress,
  previousWeight,
  previousReps,
  suggestedWeight,
  suggestedReps,
  rpeEnabled,
  onRpePress,
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
      <Pressable style={swipeStyles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
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
      <View
        style={[styles.setRow, set.completed && styles.setRowCompleted, { marginHorizontal: 0 }]}
      >
        {/* Set number / type */}
        <Pressable
          style={[styles.setColumn, styles.setNumberButton]}
          onPress={() => onSetTypePress(exerciseIndex, setIndex)}
        >
          <Text style={[styles.setText, styles.setNumber, getSetTypeLabelStyle()]}>
            {setTypeLabel}
          </Text>
        </Pressable>
        <Text style={[styles.setText, styles.previousColumn, styles.previousText]}>
          {set.previous}
        </Text>

        {/* Input fields */}
        <TextInput
          style={[styles.setText, styles.kgColumn, styles.setInput]}
          value={set.kg}
          onChangeText={(value) =>
            onUpdateValue(exerciseIndex, setIndex, 'kg', filterNumericInput(value))
          }
          keyboardType="numeric"
          placeholder={suggestedWeight || previousWeight || '0'}
          placeholderTextColor={colors.textTertiary}
        />
        <TextInput
          style={[styles.setText, styles.repsColumn, styles.setInput]}
          value={set.reps}
          onChangeText={(value) =>
            onUpdateValue(exerciseIndex, setIndex, 'reps', filterNumericInput(value, false))
          }
          keyboardType="numeric"
          placeholder={suggestedReps || previousReps || '0'}
          placeholderTextColor={colors.textTertiary}
        />

        {/* RPE column (conditional) */}
        {rpeEnabled && (
          <Pressable style={styles.rpeColumn} onPress={() => onRpePress(exerciseIndex, setIndex)}>
            <Text style={[styles.setText, set.rpe == null && { color: colors.textTertiary }]}>
              {set.rpe != null ? set.rpe : '-'}
            </Text>
          </Pressable>
        )}

        <Pressable
          style={styles.checkColumn}
          onPress={() => onToggleCompletion(exerciseIndex, setIndex)}
        >
          <View style={[styles.setCheckbox, set.completed && styles.setCheckboxCompleted]}>
            {set.completed && <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />}
          </View>
        </Pressable>
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

export default function ActiveWorkoutScreen() {
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const units = useUserPreferencesStore((s) => s.getUnitSystem());
  const [clockModalVisible, setClockModalVisible] = useState(false);

  // Global store for persistence
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const startActiveWorkout = useWorkoutStore((state) => state.startActiveWorkout);
  const startWorkoutFromTemplate = useWorkoutStore((state) => state.startWorkoutFromTemplate);
  const setActiveWorkoutExercises = useWorkoutStore((state) => state.setActiveWorkoutExercises);
  const updateActiveWorkoutTime = useWorkoutStore((state) => state.updateActiveWorkoutTime);
  const minimizeActiveWorkout = useWorkoutStore((state) => state.minimizeActiveWorkout);
  const restoreActiveWorkout = useWorkoutStore((state) => state.restoreActiveWorkout);
  const discardActiveWorkout = useWorkoutStore((state) => state.discardActiveWorkout);
  const pendingExercises = useWorkoutStore((state) => state.pendingExercises);
  const clearPendingExercises = useWorkoutStore((state) => state.clearPendingExercises);

  // Template store for getting template data
  const getTemplateById = useTemplateStore((state) => state.getTemplateById);

  // Menu state
  const [showExerciseMenu, setShowExerciseMenu] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const menuSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Reorder state
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderExercises, setReorderExercises] = useState<WorkoutExercise[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const reorderListRef = useRef<View>(null);
  const reorderListTopRef = useRef<number>(0);

  // Rest timer modal state
  const [showRestTimerModal, setShowRestTimerModal] = useState(false);
  const [restTimerModalExerciseIndex, setRestTimerModalExerciseIndex] = useState<number | null>(
    null
  );
  const restTimerModalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Rest timer countdown state
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerRemaining, setRestTimerRemaining] = useState(0);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restPopupSlideAnim = useRef(new Animated.Value(200)).current;

  // Superset modal state
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [supersetSelectedIndices, setSupersetSelectedIndices] = useState<number[]>([]);
  const supersetModalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Set type modal state
  const [showSetTypeModal, setShowSetTypeModal] = useState(false);
  const [setTypeModalExerciseIndex, setSetTypeModalExerciseIndex] = useState<number | null>(null);
  const [setTypeModalSetIndex, setSetTypeModalSetIndex] = useState<number | null>(null);
  const setTypeModalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // RPE modal state
  const [showRpeModal, setShowRpeModal] = useState(false);
  const [rpeModalExerciseIndex, setRpeModalExerciseIndex] = useState<number | null>(null);
  const [rpeModalSetIndex, setRpeModalSetIndex] = useState<number | null>(null);
  const rpeModalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const rpeTrackingEnabled = useUserPreferencesStore((s) => s.rpeTrackingEnabled);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startedAtRef = useRef<Date>(new Date());
  const isRestoringRef = useRef(false);

  // Get current user on mount and initialize/restore workout
  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id);
      }
    }
    loadUser();

    // Determine if we're starting a different template than what's in the store
    const isDifferentTemplate = templateId && activeWorkout?.sourceTemplateId !== templateId;

    if (activeWorkout && activeWorkout.isMinimized && !isDifferentTemplate) {
      // Restore minimized workout (same template or no template specified)
      isRestoringRef.current = true;
      setElapsedSeconds(activeWorkout.elapsedSeconds);
      setWorkoutExercises(activeWorkout.exercises as WorkoutExercise[]);
      startedAtRef.current = new Date(activeWorkout.startedAt);
      restoreActiveWorkout();

      // Restart Live Activity for restored workout
      const completedSets = activeWorkout.exercises.reduce(
        (total: number, ex: any) => total + ex.sets.filter((s: any) => s.completed).length,
        0
      );
      startWorkoutLiveActivity(
        activeWorkout.templateName || 'Workout',
        activeWorkout.exercises.length,
        completedSets,
        activeWorkout.startedAt
      );
    } else if (!activeWorkout || isDifferentTemplate) {
      // No active workout, OR starting a different template — create fresh
      if (templateId) {
        const template = getTemplateById(templateId);
        if (template) {
          const templateExercises = template.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            exerciseName: e.exerciseName,
            muscle: e.muscle,
            gifUrl: e.gifUrl,
            thumbnailUrl: e.thumbnailUrl,
            sets: e.sets.map((s) => ({
              targetWeight: s.targetWeight,
              targetReps: s.targetReps,
            })),
            restTimerSeconds: e.restTimerSeconds,
          }));

          // Update the store
          startWorkoutFromTemplate(template.id, template.name, templateExercises, null);

          // Also set component state directly to avoid race condition
          // where the sync effect picks up stale store data before this update
          const localExercises: WorkoutExercise[] = templateExercises.map((te) => ({
            exercise: {
              id: te.exerciseId,
              name: te.exerciseName,
              muscle: te.muscle,
              gifUrl: te.gifUrl,
              thumbnailUrl: te.thumbnailUrl,
            },
            notes: '',
            restTimerSeconds: te.restTimerSeconds,
            sets: te.sets.map((s, index) => ({
              id: `set_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
              previous:
                s.targetWeight && s.targetReps ? `${s.targetWeight} x ${s.targetReps}` : '-',
              kg: s.targetWeight?.toString() || '',
              reps: s.targetReps?.toString() || '',
              completed: false,
              setType: 'normal' as SetType,
              rpe: null,
            })),
            previousSets: te.sets.map((s, idx) => ({
              setNumber: idx + 1,
              weightKg: s.targetWeight || null,
              reps: s.targetReps || null,
            })),
            supersetId: null,
          }));
          setWorkoutExercises(localExercises);

          // Start Live Activity for template workout
          startWorkoutLiveActivity(
            template.name,
            templateExercises.length,
            0,
            new Date().toISOString()
          );
        } else {
          startActiveWorkout(null);
          startWorkoutLiveActivity('Workout', 0, 0, new Date().toISOString());
        }
      } else {
        startActiveWorkout(null);
        startWorkoutLiveActivity('Workout', 0, 0, new Date().toISOString());
      }
    }
    // If activeWorkout exists, not minimized, same template — returning from
    // add-exercise navigation. The component state should already be intact
    // since React Native keeps components mounted during push navigation.
  }, []);

  // Set startedAt on mount (only for fresh workouts, not restored ones)
  useEffect(() => {
    if (!isRestoringRef.current) {
      startedAtRef.current = new Date();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
      }
    };
  }, []);

  // Single timer source: start on focus, stop on blur.
  // Uses a ref to read the current elapsed time to avoid recreating the callback.
  const elapsedSecondsRef = useRef(elapsedSeconds);
  elapsedSecondsRef.current = elapsedSeconds;

  useFocusEffect(
    useCallback(() => {
      // Clear any stale interval before starting a new one
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      let currentTime = elapsedSecondsRef.current;
      intervalRef.current = setInterval(() => {
        currentTime += 1;
        setElapsedSeconds(currentTime);
        updateActiveWorkoutTime(currentTime);
      }, 1000);

      // Cleanup: stop timer when screen loses focus
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [])
  );

  // Handle pending exercises from the store (set by add-exercise screen)
  useEffect(() => {
    if (pendingExercises.length > 0) {
      // Clear first to prevent re-triggering if the effect runs again
      const exercisesToAdd = [...pendingExercises];
      clearPendingExercises();
      handlePendingExercises(exercisesToAdd);
    }
  }, [pendingExercises]);

  // Sync exercises from store when restoring a persisted workout (e.g. app relaunch).
  // Guard: only sync if the store's template matches what we're currently viewing,
  // to prevent stale data from a previous template leaking in.
  useEffect(() => {
    if (activeWorkout && activeWorkout.exercises.length > 0 && workoutExercises.length === 0) {
      const storeMatchesCurrent = !templateId || activeWorkout.sourceTemplateId === templateId;
      if (storeMatchesCurrent) {
        setWorkoutExercises(activeWorkout.exercises as WorkoutExercise[]);
      }
    }
  }, [activeWorkout]);

  // Override template targets with latest actual history when starting from a template
  const historyFetchedRef = useRef(false);
  useEffect(() => {
    if (!userId || !templateId || historyFetchedRef.current) return;
    if (workoutExercises.length === 0) return;
    historyFetchedRef.current = true;

    async function fetchLatestHistory() {
      const exerciseIds = workoutExercises.map((we) => we.exercise.id);
      const previousSetsMap = await getBatchExercisePreviousSets(userId!, exerciseIds);

      setWorkoutExercises((prev) =>
        prev.map((we) => {
          const histSets = previousSetsMap.get(we.exercise.id);
          if (!histSets || histSets.length === 0) return we;

          const updatedPreviousSets = histSets.map((hs) => ({
            setNumber: hs.setNumber,
            weightKg: hs.weightKg,
            reps: hs.reps,
          }));

          const updatedSets = we.sets.map((set, idx) => {
            const prev = histSets[idx];
            return {
              ...set,
              previous:
                prev && prev.weightKg !== null && prev.reps !== null
                  ? formatPreviousSet(prev.weightKg, prev.reps, units)
                  : set.previous,
            };
          });

          return { ...we, sets: updatedSets, previousSets: updatedPreviousSets };
        })
      );
    }

    fetchLatestHistory();
  }, [userId, templateId, workoutExercises.length]);

  // Sync exercises to global store whenever they change
  useEffect(() => {
    if (workoutExercises.length > 0) {
      setActiveWorkoutExercises(workoutExercises);

      // Update Live Activity with new exercise/set counts
      const completedSets = workoutExercises.reduce(
        (total, ex) => total + ex.sets.filter((s) => s.completed).length,
        0
      );
      updateWorkoutLiveActivity(
        activeWorkout?.templateName || 'Workout',
        workoutExercises.length,
        completedSets,
        startedAtRef.current.toISOString()
      );
    }
  }, [workoutExercises]);

  async function handlePendingExercises(exercises: Exercise[]) {
    try {
      const exerciseIds = exercises.map((e) => e.id);

      // If userId isn't loaded yet, fetch it now
      let currentUserId = userId;
      if (!currentUserId) {
        const user = await getCurrentUser();
        if (user) {
          currentUserId = user.id;
          setUserId(user.id);
        }
      }

      // Fetch all data in parallel using batch functions
      const [preferencesMap, previousSetsMap] = await Promise.all([
        currentUserId
          ? getUserExercisePreferences(currentUserId, exerciseIds)
          : Promise.resolve(new Map()),
        currentUserId
          ? getBatchExercisePreviousSets(currentUserId, exerciseIds)
          : Promise.resolve(new Map()),
      ]);

      // Build workout exercises synchronously using the pre-fetched data
      const newWorkoutExercises: WorkoutExercise[] = exercises.map((exercise) => {
        const previousSets = previousSetsMap.get(exercise.id) || null;
        const preference = preferencesMap.get(exercise.id);
        // Per-exercise preference overrides global default; only fall back when no preference exists
        const { defaultRestTimerSeconds } = useUserPreferencesStore.getState();
        const restTimerSeconds =
          preference != null ? preference.restTimerSeconds : defaultRestTimerSeconds;

        return {
          exercise,
          notes: '',
          restTimerSeconds,
          sets: createDefaultSets(previousSets, units),
          previousSets,
          supersetId: null,
        };
      });

      setWorkoutExercises((prev) => [...prev, ...newWorkoutExercises]);
    } catch (e) {
      console.error('Failed to add exercises:', e);
    }
  }

  // Menu functions
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
      setReorderExercises([...workoutExercises]);
      setShowReorderModal(true);
    }, 300);
  };

  // Get the next available superset ID
  const getNextSupersetId = (): number => {
    const existingIds = workoutExercises
      .map((we) => we.supersetId)
      .filter((id): id is number => id !== null);
    if (existingIds.length === 0) return 1;
    return Math.max(...existingIds) + 1;
  };

  // Get superset color by ID (0-indexed from SUPERSET_COLORS)
  const getSupersetColor = (supersetId: number): string => {
    return SUPERSET_COLORS[(supersetId - 1) % SUPERSET_COLORS.length];
  };

  // Open superset modal
  const openSupersetModal = () => {
    // Pre-select the current exercise if it exists
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

  // Toggle exercise selection in superset modal
  const toggleSupersetExercise = (index: number) => {
    setSupersetSelectedIndices((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index];
    });
  };

  // Confirm and create the superset
  const confirmSuperset = () => {
    if (supersetSelectedIndices.length < 2) {
      Alert.alert('Select Exercises', 'Please select at least 2 exercises for a superset.');
      return;
    }

    const newSupersetId = getNextSupersetId();

    setWorkoutExercises((prev) => {
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

  // Remove exercise from superset - removes this exercise and disconnects neighbor if only 1 remains
  const handleRemoveFromSuperset = () => {
    if (selectedExerciseIndex === null) return;

    const exercise = workoutExercises[selectedExerciseIndex];
    if (exercise.supersetId === null) return;

    const supersetIdToRemove = exercise.supersetId;

    setWorkoutExercises((prev) => {
      // First, remove the selected exercise from the superset
      const updated = prev.map((we, index) => {
        if (index === selectedExerciseIndex) {
          return { ...we, supersetId: null };
        }
        return we;
      });

      // Count how many exercises remain in this superset group
      const remainingInSuperset = updated.filter(
        (we) => we.supersetId === supersetIdToRemove
      ).length;

      // If only 1 exercise remains, disconnect it too (can't have a superset of 1)
      if (remainingInSuperset === 1) {
        return updated.map((we) => {
          if (we.supersetId === supersetIdToRemove) {
            return { ...we, supersetId: null };
          }
          return we;
        });
      }

      return updated;
    });

    closeExerciseMenu();
  };

  const handleRemoveExercise = () => {
    if (selectedExerciseIndex !== null) {
      setWorkoutExercises((prev) => prev.filter((_, index) => index !== selectedExerciseIndex));
    }
    closeExerciseMenu();
  };

  // Drag-based reorder functions
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragMove = (gestureY: number) => {
    if (draggedIndex === null) return;

    // Calculate which index the gesture is over based on Y position
    // Account for list top offset (header + safe area)
    const listTop = reorderListTopRef.current || 120;
    const relativeY = gestureY - listTop;
    const targetIndex = Math.floor(relativeY / REORDER_ROW_HEIGHT);

    // Clamp to valid range
    const clampedIndex = Math.max(0, Math.min(targetIndex, reorderExercises.length - 1));

    // Swap if we've moved to a different position
    if (clampedIndex !== draggedIndex) {
      setReorderExercises((prev) => {
        const updated = [...prev];
        const draggedItem = updated[draggedIndex];
        updated.splice(draggedIndex, 1);
        updated.splice(clampedIndex, 0, draggedItem);
        return updated;
      });
      setDraggedIndex(clampedIndex);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const removeExerciseFromReorder = (index: number) => {
    setReorderExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const saveReorder = () => {
    // Close any modals that use exercise indices to prevent stale index issues
    setRestTimerModalExerciseIndex(null);
    setShowRestTimerModal(false);
    setSetTypeModalExerciseIndex(null);
    setSetTypeModalSetIndex(null);
    setShowSetTypeModal(false);
    // Apply the new exercise order to local state
    setWorkoutExercises(reorderExercises);
    // Also update the workout store so changes persist when minimized/restored
    const reorderedActiveExercises = reorderExercises.map((ex) => ({
      exercise: ex.exercise,
      notes: ex.notes,
      restTimerSeconds: ex.restTimerSeconds,
      sets: ex.sets.map((s) => ({
        id: s.id,
        previous: s.previous,
        kg: s.kg,
        reps: s.reps,
        completed: s.completed,
        setType: s.setType,
      })),
      previousSets:
        ex.previousSets?.map((ps) => ({
          weightKg: ps.weightKg,
          reps: ps.reps,
        })) || null,
      supersetId: ex.supersetId,
    }));
    setActiveWorkoutExercises(reorderedActiveExercises);
    setShowReorderModal(false);
  };

  const handleBack = () => {
    // Stop local timer - the widget will take over timing
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Minimize the workout - widget will handle timer from store
    minimizeActiveWorkout();
    // Always navigate to workout tab when exiting (not discarding)
    router.replace('/(tabs)/workout');
  };

  const handleSave = () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to save workouts.');
      return;
    }

    if (workoutExercises.length === 0) {
      Alert.alert('No Exercises', 'Add at least one exercise to save your workout.');
      return;
    }

    const hasCompletedSets = workoutExercises.some((we) => we.sets.some((set) => set.completed));

    if (!hasCompletedSets) {
      Alert.alert('No Completed Sets', 'Complete at least one set before saving your workout.');
      return;
    }

    // Stop the timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Prepare workout data for save screen
    const workoutData = {
      exercises: workoutExercises.map((we) => ({
        exercise: we.exercise,
        notes: we.notes,
        sets: we.sets,
        supersetId: we.supersetId,
        restTimerSeconds: we.restTimerSeconds,
      })),
      durationSeconds: elapsedSeconds,
      startedAt: startedAtRef.current.toISOString(),
      userId,
      sourceTemplateId: activeWorkout?.sourceTemplateId,
      templateName: activeWorkout?.templateName,
    };

    // Navigate to save workout screen — workout stays in store until save completes
    // so the user can go back without losing progress
    router.push({
      pathname: '/save-workout',
      params: { workoutData: JSON.stringify(workoutData) },
    });
  };

  const handleAddExercise = () => {
    const existingIds = workoutExercises.map((we) => we.exercise.id);
    router.push({
      pathname: '/add-exercise',
      params: { existingExerciseIds: JSON.stringify(existingIds) },
    });
  };

  const addSet = (exerciseIndex: number) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const exercise = updated[exerciseIndex];
      const newSetNumber = exercise.sets.length + 1;

      const previousSet = exercise.previousSets?.[newSetNumber - 1];
      const previousDisplay =
        previousSet && previousSet.weightKg !== null && previousSet.reps !== null
          ? formatPreviousSet(previousSet.weightKg, previousSet.reps, units)
          : '-';

      exercise.sets.push({
        id: newSetNumber.toString(),
        previous: previousDisplay,
        kg: '',
        reps: '',
        completed: false,
        setType: 'normal',
        rpe: null,
      });
      return updated;
    });
  };

  const toggleSetCompletion = (exerciseIndex: number, setIndex: number) => {
    const exercise = workoutExercises[exerciseIndex];
    const set = exercise.sets[setIndex];
    const wasCompleted = set.completed;

    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const updatedSet = updated[exerciseIndex].sets[setIndex];
      updatedSet.completed = !wasCompleted;

      // When completing a set, auto-fill empty fields with suggestion or previous workout data
      if (!wasCompleted) {
        const prevCurrentSet = setIndex > 0 ? updated[exerciseIndex].sets[setIndex - 1] : null;
        const prevHistoricalSet = updated[exerciseIndex].previousSets?.[setIndex];

        if (!updatedSet.kg) {
          if (prevCurrentSet?.kg) {
            updatedSet.kg = prevCurrentSet.kg;
          } else if (prevHistoricalSet?.weightKg != null) {
            updatedSet.kg = fromKgForDisplay(prevHistoricalSet.weightKg, units).toString();
          }
        }
        if (!updatedSet.reps) {
          if (prevCurrentSet?.reps) {
            updatedSet.reps = prevCurrentSet.reps;
          } else if (prevHistoricalSet?.reps != null) {
            updatedSet.reps = prevHistoricalSet.reps.toString();
          }
        }
      }

      return updated;
    });

    // Start rest timer if completing a set (not uncompleting) and rest timer is enabled
    if (!wasCompleted && exercise.restTimerSeconds > 0) {
      startRestTimer(exercise.restTimerSeconds);
    }
  };

  const updateNotes = (exerciseIndex: number, notes: string) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].notes = notes;
      return updated;
    });
  };

  const updateSetValue = (
    exerciseIndex: number,
    setIndex: number,
    field: 'kg' | 'reps',
    value: string
  ) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex][field] = value;
      return updated;
    });
  };

  const deleteSet = (exerciseIndex: number, setIndex: number) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const exercise = updated[exerciseIndex];
      // If this is the last set, remove the entire exercise
      if (exercise.sets.length <= 1) {
        return updated.filter((_, i) => i !== exerciseIndex);
      }
      exercise.sets = exercise.sets.filter((_, i) => i !== setIndex);
      return updated;
    });
  };

  // RPE functions
  const updateRpe = (exerciseIndex: number, setIndex: number, value: number | null) => {
    setWorkoutExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex].rpe = value;
      return updated;
    });
  };

  const RPE_VALUES = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10];

  const openRpeModal = (exerciseIndex: number, setIndex: number) => {
    setRpeModalExerciseIndex(exerciseIndex);
    setRpeModalSetIndex(setIndex);
    setShowRpeModal(true);
    Animated.spring(rpeModalSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeRpeModal = () => {
    Animated.timing(rpeModalSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowRpeModal(false);
      setRpeModalExerciseIndex(null);
      setRpeModalSetIndex(null);
    });
  };

  const handleDiscard = () => {
    Alert.alert('Discard Workout?', 'Your workout progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (restTimerRef.current) clearInterval(restTimerRef.current);
          endWorkoutLiveActivity();
          discardActiveWorkout();
          router.back();
        },
      },
    ]);
  };

  // Rest Timer Modal Functions
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
    const exercise = workoutExercises[exerciseIndex];

    setWorkoutExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].restTimerSeconds = seconds;
      return updated;
    });

    // Save preference to backend so it persists for future workouts
    if (userId && exercise) {
      saveUserExercisePreference(userId, exercise.exercise.id, seconds);
    }
  };

  // Rest Timer Countdown Functions
  const startRestTimer = (seconds: number) => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }

    setRestTimerRemaining(seconds);
    setRestTimerActive(true);

    Animated.spring(restPopupSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();

    restTimerRef.current = setInterval(() => {
      setRestTimerRemaining((prev) => {
        if (prev <= 1) {
          if (restTimerRef.current) {
            clearInterval(restTimerRef.current);
          }
          // Timer completion alerts based on user preferences
          const { vibrationEnabled, timerSoundId } = useUserPreferencesStore.getState();
          if (vibrationEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          playTimerSound(timerSoundId);
          Animated.timing(restPopupSlideAnim, {
            toValue: 200,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setRestTimerActive(false);
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const adjustRestTimer = (delta: number) => {
    setRestTimerRemaining((prev) => {
      const newValue = prev + delta;
      return Math.max(0, newValue);
    });
  };

  const skipRestTimer = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }
    Animated.timing(restPopupSlideAnim, {
      toValue: 200,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setRestTimerActive(false);
      setRestTimerRemaining(0);
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

    setWorkoutExercises((prev) => {
      const updated = [...prev];
      updated[setTypeModalExerciseIndex].sets[setTypeModalSetIndex].setType = newType;
      return updated;
    });
    closeSetTypeModal();
  };

  const removeSet = () => {
    if (setTypeModalExerciseIndex === null || setTypeModalSetIndex === null) return;

    setWorkoutExercises((prev) => {
      const updated = [...prev];
      const exercise = updated[setTypeModalExerciseIndex];

      // If this is the last set, remove the entire exercise
      if (exercise.sets.length <= 1) {
        closeSetTypeModal();
        return updated.filter((_, i) => i !== setTypeModalExerciseIndex);
      }

      exercise.sets = exercise.sets.filter((_, index) => index !== setTypeModalSetIndex);
      // Re-number the sets
      exercise.sets.forEach((set, index) => {
        set.id = (index + 1).toString();
      });
      return updated;
    });
    closeSetTypeModal();
  };

  // Get display label for set type
  const getSetTypeLabel = (set: ExerciseSet, setIndex: number): string => {
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

  const weightLabel = getWeightUnit(units).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>

        <View style={styles.headerRight}>
          <Pressable style={styles.iconButton} onPress={() => setClockModalVisible(true)}>
            <Ionicons name="time-outline" size={24} color={colors.text} />
          </Pressable>
          <Pressable onPress={handleSave}>
            <Text style={styles.saveText}>SAVE</Text>
          </Pressable>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {workoutExercises.length === 0 ? (
        // Empty State
        <View style={styles.content}>
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark" size={26} color={colors.border} />
          </View>
          <Text style={styles.title}>Get Started</Text>
          <Text style={styles.subtitle}>Add an exercise to start your workout</Text>
          <Pressable style={styles.addExerciseButton} onPress={handleAddExercise}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </Pressable>
          <View style={styles.bottomButtons}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push('/profile/workout-settings')}
            >
              <Text style={styles.secondaryButtonText}>Settings</Text>
            </Pressable>
            <Pressable style={styles.discardButton} onPress={handleDiscard}>
              <Text style={styles.discardButtonText}>Discard</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        // Filled State with Exercises
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {workoutExercises.map((workoutExercise, exerciseIndex) => (
            <View
              key={`${workoutExercise.exercise.id}-${exerciseIndex}`}
              style={styles.exerciseCard}
            >
              {/* Exercise Header */}
              <View style={styles.exerciseHeader}>
                <ExerciseImage
                  gifUrl={workoutExercise.exercise.gifUrl}
                  thumbnailUrl={workoutExercise.exercise.thumbnailUrl}
                  size={40}
                  borderRadius={8}
                />
                <Pressable
                  style={styles.exerciseTitlePressable}
                  onPress={() => router.push(`/exercise/${workoutExercise.exercise.id}`)}
                >
                  <Text style={styles.exerciseTitle}>
                    {formatExerciseNameString(workoutExercise.exercise.name)}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.moreButton}
                  onPress={() => openExerciseMenu(exerciseIndex)}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
                </Pressable>
              </View>

              {/* Superset Badge */}
              {workoutExercise.supersetId !== null && (
                <View
                  style={[
                    styles.supersetBadge,
                    { backgroundColor: getSupersetColor(workoutExercise.supersetId) },
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
                value={workoutExercise.notes}
                onChangeText={(text) => updateNotes(exerciseIndex, text)}
              />

              {/* Rest Timer */}
              <Pressable
                style={styles.restTimerRow}
                onPress={() => openRestTimerModal(exerciseIndex)}
              >
                <Ionicons name="stopwatch-outline" size={18} color={colors.primary} />
                <Text style={styles.restTimerText}>
                  Rest Timer: {formatRestTimerDisplay(workoutExercise.restTimerSeconds)}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </Pressable>

              {/* Sets Table Header */}
              <View style={styles.setsHeader}>
                <Text style={[styles.setHeaderText, styles.setColumn]}>SET</Text>
                <Text style={[styles.setHeaderText, styles.previousColumn]}>PREVIOUS</Text>
                <Text style={[styles.setHeaderText, styles.kgColumn]}>{weightLabel}</Text>
                <Text style={[styles.setHeaderText, styles.repsColumn]}>REPS</Text>
                {rpeTrackingEnabled && (
                  <Text style={[styles.setHeaderText, styles.rpeColumn]}>RPE</Text>
                )}
                <View style={styles.checkColumn}>
                  <Ionicons name="checkmark" size={16} color={colors.textSecondary} />
                </View>
              </View>

              {/* Sets Rows */}
              {workoutExercise.sets.map((set, setIndex) => {
                const prevSet = workoutExercise.previousSets?.[setIndex];
                const prevWeight =
                  prevSet?.weightKg != null
                    ? fromKgForDisplay(prevSet.weightKg, units).toString()
                    : undefined;
                const prevReps = prevSet?.reps != null ? prevSet.reps.toString() : undefined;

                // Suggestion from previous set in current workout
                let suggestedWeight: string | undefined;
                let suggestedReps: string | undefined;
                if (setIndex > 0) {
                  const prevCurrentSet = workoutExercise.sets[setIndex - 1];
                  if (prevCurrentSet.kg) suggestedWeight = prevCurrentSet.kg;
                  if (prevCurrentSet.reps) suggestedReps = prevCurrentSet.reps;
                }

                return (
                  <SwipeableSetRow
                    key={set.id}
                    set={set}
                    setIndex={setIndex}
                    exerciseIndex={exerciseIndex}
                    setTypeLabel={getSetTypeLabel(set, setIndex)}
                    setType={set.setType}
                    onUpdateValue={updateSetValue}
                    onToggleCompletion={toggleSetCompletion}
                    onDelete={deleteSet}
                    onSetTypePress={openSetTypeModal}
                    previousWeight={prevWeight}
                    previousReps={prevReps}
                    suggestedWeight={suggestedWeight}
                    suggestedReps={suggestedReps}
                    rpeEnabled={rpeTrackingEnabled}
                    onRpePress={openRpeModal}
                  />
                );
              })}

              {/* Add Set Button */}
              <Pressable style={styles.addSetButton} onPress={() => addSet(exerciseIndex)}>
                <Text style={styles.addSetText}>+ Add Set</Text>
              </Pressable>
            </View>
          ))}

          {/* Bottom Buttons */}
          <Pressable style={styles.addExerciseButtonFilled} onPress={handleAddExercise}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </Pressable>

          <View style={styles.bottomButtonsFilled}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push('/profile/workout-settings')}
            >
              <Text style={styles.secondaryButtonText}>Settings</Text>
            </Pressable>
            <Pressable style={styles.discardButton} onPress={handleDiscard}>
              <Text style={styles.discardButtonText}>Discard Workout</Text>
            </Pressable>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* Clock Modal */}
      <ClockModal visible={clockModalVisible} onClose={() => setClockModalVisible(false)} />

      {/* Exercise Menu Bottom Sheet */}
      <Modal
        visible={showExerciseMenu}
        transparent
        animationType="none"
        onRequestClose={closeExerciseMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeExerciseMenu}>
          <Animated.View
            style={[styles.menuModalContent, { transform: [{ translateY: menuSlideAnim }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              {/* Menu Items */}
              <View style={styles.menuContainer}>
                <Pressable style={styles.menuItem} onPress={handleReorderExercises}>
                  <ReorderIcon />
                  <Text style={styles.menuItemText}>Reorder Exercises</Text>
                </Pressable>

                {selectedExerciseIndex !== null &&
                workoutExercises[selectedExerciseIndex]?.supersetId !== null ? (
                  <Pressable style={styles.menuItem} onPress={handleRemoveFromSuperset}>
                    <CloseIcon />
                    <Text style={styles.menuItemText}>Remove from Superset</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.menuItem} onPress={handleAddToSuperset}>
                    <PlusIcon />
                    <Text style={styles.menuItemText}>Add to Superset</Text>
                  </Pressable>
                )}

                <Pressable style={styles.menuItem} onPress={handleRemoveExercise}>
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
          {/* Reorder Header */}
          <View style={styles.reorderHeader}>
            <Text style={styles.reorderTitle}>Reorder</Text>
          </View>
          <View style={styles.divider} />

          {/* Exercise List */}
          <View
            ref={reorderListRef}
            style={styles.reorderList}
            onLayout={(e) => {
              reorderListTopRef.current = e.nativeEvent.layout.y;
            }}
          >
            {reorderExercises.map((workoutExercise, index) => (
              <DraggableExerciseRow
                key={`${workoutExercise.exercise.id}-${index}`}
                workoutExercise={workoutExercise}
                index={index}
                onRemove={() => removeExerciseFromReorder(index)}
                isDragging={draggedIndex === index}
                draggedIndex={draggedIndex}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              />
            ))}
          </View>

          {/* Done Button */}
          <View style={styles.reorderBottom}>
            <Pressable style={styles.doneButton} onPress={saveReorder}>
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
        <Pressable style={styles.modalOverlay} onPress={closeRestTimerModal}>
          <Animated.View
            style={[
              styles.restTimerModalContent,
              { transform: [{ translateY: restTimerModalSlideAnim }] },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              {/* Header */}
              <View style={styles.restTimerModalHeader}>
                <Text style={styles.restTimerModalTitle}>Rest Timer</Text>
                {restTimerModalExerciseIndex !== null && (
                  <Text style={styles.restTimerModalSubtitle}>
                    {formatExerciseNameString(
                      workoutExercises[restTimerModalExerciseIndex]?.exercise.name || ''
                    )}
                  </Text>
                )}
              </View>

              {/* Time Options */}
              <ScrollView style={styles.restTimerOptionsList} showsVerticalScrollIndicator={false}>
                {REST_TIMER_OPTIONS.map((option) => {
                  const isSelected =
                    restTimerModalExerciseIndex !== null &&
                    workoutExercises[restTimerModalExerciseIndex]?.restTimerSeconds ===
                      option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.restTimerOption, isSelected && styles.restTimerOptionSelected]}
                      onPress={() => {
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

              {/* Done Button */}
              <View style={styles.restTimerModalBottom}>
                <Pressable style={styles.doneButton} onPress={closeRestTimerModal}>
                  <Text style={styles.doneButtonText}>Done</Text>
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
        <Pressable style={styles.modalOverlay} onPress={closeSupersetModal}>
          <Animated.View
            style={[
              styles.supersetModalContent,
              { transform: [{ translateY: supersetModalSlideAnim }] },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              {/* Header */}
              <View style={styles.supersetModalHeader}>
                <Text style={styles.supersetModalTitle}>Super Set</Text>
              </View>

              {/* Exercise List */}
              <ScrollView style={styles.supersetExerciseList} showsVerticalScrollIndicator={false}>
                {workoutExercises.map((workoutExercise, index) => {
                  const isSelected = supersetSelectedIndices.includes(index);
                  const existingSuperset = workoutExercise.supersetId;

                  return (
                    <Pressable
                      key={`${workoutExercise.exercise.id}-${index}`}
                      style={styles.supersetExerciseRow}
                      onPress={() => toggleSupersetExercise(index)}
                    >
                      {/* Color indicator bar - inline, not absolute */}
                      <View
                        style={[
                          styles.supersetColorBar,
                          existingSuperset !== null
                            ? { backgroundColor: getSupersetColor(existingSuperset) }
                            : { backgroundColor: 'transparent' },
                        ]}
                      />

                      <ExerciseImage
                        gifUrl={workoutExercise.exercise.gifUrl}
                        thumbnailUrl={workoutExercise.exercise.thumbnailUrl}
                        size={40}
                        borderRadius={8}
                      />

                      <View style={styles.supersetExerciseInfo}>
                        <Text style={styles.supersetExerciseName}>
                          {formatExerciseNameString(workoutExercise.exercise.name)}
                        </Text>
                        <Text style={styles.supersetExerciseMuscle}>
                          {workoutExercise.exercise.muscle}
                        </Text>
                      </View>

                      {/* Selection checkbox */}
                      <View
                        style={[
                          styles.supersetCheckbox,
                          isSelected && styles.supersetCheckboxSelected,
                        ]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Add to Superset Button */}
              <View style={styles.supersetModalBottom}>
                <Pressable
                  style={[
                    styles.supersetConfirmButton,
                    supersetSelectedIndices.length < 2 && styles.supersetConfirmButtonDisabled,
                  ]}
                  onPress={confirmSuperset}
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
        <Pressable style={styles.modalOverlay} onPress={closeSetTypeModal}>
          <Animated.View
            style={[
              styles.menuModalContent,
              { transform: [{ translateY: setTypeModalSlideAnim }] },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              {/* Menu Items */}
              <View style={styles.menuContainer}>
                <Pressable style={styles.menuItem} onPress={() => updateSetType('warmup')}>
                  <View style={styles.setTypeLetterContainer}>
                    <Text style={styles.setTypeTextWarmup}>W</Text>
                  </View>
                  <Text style={styles.setTypeTextWarmup}>Warm-up Set</Text>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={() => updateSetType('normal')}>
                  <View style={styles.setTypeLetterContainer}>
                    <Text style={styles.menuItemText}>
                      {setTypeModalSetIndex !== null ? setTypeModalSetIndex + 1 : '1'}
                    </Text>
                  </View>
                  <Text style={styles.menuItemText}>Normal Set</Text>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={() => updateSetType('failure')}>
                  <View style={styles.setTypeLetterContainer}>
                    <Text style={styles.setTypeTextFailure}>F</Text>
                  </View>
                  <Text style={styles.setTypeTextFailure}>Failure Set</Text>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={() => updateSetType('dropset')}>
                  <View style={styles.setTypeLetterContainer}>
                    <Text style={styles.setTypeTextDropset}>D</Text>
                  </View>
                  <Text style={styles.setTypeTextDropset}>Drop Set</Text>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={removeSet}>
                  <View style={styles.setTypeLetterContainer}>
                    <Ionicons name="trash-outline" size={18} color="#E53935" />
                  </View>
                  <Text style={styles.menuItemTextRemove}>Remove Set</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* RPE Picker Modal */}
      <Modal visible={showRpeModal} transparent animationType="none" onRequestClose={closeRpeModal}>
        <Pressable style={styles.modalOverlay} onPress={closeRpeModal}>
          <Animated.View
            style={[styles.menuModalContent, { transform: [{ translateY: rpeModalSlideAnim }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <View style={styles.rpeModalHeader}>
                <Text style={styles.rpeModalTitle}>Rate of Perceived Exertion</Text>
              </View>
              <View style={styles.menuContainer}>
                {RPE_VALUES.map((rpeValue) => {
                  const currentRpe =
                    rpeModalExerciseIndex !== null && rpeModalSetIndex !== null
                      ? workoutExercises[rpeModalExerciseIndex]?.sets[rpeModalSetIndex]?.rpe
                      : null;
                  const isSelected = currentRpe === rpeValue;
                  return (
                    <Pressable
                      key={rpeValue}
                      style={styles.menuItem}
                      onPress={() => {
                        if (rpeModalExerciseIndex !== null && rpeModalSetIndex !== null) {
                          updateRpe(rpeModalExerciseIndex, rpeModalSetIndex, rpeValue);
                        }
                        closeRpeModal();
                      }}
                    >
                      <Text
                        style={[
                          styles.menuItemText,
                          isSelected && { color: colors.primary, fontFamily: fonts.semiBold },
                        ]}
                      >
                        {rpeValue}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                    </Pressable>
                  );
                })}
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    if (rpeModalExerciseIndex !== null && rpeModalSetIndex !== null) {
                      updateRpe(rpeModalExerciseIndex, rpeModalSetIndex, null);
                    }
                    closeRpeModal();
                  }}
                >
                  <Text style={[styles.menuItemText, { color: colors.textSecondary }]}>Clear</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Rest Timer Countdown Popup */}
      {restTimerActive && (
        <Animated.View
          style={[styles.restTimerPopup, { transform: [{ translateY: restPopupSlideAnim }] }]}
        >
          <SafeAreaView edges={['bottom']} style={styles.restTimerPopupContent}>
            <Text style={styles.restTimerCountdown}>{formatRestTime(restTimerRemaining)}</Text>
            <View style={styles.restTimerPopupButtons}>
              <Pressable style={styles.restTimerAdjustButton} onPress={() => adjustRestTimer(-15)}>
                <Text style={styles.restTimerAdjustText}>-15</Text>
              </Pressable>
              <Pressable style={styles.restTimerAdjustButton} onPress={() => adjustRestTimer(15)}>
                <Text style={styles.restTimerAdjustText}>+15</Text>
              </Pressable>
              <Pressable style={styles.restTimerSkipButton} onPress={skipRestTimer}>
                <Text style={styles.restTimerSkipText}>Skip</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}
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
  timer: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    position: 'absolute',
    right: spacing.lg,
    zIndex: 1,
  },
  iconButton: {
    padding: spacing.xs,
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
  bottomButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F4FA',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
  },
  secondaryButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  discardButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F4FA',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
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
  exerciseTitlePressable: {
    flex: 1,
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
    flex: 1.3,
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
  rpeColumn: {
    flex: 1,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpeModalHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rpeModalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  checkColumn: {
    flex: 0.8,
    alignItems: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  setRowCompleted: {
    backgroundColor: 'rgba(148, 122, 255, 0.2)',
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
  setCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCheckboxCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
  bottomButtonsFilled: {
    flexDirection: 'row',
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    gap: spacing.md,
  },
  bottomSpacer: {
    height: 140,
  },
  setInput: {
    textAlign: 'center',
    padding: 0,
  },

  // Menu Modal Styles
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
    height: 72,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  dragHandle: {
    padding: spacing.xs,
  },
  reorderArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
  },
  arrowButtonDisabled: {
    opacity: 0.4,
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

  // Rest Timer Countdown Popup Styles
  restTimerPopup: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  restTimerPopupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  restTimerCountdown: {
    fontFamily: fonts.bold,
    fontSize: 40,
    color: colors.text,
  },
  restTimerPopupButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  restTimerAdjustButton: {
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  restTimerAdjustText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  restTimerSkipButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  restTimerSkipText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },

  // Superset Badge Styles
  supersetBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: spacing.sm,
  },
  supersetBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Superset Modal Styles
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
  supersetExerciseImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
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
  supersetExerciseMuscle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  supersetCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
  },

  // Set Type Text Styles
  setTypeTextWarmup: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#F5A623',
  },
  setTypeTextFailure: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#E53935',
  },
  setTypeTextDropset: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#2196F3',
  },
  setTypeDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  setNumberButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
