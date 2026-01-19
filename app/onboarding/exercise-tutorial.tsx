import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Keyboard, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { filterNumericInput } from '@/utils/units';

type TutorialStep = 'weight' | 'reps' | 'checkmark' | 'complete';

const hints: Record<TutorialStep, { title: string; subtitle: string }> = {
  weight: {
    title: 'Enter the weight',
    subtitle: "If you don't know, enter a guess",
  },
  reps: {
    title: 'Enter a rep number',
    subtitle: "If you don't know, enter a guess",
  },
  checkmark: {
    title: 'Tap the checkmark',
    subtitle: 'This logs your set',
  },
  complete: {
    title: 'Well done!!!',
    subtitle: "Tap 'Continue'",
  },
};

export default function ExerciseTutorialScreen() {
  const { exerciseName } = useLocalSearchParams<{ exerciseName: string }>();
  const [step, setStep] = useState<TutorialStep>('weight');
  const [kg, setKg] = useState('');
  const [reps, setReps] = useState('');
  const [isChecked, setIsChecked] = useState(false);

  const weightInputRef = useRef<TextInput>(null);
  const repsInputRef = useRef<TextInput>(null);

  // Celebration animation values
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const confettiAnimations = useRef(
    Array.from({ length: 12 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
    }))
  ).current;

  // Auto-focus weight input on mount to open keyboard
  useEffect(() => {
    setTimeout(() => {
      weightInputRef.current?.focus();
    }, 300);
  }, []);

  const handleKgChange = (value: string) => {
    setKg(filterNumericInput(value));
  };

  const handleKgSubmit = () => {
    if (kg.trim()) {
      setStep('reps');
      Keyboard.dismiss();
      setTimeout(() => {
        repsInputRef.current?.focus();
      }, 100);
    }
  };

  const handleRepsChange = (value: string) => {
    setReps(filterNumericInput(value, false));
  };

  const handleRepsSubmit = () => {
    if (reps.trim()) {
      setStep('checkmark');
      Keyboard.dismiss();
    }
  };

  const playCelebration = () => {
    setShowCelebration(true);

    // Reset animations
    celebrationScale.setValue(0);
    celebrationOpacity.setValue(1);
    confettiAnimations.forEach((anim) => {
      anim.translateY.setValue(0);
      anim.translateX.setValue(0);
      anim.opacity.setValue(1);
      anim.rotate.setValue(0);
    });

    // Main celebration pulse
    Animated.sequence([
      Animated.spring(celebrationScale, {
        toValue: 1.2,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(celebrationScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti burst animation
    const confettiPromises = confettiAnimations.map((anim, index) => {
      const angle = (index / confettiAnimations.length) * Math.PI * 2;
      const distance = 80 + Math.random() * 60;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance - 40;

      return Animated.parallel([
        Animated.timing(anim.translateX, {
          toValue: targetX,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: targetY,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: Math.random() * 4 - 2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 600,
          delay: 300,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(confettiPromises).start(() => {
      setTimeout(() => setShowCelebration(false), 100);
    });
  };

  const handleCheck = () => {
    setIsChecked(true);
    setStep('complete');
    playCelebration();
  };

  const canContinue = step === 'complete';

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
        <View style={[styles.tableRow, isChecked && styles.tableRowCompleted]}>
          <Text style={[styles.tableCell, styles.colSet]}>1</Text>
          <Text style={[styles.tableCell, styles.colPrevious]}>-</Text>
          <View style={styles.colKg}>
            <TextInput
              ref={weightInputRef}
              style={[
                styles.input,
                step === 'weight' && styles.inputHighlighted,
                isChecked && styles.inputCompleted,
              ]}
              value={kg}
              onChangeText={handleKgChange}
              placeholder="20"
              placeholderTextColor={colors.textSecondary + '80'}
              keyboardType="numeric"
              returnKeyType="done"
              autoCorrect={false}
              editable={true}
              selectTextOnFocus={true}
              onSubmitEditing={handleKgSubmit}
              onEndEditing={() => {
                if (kg.trim() && step === 'weight') {
                  handleKgSubmit();
                }
              }}
            />
          </View>
          <View style={styles.colReps}>
            <TextInput
              ref={repsInputRef}
              style={[
                styles.input,
                step === 'reps' && styles.inputHighlighted,
                isChecked && styles.inputCompleted,
              ]}
              value={reps}
              onChangeText={handleRepsChange}
              placeholder="10"
              placeholderTextColor={colors.textSecondary + '80'}
              keyboardType="numeric"
              returnKeyType="done"
              autoCorrect={false}
              editable={true}
              selectTextOnFocus={true}
              onSubmitEditing={handleRepsSubmit}
              onEndEditing={() => {
                if (reps.trim() && step === 'reps') {
                  handleRepsSubmit();
                }
              }}
            />
          </View>
          <View style={styles.colCheck}>
            <Pressable
              style={[
                styles.checkbox,
                step === 'checkmark' && styles.checkboxHighlighted,
                isChecked && styles.checkboxChecked,
              ]}
              onPress={step === 'checkmark' ? handleCheck : undefined}
            >
              {isChecked ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <Text style={styles.checkmarkEmpty}>✓</Text>
              )}
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
          onPress={() => {
            if (canContinue) {
              router.push('/onboarding/complete');
            }
          }}
          disabled={!canContinue}
        >
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </View>

      {/* Celebration Overlay */}
      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Animated.View
            style={[styles.celebrationCenter, { transform: [{ scale: celebrationScale }] }]}
          >
            <Text style={styles.celebrationEmoji}>🎉</Text>
          </Animated.View>
          {confettiAnimations.map((anim, index) => {
            const confettiColors = [
              colors.primary,
              '#FFD700',
              '#FF6B6B',
              '#4ECDC4',
              '#FF9F43',
              '#A29BFE',
            ];
            const confettiEmojis = ['✨', '⭐', '💪', '🔥', '💜', '🏋️'];
            return (
              <Animated.View
                key={index}
                style={[
                  styles.confettiPiece,
                  {
                    backgroundColor: confettiColors[index % confettiColors.length],
                    transform: [
                      { translateX: anim.translateX },
                      { translateY: anim.translateY },
                      {
                        rotate: anim.rotate.interpolate({
                          inputRange: [-2, 2],
                          outputRange: ['-180deg', '180deg'],
                        }),
                      },
                    ],
                    opacity: anim.opacity,
                  },
                ]}
              >
                <Text style={styles.confettiEmoji}>
                  {confettiEmojis[index % confettiEmojis.length]}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      )}
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
  tableRowCompleted: {
    backgroundColor: colors.primary + '20',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
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
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.background,
  },
  inputHighlighted: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputCompleted: {
    borderWidth: 0,
    backgroundColor: 'transparent',
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
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  celebrationCenter: {
    position: 'absolute',
    top: '35%',
  },
  celebrationEmoji: {
    fontSize: 80,
  },
  confettiPiece: {
    position: 'absolute',
    top: '35%',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiEmoji: {
    fontSize: 20,
  },
});
