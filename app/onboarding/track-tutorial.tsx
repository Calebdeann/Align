import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { filterNumericInput } from '@/utils/units';
import { ExerciseImage } from '@/components/ExerciseImage';

type Step = 1 | 2 | 3 | 'complete';

const SUGGESTED_WEIGHT = '20';
const SUGGESTED_REPS = '10';

export default function TrackTutorialScreen() {
  const { exerciseName, gifUrl } = useLocalSearchParams<{ exerciseName: string; gifUrl: string }>();
  const [step, setStep] = useState<Step>(1);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [isChecked, setIsChecked] = useState(false);

  const repsInputRef = useRef<TextInput>(null);
  const weightInputRef = useRef<TextInput>(null);
  const weightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const repsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus weight input on mount to open keyboard
  useEffect(() => {
    setTimeout(() => {
      weightInputRef.current?.focus();
    }, 300);
  }, []);

  // Auto-advance after 2s delay when weight is entered
  useEffect(() => {
    if (weightTimerRef.current) {
      clearTimeout(weightTimerRef.current);
    }
    if (weight.trim() && step === 1) {
      weightTimerRef.current = setTimeout(() => {
        handleWeightSubmit();
      }, 2000);
    }
    return () => {
      if (weightTimerRef.current) clearTimeout(weightTimerRef.current);
    };
  }, [weight, step]);

  // Auto-advance after 2s delay when reps is entered
  useEffect(() => {
    if (repsTimerRef.current) {
      clearTimeout(repsTimerRef.current);
    }
    if (reps.trim() && step === 2) {
      repsTimerRef.current = setTimeout(() => {
        handleRepsSubmit();
      }, 2000);
    }
    return () => {
      if (repsTimerRef.current) clearTimeout(repsTimerRef.current);
    };
  }, [reps, step]);

  const handleWeightSubmit = () => {
    if (weight.trim()) {
      setStep(2);
      Keyboard.dismiss();
      setTimeout(() => {
        repsInputRef.current?.focus();
      }, 100);
    }
  };

  const handleRepsSubmit = () => {
    if (reps.trim()) {
      setStep(3);
      Keyboard.dismiss();
    }
  };

  const handleCheck = () => {
    // Only allow checking if both weight and reps are filled
    if (!weight.trim() || !reps.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsChecked(true);
    setStep('complete');
  };

  const getInstructionText = () => {
    switch (step) {
      case 1:
        return { title: 'Enter the weight', subtitle: "If you don't know, enter a guess" };
      case 2:
        return { title: 'Enter a rep number', subtitle: "If you don't know, enter a guess" };
      case 3:
        return { title: 'Tap the checkmark', subtitle: 'This logs your set' };
      case 'complete':
        return { title: 'Well done!!!', subtitle: "Tap 'Continue'" };
    }
  };

  const instruction = getInstructionText();
  const canContinue = step === 'complete';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '78%' }]} />
        </View>

        <View style={{ width: 32 }} />
      </View>

      {/* Title */}
      <Text style={styles.titleText}>{exerciseName || 'Hip Thrust'}</Text>

      {/* Exercise info */}
      <View style={styles.exerciseInfo}>
        <ExerciseImage gifUrl={gifUrl} size={40} borderRadius={8} />
        <Text style={styles.exerciseName}>{exerciseName || 'Hip Thrust'}</Text>
      </View>

      {/* Rest timer */}
      <View style={styles.restTimer}>
        <Text style={styles.timerIcon}>⏱</Text>
        <Text style={styles.timerText}>Rest Timer: OFF</Text>
      </View>

      {/* Set row header */}
      <View style={styles.setHeader}>
        <Text style={[styles.setHeaderText, styles.setColumn]}>SET</Text>
        <Text style={[styles.setHeaderText, styles.previousColumn]}>PREVIOUS</Text>
        <Text style={[styles.setHeaderText, styles.kgColumn]}>KG</Text>
        <Text style={[styles.setHeaderText, styles.repsColumn]}>REPS</Text>
        <View style={styles.checkColumn} />
      </View>

      {/* Set row */}
      <View style={[styles.setRow, isChecked && styles.setRowCompleted]}>
        <View style={styles.setColumn}>
          <Text style={styles.setNumber}>1</Text>
        </View>
        <View style={styles.previousColumn}>
          <Text style={styles.previousValue}>-</Text>
        </View>

        {/* Weight input */}
        <View style={styles.kgColumn}>
          <Pressable
            style={[styles.inputBox, step === 1 && styles.inputBoxHighlighted]}
            onPress={() => weightInputRef.current?.focus()}
          >
            <TextInput
              ref={weightInputRef}
              style={styles.inputText}
              value={weight}
              onChangeText={(value) => setWeight(filterNumericInput(value))}
              placeholder={SUGGESTED_WEIGHT}
              placeholderTextColor={colors.textSecondary + '30'}
              keyboardType="number-pad"
              onSubmitEditing={handleWeightSubmit}
              onBlur={() => {
                if (weight.trim() && step === 1) {
                  handleWeightSubmit();
                }
              }}
            />
          </Pressable>
        </View>

        {/* Reps input */}
        <View style={styles.repsColumn}>
          <Pressable
            style={[styles.inputBox, step === 2 && styles.inputBoxHighlighted]}
            onPress={() => repsInputRef.current?.focus()}
          >
            <TextInput
              ref={repsInputRef}
              style={styles.inputText}
              value={reps}
              onChangeText={(value) => setReps(filterNumericInput(value, false))}
              placeholder={SUGGESTED_REPS}
              placeholderTextColor={colors.textSecondary + '30'}
              keyboardType="number-pad"
              onSubmitEditing={handleRepsSubmit}
              onBlur={() => {
                if (reps.trim() && step === 2) {
                  handleRepsSubmit();
                }
              }}
            />
          </Pressable>
        </View>

        {/* Checkbox */}
        <View style={styles.checkColumn}>
          <Pressable
            style={[
              styles.checkbox,
              step === 3 && styles.checkboxHighlighted,
              isChecked && styles.checkboxChecked,
            ]}
            onPress={handleCheck}
          >
            {isChecked ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : (
              <Text style={styles.checkmarkEmpty}>✓</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Add Set button */}
      <Pressable style={styles.addSetButton}>
        <Text style={styles.addSetText}>Add Set</Text>
      </Pressable>

      {/* Instruction card */}
      <View style={styles.instructionCard}>
        <Text style={styles.instructionTitle}>{instruction.title}</Text>
        <Text style={styles.instructionSubtitle}>{instruction.subtitle}</Text>
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          onPress={() => {
            if (canContinue) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.push('/onboarding/complete');
            }
          }}
          disabled={!canContinue}
        >
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // White background for exercise images to blend
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
  titleText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  exerciseName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  restTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  timerIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  timerText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  setHeaderText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  setColumn: {
    flex: 1,
    textAlign: 'center',
  },
  previousColumn: {
    flex: 1.5,
    textAlign: 'center',
  },
  kgColumn: {
    flex: 1,
  },
  repsColumn: {
    flex: 1,
  },
  checkColumn: {
    flex: 0.8,
    alignItems: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  setRowCompleted: {
    backgroundColor: colors.primary + '20',
    marginHorizontal: spacing.md,
    borderRadius: 12,
  },
  setNumber: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  previousValue: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  inputBox: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: 4,
  },
  inputBoxHighlighted: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    width: '100%',
    height: '100%',
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
  checkmarkEmpty: {
    color: colors.border,
    fontSize: 16,
  },
  addSetButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  addSetText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  instructionCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  instructionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  instructionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
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
});
