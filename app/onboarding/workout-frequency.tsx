import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

const daysPerWeekOptions = [
  '1 day / week',
  '2 days / week',
  '3 days / week',
  '4 days / week',
  '5 days / week',
  '6 days / week',
  'Every day',
];

const specificDaysOptions = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];

type TabType = 'days-per-week' | 'specific-days';

export default function WorkoutFrequencyScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('days-per-week');
  const [selectedDaysPerWeek, setSelectedDaysPerWeek] = useState<string | null>(null);
  const [selectedSpecificDays, setSelectedSpecificDays] = useState<string[]>([]);

  const toggleSpecificDay = (dayId: string) => {
    setSelectedSpecificDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const canContinue =
    (activeTab === 'days-per-week' && selectedDaysPerWeek !== null) ||
    (activeTab === 'specific-days' && selectedSpecificDays.length > 0);

  const handleContinue = () => {
    if (activeTab === 'days-per-week' && selectedDaysPerWeek) {
      useOnboardingStore.getState().setAndSave('workoutFrequency', selectedDaysPerWeek);
    } else if (activeTab === 'specific-days' && selectedSpecificDays.length > 0) {
      useOnboardingStore.getState().setAndSave('workoutDays', selectedSpecificDays);
    }
    router.push('/onboarding/reminder');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '88%' }]} />
        </View>

        <Pressable
          onPress={() => {
            useOnboardingStore.getState().skipField('workoutFrequency');
            router.push('/onboarding/reminder');
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>How many times a week do you want to workout?</Text>
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBackground}>
          <Pressable
            style={[styles.tab, activeTab === 'days-per-week' && styles.tabActive]}
            onPress={() => setActiveTab('days-per-week')}
          >
            <Text style={[styles.tabText, activeTab === 'days-per-week' && styles.tabTextActive]}>
              Days per week
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'specific-days' && styles.tabActive]}
            onPress={() => setActiveTab('specific-days')}
          >
            <Text style={[styles.tabText, activeTab === 'specific-days' && styles.tabTextActive]}>
              Specific days
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Options */}
      <ScrollView style={styles.optionsScrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'days-per-week' ? (
          <View style={styles.optionsContainer}>
            {daysPerWeekOptions.map((option) => {
              const isSelected = selectedDaysPerWeek === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => setSelectedDaysPerWeek(option)}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.optionsContainer}>
            {specificDaysOptions.map((day) => {
              const isSelected = selectedSpecificDays.includes(day.id);
              return (
                <Pressable
                  key={day.id}
                  style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                  onPress={() => toggleSpecificDay(day.id)}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {day.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={[styles.continueText, !canContinue && styles.continueTextDisabled]}>
            Continue
          </Text>
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
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  questionText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
  },
  tabContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 26,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  optionsScrollView: {
    flex: 1,
  },
  optionsContainer: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  optionCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
  },
  optionCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  dayCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
  },
  dayCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
  },
  continueText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
  continueTextDisabled: {
    color: colors.textSecondary,
  },
});
