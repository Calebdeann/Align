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
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Rect, Circle, Polyline } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useTemplateStore,
  WorkoutTemplate,
  getTemplateTotalSets,
  DEFAULT_FOLDER_ID,
} from '@/stores/templateStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { CATEGORY_HERO_IMAGES } from '@/stores/presetTemplates';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_GAP = spacing.sm;
const MODAL_HORIZONTAL_PADDING = spacing.lg;
const CARD_WIDTH = (SCREEN_WIDTH - MODAL_HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.25;

const ALL_CATEGORIES = [
  { id: 'core', label: 'Abs' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'lower-body', label: 'Lower Body' },
  { id: 'pull', label: 'Pull' },
  { id: 'push', label: 'Push' },
  { id: 'upper-body', label: 'Upper Body' },
  { id: 'at-home', label: 'At Home' },
  { id: 'travel', label: 'Travel' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'rehab', label: 'No Equipment' },
];
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

// Workout colour options (no labels, just colours)
const WORKOUT_COLOURS = [
  { id: 'purple', color: colors.primary },
  { id: 'green', color: colors.workout.back },
  { id: 'blue', color: colors.workout.chest },
  { id: 'orange', color: colors.workout.arms },
  { id: 'pink', color: colors.workout.legs },
  { id: 'teal', color: colors.workout.cardio },
  { id: 'yellow', color: colors.workout.shoulders },
  { id: 'red', color: colors.workout.core },
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
  const userId = useUserProfileStore((state) => state.userId);
  const addWorkout = useWorkoutStore((state) => state.addWorkout);

  const [workoutName, setWorkoutName] = useState('');
  const [description, setDescription] = useState('');
  // Date is always required - default to today
  const [timeEnabled, setTimeEnabled] = useState(false);
  const [remindEnabled, setRemindEnabled] = useState(false);

  // Colour state (replaces tags)
  const [showColourModal, setShowColourModal] = useState(false);
  const [selectedColour, setSelectedColour] = useState<string>('purple'); // Default to purple

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

  // Template selection state (required - defaults to 'Default Workout')
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [isDefaultWorkout, setIsDefaultWorkout] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get templates from store
  const templates = useTemplateStore((state) => state.templates);
  const presetTemplates = useTemplateStore((state) => state.presetTemplates);
  const folders = useTemplateStore((state) => state.folders);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const repeatSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const templateSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const openColourModal = () => {
    setShowColourModal(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeColourModal = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowColourModal(false));
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

  const openTemplateModal = () => {
    setShowTemplateModal(true);
    Animated.spring(templateSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeTemplateModal = () => {
    Animated.timing(templateSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowTemplateModal(false);
      setSelectedCategory(null);
    });
  };

  const selectTemplate = (template: WorkoutTemplate | null, isDefault: boolean = false) => {
    setSelectedTemplate(template);
    setIsDefaultWorkout(isDefault);
    closeTemplateModal();
  };

  // Helper: get templates in a folder
  function getTemplatesInFolder(folderId: string) {
    if (folderId === DEFAULT_FOLDER_ID) {
      return templates.filter((t) => t.folderId === folderId || !t.folderId);
    }
    return templates.filter((t) => t.folderId === folderId);
  }

  // Helper: count presets per category
  function getCategoryCount(categoryId: string) {
    return presetTemplates.filter((t) => t.category === categoryId).length;
  }

  // Helper: get category label
  function getCategoryLabel(categoryId: string | null) {
    if (!categoryId) return '';
    const cat = ALL_CATEGORIES.find((c) => c.id === categoryId);
    return cat?.label || '';
  }

  // Presets filtered by selected category
  const categoryTemplates = selectedCategory
    ? presetTemplates.filter((t) => t.category === selectedCategory)
    : [];

  // Whether user has any templates
  const hasUserTemplates = templates.length > 0;

  const selectColour = (colourId: string) => {
    setSelectedColour(colourId);
    closeColourModal();
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

  const getSelectedColour = () => {
    const colour = WORKOUT_COLOURS.find((c) => c.id === selectedColour);
    return colour?.color || colors.primary;
  };

  // Get display name for template selection
  const getTemplateName = () => {
    if (isDefaultWorkout) return 'Default Workout';
    return selectedTemplate?.name || 'Default Workout';
  };

  const handleSave = () => {
    // Format date as YYYY-MM-DD
    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    const colourValue = getSelectedColour();
    const templateName = getTemplateName();

    if (!userId) {
      Alert.alert('Error', 'You must be logged in to schedule a workout.');
      return;
    }

    addWorkout({
      userId,
      name: workoutName || templateName,
      description: description || undefined,
      image: selectedTemplate?.image,
      tagId: selectedColour, // Store colour id
      tagColor: colourValue,
      templateName, // Store template name for display
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
      templateId: selectedTemplate?.id,
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
          {/* Workout Name */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Workout Name</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Enter workout name"
              placeholderTextColor={colors.textTertiary}
              value={workoutName}
              onChangeText={setWorkoutName}
            />
          </View>

          <Divider />

          {/* Description */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Optional"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <Divider />

          {/* Template (required) */}
          <Pressable style={styles.menuRow} onPress={openTemplateModal}>
            <Text style={styles.menuLabel}>Template</Text>
            <View style={styles.menuRight}>
              <Text style={[styles.menuValue, styles.menuValueSelected]}>{getTemplateName()}</Text>
              <ChevronRight />
            </View>
          </Pressable>

          <Divider />

          {/* Colour */}
          <Pressable style={styles.menuRow} onPress={openColourModal}>
            <Text style={styles.menuLabel}>Colour</Text>
            <View style={styles.menuRight}>
              <View style={[styles.colourCircle, { backgroundColor: getSelectedColour() }]} />
              <ChevronRight />
            </View>
          </Pressable>
        </View>

        {/* Date & Time Section */}
        <Text style={styles.sectionHeader}>Date & Time</Text>
        <View style={styles.card}>
          {/* Date is always required - show calendar header and calendar */}
          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <CalendarIcon />
              <View>
                <Text style={styles.menuLabel}>Date</Text>
                <Text style={styles.menuSubLabel}>{formatDate(selectedDate)}</Text>
              </View>
            </View>
          </View>

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

      {/* Colour Bottom Sheet Modal */}
      <Modal
        visible={showColourModal}
        transparent
        animationType="none"
        onRequestClose={closeColourModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeColourModal}>
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Pressable style={styles.modalCloseButton} onPress={closeColourModal}>
                  <CloseIcon />
                </Pressable>
                <Text style={styles.modalTitle}>Colour</Text>
                <View style={styles.modalCloseButton} />
              </View>

              <View style={styles.colourContainer}>
                <View style={styles.colourGrid}>
                  {WORKOUT_COLOURS.map((colour) => (
                    <Pressable
                      key={colour.id}
                      style={[
                        styles.colourOption,
                        selectedColour === colour.id && styles.colourOptionSelected,
                      ]}
                      onPress={() => selectColour(colour.id)}
                    >
                      <View style={[styles.colourCircleLarge, { backgroundColor: colour.color }]}>
                        {selectedColour === colour.id && (
                          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        )}
                      </View>
                    </Pressable>
                  ))}
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
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((letter, index) => (
                            <Pressable
                              key={index}
                              style={[
                                styles.dayCircle,
                                selectedRepeatDays.includes(index) && styles.dayCircleSelected,
                              ]}
                              onPress={() => toggleRepeatDay(index)}
                            >
                              <Text
                                style={[
                                  styles.dayCircleText,
                                  selectedRepeatDays.includes(index) &&
                                    styles.dayCircleTextSelected,
                                ]}
                              >
                                {letter}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                        {selectedRepeatDays.length > 0 && (
                          <Text style={styles.selectedDaysPreview}>
                            {selectedRepeatDays.length === 7
                              ? 'Every day'
                              : selectedRepeatDays.map((d) => DAY_NAMES[d]).join(', ')}
                          </Text>
                        )}
                      </View>

                      <Pressable
                        style={[
                          styles.doneButton,
                          selectedRepeatDays.length === 0 && styles.doneButtonDisabled,
                        ]}
                        onPress={closeRepeatModal}
                        disabled={selectedRepeatDays.length === 0}
                      >
                        <Text
                          style={[
                            styles.doneButtonText,
                            selectedRepeatDays.length === 0 && styles.doneButtonTextDisabled,
                          ]}
                        >
                          Done
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Template Selection Bottom Sheet Modal */}
      <Modal
        visible={showTemplateModal}
        transparent
        animationType="none"
        onRequestClose={closeTemplateModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeTemplateModal}>
          <Animated.View
            style={[
              styles.templateModalContent,
              { transform: [{ translateY: templateSlideAnim }] },
            ]}
          >
            <Pressable style={{ flex: 1 }} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                {selectedCategory ? (
                  <Pressable
                    style={styles.modalCloseButton}
                    onPress={() => setSelectedCategory(null)}
                  >
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                  </Pressable>
                ) : (
                  <Pressable style={styles.modalCloseButton} onPress={closeTemplateModal}>
                    <CloseIcon />
                  </Pressable>
                )}
                <Text style={styles.modalTitle}>
                  {selectedCategory ? getCategoryLabel(selectedCategory) : 'Select Template'}
                </Text>
                <View style={styles.modalCloseButton} />
              </View>

              <ScrollView
                style={styles.templateScrollView}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {selectedCategory ? (
                  <>
                    {/* Category drill-down: list of templates in category */}
                    {categoryTemplates.map((template) => (
                      <Pressable
                        key={template.id}
                        style={styles.templateRow}
                        onPress={() => selectTemplate(template, false)}
                      >
                        <View style={styles.templateImageContainer}>
                          {template.localImage ? (
                            <Image source={template.localImage} style={styles.templateImage} />
                          ) : template.image?.uri ? (
                            <Image
                              source={{ uri: template.image.uri }}
                              style={styles.templateImage}
                            />
                          ) : (
                            <View style={styles.templateImagePlaceholder}>
                              <Ionicons
                                name="barbell-outline"
                                size={24}
                                color={colors.textSecondary}
                              />
                            </View>
                          )}
                        </View>
                        <View style={styles.templateInfo}>
                          <Text style={styles.templateName}>{template.name}</Text>
                          <Text style={styles.templateMeta}>
                            {getTemplateTotalSets(template)} Sets • {template.equipment}
                          </Text>
                        </View>
                        <Pressable
                          style={styles.scheduleButton}
                          onPress={() => selectTemplate(template, false)}
                        >
                          <Text style={styles.scheduleButtonText}>Schedule</Text>
                        </Pressable>
                      </Pressable>
                    ))}
                    {categoryTemplates.length === 0 && (
                      <View style={styles.emptyCategory}>
                        <Ionicons name="fitness-outline" size={48} color={colors.border} />
                        <Text style={styles.emptyCategoryText}>No workouts in this category</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    {/* Default Workout Option */}
                    <Pressable
                      style={styles.templateRow}
                      onPress={() => selectTemplate(null, true)}
                    >
                      <View style={styles.templateInfo}>
                        <Text style={styles.templateName}>Default Workout</Text>
                        <Text style={styles.templateMeta}>Quick workout without a template</Text>
                      </View>
                      {isDefaultWorkout && !selectedTemplate && (
                        <View style={styles.templateCheckmark}>
                          <CheckIcon />
                        </View>
                      )}
                    </Pressable>

                    {/* User Templates by Folder */}
                    {hasUserTemplates && (
                      <>
                        <Text style={styles.templateSectionHeader}>Your Templates</Text>
                        {folders.map((folder) => {
                          const folderTemplates = getTemplatesInFolder(folder.id);
                          if (folderTemplates.length === 0) return null;
                          return (
                            <View key={folder.id}>
                              {folders.length > 1 && (
                                <Text style={styles.folderLabel}>{folder.name}</Text>
                              )}
                              {folderTemplates.map((template) => (
                                <Pressable
                                  key={template.id}
                                  style={styles.templateRow}
                                  onPress={() => selectTemplate(template, false)}
                                >
                                  <View style={styles.templateImageContainer}>
                                    {template.localImage ? (
                                      <Image
                                        source={template.localImage}
                                        style={styles.templateImage}
                                      />
                                    ) : template.image?.uri ? (
                                      <Image
                                        source={{ uri: template.image.uri }}
                                        style={styles.templateImage}
                                      />
                                    ) : (
                                      <View style={styles.templateImagePlaceholder}>
                                        <Ionicons
                                          name="barbell-outline"
                                          size={24}
                                          color={colors.textSecondary}
                                        />
                                      </View>
                                    )}
                                  </View>
                                  <View style={styles.templateInfo}>
                                    <Text style={styles.templateName}>{template.name}</Text>
                                    <Text style={styles.templateMeta}>
                                      {getTemplateTotalSets(template)} Sets • {template.equipment}
                                    </Text>
                                  </View>
                                  <Pressable
                                    style={styles.scheduleButton}
                                    onPress={() => selectTemplate(template, false)}
                                  >
                                    <Text style={styles.scheduleButtonText}>Schedule</Text>
                                  </Pressable>
                                </Pressable>
                              ))}
                            </View>
                          );
                        })}
                      </>
                    )}

                    {/* Align Templates - Category Grid */}
                    <Text style={styles.templateSectionHeader}>Align Templates</Text>
                    <View style={styles.categoryGrid}>
                      {ALL_CATEGORIES.map((category) => {
                        const count = getCategoryCount(category.id);
                        const heroImage = CATEGORY_HERO_IMAGES[category.id];
                        return (
                          <Pressable
                            key={category.id}
                            style={styles.categoryCard}
                            onPress={() => setSelectedCategory(category.id)}
                          >
                            {heroImage ? (
                              <Image source={heroImage} style={styles.categoryCardImage} />
                            ) : (
                              <View
                                style={[styles.categoryCardImage, styles.categoryCardPlaceholder]}
                              >
                                <Ionicons
                                  name="barbell-outline"
                                  size={32}
                                  color={colors.textSecondary}
                                />
                              </View>
                            )}
                            <LinearGradient
                              colors={['transparent', 'rgba(0,0,0,0.65)']}
                              style={styles.categoryCardGradient}
                            >
                              <Text style={styles.categoryCardLabel}>{category.label}</Text>
                              <Text style={styles.categoryCardCount}>{count} workouts</Text>
                            </LinearGradient>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}

                <View style={{ height: 40 }} />
              </ScrollView>
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
  inputRow: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputField: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
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
  colourCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  // Colour modal styles
  colourContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  colourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  colourOption: {
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colourOptionSelected: {
    borderColor: colors.text,
  },
  colourCircleLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
  },
  customDaysLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayCircleText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  dayCircleTextSelected: {
    color: colors.textInverse,
  },
  selectedDaysPreview: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  doneButtonDisabled: {
    backgroundColor: colors.border,
  },
  doneButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
  doneButtonTextDisabled: {
    color: colors.textTertiary,
  },

  // Template modal styles
  templateModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.9,
  },
  templateScrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  templateSectionHeader: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  folderLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  templateImageContainer: {
    marginRight: spacing.md,
  },
  templateImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  templateImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
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
  templateCheckmark: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  scheduleButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: '#FFFFFF',
  },
  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryCardPlaceholder: {
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 40,
  },
  categoryCardLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
  categoryCardCount: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  emptyCategory: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyCategoryText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  menuValueSelected: {
    color: colors.text,
  },
});
