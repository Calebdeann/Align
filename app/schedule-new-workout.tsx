import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  Alert,
  type ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useWorkoutStore, type ScheduledWorkout } from '@/stores/workoutStore';
import {
  useTemplateStore,
  type WorkoutTemplate,
  type TemplateFolder,
  DEFAULT_FOLDER_ID,
} from '@/stores/templateStore';
import { saveScheduledWorkoutToBackend } from '@/services/api/scheduledWorkouts';
import { getProgram, WORKOUT_TYPE_COLORS, type ProgramWorkout } from '@/data/programs';
import { getPlanSquareImage } from '@/data/programs/planImages';

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
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type RepeatType = ScheduledWorkout['repeat']['type'];
const REPEAT_OPTIONS: { id: RepeatType; label: string }[] = [
  { id: 'never', label: 'Never' },
  { id: 'daily', label: 'Every day' },
  { id: 'weekly', label: 'Every week' },
  { id: 'biweekly', label: 'Every 2 weeks' },
  { id: 'monthly', label: 'Every month' },
  { id: 'custom', label: 'Custom days' },
  { id: 'interval', label: 'Every X days' },
];

type SelectedTemplate =
  | { source: 'user'; template: WorkoutTemplate }
  | { source: 'plan'; workout: ProgramWorkout };

// ─── Helpers (mirrors schedule-workout.tsx — unify into src/utils/calendar.ts later) ──

