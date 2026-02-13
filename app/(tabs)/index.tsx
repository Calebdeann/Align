import { useRef, useState, useCallback, useMemo, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  Animated,
  LayoutAnimation,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import {
  generateMonthData,
  generateMonths,
  getMonthNames,
  getDayAbbreviations,
  type MonthData,
} from '@/utils/calendar';
import {
  useWorkoutStore,
  type ScheduledWorkout,
  type CachedCompletedWorkout,
} from '@/stores/workoutStore';
import { getWorkoutsByDateRange } from '@/services/api/workouts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { consumeListViewRequest } from '@/utils/calendarSignals';
import { getTemplateImageById } from '@/constants/templateImages';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - spacing.lg * 2) / 7;

const FOUNDER_BANNER_KEY = 'founder-banner-dismissed';

// DAY_NAMES keys for translating full day names (Sunday=0 index to match Date.getDay())
const DAY_NAME_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

// Type for displaying workouts in the calendar (both scheduled and completed)
interface CalendarWorkoutItem {
  id: string;
  name: string;
  tagColor: string;
  templateName: string | null; // Template name to show above workout name
  time?: { hour: number; minute: number };
  isCompleted: boolean;
  isFromDatabase: boolean; // true = completed workout from DB, false = scheduled workout
  scheduledWorkoutId?: string; // For toggling completion on scheduled workouts
  dbWorkoutId?: string; // For toggling DB completed workouts
  imageUri?: string | null; // Workout photo URI
  imageTemplateId?: string | null; // Template image ID for bundled assets
}

// Icons
function ListIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M8 6h13M8 12h13M8 18h13" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M3 6h.01M3 12h.01M3 18h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} strokeWidth={1.5} />
      <Path d="M3 9h18" stroke={color} strokeWidth={1.5} />
      <Path d="M8 2v4M16 2v4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function NoWorkoutIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={colors.textTertiary} strokeWidth={1.5} />
      <Line x1={6} y1={6} x2={18} y2={18} stroke={colors.textTertiary} strokeWidth={1.5} />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={colors.textTertiary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckboxUnchecked({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function CheckboxChecked({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} fill={color} />
      <Path
        d="M8 12l3 3 5-6"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Memoized workout row - reads its own completion state from the store
// so toggling one checkbox doesn't re-render every other row
interface WorkoutListRowProps {
  scheduledWorkoutId?: string;
  dbWorkoutId?: string;
  dateKey: string;
  name: string;
  tagColor: string;
  templateName: string | null;
  timeHour?: number;
  timeMinute?: number;
  imageUri?: string | null;
  imageTemplateId?: string | null;
  isFromDatabase: boolean;
  isDbCompleted: boolean;
  onDbToggle: (dbWorkoutId: string) => void;
}

function formatTimeDisplay(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

const WorkoutListRow = memo(function WorkoutListRow(props: WorkoutListRowProps) {
  const { withLock } = useNavigationLock();

  // For scheduled workouts, read completion state directly from the store
  const isScheduledCompleted = useWorkoutStore(
    useCallback(
      (state) => {
        if (!props.scheduledWorkoutId) return false;
        const workout = state.scheduledWorkouts.find((w) => w.id === props.scheduledWorkoutId);
        return workout?.completedDates.includes(props.dateKey) ?? false;
      },
      [props.scheduledWorkoutId, props.dateKey]
    )
  );
  const toggleWorkoutCompletion = useWorkoutStore((state) => state.toggleWorkoutCompletion);

  const isCompleted = props.scheduledWorkoutId ? isScheduledCompleted : props.isDbCompleted;

  const handleCheckboxPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (props.scheduledWorkoutId) {
      toggleWorkoutCompletion(props.scheduledWorkoutId, props.dateKey);
    } else if (props.dbWorkoutId) {
      props.onDbToggle(props.dbWorkoutId);
    }
  }, [
    props.scheduledWorkoutId,
    props.dbWorkoutId,
    props.dateKey,
    toggleWorkoutCompletion,
    props.onDbToggle,
  ]);

  const handleRowPress = useCallback(() => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (props.scheduledWorkoutId) {
        router.push({
          pathname: '/workout-preview',
          params: { workoutId: props.scheduledWorkoutId, dateKey: props.dateKey },
        });
      } else if (props.isFromDatabase && props.dbWorkoutId) {
        router.push({
          pathname: '/workout-details',
          params: { workoutId: props.dbWorkoutId },
        });
      }
    });
  }, [props.scheduledWorkoutId, props.dbWorkoutId, props.dateKey, props.isFromDatabase, withLock]);

  return (
    <Pressable
      style={({ pressed }) => [styles.workoutRow, pressed && { opacity: 0.7 }]}
      onPress={handleRowPress}
    >
      <Pressable onPress={handleCheckboxPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        {isCompleted ? (
          <CheckboxChecked color={props.tagColor} />
        ) : (
          <CheckboxUnchecked color={props.tagColor} />
        )}
      </Pressable>
      <View style={styles.workoutInfoPressable}>
        {props.imageUri ? (
          <Image source={{ uri: props.imageUri }} style={styles.workoutThumbnail} />
        ) : props.imageTemplateId ? (
          (() => {
            const src = getTemplateImageById(props.imageTemplateId);
            return src ? <Image source={src} style={styles.workoutThumbnail} /> : null;
          })()
        ) : null}
        <View style={styles.workoutInfo}>
          {props.templateName && props.templateName !== 'Default Workout' && (
            <Text style={[styles.workoutTemplateLabel, { color: props.tagColor }]}>
              {props.templateName.toUpperCase()}
            </Text>
          )}
          <Text style={styles.workoutName} numberOfLines={1}>
            {props.name}
          </Text>
        </View>
        {props.timeHour !== undefined && props.timeMinute !== undefined && (
          <Text style={styles.workoutTimeRight}>
            {formatTimeDisplay(props.timeHour, props.timeMinute)}
          </Text>
        )}
        <ChevronRight />
      </View>
    </Pressable>
  );
});

// Generate list of days for the list view (supports negative offset for past days)
function generateDays(baseDate: Date, startOffset: number, count: number) {
  const monthNames = getMonthNames();
  const days = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + startOffset + i);
    const dayOffset = startOffset + i;
    days.push({
      id: `day_${dayOffset}`,
      date,
      dayNum: date.getDate(),
      month: monthNames[date.getMonth()],
      isToday: dayOffset === 0,
      offset: dayOffset,
    });
  }
  return days;
}

