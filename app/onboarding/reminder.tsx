import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const minutes = Array.from({ length: 60 }, (_, i) => i); // 0-59
const periods = ['AM', 'PM'];

export default function ReminderScreen() {
  const hourListRef = useRef<FlatList>(null);
  const minuteListRef = useRef<FlatList>(null);
  const periodListRef = useRef<FlatList>(null);

  const [selectedHourIndex, setSelectedHourIndex] = useState(hours.indexOf(9)); // Default 9
  const [selectedMinuteIndex, setSelectedMinuteIndex] = useState(0); // Default 00
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0); // Default AM

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  const onHourScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), hours.length - 1);
    setSelectedHourIndex(clampedIndex);
  }, []);

  const onMinuteScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), minutes.length - 1);
    setSelectedMinuteIndex(clampedIndex);
  }, []);

  const onPeriodScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), periods.length - 1);
    setSelectedPeriodIndex(clampedIndex);
  }, []);

  const renderHourItem = useCallback(
    ({ item, index }: { item: number; index: number }) => {
      const distance = Math.abs(index - selectedHourIndex);
      const isSelected = distance === 0;

      let opacity = 1;
      if (distance === 1) opacity = 0.4;
      else if (distance === 2) opacity = 0.2;
      else if (distance > 2) opacity = 0.1;

      return (
        <View style={styles.pickerItem}>
          <Text
            style={[
              styles.pickerText,
              {
                color: isSelected ? colors.primary : colors.textSecondary,
                opacity: isSelected ? 1 : opacity,
              },
            ]}
          >
            {item}
          </Text>
        </View>
      );
    },
    [selectedHourIndex]
  );

  const renderMinuteItem = useCallback(
    ({ item, index }: { item: number; index: number }) => {
      const distance = Math.abs(index - selectedMinuteIndex);
      const isSelected = distance === 0;

      let opacity = 1;
      if (distance === 1) opacity = 0.4;
      else if (distance === 2) opacity = 0.2;
      else if (distance > 2) opacity = 0.1;

      return (
        <View style={styles.pickerItem}>
          <Text
            style={[
              styles.pickerText,
              {
                color: isSelected ? colors.primary : colors.textSecondary,
                opacity: isSelected ? 1 : opacity,
              },
            ]}
          >
            {item.toString().padStart(2, '0')}
          </Text>
        </View>
      );
    },
    [selectedMinuteIndex]
  );

  const renderPeriodItem = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      const distance = Math.abs(index - selectedPeriodIndex);
      const isSelected = distance === 0;

      let opacity = 1;
      if (distance === 1) opacity = 0.4;
      else if (distance > 1) opacity = 0.1;

      return (
        <View style={styles.pickerItem}>
          <Text
            style={[
              styles.pickerText,
              {
                color: isSelected ? colors.primary : colors.textSecondary,
                opacity: isSelected ? 1 : opacity,
              },
            ]}
          >
            {item}
          </Text>
        </View>
      );
    },
    [selectedPeriodIndex]
  );

  const selectedHour = hours[selectedHourIndex];
  const selectedMinute = minutes[selectedMinuteIndex];
  const selectedPeriod = periods[selectedPeriodIndex];
  const timeString = `${selectedHour}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '95%' }]} />
        </View>

        <Pressable
          onPress={() => {
            useOnboardingStore.getState().skipField('reminderTime');
            router.push('/onboarding/first-exercises');
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>Do you want to receive workout reminders?</Text>
      </View>

      {/* Notification Preview Card */}
      <View style={styles.notificationCard}>
        <View style={styles.notificationIcon} />
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>Align</Text>
            <Text style={styles.notificationTime}>2h ago</Text>
          </View>
          <Text style={styles.notificationHeadline}>Todays workout: Chest & Shoulders</Text>
          <Text style={styles.notificationBody}>
            Bench Press, Dumbbell Shoulder Press, Dumbell Lateral Raise
          </Text>
        </View>
      </View>

      {/* Time Picker */}
      <View style={styles.pickerWrapper}>
        <View style={styles.timePickerContainer}>
          {/* Hour Column */}
          <View style={styles.columnContainer}>
            <FlatList
              ref={hourListRef}
              data={hours}
              renderItem={renderHourItem}
              keyExtractor={(item) => `hour-${item}`}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              getItemLayout={getItemLayout}
              onScroll={onHourScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT * 2,
              }}
              initialScrollIndex={hours.indexOf(9)}
              onScrollToIndexFailed={() => {}}
              extraData={selectedHourIndex}
            />
          </View>

          {/* Colon separator */}
          <Text style={styles.colonText}>:</Text>

          {/* Minute Column */}
          <View style={styles.columnContainer}>
            <FlatList
              ref={minuteListRef}
              data={minutes}
              renderItem={renderMinuteItem}
              keyExtractor={(item) => `minute-${item}`}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              getItemLayout={getItemLayout}
              onScroll={onMinuteScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT * 2,
              }}
              initialScrollIndex={0}
              onScrollToIndexFailed={() => {}}
              extraData={selectedMinuteIndex}
            />
          </View>

          {/* AM/PM Column */}
          <View style={styles.periodContainer}>
            <FlatList
              ref={periodListRef}
              data={periods}
              renderItem={renderPeriodItem}
              keyExtractor={(item) => `period-${item}`}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              getItemLayout={getItemLayout}
              onScroll={onPeriodScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT * 2,
              }}
              initialScrollIndex={0}
              onScrollToIndexFailed={() => {}}
              extraData={selectedPeriodIndex}
            />
          </View>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Pressable
          onPress={() => {
            useOnboardingStore.getState().setAndSave('notificationsEnabled', false);
            router.push('/onboarding/first-exercises');
          }}
        >
          <Text style={styles.maybeLaterText}>Maybe later</Text>
        </Pressable>

        <Pressable
          style={styles.continueButton}
          onPress={() => {
            useOnboardingStore.getState().setAndSave('notificationsEnabled', true);
            useOnboardingStore.getState().setAndSave('reminderTime', timeString);
            router.push('/onboarding/first-exercises');
          }}
        >
          <Text style={styles.continueText}>Remind me at {timeString}</Text>
        </Pressable>
      </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressBarFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  skipText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  questionContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  questionText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  notificationCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    gap: spacing.md,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.border,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  notificationTime: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  notificationHeadline: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: 2,
  },
  notificationBody: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pickerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PICKER_HEIGHT,
    overflow: 'hidden',
  },
  columnContainer: {
    width: 70,
    height: PICKER_HEIGHT,
  },
  periodContainer: {
    width: 70,
    height: PICKER_HEIGHT,
    marginLeft: spacing.sm,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    fontFamily: fonts.bold,
    fontSize: 40,
  },
  colonText: {
    fontFamily: fonts.bold,
    fontSize: 40,
    color: colors.primary,
    marginHorizontal: 4,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  maybeLaterText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  continueText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
});
