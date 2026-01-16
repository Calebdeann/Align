import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

type TutorialStep = 'reps' | 'weight' | 'checkmark';

const hints: Record<TutorialStep, { title: string; subtitle: string }> = {
  reps: {
    title: 'Enter a rep number',
    subtitle: "If you don't know, enter a guess",
  },
  weight: {
    title: 'Now enter the weight',
    subtitle: "If you don't know, enter a guess",
  },
  checkmark: {
    title: 'Tap the checkmark',
    subtitle: 'This logs your set',
  },
};

export default function ExerciseTutorialScreen() {
  const { exerciseName } = useLocalSearchParams<{ exerciseName: string }>();
  const [step, setStep] = useState<TutorialStep>('reps');
  const [kg, setKg] = useState('10');
  const [reps, setReps] = useState('8');
  const [isChecked, setIsChecked] = useState(false);

  const handleRepsChange = (value: string) => {
    setReps(value);
    if (value.length > 0 && step === 'reps') {
      setStep('weight');
    }
  };

  const handleKgChange = (value: string) => {
    setKg(value);
    if (value.length > 0 && step === 'weight') {
      setStep('checkmark');
    }
  };

  const handleCheck = () => {
    setIsChecked(true);
    setTimeout(() => {
      router.push('/onboarding/complete');
    }, 500);
  };

  const canContinue = isChecked;

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

        <Pressable onPress={() => router.push('/onboarding/complete')}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Exercise Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{exerciseName || 'Leg Extension'}</Text>
      </View>

      {/* Exercise Info */}
      <View style={styles.exerciseInfo}>
        <View style={styles.exerciseIcon} />
        <Text style={styles.exerciseType}>Chest Press (Machine)</Text>
      </View>

      {/* Rest Timer */}
      <View style={styles.restTimerRow}>
        <Text style={styles.restTimerIcon}>⏱</Text>
        <Text style={styles.restTimerText}>Rest Timer: OFF</Text>
      </View>

      {/* Set Table */}
      <View style={styles.tableContainer}>
        {/* Header Row */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colSet]}>SET</Text>
          <Text style={[styles.tableHeaderText, styles.colPrevious]}>PREVIOUS</Text>
          <Text style={[styles.tableHeaderText, styles.colKg]}>KG</Text>
          <Text style={[styles.tableHeaderText, styles.colReps]}>REPS</Text>
          <View style={styles.colCheck} />
        </View>

        {/* Data Row */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.colSet]}>1</Text>
          <Text style={[styles.tableCell, styles.colPrevious]}>-</Text>
          <View style={styles.colKg}>
            <TextInput
              style={[styles.input, step === 'weight' && styles.inputHighlighted]}
              value={kg}
              onChangeText={handleKgChange}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>
          <View style={styles.colReps}>
            <TextInput
              style={[styles.input, step === 'reps' && styles.inputHighlighted]}
              value={reps}
              onChangeText={handleRepsChange}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>
          <View style={styles.colCheck}>
            <Pressable
              style={[
                styles.checkbox,
                step === 'checkmark' && styles.checkboxHighlighted,
                isChecked && styles.checkboxChecked,
              ]}
              onPress={handleCheck}
            >
              {isChecked && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Add Set Button */}
      <Pressable style={styles.addSetButton}>
        <Text style={styles.addSetText}>Add Set</Text>
      </Pressable>

      {/* Hint Box */}
      <View style={styles.hintBox}>
        <Text style={styles.hintTitle}>{hints[step].title}</Text>
        <Text style={styles.hintSubtitle}>{hints[step].subtitle}</Text>
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Continue Button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          onPress={() => router.push('/onboarding/complete')}
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
  titleContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.border,
    borderRadius: 8,
  },
  exerciseType: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  restTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  restTimerIcon: {
    fontSize: 16,
  },
  restTimerText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  tableContainer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  tableHeaderText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tableCell: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  colSet: {
    width: 40,
  },
  colPrevious: {
    width: 80,
  },
  colKg: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  colReps: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  colCheck: {
    width: 40,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  inputHighlighted: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  checkboxHighlighted: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addSetButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  addSetText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  hintBox: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: colors.primaryLight + '30',
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  hintTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  hintSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
