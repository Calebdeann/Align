import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { strongHaptic } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing } from '@/constants/theme';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { OnboardingBackButton, OnboardingContinueButton } from '@/components';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { WORKOUT_DAYS, MIN_WORKOUT_DAYS } from '@/constants/workoutDays';

export default function WorkoutDaysScreen() {
  const { isNavigating, withLock } = useNavigationLock();
  const savedWorkoutDays = useOnboardingStore((s) => s.workoutDays);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(savedWorkoutDays));
  const setAndSave = useOnboardingStore((s) => s.setAndSave);

  function handleToggle(day: string) {
    strongHaptic();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function handleContinue() {
    if (selected.size < MIN_WORKOUT_DAYS) return;
    withLock(() => {
      setAndSave('workoutDays', [...selected]);
      router.push('/onboarding/finding-workout');
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <OnboardingBackButton />
        <View style={styles.progressCenter}>
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <Text style={styles.title}>
        {'What '}
        <Text style={styles.titleItalic}>{'days'}</Text>
        {' do you\nwant to workout?'}
      </Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {WORKOUT_DAYS.map((day, idx) => {
          const isSelected = selected.has(day.name);
          return (
            <Pressable
              key={day.name}
              onPress={() => handleToggle(day.name)}
              shouldRasterizeIOS
              renderToHardwareTextureAndroid
              style={[
                styles.card,
                { borderColor: day.color },
                isSelected && { backgroundColor: day.color, borderWidth: 1.5 },
                { transform: [{ rotate: idx % 2 === 0 ? '-0.5deg' : '0.5deg' }] },
              ]}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                {day.name}
              </Text>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: day.color },
                  isSelected && { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
                ]}
              >
                {isSelected && <Ionicons name="checkmark-sharp" size={16} color={day.color} />}
              </View>
            </Pressable>
          );
        })}
        <Text style={styles.recommendation}>We recommend 4+ days a week.</Text>
      </ScrollView>

      <View style={styles.bottomSection}>
        <OnboardingContinueButton
          onPress={handleContinue}
          disabled={selected.size < MIN_WORKOUT_DAYS || isNavigating}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: 12,
  },
  progressCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    width: 100,
    height: 4,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
  },
  progressBarFill: {
    width: 60,
    height: 4,
    backgroundColor: '#000000',
  },
  title: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 48,
    color: '#000000',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    lineHeight: 56,
  },
  titleItalic: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 48,
  },
  recommendation: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#9b9b9b',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    // 25px below the Sunday card. The list has `gap: 16` between siblings,
    // so marginTop = 25 - 16 yields exactly 25px of visual spacing.
    marginTop: 9,
  },
  scroll: {
    flex: 1,
    marginTop: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    gap: 16,
    paddingBottom: spacing.lg,
  },
  card: {
    height: 52,
    borderRadius: 30,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginHorizontal: 4,
  },
  dayLabel: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#000000',
  },
  dayLabelSelected: {
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: 4,
  },
});
