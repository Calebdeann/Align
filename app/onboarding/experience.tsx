import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing, radius } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

const experienceLevels = [
  { id: 'never', label: "I've never worked out", bars: 1 },
  { id: 'beginner', label: 'Beginner - Tried it before', bars: 2 },
  { id: 'intermediate', label: 'Intermediate - Regular training', bars: 3 },
  { id: 'advanced', label: 'Advanced - Years of experience', bars: 4 },
];

function BarIcon({ filled, isSelected }: { filled: number; isSelected: boolean }) {
  const filledColor = isSelected ? '#FFFFFF' : '#000000';
  const emptyColor = isSelected ? 'rgba(255,255,255,0.4)' : '#E0E0E0';

  return (
    <View style={styles.barIcon}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            styles.bar,
            { height: 5 + i * 3 },
            { backgroundColor: i <= filled ? filledColor : emptyColor },
          ]}
        />
      ))}
    </View>
  );
}

export default function ExperienceScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const setAndSave = useOnboardingStore((s) => s.setAndSave);

  const handleSelect = (id: string) => {
    setSelected(id);
    setAndSave('experienceLevel', id);
    setTimeout(() => {
      router.push('/onboarding/goals');
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back, progress bar, skip */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '10%' }]} />
        </View>

        <Pressable
          onPress={() => {
            useOnboardingStore.getState().skipField('experienceLevel');
            router.push('/onboarding/goals');
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>How experienced are you with working out?</Text>
      </View>

      {/* Options - centered in remaining space */}
      <View style={styles.optionsWrapper}>
        <View style={styles.optionsContainer}>
          {experienceLevels.map((level) => {
            const isSelected = selected === level.id;
            return (
              <Pressable
                key={level.id}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => handleSelect(level.id)}
              >
                <BarIcon filled={level.bars} isSelected={isSelected} />
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {level.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
  },
  questionText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    lineHeight: 36,
    textAlign: 'center',
  },
  optionsWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 80,
  },
  optionsContainer: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 74,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 239, 239, 0.5)',
    gap: spacing.lg,
  },
  optionCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#000000',
    flex: 1,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  barIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    width: 20,
    height: 20,
  },
  bar: {
    width: 3,
    borderRadius: 1,
  },
});