function generateCalendarMonth(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) week.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatPretty(d: Date): string {
  const today = new Date();
  if (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
    return 'Today';
  return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

function getRepeatLabel(type: RepeatType, customDays: number[], intervalDays: number): string {
  if (type === 'never') return 'Never';
  if (type === 'custom') {
    if (customDays.length === 0) return 'Custom';
    if (customDays.length === 7) return 'Every day';
    return customDays.map((d) => DAY_NAMES[d].slice(0, 3)).join(', ');
  }
  if (type === 'interval') return `Every ${intervalDays} days`;
  const map: Record<Exclude<RepeatType, 'never' | 'custom' | 'interval'>, string> = {
    daily: 'Every day',
    weekly: 'Every week',
    biweekly: 'Every 2 weeks',
    monthly: 'Every month',
  };
  return map[type as 'daily' | 'weekly' | 'biweekly' | 'monthly'];
}

// ─── Reusable inline calendar ────────────────────────────────────────────────

function InlineCalendar({
  year,
  month,
  selected,
  onChangeMonth,
  onSelect,
  minDate,
}: {
  year: number;
  month: number;
  selected: Date | null;
  onChangeMonth: (year: number, month: number) => void;
  onSelect: (d: Date) => void;
  minDate?: Date;
}) {
  const weeks = useMemo(() => generateCalendarMonth(year, month), [year, month]);
  const today = new Date();

  const prev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (month === 0) onChangeMonth(year - 1, 11);
    else onChangeMonth(year, month - 1);
  };
  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (month === 11) onChangeMonth(year + 1, 0);
    else onChangeMonth(year, month + 1);
  };

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarMonthYear}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <View style={styles.calendarNav}>
          <Pressable onPress={prev} style={styles.calendarNavButton}>
            <Ionicons name="chevron-back" size={20} color="#000" />
          </Pressable>
          <Pressable onPress={next} style={styles.calendarNavButton}>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </Pressable>
        </View>
      </View>

      <View style={styles.calendarDayHeaders}>
        {DAY_LETTERS.map((d, i) => (
          <Text key={i} style={styles.calendarDayHeader}>
            {d}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.calendarWeek}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={styles.calendarDay} />;
            const cellDate = new Date(year, month, day);
            const isSelected =
              selected &&
              selected.getFullYear() === year &&
              selected.getMonth() === month &&
              selected.getDate() === day;
            const isTodayCell =
              today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const isDisabled = minDate
              ? cellDate < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
              : false;

            return (
              <Pressable
                key={di}
                style={styles.calendarDay}
                onPress={() => {
                  if (isDisabled) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  onSelect(cellDate);
                }}
                disabled={isDisabled}
              >
                <View style={[styles.calendarDayContent, isSelected && styles.calendarDaySelected]}>
                  <Text
                    style={[
                      styles.calendarDayText,
                      isSelected && styles.calendarDayTextSelected,
                      isTodayCell && !isSelected && styles.calendarDayTextToday,
                      isDisabled && styles.calendarDayTextDisabled,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Template thumbnail (used by the chosen-template card + picker rows) ────

function TemplateThumbnail({
  source,
  size,
  rotate,
}: {
  source: ImageSourcePropType | { uri: string } | null;
  size: { width: number; height: number; radius: number };
  rotate: string;
}) {
  return (
    <View
      style={[
        {
          width: size.width,
          height: size.height,
          borderRadius: size.radius,
          overflow: 'hidden',
          backgroundColor: '#e0e0e0',
          transform: [{ rotate }],
        },
      ]}
    >
      {source ? (
        <Image
          source={source as ImageSourcePropType}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]}>
          <Ionicons name="barbell-outline" size={size.width * 0.32} color="rgba(0,0,0,0.4)" />
        </View>
      )}
    </View>
  );
}

function resolveUserTemplateImageSource(
  t: WorkoutTemplate
): ImageSourcePropType | { uri: string } | null {
  if (t.localImage) return t.localImage;
  if (t.image?.uri) return { uri: t.image.uri };
  return null;
}

function resolvePlanWorkoutImageSource(
  w: ProgramWorkout
): ImageSourcePropType | { uri: string } | null {
  return getPlanSquareImage(w.id);
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ScheduleNewWorkoutScreen() {
  const userId = useUserProfileStore((s) => s.userId);
  const planId = useUserProfileStore((s) => s.profile?.plan_id) ?? null;
  const addWorkout = useWorkoutStore((s) => s.addWorkout);
  const userTemplates = useTemplateStore((s) => s.templates);
  const folders = useTemplateStore((s) => s.folders);

  const planProgram = useMemo(() => (planId ? getProgram(planId) : null), [planId]);

  // Plan workouts: one card per workout day in the FIRST cycle, mirroring the
  // dedup used by app/start-workout-sheet.tsx — without the slice we'd render
  // the same templates repeated for every week of the program.
  const planWorkouts = useMemo<ProgramWorkout[]>(() => {
    if (!planProgram) return [];
    return planProgram.days
      .slice(0, planProgram.daysPerWeek)
      .map((day) => day.workouts[0])
      .filter((w): w is ProgramWorkout => !!w && w.exercises.length > 0);
  }, [planProgram]);

  // Folder grouping for My Templates. Skip plan-folder-prefixed folders
  // (start-workout-sheet.tsx auto-creates `plan-folder:<planId>` containers
  // for the user's current plan; those belong under Plan Templates, not here).
  const myFolderGroups = useMemo<{ folder: TemplateFolder; templates: WorkoutTemplate[] }[]>(() => {
    const groups: { folder: TemplateFolder; templates: WorkoutTemplate[] }[] = [];
    const seenTemplateIds = new Set<string>();
    for (const f of folders) {
      if (f.id.startsWith('plan-folder:')) continue;
      const inFolder = userTemplates.filter((t) =>
        f.id === DEFAULT_FOLDER_ID
          ? t.folderId === DEFAULT_FOLDER_ID || !t.folderId
          : t.folderId === f.id
      );
      inFolder.forEach((t) => seenTemplateIds.add(t.id));
      if (inFolder.length > 0) groups.push({ folder: f, templates: inFolder });
    }
    // Any templates not surfaced by a folder (e.g. their folderId points at a
    // plan-folder which we filtered out, or a folder that was deleted) fall
    // through here so the picker never silently hides them.
    const orphans = userTemplates.filter(
      (t) => !seenTemplateIds.has(t.id) && !(t.folderId && t.folderId.startsWith('plan-folder:'))
    );
    if (orphans.length > 0) {
      groups.push({
        folder: { id: '__orphans', name: 'Other', createdAt: '', isCollapsed: false },
        templates: orphans,
      });
    }
    return groups;
  }, [folders, userTemplates]);

  const hasMyTemplates = myFolderGroups.length > 0;

  // Selected template (user-template OR plan-workout)
  const [selected, setSelected] = useState<SelectedTemplate | null>(null);

  // Template picker bottom sheet
  const [showTemplateSheet, setShowTemplateSheet] = useState(false);
  const templateSheetSlide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Date
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth());

  // Repeat
  const [repeatType, setRepeatType] = useState<RepeatType>('never');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [intervalDays, setIntervalDays] = useState(2);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const repeatSlide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // End repeat
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [endCalendarYear, setEndCalendarYear] = useState(now.getFullYear());
  const [endCalendarMonth, setEndCalendarMonth] = useState(now.getMonth());
  const [showEndRepeatModal, setShowEndRepeatModal] = useState(false);
  const endRepeatSlide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Saving guard
  const [saving, setSaving] = useState(false);

  // Clear end date if user switches back to "Never"
  useEffect(() => {
    if (repeatType === 'never') setEndDate(null);
  }, [repeatType]);

  // ── Template picker open/close ──────────────────────────────────────────────

  const openTemplateSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowTemplateSheet(true);
    Animated.spring(templateSheetSlide, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };
  const closeTemplateSheet = () => {
    Animated.timing(templateSheetSlide, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowTemplateSheet(false));
  };

  const handleSelectUser = (t: WorkoutTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelected({ source: 'user', template: t });
    closeTemplateSheet();
  };
  const handleSelectPlan = (w: ProgramWorkout) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelected({ source: 'plan', workout: w });
    closeTemplateSheet();
  };

  // ── Repeat modal open/close ─────────────────────────────────────────────────

  const openRepeatModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowRepeatModal(true);
    Animated.spring(repeatSlide, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };
  const closeRepeatModal = () => {
    Animated.timing(repeatSlide, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowRepeatModal(false));
  };

  const openEndRepeatModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setEndCalendarYear((endDate ?? selectedDate).getFullYear());
    setEndCalendarMonth((endDate ?? selectedDate).getMonth());
    setShowEndRepeatModal(true);
    Animated.spring(endRepeatSlide, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };
  const closeEndRepeatModal = () => {
    Animated.timing(endRepeatSlide, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowEndRepeatModal(false));
  };

  const toggleCustomDay = (i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCustomDays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort()));
  };

  const handleSelectRepeat = (id: RepeatType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setRepeatType(id);
    if (id !== 'custom' && id !== 'interval') closeRepeatModal();
  };

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (saving) return;
    if (!userId) {
      Alert.alert('Not signed in', 'Sign in to schedule a workout.');
      return;
    }
    if (!selected) {
      Alert.alert('Choose a template', 'Pick a template first to schedule it.');
      return;
    }
    setSaving(true);

    const repeatField: ScheduledWorkout['repeat'] = {
      type: repeatType,
      ...(repeatType === 'custom' ? { customDays } : {}),
      ...(repeatType === 'interval' ? { intervalDays } : {}),
    };

    let workoutData: Omit<ScheduledWorkout, 'id' | 'createdAt' | 'completedDates'>;

    if (selected.source === 'user') {
      const t = selected.template;
      workoutData = {
        userId,
        name: t.name,
        description: t.description || undefined,
        image: t.image,
        tagId: 'purple',
        tagColor: t.tagColor || colors.primary,
        templateName: t.name,
        templateId: t.id,
        date: dateKey(selectedDate),
        repeat: repeatField,
        ...(endDate ? { endDate: dateKey(endDate) } : {}),
      };
    } else {
      const w = selected.workout;
      workoutData = {
        userId,
        name: w.title,
        description: w.description || undefined,
        image: undefined,
        tagId: 'purple',
        tagColor: WORKOUT_TYPE_COLORS[w.type] ?? colors.primary,
        templateName: w.title,
        date: dateKey(selectedDate),
        repeat: repeatField,
        ...(planId ? { planId } : {}),
        programWorkoutId: w.id,
        ...(endDate ? { endDate: dateKey(endDate) } : {}),
      };
    }

    addWorkout(workoutData);

    // Persist to Supabase — fire-and-forget per backend-rules.md. addWorkout
    // already created an id/createdAt in the store; we reflect those by
    // forwarding the freshest scheduled-workouts snapshot back.
    const freshest = useWorkoutStore
      .getState()
      .scheduledWorkouts.find(
        (w) =>
          w.userId === userId &&
          w.name === workoutData.name &&
          w.date === workoutData.date &&
          w.createdAt
      );
    if (freshest) {
      saveScheduledWorkoutToBackend(freshest).catch((err) =>
        console.warn('[schedule-new-workout] backend save failed', err)
      );
    }

    router.back();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const selectedImageSource =
    selected?.source === 'user'
      ? resolveUserTemplateImageSource(selected.template)
      : selected?.source === 'plan'
        ? resolvePlanWorkoutImageSource(selected.workout)
        : null;

  const selectedTitle =
    selected?.source === 'user'
      ? selected.template.name
      : selected?.source === 'plan'
        ? selected.workout.title
        : null;

  const selectedDescription =
    selected?.source === 'user'
      ? selected.template.description
      : selected?.source === 'plan'
        ? selected.workout.description
        : null;

  const saveDisabled = saving || !selected;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          }}
          hitSlop={8}
        >
          <Ionicons name="close" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Schedule Workout</Text>
        <Pressable
          style={[styles.headerButton, styles.headerSaveBtn]}
          onPress={handleSave}
          disabled={saveDisabled}
          hitSlop={8}
        >
          <Text style={[styles.headerSaveText, saveDisabled && { opacity: 0.4 }]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Choose Template card */}
        <Pressable
          style={({ pressed }) => [styles.chooseCard, pressed && { opacity: 0.7 }]}
          onPress={openTemplateSheet}
        >
          <View style={styles.chooseRow}>
            <TemplateThumbnail
              source={selectedImageSource}
              size={{ width: 96, height: 116, radius: 14 }}
              rotate="-2.5deg"
            />
            <View style={styles.chooseTextCol}>
              {selected ? (
                <>
                  <Text style={styles.chooseTitle} numberOfLines={2}>
                    {selectedTitle}
                  </Text>
                  {selectedDescription ? (
                    <Text style={styles.chooseDescription} numberOfLines={3}>
                      {selectedDescription}
                    </Text>
                  ) : (
                    <Text style={styles.chooseSubtle}>
                      {selected.source === 'plan' ? 'From your plan' : 'My template'}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.choosePlaceholderTitle}>Choose template</Text>
                  <Text style={styles.chooseSubtle}>Tap to pick one</Text>
                </>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.35)" />
          </View>
        </Pressable>

        {/* Date + inline calendar */}
        <Text style={styles.sectionHeader}>Date</Text>
        <View style={styles.card}>
          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <Ionicons name="calendar-outline" size={20} color="#000" />
              <View>
                <Text style={styles.menuLabel}>Date</Text>
                <Text style={styles.menuSubLabel}>{formatPretty(selectedDate)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <InlineCalendar
            year={calendarYear}
            month={calendarMonth}
            selected={selectedDate}
            onChangeMonth={(y, m) => {
              setCalendarYear(y);
              setCalendarMonth(m);
            }}
            onSelect={(d) => setSelectedDate(d)}
          />
        </View>

        {/* Repeat */}
        <View style={styles.card}>
          <Pressable style={styles.menuRow} onPress={openRepeatModal}>
            <View style={styles.menuLeft}>
              <Ionicons name="repeat-outline" size={20} color="#000" />
              <Text style={styles.menuLabel}>Repeat</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuValueLight}>
                {getRepeatLabel(repeatType, customDays, intervalDays)}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.35)" />
            </View>
          </Pressable>
        </View>

        {/* End repeat (only when repeat != never) */}
        {repeatType !== 'never' && (
          <View style={styles.card}>
            <Pressable style={styles.menuRow} onPress={openEndRepeatModal}>
              <View style={styles.menuLeft}>
                <Ionicons name="calendar-clear-outline" size={20} color="#000" />
                <Text style={styles.menuLabel}>End repeat</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.menuValueLight}>
                  {endDate ? formatPretty(endDate) : 'Never'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.35)" />
              </View>
            </Pressable>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Template picker bottom sheet ── */}
      <Modal
        visible={showTemplateSheet}
        transparent
        animationType="none"
        onRequestClose={closeTemplateSheet}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            closeTemplateSheet();
          }}
        >
          <Animated.View
            style={[
              styles.modalContent,
              styles.templateSheet,
              { transform: [{ translateY: templateSheetSlide }] },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View style={styles.modalCloseSpacer} />
                <Text style={styles.modalTitle}>Choose template</Text>
                <Pressable
                  style={styles.modalCloseSpacer}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    closeTemplateSheet();
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={22} color="#000" />
                </Pressable>
              </View>

              <ScrollView
                style={styles.templateSheetScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 12 }}
              >
                {!hasMyTemplates && planWorkouts.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="barbell-outline" size={32} color="rgba(0,0,0,0.25)" />
                    <Text style={styles.emptyStateText}>
                      No templates yet. Create one from the + menu.
                    </Text>
                  </View>
                )}

                {hasMyTemplates && (
                  <>
                    <Text style={styles.pickerSectionHeader}>My Templates</Text>
                    {myFolderGroups.map((group) => (
                      <View key={group.folder.id} style={styles.folderGroup}>
                        <View style={styles.folderHeader}>
                          <Ionicons name="folder-outline" size={14} color="rgba(0,0,0,0.45)" />
                          <Text style={styles.folderHeaderText} numberOfLines={1}>
                            {group.folder.name}
                          </Text>
                        </View>
                        <View style={styles.pickerList}>
                          {group.templates.map((t, i) => {
                            const isSelected =
                              selected?.source === 'user' && selected.template.id === t.id;
                            return (
                              <Pressable
                                key={t.id}
                                style={({ pressed }) => [
                                  styles.pickerRow,
                                  pressed && { opacity: 0.7 },
                                ]}
                                onPress={() => handleSelectUser(t)}
                              >
                                <TemplateThumbnail
                                  source={resolveUserTemplateImageSource(t)}
                                  size={{ width: 48, height: 56, radius: 10 }}
                                  rotate={i % 2 === 0 ? '-2.5deg' : '2.5deg'}
                                />
                                <View style={styles.pickerInfo}>
                                  <Text style={styles.pickerName} numberOfLines={1}>
                                    {t.name}
                                  </Text>
                                  <Text style={styles.pickerMeta} numberOfLines={1}>
                                    {t.exercises.length} exercises
                                  </Text>
                                </View>
                                {isSelected && <Ionicons name="checkmark" size={22} color="#000" />}
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </>
                )}

                {planWorkouts.length > 0 && (
                  <>
                    <Text style={styles.pickerSectionHeader}>Plan Templates</Text>
                    <View style={styles.pickerList}>
                      {planWorkouts.map((w, i) => {
                        const isSelected =
                          selected?.source === 'plan' && selected.workout.id === w.id;
                        return (
                          <Pressable
                            key={w.id}
                            style={({ pressed }) => [styles.pickerRow, pressed && { opacity: 0.7 }]}
                            onPress={() => handleSelectPlan(w)}
                          >
                            <TemplateThumbnail
                              source={resolvePlanWorkoutImageSource(w)}
                              size={{ width: 48, height: 56, radius: 10 }}
                              rotate={i % 2 === 0 ? '2deg' : '-2deg'}
                            />
                            <View style={styles.pickerInfo}>
                              <Text style={styles.pickerName} numberOfLines={1}>
                                {w.title}
                              </Text>
                              <Text style={styles.pickerMeta} numberOfLines={1}>
                                {w.exercises.length} exercises
                              </Text>
                            </View>
                            {isSelected && <Ionicons name="checkmark" size={22} color="#000" />}
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── Repeat modal ── */}
      <Modal
        visible={showRepeatModal}
        transparent
        animationType="none"
        onRequestClose={closeRepeatModal}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            closeRepeatModal();
          }}
        >
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateY: repeatSlide }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View style={styles.modalCloseSpacer} />
                <Text style={styles.modalTitle}>Repeat</Text>
                <Pressable
                  style={styles.modalCloseSpacer}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    closeRepeatModal();
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={22} color="#000" />
                </Pressable>
              </View>

              <View style={styles.repeatCard}>
                {REPEAT_OPTIONS.map((option, index) => (
                  <View key={option.id}>
                    <Pressable
                      style={styles.repeatOptionRow}
                      onPress={() => handleSelectRepeat(option.id)}
                    >
                      <Text
                        style={[
                          styles.repeatOptionText,
                          repeatType === option.id && styles.repeatOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {repeatType === option.id && (
                        <Ionicons name="checkmark" size={20} color="#000" />
                      )}
                    </Pressable>
                    {index < REPEAT_OPTIONS.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}

                {repeatType === 'custom' && (
                  <>
                    <View style={styles.customDaysSection}>
                      <Text style={styles.customDaysLabel}>Select days</Text>
                      <View style={styles.daysRow}>
                        {DAY_LETTERS.map((letter, i) => (
                          <Pressable
                            key={i}
                            style={[
                              styles.dayCircle,
                              customDays.includes(i) && styles.dayCircleSelected,
                            ]}
                            onPress={() => toggleCustomDay(i)}
                          >
                            <Text
                              style={[
                                styles.dayCircleText,
                                customDays.includes(i) && styles.dayCircleTextSelected,
                              ]}
                            >
                              {letter}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    <Pressable
                      style={[
                        styles.doneButton,
                        customDays.length === 0 && styles.doneButtonDisabled,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        closeRepeatModal();
                      }}
                      disabled={customDays.length === 0}
                    >
                      <Text
                        style={[
                          styles.doneButtonText,
                          customDays.length === 0 && styles.doneButtonTextDisabled,
                        ]}
                      >
                        Done
                      </Text>
                    </Pressable>
                  </>
                )}

                {repeatType === 'interval' && (
                  <>
                    <View style={styles.customDaysSection}>
                      <Text style={styles.customDaysLabel}>Repeat every</Text>
                      <View style={styles.intervalRow}>
                        <Text style={styles.intervalLabel}>Every</Text>
                        <View style={styles.intervalInputWrapper}>
                          <TextInput
                            autoCorrect={false}
                            style={styles.intervalInput}
                            keyboardType="number-pad"
                            value={String(intervalDays)}
                            onChangeText={(text) => {
                              const n = parseInt(text, 10);
                              if (!isNaN(n) && n >= 2 && n <= 365) setIntervalDays(n);
                              else if (text === '') setIntervalDays(2);
                            }}
                            maxLength={3}
                          />
                        </View>
                        <Text style={styles.intervalLabel}>days</Text>
                      </View>
                    </View>

                    <Pressable
                      style={styles.doneButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        closeRepeatModal();
                      }}
                    >
                      <Text style={styles.doneButtonText}>Done</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── End repeat modal ── */}
      <Modal
        visible={showEndRepeatModal}
        transparent
        animationType="none"
        onRequestClose={closeEndRepeatModal}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            closeEndRepeatModal();
          }}
        >
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateY: endRepeatSlide }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View style={styles.modalCloseSpacer} />
                <Text style={styles.modalTitle}>End repeat</Text>
                <Pressable
                  style={styles.modalCloseSpacer}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    closeEndRepeatModal();
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={22} color="#000" />
                </Pressable>
              </View>

              <View style={styles.repeatCard}>
                <Pressable
                  style={styles.repeatOptionRow}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setEndDate(null);
                    closeEndRepeatModal();
                  }}
                >
                  <Text
                    style={[styles.repeatOptionText, !endDate && styles.repeatOptionTextSelected]}
                  >
                    Never
                  </Text>
                  {!endDate && <Ionicons name="checkmark" size={20} color="#000" />}
                </Pressable>
                <View style={styles.divider} />
                <View style={{ paddingTop: spacing.sm }}>
                  <InlineCalendar
                    year={endCalendarYear}
                    month={endCalendarMonth}
                    selected={endDate}
                    onChangeMonth={(y, m) => {
                      setEndCalendarYear(y);
                      setEndCalendarMonth(m);
                    }}
                    onSelect={(d) => {
                      setEndDate(d);
                      closeEndRepeatModal();
                    }}
                    minDate={selectedDate}
                  />
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerButton: {
    minWidth: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSaveBtn: { paddingHorizontal: 8 },
  headerSaveText: { fontFamily: fonts.semiBold, fontSize: 16, color: '#000' },
  headerTitle: { fontFamily: fonts.bold, fontSize: 18, color: '#000' },

  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  // Choose template card
  chooseCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  chooseRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  chooseTextCol: { flex: 1, justifyContent: 'center', gap: 4 },
  chooseTitle: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.text },
  choosePlaceholderTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  chooseDescription: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  chooseSubtle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(0,0,0,0.45)',
  },

  // Section header
  sectionHeader: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },

  // Cards & rows
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuLabel: { fontFamily: fonts.semiBold, fontSize: 16, color: '#000' },
  menuSubLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 2,
  },
  menuValueLight: { fontFamily: fonts.medium, fontSize: 15, color: 'rgba(0,0,0,0.5)' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.1)' },

  // Inline calendar
  calendarContainer: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4 },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  calendarMonthYear: { fontFamily: fonts.semiBold, fontSize: 16, color: '#000' },
  calendarNav: { flexDirection: 'row', gap: 6 },
  calendarNavButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayHeaders: { flexDirection: 'row' },
  calendarDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
    paddingVertical: 6,
  },
  calendarWeek: { flexDirection: 'row' },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayContent: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDaySelected: { backgroundColor: '#000' },
  calendarDayText: { fontFamily: fonts.medium, fontSize: 15, color: '#000' },
  calendarDayTextSelected: { color: '#fff', fontFamily: fonts.semiBold },
  calendarDayTextToday: { color: '#000', fontFamily: fonts.bold },
  calendarDayTextDisabled: { color: 'rgba(0,0,0,0.2)' },

  // Thumbnail placeholder (inside TemplateThumbnail)
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
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
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalCloseSpacer: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontFamily: fonts.bold, fontSize: 17, color: '#000' },

  // Template picker sheet
  templateSheet: { maxHeight: SCREEN_HEIGHT * 0.85 },
  templateSheetScroll: { paddingHorizontal: 16 },
  pickerSectionHeader: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  pickerList: { gap: 8, marginBottom: spacing.md },
  folderGroup: { marginBottom: spacing.sm },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  folderHeaderText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: 'rgba(0,0,0,0.55)',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  pickerInfo: { flex: 1, gap: 2 },
  pickerName: { fontFamily: fonts.semiBold, fontSize: 15, color: '#000' },
  pickerMeta: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(0,0,0,0.5)' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 48,
  },
  emptyStateText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Repeat modal content
  repeatCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    overflow: 'hidden',
  },
  repeatOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  repeatOptionText: { fontFamily: fonts.medium, fontSize: 16, color: '#000' },
  repeatOptionTextSelected: { fontFamily: fonts.semiBold },

  customDaysSection: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  customDaysLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  dayCircleSelected: { backgroundColor: '#000', borderColor: '#000' },
  dayCircleText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#000' },
  dayCircleTextSelected: { color: '#fff' },

  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  intervalLabel: { fontFamily: fonts.medium, fontSize: 16, color: '#000' },
  intervalInputWrapper: {
    minWidth: 64,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  intervalInput: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
  },

  doneButton: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingVertical: 14,
    backgroundColor: '#000',
    borderRadius: 14,
    alignItems: 'center',
  },
  doneButtonDisabled: { backgroundColor: 'rgba(0,0,0,0.2)' },
  doneButtonText: { fontFamily: fonts.semiBold, fontSize: 16, color: '#fff' },
  doneButtonTextDisabled: { color: 'rgba(255,255,255,0.7)' },
});