// Initial days: 30 days in the past + today + 30 days in future
const INITIAL_PAST_DAYS = 30;
const INITIAL_FUTURE_DAYS = 30;
const DAYS_TO_LOAD = 15;

export default function CalendarScreen() {
  const { t } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  // Translated day/month names (re-computed when language changes)
  const DAY_NAMES = useMemo(() => DAY_NAME_KEYS.map((key) => t(`calendar.days.${key}`)), [t]);
  const MONTH_NAMES = useMemo(() => getMonthNames(), [t]);
  const DAYS = useMemo(() => getDayAbbreviations(), [t]);

  const { isNavigating, withLock } = useNavigationLock();

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [months, setMonths] = useState(() => generateMonths(currentYear, currentMonth, 12));
  const [listDays, setListDays] = useState(() =>
    generateDays(today, -INITIAL_PAST_DAYS, INITIAL_PAST_DAYS + 1 + INITIAL_FUTURE_DAYS)
  );

  const flatListRef = useRef<FlatList>(null);
  const listFlatListRef = useRef<FlatList>(null);

  // User state - use profile store as single source of truth (same as schedule-workout screen)
  const userId = useUserProfileStore((state) => state.userId);
  const fetchProfile = useUserProfileStore((state) => state.fetchProfile);
  // Track manually unchecked DB workouts (key: workout id, value: true if unchecked)
  const [uncheckedDbWorkouts, setUncheckedDbWorkouts] = useState<Set<string>>(new Set());

  // Stable callback for toggling DB workout checkboxes (used by memoized WorkoutListRow)
  const handleDbToggle = useCallback((dbWorkoutId: string) => {
    setUncheckedDbWorkouts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dbWorkoutId)) {
        newSet.delete(dbWorkoutId);
      } else {
        newSet.add(dbWorkoutId);
      }
      return newSet;
    });
  }, []);

  // Founder welcome banner
  const [showFounderBanner, setShowFounderBanner] = useState(false);
  const bannerOpacity = useRef(new Animated.Value(1)).current;
  const profile = useUserProfileStore((state) => state.profile);
  const userName = profile?.name?.split(' ')[0] || 'there';

  // Get workouts from store (both scheduled and cached completed)
  const getWorkoutsForMonth = useWorkoutStore((state) => state.getWorkoutsForMonth);
  const getWorkoutsForDate = useWorkoutStore((state) => state.getWorkoutsForDate);
  const isWorkoutCompleted = useWorkoutStore((state) => state.isWorkoutCompleted);

  // Structural selector - only changes when workouts are added/removed, NOT on completion toggles
  const scheduledWorkoutIds = useWorkoutStore(
    useCallback((state) => state.scheduledWorkouts.map((w) => w.id).join(','), [])
  );

  // Cached completed workouts from store (loads instantly from AsyncStorage)
  const cachedCompletedWorkouts = useWorkoutStore((state) => state.cachedCompletedWorkouts);
  const setCachedCompletedWorkouts = useWorkoutStore((state) => state.setCachedCompletedWorkouts);
  const getCachedCompletedWorkoutsForDate = useWorkoutStore(
    (state) => state.getCachedCompletedWorkoutsForDate
  );

  // Fetch completed workouts and cache them in store (runs in background)
  const fetchCompletedWorkouts = useCallback(
    async (uid: string) => {
      // Fetch workouts for 6 months in past and future
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);

      const workouts = await getWorkoutsByDateRange(
        uid,
        startDate.toISOString(),
        endDate.toISOString()
      );
      // Cache in store for instant loading next time
      setCachedCompletedWorkouts(workouts);
    },
    [setCachedCompletedWorkouts]
  );

  // Ensure profile (and userId) is loaded on cold start
  // fetchProfile has internal 5-min caching, so no redundant API calls
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Fetch completed workouts when userId becomes available
  useEffect(() => {
    if (userId) {
      fetchCompletedWorkouts(userId);
    }
  }, [userId, fetchCompletedWorkouts]);

  // Check if founder banner was previously dismissed
  useEffect(() => {
    async function checkBanner() {
      try {
        const dismissed = await AsyncStorage.getItem(FOUNDER_BANNER_KEY);
        if (dismissed !== 'true') {
          setShowFounderBanner(true);
        }
      } catch {
        setShowFounderBanner(true);
      }
    }
    checkBanner();
  }, []);

  const dismissFounderBanner = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(bannerOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowFounderBanner(false);
      AsyncStorage.setItem(FOUNDER_BANNER_KEY, 'true').catch(() => {});
    });
  }, [bannerOpacity]);

  // Refresh completed workouts when screen is focused ONLY if coming back from a workout save
  // We track this with a ref to avoid refetching on every tab switch
  const lastFocusTime = useRef<number>(0);
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // Only refetch if more than 2 seconds since last focus (indicates real navigation, not tab switch spam)
      // This prevents refetch on initial render and rapid tab switching
      if (userId && lastFocusTime.current > 0 && now - lastFocusTime.current > 2000) {
        fetchCompletedWorkouts(userId);
      }
      lastFocusTime.current = now;
    }, [userId, fetchCompletedWorkouts])
  );

  // Helper to get completed workouts for a specific date (uses store method)
  const getCompletedWorkoutsForDate = useCallback(
    (dateKey: string): CachedCompletedWorkout[] => {
      return getCachedCompletedWorkoutsForDate(dateKey, userId);
    },
    [getCachedCompletedWorkoutsForDate, userId]
  );

  // Combine scheduled and completed workouts for a date
  const getCombinedWorkoutsForDate = useCallback(
    (dateKey: string): CalendarWorkoutItem[] => {
      const scheduledWorkouts = getWorkoutsForDate(dateKey, userId);
      const dbCompletedWorkouts = getCompletedWorkoutsForDate(dateKey);

      const combined: CalendarWorkoutItem[] = [];

      // Add scheduled workouts
      scheduledWorkouts.forEach((sw) => {
        const completed = isWorkoutCompleted(sw.id, dateKey);
        combined.push({
          id: `scheduled_${sw.id}`,
          name: sw.name,
          tagColor: sw.tagColor || colors.primary,
          templateName: sw.templateName || null, // Show template name above workout name
          time: sw.time,
          isCompleted: completed,
          isFromDatabase: false,
          scheduledWorkoutId: sw.id,
        });
      });

      // Add completed workouts from DB that aren't already represented
      dbCompletedWorkouts.forEach((cw) => {
        // Check if this completed workout name matches any scheduled workout
        const matchingScheduled = scheduledWorkouts.find(
          (sw) => sw.name.toLowerCase().trim() === (cw.name || '').toLowerCase().trim()
        );

        // Only add if not already showing as a scheduled workout
        if (!matchingScheduled) {
          // Check if user manually unchecked this DB workout
          const isUnchecked = uncheckedDbWorkouts.has(cw.id);
          combined.push({
            id: `completed_${cw.id}`,
            name: cw.name || 'Workout',
            tagColor: colors.primary, // Default purple for completed workouts without tags
            templateName: null, // DB workouts don't have template name
            isCompleted: !isUnchecked, // Show as unchecked if user toggled it off
            isFromDatabase: true,
            dbWorkoutId: cw.id, // For toggling DB workouts
            imageUri: cw.imageUri,
            imageTemplateId: cw.imageTemplateId,
          });
        }
      });

      return combined;
    },
    [
      getWorkoutsForDate,
      getCompletedWorkoutsForDate,
      isWorkoutCompleted,
      uncheckedDbWorkouts,
      scheduledWorkoutIds,
      cachedCompletedWorkouts,
      userId,
    ]
  );

  // Memoized extraData - uses scheduledWorkoutIds (structural only) so completion toggles
  // don't trigger full FlatList re-renders. Each WorkoutListRow reads its own completion state.
  const flatListExtraData = useMemo(
    () => ({ scheduledWorkoutIds, cachedCompletedWorkouts, uncheckedDbWorkouts, userId }),
    [scheduledWorkoutIds, cachedCompletedWorkouts, uncheckedDbWorkouts, userId]
  );

  // Handle view mode switch - reset to current date
  const handleViewModeSwitch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMode === 'calendar') {
      // Switching to list view - reset list days and scroll to today
      setListDays(
        generateDays(today, -INITIAL_PAST_DAYS, INITIAL_PAST_DAYS + 1 + INITIAL_FUTURE_DAYS)
      );
      setViewMode('list');
      // Scroll to today after render
      setTimeout(() => {
        listFlatListRef.current?.scrollToIndex({ index: INITIAL_PAST_DAYS, animated: false });
      }, 100);
    } else {
      // Switching to calendar view - scroll to current month
      setViewMode('calendar');
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 12, animated: false });
      }, 100);
    }
  }, [viewMode, today]);

  // Handle clicking on a date in calendar view - switch to list view for that date
  const handleDatePress = useCallback(
    (targetDate: Date) => {
      // Calculate the offset from today
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const targetStart = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate()
      );
      const diffTime = targetStart.getTime() - todayStart.getTime();
      const dayOffset = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Generate list days centered around the target date
      // We want the target date to be visible, so generate days around it
      const startOffset = dayOffset - INITIAL_PAST_DAYS;
      const newListDays = generateDays(
        today,
        startOffset,
        INITIAL_PAST_DAYS + 1 + INITIAL_FUTURE_DAYS
      );

      setListDays(newListDays);
      setViewMode('list');

      // Scroll to the target date (which is at index INITIAL_PAST_DAYS in the new list)
      setTimeout(() => {
        listFlatListRef.current?.scrollToIndex({ index: INITIAL_PAST_DAYS, animated: false });
      }, 100);
    },
    [today]
  );

  // After scheduling a workout, switch to list view scrolled to the scheduled date
  useFocusEffect(
    useCallback(() => {
      const dateKey = consumeListViewRequest();
      if (dateKey) {
        const [y, m, d] = dateKey.split('-').map(Number);
        handleDatePress(new Date(y, m - 1, d));
      }
    }, [handleDatePress])
  );

  const loadMorePast = useCallback(() => {
    setMonths((prev) => {
      const firstMonth = prev[0];
      let year = firstMonth.year;
      let month = firstMonth.month - 1;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
      const newMonth = generateMonthData(year, month);
      return [newMonth, ...prev];
    });
  }, []);

  const loadMoreFuture = useCallback(() => {
    setMonths((prev) => {
      const lastMonth = prev[prev.length - 1];
      let year = lastMonth.year;
      let month = lastMonth.month + 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      const newMonth = generateMonthData(year, month);
      return [...prev, newMonth];
    });
  }, []);

  // List view infinite scroll handlers
  const loadMorePastDays = useCallback(() => {
    setListDays((prev) => {
      const firstDay = prev[0];
      const newDays = generateDays(today, firstDay.offset - DAYS_TO_LOAD, DAYS_TO_LOAD);
      return [...newDays, ...prev];
    });
  }, [today]);

  const loadMoreFutureDays = useCallback(() => {
    setListDays((prev) => {
      const lastDay = prev[prev.length - 1];
      const newDays = generateDays(today, lastDay.offset + 1, DAYS_TO_LOAD);
      return [...prev, ...newDays];
    });
  }, [today]);

  const renderDay = (
    day: number | null,
    isToday: boolean,
    weekIndex: number,
    dayIndex: number,
    workouts: CalendarWorkoutItem[] = [],
    year?: number,
    month?: number
  ) => {
    if (day === null) {
      return <View key={`empty-${weekIndex}-${dayIndex}`} style={styles.dayCell} />;
    }

    // Get unique colors for workout dots (max 5 dots)
    const dotColors = workouts.slice(0, 5).map((w) => w.tagColor);

    // Create date object for this day
    const handlePress = () => {
      if (year !== undefined && month !== undefined) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const targetDate = new Date(year, month, day);
        handleDatePress(targetDate);
      }
    };

    return (
      <Pressable key={`day-${day}`} style={styles.dayCell} onPress={handlePress}>
        <View style={[styles.dayContent, isToday && styles.todayCircle]}>
          <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
        </View>
        {dotColors.length > 0 && (
          <View style={styles.workoutDotsContainer}>
            {dotColors.map((color, index) => (
              <View key={index} style={[styles.workoutDot, { backgroundColor: color }]} />
            ))}
          </View>
        )}
      </Pressable>
    );
  };

  const renderMonth = ({ item }: { item: MonthData }) => {
    const isCurrentMonth = item.year === currentYear && item.month === currentMonth;

    return (
      <View style={styles.monthContainer}>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[item.month]} {item.year}
        </Text>
        {item.weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              const isToday = isCurrentMonth && day === currentDate;
              // Build date key for this day
              const dateKey = day
                ? `${item.year}-${String(item.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                : '';
              const dayWorkouts = day ? getCombinedWorkoutsForDate(dateKey) : [];
              return renderDay(
                day,
                isToday,
                weekIndex,
                dayIndex,
                dayWorkouts,
                item.year,
                item.month
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const formatDateHeader = (date: Date, isToday: boolean) => {
    const dayName = DAY_NAMES[date.getDay()];
    const monthName = MONTH_NAMES[date.getMonth()].slice(0, 3);
    const dayNum = date.getDate();
    if (isToday) {
      return t('planner.dateHeaderToday', { dayName, month: monthName, day: dayNum });
    }
    return t('planner.dateHeader', { dayName, month: monthName, day: dayNum });
  };

  // Calendar View
  const renderCalendarView = () => (
    <>
      {/* Day headers */}
      <View style={styles.dayHeaders}>
        {DAYS.map((day) => (
          <View key={day} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar */}
      <FlatList
        ref={flatListRef}
        data={months}
        renderItem={renderMonth}
        keyExtractor={(item) => item.id}
        extraData={flatListExtraData}
        onStartReached={loadMorePast}
        onStartReachedThreshold={0.5}
        onEndReached={loadMoreFuture}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        initialScrollIndex={12}
        getItemLayout={(_, index) => ({
          length: 280,
          offset: 280 * index,
          index,
        })}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </>
  );

  // Format date key for lookup
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Render a single day item for the list view
  const renderListDayItem = useCallback(
    ({ item: day }: { item: (typeof listDays)[0] }) => {
      const dateKey = formatDateKey(day.date);
      const workouts = getCombinedWorkoutsForDate(dateKey);

      return (
        <View>
          {/* Date header */}
          <View style={[styles.dateHeader, day.isToday && styles.todayHeader]}>
            <Text style={[styles.dateHeaderText, day.isToday && styles.todayHeaderText]}>
              {formatDateHeader(day.date, day.isToday)}
            </Text>
          </View>

          {workouts.length === 0 ? (
            <View style={styles.noWorkoutRow}>
              <NoWorkoutIcon />
              <Text style={styles.noWorkoutText}>{t('planner.noWorkouts')}</Text>
            </View>
          ) : (
            workouts.map((workout) => (
              <WorkoutListRow
                key={workout.id}
                scheduledWorkoutId={workout.scheduledWorkoutId}
                dbWorkoutId={workout.dbWorkoutId}
                dateKey={dateKey}
                name={workout.name}
                tagColor={workout.tagColor}
                templateName={workout.templateName}
                timeHour={workout.time?.hour}
                timeMinute={workout.time?.minute}
                imageUri={workout.imageUri}
                imageTemplateId={workout.imageTemplateId}
                isFromDatabase={workout.isFromDatabase}
                isDbCompleted={workout.isCompleted}
                onDbToggle={handleDbToggle}
              />
            ))
          )}
        </View>
      );
    },
    [getCombinedWorkoutsForDate, handleDbToggle]
  );

  // List View
  const renderListView = () => (
    <FlatList
      ref={listFlatListRef}
      data={listDays}
      renderItem={renderListDayItem}
      keyExtractor={(item) => item.id}
      extraData={flatListExtraData}
      onStartReached={loadMorePastDays}
      onStartReachedThreshold={0.5}
      onEndReached={loadMoreFutureDays}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      initialScrollIndex={INITIAL_PAST_DAYS}
      getItemLayout={(_, index) => ({
        length: 73, // Approximate height of each day item
        offset: 73 * index,
        index,
      })}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}
      windowSize={7}
      maxToRenderPerBatch={5}
      removeClippedSubviews={true}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('planner.title')}</Text>
        <View style={styles.headerIcons}>
          <Pressable style={styles.iconButton} onPress={handleViewModeSwitch}>
            {viewMode === 'calendar' ? (
              <ListIcon color={colors.text} />
            ) : (
              <CalendarIcon color={colors.text} />
            )}
          </Pressable>
          <Pressable
            style={styles.iconButton}
            disabled={isNavigating}
            onPress={() => {
              withLock(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/schedule-workout');
              });
            }}
          >
            <Text style={styles.iconText}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* Founder Welcome Banner */}
      {showFounderBanner && (
        <Animated.View style={[styles.founderBanner, { opacity: bannerOpacity }]}>
          <Pressable style={styles.founderDismiss} onPress={dismissFounderBanner}>
            <Text style={styles.founderDismissX}>✕</Text>
          </Pressable>

          <Image
            source={require('../../assets/images/CalebCass1.png')}
            style={styles.founderPhoto}
          />

          <Text
            style={styles.founderGreeting}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {t('planner.founderGreeting', { name: userName })}
          </Text>

          <Text style={[styles.founderBody, styles.founderBodyFirst]}>
            {t('planner.founderBody1')}
          </Text>

          <Text style={styles.founderBody}>{t('planner.founderBody2')}</Text>

          <Text style={[styles.founderBody, { marginBottom: 0 }]}>{t('planner.founderBody3')}</Text>
        </Animated.View>
      )}

      {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 28,
    color: colors.text,
    lineHeight: 28,
  },
  // Founder welcome banner
  founderBanner: {
    backgroundColor: '#F5F4FA',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: 12,
  },
  founderDismiss: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  founderDismissX: {
    fontSize: 9,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  founderPhoto: {
    position: 'absolute',
    top: 12,
    right: 20,
    width: 125,
    height: 118,
    resizeMode: 'contain',
    zIndex: 1,
  },
  founderGreeting: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.primary,
    marginBottom: 9,
    paddingRight: 145,
  },
  founderBody: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 10,
  },
  founderBodyFirst: {
    paddingRight: 140,
  },
  founderBodyBold: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  founderEmail: {
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  dayHeaderCell: {
    width: DAY_WIDTH,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  monthContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  monthTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dayCell: {
    width: DAY_WIDTH,
    height: 52,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  dayContent: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  todayCircle: {
    backgroundColor: colors.primary,
  },
  todayText: {
    color: colors.textInverse,
  },
  workoutDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  workoutDot: {
    width: 6.6,
    height: 6.6,
    borderRadius: 3.3,
  },
  // List view styles
  dateHeader: {
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  todayHeader: {
    backgroundColor: colors.primary,
  },
  dateHeaderText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  todayHeaderText: {
    color: colors.textInverse,
  },
  noWorkoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  noWorkoutText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  workoutInfoPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  workoutThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTemplateLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  workoutName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  workoutTimeRight: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
    backgroundColor: colors.primaryLight + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
