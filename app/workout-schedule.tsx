import { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  Animated,
  Easing,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { Image as CachedImage } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing } from '@/constants/theme';
import CircleBackButton from '@/components/ui/CircleBackButton';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useWorkoutStore, workoutDaysToWeekdays } from '@/stores/workoutStore';
import { getProgram, getProgramWorkout } from '@/data/programs';
import { getPlanById } from '@/data/plans';
import { getPlanSquareImage } from '@/data/programs/planImages';
import { WORKOUT_DAYS, MIN_WORKOUT_DAYS } from '@/constants/workoutDays';

// All 7 weekdays in calendar order (Mon → Sun). Reuses WORKOUT_DAYS so the
// colours match onboarding exactly.
const ALL_DAYS = WORKOUT_DAYS;
type Assignments = Record<string, number>; // weekday name → 1-indexed cycle position

// Sort weekday names by their position in WORKOUT_DAYS (i.e. Mon..Sun calendar order).
function sortByWeekday(names: string[]): string[] {
  const order = new Map(ALL_DAYS.map((d, i) => [d.name, i]));
  return [...names].sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99));
}

// Map weekday number (0-6, Sun-Sat) → weekday name used in our Assignments.
const WEEKDAY_NUM_TO_NAME: string[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// Derive an assignments map from the user's actually-seeded scheduled workouts
// for this plan. The calendar/list view renders these rows, so deriving from
// them guarantees the Workout Schedule screen reflects the same reality.
// Returns null when no plan workouts are seeded for the user (in the next 14
// days, generously) — caller should fall back to profile fields.
function deriveAssignmentsFromSeeded(
  scheduled: { userId: string; planId?: string; date: string; programWorkoutId?: string }[],
  userId: string | null,
  planId: string | undefined,
  maxSlots: number
): Assignments | null {
  if (!userId || !planId) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 14);
  const horizonKey = horizon.toISOString().slice(0, 10);
  const todayKey = today.toISOString().slice(0, 10);

  const out: Assignments = {};
  const usedSlots = new Set<number>();
  for (const w of scheduled) {
    if (w.userId !== userId || w.planId !== planId || !w.programWorkoutId) continue;
    if (w.date < todayKey || w.date > horizonKey) continue;
    const pw = getProgramWorkout(w.programWorkoutId);
    const slot = pw?.dayInWeek;
    if (typeof slot !== 'number' || slot < 1 || slot > maxSlots) continue;
    if (usedSlots.has(slot)) continue;
    // Parse date as local YYYY-MM-DD to avoid TZ shifts on getDay.
    const [y, m, d] = w.date.split('-').map(Number);
    if (!y || !m || !d) continue;
    const weekday = new Date(y, m - 1, d).getDay();
    const name = WEEKDAY_NUM_TO_NAME[weekday];
    if (!name || out[name] !== undefined) continue;
    out[name] = slot;
    usedSlots.add(slot);
  }
  return Object.keys(out).length > 0 ? out : null;
}

// Build the initial assignment map. Priority:
//   1. Actually-seeded scheduled workouts (matches what's on the calendar).
//   2. profile.workout_day_assignments (user's saved override).
//   3. Sorted-positional from profile.workout_days.
// All three are clamped to `maxSlots` (= program.daysPerWeek) and slot
// values are de-duped (lowest weekday wins).
function buildInitialAssignments({
  scheduled,
  userId,
  planId,
  workoutDays,
  saved,
  maxSlots,
}: {
  scheduled: { userId: string; planId?: string; date: string; programWorkoutId?: string }[];
  userId: string | null;
  planId: string | undefined;
  workoutDays: string[] | undefined;
  saved: Assignments | null | undefined;
  maxSlots: number;
}): Assignments {
  // 1. Derive from scheduled_workouts (source of truth on the calendar).
  const fromSeeded = deriveAssignmentsFromSeeded(scheduled, userId, planId, maxSlots);
  if (fromSeeded) return fromSeeded;

  // 2. Saved profile override.
  if (saved && Object.keys(saved).length > 0) {
    const sortedEntries = Object.entries(saved).sort((a, b) => {
      const order = new Map(ALL_DAYS.map((d, i) => [d.name, i]));
      return (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99);
    });
    const out: Assignments = {};
    const usedSlots = new Set<number>();
    for (const [day, slot] of sortedEntries) {
      if (typeof slot !== 'number' || !Number.isInteger(slot)) continue;
      if (slot < 1 || slot > maxSlots) continue;
      if (usedSlots.has(slot)) continue;
      out[day] = slot;
      usedSlots.add(slot);
    }
    return out;
  }

  // 3. Sorted-positional from workout_days.
  const sorted = sortByWeekday(workoutDays ?? []).slice(0, maxSlots);
  const out: Assignments = {};
  sorted.forEach((d, i) => {
    out[d] = i + 1;
  });
  return out;
}

