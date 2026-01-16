import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Rect, Circle, Polyline } from 'react-native-svg';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORTS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Repeat options
const REPEAT_OPTIONS = [
  { id: 'never', label: 'Never' },
  { id: 'daily', label: 'Every Day' },
  { id: 'weekly', label: 'Every Week' },
  { id: 'biweekly', label: 'Every 2 Weeks' },
  { id: 'monthly', label: 'Every Month' },
  { id: 'custom', label: 'Custom Days' },
];

// Workout tags with their colors from theme
const WORKOUT_TAGS = [
  { id: 'legs', label: 'Legs', color: colors.workout.legs },
  { id: 'glutes', label: 'Glutes', color: colors.workout.legs },
  { id: 'arms', label: 'Arms', color: colors.workout.arms },
  { id: 'back', label: 'Back', color: colors.workout.back },
  { id: 'chest', label: 'Chest', color: colors.workout.chest },
  { id: 'fullBody', label: 'Full Body', color: colors.workout.fullBody },
  { id: 'cardio', label: 'Cardio', color: colors.workout.cardio },
  { id: 'shoulders', label: 'Shoulders', color: colors.workout.shoulders },
  { id: 'core', label: 'Core', color: colors.workout.core },
];

// Icons
function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ImageIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3}
        y={3}
        width={18}
        height={18}
        rx={2}
        stroke={colors.textTertiary}
        strokeWidth={1.5}
      />
      <Circle cx={8.5} cy={8.5} r={1.5} stroke={colors.textTertiary} strokeWidth={1.5} />
      <Path
        d="M21 15l-5-5-6 6"
        stroke={colors.textTertiary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke={colors.text} strokeWidth={1.5} />
      <Path d="M3 9h18" stroke={colors.text} strokeWidth={1.5} />
      <Path d="M8 2v4M16 2v4" stroke={colors.text} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={colors.text} strokeWidth={1.5} />
      <Path d="M12 6v6l4 2" stroke={colors.text} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function RepeatIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="17,1 21,5 17,9"
        stroke={colors.text}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 11V9a4 4 0 014-4h14"
        stroke={colors.text}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="7,23 3,19 7,15"
        stroke={colors.text}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 13v2a4 4 0 01-4 4H3"
        stroke={colors.text}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={colors.text}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 01-3.46 0"
        stroke={colors.text}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

// Calendar navigation chevron - uses text color instead of tertiary
function ChevronRightNav() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={colors.text}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronLeft() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={colors.text}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronUpDown() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 10l5-5 5 5M7 14l5 5 5-5"
        stroke={colors.textTertiary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// Generate calendar data for a month
function generateCalendarMonth(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

function formatDate(date: Date) {
  const today = new Date();
  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return 'Today';
  }
  return `${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatTime(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

function getRepeatLabel(repeatOption: string, selectedDays: number[]) {
  if (repeatOption === 'never') return 'Never';
  if (repeatOption === 'custom' && selectedDays.length > 0) {
    if (selectedDays.length === 7) return 'Every Day';
    return selectedDays.map((d) => DAY_SHORTS[d]).join(', ');
  }
  const option = REPEAT_OPTIONS.find((o) => o.id === repeatOption);
  return option?.label || 'Never';
}

export default function ScheduleWorkoutScreen() {
  const addWorkout = useWorkoutStore((state) => state.addWorkout);

  const [workoutName, setWorkoutName] = useState('');
  const [description, setDescription] = useState('');
  const [dateEnabled, setDateEnabled] = useState(false);
  const [timeEnabled, setTimeEnabled] = useState(false);
  const [remindEnabled, setRemindEnabled] = useState(false);

  // Tags state
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Date state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Time state
  const [selectedHour, setSelectedHour] = useState(13);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Repeat state
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [repeatOption, setRepeatOption] = useState('never');
  const [selectedRepeatDays, setSelectedRepeatDays] = useState<number[]>([]);

  // Reminder time state
  const [reminderHour, setReminderHour] = useState(9);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const repeatSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const openTagsModal = () => {
    setShowTagsModal(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeTagsModal = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowTagsModal(false));
  };

  const openRepeatModal = () => {
    setShowRepeatModal(true);
    Animated.spring(repeatSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeRepeatModal = () => {
    Animated.timing(repeatSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowRepeatModal(false));
  };

  const selectTag = (tagId: string | null) => {
    setSelectedTag(tagId);
    closeTagsModal();
  };

  const selectRepeatOption = (optionId: string) => {
    setRepeatOption(optionId);
    if (optionId !== 'custom') {
      setSelectedRepeatDays([]);
      closeRepeatModal();
    }
  };

  const toggleRepeatDay = (dayIndex: number) => {
    setSelectedRepeatDays((prev) => {
      if (prev.includes(dayIndex)) {
        return prev.filter((d) => d !== dayIndex);
      }
      return [...prev, dayIndex].sort((a, b) => a - b);
    });
  };

  const getSelectedTagInfo = () => {
    if (!selectedTag) return { label: 'No Tag', color: colors.textTertiary };
    const tag = WORKOUT_TAGS.find((t) => t.id === selectedTag);
    return tag || { label: 'No Tag', color: colors.textTertiary };
  };

  const handleSave = () => {
    // Format date as YYYY-MM-DD
    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    const tagInfo = getSelectedTagInfo();

    addWorkout({
      name: workoutName || 'Untitled Workout',
      description: description || undefined,
      tagId: selectedTag,
      tagColor: tagInfo.color,
      date: dateKey,
      time: timeEnabled ? { hour: selectedHour, minute: selectedMinute } : undefined,
      repeat: {
        type: repeatOption as 'never' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom',
        customDays: repeatOption === 'custom' ? selectedRepeatDays : undefined,
      },
      reminder: remindEnabled
        ? {
            enabled: true,
            hour: reminderHour,
            minute: reminderMinute,
          }
        : undefined,
    });

    router.back();
  };

  const calendarWeeks = generateCalendarMonth(calendarYear, calendarMonth);

  const goToPrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const selectDate = (day: number) => {
    setSelectedDate(new Date(calendarYear, calendarMonth, day));
  };

  const isSelectedDate = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === calendarMonth &&
      selectedDate.getFullYear() === calendarYear
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === calendarMonth &&
      today.getFullYear() === calendarYear
    );
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const periods = ['AM', 'PM'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <BackIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Schedule Workout</Text>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>SAVE</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Workout Info Card */}
        <View style={styles.card}>
          <View style={styles.workoutInfoRow}>
            <View style={styles.imagePlaceholder}>
              <ImageIcon />
            </View>
            <View style={styles.workoutTextInputs}>
              <TextInput
                style={styles.workoutNameInput}
                placeholder="Workout Name"
                placeholderTextColor={colors.textTertiary}
                value={workoutName}
                onChangeText={setWorkoutName}
              />
              <TextInput
                style={styles.descriptionInput}
                placeholder="Description (Optional)"
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          <Divider />

          <Pressable style={styles.menuRow}>
            <Text style={styles.menuLabel}>Routine</Text>
            <View style={styles.menuRight}>
              <Text style={styles.menuValue}>Default Routine</Text>
              <ChevronRight />
            </View>
          </Pressable>

          <Divider />

          <Pressable style={styles.menuRow} onPress={openTagsModal}>
            <Text style={styles.menuLabel}>Tags</Text>
            <View style={styles.menuRight}>
              <View
                style={[
                  styles.tagPill,
                  selectedTag && { backgroundColor: getSelectedTagInfo().color + '20' },
                ]}
              >
                <View style={[styles.tagDot, { backgroundColor: getSelectedTagInfo().color }]} />
                <Text
                  style={[styles.tagPillText, selectedTag && { color: getSelectedTagInfo().color }]}
                >
                  {getSelectedTagInfo().label}
                </Text>
              </View>
              <ChevronRight />
            </View>
          </Pressable>
        </View>

        {/* Date & Time Section */}
        <Text style={styles.sectionHeader}>Date & Time</Text>
        <View style={styles.card}>
          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <CalendarIcon />
              <View>
                <Text style={styles.menuLabel}>Date</Text>
                {dateEnabled && <Text style={styles.menuSubLabel}>{formatDate(selectedDate)}</Text>}
              </View>
            </View>
            <Switch
              value={dateEnabled}
              onValueChange={setDateEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {dateEnabled && (
            <>
              <Divider />
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                  <Text style={styles.calendarMonthYear}>
                    {MONTH_NAMES[calendarMonth]} {calendarYear} {'>'}
                  </Text>
                  <View style={styles.calendarNav}>
                    <Pressable onPress={goToPrevMonth} style={styles.calendarNavButton}>
                      <ChevronLeft />
                    </Pressable>
                    <Pressable onPress={goToNextMonth} style={styles.calendarNavButton}>
                      <ChevronRightNav />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.calendarDayHeaders}>
                  {DAYS.map((day) => (
                    <Text key={day} style={styles.calendarDayHeader}>
                      {day}
                    </Text>
                  ))}
                </View>

                {calendarWeeks.map((week, weekIndex) => (
                  <View key={weekIndex} style={styles.calendarWeek}>
                    {week.map((day, dayIndex) => (
                      <Pressable
                        key={dayIndex}
                        style={styles.calendarDay}
                        onPress={() => day && selectDate(day)}
                      >
                        {day && (
                          <View
                            style={[
                              styles.calendarDayContent,
                              isSelectedDate(day) && styles.calendarDaySelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.calendarDayText,
                                isSelectedDate(day) && styles.calendarDayTextSelected,
                                isToday(day) && !isSelectedDate(day) && styles.calendarDayTextToday,
                              ]}
                            >
                              {day}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>
            </>
          )}

          <Divider />

          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <ClockIcon />
              <View>
                <Text style={styles.menuLabel}>Time</Text>
                {timeEnabled && (
                  <Text style={styles.menuSubLabel}>
                    {formatTime(selectedHour, selectedMinute)}
                  </Text>
                )}
              </View>
            </View>
            <Switch
              value={timeEnabled}
              onValueChange={(value) => {
                setTimeEnabled(value);
                if (value) setShowTimePicker(true);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {timeEnabled && showTimePicker && (
            <>
              <Divider />
              <View style={styles.timePickerContainer}>
                <ScrollView
                  style={styles.timePickerColumn}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={40}
                  decelerationRate="fast"
                >
                  {hours.map((hour) => (
                    <Pressable
                      key={hour}
                      style={styles.timePickerItem}
                      onPress={() =>
                        setSelectedHour(
                          selectedHour >= 12
                            ? hour === 12
                              ? 12
                              : hour + 12
                            : hour === 12
                              ? 0
                              : hour
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.timePickerText,
                          (selectedHour % 12 === hour % 12 ||
                            (selectedHour === 0 && hour === 12) ||
                            (selectedHour === 12 && hour === 12)) &&
                            styles.timePickerTextSelected,
                        ]}
                      >
                        {hour}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <ScrollView
                  style={styles.timePickerColumn}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={40}
                  decelerationRate="fast"
                >
                  {minutes.map((minute) => (
                    <Pressable
                      key={minute}
                      style={styles.timePickerItem}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.timePickerText,
                          selectedMinute === minute && styles.timePickerTextSelected,
                        ]}
                      >
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <ScrollView
                  style={styles.timePickerColumn}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={40}
                  decelerationRate="fast"
                >
                  {periods.map((period) => (
                    <Pressable
                      key={period}
                      style={styles.timePickerItem}
                      onPress={() => {
                        if (period === 'AM' && selectedHour >= 12) {
                          setSelectedHour(selectedHour - 12);
                        } else if (period === 'PM' && selectedHour < 12) {
                          setSelectedHour(selectedHour + 12);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.timePickerText,
                          (period === 'AM' && selectedHour < 12) ||
                          (period === 'PM' && selectedHour >= 12)
                            ? styles.timePickerTextSelected
                            : null,
                        ]}
                      >
                        {period}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={styles.timePickerHighlight} pointerEvents="none" />
              </View>
            </>
          )}
        </View>

        {/* Repeat */}
        <View style={styles.card}>
          <Pressable style={styles.menuRow} onPress={openRepeatModal}>
            <View style={styles.menuLeft}>
              <RepeatIcon />
              <Text style={styles.menuLabel}>Repeat</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuValueLight}>
                {getRepeatLabel(repeatOption, selectedRepeatDays)}
              </Text>
              <ChevronUpDown />
            </View>
          </Pressable>
        </View>

        {/* More Options Section */}
        <Text style={styles.sectionHeader}>More Options</Text>
        <View style={styles.card}>
          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <BellIcon />
              <Text style={styles.menuLabel}>Remind me</Text>
            </View>
            <Switch
              value={remindEnabled}
              onValueChange={setRemindEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Divider />

          <Pressable
            style={styles.menuRow}
            onPress={() => setShowReminderTimePicker(!showReminderTimePicker)}
          >
            <View style={styles.menuLeft}>
              <ClockIcon />
              <Text style={styles.menuLabel}>Time</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuValue}>{formatTime(reminderHour, reminderMinute)}</Text>
              <ChevronRight />
            </View>
          </Pressable>

          {showReminderTimePicker && (
            <>
              <Divider />
              <View style={styles.timePickerContainer}>
                <ScrollView
                  style={styles.timePickerColumn}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={40}
                  decelerationRate="fast"
                >
                  {hours.map((hour) => (
                    <Pressable
                      key={hour}
                      style={styles.timePickerItem}
                      onPress={() =>
                        setReminderHour(
                          reminderHour >= 12
                            ? hour === 12
                              ? 12
                              : hour + 12
                            : hour === 12
                              ? 0
                              : hour
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.timePickerText,
                          (reminderHour % 12 === hour % 12 ||
                            (reminderHour === 0 && hour === 12) ||
                            (reminderHour === 12 && hour === 12)) &&
                            styles.timePickerTextSelected,
                        ]}
                      >
                        {hour}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <ScrollView
                  style={styles.timePickerColumn}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={40}
                  decelerationRate="fast"
                >
                  {minutes.map((minute) => (
                    <Pressable
                      key={minute}
                      style={styles.timePickerItem}
                      onPress={() => setReminderMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.timePickerText,
                          reminderMinute === minute && styles.timePickerTextSelected,
                        ]}
                      >
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <ScrollView
                  style={styles.timePickerColumn}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={40}
                  decelerationRate="fast"
                >
                  {periods.map((period) => (
                    <Pressable
                      key={period}
                      style={styles.timePickerItem}
                      onPress={() => {
                        if (period === 'AM' && reminderHour >= 12) {
                          setReminderHour(reminderHour - 12);
                        } else if (period === 'PM' && reminderHour < 12) {
                          setReminderHour(reminderHour + 12);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.timePickerText,
                          (period === 'AM' && reminderHour < 12) ||
                          (period === 'PM' && reminderHour >= 12)
                            ? styles.timePickerTextSelected
                            : null,
                        ]}
                      >
                        {period}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={styles.timePickerHighlight} pointerEvents="none" />
              </View>
            </>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Tags Bottom Sheet Modal */}
      <Modal
        visible={showTagsModal}
        transparent
        animationType="none"
        onRequestClose={closeTagsModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeTagsModal}>
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Pressable style={styles.modalCloseButton} onPress={closeTagsModal}>
                  <CloseIcon />
                </Pressable>
                <Text style={styles.modalTitle}>Tags</Text>
                <View style={styles.modalCloseButton} />
              </View>

              <View style={styles.tagsContainer}>
                <View style={styles.tagCard}>
                  <Pressable style={styles.noTagRow} onPress={() => selectTag(null)}>
                    <View style={[styles.tagDotLarge, { backgroundColor: colors.textTertiary }]} />
                    <Text style={styles.noTagText}>No Tag</Text>
                    {selectedTag === null && <CheckIcon />}
                  </Pressable>

                  <View style={styles.tagsGrid}>
                    {WORKOUT_TAGS.map((tag) => (
                      <Pressable
                        key={tag.id}
                        style={[
                          styles.tagOption,
                          { backgroundColor: tag.color + '20', borderColor: tag.color + '40' },
                        ]}
                        onPress={() => selectTag(tag.id)}
                      >
                        <View style={[styles.tagDotLarge, { backgroundColor: tag.color }]} />
                        <Text style={[styles.tagOptionText, { color: tag.color }]}>
                          {tag.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.customTagSection}>
                    <View style={styles.customTagHeader}>
                      <View
                        style={[styles.tagDotLarge, { backgroundColor: colors.textTertiary }]}
                      />
                      <Text style={styles.customTagLabel}>Custom Tag</Text>
                    </View>
                    <TextInput
                      style={styles.customTagInput}
                      placeholder="Name Your Tag..."
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Repeat Bottom Sheet Modal */}
      <Modal
        visible={showRepeatModal}
        transparent
        animationType="none"
        onRequestClose={closeRepeatModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeRepeatModal}>
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateY: repeatSlideAnim }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Pressable style={styles.modalCloseButton} onPress={closeRepeatModal}>
                  <CloseIcon />
                </Pressable>
                <Text style={styles.modalTitle}>Repeat</Text>
                <View style={styles.modalCloseButton} />
              </View>

              <View style={styles.repeatContainer}>
                <View style={styles.repeatCard}>
                  {/* Repeat Options */}
                  {REPEAT_OPTIONS.map((option, index) => (
                    <View key={option.id}>
                      <Pressable
                        style={styles.repeatOptionRow}
                        onPress={() => selectRepeatOption(option.id)}
                      >
                        <Text
                          style={[
                            styles.repeatOptionText,
                            repeatOption === option.id && styles.repeatOptionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {repeatOption === option.id && <CheckIcon />}
                      </Pressable>
                      {index < REPEAT_OPTIONS.length - 1 && <Divider />}
                    </View>
                  ))}

                  {/* Custom Days Selection */}
                  {repeatOption === 'custom' && (
                    <>
                      <View style={styles.customDaysSection}>
                        <Text style={styles.customDaysLabel}>Select Days</Text>
                        <View style={styles.daysRow}>
                          {DAY_SHORTS.map((day, index) => (
                            <Pressable
                              key={day}
                              style={[
                                styles.dayChip,
                                selectedRepeatDays.includes(index) && styles.dayChipSelected,
                              ]}
                              onPress={() => toggleRepeatDay(index)}
                            >
                              <Text
                                style={[
                                  styles.dayChipText,
                                  selectedRepeatDays.includes(index) && styles.dayChipTextSelected,
                                ]}
                              >
                                {day}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

                      <Pressable style={styles.doneButton} onPress={closeRepeatModal}>
                        <Text style={styles.doneButtonText}>Done</Text>
                      </Pressable>
                    </>
                  )}
                </View>
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
    backgroundColor: colors.surfaceSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceSecondary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  saveButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  saveButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  card: {
    ...cardStyle,
    marginBottom: spacing.sm,
  },
  workoutInfoRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  imagePlaceholder: {
    width: 72,
    height: 72,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutTextInputs: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  workoutNameInput: {
    fontFamily: fonts.medium,
    fontSize: fontSize.lg,
    color: colors.text,
    padding: 0,
  },
  descriptionInput: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    padding: 0,
  },
  sectionHeader: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  menuLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  menuSubLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuValue: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  menuValueLight: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: spacing.xs,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagPillText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.25)',
    marginHorizontal: spacing.sm,
  },
  bottomSpacer: {
    height: 40,
  },

  // Calendar styles
  calendarContainer: {
    padding: spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  calendarMonthYear: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  calendarNav: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  calendarNavButton: {
    padding: spacing.xs,
  },
  calendarDayHeaders: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  calendarDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  calendarWeek: {
    flexDirection: 'row',
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayContent: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  calendarDaySelected: {
    backgroundColor: colors.primary,
  },
  calendarDayText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  calendarDayTextSelected: {
    color: colors.textInverse,
  },
  calendarDayTextToday: {
    color: colors.primary,
  },

  // Time picker styles
  timePickerContainer: {
    flexDirection: 'row',
    height: 200,
    paddingHorizontal: spacing.xl,
    position: 'relative',
  },
  timePickerColumn: {
    flex: 1,
  },
  timePickerItem: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.lg,
    color: colors.textTertiary,
  },
  timePickerTextSelected: {
    color: colors.text,
    fontSize: fontSize.xl,
  },
  timePickerHighlight: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: 80,
    height: 40,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  tagsContainer: {
    paddingHorizontal: spacing.lg,
  },
  tagCard: {
    ...cardStyle,
    padding: spacing.md,
  },
  noTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagDotLarge: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  noTagText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    width: '48%',
  },
  tagOptionText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
  },
  customTagSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 217, 217, 0.25)',
    paddingTop: spacing.md,
  },
  customTagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  customTagLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  customTagInput: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: spacing.sm,
  },

  // Repeat modal styles
  repeatContainer: {
    paddingHorizontal: spacing.lg,
  },
  repeatCard: {
    ...cardStyle,
    padding: spacing.md,
  },
  repeatOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  repeatOptionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  repeatOptionTextSelected: {
    color: colors.primary,
  },
  customDaysSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 217, 217, 0.25)',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  customDaysLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  dayChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
  },
  dayChipText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.text,
  },
  dayChipTextSelected: {
    color: colors.textInverse,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  doneButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
});
