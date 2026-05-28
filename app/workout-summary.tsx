import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fonts, colors, fontSize, spacing } from '@/constants/theme';
import i18n from '@/i18n';
import { CircleBackButton, UserAvatar, SkeletonBlock } from '@/components';
import { useWorkoutStore, type ActiveExerciseSet } from '@/stores/workoutStore';

type SetType = 'normal' | 'warmup' | 'failure' | 'dropset';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useTemplateStore } from '@/stores/templateStore';
import {
  saveCompletedWorkout,
  getWorkoutById,
  getWorkoutMuscles,
  getPublicWorkoutDetails,
  deleteWorkout,
  updateWorkoutAudience,
  type DbWorkout,
  type DbWorkoutExercise,
  type DbWorkoutSet,
  type WorkoutMuscleData,
} from '@/services/api/workouts';
import { toKgForStorage, kgToLbs, getWeightUnit } from '@/utils/units';
import { resolveExerciseDisplayName } from '@/stores/exerciseStore';
import { isCardioExerciseId } from '@/constants/cardioOptions';
import { cancelWorkoutInProgressReminder } from '@/services/notifications';
import { endWorkoutLiveActivity } from '@/services/liveActivity';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${mins} minutes`;
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          onClose();
        }}
      >
        <Animated.View style={[pickerStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={pickerStyles.handle} />
            <View style={pickerStyles.header}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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

// ── Sub-components ────────────────────────────────────────────────────────────

function StatRow({
  label,
  value,
  icon,
  showDivider = true,
  chevron = false,
}: {
  label: string;
  value: string;
  icon: string;
  showDivider?: boolean;
  chevron?: boolean;
}) {
  return (
    <>
      <View style={styles.statRow}>
        <View style={styles.statLabelRow}>
          <Ionicons name={icon as any} size={18} color="#000000" style={{ marginRight: 8 }} />
          <Text style={styles.statLabel}>{label}</Text>
        </View>
        <View style={styles.statRight}>
          <Text style={styles.statValue}>{value}</Text>
          {chevron && (
            <Ionicons
              name="chevron-forward"
              size={16}
              color="rgba(0,0,0,0.35)"
              style={{ marginLeft: 2 }}
            />
          )}
        </View>
      </View>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

function MuscleBar({
  name,
  percentage,
  availableWidth,
}: {
  name: string;
  percentage: number;
  availableWidth: number;
}) {
  const filledWidth = Math.round((percentage / 100) * availableWidth);
  return (
    <View style={styles.muscleRow}>
      <Text style={styles.muscleName}>{name}</Text>
      <View style={styles.muscleBarRow}>
        <LinearGradient
          colors={['#000000', '#262626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.muscleBar, { width: filledWidth }]}
        />
        <Text style={styles.musclePercentage}>{percentage}%</Text>
      </View>
    </View>
  );
}

type LiveExercise = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  sets: { number: number; weight: number; reps: number }[];
};

function ExerciseBlock({ exercise, unit }: { exercise: LiveExercise; unit: string }) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setExpanded((prev) => !prev);
  };

  const navigateToDetail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push(`/exercise/${exercise.id}`);
  };

  const thumbnailContent = exercise.thumbnailUrl ? (
    <Image
      source={{ uri: exercise.thumbnailUrl }}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
    />
  ) : (
    <View style={[StyleSheet.absoluteFill, styles.exerciseThumbnailPlaceholder]} />
  );

  return (
    <View style={styles.exerciseBlock}>
      {/* Header: thumbnail + name/chevron */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Thumbnail → exercise detail */}
        <Pressable onPress={navigateToDetail} style={styles.exerciseThumbnail}>
          {thumbnailContent}
        </Pressable>
        <View style={{ width: 12 }} />
        {/* Right area: tapping anywhere expands; name text has its own narrower tap target → detail */}
        <Pressable
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 70 }}
          onPress={toggle}
        >
          <View style={{ flex: 1, justifyContent: 'center' }} pointerEvents="box-none">
            <Text style={styles.exerciseName} numberOfLines={2} onPress={navigateToDetail}>
              {exercise.name}
            </Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={22} color="#000000" />
        </Pressable>
      </View>

      {/* Sets table — sibling of header, spans full card width.
          First column is 82pt wide (thumbnail 70 + gap 12) so WEIGHT & REPS
          aligns directly beneath the exercise name above. */}
      {expanded && (
        <View style={styles.setsContainer}>
          <View style={styles.setHeaderRow}>
            <Text style={[styles.setHeaderCell, styles.setIndexCell]}>SET</Text>
            <Text style={styles.setHeaderCell}>WEIGHT & REPS</Text>
          </View>
          {exercise.sets.map((set) => (
            <View key={set.number} style={styles.setRow}>
              <Text style={[styles.setNumber, styles.setIndexCell]}>{set.number}</Text>
              <Text style={styles.setDetails}>
                {set.weight} {unit} × {set.reps} reps
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function WorkoutSummaryScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    mode?: string;
    workoutId?: string;
    photoUri?: string;
    imageAudience?: string;
    imageAspectRatio?: string;
    durationSeconds?: string;
    totalVolume?: string;
    volumeUnit?: string;
    exerciseCount?: string;
    totalSets?: string;
    workoutTitle?: string;
    userName?: string;
    userAvatarUrl?: string;
    imageUri?: string;
    completedAt?: string;
    ownerUserId?: string;
  }>();

  // Store access
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const discardActiveWorkout = useWorkoutStore((s) => s.discardActiveWorkout);
  const markScheduledWorkoutComplete = useWorkoutStore((s) => s.markScheduledWorkoutComplete);
  const isWorkoutCompleted = useWorkoutStore((s) => s.isWorkoutCompleted);
  const toggleWorkoutCompletion = useWorkoutStore((s) => s.toggleWorkoutCompletion);
  const addCachedCompletedWorkout = useWorkoutStore((s) => s.addCachedCompletedWorkout);
  const removeCachedCompletedWorkout = useWorkoutStore((s) => s.removeCachedCompletedWorkout);
  const getScheduledWorkoutById = useWorkoutStore((s) => s.getScheduledWorkoutById);
  const profile = useUserProfileStore((s) => s.profile);
  const sessionAvatarUri = useUserProfileStore((s) => s.sessionAvatarUri);
  const getTemplateById = useTemplateStore((s) => s.getTemplateById);
  const updateTemplateFromWorkout = useTemplateStore((s) => s.updateTemplateFromWorkout);
  const { getUnitSystem } = useUserPreferencesStore();
  const units = getUnitSystem();

  const isSaveMode = params.mode !== 'view';
  const isDbMode = !!params.workoutId;
  const photoUri = params.photoUri;

  // ── DB view mode: load historical workout from Supabase ───────────────────
  const [dbWorkout, setDbWorkout] = useState<{
    workout: DbWorkout;
    exercises: (DbWorkoutExercise & { sets: DbWorkoutSet[] })[];
  } | null>(null);
  const [dbMuscles, setDbMuscles] = useState<WorkoutMuscleData[]>([]);
  const [dbLoading, setDbLoading] = useState(false);

  useEffect(() => {
    if (!params.workoutId) return;
    setDbLoading(true);
    (async () => {
      const workoutId = params.workoutId!;
      const isOtherUser = !!params.ownerUserId && params.ownerUserId !== profile?.id;

      if (isOtherUser) {
        const pub = await getPublicWorkoutDetails(workoutId);
        if (pub) {
          setDbWorkout({ workout: pub.workout, exercises: pub.exercises });
          setDbMuscles(pub.muscles);
        }
        return;
      }

      const [ownResult, ownMuscles] = await Promise.all([
        getWorkoutById(workoutId),
        getWorkoutMuscles(workoutId),
      ]);
      if (ownResult) {
        setDbWorkout(ownResult);
        setDbMuscles(ownMuscles);
        return;
      }
      // Edge case: owner unknown / RLS-blocked → fall back to public RPC.
      const pub = await getPublicWorkoutDetails(workoutId);
      if (pub) {
        setDbWorkout({ workout: pub.workout, exercises: pub.exercises });
        setDbMuscles(pub.muscles);
      }
    })().finally(() => setDbLoading(false));
  }, [params.workoutId, params.ownerUserId, profile?.id]);
  // Prefer the photo's natural aspect ratio so the photo fills width-to-height
  // without cropping. Fall back to 46% of screen height for legacy workouts that
  // didn't store an aspect ratio (pre-migration-052).
  const paramAspect = params.imageAspectRatio ? parseFloat(params.imageAspectRatio) : undefined;
  const dbAspect = dbWorkout?.workout.image_aspect_ratio
    ? Number(dbWorkout.workout.image_aspect_ratio)
    : undefined;
  const effectiveAspect = paramAspect ?? dbAspect;
  const PHOTO_HEIGHT =
    effectiveAspect && effectiveAspect > 0
      ? Math.round(width * effectiveAspect)
      : Math.round(height * 0.46);

  // Title: empty = show defaultTitle as grey placeholder; typed = black text
  const defaultTitle = params.workoutTitle ?? '';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Compute liveDuration early so we can initialize editDuration from it
  const liveDuration = activeWorkout?.elapsedSeconds ?? parseInt(params.durationSeconds ?? '0', 10);
  const [editDuration, setEditDuration] = useState(liveDuration);
  const [showDurationModal, setShowDurationModal] = useState(false);

  // Public/private audience for the 3-dot menu (own workouts in view mode only).
  const [currentAudience, setCurrentAudience] = useState<'friends' | 'everyone'>('everyone');
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const audience = dbWorkout?.workout.image_audience;
    if (audience === 'friends' || audience === 'everyone') {
      setCurrentAudience(audience);
    }
  }, [dbWorkout?.workout.image_audience]);

  async function handleAudienceChange(next: 'friends' | 'everyone') {
    if (!params.workoutId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setMenuOpen(false);
    if (next === currentAudience) return;
    const prev = currentAudience;
    setCurrentAudience(next); // optimistic
    const ok = await updateWorkoutAudience(params.workoutId, next);
    if (!ok) {
      setCurrentAudience(prev);
      Alert.alert('Could not update', 'Try again in a moment.');
    }
  }

  // The effective title to save — user's typed value or the pre-filled default
  const effectiveTitle = title.trim() || defaultTitle;
  const canSave = effectiveTitle.length > 0;

  // ── Live data from active workout ──────────────────────────────────────────

  const liveExercises = useMemo<LiveExercise[]>(() => {
    if (!activeWorkout) return [];
    return activeWorkout.exercises
      .filter((e) => e.sets.some((s) => s.completed))
      .map((e) => ({
        id: e.exercise.id,
        name: resolveExerciseDisplayName(e.exercise.id, e.exercise.name),
        thumbnailUrl: e.exercise.thumbnailUrl ?? null,
        sets: e.sets
          .filter((s) => s.completed)
          .map((s, i) => ({
            number: i + 1,
            weight: parseFloat(s.kg) || 0,
            reps: parseInt(s.reps, 10) || 0,
          })),
      }));
  }, [activeWorkout]);

  const muscleSplit = useMemo(() => {
    if (!activeWorkout) return [];
    const map = new Map<string, number>();
    for (const we of activeWorkout.exercises) {
      const count = we.sets.filter((s) => s.completed).length;
      if (count === 0) continue;
      const m = (we.exercise.muscle || 'Other').toLowerCase();
      map.set(m, (map.get(m) ?? 0) + count);
    }
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return Array.from(map.entries())
      .map(([name, sets]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        percentage: Math.round((sets / total) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [activeWorkout]);

  // DB mode: map fetched exercises into LiveExercise[]
  const dbLiveExercises = useMemo<LiveExercise[]>(() => {
    if (!dbWorkout) return [];
    return dbWorkout.exercises.map((ex) => ({
      id: ex.exercise_id,
      name: resolveExerciseDisplayName(ex.exercise_id, ex.exercise_name),
      thumbnailUrl: ex.thumbnail_url ?? null,
      sets: ex.sets.map((s, i) => ({
        number: i + 1,
        weight: s.weight ?? 0,
        reps: s.reps ?? 0,
      })),
    }));
  }, [dbWorkout]);

  // DB mode: map fetched muscles into muscleSplit format
  const dbMuscleSplit = useMemo(() => {
    const primaryMuscles = dbMuscles.filter((m) => m.activation === 'primary');
    if (!primaryMuscles.length) return [];
    const total = primaryMuscles.reduce((a, m) => a + m.totalSets, 0);
    if (total === 0) return [];
    return primaryMuscles
      .map((m) => ({
        name: m.muscle.charAt(0).toUpperCase() + m.muscle.slice(1),
        percentage: Math.round((m.totalSets / total) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [dbMuscles]);

  // Derived stats — live from store, fallback to params
  const liveExerciseCount = liveExercises.length || parseInt(params.exerciseCount ?? '0', 10);
  const liveTotalSets =
    liveExercises.reduce((acc, e) => acc + e.sets.length, 0) ||
    parseInt(params.totalSets ?? '0', 10);
  const liveVolumeKg =
    activeWorkout?.exercises.reduce((total, we) => {
      return (
        total +
        we.sets
          .filter((s) => s.completed)
          .reduce((acc, set) => {
            const wDisplay = parseFloat(set.kg) || 0;
            const r = parseInt(set.reps, 10) || 0;
            return acc + toKgForStorage(wDisplay, units) * r;
          }, 0)
      );
    }, 0) ?? parseFloat(params.totalVolume ?? '0');
  const volumeUnit = units === 'imperial' ? 'lbs' : 'kg';

  const isOtherUserWorkout = !!params.ownerUserId && params.ownerUserId !== profile?.id;
  const userName = isOtherUserWorkout
    ? (params.userName ?? '')
    : (profile?.name ?? params.userName ?? '');
  const userAvatarUrl = isOtherUserWorkout
    ? params.userAvatarUrl
    : (sessionAvatarUri ?? profile?.avatar_url ?? params.userAvatarUrl);

  const workoutDate = (() => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const time = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${date} · ${time}`;
  })();

  // ── Display values: DB mode vs live mode ──────────────────────────────────
  const displayExercises = isDbMode ? dbLiveExercises : liveExercises;
  const displayMuscleSplit = isDbMode ? dbMuscleSplit : muscleSplit;
  const displayTitle = isDbMode
    ? (dbWorkout?.workout.name ?? params.workoutTitle ?? 'Workout')
    : title || defaultTitle || 'Untitled Workout';
  const displayDate = (() => {
    const iso = isDbMode ? (dbWorkout?.workout.completed_at ?? params.completedAt ?? null) : null;
    if (iso) {
      const d = new Date(iso);
      const date = d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      const time = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      return `${date} · ${time}`;
    }
    // In DB mode, withhold the date until the saved workout loads — falling
    // back to the current time briefly flashes today's date on a past workout.
    return isDbMode ? '' : workoutDate;
  })();
  const displayDuration = isDbMode ? (dbWorkout?.workout.duration_seconds ?? 0) : editDuration;
  const displayPhotoUri = isDbMode
    ? params.imageUri && params.imageUri.length > 0
      ? params.imageUri
      : (dbWorkout?.workout.image_uri ?? null)
    : photoUri;
  const dbVolumeKg = isDbMode
    ? dbLiveExercises.reduce(
        (total, ex) => total + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
        0
      )
    : liveVolumeKg;
  const displayVolumeKg = isDbMode ? dbVolumeKg : liveVolumeKg;
  const displayVolume =
    units === 'imperial' ? Math.round(kgToLbs(displayVolumeKg)) : Math.round(displayVolumeKg);
  const displayTotalSets = isDbMode
    ? dbLiveExercises.reduce((a, ex) => a + ex.sets.length, 0)
    : liveTotalSets;
  const displayExerciseCount = isDbMode ? dbLiveExercises.length : liveExerciseCount;

  // Leave 52px for the percentage label ("100%" + margin)
  const barAvailableWidth = width - 40 - 52;

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!canSave || isSaving || !activeWorkout) return;
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const exercisesWithSets = activeWorkout.exercises.filter((e) =>
        e.sets.some((s) => s.completed)
      );
      const now = new Date();
      const todayKey = now.toISOString().split('T')[0];

      const saveInput = {
        userId: activeWorkout.userId!,
        name: effectiveTitle,
        notes: description.trim() || undefined,
        startedAt: new Date(activeWorkout.startedAt),
        completedAt: now,
        durationSeconds: editDuration,
        sourceTemplateId: activeWorkout.sourceTemplateId,
        imageType: photoUri ? ('camera' as const) : undefined,
        imageUri: photoUri || undefined,
        imageAudience: (params.imageAudience as 'friends' | 'everyone') || 'everyone',
        imageAspectRatio: params.imageAspectRatio
          ? parseFloat(params.imageAspectRatio) || undefined
          : undefined,
        titleCustomized: title.trim().length > 0,
        exercises: exercisesWithSets.map((we) => {
          const isCardio = isCardioExerciseId(we.exercise.id);
          return {
            exerciseId: we.exercise.id,
            exerciseName: resolveExerciseDisplayName(we.exercise.id, we.exercise.name),
            exerciseMuscle: we.exercise.muscle,
            notes: we.notes,
            supersetId: we.supersetId ?? null,
            restTimerSeconds: we.restTimerSeconds ?? 90,
            sets: we.sets
              .filter((s) => s.completed)
              .map((s, i) => ({
                setNumber: i + 1,
                // Cardio sets store null for weight/reps and populate
                // difficulty + durationSeconds instead. Non-cardio sets do
                // the opposite. Both pairs are nullable in the schema and DB.
                weightKg: isCardio ? null : s.kg ? toKgForStorage(parseFloat(s.kg), units) : null,
                reps: isCardio ? null : s.reps ? parseInt(s.reps, 10) : null,
                difficulty: isCardio && s.difficulty ? parseFloat(s.difficulty) : null,
                durationSeconds:
                  isCardio && s.durationMinutes
                    ? Math.round(parseFloat(s.durationMinutes) * 60)
                    : null,
                setType: (s.setType ?? 'normal') as SetType,
                completed: true,
                rpe: s.rpe ?? null,
              })),
          };
        }),
      };

      const result = await saveCompletedWorkout(saveInput);

      if ('workoutId' in result) {
        if (result.partialWarning) {
          Alert.alert('Partial Save', result.partialWarning);
        }
        cancelWorkoutInProgressReminder();
        endWorkoutLiveActivity();
        if (activeWorkout.sourceTemplateId) {
          const template = getTemplateById(activeWorkout.sourceTemplateId);
          if (template)
            updateTemplateFromWorkout(activeWorkout.sourceTemplateId, template.exercises);
        }
        const scheduledWorkout = activeWorkout.scheduledWorkoutId
          ? getScheduledWorkoutById(activeWorkout.scheduledWorkoutId)
          : undefined;
        addCachedCompletedWorkout({
          id: result.workoutId,
          userId: activeWorkout.userId!,
          name: effectiveTitle,
          completedAt: now.toISOString(),
          durationSeconds: editDuration,
          exerciseCount: exercisesWithSets.length,
          totalSets: exercisesWithSets.reduce(
            (a, e) => a + e.sets.filter((s) => s.completed).length,
            0
          ),
          imageType: photoUri ? 'camera' : null,
          imageUri: photoUri || null,
          imageAspectRatio: paramAspect ?? null,
          imageTemplateId: null,
          programWorkoutId: scheduledWorkout?.programWorkoutId ?? null,
          planId: scheduledWorkout?.planId ?? null,
        });
        discardActiveWorkout();
        if (activeWorkout.scheduledWorkoutId) {
          if (!isWorkoutCompleted(activeWorkout.scheduledWorkoutId, todayKey)) {
            toggleWorkoutCompletion(activeWorkout.scheduledWorkoutId, todayKey);
          }
        } else {
          markScheduledWorkoutComplete(
            todayKey,
            activeWorkout.userId!,
            activeWorkout.sourceTemplateId,
            effectiveTitle || activeWorkout.templateName
          );
        }
        router.dismissAll();
        router.replace('/(tabs)');
      } else {
        Alert.alert('Save Failed', result.error ?? 'Could not save workout.');
        setIsSaving(false);
      }
    } catch {
      Alert.alert('Save Failed', 'Could not save workout. Please try again.');
      setIsSaving(false);
    }
  }

  function handleDiscard() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Discard Workout', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
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
  }

  async function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Workout',
      'This will permanently delete this workout. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const id = params.workoutId;
            if (!id) return;
            const ok = await deleteWorkout(id, profile?.id);
            if (ok) {
              removeCachedCompletedWorkout(id);
              router.back();
            }
          },
        },
      ]
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Fixed photo — sits behind the scroll view, never moves. The card slides up over it. */}
      <View style={[styles.photoContainer, { height: PHOTO_HEIGHT }]}>
        {displayPhotoUri ? (
          <Image
            source={{ uri: displayPhotoUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.photoPlaceholder]} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Transparent spacer — lets the fixed photo show through at scrollY=0 */}
        <View style={{ height: PHOTO_HEIGHT }} pointerEvents="none" />

        {/* White card — overlaps photo by 24px */}
        <View style={styles.card}>
          {/* Drag pill */}
          <View style={styles.dragPill} />

          {/* User row */}
          <View style={styles.userRow}>
            <Pressable
              style={styles.userTap}
              onPress={() => {
                const targetUserId = isOtherUserWorkout ? params.ownerUserId : profile?.id;
                if (!targetUserId) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                router.push({ pathname: '/profile/[userId]', params: { userId: targetUserId } });
              }}
              hitSlop={6}
            >
              <View style={styles.avatarWrap}>
                <UserAvatar
                  uri={userAvatarUrl ?? null}
                  size={44}
                  version={isOtherUserWorkout ? undefined : profile?.updated_at}
                />
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userName}</Text>
                <Text style={styles.workoutDate}>{displayDate}</Text>
              </View>
            </Pressable>

            {isSaveMode && (
              <Pressable onPress={handleSave} hitSlop={8} disabled={isSaving}>
                <LinearGradient
                  colors={canSave ? ['#2a2a2a', '#000000'] : ['#f3f4f4', '#efefef']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButton}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={canSave ? '#fff' : '#aaa'} />
                  ) : (
                    <Text
                      style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}
                    >
                      Save
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            )}
          </View>

          {/* Title */}
          {isSaveMode ? (
            <TextInput
              autoCorrect={false}
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder={defaultTitle || 'Title...'}
              placeholderTextColor="rgba(0,0,0,0.35)"
              returnKeyType="done"
              maxLength={60}
            />
          ) : (
            <Text style={styles.titleText}>{displayTitle}</Text>
          )}

          {/* Description */}
          {isSaveMode ? (
            <TextInput
              autoCorrect={false}
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor="rgba(0,0,0,0.35)"
              multiline
              maxLength={200}
            />
          ) : description ? (
            <Text style={styles.descriptionText}>{description}</Text>
          ) : null}

          {/* ── Summary ── */}
          <Text style={styles.sectionHeading}>Summary</Text>

          {isSaveMode ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setShowDurationModal(true);
              }}
            >
              <StatRow
                icon="timer-outline"
                label="Duration"
                value={formatDuration(editDuration)}
                chevron
              />
            </Pressable>
          ) : (
            <StatRow
              icon="timer-outline"
              label="Duration"
              value={formatDuration(displayDuration)}
            />
          )}
          <StatRow
            icon="barbell-outline"
            label="Volume"
            value={`${displayVolume.toLocaleString()} ${volumeUnit}`}
          />
          <StatRow icon="layers-outline" label="Sets" value={String(displayTotalSets)} />
          <StatRow
            icon="body-outline"
            label="Exercises"
            value={String(displayExerciseCount)}
            showDivider={false}
          />

          {/* ── Muscle Split ── */}
          {displayMuscleSplit.length > 0 && (
            <>
              <Text style={[styles.sectionHeading, { marginTop: 28 }]}>Muscle Split</Text>
              {displayMuscleSplit.map((m) => (
                <MuscleBar
                  key={m.name}
                  name={m.name}
                  percentage={m.percentage}
                  availableWidth={barAvailableWidth}
                />
              ))}
            </>
          )}

          {/* ── Exercises ── */}
          {displayExercises.length > 0 ? (
            <>
              <Text style={[styles.sectionHeading, { marginTop: 28 }]}>Exercises</Text>
              {displayExercises.map((ex) => (
                <ExerciseBlock key={ex.id} exercise={ex} unit={volumeUnit} />
              ))}
            </>
          ) : dbLoading ? (
            <>
              <Text style={[styles.sectionHeading, { marginTop: 28 }]}>Exercises</Text>
              <View style={{ gap: 10, marginTop: 16 }}>
                {[0, 1, 2, 3].map((i) => (
                  <SkeletonBlock key={i} style={{ height: 52, borderRadius: 12 }} />
                ))}
              </View>
            </>
          ) : null}

          {/* Discard (save mode only) */}
          {isSaveMode && (
            <Pressable style={styles.discardButton} onPress={handleDiscard}>
              <Text style={styles.discardText}>Discard Workout</Text>
            </Pressable>
          )}

          {/* Delete (view mode, own workouts only) */}
          {!isSaveMode && isDbMode && !isOtherUserWorkout && (
            <Pressable style={styles.discardButton} onPress={handleDelete}>
              <Text style={styles.discardText}>Delete Workout</Text>
            </Pressable>
          )}

          <View style={{ height: 48 }} />
        </View>
      </ScrollView>

      {/* Back button — fixed over photo */}
      <CircleBackButton
        style={{ position: 'absolute', top: insets.top + 10, left: 16, zIndex: 10 }}
      />

      {/* Lock badge — own private workouts show a small dark badge on the hero photo */}
      {!isSaveMode && isDbMode && !isOtherUserWorkout && currentAudience !== 'everyone' && (
        <View style={[styles.lockBadge, { top: insets.top + 17, right: 72 }]} pointerEvents="none">
          <Ionicons name="lock-closed" size={16} color="#fff" />
        </View>
      )}

      {/* Audience menu button — own workouts in view mode only.
          Icon reflects the current audience: globe = public, lock = private.
          Same tap behaviour as before (opens the Public/Private dropdown). */}
      {!isSaveMode && isDbMode && !isOtherUserWorkout && (
        <Pressable
          style={[styles.menuButton, { top: insets.top + 10 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setMenuOpen((v) => !v);
          }}
          hitSlop={8}
        >
          <Ionicons
            name={currentAudience === 'everyone' ? 'earth-outline' : 'lock-closed-outline'}
            size={22}
            color="#000"
          />
        </Pressable>
      )}

      {/* Audience dropdown */}
      {menuOpen && (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setMenuOpen(false);
            }}
          />
          <View style={[styles.menu, { top: insets.top + 62, right: 16 }]}>
            <Pressable style={styles.menuRow} onPress={() => handleAudienceChange('everyone')}>
              <Ionicons name="earth-outline" size={18} color="#000" />
              <Text style={styles.menuRowText}>Public</Text>
              {currentAudience === 'everyone' && (
                <Ionicons name="checkmark" size={18} color="#000" />
              )}
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuRow} onPress={() => handleAudienceChange('friends')}>
              <Ionicons name="lock-closed-outline" size={18} color="#000" />
              <Text style={styles.menuRowText}>Private</Text>
              {currentAudience === 'friends' && (
                <Ionicons name="checkmark" size={18} color="#000" />
              )}
            </Pressable>
          </View>
        </>
      )}

      <DurationPickerModal
        visible={showDurationModal}
        durationSeconds={editDuration}
        onSave={(seconds) => {
          setEditDuration(seconds);
          setShowDurationModal(false);
        }}
        onClose={() => setShowDurationModal(false)}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Photo — pinned to the top behind the ScrollView so the white card can slide over it.
  photoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  photoPlaceholder: {
    backgroundColor: '#2a2a2a',
  },

  // White card
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 600,
    // Subtle upward shadow so the card edge stays visible against a pure-white photo.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  dragPill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },

  // User row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Top-right 3-dot menu button — mirrors CircleBackButton's look
  menuButton: {
    position: 'absolute',
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  // Dark circular lock badge shown on hero photo when workout is private
  lockBadge: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9,
  },
  // Audience dropdown panel
  menu: {
    position: 'absolute',
    width: 168,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    zIndex: 11,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  menuRowText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#000',
    letterSpacing: -0.2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: 12,
  },
  avatarWrap: {
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    backgroundColor: '#D0D0D0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#000000',
    letterSpacing: -0.3,
  },
  workoutDate: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 1,
  },

  // Save button
  saveButton: {
    width: 90,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  saveButtonTextDisabled: {
    color: '#aaaaaa',
  },

  // Title
  titleInput: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 38,
    color: '#000000',
    marginTop: 4,
    marginBottom: 6,
    padding: 0,
  },
  titleText: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 38,
    color: '#000000',
    marginTop: 4,
    marginBottom: 6,
  },

  // Description
  descriptionInput: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: 'rgba(0,0,0,0.75)',
    marginBottom: 20,
    padding: 0,
    letterSpacing: -0.2,
  },
  descriptionText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: 'rgba(0,0,0,0.75)',
    marginBottom: 20,
    letterSpacing: -0.2,
  },

  // Section headings
  sectionHeading: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#000000',
    letterSpacing: -0.4,
    marginBottom: 8,
    marginTop: 4,
  },

  // Stat rows
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#000000',
    letterSpacing: -0.2,
  },
  statValue: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: -0.2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(212,212,212,0.5)',
  },

  // Muscle split
  muscleRow: {
    marginBottom: 14,
  },
  muscleName: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#000000',
    letterSpacing: -0.2,
    marginBottom: 5,
  },
  muscleBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleBar: {
    height: 14,
    borderRadius: 7,
  },
  musclePercentage: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#000000',
    marginLeft: 8,
    letterSpacing: -0.2,
  },

  // Exercises
  exerciseBlock: {
    marginBottom: 28,
  },
  exerciseThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 4,
  },
  exerciseThumbnailPlaceholder: {
    backgroundColor: '#E0E0E0',
  },
  exerciseName: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#000000',
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  setsContainer: {
    marginTop: 14,
  },
  setIndexCell: {
    width: 82,
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  setHeaderCell: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: 0.2,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  setNumber: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: '#000000',
    letterSpacing: -0.2,
  },
  setDetails: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: '#000000',
    letterSpacing: -0.2,
    flex: 1,
  },

  // Discard
  discardButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  discardText: {
    fontFamily: fonts.regular,
    fontSize: 17,
    color: '#fb5057',
    letterSpacing: -0.2,
  },
});