// Look up the week-1 workout summary for a 1-indexed cycle position.
// Returns null if the program has no slot at that index.
function summaryForPosition(planId: string | undefined, position: number): string | null {
  if (!planId || position < 1) return null;
  const program = getProgram(planId);
  if (!program) return null;
  const day = program.days[position - 1];
  if (!day) return null;
  return day.workouts.map((w) => w.title).join(' + ');
}

// Right-side select indicator used in the bottom sheet. Three states:
//   - 'selected' (slot currently on this day): black filled circle, white tick
//   - 'taken'    (slot on another day):        grey filled circle, white tick
//   - 'free'     (slot unassigned):            open outline circle
type IndicatorState = 'selected' | 'taken' | 'free';
function SelectIndicator({ state }: { state: IndicatorState }) {
  if (state === 'selected') {
    return (
      <View style={selectIndicatorStyles.filled}>
        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
      </View>
    );
  }
  if (state === 'taken') {
    return (
      <View style={selectIndicatorStyles.taken}>
        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
      </View>
    );
  }
  return <View style={selectIndicatorStyles.outline} />;
}

const selectIndicatorStyles = StyleSheet.create({
  filled: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taken: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D0D0D0',
  },
});

// Square thumbnail for the workout that lives at a 1-indexed cycle position
// (week-1 image). Returns null if no image is registered for that slot.
function imageForPosition(
  planId: string | undefined,
  position: number
): ImageSourcePropType | null {
  if (!planId || position < 1) return null;
  const program = getProgram(planId);
  if (!program) return null;
  const day = program.days[position - 1];
  if (!day || day.workouts.length === 0) return null;
  return getPlanSquareImage(day.workouts[0].id);
}

// Memoised day row. Re-renders only when its own props change — so picking a
// slot in the bottom sheet doesn't refresh the OTHER 6 rows on the main list
// (which was causing the thumbnail flicker).
type DayRowProps = {
  dayName: string;
  isRest: boolean;
  summary: string | null;
  img: ImageSourcePropType | null;
  onSelect: (dayName: string) => void;
};
const DayRow = memo(
  function DayRow({ dayName, isRest, summary, img, onSelect }: DayRowProps) {
    const handlePress = useCallback(() => onSelect(dayName), [dayName, onSelect]);
    return (
      <Pressable
        style={({ pressed }) => [styles.dayRow, pressed && { opacity: 0.7 }]}
        onPress={handlePress}
      >
        {isRest ? (
          <View style={[styles.dayThumb, styles.dayThumbRest]}>
            <Ionicons name="moon-outline" size={22} color="#888" />
          </View>
        ) : img ? (
          <CachedImage
            source={img}
            style={styles.dayThumb}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={`${dayName}-${summary ?? ''}`}
            transition={0}
          />
        ) : (
          <View style={[styles.dayThumb, styles.dayThumbRest]} />
        )}
        <View style={styles.dayInfo}>
          <Text style={styles.dayName}>{dayName}</Text>
          <Text style={[styles.dayWorkout, isRest && styles.dayWorkoutRest]}>
            {isRest ? 'Rest day' : (summary ?? 'Workout')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.3)" />
      </Pressable>
    );
  },
  // Explicit comparator — only re-render when something the row visibly depends
  // on actually changed. Object.is handles the primitives fine on its own, but
  // being explicit guards against any non-stable prop sneaking in.
  (prev, next) =>
    prev.dayName === next.dayName &&
    prev.isRest === next.isRest &&
    prev.summary === next.summary &&
    prev.img === next.img &&
    prev.onSelect === next.onSelect
);

