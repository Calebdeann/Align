import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import Constants from 'expo-constants';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  Modal,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fonts } from '@/constants/theme';
import { LIQUID_TAB_BAR_HEIGHT } from '@/components/ui/LiquidGlassTabBar';
import { MONTH_NAMES, DAYS } from '@/utils/calendar';
import {
  useWorkoutStore,
  workoutDaysToWeekdays,
  getScheduledWorkoutDisplayName,
  type ScheduledWorkout,
  type CachedCompletedWorkout,
} from '@/stores/workoutStore';
import { getWorkoutsByDateRange } from '@/services/api/workouts';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { getTemplateImageById } from '@/constants/templateImages';
import { getProgramWorkout } from '@/data/programs';
import { getPlanSquareImage } from '@/data/programs/planImages';
import { ImageSourcePropType } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type PhotoSrc = {
  uri?: string | null;
  templateId?: string | null;
  bgColor?: string | null;
  localSource?: ImageSourcePropType | null;
};

type WorkoutItem =
  | { type: 'scheduled'; workout: ScheduledWorkout; dateKey: string }
  | {
      type: 'completed';
      workout: CachedCompletedWorkout;
      dateKey: string;
      matchedScheduled?: ScheduledWorkout;
      sortPriority?: number;
    };

type GridCell = { day: number; overflow: boolean; year: number; month: number; dateKey: string };

type DaySection = {
  day: number;
  dateKey: string;
  isToday: boolean;
  title: string;
  data: WorkoutItem[];
};

type FlatItem =
  | { kind: 'monthHeader'; label: string; dateKey: string }
  | { kind: 'header'; day: number; dateKey: string; isToday: boolean; title: string }
  | { kind: 'workout'; data: WorkoutItem; workoutIdx: number }
  | { kind: 'empty'; dateKey: string };

// ─── Layout constants ─────────────────────────────────────────────────────────

const HEADER_H = 44;
const ROW_H = 74;
const EMPTY_H = ROW_H;
const MONTH_HEADER_H = 56;
// List view spans today's month ± LIST_MONTHS_RADIUS, giving a stable infinite-scroll feel
// that comfortably covers the full Hourglass program with margin.
const LIST_MONTHS_RADIUS = 6;
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function makeDateKey(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function formatDayHeader(isToday: boolean, dateKey: string) {
  const dt = new Date(dateKey + 'T00:00:00');
  const dayName = DAY_FULL[dt.getDay()];
  const monName = MONTH_NAMES[dt.getMonth()];
  const num = dt.getDate();
  return isToday ? `Today - ${dayName}, ${monName} ${num}` : `${dayName}, ${monName} ${num}`;
}

// Main workouts (Lower, Upper, Full Body) sort before abs/cardio.
function planWorkoutPriority(w: ScheduledWorkout): number {
  return w.tagId === 'abs' || w.tagId === 'cardio' ? 1 : 0;
}

// ─── 6-week calendar grid helper ─────────────────────────────────────────────

function build6WeekGrid(year: number, month: number): GridCell[][] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  let startDow = firstDay.getDay() - 1; // Monday = 0
  if (startDow < 0) startDow = 6;

  const prevY = month === 0 ? year - 1 : year;
  const prevM = month === 0 ? 11 : month - 1;
  const nextY = month === 11 ? year + 1 : year;
  const nextM = month === 11 ? 0 : month + 1;

  const cells: GridCell[] = [];

  // prev month tail
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    cells.push({
      day: d,
      overflow: true,
      year: prevY,
      month: prevM,
      dateKey: makeDateKey(prevY, prevM, d),
    });
  }
  // current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, overflow: false, year, month, dateKey: makeDateKey(year, month, d) });
  }
  // next month head — fill to exactly 42 cells
  let next = 1;
  while (cells.length < 42) {
    cells.push({
      day: next,
      overflow: true,
      year: nextY,
      month: nextM,
      dateKey: makeDateKey(nextY, nextM, next),
    });
    next++;
  }

  return Array.from({ length: 6 }, (_, i) => cells.slice(i * 7, (i + 1) * 7));
}

// ─── Photo helper ─────────────────────────────────────────────────────────────

