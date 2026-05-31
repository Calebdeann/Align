import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { CircleBackButton } from '@/components';
import { useUserPreferencesStore, TimerSoundId } from '@/stores/userPreferencesStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { playTimerSound, TIMER_SOUND_OPTIONS } from '@/utils/sounds';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Same rest timer options used in active-workout.tsx
const REST_TIMER_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '1:00' },
  { value: 90, label: '1:30' },
  { value: 120, label: '2:00' },
  { value: 150, label: '2:30' },
  { value: 180, label: '3:00' },
  { value: 210, label: '3:30' },
  { value: 240, label: '4:00' },
  { value: 270, label: '4:30' },
  { value: 300, label: '5:00' },
];

function formatTimerLabel(seconds: number): string {
  if (seconds === 0) return 'Off';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}:00`;
}

// Reusable local components (same pattern as profile.tsx)
function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function MenuCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.menuCard}>{children}</View>;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
  rightText?: string;
  showDivider?: boolean;
}

function MenuItem({
  icon,
  label,
  onPress,
  showArrow = true,
  rightElement,
  rightText,
  showDivider = true,
}: MenuItemProps) {
  return (
    <>
      <Pressable
        style={styles.menuItem}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          onPress?.();
        }}
      >
        <View style={styles.menuItemLeft}>
          {icon}
          <Text style={styles.menuItemLabel}>{label}</Text>
        </View>
        {rightElement || (
          <View style={styles.menuItemRight}>
            {rightText && <Text style={styles.menuItemRightText}>{rightText}</Text>}
            {showArrow && (
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}
          </View>
        )}
      </Pressable>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

export default function WorkoutSettingsScreen() {
  const {
    defaultRestTimerSeconds,
    rpeTrackingEnabled,
    timerSoundId,
    vibrationEnabled,
    weightUnit,
    setDefaultRestTimerSeconds,
    setRpeTrackingEnabled,
    setTimerSoundId,
    setVibrationEnabled,
    setWeightUnit,
  } = useUserPreferencesStore();

  // When opened from inside an active workout (?source=workout), the Default
  // Rest Timer row reflects and edits the current workout's per-exercise
  // timers instead of the global default. Profile entry is unchanged.
  const params = useLocalSearchParams<{ source?: string }>();
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const setAllActiveExerciseRestTimers = useWorkoutStore((s) => s.setAllActiveExerciseRestTimers);
  const exerciseTimers = activeWorkout?.exercises.map((e) => e.restTimerSeconds) ?? [];
  const useWorkoutContext = params.source === 'workout' && exerciseTimers.length > 0;
  const allSame = exerciseTimers.length > 0 && exerciseTimers.every((t) => t === exerciseTimers[0]);
  const workoutValue: number | null = useWorkoutContext && allSame ? exerciseTimers[0] : null;

  // Rest timer picker modal
  const [showTimerModal, setShowTimerModal] = useState(false);
  const timerModalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Sound picker modal
  const [showSoundModal, setShowSoundModal] = useState(false);
  const soundModalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const openTimerModal = () => {
    setShowTimerModal(true);
    Animated.spring(timerModalSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeTimerModal = () => {
    Animated.timing(timerModalSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowTimerModal(false));
  };

  const openSoundModal = () => {
    setShowSoundModal(true);
    Animated.spring(soundModalSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeSoundModal = () => {
    Animated.timing(soundModalSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowSoundModal(false));
  };

  const handleSelectTimer = (value: number) => {
    if (useWorkoutContext) {
      setAllActiveExerciseRestTimers(value);
    } else {
      setDefaultRestTimerSeconds(value);
    }
  };

  const handleSelectSound = (id: TimerSoundId) => {
    setTimerSoundId(id);
    playTimerSound(id);
  };

  const currentSoundLabel =
    TIMER_SOUND_OPTIONS.find((s) => s.id === timerSoundId)?.label || 'Chime';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <CircleBackButton />
        <Text style={styles.headerTitle}>Workout Settings</Text>
        <View style={{ width: 46 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Rest Timer */}
        <SectionHeader title="Rest Timer" />
        <MenuCard>
          <MenuItem
            icon={<Ionicons name="timer-outline" size={20} color={colors.text} />}
            label="Default Rest Timer"
            onPress={openTimerModal}
            rightText={
              useWorkoutContext
                ? workoutValue !== null
                  ? formatTimerLabel(workoutValue)
                  : 'Mixed'
                : formatTimerLabel(defaultRestTimerSeconds)
            }
            showDivider={false}
          />
        </MenuCard>

        {/* Tracking */}
        <SectionHeader title="Tracking" />
        <MenuCard>
          <MenuItem
            icon={<Ionicons name="speedometer-outline" size={20} color={colors.text} />}
            label="RPE Tracking"
            onPress={() => setRpeTrackingEnabled(!rpeTrackingEnabled)}
            showArrow={false}
            rightElement={
              <Switch
                value={rpeTrackingEnabled}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  setRpeTrackingEnabled(value);
                }}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                ios_backgroundColor="#E5E5EA"
              />
            }
          />
          <MenuItem
            icon={<Ionicons name="barbell-outline" size={20} color={colors.text} />}
            label="Units"
            showArrow={false}
            showDivider={false}
            rightElement={
              <View style={styles.unitPillRow}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setWeightUnit('kg');
                  }}
                  style={[styles.unitPill, weightUnit === 'kg' && styles.unitPillSelected]}
                >
                  <Text
                    style={[
                      styles.unitPillText,
                      weightUnit === 'kg' && styles.unitPillTextSelected,
                    ]}
                  >
                    KG
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setWeightUnit('lbs');
                  }}
                  style={[styles.unitPill, weightUnit === 'lbs' && styles.unitPillSelected]}
                >
                  <Text
                    style={[
                      styles.unitPillText,
                      weightUnit === 'lbs' && styles.unitPillTextSelected,
                    ]}
                  >
                    LBS
                  </Text>
                </Pressable>
              </View>
            }
          />
        </MenuCard>

        {/* Timer Alerts */}
        <SectionHeader title="Timer Alerts" />
        <MenuCard>
          <MenuItem
            icon={<Ionicons name="musical-notes-outline" size={20} color={colors.text} />}
            label="Timer Sound"
            onPress={openSoundModal}
            rightText={currentSoundLabel}
          />
          <MenuItem
            icon={<Ionicons name="phone-portrait-outline" size={20} color={colors.text} />}
            label="Vibration"
            onPress={() => setVibrationEnabled(!vibrationEnabled)}
            showArrow={false}
            showDivider={false}
            rightElement={
              <Switch
                value={vibrationEnabled}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  setVibrationEnabled(value);
                }}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                ios_backgroundColor="#E5E5EA"
              />
            }
          />
        </MenuCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Rest Timer Picker Modal */}
      <Modal
        visible={showTimerModal}
        transparent
        animationType="none"
        onRequestClose={closeTimerModal}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            closeTimerModal();
          }}
        >
          <Animated.View
            style={[
              styles.bottomSheetContent,
              { transform: [{ translateY: timerModalSlideAnim }] },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Default Rest Timer</Text>
              </View>

              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {REST_TIMER_OPTIONS.map((option) => {
                  const compareValue = useWorkoutContext ? workoutValue : defaultRestTimerSeconds;
                  const isSelected = compareValue === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        handleSelectTimer(option.value);
                      }}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {option.label}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.bottomSheetFooter}>
                <Pressable
                  style={styles.doneButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    closeTimerModal();
                  }}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Sound Picker Modal */}
      <Modal
        visible={showSoundModal}
        transparent
        animationType="none"
        onRequestClose={closeSoundModal}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            closeSoundModal();
          }}
        >
          <Animated.View
            style={[
              styles.bottomSheetContent,
              { transform: [{ translateY: soundModalSlideAnim }] },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Timer Sound</Text>
              </View>

              <View style={styles.optionsList}>
                {TIMER_SOUND_OPTIONS.map((option) => {
                  const isSelected = timerSoundId === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        handleSelectSound(option.id);
                      }}
                    >
                      <View style={styles.soundOptionLeft}>
                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                          {option.label}
                        </Text>
                      </View>
                      <View style={styles.soundOptionRight}>
                        <Pressable
                          style={styles.previewButton}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                            playTimerSound(option.id);
                          }}
                          hitSlop={8}
                        >
                          <Ionicons
                            name="play-circle-outline"
                            size={24}
                            color={isSelected ? colors.primary : colors.textSecondary}
                          />
                        </Pressable>
                        {isSelected && (
                          <Ionicons name="checkmark" size={20} color={colors.primary} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.bottomSheetFooter}>
                <Pressable
                  style={styles.doneButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    closeSoundModal();
                  }}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  sectionHeader: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  menuCard: {
    ...cardStyle,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  menuItemLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  menuItemRightText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.25)',
    marginHorizontal: spacing.sm,
  },
  // KG / LBS pills used by the Units row in the Tracking section.
  unitPillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  unitPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    minWidth: 44,
    alignItems: 'center',
  },
  unitPillSelected: {
    backgroundColor: '#000000',
  },
  unitPillText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#000000',
    letterSpacing: 0.3,
  },
  unitPillTextSelected: {
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 40,
  },

  // Bottom sheet modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  bottomSheetHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bottomSheetTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  optionRowSelected: {
    backgroundColor: 'rgba(148, 122, 255, 0.08)',
  },
  optionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
  },
  soundOptionLeft: {
    flex: 1,
  },
  soundOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewButton: {
    padding: spacing.xs,
  },
  bottomSheetFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
});
