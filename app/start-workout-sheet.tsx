import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  Alert,
  TextInput,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fonts } from '@/constants/theme';
import {
  useTemplateStore,
  WorkoutTemplate,
  TemplateFolder,
  getTemplateTotalSets,
  DEFAULT_FOLDER_ID,
} from '@/stores/templateStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { getProgram, WORKOUT_TYPE_COLORS, type ProgramWorkout } from '@/data/programs';
import { getPlanSquareImage } from '@/data/programs/planImages';
import { getPlanById } from '@/data/plans';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const REORDER_ROW_HEIGHT = 72;
const SWIPE_DELETE_WIDTH = 60;

// Sentinel folder id used by the auto-managed plan templates folder. Prefixed
// so it never collides with a real user folder id. Per-plan so switching
// plans doesn't surface custom templates from a different plan.
const PLAN_FOLDER_PREFIX = 'plan-folder:';
const planFolderIdFor = (planId: string) => `${PLAN_FOLDER_PREFIX}${planId}`;
const isPlanFolderId = (id: string | null) =>
  typeof id === 'string' && id.startsWith(PLAN_FOLDER_PREFIX);

// ─── SVG Icons (matching legacy) ─────────────────────────────────────────────

function FolderIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FolderChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      {collapsed ? (
        <Path
          d="M9 6l6 6-6 6"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <Path
          d="M6 9l6 6 6-6"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

function ReorderIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 10l5-5 5 5"
        stroke="#000"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 14l5 5 5-5"
        stroke="#000"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AddIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Line x1={12} y1={5} x2={12} y2={19} stroke="#000" strokeWidth={2} strokeLinecap="round" />
      <Line x1={5} y1={12} x2={19} y2={12} stroke="#000" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function DeleteIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
        stroke="#C75050"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1={4}
        y1={12}
        x2={20}
        y2={12}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1={4}
        y1={16}
        x2={20}
        y2={16}
        stroke="rgba(0,0,0,0.3)"
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
      <Line x1={8} y1={12} x2={16} y2={12} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Template Card (horizontal row, matches legacy) ───────────────────────────

function TemplateCard({
  template,
  index,
  onPress,
  isDragGhost,
}: {
  template: WorkoutTemplate;
  index: number;
  onPress: () => void;
  isDragGhost?: boolean;
}) {
  const exerciseCount = template.exercises.length;
  const totalSets = useMemo(() => getTemplateTotalSets(template), [template]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.planListRow,
        isDragGhost && { opacity: 0.3 },
        pressed && !isDragGhost && { opacity: 0.7 },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onPress();
      }}
    >
      {/* Thumbnail — alternating tilt to match the plan-template row */}
      <View
        style={[
          styles.planListThumb,
          { transform: [{ rotate: `${index % 2 === 0 ? 2 : -2}deg` }] },
        ]}
      >
        {template.localImage ? (
          <Image
            source={template.localImage}
            style={styles.planListThumbImg}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : template.image?.uri ? (
          <Image
            source={{ uri: template.image.uri }}
            style={styles.planListThumbImg}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.planListThumbImg, styles.planListThumbPlaceholder]}>
            <Ionicons name="barbell-outline" size={20} color="rgba(0,0,0,0.3)" />
          </View>
        )}
      </View>
      <View style={styles.planListInfo}>
        <Text style={styles.planListName} numberOfLines={1}>
          {template.name}
        </Text>
        <Text style={styles.planListSub} numberOfLines={1}>
          {exerciseCount}x Exercises • {totalSets} Total Sets
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="rgba(0,0,0,0.3)" />
    </Pressable>
  );
}

// ─── Plan workout card (read-only — no swipe, no menu, no status icon) ────────
// Mirrors the list-view row from app/(tabs)/plan.tsx (tilted thumbnail,
// name + meta, chevron) so the same plan workout looks identical here as on
// the planner. The status indicator (check / cross) is intentionally
// omitted — these cards aren't tied to a specific scheduled occurrence.

function PlanWorkoutCard({
  workout,
  index,
  onPress,
}: {
  workout: ProgramWorkout;
  index: number;
  onPress: () => void;
}) {
  const localImage = getPlanSquareImage(workout.id);
  const exerciseCount = workout.exercises.length;
  const totalSets = workout.exercises.reduce((acc, e) => acc + e.sets, 0);

  return (
    <Pressable
      style={({ pressed }) => [styles.planListRow, pressed && { opacity: 0.7 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onPress();
      }}
    >
      {/* Thumbnail — alternating tilt to match the planner list view */}
      <View
        style={[
          styles.planListThumb,
          { transform: [{ rotate: `${index % 2 === 0 ? 2 : -2}deg` }] },
        ]}
      >
        {localImage ? (
          <Image
            source={localImage}
            style={styles.planListThumbImg}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.planListThumbImg, styles.planListThumbPlaceholder]}>
            <Ionicons name="barbell-outline" size={20} color="rgba(0,0,0,0.3)" />
          </View>
        )}
      </View>
      <View style={styles.planListInfo}>
        <Text style={styles.planListName} numberOfLines={1}>
          {workout.title}
        </Text>
        <Text style={styles.planListSub} numberOfLines={1}>
          {exerciseCount}x Exercises • {totalSets} Total Sets
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="rgba(0,0,0,0.3)" />
    </Pressable>
  );
}

