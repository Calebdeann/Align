import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Rect, Circle, Polyline } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useWorkoutStore, type ScheduledWorkout } from '@/stores/workoutStore';
import { requestListViewForDate } from '@/utils/calendarSignals';
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

// Time picker constants
const TIME_ITEM_HEIGHT = 44;
const TIME_VISIBLE_ITEMS = 5;
const TIME_PICKER_HEIGHT = TIME_ITEM_HEIGHT * TIME_VISIBLE_ITEMS;

// Category IDs - labels resolved via i18n inside component
const ALL_CATEGORY_IDS = [
  'core',
  'glutes',
  'lower-body',
  'pull',
  'push',
  'upper-body',
  'at-home',
  'travel',
  'cardio',
  'rehab',
] as const;

// Calendar/day constants resolved via i18n inside component
const MONTH_KEYS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;
const DAY_ABBR_KEYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'] as const;
const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;
const DAY_SHORT_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

// Repeat option IDs
const REPEAT_OPTION_IDS = [
  'never',
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'custom',
  'interval',
] as const;

// Workout colour options (no labels, just colours)
const WORKOUT_COLOURS = [
  { id: 'purple', color: colors.primary },
  { id: 'green', color: colors.workout.back },
  { id: 'blue', color: colors.workout.chest },
  { id: 'orange', color: colors.workout.biceps },
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
    return i18n.t('calendar.today');
  }
  const monthName = i18n.t(`calendar.months.${MONTH_KEYS[date.getMonth()]}`);
  return `${monthName.slice(0, 3)} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatTime(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

function getRepeatLabel(repeatOption: string, selectedDays: number[], intervalDays?: number) {
  if (repeatOption === 'never') return i18n.t('schedule.repeatNever');
  if (repeatOption === 'custom' && selectedDays.length > 0) {
    if (selectedDays.length === 7) return i18n.t('schedule.repeatEveryDay');
    return selectedDays.map((d) => i18n.t(`calendar.daysShort.${DAY_SHORT_KEYS[d]}`)).join(', ');
  }
  if (repeatOption === 'interval') {
    return i18n
      .t('schedule.everyXDaysFromDate', { count: intervalDays || 2 })
      .split(' starting')[0];
  }
  const repeatKeyMap: Record<string, string> = {
    daily: 'schedule.repeatEveryDay',
    weekly: 'schedule.repeatEveryWeek',
    biweekly: 'schedule.repeatEvery2Weeks',
    monthly: 'schedule.repeatEveryMonth',
    custom: 'schedule.repeatCustomDays',
    interval: 'schedule.repeatEveryXDays',
  };
  return i18n.t(repeatKeyMap[repeatOption] || 'schedule.repeatNever');
}

export default function ScheduleWorkoutScreen() {
  const { t } = useTranslation();

  const ALL_CATEGORIES = useMemo(
    () =>
      ALL_CATEGORY_IDS.map((id) => {
        const labelMap: Record<string, string> = {
          core: t('templateCategories.abs'),
          glutes: t('templateCategories.glutes'),
          'lower-body': t('templateCategories.lowerBody'),
          pull: t('templateCategories.pull'),
          push: t('templateCategories.push'),
          'upper-body': t('templateCategories.upperBody'),
          'at-home': t('templateCategories.atHome'),
          travel: t('templateCategories.travel'),
          cardio: t('templateCategories.cardio'),
          rehab: t('templateCategories.noEquipment'),
        };
        return { id, label: labelMap[id] || id };
      }),
    [t]
  );

  const MONTH_NAMES = useMemo(() => MONTH_KEYS.map((k) => t(`calendar.months.${k}`)), [t]);
  const DAYS = useMemo(
    () => DAY_SHORT_KEYS.map((k) => t(`calendar.daysShort.${k}`).toUpperCase()),
    [t]
  );
  const DAY_NAMES = useMemo(() => DAY_KEYS.map((k) => t(`calendar.days.${k}`)), [t]);
  const DAY_SHORTS = useMemo(() => DAY_SHORT_KEYS.map((k) => t(`calendar.daysShort.${k}`)), [t]);

  const REPEAT_OPTIONS = useMemo(
    () => [
      { id: 'never', label: t('schedule.repeatNever') },
      { id: 'daily', label: t('schedule.repeatEveryDay') },
      { id: 'weekly', label: t('schedule.repeatEveryWeek') },
      { id: 'biweekly', label: t('schedule.repeatEvery2Weeks') },
      { id: 'monthly', label: t('schedule.repeatEveryMonth') },
      { id: 'custom', label: t('schedule.repeatCustomDays') },
      { id: 'interval', label: t('schedule.repeatEveryXDays') },
    ],
    [t]
  );

  const params = useLocalSearchParams<{
    editWorkoutId?: string;
    editDateKey?: string;
  }>();
  const isEditMode = !!params.editWorkoutId;

  const userId = useUserProfileStore((state) => state.userId);
  const addWorkout = useWorkoutStore((state) => state.addWorkout);
  const updateWorkout = useWorkoutStore((state) => state.updateWorkout);
  const editSingleOccurrence = useWorkoutStore((state) => state.editSingleOccurrence);
  const editFromDateForward = useWorkoutStore((state) => state.editFromDateForward);
  const getScheduledWorkoutById = useWorkoutStore((state) => state.getScheduledWorkoutById);
  const getTemplateById = useTemplateStore((state) => state.getTemplateById);

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
  const [intervalDays, setIntervalDays] = useState(3);

  // Reminder time state
  const [reminderHour, setReminderHour] = useState(9);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);

  // Template selection state (defaults to 'No Template')
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [isDefaultWorkout, setIsDefaultWorkout] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Track the original workout for edit mode
  const [originalWorkout, setOriginalWorkout] = useState<ScheduledWorkout | null>(null);

  // Pre-populate form when editing
  useEffect(() => {
    if (!params.editWorkoutId) return;

    const workout = getScheduledWorkoutById(params.editWorkoutId);
    if (!workout) return;

    setOriginalWorkout(workout);
    setWorkoutName(workout.name);
    setDescription(workout.description || '');

    // Use the occurrence date (editDateKey), not the original start date
    const dateToUse = params.editDateKey || workout.date;
    const editDate = new Date(dateToUse + 'T00:00:00');
    setSelectedDate(editDate);
    setCalendarMonth(editDate.getMonth());
    setCalendarYear(editDate.getFullYear());

    // Time
    if (workout.time) {
      setTimeEnabled(true);
      setSelectedHour(workout.time.hour);
      setSelectedMinute(workout.time.minute);
      setShowTimePicker(true);
    }

    // Repeat
    setRepeatOption(workout.repeat.type);
    if (workout.repeat.customDays) {
      setSelectedRepeatDays(workout.repeat.customDays);
    }
    if (workout.repeat.intervalDays) {
      setIntervalDays(workout.repeat.intervalDays);
    }

    // Colour
    if (workout.tagId) {
      setSelectedColour(workout.tagId);
    }

    // Template
    if (workout.templateId) {
      const tmpl = getTemplateById(workout.templateId);
      if (tmpl) {
        setSelectedTemplate(tmpl);
        setIsDefaultWorkout(false);
      }
    }

    // Reminder
    if (workout.reminder?.enabled) {
      setRemindEnabled(true);
      setReminderHour(workout.reminder.hour);
      setReminderMinute(workout.reminder.minute);
    }
  }, [params.editWorkoutId]);

  // Get templates from store
  const templates = useTemplateStore((state) => state.templates);
  const presetTemplates = useTemplateStore((state) => state.presetTemplates);
  const folders = useTemplateStore((state) => state.folders);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const repeatSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const templateSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Time picker ScrollView refs
  const hourListRef = useRef<ScrollView>(null);
  const minuteListRef = useRef<ScrollView>(null);
  const periodListRef = useRef<ScrollView>(null);
  const reminderHourListRef = useRef<ScrollView>(null);
  const reminderMinuteListRef = useRef<ScrollView>(null);
  const reminderPeriodListRef = useRef<ScrollView>(null);

  // Track previous indices for haptic feedback
  const lastHourIndexRef = useRef(-1);
  const lastMinuteIndexRef = useRef(-1);
  const lastPeriodIndexRef = useRef(-1);
  const lastReminderHourIndexRef = useRef(-1);
  const lastReminderMinuteIndexRef = useRef(-1);
  const lastReminderPeriodIndexRef = useRef(-1);

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
    // Auto-set color to match template
    if (template && template.tagColor) {
      const match = WORKOUT_COLOURS.find((c) => c.color === template.tagColor);
      if (match) setSelectedColour(match.id);
    }
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
    if (optionId !== 'custom' && optionId !== 'interval') {
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

  // Get template name for storing with workout data (null = no template)
  const getTemplateName = (): string | null => {
    if (isDefaultWorkout) return null;
    return selectedTemplate?.name || null;
  };

  // Get display label for the template selector button
  const getTemplateDisplayName = () => {
    if (isDefaultWorkout) return t('schedule.noTemplate');
    return selectedTemplate?.name || t('schedule.noTemplate');
  };

  // Build the workout data object from current form state
  const buildWorkoutData = () => {
    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const colourValue = getSelectedColour();
    const templateName = getTemplateName();

    return {
      userId: userId!,
      name: workoutName,
      description: description || undefined,
      image: selectedTemplate?.image,
      tagId: selectedColour,
      tagColor: colourValue,
      templateName,
      date: dateKey,
      time: timeEnabled ? { hour: selectedHour, minute: selectedMinute } : undefined,
      repeat: {
        type: repeatOption as ScheduledWorkout['repeat']['type'],
        customDays: repeatOption === 'custom' ? selectedRepeatDays : undefined,
        intervalDays: repeatOption === 'interval' ? intervalDays : undefined,
      },
      reminder: remindEnabled
        ? { enabled: true as const, hour: reminderHour, minute: reminderMinute }
        : undefined,
      templateId: selectedTemplate?.id,
    };
  };

  const handleSave = () => {
    if (!userId) {
      Alert.alert(t('common.error'), t('schedule.mustBeLoggedIn'));
      return;
    }

    if (!workoutName.trim()) {
      Alert.alert(t('schedule.workoutNameRequired'), t('schedule.workoutNameRequiredMessage'));
      return;
    }

    const workoutData = buildWorkoutData();

    // CREATE mode - add, signal calendar to show list view, and go back
    if (!isEditMode || !originalWorkout) {
      addWorkout(workoutData);
      requestListViewForDate(workoutData.date);
      router.back();
      return;
    }

    // EDIT mode
    const isRecurring = originalWorkout.repeat.type !== 'never';

    if (!isRecurring) {
      // Non-recurring: simple update
      updateWorkout(originalWorkout.id, workoutData);
      router.back();
      return;
    }

    // Recurring: ask how to apply changes
    Alert.alert(t('schedule.editRecurring'), t('schedule.editRecurringMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('schedule.justThisOne'),
        onPress: () => {
          editSingleOccurrence(
            originalWorkout.id,
            params.editDateKey || originalWorkout.date,
            workoutData
          );
          router.back();
        },
      },
      {
        text: t('schedule.thisFuture'),
        onPress: () => {
          editFromDateForward(
            originalWorkout.id,
            params.editDateKey || originalWorkout.date,
            workoutData
          );
          router.back();
        },
      },
      {
        text: t('schedule.allOccurrences'),
        onPress: () => {
          updateWorkout(originalWorkout.id, workoutData);
          router.back();
        },
      },
    ]);
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

  // Convert 24-hour selectedHour to index in hours array (1-12)
  const getHourIndex = (hour24: number) => {
    const h12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    return hours.indexOf(h12);
  };
  const getMinuteIndex = (minute: number) => minutes.indexOf(minute);
  const getPeriodIndex = (hour24: number) => (hour24 >= 12 ? 1 : 0);

  // Workout time scroll handlers
  const onHourScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / TIME_ITEM_HEIGHT);
      const clampedIndex = Math.min(Math.max(index, 0), hours.length - 1);
      if (clampedIndex !== lastHourIndexRef.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        lastHourIndexRef.current = clampedIndex;
      }
      const hour12 = hours[clampedIndex];
      const isPM = selectedHour >= 12;
      const hour24 = isPM ? (hour12 === 12 ? 12 : hour12 + 12) : hour12 === 12 ? 0 : hour12;
      setSelectedHour(hour24);
    },
    [selectedHour]
  );

  const onMinuteScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / TIME_ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), minutes.length - 1);
    if (clampedIndex !== lastMinuteIndexRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      lastMinuteIndexRef.current = clampedIndex;
    }
    setSelectedMinute(minutes[clampedIndex]);
  }, []);

  const onPeriodScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / TIME_ITEM_HEIGHT);
      const clampedIndex = Math.min(Math.max(index, 0), periods.length - 1);
      if (clampedIndex !== lastPeriodIndexRef.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        lastPeriodIndexRef.current = clampedIndex;
      }
      if (clampedIndex === 0 && selectedHour >= 12) {
        setSelectedHour(selectedHour - 12);
      } else if (clampedIndex === 1 && selectedHour < 12) {
        setSelectedHour(selectedHour + 12);
      }
    },
    [selectedHour]
  );

  // Reminder time scroll handlers
  const onReminderHourScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / TIME_ITEM_HEIGHT);
      const clampedIndex = Math.min(Math.max(index, 0), hours.length - 1);
      if (clampedIndex !== lastReminderHourIndexRef.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        lastReminderHourIndexRef.current = clampedIndex;
      }
      const hour12 = hours[clampedIndex];
      const isPM = reminderHour >= 12;
      const hour24 = isPM ? (hour12 === 12 ? 12 : hour12 + 12) : hour12 === 12 ? 0 : hour12;
      setReminderHour(hour24);
    },
    [reminderHour]
  );

  const onReminderMinuteScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / TIME_ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), minutes.length - 1);
    if (clampedIndex !== lastReminderMinuteIndexRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      lastReminderMinuteIndexRef.current = clampedIndex;
    }
    setReminderMinute(minutes[clampedIndex]);
  }, []);

  const onReminderPeriodScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / TIME_ITEM_HEIGHT);
      const clampedIndex = Math.min(Math.max(index, 0), periods.length - 1);
      if (clampedIndex !== lastReminderPeriodIndexRef.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        lastReminderPeriodIndexRef.current = clampedIndex;
      }
      if (clampedIndex === 0 && reminderHour >= 12) {
        setReminderHour(reminderHour - 12);
      } else if (clampedIndex === 1 && reminderHour < 12) {
        setReminderHour(reminderHour + 12);
      }
    },
    [reminderHour]
  );

  // Render functions for time picker items
  const selectedHourIndex = getHourIndex(selectedHour);
  const selectedMinuteIndex = getMinuteIndex(selectedMinute);
  const selectedPeriodIndex = getPeriodIndex(selectedHour);
  const reminderHourIndex = getHourIndex(reminderHour);
  const reminderMinuteIndex = getMinuteIndex(reminderMinute);
  const reminderPeriodIndex = getPeriodIndex(reminderHour);

  const renderTimeItem = (index: number, selectedIdx: number, label: string) => {
    const distance = Math.abs(index - selectedIdx);
    let opacity = 1;
    if (distance === 1) opacity = 0.4;
    else if (distance === 2) opacity = 0.2;
    else if (distance > 2) opacity = 0.1;
    return (
      <View style={styles.timePickerItem}>
        <Text
          style={[
            styles.timePickerText,
            {
              opacity,
              color: distance === 0 ? colors.text : colors.textTertiary,
              fontFamily: distance === 0 ? fonts.bold : fonts.medium,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    );
  };

  // Scroll picker to correct position when opened
  useEffect(() => {
    if (showTimePicker) {
      setTimeout(() => {
        hourListRef.current?.scrollTo({ y: selectedHourIndex * TIME_ITEM_HEIGHT, animated: false });
        minuteListRef.current?.scrollTo({
          y: selectedMinuteIndex * TIME_ITEM_HEIGHT,
          animated: false,
        });
        periodListRef.current?.scrollTo({
          y: selectedPeriodIndex * TIME_ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, [showTimePicker]);

  useEffect(() => {
    if (showReminderTimePicker) {
      setTimeout(() => {
        reminderHourListRef.current?.scrollTo({
          y: reminderHourIndex * TIME_ITEM_HEIGHT,
          animated: false,
        });
        reminderMinuteListRef.current?.scrollTo({
          y: reminderMinuteIndex * TIME_ITEM_HEIGHT,
          animated: false,
        });
        reminderPeriodListRef.current?.scrollTo({
          y: reminderPeriodIndex * TIME_ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, [showReminderTimePicker]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <BackIcon />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditMode ? t('schedule.editWorkout') : t('schedule.scheduleWorkout')}
        </Text>
        <Pressable
          style={styles.saveButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            handleSave();
          }}
        >
          <Text style={styles.saveButtonText}>{t('schedule.save')}</Text>
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
            <Text style={styles.inputLabel}>{t('schedule.workoutName')}</Text>
            <TextInput
              style={styles.inputField}
              placeholder={t('schedule.enterWorkoutName')}
              placeholderTextColor={colors.textTertiary}
              value={workoutName}
              onChangeText={setWorkoutName}
            />
          </View>

          <Divider />

          {/* Description */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>{t('schedule.description')}</Text>
            <TextInput
              style={styles.inputField}
              placeholder={t('schedule.optional')}
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <Divider />

          {/* Template (required) */}
          <Pressable
            style={styles.menuRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openTemplateModal();
            }}
          >
            <Text style={styles.menuLabel}>{t('schedule.template')}</Text>
            <View style={styles.menuRight}>
              <Text style={[styles.menuValue, styles.menuValueSelected]}>
                {getTemplateDisplayName()}
              </Text>
              <ChevronRight />
            </View>
          </Pressable>

          <Divider />

          {/* Colour */}
          <Pressable
            style={styles.menuRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openColourModal();
            }}
          >
            <Text style={styles.menuLabel}>{t('schedule.colour')}</Text>
            <View style={styles.menuRight}>
              <View style={[styles.colourCircle, { backgroundColor: getSelectedColour() }]} />
              <ChevronRight />
            </View>
          </Pressable>
        </View>

        {/* Date & Time Section */}
        <Text style={styles.sectionHeader}>{t('schedule.dateAndTime')}</Text>
        <View style={styles.card}>
          {/* Date is always required - show calendar header and calendar */}
          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <CalendarIcon />
              <View>
                <Text style={styles.menuLabel}>{t('schedule.date')}</Text>
                <Text style={styles.menuSubLabel}>{formatDate(selectedDate)}</Text>
              </View>
            </View>
          </View>

          <Divider />
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarMonthYear}>
                {MONTH_NAMES[calendarMonth]} {calendarYear}
              </Text>
              <View style={styles.calendarNav}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    goToPrevMonth();
                  }}
                  style={styles.calendarNavButton}
                >
                  <ChevronLeft />
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    goToNextMonth();
                  }}
                  style={styles.calendarNavButton}
                >
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
                    onPress={() => {
                      if (day) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        selectDate(day);
                      }
                    }}
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
                <Text style={styles.menuLabel}>{t('schedule.time')}</Text>
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
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTimeEnabled(value);
                if (value) setShowTimePicker(true);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>

          {timeEnabled && showTimePicker && (
            <>
              <Divider />
              <View style={styles.timePickerContainer}>
                <View style={styles.timePickerColumn}>
                  <ScrollView
                    ref={hourListRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={TIME_ITEM_HEIGHT}
                    decelerationRate="fast"
                    onScroll={onHourScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingVertical: TIME_ITEM_HEIGHT * 2 }}
                    nestedScrollEnabled
                  >
                    {hours.map((hour, index) =>
                      renderTimeItem(index, selectedHourIndex, String(hour))
                    )}
                  </ScrollView>
                </View>

                <View style={styles.timePickerColumn}>
                  <ScrollView
                    ref={minuteListRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={TIME_ITEM_HEIGHT}
                    decelerationRate="fast"
                    onScroll={onMinuteScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingVertical: TIME_ITEM_HEIGHT * 2 }}
                    nestedScrollEnabled
                  >
                    {minutes.map((minute, index) =>
                      renderTimeItem(index, selectedMinuteIndex, minute.toString().padStart(2, '0'))
                    )}
                  </ScrollView>
                </View>

                <View style={styles.timePickerColumn}>
                  <ScrollView
                    ref={periodListRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={TIME_ITEM_HEIGHT}
                    decelerationRate="fast"
                    onScroll={onPeriodScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingVertical: TIME_ITEM_HEIGHT * 2 }}
                    nestedScrollEnabled
                  >
                    {periods.map((period, index) =>
                      renderTimeItem(index, selectedPeriodIndex, period)
                    )}
                  </ScrollView>
                </View>

                <View style={styles.timePickerHighlight} pointerEvents="none" />
              </View>
            </>
          )}
        </View>

        {/* Repeat */}
        <View style={styles.card}>
          <Pressable
            style={styles.menuRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openRepeatModal();
            }}
          >
            <View style={styles.menuLeft}>
              <RepeatIcon />
              <Text style={styles.menuLabel}>{t('schedule.repeat')}</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuValueLight}>
                {getRepeatLabel(repeatOption, selectedRepeatDays, intervalDays)}
              </Text>
              <ChevronUpDown />
            </View>
          </Pressable>
        </View>

        {/* More Options Section */}
        <Text style={styles.sectionHeader}>{t('schedule.moreOptions')}</Text>
        <View style={styles.card}>
          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <BellIcon />
              <Text style={styles.menuLabel}>{t('schedule.remindMe')}</Text>
            </View>
            <Switch
              value={remindEnabled}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRemindEnabled(value);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>

          <Divider />

          <Pressable
            style={styles.menuRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowReminderTimePicker(!showReminderTimePicker);
            }}
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
                <View style={styles.timePickerColumn}>
                  <ScrollView
                    ref={reminderHourListRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={TIME_ITEM_HEIGHT}
                    decelerationRate="fast"
                    onScroll={onReminderHourScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingVertical: TIME_ITEM_HEIGHT * 2 }}
                    nestedScrollEnabled
                  >
                    {hours.map((hour, index) =>
                      renderTimeItem(index, reminderHourIndex, String(hour))
                    )}
                  </ScrollView>
                </View>

                <View style={styles.timePickerColumn}>
                  <ScrollView
                    ref={reminderMinuteListRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={TIME_ITEM_HEIGHT}
                    decelerationRate="fast"
                    onScroll={onReminderMinuteScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingVertical: TIME_ITEM_HEIGHT * 2 }}
                    nestedScrollEnabled
                  >
                    {minutes.map((minute, index) =>
                      renderTimeItem(index, reminderMinuteIndex, minute.toString().padStart(2, '0'))
                    )}
                  </ScrollView>
                </View>

                <View style={styles.timePickerColumn}>
                  <ScrollView
                    ref={reminderPeriodListRef}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={TIME_ITEM_HEIGHT}
                    decelerationRate="fast"
                    onScroll={onReminderPeriodScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingVertical: TIME_ITEM_HEIGHT * 2 }}
                    nestedScrollEnabled
                  >
                    {periods.map((period, index) =>
                      renderTimeItem(index, reminderPeriodIndex, period)
                    )}
                  </ScrollView>
                </View>

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
                <Pressable
                  style={styles.modalCloseButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    closeColourModal();
                  }}
                >
                  <CloseIcon />
                </Pressable>
                <Text style={styles.modalTitle}>{t('schedule.colour')}</Text>
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
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        selectColour(colour.id);
                      }}
                    >
                      <View style={[styles.colourCircleLarge, { backgroundColor: colour.color }]}>
                        {selectedColour === colour.id && (
                          <Ionicons name="checkmark" size={20} color={colors.textInverse} />
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
                <Pressable
                  style={styles.modalCloseButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    closeRepeatModal();
                  }}
                >
                  <CloseIcon />
                </Pressable>
                <Text style={styles.modalTitle}>{t('schedule.repeat')}</Text>
                <View style={styles.modalCloseButton} />
              </View>

              <View style={styles.repeatContainer}>
                <View style={styles.repeatCard}>
                  {/* Repeat Options */}
                  {REPEAT_OPTIONS.map((option, index) => (
                    <View key={option.id}>
                      <Pressable
                        style={styles.repeatOptionRow}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          selectRepeatOption(option.id);
                        }}
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
                        <Text style={styles.customDaysLabel}>{t('schedule.selectDays')}</Text>
                        <View style={styles.daysRow}>
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((letter, index) => (
                            <Pressable
                              key={index}
                              style={[
                                styles.dayCircle,
                                selectedRepeatDays.includes(index) && styles.dayCircleSelected,
                              ]}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                toggleRepeatDay(index);
                              }}
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
                              ? t('schedule.everyDay')
                              : selectedRepeatDays.map((d) => DAY_NAMES[d]).join(', ')}
                          </Text>
                        )}
                      </View>

                      <Pressable
                        style={[
                          styles.doneButton,
                          selectedRepeatDays.length === 0 && styles.doneButtonDisabled,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          closeRepeatModal();
                        }}
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

                  {/* Interval Days Input */}
                  {repeatOption === 'interval' && (
                    <>
                      <View style={styles.customDaysSection}>
                        <Text style={styles.customDaysLabel}>{t('schedule.repeatInterval')}</Text>
                        <View style={styles.intervalRow}>
                          <Text style={styles.intervalLabel}>{t('schedule.every')}</Text>
                          <View style={styles.intervalInputWrapper}>
                            <TextInput
                              style={styles.intervalInput}
                              keyboardType="number-pad"
                              value={String(intervalDays)}
                              onChangeText={(text) => {
                                const num = parseInt(text, 10);
                                if (!isNaN(num) && num >= 2 && num <= 365) {
                                  setIntervalDays(num);
                                } else if (text === '') {
                                  setIntervalDays(2);
                                }
                              }}
                              maxLength={3}
                            />
                          </View>
                          <Text style={styles.intervalLabel}>{t('schedule.days')}</Text>
                        </View>
                        <Text style={styles.selectedDaysPreview}>
                          {t('schedule.everyXDaysFromDate', { count: intervalDays })}
                        </Text>
                      </View>

                      <Pressable
                        style={styles.doneButton}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          closeRepeatModal();
                        }}
                      >
                        <Text style={styles.doneButtonText}>{t('common.done')}</Text>
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
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(null);
                    }}
                  >
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.modalCloseButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      closeTemplateModal();
                    }}
                  >
                    <CloseIcon />
                  </Pressable>
                )}
                <Text style={styles.modalTitle}>
                  {selectedCategory
                    ? getCategoryLabel(selectedCategory)
                    : t('schedule.selectTemplate')}
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
                        style={[
                          styles.templateRow,
                          template.tagColor && { backgroundColor: template.tagColor + '30' },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          selectTemplate(template, false);
                        }}
                      >
                        <View style={styles.templateImageContainer}>
                          {template.localImage ? (
                            <Image
                              source={template.localImage}
                              style={[
                                styles.templateImage,
                                template.tagColor && { backgroundColor: template.tagColor + '30' },
                              ]}
                            />
                          ) : template.image?.uri ? (
                            <Image
                              source={{ uri: template.image.uri }}
                              style={[
                                styles.templateImage,
                                template.tagColor && { backgroundColor: template.tagColor + '30' },
                              ]}
                            />
                          ) : (
                            <View
                              style={[
                                styles.templateImagePlaceholder,
                                template.tagColor && { backgroundColor: template.tagColor + '30' },
                              ]}
                            >
                              <Ionicons
                                name="barbell-outline"
                                size={24}
                                color={template.tagColor || colors.textSecondary}
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
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            selectTemplate(template, false);
                          }}
                        >
                          <Text style={styles.scheduleButtonText}>{t('schedule.schedule')}</Text>
                        </Pressable>
                      </Pressable>
                    ))}
                    {categoryTemplates.length === 0 && (
                      <View style={styles.emptyCategory}>
                        <Ionicons name="fitness-outline" size={48} color={colors.border} />
                        <Text style={styles.emptyCategoryText}>
                          {t('schedule.noWorkoutsInCategory')}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    {/* No Template Option */}
                    <Pressable
                      style={styles.templateRow}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        selectTemplate(null, true);
                      }}
                    >
                      <View style={styles.templateInfo}>
                        <Text style={styles.templateName}>{t('schedule.noTemplate')}</Text>
                        <Text style={styles.templateMeta}>
                          {t('schedule.startWithoutTemplate')}
                        </Text>
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
                        <Text style={styles.templateSectionHeader}>
                          {t('schedule.yourTemplates')}
                        </Text>
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
                                  style={[
                                    styles.templateRow,
                                    template.tagColor && {
                                      backgroundColor: template.tagColor + '30',
                                    },
                                  ]}
                                  onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    selectTemplate(template, false);
                                  }}
                                >
                                  <View style={styles.templateImageContainer}>
                                    {template.localImage ? (
                                      <Image
                                        source={template.localImage}
                                        style={[
                                          styles.templateImage,
                                          template.tagColor && {
                                            backgroundColor: template.tagColor + '30',
                                          },
                                        ]}
                                      />
                                    ) : template.image?.uri ? (
                                      <Image
                                        source={{ uri: template.image.uri }}
                                        style={[
                                          styles.templateImage,
                                          template.tagColor && {
                                            backgroundColor: template.tagColor + '30',
                                          },
                                        ]}
                                      />
                                    ) : (
                                      <View
                                        style={[
                                          styles.templateImagePlaceholder,
                                          template.tagColor && {
                                            backgroundColor: template.tagColor + '30',
                                          },
                                        ]}
                                      >
                                        <Ionicons
                                          name="barbell-outline"
                                          size={24}
                                          color={template.tagColor || colors.textSecondary}
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
                                    onPress={() => {
                                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                      selectTemplate(template, false);
                                    }}
                                  >
                                    <Text style={styles.scheduleButtonText}>
                                      {t('schedule.schedule')}
                                    </Text>
                                  </Pressable>
                                </Pressable>
                              ))}
                            </View>
                          );
                        })}
                      </>
                    )}

                    {/* Align Templates - Category Grid */}
                    <Text style={styles.templateSectionHeader}>{t('schedule.alignTemplates')}</Text>
                    <View style={styles.categoryGrid}>
                      {ALL_CATEGORIES.map((category) => {
                        const count = getCategoryCount(category.id);
                        const heroImage = CATEGORY_HERO_IMAGES[category.id];
                        return (
                          <Pressable
                            key={category.id}
                            style={styles.categoryCard}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setSelectedCategory(category.id);
                            }}
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
                              <Text style={styles.categoryCardCount}>
                                {t('schedule.countWorkouts', { count })}
                              </Text>
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
    flexDirection: 'row' as const,
    height: TIME_PICKER_HEIGHT,
    paddingHorizontal: spacing.xl,
    position: 'relative' as const,
  },
  timePickerColumn: {
    flex: 1,
    overflow: 'hidden' as const,
  },
  timePickerItem: {
    height: TIME_ITEM_HEIGHT,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  timePickerText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.lg,
    color: colors.textTertiary,
  },
  timePickerHighlight: {
    position: 'absolute' as const,
    left: spacing.md,
    right: spacing.md,
    top: TIME_ITEM_HEIGHT * 2,
    height: TIME_ITEM_HEIGHT,
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
  intervalRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 217, 217, 0.25)',
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
    gap: 10,
  },
  intervalLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  intervalInputWrapper: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 56,
    alignItems: 'center' as const,
  },
  intervalInput: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.primary,
    textAlign: 'center' as const,
    padding: 0,
    minWidth: 28,
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
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  scheduleButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: '#000000',
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
    color: colors.textInverse,
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
