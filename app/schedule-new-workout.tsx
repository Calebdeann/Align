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
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { ImagePickerSheet, type SelectedImageData } from '@/components/ImagePickerSheet';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useWorkoutStore, type ScheduledWorkout } from '@/stores/workoutStore';
import { saveScheduledWorkoutToBackend } from '@/services/api/scheduledWorkouts';
import { uploadTemplateImage, isLocalUri } from '@/services/api/templates';

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

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ScheduleNewWorkoutScreen() {
  const userId = useUserProfileStore((s) => s.userId);
  const addWorkout = useWorkoutStore((s) => s.addWorkout);

  // Edit card
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState<SelectedImageData | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

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

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (saving) return;
    if (!userId) {
      Alert.alert('Not signed in', 'Sign in to schedule a workout.');
      return;
    }
    if (!editName.trim()) {
      Alert.alert('Name required', 'Give this workout a name to schedule it.');
      return;
    }
    setSaving(true);

    let imageField: ScheduledWorkout['image'] | undefined;
    if (editImage) {
      if (editImage.type === 'template') {
        imageField = {
          type: 'template',
          uri: editImage.uri,
          templateId: editImage.templateImageId,
        };
      } else if (editImage.uri && isLocalUri(editImage.uri)) {
        const remoteUrl = await uploadTemplateImage(userId, editImage.uri);
        if (remoteUrl) {
          imageField = { type: editImage.type, uri: remoteUrl };
        }
      } else if (editImage.uri) {
        imageField = { type: editImage.type, uri: editImage.uri };
      }
    }

    const workoutData: Omit<ScheduledWorkout, 'id' | 'createdAt' | 'completedDates'> = {
      userId,
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      image: imageField,
      tagId: 'purple',
      tagColor: colors.primary,
      templateName: null,
      date: dateKey(selectedDate),
      repeat: {
        type: repeatType,
        ...(repeatType === 'custom' ? { customDays } : {}),
        ...(repeatType === 'interval' ? { intervalDays } : {}),
      },
      ...(endDate ? { endDate: dateKey(endDate) } : {}),
    };

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
          disabled={saving}
          hitSlop={8}
        >
          <Text style={[styles.headerSaveText, saving && { opacity: 0.4 }]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Edit card: tilted image + title + description */}
        <View style={styles.editCard}>
          <View style={styles.editInfoRow}>
            <Pressable
              style={styles.heroImage}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setShowImagePicker(true);
              }}
            >
              {editImage?.localSource ? (
                <Image
                  source={editImage.localSource}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : editImage?.uri ? (
                <Image
                  source={{ uri: editImage.uri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.heroImagePlaceholder}>
                  <Ionicons name="barbell-outline" size={32} color="rgba(0,0,0,0.4)" />
                  <Text style={styles.heroImagePlaceholderText}>Add image</Text>
                </View>
              )}
            </Pressable>

            <View style={styles.editTextInputs}>
              <TextInput
                autoCorrect={false}
                style={styles.nameInput}
                placeholder="Workout name"
                placeholderTextColor={colors.textTertiary}
                value={editName}
                onChangeText={setEditName}
              />
              <TextInput
                autoCorrect={false}
                style={styles.descriptionInput}
                placeholder="Description (optional)"
                placeholderTextColor={colors.textTertiary}
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
              />
            </View>
          </View>
        </View>

        {/* Date + Repeat section */}
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

      {/* Image picker bottom sheet */}
      <ImagePickerSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={(img) => setEditImage(img)}
      />

      {/* Repeat modal */}
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

      {/* End repeat modal */}
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

  // Edit card (tilted image + title + description)
  editCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  editInfoRow: { flexDirection: 'row', gap: 16 },
  heroImage: {
    width: 110,
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    marginLeft: 4,
    backgroundColor: '#e0e0e0',
    transform: [{ rotate: '-2.5deg' }],
  },
  heroImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroImagePlaceholderText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
  },
  editTextInputs: { flex: 1, justifyContent: 'center' },
  nameInput: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  descriptionInput: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingVertical: spacing.xs,
    minHeight: 36,
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