// ─── Swipeable wrapper ────────────────────────────────────────────────────────

function SwipeableTemplateCard({
  template,
  onDelete,
  children,
}: {
  template: WorkoutTemplate;
  onDelete: (t: WorkoutTemplate) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<Swipeable>(null);
  const handleDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    ref.current?.close();
    onDelete(template);
  }, [template, onDelete]);

  return (
    <Swipeable
      ref={ref}
      renderRightActions={() => (
        <Pressable style={swipeStyles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color="#FF3B30" />
        </Pressable>
      )}
      rightThreshold={30}
      overshootRight={false}
      friction={2}
    >
      {children}
    </Swipeable>
  );
}

const swipeStyles = StyleSheet.create({
  deleteButton: { width: SWIPE_DELETE_WIDTH, justifyContent: 'center', alignItems: 'center' },
});

// ─── Draggable template row (reorder modal) ───────────────────────────────────

function DraggableTemplateRow({
  template,
  index,
  onRemove,
  isDragging,
  draggedIndex,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  template: WorkoutTemplate;
  index: number;
  onRemove: () => void;
  isDragging: boolean;
  draggedIndex: number | null;
  onDragStart: (i: number) => void;
  onDragMove: (y: number) => void;
  onDragEnd: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onDragStart(index);
        Animated.spring(scale, { toValue: 1.02, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, gs) => onDragMove(gs.moveY),
      onPanResponderRelease: () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        onDragEnd();
      },
      onPanResponderTerminate: () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        onDragEnd();
      },
    })
  ).current;

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
      <Pressable
        style={styles.removeButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          onRemove();
        }}
      >
        <MinusCircleIcon />
      </Pressable>
      <View style={styles.reorderImagePlaceholder}>
        {template.localImage ? (
          <Image source={template.localImage} style={styles.reorderImage} contentFit="cover" />
        ) : template.image?.uri ? (
          <Image
            source={{ uri: template.image.uri }}
            style={styles.reorderImage}
            contentFit="cover"
          />
        ) : (
          <Ionicons name="barbell-outline" size={20} color="rgba(0,0,0,0.3)" />
        )}
      </View>
      <Text style={styles.reorderTemplateName}>{template.name}</Text>
      <View style={styles.dragHandle} {...panResponder.panHandlers}>
        <DragHandleIcon />
      </View>
    </Animated.View>
  );
}

// ─── Draggable folder row (folder reorder modal) ──────────────────────────────

