import { useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import {
  generateMonthData,
  generateMonths,
  MONTH_NAMES,
  DAYS,
  type MonthData,
} from '@/utils/calendar';
import { useWorkoutStore, type ScheduledWorkout } from '@/stores/workoutStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - spacing.lg * 2) / 7;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

// Generate list of days for the list view (supports negative offset for past days)
function generateDays(baseDate: Date, startOffset: number, count: number) {
  const days = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + startOffset + i);
    const dayOffset = startOffset + i;
    days.push({
      id: `day_${dayOffset}`,
      date,
      dayName: DAY_NAMES[date.getDay()],
      dayNum: date.getDate(),
      month: MONTH_NAMES[date.getMonth()],
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
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [months, setMonths] = useState(() => generateMonths(currentYear, currentMonth, 12));
  const [listDays, setListDays] = useState(() =>
    generateDays(today, -INITIAL_PAST_DAYS, INITIAL_PAST_DAYS + 1 + INITIAL_FUTURE_DAYS)
  );

  const flatListRef = useRef<FlatList>(null);
  const listFlatListRef = useRef<FlatList>(null);

  // Get workouts from store
  const getWorkoutsForMonth = useWorkoutStore((state) => state.getWorkoutsForMonth);
  const getWorkoutsForDate = useWorkoutStore((state) => state.getWorkoutsForDate);

  // Handle view mode switch - reset to current date
  const handleViewModeSwitch = useCallback(() => {
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
    workouts: ScheduledWorkout[] = []
  ) => {
    if (day === null) {
      return <View key={`empty-${weekIndex}-${dayIndex}`} style={styles.dayCell} />;
    }

    // Get unique colors for workout dots (max 3 dots)
    const dotColors = workouts.slice(0, 3).map((w) => w.tagColor);

    return (
      <View key={`day-${day}`} style={styles.dayCell}>
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
      </View>
    );
  };

  const renderMonth = ({ item }: { item: MonthData }) => {
    const isCurrentMonth = item.year === currentYear && item.month === currentMonth;
    const workoutsByDay = getWorkoutsForMonth(item.year, item.month);

    return (
      <View style={styles.monthContainer}>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[item.month]} {item.year}
        </Text>
        {item.weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              const isToday = isCurrentMonth && day === currentDate;
              const dayWorkouts = day ? workoutsByDay.get(day) || [] : [];
              return renderDay(day, isToday, weekIndex, dayIndex, dayWorkouts);
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
      return `Today - ${dayName}, ${monthName} ${dayNum}`;
    }
    return `${dayName}, ${monthName} ${dayNum}`;
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
      />
    </>
  );

  // Format date key for lookup
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Format time for display
  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  // Render a single day item for the list view
  const renderListDayItem = useCallback(
    ({ item: day }: { item: (typeof listDays)[0] }) => {
      const dateKey = formatDateKey(day.date);
      const workouts = getWorkoutsForDate(dateKey);

      return (
        <View>
          {/* Date header */}
          <View style={[styles.dateHeader, day.isToday && styles.todayHeader]}>
            <Text style={[styles.dateHeaderText, day.isToday && styles.todayHeaderText]}>
              {formatDateHeader(day.date, day.isToday)}
            </Text>
          </View>

          {workouts.length === 0 ? (
            /* No workouts row */
            <View style={styles.noWorkoutRow}>
              <NoWorkoutIcon />
              <Text style={styles.noWorkoutText}>No Workouts</Text>
            </View>
          ) : (
            /* Show scheduled workouts */
            workouts.map((workout) => (
              <View key={workout.id} style={styles.workoutRow}>
                <View style={[styles.workoutTagDot, { backgroundColor: workout.tagColor }]} />
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  {workout.time && (
                    <Text style={styles.workoutTime}>
                      {formatTime(workout.time.hour, workout.time.minute)}
                    </Text>
                  )}
                </View>
                <ChevronRight />
              </View>
            ))
          )}
        </View>
      );
    },
    [getWorkoutsForDate]
  );

  // List View
  const renderListView = () => (
    <FlatList
      ref={listFlatListRef}
      data={listDays}
      renderItem={renderListDayItem}
      keyExtractor={(item) => item.id}
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
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Planner</Text>
        <View style={styles.headerIcons}>
          <Pressable style={styles.iconButton} onPress={handleViewModeSwitch}>
            {viewMode === 'calendar' ? (
              <ListIcon color={colors.text} />
            ) : (
              <CalendarIcon color={colors.text} />
            )}
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => router.push('/schedule-workout')}>
            <Text style={styles.iconText}>+</Text>
          </Pressable>
        </View>
      </View>

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
    width: 6,
    height: 6,
    borderRadius: 3,
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
  workoutTagDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  workoutTime: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
