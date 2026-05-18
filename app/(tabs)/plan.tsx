import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fonts } from '@/constants/theme';
import { LIQUID_TAB_BAR_HEIGHT } from '@/components/ui/LiquidGlassTabBar';
import { MONTH_NAMES, DAYS } from '@/utils/calendar';
import {
  useWorkoutStore,
  type ScheduledWorkout,
  type CachedCompletedWorkout,
} from '@/stores/workoutStore';
import { getWorkoutsByDateRange } from '@/services/api/workouts';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { getTemplateImageById } from '@/constants/templateImages';

// ─── Types ────────────────────────────────────────────────────────────────────

type PhotoSrc = { uri?: string | null; templateId?: string | null };

type WorkoutItem =
  | { type: 'scheduled'; workout: ScheduledWorkout; dateKey: string }
  | { type: 'completed'; workout: CachedCompletedWorkout; dateKey: string }
  | {
      type: 'placeholder';
      id: string;
      name: string;
      exerciseCount: number;
      totalSets: number;
      dateKey: string;
    };

type GridCell = { day: number; overflow: boolean };

type DaySection = {
  day: number;
  dateKey: string;
  isToday: boolean;
  title: string;
  data: WorkoutItem[];
};

type FlatItem =
  | { kind: 'header'; day: number; dateKey: string; isToday: boolean; title: string }
  | { kind: 'workout'; data: WorkoutItem; workoutIdx: number }
  | { kind: 'empty'; dateKey: string };

// ─── Layout constants ─────────────────────────────────────────────────────────

const HEADER_H = 44;
const ROW_H = 74;
const EMPTY_H = ROW_H;
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Placeholder workout data ─────────────────────────────────────────────────

const _TODAY = new Date();

const PLACEHOLDER_WORKOUTS = [
  { id: 'ph-1', name: 'All Rounder Session', dayOffset: 0, exerciseCount: 8, totalSets: 24 },
  { id: 'ph-2', name: 'Hour Glass Class', dayOffset: 0, exerciseCount: 6, totalSets: 18 },
  { id: 'ph-3', name: 'Glutes Destroyer', dayOffset: 1, exerciseCount: 10, totalSets: 30 },
  { id: 'ph-4', name: 'Mat Recovery Session', dayOffset: 3, exerciseCount: 4, totalSets: 12 },
];

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

// ─── 6-week calendar grid helper ─────────────────────────────────────────────

function build6WeekGrid(year: number, month: number): GridCell[][] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  let startDow = firstDay.getDay() - 1; // Monday = 0
  if (startDow < 0) startDow = 6;

  const cells: GridCell[] = [];

  // prev month tail
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, overflow: true });
  }
  // current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, overflow: false });
  }
  // next month head — fill to exactly 42 cells
  let next = 1;
  while (cells.length < 42) cells.push({ day: next++, overflow: true });

  return Array.from({ length: 6 }, (_, i) => cells.slice(i * 7, (i + 1) * 7));
}

// ─── Photo helper ─────────────────────────────────────────────────────────────