function DraggableFolderRow({
  folder,
  index,
  onRemove,
  isDragging,
  draggedIndex,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  folder: TemplateFolder;
  index: number;
  onRemove: () => void;
  isDragging: boolean;
  draggedIndex: number | null;
  onDragStart: (i: number) => void;
  onDragMove: (y: number) => void;
  onDragEnd: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onDragStart(index);
        Animated.spring(scale, { toValue: 1.02, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, gs) => onDragMove(gs.moveY),
      onPanResponderRelease: () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        onDragEnd();
      },
      onPanResponderTerminate: () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        onDragEnd();
      },
    })
  ).current;

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
      <Pressable
        style={styles.removeButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          onRemove();
        }}
      >
        <MinusCircleIcon />
      </Pressable>
      <View style={[styles.reorderImagePlaceholder, { justifyContent: 'center' }]}>
        <FolderIcon />
      </View>
      <Text style={styles.reorderTemplateName}>{folder.name}</Text>
      <View style={styles.dragHandle} {...panResponder.panHandlers}>
        <DragHandleIcon />
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StartWorkoutSheet() {
  const { withLock } = useNavigationLock();

  // Store
  const templates = useTemplateStore((s) => s.templates);
  const folders = useTemplateStore((s) => s.folders);
  const removeTemplate = useTemplateStore((s) => s.removeTemplate);
  const createFolder = useTemplateStore((s) => s.createFolder);
  const deleteFolder = useTemplateStore((s) => s.deleteFolder);
  const toggleFolderCollapsed = useTemplateStore((s) => s.toggleFolderCollapsed);
  const moveTemplateToFolder = useTemplateStore((s) => s.moveTemplateToFolder);
  const reorderTemplatesInStore = useTemplateStore((s) => s.reorderTemplates);
  const reorderFoldersInStore = useTemplateStore((s) => s.reorderFolders);
  const ensureDefaultFolders = useTemplateStore((s) => s.ensureDefaultFolders);

  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const discardActiveWorkout = useWorkoutStore((s) => s.discardActiveWorkout);
  const startActiveWorkout = useWorkoutStore((s) => s.startActiveWorkout);
  const userId = useUserProfileStore((s) => s.userId);
  const profile = useUserProfileStore((s) => s.profile);

  // ─── Plan folder data ───────────────────────────────────────────────────────
  // Render the user's current plan as a virtual folder above My Templates.
  // Read-only: not deletable, not reorderable, no swipe-to-delete.
  const planProgram = useMemo(
    () => (profile?.plan_id ? getProgram(profile.plan_id) : null),
    [profile?.plan_id]
  );
  // "Summer Body Plan" → "Summer Body Templates" etc. The folder represents
  // template-able plan workouts, not the plan itself.
  const planName = useMemo(() => {
    if (!profile?.plan_id) return null;
    const raw = getPlanById(profile.plan_id)?.name;
    return raw ? raw.replace(/\s*Plan\b/, ' Templates') : null;
  }, [profile?.plan_id]);
  const planWorkouts = useMemo<ProgramWorkout[]>(() => {
    if (!planProgram) return [];
    // Show one card per workout day in the first cycle. Skip abs/cardio
    // companions (they live as `workouts[1+]` and would crowd the list).
    // Skip rest-day entries (e.g. Summer Body's "Active Rest") — they have
    // no exercises, just a freeText instruction.
    return planProgram.days
      .slice(0, planProgram.daysPerWeek)
      .map((day) => day.workouts[0])
      .filter((w): w is ProgramWorkout => !!w && w.exercises.length > 0);
  }, [planProgram]);

  // Sentinel id for the auto-managed plan templates folder. Acts as the
  // selectedFolderId when the user taps the 3-dot menu, so the existing
  // openFolderMenu / handleFolderMenuAddRoutine / handleFolderMenuReorderTemplates
  // handlers all just work without duplicating their logic.
  const planFolderId = useMemo(
    () => (profile?.plan_id ? planFolderIdFor(profile.plan_id) : null),
    [profile?.plan_id]
  );

  // User templates whose folderId points at this plan folder sentinel — they
  // render inside the plan folder body alongside the plan workouts.
  const planFolderUserTemplates = useMemo(() => {
    if (!planFolderId) return [];
    return templates.filter((t) => t.folderId === planFolderId);
  }, [planFolderId, templates]);
  const [planFolderCollapsed, setPlanFolderCollapsed] = useState(false);

  useEffect(() => {
    ensureDefaultFolders();
  }, [ensureDefaultFolders]);

  // Workout-in-progress modal
  const [showWorkoutInProgressModal, setShowWorkoutInProgressModal] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

  // Reorder templates modal
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderTemplates, setReorderTemplates] = useState<WorkoutTemplate[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const reorderListTopRef = useRef(0);

  // Folder reorder modal
  const [showFolderReorderModal, setShowFolderReorderModal] = useState(false);
  const [reorderFoldersList, setReorderFoldersList] = useState<TemplateFolder[]>([]);
  const [draggedFolderIndex, setDraggedFolderIndex] = useState<number | null>(null);
  const folderReorderListTopRef = useRef(0);

  // Folder creation modal
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Folder menu (3-dot)
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const folderMenuSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Folder selection modal (for new template when 2+ folders)
  const [showFolderSelectionModal, setShowFolderSelectionModal] = useState(false);
  const folderSelectionSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Drag-to-folder state
  const [isDragToFolder, setIsDragToFolder] = useState(false);
  const [draggedTemplate, setDraggedTemplate] = useState<WorkoutTemplate | null>(null);
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const hoveredFolderIdRef = useRef<string | null>(null);
  const dragSourceFolderId = useRef<string | null>(null);
  const folderContainerRefs = useRef(new Map<string, any>());
  const folderContainerPositions = useRef(new Map<string, { y: number; height: number }>());
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  const dragOpacity = useRef(new Animated.Value(0)).current;

  // ─── Computed ───────────────────────────────────────────────────────────────

  const getTemplatesInFolder = useCallback(
    (folderId: string) => {
      if (folderId === DEFAULT_FOLDER_ID) {
        return templates.filter((t) => t.folderId === folderId || !t.folderId);
      }
      return templates.filter((t) => t.folderId === folderId);
    },
    [templates]
  );

  const folderTemplateMap = useMemo(() => {
    const map = new Map<string, WorkoutTemplate[]>();
    folders.forEach((f) => map.set(f.id, getTemplatesInFolder(f.id)));
    return map;
  }, [folders, getTemplatesInFolder]);

  const unfolderedTemplates = useMemo(() => {
    const hasDefaultFolder = folders.some((f) => f.id === DEFAULT_FOLDER_ID);
    if (hasDefaultFolder) return [];
    return templates.filter((t) => !t.folderId);
  }, [folders, templates]);

  // ─── Start workout helpers ───────────────────────────────────────────────────

  const handleStartEmptyWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (activeWorkout?.isMinimized) {
      if (activeWorkout.exercises.length === 0) {
        withLock(() => router.replace('/active-workout'));
        return;
      }
      setShowWorkoutInProgressModal(true);
    } else {
      if (activeWorkout) discardActiveWorkout();
      startActiveWorkout(userId, undefined);
      withLock(() => router.replace('/active-workout'));
    }
  };

  const handleStartFromTemplate = (templateId: string) => {
    if (activeWorkout?.isMinimized) {
      if (activeWorkout.exercises.length === 0) {
        discardActiveWorkout();
        withLock(() => router.replace({ pathname: '/active-workout', params: { templateId } }));
        return;
      }
      setPendingTemplateId(templateId);
      setShowWorkoutInProgressModal(true);
    } else {
      if (activeWorkout) discardActiveWorkout();
      withLock(() => router.replace({ pathname: '/active-workout', params: { templateId } }));
    }
  };

  // Tapping a plan template opens the same detail view as the planner list
  // row, just with the action button repurposed to "Schedule Workout"
  // instead of "Start Workout" (these are read-only templates — the only
  // thing you can do with them is schedule an occurrence).
  const handlePlanWorkoutPress = (pw: ProgramWorkout) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    withLock(() =>
      router.push({
        pathname: '/workout-preview',
        params: { programWorkoutId: pw.id, source: 'template' },
      })
    );
  };

  const handleResumeWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowWorkoutInProgressModal(false);
    withLock(() => router.replace('/active-workout'));
  };

  const handleStartNewWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    discardActiveWorkout();
    setShowWorkoutInProgressModal(false);
    if (pendingTemplateId) {
      withLock(() =>
        router.replace({ pathname: '/active-workout', params: { templateId: pendingTemplateId } })
      );
      setPendingTemplateId(null);
    } else {
      startActiveWorkout(userId, undefined);
      withLock(() => router.replace('/active-workout'));
    }
  };

  // Tapping a My-Template now opens the same workout-preview screen as plan
  // templates do. The preview's Start button (driven by templateId + source)
  // begins the active workout — no more inline Start button on the row.
  const handleTemplatePress = (template: WorkoutTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    withLock(() =>
      router.push({
        pathname: '/workout-preview',
        params: { templateId: template.id, source: 'template' },
      })
    );
  };

  const handleDeleteTemplate = useCallback(
    (template: WorkoutTemplate) => {
      Alert.alert('Remove Template', `Remove "${template.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeTemplate(template.id) },
      ]);
    },
    [removeTemplate]
  );

  // ─── New template + folder selection ────────────────────────────────────────

  const handleNewTemplatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (folders.length === 0) {
      withLock(() => router.push('/create-template'));
    } else if (folders.length === 1) {
      withLock(() =>
        router.push({ pathname: '/create-template', params: { folderId: folders[0].id } })
      );
    } else {
      setShowFolderSelectionModal(true);
      Animated.spring(folderSelectionSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  };

  const closeFolderSelectionModal = () => {
    Animated.timing(folderSelectionSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowFolderSelectionModal(false);
    });
  };

  const handleSelectFolderForNewTemplate = (folderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    closeFolderSelectionModal();
    setTimeout(() => {
      withLock(() => router.push({ pathname: '/create-template', params: { folderId } }));
    }, 300);
  };

  // ─── Folder menu ─────────────────────────────────────────────────────────────

  const openFolderMenu = (folderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedFolderId(folderId);
    setShowFolderMenu(true);
    Animated.spring(folderMenuSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeFolderMenu = () => {
    Animated.timing(folderMenuSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowFolderMenu(false);
      setSelectedFolderId(null);
    });
  };

  const handleFolderMenuReorderTemplates = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    closeFolderMenu();
    setTimeout(() => {
      const folderTemplates = selectedFolderId ? getTemplatesInFolder(selectedFolderId) : [];
      if (folderTemplates.length === 0) {
        Alert.alert('No Templates', 'Add templates to this folder before reordering.');
        return;
      }
      setReorderTemplates(folderTemplates);
      setShowReorderModal(true);
    }, 300);
  };

  const handleFolderMenuAddRoutine = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    closeFolderMenu();
    withLock(() =>
      router.push({
        pathname: '/create-template',
        params: selectedFolderId ? { folderId: selectedFolderId } : {},
      })
    );
  };

  const handleFolderMenuDeleteFolder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!selectedFolderId) return;
    const folder = folders.find((f) => f.id === selectedFolderId);
    if (!folder) return;
    if (selectedFolderId === DEFAULT_FOLDER_ID || isPlanFolderId(selectedFolderId)) {
      closeFolderMenu();
      Alert.alert(
        'Cannot Delete',
        isPlanFolderId(selectedFolderId)
          ? "Plan template folders can't be deleted. Switch plans in Profile to change which folder appears here."
          : 'The default "My Templates" folder cannot be deleted.'
      );
      return;
    }
    closeFolderMenu();
    setTimeout(() => {
      Alert.alert(
        'Delete Folder',
        `Delete "${folder.name}"? Templates inside will be moved to My Templates.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteFolder(selectedFolderId) },
        ]
      );
    }, 300);
  };

  // ─── Create folder ───────────────────────────────────────────────────────────

  const handleCreateFolder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setShowCreateFolderModal(false);
      setNewFolderName('');
    }
  };

  // ─── Template reorder ────────────────────────────────────────────────────────

  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDragMove = (gestureY: number) => {
    if (draggedIndex === null) return;
    const listTop = reorderListTopRef.current || 120;
    const targetIndex = Math.max(
      0,
      Math.min(Math.floor((gestureY - listTop) / REORDER_ROW_HEIGHT), reorderTemplates.length - 1)
    );
    if (targetIndex !== draggedIndex) {
      setReorderTemplates((prev) => {
        const updated = [...prev];
        const item = updated[draggedIndex];
        updated.splice(draggedIndex, 1);
        updated.splice(targetIndex, 0, item);
        return updated;
      });
      setDraggedIndex(targetIndex);
    }
  };

  const handleDragEnd = () => setDraggedIndex(null);

  const removeTemplateFromReorder = (index: number) => {
    const t = reorderTemplates[index];
    Alert.alert('Remove Template', `Remove "${t.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setReorderTemplates((prev) => prev.filter((_, i) => i !== index));
          removeTemplate(t.id);
        },
      },
    ]);
  };

  const saveTemplateReorder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    reorderTemplatesInStore(reorderTemplates);
    setShowReorderModal(false);
  };

  // ─── Folder reorder ──────────────────────────────────────────────────────────

  const handleFolderDragStart = (index: number) => setDraggedFolderIndex(index);

  const handleFolderDragMove = (gestureY: number) => {
    if (draggedFolderIndex === null) return;
    const listTop = folderReorderListTopRef.current || 120;
    const targetIndex = Math.max(
      0,
      Math.min(Math.floor((gestureY - listTop) / REORDER_ROW_HEIGHT), reorderFoldersList.length - 1)
    );
    if (targetIndex !== draggedFolderIndex) {
      setReorderFoldersList((prev) => {
        const updated = [...prev];
        const item = updated[draggedFolderIndex];
        updated.splice(draggedFolderIndex, 1);
        updated.splice(targetIndex, 0, item);
        return updated;
      });
      setDraggedFolderIndex(targetIndex);
    }
  };

  const handleFolderDragEnd = () => setDraggedFolderIndex(null);

  const removeFolderFromReorder = (index: number) => {
    const folder = reorderFoldersList[index];
    if (folder.id === DEFAULT_FOLDER_ID) {
      Alert.alert('Cannot Delete', 'The default "My Templates" folder cannot be deleted.');
      return;
    }
    Alert.alert('Delete Folder', `Delete "${folder.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setReorderFoldersList((prev) => prev.filter((_, i) => i !== index));
          deleteFolder(folder.id);
        },
      },
    ]);
  };

  const saveFolderReorder = () => {
    reorderFoldersInStore(reorderFoldersList);
    setShowFolderReorderModal(false);
  };

  // ─── Drag-to-folder ──────────────────────────────────────────────────────────

  const measureFolderContainers = () => {
    folderContainerRefs.current.forEach((ref, folderId) => {
      ref.measureInWindow((_x: number, y: number, _w: number, height: number) => {
        folderContainerPositions.current.set(folderId, { y, height });
      });
    });
  };

  const activateDrag = (
    template: WorkoutTemplate,
    sourceFolderId: string,
    pageX: number,
    pageY: number
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    dragX.setValue(pageX);
    dragY.setValue(pageY);
    setIsDragToFolder(true);
    setDraggedTemplate(template);
    setScrollEnabled(false);
    dragSourceFolderId.current = sourceFolderId;
    measureFolderContainers();
    dragOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(dragScale, { toValue: 1.05, useNativeDriver: true }),
      Animated.timing(dragOpacity, { toValue: 0.95, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handleDragTouchMove = (pageX: number, pageY: number) => {
    dragX.setValue(pageX);
    dragY.setValue(pageY);
    let found: string | null = null;
    folderContainerPositions.current.forEach((pos, folderId) => {
      if (pageY >= pos.y - 8 && pageY <= pos.y + pos.height + 8) found = folderId;
    });
    if (found !== hoveredFolderIdRef.current) {
      hoveredFolderIdRef.current = found;
      setHoveredFolderId(found);
      if (found) Haptics.selectionAsync();
    }
  };

  const handleDragDrop = () => {
    const target = hoveredFolderIdRef.current;
    if (target && draggedTemplate && target !== dragSourceFolderId.current) {
      moveTemplateToFolder(draggedTemplate.id, target);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Animated.timing(dragOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setIsDragToFolder(false);
      setDraggedTemplate(null);
      setHoveredFolderId(null);
      hoveredFolderIdRef.current = null;
      dragSourceFolderId.current = null;
      setScrollEnabled(true);
      dragScale.setValue(1);
    });
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* Header: close button (left) + centered title + spacer (right) */}
      <View style={styles.header}>
        <Pressable
          style={styles.closeBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          }}
          hitSlop={8}
        >
          <Ionicons name="close" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Start Workout</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView scrollEnabled={scrollEnabled} showsVerticalScrollIndicator={false}>
        {/* Hero: Start Empty Workout */}
        <Pressable
          style={({ pressed }) => [styles.startEmptyButton, pressed && { opacity: 0.7 }]}
          onPress={handleStartEmptyWorkout}
        >
          <Text style={styles.plusIcon}>+</Text>
          <Text style={styles.startEmptyText}>Start Empty Workout</Text>
        </Pressable>

        {/* Secondary row: Schedule Workout + Create Template */}
        <View style={styles.secondaryRow}>
          <Pressable
            style={({ pressed }) => [styles.secondaryCard, pressed && { opacity: 0.7 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              withLock(() => router.push('/schedule-new-workout'));
            }}
          >
            <Ionicons name="calendar-outline" size={24} color="#000" />
            <Text style={styles.startEmptyText}>Schedule Workout</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryCard, pressed && { opacity: 0.7 }]}
            onPress={handleNewTemplatePress}
          >
            <Ionicons name="clipboard-outline" size={24} color="#000" />
            <Text style={styles.startEmptyText}>Create Template</Text>
          </Pressable>
        </View>

        {/* Saved Templates section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Templates</Text>
          <View style={styles.sectionHeaderRight}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setNewFolderName('');
                setShowCreateFolderModal(true);
              }}
              style={styles.folderButton}
            >
              <FolderIcon />
            </Pressable>
          </View>
        </View>

        <View style={styles.templatesList}>
          {folders.map((folder) => {
            const folderTemplates = folderTemplateMap.get(folder.id) || [];
            return (
              <View
                key={folder.id}
                ref={(ref) => {
                  if (ref) folderContainerRefs.current.set(folder.id, ref);
                }}
                style={[
                  styles.folderContainer,
                  isDragToFolder &&
                    hoveredFolderId === folder.id &&
                    styles.folderContainerDropTarget,
                ]}
              >
                <View style={styles.folderHeaderRow}>
                  <Pressable
                    style={({ pressed }) => [styles.folderHeader, pressed && { opacity: 0.7 }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      toggleFolderCollapsed(folder.id);
                    }}
                  >
                    <FolderChevronIcon collapsed={folder.isCollapsed} />
                    <Text style={styles.folderName}>{folder.name}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.folderMenuButton}
                    onPress={() => openFolderMenu(folder.id)}
                  >
                    <Ionicons name="ellipsis-horizontal" size={18} color="rgba(0,0,0,0.4)" />
                  </Pressable>
                </View>

                {!folder.isCollapsed && folderTemplates.length > 0 && (
                  <View style={styles.folderTemplates}>
                    {folderTemplates.map((template, idx) => (
                      <SwipeableTemplateCard
                        key={template.id}
                        template={template}
                        onDelete={handleDeleteTemplate}
                      >
                        <TemplateCard
                          template={template}
                          index={idx}
                          onPress={() => handleTemplatePress(template)}
                          isDragGhost={isDragToFolder && draggedTemplate?.id === template.id}
                        />
                      </SwipeableTemplateCard>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {unfolderedTemplates.map((template, idx) => (
            <SwipeableTemplateCard
              key={template.id}
              template={template}
              onDelete={handleDeleteTemplate}
            >
              <TemplateCard
                template={template}
                index={idx}
                onPress={() => handleTemplatePress(template)}
                isDragGhost={isDragToFolder && draggedTemplate?.id === template.id}
              />
            </SwipeableTemplateCard>
          ))}

          {/* Plan folder — the user's current plan, rendered below their own
              folders. Read-only: cards open workout-preview in template mode
              (Schedule Workout button) rather than starting an active workout.
              The 3-dot button matches the user folder UX visually but only
              surfaces a brief explanation since the folder is auto-managed. */}
          {planProgram && planName && planWorkouts.length > 0 && (
            <View style={styles.folderContainer}>
              <View style={styles.folderHeaderRow}>
                <Pressable
                  style={({ pressed }) => [styles.folderHeader, pressed && { opacity: 0.7 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setPlanFolderCollapsed((v) => !v);
                  }}
                >
                  <FolderChevronIcon collapsed={planFolderCollapsed} />
                  <Text style={styles.folderName}>{planName}</Text>
                </Pressable>
                <Pressable
                  style={styles.folderMenuButton}
                  onPress={() => {
                    if (planFolderId) openFolderMenu(planFolderId);
                  }}
                >
                  <Ionicons name="ellipsis-horizontal" size={18} color="rgba(0,0,0,0.4)" />
                </Pressable>
              </View>
              {!planFolderCollapsed && (
                <View style={styles.folderTemplates}>
                  {planWorkouts.map((pw, idx) => (
                    <PlanWorkoutCard
                      key={pw.id}
                      workout={pw}
                      index={idx}
                      onPress={() => handlePlanWorkoutPress(pw)}
                    />
                  ))}
                  {planFolderUserTemplates.map((template, idx) => (
                    <SwipeableTemplateCard
                      key={template.id}
                      template={template}
                      onDelete={handleDeleteTemplate}
                    >
                      <TemplateCard
                        template={template}
                        index={planWorkouts.length + idx}
                        onPress={() => handleTemplatePress(template)}
                        isDragGhost={isDragToFolder && draggedTemplate?.id === template.id}
                      />
                    </SwipeableTemplateCard>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Drag overlay */}
      {isDragToFolder && draggedTemplate && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dragOverlay,
            {
              transform: [
                { translateX: Animated.subtract(dragX, 100) },
                { translateY: Animated.subtract(dragY, 40) },
                { scale: dragScale },
              ],
              opacity: dragOpacity,
            },
          ]}
        >
          <TemplateCard template={draggedTemplate} index={0} onPress={() => {}} />
        </Animated.View>
      )}

      {/* ── Workout In Progress Modal ── */}
      <Modal
        visible={showWorkoutInProgressModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWorkoutInProgressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.workoutInProgressModal}>
            <Text style={styles.modalTitle}>Workout In Progress</Text>
            <Text style={styles.modalSubtitle}>
              You have an active workout. What would you like to do?
            </Text>
            <Pressable style={styles.resumeButton} onPress={handleResumeWorkout}>
              <Text style={styles.resumeButtonText}>Resume Workout</Text>
            </Pressable>
            <Pressable style={styles.startNewButton} onPress={handleStartNewWorkout}>
              <Text style={styles.startNewButtonText}>Start New Workout</Text>
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setShowWorkoutInProgressModal(false);
                setPendingTemplateId(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Folder Menu Bottom Sheet ── */}
      <Modal
        visible={showFolderMenu}
        transparent
        animationType="none"
        onRequestClose={closeFolderMenu}
      >
        <Pressable
          style={styles.menuModalOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            closeFolderMenu();
          }}
        >
          <Animated.View
            style={[styles.menuModalContent, { transform: [{ translateY: folderMenuSlideAnim }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <View style={styles.menuContainer}>
                <Pressable style={styles.menuItem} onPress={handleFolderMenuReorderTemplates}>
                  <ReorderIcon />
                  <Text style={styles.menuItemText}>Reorder Templates</Text>
                </Pressable>
                <Pressable style={styles.menuItem} onPress={handleFolderMenuAddRoutine}>
                  <AddIcon />
                  <Text style={styles.menuItemText}>Add New Template</Text>
                </Pressable>
                {selectedFolderId !== DEFAULT_FOLDER_ID && !isPlanFolderId(selectedFolderId) && (
                  <Pressable style={styles.menuItem} onPress={handleFolderMenuDeleteFolder}>
                    <DeleteIcon />
                    <Text style={[styles.menuItemText, { color: '#C75050' }]}>Delete Folder</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── Create Folder Modal ── */}
      <Modal
        visible={showCreateFolderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateFolderModal(false)}
      >
        <View style={styles.createFolderModalOverlay}>
          <View style={styles.createFolderModal}>
            <Text style={styles.createFolderTitle}>New Folder</Text>
            <TextInput
              autoCorrect={false}
              style={styles.createFolderInput}
              placeholder="Folder name"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
              onSubmitEditing={handleCreateFolder}
              returnKeyType="done"
            />
            <View style={styles.createFolderButtons}>
              <Pressable
                style={styles.createFolderCancel}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  setShowCreateFolderModal(false);
                  setNewFolderName('');
                }}
              >
                <Text style={styles.createFolderCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.createFolderConfirm, !newFolderName.trim() && { opacity: 0.4 }]}
                onPress={handleCreateFolder}
                disabled={!newFolderName.trim()}
              >
                <Text style={styles.createFolderConfirmText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Folder Selection Modal (new template with 2+ folders) ── */}
      <Modal
        visible={showFolderSelectionModal}
        transparent
        animationType="none"
        onRequestClose={closeFolderSelectionModal}
      >
        <Pressable
          style={styles.menuModalOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            closeFolderSelectionModal();
          }}
        >
          <Animated.View
            style={[
              styles.menuModalContent,
              { transform: [{ translateY: folderSelectionSlideAnim }] },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={styles.folderSelectionTitle}>Choose Folder</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {folders.map((folder) => (
                  <Pressable
                    key={folder.id}
                    style={styles.folderSelectionItem}
                    onPress={() => handleSelectFolderForNewTemplate(folder.id)}
                  >
                    <FolderIcon />
                    <Text style={styles.folderSelectionItemText}>{folder.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={{ height: 20 }} />
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── Reorder Templates Modal ── */}
      <Modal
        visible={showReorderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReorderModal(false)}
      >
        <SafeAreaView style={styles.reorderModal} edges={['top', 'bottom']}>
          <View style={styles.reorderHeader}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setShowReorderModal(false);
              }}
            >
              <Text style={styles.reorderCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.reorderTitle}>Reorder Templates</Text>
            <Pressable onPress={saveTemplateReorder}>
              <Text style={styles.reorderDone}>Done</Text>
            </Pressable>
          </View>
          <ScrollView
            scrollEnabled={draggedIndex === null}
            onLayout={(e) => {
              reorderListTopRef.current = e.nativeEvent.layout.y;
            }}
          >
            {reorderTemplates.map((t, i) => (
              <DraggableTemplateRow
                key={t.id}
                template={t}
                index={i}
                onRemove={() => removeTemplateFromReorder(i)}
                isDragging={draggedIndex === i}
                draggedIndex={draggedIndex}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              />
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  closeBtn: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#000',
  },

  startEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    gap: 12,
  },
  plusIcon: { fontFamily: fonts.medium, fontSize: 20, color: '#000', marginRight: 4 },
  startEmptyText: { fontFamily: fonts.medium, fontSize: 16, color: '#000' },
  secondaryRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    gap: 12,
  },
  secondaryCard: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 20, color: '#000', letterSpacing: -0.3 },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  folderButton: { padding: 6 },

  templatesList: { paddingBottom: 8 },

  folderContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  folderContainerDropTarget: {
    borderWidth: 2,
    borderColor: '#000',
    borderStyle: 'dashed',
  },
  folderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  folderHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  folderName: { fontFamily: fonts.semiBold, fontSize: 16, color: '#000' },
  folderMenuButton: { padding: 8 },

  folderTemplates: { gap: 8, paddingBottom: 4 },

  // Plan workout row — mirrors the planner list-view row (tilted thumbnail,
  // name + meta, chevron) so a plan workout looks identical here as in the
  // planner. No status icon — these cards aren't tied to a scheduled date.
  planListRow: {
    height: 74,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  planListThumb: {
    width: 54,
    height: 54,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e8e8e8',
  },
  planListThumbImg: { width: 54, height: 54 },
  planListThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  planListInfo: { flex: 1, gap: 3 },
  planListName: { fontFamily: fonts.semiBold, fontSize: 17, color: '#000' },
  planListSub: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(0,0,0,0.5)' },

  // Template card (horizontal row, matches legacy)
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  templateImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
  },
  templateImage: { width: 48, height: 48 },
  templateImagePlaceholder: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: { flex: 1, gap: 2 },
  templateName: { fontFamily: fonts.semiBold, fontSize: 15, color: '#000' },
  templateMeta: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(0,0,0,0.5)' },
  startTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  startTemplateIcon: { fontFamily: fonts.bold, fontSize: 16, color: '#000' },
  startTemplateText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#000' },

  // Drag overlay
  dragOverlay: {
    position: 'absolute',
    width: CARD_WIDTH,
    zIndex: 999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },

  // Reorder rows
  reorderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: REORDER_ROW_HEIGHT,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 16,
    gap: 12,
  },
  removeButton: { padding: 4 },
  reorderImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reorderImage: { width: 44, height: 44 },
  reorderTemplateName: { flex: 1, fontFamily: fonts.semiBold, fontSize: 15, color: '#000' },
  dragHandle: { padding: 8 },

  // Workout In Progress Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutInProgressModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH - 48,
    gap: 12,
  },
  modalTitle: { fontFamily: fonts.bold, fontSize: 20, color: '#000', textAlign: 'center' },
  modalSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
  resumeButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resumeButtonText: { fontFamily: fonts.semiBold, fontSize: 16, color: '#fff' },
  startNewButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startNewButtonText: { fontFamily: fonts.semiBold, fontSize: 16, color: '#000' },
  cancelButton: { alignItems: 'center', paddingVertical: 8 },
  cancelButtonText: { fontFamily: fonts.medium, fontSize: 15, color: 'rgba(0,0,0,0.5)' },

  // Menu / bottom sheets
  menuModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  menuModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  menuContainer: { paddingHorizontal: 24, paddingBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  menuItemText: { fontFamily: fonts.medium, fontSize: 17, color: '#000' },

  // Create Folder Modal
  createFolderModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createFolderModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH - 64,
    gap: 16,
  },
  createFolderTitle: { fontFamily: fonts.bold, fontSize: 20, color: '#000', textAlign: 'center' },
  createFolderInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#000',
  },
  createFolderButtons: { flexDirection: 'row', gap: 12 },
  createFolderCancel: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createFolderCancelText: { fontFamily: fonts.semiBold, fontSize: 15, color: '#000' },
  createFolderConfirm: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createFolderConfirmText: { fontFamily: fonts.semiBold, fontSize: 15, color: '#fff' },

  // Folder Selection Modal
  folderSelectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  folderSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  folderSelectionItemText: { fontFamily: fonts.medium, fontSize: 17, color: '#000' },

  // Reorder Modal
  reorderModal: { flex: 1, backgroundColor: '#fff' },
  reorderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  reorderTitle: { fontFamily: fonts.bold, fontSize: 18, color: '#000' },
  reorderCancel: { fontFamily: fonts.medium, fontSize: 16, color: 'rgba(0,0,0,0.5)' },
  reorderDone: { fontFamily: fonts.semiBold, fontSize: 16, color: '#000' },
});