function PhotoImg({ src, style }: { src: PhotoSrc; style: object }) {
  if (src.uri) {
    return (
      <Image source={{ uri: src.uri }} style={style} contentFit="cover" cachePolicy="memory-disk" />
    );
  }
  if (src.localSource) {
    return (
      <Image source={src.localSource} style={style} contentFit="cover" cachePolicy="memory-disk" />
    );
  }
  if (src.templateId) {
    const s = getTemplateImageById(src.templateId);
    if (s) return <Image source={s} style={style} contentFit="cover" cachePolicy="memory-disk" />;
  }
  if (src.bgColor) {
    return <View style={[style, { backgroundColor: src.bgColor }]} />;
  }
  return null;
}

// ─── Month Picker ─────────────────────────────────────────────────────────────

function MonthPicker({
  visible,
  year,
  month,
  onSelect,
  onClose,
}: {
  visible: boolean;
  year: number;
  month: number;
  onSelect: (y: number, m: number) => void;
  onClose: () => void;
}) {
  const [pickerYear, setPickerYear] = useState(year);

  useEffect(() => {
    if (visible) setPickerYear(year);
  }, [visible, year]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={styles.overlay}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          onClose();
        }}
      >
        <Pressable style={styles.pickerCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.pickerYearRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setPickerYear((y) => y - 1);
              }}
              hitSlop={12}
            >
              <Ionicons name="chevron-back" size={22} color="#000" />
            </Pressable>
            <Text style={styles.pickerYearText}>{pickerYear}</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setPickerYear((y) => y + 1);
              }}
              hitSlop={12}
            >
              <Ionicons name="chevron-forward" size={22} color="#000" />
            </Pressable>
          </View>
          <View style={styles.monthGrid}>
            {MONTH_NAMES.map((name, i) => {
              const selected = pickerYear === year && i === month;
              return (
                <Pressable
                  key={name}
                  style={[styles.monthCell, selected && styles.monthCellSel]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    onSelect(pickerYear, i);
                  }}
                >
                  <Text style={[styles.monthCellText, selected && styles.monthCellTextSel]}>
                    {name.slice(0, 3)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Calendar cell ────────────────────────────────────────────────────────────

function DayCell({
  day,
  overflow,
  isToday,
  photos,
  cellW,
  onPhotoPress,
}: {
  day: number;
  overflow: boolean;
  isToday: boolean;
  photos: PhotoSrc[];
  cellW: number;
  onPhotoPress?: () => void;
}) {
  // The "slot" is the photo area within the cell. Tighter than before so there's
  // real breathing room from the date number above + neighbouring cells.
  // overflow: 'hidden' on the slot hard-clips rotated tiles inside the slot
  // (which is itself inside the already-clipped cell) so they cannot bleed.
  const slotSz = Math.floor(cellW - 4);

  // Tile size scales DOWN as the stack grows so a rotated/offset stack stays
  // within the slot's bounds even when 2 or 3 workouts share a day.
  const stackCount = photos.length;
  const tileSz = (() => {
    if (stackCount <= 1) return Math.floor(slotSz * 0.97);
    if (stackCount === 2) return Math.floor(slotSz * 0.88);
    return Math.floor(slotSz * 0.78);
  })();

  // Tilt + offset per stack index. Index 0 sits on top.
  // Values are tuned so the rotated tile's bounding box never crosses slotSz
  // for the given tileSz, eliminating the "bleeding into neighbour" look.
  const stackTilt = (i: number) => {
    const odd = day % 2 === 0 ? 1 : -1;
    if (stackCount <= 1) return { rotate: `${-2 * odd}deg`, tx: 0, ty: 0 };
    if (stackCount === 2) {
      if (i === 0) return { rotate: `${3 * odd}deg`, tx: 2 * odd, ty: 2 };
      return { rotate: `${-4 * odd}deg`, tx: -2 * odd, ty: -2 };
    }
    if (i === 0) return { rotate: '0deg', tx: 0, ty: 2 };
    if (i === 1) return { rotate: `${5 * odd}deg`, tx: 4 * odd, ty: -2 };
    return { rotate: `${-5 * odd}deg`, tx: -4 * odd, ty: -1 };
  };

  // Centre each tile within the slot, then offset by tilt.tx/ty.
  const baseLeft = (slotSz - tileSz) / 2;
  const baseTop = (slotSz - tileSz) / 2;

  const showPhotoArea = photos.length > 0;

  return (
    <View style={[styles.cell, { width: cellW }]}>
      {/* Date number */}
      <Pressable
        style={[styles.dateCircle, isToday && styles.dateCircleToday]}
        onPress={
          __DEV__ && isToday
            ? () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                router.push('/workout-photo');
              }
            : undefined
        }
      >
        <Text
          style={[
            styles.dateNum,
            overflow && styles.dateNumOverflow,
            isToday && styles.dateNumToday,
          ]}
        >
          {day}
        </Text>
      </Pressable>

      {/* Photo stack — tappable to jump to list view */}
      {showPhotoArea && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onPhotoPress();
          }}
          style={{
            width: slotSz,
            height: slotSz,
            marginTop: 6,
            opacity: overflow ? 0.5 : 1,
            overflow: 'hidden',
            alignSelf: 'center',
          }}
        >
          {/* Render back-to-front so the smaller-index tile sits on top of the larger ones. */}
          {photos
            .slice(0, 3)
            .map((p, i) => ({ p, i, tilt: stackTilt(i) }))
            .sort((a, b) => b.i - a.i)
            .map(({ p, i, tilt }) => (
              <View
                key={i}
                style={[
                  styles.stackItem,
                  {
                    width: tileSz,
                    height: tileSz,
                    left: baseLeft + tilt.tx,
                    top: baseTop + tilt.ty,
                    transform: [{ rotate: tilt.rotate }],
                  },
                ]}
              >
                <PhotoImg src={p} style={styles.stackPhoto} />
              </View>
            ))}
        </Pressable>
      )}
    </View>
  );
}