function PhotoImg({ src, style }: { src: PhotoSrc; style: object }) {
  if (src.uri) {
    return (
      <Image source={{ uri: src.uri }} style={style} contentFit="cover" cachePolicy="memory-disk" />
    );
  }
  if (src.templateId) {
    const s = getTemplateImageById(src.templateId);
    if (s) return <Image source={s} style={style} contentFit="cover" cachePolicy="memory-disk" />;
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
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.pickerCard} onPress={() => {}}>
          <View style={styles.pickerYearRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPickerYear((y) => y - 1);
              }}
              hitSlop={12}
            >
              <Ionicons name="chevron-back" size={22} color="#000" />
            </Pressable>
            <Text style={styles.pickerYearText}>{pickerYear}</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
  hasPlaceholder,
  cellW,
  onPhotoPress,
}: {
  day: number;
  overflow: boolean;
  isToday: boolean;
  photos: PhotoSrc[];
  hasPlaceholder: boolean;
  cellW: number;
  onPhotoPress?: () => void;
}) {
  const photoSz = Math.floor(cellW - 12);
  const showPhotoArea = !overflow && (photos.length > 0 || hasPlaceholder);

  return (
    <View style={[styles.cell, { width: cellW }]}>
      {/* Date number */}
      <View style={[styles.dateCircle, isToday && styles.dateCircleToday]}>
        <Text
          style={[
            styles.dateNum,
            overflow && styles.dateNumOverflow,
            isToday && styles.dateNumToday,
          ]}
        >
          {day}
        </Text>
      </View>

      {/* Photo stack or grey placeholder — tappable to jump to list view */}
      {showPhotoArea && (
        <Pressable onPress={onPhotoPress} style={{ width: photoSz, height: photoSz, marginTop: 6 }}>
          {photos.length > 0 ? (
            photos.slice(0, 3).map((p, i) => (
              <View
                key={i}
                style={[
                  styles.stackItem,
                  {
                    width: photoSz,
                    height: photoSz,
                    transform: [{ rotate: `${i % 2 === 0 ? -3 : 3}deg` }],
                  },
                ]}
              >
                <PhotoImg src={p} style={styles.stackPhoto} />
              </View>
            ))
          ) : (
            // Grey placeholder box — alternate tilt per day so they don't all lean the same way
            <View
              style={[
                styles.stackItem,
                {
                  width: photoSz,
                  height: photoSz,
                  backgroundColor: '#e8e8e8',
                  transform: [{ rotate: `${day % 2 === 0 ? 2 : -2}deg` }],
                },
              ]}
            />
          )}
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
  dayHasPlaceholder,
  onDayPress,
}: {
  year: number;
  month: number;
  dayPhotos: Map<number, PhotoSrc[]>;
  dayHasPlaceholder: Set<number>;
  onDayPress: (dateKey: string) => void;
}) {
  const { width } = useWindowDimensions();
  const cellW = Math.floor((width - 20) / 7);
  const weeks = build6WeekGrid(year, month);
  const now = new Date();
  const isNow = now.getFullYear() === year && now.getMonth() === month;
  const todayD = now.getDate();

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
                isToday={!!(isNow && !cell.overflow && cell.day === todayD)}
                photos={!cell.overflow ? (dayPhotos.get(cell.day) ?? []) : []}
                hasPlaceholder={!cell.overflow && dayHasPlaceholder.has(cell.day)}
                cellW={cellW}
                onPhotoPress={
                  !cell.overflow ? () => onDayPress(makeDateKey(year, month, cell.day)) : undefined
                }
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
  const toggle = useWorkoutStore((s) => s.toggleWorkoutCompletion);

  const isSched = item.type === 'scheduled';
  const isPlaceholder = item.type === 'placeholder';
  const w = item.type !== 'placeholder' ? item.workout : null;

  const schedDone = useWorkoutStore(
    useCallback(
      (s) => {
        if (!isSched || !w) return false;
        return (
          s.scheduledWorkouts
            .find((sw) => sw.id === (w as ScheduledWorkout).id)
            ?.completedDates.includes(item.dateKey) ?? false
        );
      },
      [isSched, w, item.dateKey]
    )
  );

  const done = isSched ? schedDone : !isPlaceholder;

  let name = '';
  let photo: PhotoSrc = {};
  let sub: string | null = null;

  if (isPlaceholder) {
    const p = item as Extract<WorkoutItem, { type: 'placeholder' }>;
    name = p.name;
    photo = {};
    sub = `${p.exerciseCount}x Exercises • ${p.totalSets} Total Sets`;
  } else if (isSched) {
    name = (w as ScheduledWorkout).name;
    photo = {
      uri: (w as ScheduledWorkout).image?.uri,
      templateId: (w as ScheduledWorkout).image?.templateId,
    };
  } else {
    const cw = w as CachedCompletedWorkout;
    name = cw.name ?? 'Workout';
    photo = { uri: cw.imageUri, templateId: cw.imageTemplateId };
    sub = `${cw.exerciseCount}x Exercises • ${cw.totalSets} Total Sets`;
  }

  const onCheck = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSched && w) toggle((w as ScheduledWorkout).id, item.dateKey);
  }, [isSched, w, item.dateKey, toggle]);

  const onPress = useCallback(() => {
    if (isPlaceholder) return;
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (isSched && w) {
        router.push({
          pathname: '/workout-preview',
          params: { workoutId: (w as ScheduledWorkout).id, dateKey: item.dateKey },
        });
      } else if (w) {
        router.push({
          pathname: '/workout-details',
          params: { workoutId: (w as CachedCompletedWorkout).id },
        });
      }
    });
  }, [isPlaceholder, isSched, w, item.dateKey, withLock]);

  return (
    <Pressable
      style={({ pressed }) => [styles.listRow, pressed && !isPlaceholder && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <Pressable onPress={onCheck} hitSlop={8} style={styles.checkHit}>
        <View style={[styles.checkbox, done && styles.checkboxDone]}>
          {done && <Ionicons name="checkmark" size={13} color="#fff" />}
        </View>
      </Pressable>
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
  const fetchProfile = useUserProfileStore((s) => s.fetchProfile);
  const getWorkoutsForMonth = useWorkoutStore((s) => s.getWorkoutsForMonth);
  const getWorkoutsForDate = useWorkoutStore((s) => s.getWorkoutsForDate);
  const getCached = useWorkoutStore((s) => s.getCachedCompletedWorkoutsForDate);
  const cached = useWorkoutStore((s) => s.cachedCompletedWorkouts);
  const setCache = useWorkoutStore((s) => s.setCachedCompletedWorkouts);
  const workoutIds = useWorkoutStore(
    useCallback((s) => s.scheduledWorkouts.map((w) => w.id).join(','), [])
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!userId) return;
    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    getWorkoutsByDateRange(userId, start.toISOString(), end.toISOString())
      .then(setCache)
      .catch(() => {});
  }, [userId, currentYear, currentMonth, setCache]);

  // Resolve placeholder workout dateKeys once (relative to today)
  const placeholdersByDateKey = useMemo(() => {
    const isCurMonth = _TODAY.getFullYear() === currentYear && _TODAY.getMonth() === currentMonth;
    if (!isCurMonth) return new Map<string, typeof PLACEHOLDER_WORKOUTS>();

    const map = new Map<string, typeof PLACEHOLDER_WORKOUTS>();
    PLACEHOLDER_WORKOUTS.forEach((pw) => {
      const d = new Date(_TODAY);
      d.setDate(d.getDate() + pw.dayOffset);
      if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return;
      const dk = makeDateKey(d.getFullYear(), d.getMonth(), d.getDate());
      const existing = map.get(dk) ?? [];
      map.set(dk, [...existing, pw]);
    });
    return map;
  }, [currentYear, currentMonth]);

  const workoutsForMonth = useMemo(
    () => getWorkoutsForMonth(currentYear, currentMonth, userId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workoutIds, currentYear, currentMonth, userId, getWorkoutsForMonth]
  );

  const dayPhotos = useMemo<Map<number, PhotoSrc[]>>(() => {
    const map = new Map<number, PhotoSrc[]>();
    workoutsForMonth.forEach((ws, day) => {
      const photos = ws
        .filter((w) => w.image?.uri || w.image?.templateId)
        .map((w) => ({ uri: w.image?.uri, templateId: w.image?.templateId }));
      if (photos.length) map.set(day, photos);
    });
    const prefix = `${currentYear}-${pad(currentMonth + 1)}-`;
    cached
      .filter((w) => w.userId === userId && w.completedAt.startsWith(prefix))
      .forEach((w) => {
        if (!w.imageUri && !w.imageTemplateId) return;
        const d = parseInt(w.completedAt.slice(8, 10), 10);
        map.set(d, [...(map.get(d) ?? []), { uri: w.imageUri, templateId: w.imageTemplateId }]);
      });
    return map;
  }, [workoutsForMonth, cached, currentYear, currentMonth, userId]);

  // Days that have placeholder workouts (for calendar cell grey box)
  const dayHasPlaceholder = useMemo<Set<number>>(() => {
    const set = new Set<number>();
    placeholdersByDateKey.forEach((_, dk) => {
      const day = parseInt(dk.slice(8, 10), 10);
      set.add(day);
    });
    return set;
  }, [placeholdersByDateKey]);

  const listSections = useMemo<DaySection[]>(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const isCurMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dk = makeDateKey(currentYear, currentMonth, day);
      const isToday = isCurMonth && today.getDate() === day;
      const scheduled = getWorkoutsForDate(dk, userId).map(
        (w): WorkoutItem => ({ type: 'scheduled', workout: w, dateKey: dk })
      );
      const completed = getCached(dk, userId).map(
        (w): WorkoutItem => ({ type: 'completed', workout: w, dateKey: dk })
      );
      const placeholders = (placeholdersByDateKey.get(dk) ?? []).map(
        (pw): WorkoutItem => ({
          type: 'placeholder',
          id: pw.id,
          name: pw.name,
          exerciseCount: pw.exerciseCount,
          totalSets: pw.totalSets,
          dateKey: dk,
        })
      );
      return {
        day,
        dateKey: dk,
        isToday,
        title: formatDayHeader(isToday, dk),
        data: [...scheduled, ...completed, ...placeholders],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentYear,
    currentMonth,
    userId,
    workoutIds,
    cached,
    placeholdersByDateKey,
    today,
    getWorkoutsForDate,
    getCached,
  ]);

  const flatItems = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = [];
    let workoutIdx = 0;
    listSections.forEach((s) => {
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
      const length = item.kind === 'header' ? HEADER_H : item.kind === 'empty' ? EMPTY_H : ROW_H;
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
    if (item.kind === 'header') {
      return (
        <View style={[styles.listHeader, item.isToday && styles.listHeaderToday]}>
          <Text style={[styles.listHeaderText, item.isToday && styles.listHeaderTextToday]}>
            {item.title}
          </Text>
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
    if (item.kind === 'header') return `h-${item.dateKey}`;
    if (item.kind === 'empty') return `empty-${item.dateKey}`;
    const d = item.data;
    if (d.type === 'placeholder') return `ph-${d.id}-${idx}`;
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/start-workout-sheet');
            }}
          >
            <Ionicons name="add" size={24} color="#000" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: LIQUID_TAB_BAR_HEIGHT + 24 }}
        >
          <CalendarGrid
            year={currentYear}
            month={currentMonth}
            dayPhotos={dayPhotos}
            dayHasPlaceholder={dayHasPlaceholder}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
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
