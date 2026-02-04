import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Alert,
  TextInput,
} from 'react-native';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { getWorkoutHistory, WorkoutHistoryItem } from '@/services/api/workouts';
import { getCurrentUser } from '@/services/api/user';
import { useWorkoutStore } from '@/stores/workoutStore';
import {
  useTemplateStore,
  WorkoutTemplate,
  TemplateFolder,
  getTemplateTotalSets,
  formatTemplateDuration,
  DEFAULT_FOLDER_ID,
} from '@/stores/templateStore';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_CLONE_WIDTH = SCREEN_WIDTH - spacing.lg * 2 - spacing.xs;

function SettingsIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke={colors.text} strokeWidth={1.5} />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.08a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.08a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={colors.text}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusCircleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={colors.text} strokeWidth={1.5} />
      <Path d="M12 8v8M8 12h8" stroke={colors.text} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={colors.text} strokeWidth={1.5} />
      <Path d="M16 16l4 4" stroke={colors.text} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

// Icons for template menu
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

function RenameIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={colors.text}
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

function FolderIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z"
        stroke={colors.textSecondary}
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
        // Right-pointing chevron when collapsed (pointing inward like Figma)
        <Path
          d="M9 6l6 6-6 6"
          stroke={colors.textSecondary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        // Down-pointing chevron when expanded
        <Path
          d="M6 9l6 6 6-6"
          stroke={colors.textSecondary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return i18n.t('calendar.today');
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return i18n.t('calendar.yesterday');
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

interface WorkoutHistoryCardProps {
  workout: WorkoutHistoryItem;
}

function WorkoutHistoryCard({ workout }: WorkoutHistoryCardProps) {
  return (
    <Pressable style={styles.historyCard}>
      <View style={styles.historyIconContainer}>
        <Ionicons name="barbell-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle}>{workout.name || 'Workout'}</Text>
        <Text style={styles.historyDetails}>
          {workout.exerciseCount} exercise{workout.exerciseCount !== 1 ? 's' : ''} •{' '}
          {formatDuration(workout.durationSeconds)}
        </Text>
      </View>
      <Text style={styles.historyDate}>{formatDate(workout.completedAt)}</Text>
    </Pressable>
  );
}

interface TemplateCardProps {
  template: WorkoutTemplate;
  onStart: () => void;
  onPress: () => void;
  onDragActivate?: (template: WorkoutTemplate, pageX: number, pageY: number) => void;
  onDragMove?: (pageX: number, pageY: number) => void;
  onDragEnd?: () => void;
  isDragGhost?: boolean;
}

function TemplateCard({
  template,
  onStart,
  onPress,
  onDragActivate,
  onDragMove,
  onDragEnd,
  isDragGhost,
}: TemplateCardProps) {
  const totalSets = useMemo(() => getTemplateTotalSets(template), [template]);
  const duration = useMemo(
    () => formatTemplateDuration(template.estimatedDuration),
    [template.estimatedDuration]
  );
  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragActivatedRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const cardContent = (
    <Pressable
      style={({ pressed }) => [
        styles.templateCard,
        { backgroundColor: template.tagColor + '30' },
        isDragGhost && { opacity: 0.3 },
        pressed && !isDragGhost && { opacity: 0.7 },
      ]}
      onPress={onPress}
    >
      {/* Template Image */}
      <View style={styles.templateImageContainer}>
        {template.localImage ? (
          <Image source={template.localImage} style={styles.templateImage} />
        ) : template.image?.uri ? (
          <Image source={{ uri: template.image.uri }} style={styles.templateImage} />
        ) : (
          <View style={[styles.templateImage, styles.templateImagePlaceholder]}>
            <Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Template Info */}
      <View style={styles.templateInfo}>
        <Text style={styles.templateName}>{template.name}</Text>
        <Text style={styles.templateMeta}>
          {totalSets} Sets • {duration}
        </Text>
      </View>

      {/* Start Button */}
      <Pressable
        style={({ pressed }) => [styles.startTemplateButton, pressed && { opacity: 0.7 }]}
        onPress={(e) => {
          e.stopPropagation();
          onStart();
        }}
      >
        <Text style={styles.startTemplateIcon}>+</Text>
        <Text style={styles.startTemplateText}>{i18n.t('common.start')}</Text>
      </Pressable>
    </Pressable>
  );

  if (!onDragActivate) {
    return cardContent;
  }

  return (
    <View
      onTouchStart={(e) => {
        startPosRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        dragActivatedRef.current = false;
        Animated.timing(scaleAnim, {
          toValue: 1.02,
          duration: 1200,
          useNativeDriver: true,
        }).start();
        dragTimerRef.current = setTimeout(() => {
          dragActivatedRef.current = true;
          scaleAnim.setValue(1);
          onDragActivate(template, startPosRef.current.x, startPosRef.current.y);
        }, 1200);
      }}
      onTouchMove={(e) => {
        if (dragActivatedRef.current && onDragMove) {
          onDragMove(e.nativeEvent.pageX, e.nativeEvent.pageY);
        }
      }}
      onTouchEnd={() => {
        if (dragTimerRef.current) {
          clearTimeout(dragTimerRef.current);
          dragTimerRef.current = null;
        }
        if (dragActivatedRef.current && onDragEnd) {
          onDragEnd();
          dragActivatedRef.current = false;
        }
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      }}
      onTouchCancel={() => {
        if (dragTimerRef.current) {
          clearTimeout(dragTimerRef.current);
          dragTimerRef.current = null;
        }
        if (dragActivatedRef.current && onDragEnd) {
          onDragEnd();
          dragActivatedRef.current = false;
        }
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>{cardContent}</Animated.View>
    </View>
  );
}

// Draggable template row - improved drag-based reorder
const REORDER_ROW_HEIGHT = 72;

interface DraggableTemplateRowProps {
  template: WorkoutTemplate;
  index: number;
  onRemove: () => void;
  isDragging: boolean;
  draggedIndex: number | null;
  onDragStart: (index: number) => void;
  onDragMove: (gestureY: number) => void;
  onDragEnd: () => void;
}

function DraggableTemplateRow({
  template,
  index,
  onRemove,
  isDragging,
  draggedIndex,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DraggableTemplateRowProps) {
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
      <View style={styles.reorderImagePlaceholder}>
        {template.localImage ? (
          <Image source={template.localImage} style={styles.reorderImage} />
        ) : template.image?.uri ? (
          <Image source={{ uri: template.image.uri }} style={styles.reorderImage} />
        ) : (
          <Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />
        )}
      </View>
      <Text style={styles.reorderTemplateName}>{template.name}</Text>
      <View style={styles.dragHandle} {...panResponder.panHandlers}>
        <DragHandleIcon />
      </View>
    </Animated.View>
  );
}

// Draggable folder row - for folder reordering
interface DraggableFolderRowProps {
  folder: TemplateFolder;
  index: number;
  onRemove: () => void;
  isDragging: boolean;
  draggedIndex: number | null;
  onDragStart: (index: number) => void;
  onDragMove: (gestureY: number) => void;
  onDragEnd: () => void;
}

function DraggableFolderRow({
  folder,
  index,
  onRemove,
  isDragging,
  draggedIndex,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DraggableFolderRowProps) {
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

  const opacity = draggedIndex !== null && draggedIndex !== index ? 0.5 : 1;

  const isDefaultFolder = folder.id === DEFAULT_FOLDER_ID;

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
      {/* Hide remove button for default folder */}
      {isDefaultFolder ? (
        <View style={styles.removeButton} />
      ) : (
        <Pressable style={styles.removeButton} onPress={onRemove}>
          <MinusCircleIcon />
        </Pressable>
      )}
      <View style={styles.reorderImagePlaceholder}>
        <FolderIcon />
      </View>
      <Text style={styles.reorderTemplateName}>{folder.name}</Text>
      <View style={styles.dragHandle} {...panResponder.panHandlers}>
        <DragHandleIcon />
      </View>
    </Animated.View>
  );
}

export default function WorkoutScreen() {
  const { t } = useTranslation();
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showWorkoutInProgressModal, setShowWorkoutInProgressModal] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const { isNavigating, withLock } = useNavigationLock();

  // Template reorder state
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderTemplates, setReorderTemplates] = useState<WorkoutTemplate[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const reorderListRef = useRef<View>(null);
  const reorderListTopRef = useRef<number>(0);

  // Folder reorder state
  const [showFolderReorderModal, setShowFolderReorderModal] = useState(false);
  const [reorderFoldersList, setReorderFoldersList] = useState<TemplateFolder[]>([]);
  const [draggedFolderIndex, setDraggedFolderIndex] = useState<number | null>(null);
  const folderReorderListRef = useRef<View>(null);
  const folderReorderListTopRef = useRef<number>(0);

  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const discardActiveWorkout = useWorkoutStore((state) => state.discardActiveWorkout);
  const getScheduledWorkoutsForTemplate = useWorkoutStore(
    (state) => state.getScheduledWorkoutsForTemplate
  );
  const detachScheduledWorkoutsFromTemplate = useWorkoutStore(
    (state) => state.detachScheduledWorkoutsFromTemplate
  );
  const removeScheduledWorkoutsForTemplate = useWorkoutStore(
    (state) => state.removeScheduledWorkoutsForTemplate
  );

  // Template store
  const templates = useTemplateStore((state) => state.templates);
  const folders = useTemplateStore((state) => state.folders);
  const removeTemplate = useTemplateStore((state) => state.removeTemplate);
  const reorderTemplatesInStore = useTemplateStore((state) => state.reorderTemplates);
  const createFolder = useTemplateStore((state) => state.createFolder);
  const toggleFolderCollapsed = useTemplateStore((state) => state.toggleFolderCollapsed);
  const reorderFoldersInStore = useTemplateStore((state) => state.reorderFolders);
  const deleteFolder = useTemplateStore((state) => state.deleteFolder);
  const moveTemplateToFolder = useTemplateStore((state) => state.moveTemplateToFolder);

  // Drag-to-folder state
  const [isDragToFolder, setIsDragToFolder] = useState(false);
  const [draggedTemplate, setDraggedTemplate] = useState<WorkoutTemplate | null>(null);
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const dragOffsetX = useRef(new Animated.Value(CARD_CLONE_WIDTH / 2)).current;
  const dragOffsetY = useRef(new Animated.Value(40)).current;
  const dragOpacity = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const folderContainerPositions = useRef<Map<string, { y: number; height: number }>>(new Map());
  const folderContainerRefs = useRef<Map<string, View>>(new Map());
  const hoveredFolderIdRef = useRef<string | null>(null);
  const dragSourceFolderId = useRef<string | null>(null);

  // Folder creation modal state
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Folder menu state (for per-folder 3-dot menus)
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const folderMenuSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Folder selection modal state (for creating new template)
  const [showFolderSelectionModal, setShowFolderSelectionModal] = useState(false);
  const folderSelectionSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const handleStartEmptyWorkout = () => {
    // Only show the modal if there's a minimized workout (widget visible at bottom)
    // If there's a non-minimized workout (stale state), discard it and start fresh
    if (activeWorkout?.isMinimized) {
      // If the minimized workout is empty (no exercises), just resume it
      if (activeWorkout.exercises.length === 0) {
        withLock(() => {
          router.push('/active-workout');
        });
        return;
      }
      setShowWorkoutInProgressModal(true);
    } else {
      if (activeWorkout) {
        discardActiveWorkout();
      }
      withLock(() => {
        router.push('/active-workout');
      });
    }
  };

  const handleResumeWorkout = () => {
    setShowWorkoutInProgressModal(false);
    withLock(() => {
      router.push('/active-workout');
    });
  };

  const handleStartNewWorkout = () => {
    discardActiveWorkout();
    setShowWorkoutInProgressModal(false);
    if (pendingTemplateId) {
      withLock(() => {
        router.push({
          pathname: '/active-workout',
          params: { templateId: pendingTemplateId },
        });
      });
      setPendingTemplateId(null);
    } else {
      withLock(() => {
        router.push('/active-workout');
      });
    }
  };

  const handleCancelModal = () => {
    setShowWorkoutInProgressModal(false);
    setPendingTemplateId(null);
  };

  const handleStartFromTemplate = (templateId: string) => {
    // Only show the modal if there's a minimized workout (widget visible at bottom)
    if (activeWorkout?.isMinimized) {
      // If the minimized workout is empty (no exercises), discard it and start from template
      if (activeWorkout.exercises.length === 0) {
        discardActiveWorkout();
        withLock(() => {
          router.push({
            pathname: '/active-workout',
            params: { templateId },
          });
        });
        return;
      }
      setPendingTemplateId(templateId);
      setShowWorkoutInProgressModal(true);
    } else {
      if (activeWorkout) {
        discardActiveWorkout();
      }
      withLock(() => {
        router.push({
          pathname: '/active-workout',
          params: { templateId },
        });
      });
    }
  };

  const handleTemplatePress = (template: WorkoutTemplate) => {
    withLock(() => {
      router.push({
        pathname: '/template-detail',
        params: { templateId: template.id },
      });
    });
  };

  async function loadWorkoutHistory() {
    setIsLoading(true);
    const user = await getCurrentUser();
    if (user) {
      const history = await getWorkoutHistory(user.id, 10);
      setWorkoutHistory(history);
    }
    setIsLoading(false);
  }

  // Load history when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadWorkoutHistory();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkoutHistory();
    setRefreshing(false);
  };

  // Auto-create "My Templates" folder if templates exist but default folder doesn't
  // This handles existing users who created templates before the folder system
  useFocusEffect(
    useCallback(() => {
      if (templates.length > 0) {
        const hasDefaultFolder = folders.some((f) => f.id === DEFAULT_FOLDER_ID);
        if (!hasDefaultFolder) {
          // Use the store's internal method to create the default folder
          useTemplateStore.setState((state) => ({
            folders: [
              {
                id: DEFAULT_FOLDER_ID,
                name: 'My Templates',
                createdAt: new Date().toISOString(),
                isCollapsed: false,
              },
              ...state.folders,
            ],
          }));
        }
      }
    }, [templates.length, folders])
  );

  // Folder drag-based reorder functions
  const handleFolderDragStart = (index: number) => {
    setDraggedFolderIndex(index);
  };

  const handleFolderDragMove = (gestureY: number) => {
    if (draggedFolderIndex === null) return;

    const listTop = folderReorderListTopRef.current || 120;
    const relativeY = gestureY - listTop;
    const targetIndex = Math.floor(relativeY / REORDER_ROW_HEIGHT);

    const clampedIndex = Math.max(0, Math.min(targetIndex, reorderFoldersList.length - 1));

    if (clampedIndex !== draggedFolderIndex) {
      setReorderFoldersList((prev) => {
        const updated = [...prev];
        const draggedItem = updated[draggedFolderIndex];
        updated.splice(draggedFolderIndex, 1);
        updated.splice(clampedIndex, 0, draggedItem);
        return updated;
      });
      setDraggedFolderIndex(clampedIndex);
    }
  };

  const handleFolderDragEnd = () => {
    setDraggedFolderIndex(null);
  };

  const removeFolderFromReorder = (index: number) => {
    const folderToRemove = reorderFoldersList[index];

    // Protect the default "My Templates" folder from deletion
    if (folderToRemove.id === DEFAULT_FOLDER_ID) {
      Alert.alert(i18n.t('folder.cannotDelete'), i18n.t('folder.cannotDeleteMessage'), [
        { text: i18n.t('common.ok') },
      ]);
      return;
    }

    Alert.alert(
      i18n.t('folder.deleteFolder'),
      i18n.t('folder.deleteConfirm', { name: folderToRemove.name }),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => {
            setReorderFoldersList((prev) => prev.filter((_, i) => i !== index));
            deleteFolder(folderToRemove.id);
          },
        },
      ]
    );
  };

  const saveFolderReorder = () => {
    reorderFoldersInStore(reorderFoldersList);
    setShowFolderReorderModal(false);
  };

  // Folder creation handlers
  const openCreateFolderModal = () => {
    setNewFolderName('');
    setShowCreateFolderModal(true);
  };

  const closeCreateFolderModal = () => {
    setShowCreateFolderModal(false);
    setNewFolderName('');
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      closeCreateFolderModal();
    }
  };

  // Handle "New Template" button press
  // If only 1 folder exists, go directly to create-template with that folder
  // If 2+ folders exist, show folder selection modal
  const handleNewTemplatePress = () => {
    if (folders.length === 0) {
      // No folders yet, just go to create-template (will create default folder)
      withLock(() => {
        router.push('/create-template');
      });
    } else if (folders.length === 1) {
      // Only one folder, go directly to create-template with that folder
      withLock(() => {
        router.push({
          pathname: '/create-template',
          params: { folderId: folders[0].id },
        });
      });
    } else {
      // 2+ folders, show selection modal
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
    closeFolderSelectionModal();
    setTimeout(() => {
      withLock(() => {
        router.push({
          pathname: '/create-template',
          params: { folderId },
        });
      });
    }, 300);
  };

  // Folder menu functions (per-folder 3-dot menu)
  const openFolderMenu = (folderId: string) => {
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
    closeFolderMenu();
    setTimeout(() => {
      // Filter templates in the selected folder
      const folderTemplates = selectedFolderId ? getTemplatesInFolder(selectedFolderId) : [];
      if (folderTemplates.length === 0) {
        Alert.alert(i18n.t('folder.noTemplates'), i18n.t('folder.noTemplatesReorder'));
        return;
      }
      setReorderTemplates(folderTemplates);
      setShowReorderModal(true);
    }, 300);
  };

  const handleFolderMenuAddRoutine = () => {
    closeFolderMenu();
    // Navigate to create-template with folderId param
    withLock(() => {
      router.push({
        pathname: '/create-template',
        params: selectedFolderId ? { folderId: selectedFolderId } : {},
      });
    });
  };

  const handleFolderMenuDeleteFolder = () => {
    if (!selectedFolderId) return;

    const folder = folders.find((f) => f.id === selectedFolderId);
    if (!folder) return;

    // Protect the default folder
    if (selectedFolderId === DEFAULT_FOLDER_ID) {
      closeFolderMenu();
      Alert.alert(i18n.t('folder.cannotDelete'), i18n.t('folder.cannotDeleteMessage'));
      return;
    }

    closeFolderMenu();
    setTimeout(() => {
      Alert.alert(
        i18n.t('folder.deleteFolder'),
        i18n.t('folder.deleteConfirm', { name: folder.name }),
        [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          {
            text: i18n.t('common.delete'),
            style: 'destructive',
            onPress: () => deleteFolder(selectedFolderId),
          },
        ]
      );
    }, 300);
  };

  // Group templates by folder (memoized to avoid re-filtering on every render)
  const getTemplatesInFolder = useCallback(
    (folderId: string) => {
      if (folderId === DEFAULT_FOLDER_ID) {
        return templates.filter((t) => t.folderId === folderId || !t.folderId);
      }
      return templates.filter((t) => t.folderId === folderId);
    },
    [templates]
  );

  // Pre-computed folder → templates map so we don't re-filter inside .map()
  const folderTemplateMap = useMemo(() => {
    const map = new Map<string, WorkoutTemplate[]>();
    folders.forEach((f) => map.set(f.id, getTemplatesInFolder(f.id)));
    return map;
  }, [folders, getTemplatesInFolder]);

  // Templates not in any folder (memoized)
  const unfolderedTemplates = useMemo(() => {
    const hasDefaultFolder = folders.some((f) => f.id === DEFAULT_FOLDER_ID);
    if (hasDefaultFolder) {
      return [];
    }
    return templates.filter((t) => !t.folderId);
  }, [folders, templates]);

  // Drag-to-folder functions
  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const measureFolderContainers = () => {
    folderContainerRefs.current.forEach((ref, folderId) => {
      ref.measureInWindow((_x: number, y: number, _width: number, height: number) => {
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
      const pad = 8;
      if (pageY >= pos.y - pad && pageY <= pos.y + pos.height + pad) {
        found = folderId;
      }
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
    resetDragState();
  };

  const resetDragState = () => {
    clearLongPressTimer();
    Animated.timing(dragOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setIsDragToFolder(false);
      setDraggedTemplate(null);
      setHoveredFolderId(null);
      hoveredFolderIdRef.current = null;
      dragSourceFolderId.current = null;
      setScrollEnabled(true);
      dragScale.setValue(1);
    });
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
    const clampedIndex = Math.max(0, Math.min(targetIndex, reorderTemplates.length - 1));

    // Swap if we've moved to a different position
    if (clampedIndex !== draggedIndex) {
      setReorderTemplates((prev) => {
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

  const removeTemplateFromReorder = (index: number) => {
    const templateToRemove = reorderTemplates[index];
    const linkedWorkouts = getScheduledWorkoutsForTemplate(templateToRemove.id);

    const doRemove = (deleteWorkouts: boolean) => {
      if (deleteWorkouts) {
        removeScheduledWorkoutsForTemplate(templateToRemove.id);
      } else {
        detachScheduledWorkoutsFromTemplate(templateToRemove.id);
      }
      setReorderTemplates((prev) => prev.filter((_, i) => i !== index));
      removeTemplate(templateToRemove.id);
    };

    if (linkedWorkouts.length > 0) {
      const count = linkedWorkouts.length;
      Alert.alert(
        i18n.t('template.removeTitle'),
        i18n.t('template.removeWithWorkouts', { name: templateToRemove.name, count }),
        [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          { text: i18n.t('template.keepWorkouts'), onPress: () => doRemove(false) },
          {
            text: i18n.t('template.deleteAll'),
            style: 'destructive',
            onPress: () => doRemove(true),
          },
        ]
      );
    } else {
      Alert.alert(
        i18n.t('template.removeTitle'),
        i18n.t('template.removeConfirm', { name: templateToRemove.name }),
        [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          { text: i18n.t('common.remove'), style: 'destructive', onPress: () => doRemove(false) },
        ]
      );
    }
  };

  const saveTemplateReorder = () => {
    reorderTemplatesInStore(reorderTemplates);
    setShowReorderModal(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('workout.title')}</Text>
        </View>

        {/* Start Empty Workout Button */}
        <Pressable
          style={({ pressed }) => [styles.startEmptyButton, pressed && { opacity: 0.7 }]}
          onPress={handleStartEmptyWorkout}
        >
          <Text style={styles.plusIcon}>+</Text>
          <Text style={styles.startEmptyText}>{t('workout.startEmpty')}</Text>
        </Pressable>

        {/* Saved Templates Section */}
        <Text style={styles.sectionTitleWithPadding}>{t('workout.savedTemplates')}</Text>

        <View style={styles.cardsRow}>
          {/* New Template Card */}
          <Pressable style={styles.card} onPress={handleNewTemplatePress}>
            <PlusCircleIcon />
            <Text
              style={styles.cardText}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {t('workout.newTemplate')}
            </Text>
          </Pressable>

          {/* Explore Templates Card */}
          <Pressable
            style={styles.card}
            onPress={() =>
              withLock(() => {
                router.push('/explore-templates');
              })
            }
          >
            <SearchIcon />
            <Text
              style={styles.cardText}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {t('workout.exploreTemplates')}
            </Text>
          </Pressable>
        </View>

        {/* My Templates - only show section if there's at least 1 template */}
        {templates.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('workout.myTemplates')}</Text>
            <View style={styles.sectionHeaderRight}>
              {/* Folder icon - create new folder */}
              <Pressable onPress={openCreateFolderModal} style={styles.folderButton}>
                <FolderIcon />
              </Pressable>
            </View>
          </View>
        )}

        {templates.length === 0 && folders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={48} color={colors.border} />
            <Text style={styles.emptyStateText}>{t('workout.noTemplates')}</Text>
            <Text style={styles.emptyStateSubtext}>{t('workout.noTemplatesSubtext')}</Text>
          </View>
        ) : (
          <View style={styles.templatesList}>
            {/* Render folders with their templates */}
            {folders.map((folder) => {
              const folderTemplates = folderTemplateMap.get(folder.id) || [];

              return (
                <View
                  key={folder.id}
                  ref={(ref) => {
                    if (ref) folderContainerRefs.current.set(folder.id, ref);
                  }}
                  style={styles.folderContainer}
                >
                  {/* Folder header - collapsible with 3-dot menu */}
                  <View
                    style={[
                      styles.folderHeaderRow,
                      isDragToFolder &&
                        hoveredFolderId === folder.id &&
                        styles.folderHeaderDropTarget,
                    ]}
                  >
                    <Pressable
                      style={({ pressed }) => [styles.folderHeader, pressed && { opacity: 0.7 }]}
                      onPress={() => toggleFolderCollapsed(folder.id)}
                    >
                      <FolderChevronIcon collapsed={folder.isCollapsed} />
                      <Text style={styles.folderName}>{folder.name}</Text>
                    </Pressable>
                    <Pressable
                      style={styles.folderMenuButton}
                      onPress={() => openFolderMenu(folder.id)}
                    >
                      <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
                    </Pressable>
                  </View>

                  {/* Folder templates - hidden when collapsed */}
                  {!folder.isCollapsed && (
                    <View style={styles.folderTemplates}>
                      {folderTemplates.length === 0 ? (
                        <Pressable
                          style={styles.addTemplateBox}
                          onPress={() => {
                            withLock(() => {
                              router.push({
                                pathname: '/create-template',
                                params: { folderId: folder.id },
                              });
                            });
                          }}
                        >
                          <Text style={styles.addTemplateIcon}>+</Text>
                          <Text style={styles.addTemplateText}>{t('workout.addTemplate')}</Text>
                        </Pressable>
                      ) : (
                        folderTemplates.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            onStart={() => handleStartFromTemplate(template.id)}
                            onPress={() => handleTemplatePress(template)}
                            onDragActivate={
                              folders.length > 1
                                ? (t, px, py) => activateDrag(t, folder.id, px, py)
                                : undefined
                            }
                            onDragMove={folders.length > 1 ? handleDragTouchMove : undefined}
                            onDragEnd={folders.length > 1 ? handleDragDrop : undefined}
                            isDragGhost={isDragToFolder && draggedTemplate?.id === template.id}
                          />
                        ))
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Render unfoldered templates */}
            {unfolderedTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onStart={() => handleStartFromTemplate(template.id)}
                onPress={() => handleTemplatePress(template)}
                onDragActivate={
                  folders.length > 1
                    ? (t, px, py) => activateDrag(t, DEFAULT_FOLDER_ID, px, py)
                    : undefined
                }
                onDragMove={folders.length > 1 ? handleDragTouchMove : undefined}
                onDragEnd={folders.length > 1 ? handleDragDrop : undefined}
                isDragGhost={isDragToFolder && draggedTemplate?.id === template.id}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Workout In Progress Modal */}
      <Modal
        visible={showWorkoutInProgressModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.workoutInProgressModal}>
            <Text style={styles.modalTitle}>{t('workout.inProgressTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('workout.inProgressSubtitle')}</Text>

            <Pressable style={styles.resumeButton} onPress={handleResumeWorkout}>
              <Text
                style={styles.resumeButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {t('workout.resumeWorkout')}
              </Text>
            </Pressable>

            <Pressable style={styles.startNewButton} onPress={handleStartNewWorkout}>
              <Text
                style={styles.startNewButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {t('workout.startNewWorkout')}
              </Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={handleCancelModal}>
              <Text
                style={styles.cancelButtonText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {t('common.cancel')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Folder Menu Bottom Sheet */}
      <Modal
        visible={showFolderMenu}
        transparent
        animationType="none"
        onRequestClose={closeFolderMenu}
      >
        <Pressable style={styles.menuModalOverlay} onPress={closeFolderMenu}>
          <Animated.View
            style={[styles.menuModalContent, { transform: [{ translateY: folderMenuSlideAnim }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              {/* Menu Items */}
              <View style={styles.menuContainer}>
                <Pressable style={styles.menuItem} onPress={handleFolderMenuReorderTemplates}>
                  <ReorderIcon />
                  <Text style={styles.menuItemText}>{t('folder.reorderTemplates')}</Text>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={handleFolderMenuAddRoutine}>
                  <AddIcon />
                  <Text style={styles.menuItemText}>{t('folder.addNewTemplate')}</Text>
                </Pressable>

                {/* Only show delete option for non-default folders */}
                {selectedFolderId !== DEFAULT_FOLDER_ID && (
                  <Pressable style={styles.menuItem} onPress={handleFolderMenuDeleteFolder}>
                    <DeleteIcon />
                    <Text style={styles.menuItemTextDelete}>{t('folder.deleteFolder')}</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        visible={showCreateFolderModal}
        transparent
        animationType="fade"
        onRequestClose={closeCreateFolderModal}
      >
        <View style={styles.createFolderModalOverlay}>
          <View style={styles.createFolderModal}>
            <Text style={styles.createFolderTitle}>{t('folder.createFolder')}</Text>
            <TextInput
              style={styles.folderNameInput}
              placeholder={t('folder.folderName')}
              placeholderTextColor={colors.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <View style={styles.createFolderButtons}>
              <Pressable style={styles.createFolderCancelButton} onPress={closeCreateFolderModal}>
                <Text style={styles.createFolderCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.createFolderOkButton} onPress={handleCreateFolder}>
                <Text style={styles.createFolderOkText}>{t('common.ok')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reorder Templates Modal */}
      <Modal
        visible={showReorderModal}
        animationType="slide"
        onRequestClose={() => setShowReorderModal(false)}
      >
        <SafeAreaView style={styles.reorderContainer} edges={['top']}>
          {/* Reorder Header */}
          <View style={styles.reorderHeader}>
            <Text style={styles.reorderTitle}>{t('common.reorder')}</Text>
          </View>
          <View style={styles.divider} />

          {/* Template List */}
          <View
            ref={reorderListRef}
            style={styles.reorderList}
            onLayout={(e) => {
              reorderListTopRef.current = e.nativeEvent.layout.y;
            }}
          >
            {reorderTemplates.map((template, index) => (
              <DraggableTemplateRow
                key={template.id}
                template={template}
                index={index}
                onRemove={() => removeTemplateFromReorder(index)}
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
            <Pressable style={styles.doneButton} onPress={saveTemplateReorder}>
              <Text style={styles.doneButtonText}>{t('common.done')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Reorder Folders Modal */}
      <Modal
        visible={showFolderReorderModal}
        animationType="slide"
        onRequestClose={() => setShowFolderReorderModal(false)}
      >
        <SafeAreaView style={styles.reorderContainer} edges={['top']}>
          {/* Reorder Header */}
          <View style={styles.reorderHeader}>
            <Text style={styles.reorderTitle}>{t('folder.reorderFolders')}</Text>
          </View>
          <View style={styles.divider} />

          {/* Folder List */}
          <View
            ref={folderReorderListRef}
            style={styles.reorderList}
            onLayout={(e) => {
              folderReorderListTopRef.current = e.nativeEvent.layout.y;
            }}
          >
            {reorderFoldersList.map((folder, index) => (
              <DraggableFolderRow
                key={folder.id}
                folder={folder}
                index={index}
                onRemove={() => removeFolderFromReorder(index)}
                isDragging={draggedFolderIndex === index}
                draggedIndex={draggedFolderIndex}
                onDragStart={handleFolderDragStart}
                onDragMove={handleFolderDragMove}
                onDragEnd={handleFolderDragEnd}
              />
            ))}
          </View>

          {/* Done Button */}
          <View style={styles.reorderBottom}>
            <Pressable style={styles.doneButton} onPress={saveFolderReorder}>
              <Text style={styles.doneButtonText}>{t('common.done')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Folder Selection Modal (for New Template) */}
      <Modal
        visible={showFolderSelectionModal}
        transparent
        animationType="none"
        onRequestClose={closeFolderSelectionModal}
      >
        <Pressable style={styles.menuModalOverlay} onPress={closeFolderSelectionModal}>
          <Animated.View
            style={[
              styles.menuModalContent,
              { transform: [{ translateY: folderSelectionSlideAnim }] },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              <Text style={styles.folderSelectionTitle}>{t('folder.selectFolder')}</Text>

              {/* Folder List */}
              <View style={styles.folderSelectionList}>
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
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Floating drag overlay */}
      {isDragToFolder && draggedTemplate && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dragOverlay,
            {
              opacity: dragOpacity,
              transform: [
                { translateX: Animated.subtract(dragX, dragOffsetX) },
                { translateY: Animated.subtract(dragY, dragOffsetY) },
                { scale: dragScale },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.templateCard,
              {
                backgroundColor: draggedTemplate.tagColor + '30',
                width: CARD_CLONE_WIDTH,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 8,
              },
            ]}
          >
            <View style={styles.templateImageContainer}>
              {draggedTemplate.localImage ? (
                <Image source={draggedTemplate.localImage} style={styles.templateImage} />
              ) : draggedTemplate.image?.uri ? (
                <Image source={{ uri: draggedTemplate.image.uri }} style={styles.templateImage} />
              ) : (
                <View style={[styles.templateImage, styles.templateImagePlaceholder]}>
                  <Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />
                </View>
              )}
            </View>
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>{draggedTemplate.name}</Text>
              <Text style={styles.templateMeta}>
                {getTemplateTotalSets(draggedTemplate)} Sets •{' '}
                {formatTemplateDuration(draggedTemplate.estimatedDuration)}
              </Text>
            </View>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
  },
  iconButton: {
    padding: spacing.xs,
  },
  startEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    ...cardStyle,
  },
  plusIcon: {
    fontFamily: fonts.medium,
    fontSize: 20,
    color: colors.text,
    marginRight: spacing.sm,
  },
  startEmptyText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  sectionTitleWithPadding: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    ...cardStyle,
  },
  cardText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  historyList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    ...cardStyle,
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 122, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  historyDetails: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyDate: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyState: {
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
  bottomSpacer: {
    height: 40,
  },

  // Template Card Styles
  templatesList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
  },
  templateImageContainer: {
    marginRight: spacing.md,
  },
  templateImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  templateImagePlaceholder: {
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: 2,
  },
  templateMeta: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  startTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: 4,
  },
  startTemplateIcon: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  startTemplateText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },

  // Workout In Progress Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  workoutInProgressModal: {
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
  resumeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resumeButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
  startNewButton: {
    backgroundColor: colors.card,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  startNewButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.danger,
  },
  cancelButton: {
    backgroundColor: colors.card,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },

  // Template Menu Modal Styles
  menuModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  menuModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  menuContainer: {
    paddingHorizontal: spacing.lg,
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
  menuItemTextDelete: {
    color: colors.danger,
  },

  // Reorder Templates Modal Styles
  reorderContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  reorderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  reorderTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  reorderList: {
    flex: 1,
  },
  reorderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
  },
  reorderImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginHorizontal: spacing.sm,
  },
  reorderTemplateName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  dragHandle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },

  // Section header with folder icon
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  folderButton: {
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 0,
  },

  // Folder styles
  folderContainer: {
    marginBottom: spacing.md,
  },
  folderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flex: 1,
  },
  folderMenuButton: {
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: 0,
  },
  folderName: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  folderTemplates: {
    gap: spacing.sm,
    paddingLeft: spacing.xs,
  },
  emptyFolderText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    paddingVertical: spacing.md,
    paddingLeft: spacing.sm,
  },
  addTemplateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(128, 128, 128, 0.25)',
    borderRadius: 16,
  },
  addTemplateIcon: {
    fontFamily: fonts.medium,
    fontSize: 20,
    color: colors.textSecondary,
    opacity: 0.5,
    marginRight: spacing.sm,
  },
  addTemplateText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    opacity: 0.5,
  },

  // Create folder modal styles
  createFolderModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  createFolderModal: {
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    width: '100%',
    maxWidth: 300,
  },
  createFolderTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  folderNameInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  createFolderButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  createFolderCancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  createFolderCancelText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  createFolderOkButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  createFolderOkText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },

  // Folder selection modal styles
  folderSelectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  folderSelectionList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  folderSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  folderSelectionItemText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  dragOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  folderHeaderDropTarget: {
    backgroundColor: 'rgba(148, 122, 255, 0.12)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed' as const,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
});