// ─── Calendar grid ────────────────────────────────────────────────────────────

function CalendarGrid({
  year,
  month,
  dayPhotos,
  onDayPress,
}: {
  year: number;
  month: number;
  dayPhotos: Map<string, PhotoSrc[]>;
  onDayPress: (dateKey: string) => void;
}) {
  const { width } = useWindowDimensions();
  const cellW = Math.floor((width - 20) / 7);
  // build6WeekGrid is pure on (year, month); cache it so render passes that
  // don't change the displayed month don't recompute the 42-cell grid.
  const weeks = useMemo(() => build6WeekGrid(year, month), [year, month]);
  const todayKey = (() => {
    const n = new Date();
    return makeDateKey(n.getFullYear(), n.getMonth(), n.getDate());
  })();

  return (
    <View style={{ paddingHorizontal: 10 }}>
      <View style={styles.dayNamesRow}>
        {DAYS.map((d) => (
          <Text key={d} style={[styles.dayName, { width: cellW }]}>
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi}>
          <View style={styles.divider} />
          <View style={styles.weekRow}>
            {week.map((cell, di) => (
              <DayCell
                key={di}
                day={cell.day}
                overflow={cell.overflow}
                isToday={cell.dateKey === todayKey && !cell.overflow}
                photos={dayPhotos.get(cell.dateKey) ?? []}
                cellW={cellW}
                onPhotoPress={() => onDayPress(cell.dateKey)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── List row ─────────────────────────────────────────────────────────────────

const ListRow = memo(function ListRow({
  item,
  workoutIdx,
}: {
  item: WorkoutItem;
  workoutIdx: number;
}) {
  const { withLock } = useNavigationLock();

  const isSched = item.type === 'scheduled';
  const w = item.workout;

  const schedDone = useWorkoutStore(
    useCallback(
      (s) => {
        if (!isSched) return false;
        return (
          s.scheduledWorkouts
            .find((sw) => sw.id === (w as ScheduledWorkout).id)
            ?.completedDates.includes(item.dateKey) ?? false
        );
      },
      [isSched, w, item.dateKey]
    )
  );

  const done = isSched ? schedDone : true;

  const todayKey = new Date().toISOString().split('T')[0];
  const isMissed = isSched && !done && item.dateKey < todayKey;

  let name = '';
  let photo: PhotoSrc = {};
  let sub: string | null = null;

  if (isSched) {
    const sw = w as ScheduledWorkout;
    name = getScheduledWorkoutDisplayName(sw);
    const localSource = sw.programWorkoutId ? getPlanSquareImage(sw.programWorkoutId) : null;
    photo = {
      uri: sw.image?.uri,
      templateId: sw.image?.templateId,
      localSource,
      bgColor:
        !sw.image?.uri && !sw.image?.templateId && !localSource && sw.planId ? sw.tagColor : null,
    };
    if (sw.programWorkoutId) {
      const pw = getProgramWorkout(sw.programWorkoutId);
      if (pw && pw.exercises.length > 0) {
        const exCount = pw.exercises.length;
        const setCount = pw.exercises.reduce((a, e) => a + e.sets, 0);
        sub = `${exCount}x Exercises • ${setCount} Total Sets`;
      }
    }
  } else {
    const cw = w as CachedCompletedWorkout;
    const matched = (item as Extract<WorkoutItem, { type: 'completed' }>).matchedScheduled;
    name = cw.name ?? matched?.name ?? 'Workout';
    const pwId = cw.programWorkoutId ?? matched?.programWorkoutId ?? null;
    const localSource = pwId ? getPlanSquareImage(pwId) : null;
    photo = {
      uri: cw.imageUri,
      templateId: cw.imageTemplateId,
      localSource: !cw.imageUri && !cw.imageTemplateId ? localSource : null,
    };
    sub = `${cw.exerciseCount}x Exercises • ${cw.totalSets} Total Sets`;
  }

  const onPress = useCallback(() => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (isSched && w) {
        router.push({
          pathname: '/workout-preview',
          params: { workoutId: (w as ScheduledWorkout).id, dateKey: item.dateKey },
        });
      } else if (w) {
        router.push({
          pathname: '/workout-summary',
          params: { workoutId: (w as CachedCompletedWorkout).id, mode: 'view', workoutTitle: name },
        });
      }
    });
  }, [isSched, w, item.dateKey, withLock]);

  return (
    <Pressable
      style={({ pressed }) => [styles.listRow, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      {/* Status indicator — read-only. Icon reflects the workout's current
          state: missed (past + uncompleted), complete, or not-complete. */}
      <View style={styles.checkHit} pointerEvents="none">
        {isMissed ? (
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke="#000000" strokeWidth={1.5} />
            <Path d="M6 6l12 12" stroke="#000000" strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
        ) : (
          <View style={[styles.checkbox, done && styles.checkboxDone]}>
            {done && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
        )}
      </View>
      {/* Thumbnail — grey box when no photo source, alternating tilt */}
      <View
        style={[
          styles.listThumb,
          { transform: [{ rotate: `${workoutIdx % 2 === 0 ? 2 : -2}deg` }] },
        ]}
      >
        <PhotoImg src={photo} style={styles.listThumbImg} />
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listName} numberOfLines={1}>
          {name}
        </Text>
        {sub && <Text style={styles.listSub}>{sub}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={22} color="rgba(0,0,0,0.3)" />
    </Pressable>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const todayRef = useRef(new Date());
  const today = todayRef.current;

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [showPicker, setShowPicker] = useState(false);

  const flatRef = useRef<FlatList<FlatItem>>(null);
  const scrollTargetDateKey = useRef<string | null>(null);

  const userId = useUserProfileStore((s) => s.userId);
  const planId = useUserProfileStore((s) => s.profile?.plan_id);
  const rawWorkoutDays = useUserProfileStore((s) => s.profile?.workout_days);
  const dayAssignments = useUserProfileStore((s) => s.profile?.workout_day_assignments);
  const fetchProfile = useUserProfileStore((s) => s.fetchProfile);
  const seedPlanWorkouts = useWorkoutStore((s) => s.seedPlanWorkouts);
  const getPlanWorkoutSeedStatus = useWorkoutStore((s) => s.getPlanWorkoutSeedStatus);
  const clearStalePlanWorkouts = useWorkoutStore((s) => s.clearStalePlanWorkouts);
  const getWorkoutsForMonth = useWorkoutStore((s) => s.getWorkoutsForMonth);
  const getWorkoutsForDate = useWorkoutStore((s) => s.getWorkoutsForDate);
  const getCached = useWorkoutStore((s) => s.getCachedCompletedWorkoutsForDate);
  const cached = useWorkoutStore((s) => s.cachedCompletedWorkouts);
  const setCache = useWorkoutStore((s) => s.setCachedCompletedWorkouts);
  const syncScheduledFromBackend = useWorkoutStore((s) => s.syncScheduledWorkoutsFromBackend);
  const workoutIds = useWorkoutStore(
    useCallback(
      (s) => s.scheduledWorkouts.map((w) => `${w.id}:${w.completedDates.length}`).join(','),
      []
    )
  );
  const useSuggestedWorkoutPlan = useUserPreferencesStore((s) => s.useSuggestedWorkoutPlan);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Lazy seed plan workouts when user lands on planner with an unseeded plan.
  // Also self-heal any stale scheduled workouts left over from previous plans
  // so a user who's switched plans multiple times doesn't see ghost rows from
  // a plan they no longer use.
  useEffect(() => {
    if (!userId || !planId) return;
    clearStalePlanWorkouts(userId, planId);
    const status = getPlanWorkoutSeedStatus(planId, userId);
    if (!status.seeded) {
      const now = new Date();
      const dk = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const weekdays = workoutDaysToWeekdays(rawWorkoutDays ?? []);
      seedPlanWorkouts(
        planId,
        dk,
        userId,
        weekdays.length > 0 ? weekdays : undefined,
        undefined,
        dayAssignments ?? null
      );
    }
  }, [
    userId,
    planId,
    seedPlanWorkouts,
    getPlanWorkoutSeedStatus,
    clearStalePlanWorkouts,
    dayAssignments,
    rawWorkoutDays,
  ]);

  // Cache per-month fetches for the lifetime of this mount. Tabs stay alive,
  // so once we've fetched a given month, swapping away to Friends and back
  // shouldn't trigger another network round-trip. Local mutations (completing
  // / un-completing workouts) keep the store consistent via its own reducers.
  const fetchedMonthsRef = useRef<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      const key = `${currentYear}-${currentMonth}`;
      if (fetchedMonthsRef.current.has(key)) return;
      fetchedMonthsRef.current.add(key);
      const start = new Date(currentYear, currentMonth, 1);
      const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      getWorkoutsByDateRange(userId, start.toISOString(), end.toISOString())
        .then(setCache)
        .catch(() => {});
    }, [userId, currentYear, currentMonth, setCache])
  );

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setRefreshing(true);
    // Drop the current month from the cache so the next focus re-fetches.
    fetchedMonthsRef.current.delete(`${currentYear}-${currentMonth}`);
    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    // Pull both scheduled-plan rehydration and completed-workouts in parallel.
    // syncScheduledWorkoutsFromBackend catches plan edits made on other devices;
    // the date-range fetch refreshes the completion marks for this month.
    await Promise.all([
      syncScheduledFromBackend(userId).catch(() => {}),
      getWorkoutsByDateRange(userId, start.toISOString(), end.toISOString())
        .then(setCache)
        .catch(() => {}),
    ]);
    fetchedMonthsRef.current.add(`${currentYear}-${currentMonth}`);
    setRefreshing(false);
  }, [userId, currentYear, currentMonth, setCache, syncScheduledFromBackend]);

  const workoutsForMonth = useMemo(
    () =>
      getWorkoutsForMonth(currentYear, currentMonth, userId, {
        includePlanWorkouts: useSuggestedWorkoutPlan,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workoutIds, currentYear, currentMonth, userId, getWorkoutsForMonth, useSuggestedWorkoutPlan]
  );

  const workoutsForPrevMonth = useMemo(() => {
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    return getWorkoutsForMonth(y, m, userId, { includePlanWorkouts: useSuggestedWorkoutPlan });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutIds, currentYear, currentMonth, userId, getWorkoutsForMonth, useSuggestedWorkoutPlan]);

  const workoutsForNextMonth = useMemo(() => {
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    const m = currentMonth === 11 ? 0 : currentMonth + 1;
    return getWorkoutsForMonth(y, m, userId, { includePlanWorkouts: useSuggestedWorkoutPlan });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutIds, currentYear, currentMonth, userId, getWorkoutsForMonth, useSuggestedWorkoutPlan]);

  // Photos keyed by dateKey (YYYY-MM-DD) so overflow cells in the 6-week grid (prev/next month tails)
  // can look up their own previews without colliding with current-month day numbers.
  const dayPhotos = useMemo<Map<string, PhotoSrc[]>>(() => {
    const map = new Map<string, PhotoSrc[]>();
    const addFromMonth = (workouts: Map<number, ScheduledWorkout[]>, y: number, m: number) => {
      workouts.forEach((ws, day) => {
        const dk = makeDateKey(y, m, day);
        const sorted = [...ws].sort((a, b) => planWorkoutPriority(a) - planWorkoutPriority(b));
        const photos = sorted
          .filter((w) => w.image?.uri || w.image?.templateId || w.planId)
          .map((w) => {
            const localSource = w.programWorkoutId ? getPlanSquareImage(w.programWorkoutId) : null;
            return {
              uri: w.image?.uri,
              templateId: w.image?.templateId,
              localSource,
              bgColor:
                !w.image?.uri && !w.image?.templateId && !localSource && w.planId
                  ? w.tagColor
                  : null,
            };
          });
        if (photos.length) map.set(dk, photos);
      });
    };
    const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
    const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
    addFromMonth(workoutsForPrevMonth, prevY, prevM);
    addFromMonth(workoutsForMonth, currentYear, currentMonth);
    addFromMonth(workoutsForNextMonth, nextY, nextM);

    cached
      .filter((w) => w.userId === userId && (w.imageUri || w.imageTemplateId))
      .forEach((w) => {
        const dk = w.completedAt.slice(0, 10);
        const existing = map.get(dk) ?? [];
        const userPhoto: PhotoSrc = { uri: w.imageUri, templateId: w.imageTemplateId };
        // User photo takes the top slot; any remaining plan images sit behind it
        map.set(dk, [userPhoto, ...existing.slice(1)]);
      });

    // Cached entries with no photo — add a placeholder so calendar stays in sync with list
    cached
      .filter((w) => w.userId === userId && !w.imageUri && !w.imageTemplateId)
      .forEach((w) => {
        const dk = w.completedAt.slice(0, 10);
        if (map.has(dk)) return; // plan image or user photo already covers this day
        const localSource = w.programWorkoutId ? getPlanSquareImage(w.programWorkoutId) : null;
        map.set(dk, [localSource ? { localSource } : { bgColor: '#e8e8e8' }]);
      });

    return map;
  }, [
    workoutsForMonth,
    workoutsForPrevMonth,
    workoutsForNextMonth,
    cached,
    currentYear,
    currentMonth,
    userId,
  ]);

  // Infinite-scroll list view: today's month ± LIST_MONTHS_RADIUS months.
  // Building all 13 months up front (~395 days) is cheap; FlatList recycles offscreen rows.
  const listSections = useMemo<DaySection[]>(() => {
    const sections: DaySection[] = [];
    const baseY = today.getFullYear();
    const baseM = today.getMonth();
    for (let offset = -LIST_MONTHS_RADIUS; offset <= LIST_MONTHS_RADIUS; offset++) {
      const d = new Date(baseY, baseM + offset, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dk = makeDateKey(y, m, day);
        const isToday =
          today.getFullYear() === y && today.getMonth() === m && today.getDate() === day;
        const scheduled = getWorkoutsForDate(dk, userId, {
          includePlanWorkouts: useSuggestedWorkoutPlan,
        }).map((w) => ({ type: 'scheduled' as const, workout: w, dateKey: dk }));
        const finishedScheduled = scheduled.filter((s) => s.workout.completedDates.includes(dk));
        const unfinishedScheduled = scheduled.filter((s) => !s.workout.completedDates.includes(dk));
        const cachedForDay = getCached(dk, userId);

        // Split finished scheduled into plan workouts (dedup with cache) and non-plan
        const finishedPlan = finishedScheduled.filter((s) => s.workout.planId);
        const finishedNonPlan = finishedScheduled.filter((s) => !s.workout.planId);

        // Pair each cached entry with the matching finishedPlan entry (FIFO) so the
        // user photo shows via the cached entry while the scheduled entry is hidden.
        const pairedCompleted: WorkoutItem[] = cachedForDay.map((cw, i) => {
          const matched = finishedPlan[i]?.workout;
          return {
            type: 'completed',
            workout: cw,
            dateKey: dk,
            matchedScheduled: matched,
            sortPriority: matched ? planWorkoutPriority(matched) : 0,
          };
        });

        // Any finishedPlan entries not covered by a cached entry (manually ticked)
        const uncoveredFinishedPlan = finishedPlan.slice(cachedForDay.length);

        const allItems: WorkoutItem[] = [
          ...finishedNonPlan,
          ...uncoveredFinishedPlan,
          ...pairedCompleted,
          ...unfinishedScheduled,
        ];
        allItems.sort((a, b) => {
          const pa =
            a.type === 'scheduled'
              ? planWorkoutPriority(a.workout as ScheduledWorkout)
              : ((a as Extract<WorkoutItem, { type: 'completed' }>).sortPriority ?? 0);
          const pb =
            b.type === 'scheduled'
              ? planWorkoutPriority(b.workout as ScheduledWorkout)
              : ((b as Extract<WorkoutItem, { type: 'completed' }>).sortPriority ?? 0);
          return pa - pb;
        });
        sections.push({
          day,
          dateKey: dk,
          isToday,
          title: formatDayHeader(isToday, dk),
          data: allItems,
        });
      }
    }
    return sections;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, workoutIds, cached, today, getWorkoutsForDate, getCached, useSuggestedWorkoutPlan]);

  const flatItems = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = [];
    let workoutIdx = 0;
    let lastMonthKey = '';
    listSections.forEach((s) => {
      const dt = new Date(s.dateKey + 'T00:00:00');
      const monthKey = `${dt.getFullYear()}-${dt.getMonth()}`;
      if (monthKey !== lastMonthKey) {
        const firstOfMonth = makeDateKey(dt.getFullYear(), dt.getMonth(), 1);
        items.push({
          kind: 'monthHeader',
          label: `${MONTH_NAMES[dt.getMonth()]} ${dt.getFullYear()}`,
          dateKey: firstOfMonth,
        });
        lastMonthKey = monthKey;
      }
      items.push({
        kind: 'header',
        day: s.day,
        dateKey: s.dateKey,
        isToday: s.isToday,
        title: s.title,
      });
      if (s.data.length === 0) {
        items.push({ kind: 'empty', dateKey: s.dateKey });
      } else {
        s.data.forEach((d) => items.push({ kind: 'workout', data: d, workoutIdx: workoutIdx++ }));
      }
    });
    return items;
  }, [listSections]);

  const itemLayouts = useMemo(() => {
    let offset = 0;
    return flatItems.map((item, index) => {
      const length =
        item.kind === 'monthHeader'
          ? MONTH_HEADER_H
          : item.kind === 'header'
            ? HEADER_H
            : item.kind === 'empty'
              ? EMPTY_H
              : ROW_H;
      const layout = { length, offset, index };
      offset += length;
      return layout;
    });
  }, [flatItems]);

  useEffect(() => {
    if (viewMode !== 'list') return;
    let idx: number;
    if (scrollTargetDateKey.current) {
      const dk = scrollTargetDateKey.current;
      scrollTargetDateKey.current = null;
      idx = flatItems.findIndex((it) => it.kind === 'header' && it.dateKey === dk);
    } else {
      const isCurMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
      idx = isCurMonth ? flatItems.findIndex((it) => it.kind === 'header' && it.isToday) : 0;
    }
    if (idx >= 0) {
      setTimeout(() => {
        flatRef.current?.scrollToIndex({ index: idx, animated: false, viewOffset: 0 });
      }, 150);
    }
  }, [viewMode, flatItems, currentYear, currentMonth, today]);

  const handleCalendarDayPress = useCallback((dateKey: string) => {
    scrollTargetDateKey.current = dateKey;
    setViewMode('list');
  }, []);

  const renderItem = useCallback(({ item }: { item: FlatItem }) => {
    if (item.kind === 'monthHeader') {
      return (
        <View style={styles.listMonthHeader}>
          <Text style={styles.listMonthHeaderText}>{item.label}</Text>
        </View>
      );
    }
    if (item.kind === 'header') {
      const headerText = (
        <Text style={[styles.listHeaderText, item.isToday && styles.listHeaderTextToday]}>
          {item.title}
        </Text>
      );
      if (__DEV__ && item.isToday) {
        return (
          <Pressable
            style={[styles.listHeader, styles.listHeaderToday]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.push('/workout-photo');
            }}
          >
            {headerText}
          </Pressable>
        );
      }
      return (
        <View style={[styles.listHeader, item.isToday && styles.listHeaderToday]}>
          {headerText}
        </View>
      );
    }
    if (item.kind === 'empty') {
      return (
        <View style={styles.noWorkoutRow}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke="#BBBBBB" strokeWidth={1.5} />
            <Path d="M6 6l12 12" stroke="#BBBBBB" strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
          <Text style={styles.noWorkoutText}>No workouts</Text>
        </View>
      );
    }
    return <ListRow item={item.data} workoutIdx={item.workoutIdx} />;
  }, []);

  const keyExtractor = useCallback((item: FlatItem, idx: number) => {
    if (item.kind === 'monthHeader') return `mh-${item.dateKey}`;
    if (item.kind === 'header') return `h-${item.dateKey}`;
    if (item.kind === 'empty') return `empty-${item.dateKey}`;
    const d = item.data;
    const id =
      d.type === 'scheduled'
        ? (d.workout as ScheduledWorkout).id
        : (d.workout as CachedCompletedWorkout).id;
    return `w-${d.type}-${id}-${idx}`;
  }, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => itemLayouts[index] ?? { length: 0, offset: 0, index },
    [itemLayouts]
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.monthBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setShowPicker(true);
          }}
        >
          <Text style={styles.monthTitle}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#000" />
        </Pressable>
        <View style={styles.headerIcons}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setViewMode((v) => (v === 'calendar' ? 'list' : 'calendar'));
            }}
          >
            <Ionicons
              name={viewMode === 'calendar' ? 'list' : 'calendar-outline'}
              size={20}
              color="#000"
            />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.push('/planner-settings');
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#000" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: LIQUID_TAB_BAR_HEIGHT + 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
          }
        >
          <CalendarGrid
            year={currentYear}
            month={currentMonth}
            dayPhotos={dayPhotos}
            onDayPress={handleCalendarDayPress}
          />
        </ScrollView>
      ) : (
        <FlatList
          ref={flatRef}
          data={flatItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={() => {}}
          contentContainerStyle={{ paddingBottom: LIQUID_TAB_BAR_HEIGHT + 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
          }
        />
      )}

      <MonthPicker
        visible={showPicker}
        year={currentYear}
        month={currentMonth}
        onSelect={(y, m) => {
          setCurrentYear(y);
          setCurrentMonth(m);
          setShowPicker(false);
          // Picking a date always lands on the calendar view at that month,
          // regardless of which view the user was in.
          setViewMode('calendar');
        }}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  monthBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthTitle: { fontFamily: fonts.bold, fontSize: 26, color: '#000', letterSpacing: -0.3 },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // Calendar grid
  dayNamesRow: { flexDirection: 'row', paddingBottom: 4 },
  dayName: { fontFamily: fonts.medium, fontSize: 14, color: '#8f8f8f', textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#D4D4D4' },
  weekRow: { flexDirection: 'row', height: 105 },
  cell: { height: 105, alignItems: 'center', paddingTop: 6, overflow: 'hidden' },
  dateCircle: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleToday: { backgroundColor: '#000' },
  dateNum: { fontFamily: fonts.medium, fontSize: 14, color: '#000' },
  dateNumOverflow: { color: 'rgba(0,0,0,0.35)' },
  dateNumToday: { fontFamily: fonts.bold, color: '#fff' },
  stackItem: { position: 'absolute', borderRadius: 8, overflow: 'hidden' },
  stackPhoto: { width: '100%', height: '100%' },

  // Month picker
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: 300 },
  pickerYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerYearText: { fontFamily: fonts.bold, fontSize: 20, color: '#000' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  monthCell: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  monthCellSel: { backgroundColor: '#000' },
  monthCellText: { fontFamily: fonts.medium, fontSize: 14, color: '#000' },
  monthCellTextSel: { color: '#fff' },

  // List view
  listMonthHeader: {
    height: MONTH_HEADER_H,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  listMonthHeaderText: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#000',
    letterSpacing: -0.2,
  },
  listHeader: {
    height: HEADER_H,
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  listHeaderToday: { backgroundColor: '#303030' },
  listHeaderText: { fontFamily: fonts.medium, fontSize: 14, color: 'rgba(0,0,0,0.5)' },
  listHeaderTextToday: { fontFamily: fonts.bold, color: '#fff' },
  listRow: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    backgroundColor: '#fff',
  },
  checkHit: { alignItems: 'center', justifyContent: 'center' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#000', borderColor: '#000' },
  listThumb: {
    width: 54,
    height: 54,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e8e8e8',
  },
  listThumbImg: { width: 54, height: 54 },
  listInfo: { flex: 1, gap: 3 },
  listName: { fontFamily: fonts.semiBold, fontSize: 17, color: '#000' },
  listSub: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(0,0,0,0.5)' },
  noWorkoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_H,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  noWorkoutText: { fontFamily: fonts.semiBold, fontSize: 17, color: '#BBBBBB' },
});