export default function WorkoutScheduleScreen() {
  const insets = useSafeAreaInsets();
  const profile = useUserProfileStore((s) => s.profile);
  const userId = useUserProfileStore((s) => s.userId);
  const updateProfile = useUserProfileStore((s) => s.updateProfile);
  const reflowPlanWorkouts = useWorkoutStore((s) => s.reflowPlanWorkouts);

  const planId = profile?.plan_id;
  const program = useMemo(() => (planId ? getProgram(planId) : null), [planId]);
  const maxCycleLen = program?.daysPerWeek ?? 7;

  // The currently-seeded plan workouts are the source of truth on the calendar.
  // We deliberately depend on the COUNT + earliest date so initialAssignments
  // recomputes when the seeder finishes — but we don't recompute on every
  // toggleWorkoutCompletion or other unrelated change.
  const scheduled = useWorkoutStore((s) => s.scheduledWorkouts);
  const seededFingerprint = useMemo(() => {
    const mine = scheduled.filter(
      (w) => w.userId === userId && w.planId === planId && w.programWorkoutId
    );
    return mine.length + ':' + (mine[0]?.date ?? '');
  }, [scheduled, userId, planId]);

  const initialAssignments = useMemo(
    () =>
      buildInitialAssignments({
        scheduled,
        userId,
        planId,
        workoutDays: profile?.workout_days,
        saved: profile?.workout_day_assignments,
        maxSlots: maxCycleLen,
      }),
    // seededFingerprint stands in for `scheduled` so we don't recompute on
    // every store change; userId / planId / maxCycleLen / profile fields still
    // drive a fresh derivation when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      seededFingerprint,
      userId,
      planId,
      profile?.workout_days,
      profile?.workout_day_assignments,
      maxCycleLen,
    ]
  );

  const [assignments, setAssignments] = useState<Assignments>(initialAssignments);

  // Sync assignments with initialAssignments until the user actually edits
  // something — handles the case where profile / scheduled_workouts finish
  // loading after first render.
  const userTouchedRef = useRef(false);
  useEffect(() => {
    if (!userTouchedRef.current) {
      setAssignments(initialAssignments);
    }
  }, [initialAssignments]);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Bottom-sheet animation ────────────────────────────────────────────────
  // Drive both the backdrop fade and the sheet slide from a single 0..1 value
  // so they stay perfectly in sync. `modalVisible` controls whether the Modal
  // is mounted at all — it stays true through the closing animation so the
  // sheet can slide out before unmount.
  const { height: screenHeight } = useWindowDimensions();
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (selectedDay !== null) {
      setModalVisible(true);
      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (modalVisible) {
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setModalVisible(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  const cycleLen = Object.keys(assignments).length;
  const hasChanges = useMemo(() => {
    const initKeys = Object.keys(initialAssignments);
    if (initKeys.length !== cycleLen) return true;
    for (const name of initKeys) {
      if (assignments[name] !== initialAssignments[name]) return true;
    }
    return false;
  }, [assignments, initialAssignments, cycleLen]);

  function haptic() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  const openSheet = useCallback((day: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedDay(day);
  }, []);

  const closeSheet = useCallback(() => {
    setSelectedDay(null);
  }, []);

  // Assign a plan dayInWeek slot to a weekday. If the slot is currently on a
  // different weekday, that day becomes rest (auto-vacate). The slot that was
  // previously on `day`, if any, returns to the unassigned pool.
  // Does NOT close the sheet — user confirms via the Save button.
  function setSlotForDay(day: string, slot: number) {
    haptic();
    userTouchedRef.current = true;
    setAssignments((prev) => {
      const next: Assignments = {};
      for (const [d, s] of Object.entries(prev)) {
        if (s !== slot && d !== day) next[d] = s;
      }
      next[day] = slot;
      return next;
    });
  }

  // Make a weekday a rest day. The slot that was on it returns to the pool.
  // Does NOT close the sheet — user confirms via the Save button.
  function makeRestDay(day: string) {
    haptic();
    userTouchedRef.current = true;
    setAssignments((prev) => {
      if (typeof prev[day] !== 'number') return prev;
      const next = { ...prev };
      delete next[day];
      return next;
    });
  }

  // Reset all weekdays to rest. The user starts picking from a clean slate.
  function handleResetAll() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Reset schedule?',
      'All days will become rest days. You can pick workouts again from scratch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            userTouchedRef.current = true;
            setAssignments({});
          },
        },
      ]
    );
  }

  // Apply the plan's recommended schedule: take the program's defaultWeekdays
  // (the cadence the plan was designed around), clip to daysPerWeek, and assign
  // each sorted weekday to slot 1..N positionally. Works for every plan because
  // every Program defines both fields.
  function handleRecommended() {
    if (!program) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const sorted = [...program.defaultWeekdays].sort((a, b) => a - b).slice(0, program.daysPerWeek);
    const next: Assignments = {};
    sorted.forEach((wdNum, i) => {
      const name = WEEKDAY_NUM_TO_NAME[wdNum];
      if (name) next[name] = i + 1;
    });
    userTouchedRef.current = true;
    setAssignments(next);
  }

  async function commitSave(triggerReflow: boolean) {
    setIsSaving(true);
    const nextDays = Object.keys(assignments);
    const ok = await updateProfile({
      workout_days: nextDays,
      workout_day_assignments: assignments,
    });
    if (!ok) {
      setIsSaving(false);
      Alert.alert('Error', 'Could not save your schedule. Please try again.');
      return;
    }
    if (triggerReflow && planId && userId) {
      const newWeekdays = workoutDaysToWeekdays(nextDays);
      reflowPlanWorkouts(planId, userId, newWeekdays, assignments);
    }
    setIsSaving(false);
    router.back();
  }

  function handleSave() {
    if (cycleLen < MIN_WORKOUT_DAYS || isSaving) return;
    haptic();
    if (!hasChanges) {
      router.back();
      return;
    }
    if (program && userId) {
      const planName = getPlanById(planId ?? '')?.name ?? 'plan';
      Alert.alert(
        'Reschedule your plan?',
        `Your past workouts stay. We'll reschedule the rest of your ${planName} to your new schedule.`,
        [
          { text: 'Keep current schedule', style: 'cancel', onPress: () => commitSave(false) },
          { text: 'Reschedule', style: 'default', onPress: () => commitSave(true) },
        ]
      );
    } else {
      commitSave(false);
    }
  }

  const canSave = cycleLen >= MIN_WORKOUT_DAYS && !isSaving;

  // ── Bottom-sheet content ──────────────────────────────────────────────────
  // Unified picker: shows the full pool of program slots (1..daysPerWeek).
  // Each slot is in one of three states: on this day (✓), on another day
  // (badge), or unassigned (tappable). Tapping any slot moves it to this day,
  // auto-vacating the previous day if needed. Rest day option lives at the
  // bottom.
  function renderSheet() {
    if (!selectedDay) return null;
    const currentSlot = assignments[selectedDay];
    const sheetBottomPad = Math.max(insets.bottom + 12, 24);

    function Thumb({ slot, dimmed }: { slot: number; dimmed?: boolean }) {
      const img = imageForPosition(planId, slot);
      const dimStyle = dimmed ? styles.sheetThumbDimmed : null;
      if (img) {
        return (
          <CachedImage
            source={img}
            style={[styles.sheetThumb, dimStyle]}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
          />
        );
      }
      return <View style={[styles.sheetThumb, styles.sheetThumbFallback, dimStyle]} />;
    }

    // Reverse-lookup: slot → weekday currently holding it (if any).
    const dayBySlot = new Map<number, string>();
    for (const [d, s] of Object.entries(assignments)) dayBySlot.set(s, d);

    // Slots 1..daysPerWeek, always in plan order. Stable across selections so
    // tapping a slot doesn't make it jump positions in the list.
    const ordered: number[] = [];
    for (let s = 1; s <= maxCycleLen; s++) ordered.push(s);

    return (
      <View style={[styles.sheet, { paddingBottom: sheetBottomPad }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{selectedDay}</Text>

        {ordered.map((slot) => {
          const summary = summaryForPosition(planId, slot) ?? 'Workout';
          const isCurrent = slot === currentSlot;
          const onDay = dayBySlot.get(slot);
          const isOnAnotherDay = !!onDay && onDay !== selectedDay;
          return (
            <Pressable
              key={slot}
              style={[styles.sheetOption, isOnAnotherDay && styles.sheetOptionTaken]}
              onPress={() => setSlotForDay(selectedDay, slot)}
            >
              <Thumb slot={slot} dimmed={isOnAnotherDay} />
              <View style={styles.sheetOptionText}>
                <Text
                  style={[
                    styles.sheetOptionPrimary,
                    isOnAnotherDay && styles.sheetOptionPrimaryDimmed,
                  ]}
                >
                  {summary}
                </Text>
                {isOnAnotherDay && (
                  <Text style={styles.sheetOptionSecondary}>Already on {onDay}</Text>
                )}
              </View>
              <SelectIndicator state={isCurrent ? 'selected' : isOnAnotherDay ? 'taken' : 'free'} />
            </Pressable>
          );
        })}

        <Pressable style={styles.sheetOption} onPress={() => makeRestDay(selectedDay)}>
          <View style={[styles.sheetThumb, styles.sheetThumbFallback]}>
            <Ionicons name="moon-outline" size={24} color="#888" />
          </View>
          <View style={styles.sheetOptionText}>
            <Text style={styles.sheetOptionPrimary}>Rest day</Text>
          </View>
          <SelectIndicator state={typeof currentSlot !== 'number' ? 'selected' : 'free'} />
        </Pressable>

        <Pressable style={styles.sheetSave} onPress={closeSheet}>
          <Text style={styles.sheetSaveText}>Save</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <CircleBackButton />
        <Text style={styles.headerTitle}>Workout Schedule</Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          hitSlop={8}
          style={({ pressed }) => [
            styles.saveBtn,
            !canSave && styles.saveBtnDisabled,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {ALL_DAYS.map((day) => {
          const pos = assignments[day.name];
          const isRest = typeof pos !== 'number';
          const summary = !isRest ? summaryForPosition(planId, pos) : null;
          const img = !isRest ? imageForPosition(planId, pos) : null;
          return (
            <DayRow
              key={day.name}
              dayName={day.name}
              isRest={isRest}
              summary={summary}
              img={img}
              onSelect={openSheet}
            />
          );
        })}

        <View style={styles.bottomButtonRow}>
          <Pressable
            style={({ pressed }) => [styles.bottomButton, pressed && { opacity: 0.7 }]}
            onPress={handleRecommended}
          >
            <Text style={styles.bottomButtonText}>Recommended</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.bottomButton, pressed && { opacity: 0.7 }]}
            onPress={handleResetAll}
          >
            <Text style={[styles.bottomButtonText, styles.bottomButtonTextDanger]}>Reset all</Text>
          </Pressable>
        </View>

        {cycleLen < MIN_WORKOUT_DAYS && (
          <Text style={styles.minWarning}>Pick at least {MIN_WORKOUT_DAYS} days to save.</Text>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeSheet}>
        {/* Backdrop — fades in/out independently from the sheet slide so the
            user doesn't see a "black box" sliding alongside the sheet. */}
        <Animated.View
          style={[
            styles.sheetBackdrop,
            { opacity: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
          ]}
          pointerEvents="auto"
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          <Animated.View
            onStartShouldSetResponder={() => true}
            style={{
              transform: [
                {
                  translateY: sheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [screenHeight, 0],
                  }),
                },
              ],
            }}
          >
            {renderSheet()}
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#000000',
  },
  saveBtn: {
    minWidth: 56,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  saveBtnDisabled: { backgroundColor: '#CCCCCC' },
  saveText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 28,
    paddingBottom: spacing.lg,
    gap: 12,
  },
  dayRow: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 14,
  },
  dayThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#EEEEEE',
  },
  dayThumbRest: {
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInfo: { flex: 1 },
  dayName: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#000000',
    letterSpacing: -0.2,
  },
  dayWorkout: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#444444',
    marginTop: 2,
  },
  dayWorkoutRest: {
    color: '#999999',
    fontStyle: 'italic',
  },
  minWarning: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#C25151',
    textAlign: 'center',
    paddingTop: 12,
  },
  bottomButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  bottomButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EEEEEE',
    borderRadius: 16,
  },
  bottomButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#000000',
  },
  bottomButtonTextDanger: {
    color: '#FB5057',
  },
  // ── Bottom sheet ──────────────────────────────────────────────────────────
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 16,
    // No maxHeight: let the sheet size to its content. paddingBottom is set
    // dynamically from safe-area insets at render time.
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#000000',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sheetSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#666666',
    paddingHorizontal: 4,
    marginTop: 4,
    marginBottom: 12,
  },
  sheetSectionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: 'rgba(0,0,0,0.45)',
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
  },
  sheetOptionTaken: {
    backgroundColor: '#EAEAEA',
  },
  sheetThumb: {
    width: 53,
    height: 53,
    borderRadius: 12,
    backgroundColor: '#EEEEEE',
  },
  sheetThumbDimmed: {
    opacity: 0.5,
  },
  sheetThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionText: { flex: 1 },
  sheetOptionPrimary: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: '#000000',
    letterSpacing: -0.2,
  },
  sheetOptionPrimaryDimmed: {
    color: 'rgba(0,0,0,0.5)',
  },
  sheetOptionSecondary: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  sheetSave: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  sheetSaveText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
