import React, { useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { lbsToKg, kgToLbs } from '@/utils/units';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TICK_SPACING = 12; // Spacing between each whole number tick - larger for easier dragging

// Weight ranges
const MIN_LBS = 60;
const MAX_LBS = 600;
const MIN_KG = 30;
const MAX_KG = 250;

// Starting weights
const DEFAULT_LBS = 130;
const DEFAULT_KG = 58;

// Goal difficulty thresholds based on percentage of body weight change
function getGoalInfo(currentWeight: number, targetWeight: number) {
  const diff = Math.abs(targetWeight - currentWeight);
  const percentChange = (diff / currentWeight) * 100;
  const isLosing = targetWeight < currentWeight;

  let difficulty: 'moderate' | 'challenging' | 'difficult';
  let description: string;

  if (percentChange < 10) {
    difficulty = 'moderate';
    description =
      'Moderate dietary control and physical activity aid fat reduction, enhance health levels.';
  } else if (percentChange < 20) {
    difficulty = 'challenging';
    description =
      'This goal requires consistent effort and dedication. Stay committed to your plan!';
  } else {
    difficulty = 'difficult';
    description =
      'This is an ambitious goal! Consider breaking it into smaller milestones for better success.';
  }

  return {
    difficulty,
    percentChange: Math.round(percentChange),
    isLosing,
    description,
  };
}

export default function TargetWeightScreen() {
  const { currentWeight, targetWeight, setTargetWeight } = useOnboardingStore();
  const { weightUnit, setWeightUnit } = useUserPreferencesStore();
  const [isNavigating, setIsNavigating] = useState(false);

  // Derive display unit from preferences ('lbs' -> 'lb' for UI)
  const unit = weightUnit === 'lbs' ? 'lb' : 'kg';

  // Internal state stores weight in lbs for ruler calculations
  // targetWeight from store is in kg, convert to lbs for initial value
  const getInitialWeightLbs = () => {
    if (targetWeight > 0) {
      return kgToLbs(targetWeight);
    }
    // Default to current weight if available
    if (currentWeight > 0) {
      return kgToLbs(currentWeight);
    }
    return weightUnit === 'lbs' ? DEFAULT_LBS : kgToLbs(DEFAULT_KG);
  };

  const [weightLbs, setWeightLbs] = useState(getInitialWeightLbs);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastWeightRef = useRef(Math.round(getInitialWeightLbs()));

  // Reset navigation state when screen comes into focus (e.g., user navigates back)
  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, [])
  );

  // currentWeight is in kg, convert to lbs for comparison
  const currentWeightLbs = kgToLbs(currentWeight);
  const goalInfo = getGoalInfo(currentWeightLbs, weightLbs);

  // Convert between units for display (whole numbers only)
  const weightKg = lbsToKg(weightLbs);
  const displayWeight = unit === 'lb' ? Math.round(weightLbs) : Math.round(weightKg);

  // Update preferences when user toggles unit - reset to default for that unit
  const handleUnitChange = (newUnit: 'kg' | 'lb') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setWeightUnit(newUnit === 'lb' ? 'lbs' : 'kg');

    // Reset to default weight for the new unit
    if (newUnit === 'lb') {
      setWeightLbs(DEFAULT_LBS);
      lastWeightRef.current = DEFAULT_LBS;
      const offset = (DEFAULT_LBS - MIN_LBS) * TICK_SPACING;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: offset, animated: false });
      }, 50);
    } else {
      const defaultLbsFromKg = DEFAULT_KG / 0.453592;
      setWeightLbs(defaultLbsFromKg);
      lastWeightRef.current = DEFAULT_KG;
      const offset = (DEFAULT_KG - MIN_KG) * TICK_SPACING;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: offset, animated: false });
      }, 50);
    }
  };

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    let newDisplayWeight: number;

    if (unit === 'lb') {
      // Each tick = 1 lb
      const newWeight = MIN_LBS + x / TICK_SPACING;
      const clampedWeight = Math.min(Math.max(Math.round(newWeight), MIN_LBS), MAX_LBS);
      setWeightLbs(clampedWeight);
      newDisplayWeight = clampedWeight;
    } else {
      // Each tick = 1 kg, convert back to lbs for storage
      const newKg = MIN_KG + x / TICK_SPACING;
      const clampedKg = Math.min(Math.max(Math.round(newKg), MIN_KG), MAX_KG);
      const lbsValue = clampedKg / 0.453592;
      setWeightLbs(lbsValue);
      newDisplayWeight = clampedKg;
    }

    // Strong haptic feedback when weight value changes
    if (newDisplayWeight !== lastWeightRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      lastWeightRef.current = newDisplayWeight;
    }
  };

  // Generate lb ruler ticks - 1 tick per lb, major tick every 10 lbs
  const lbRulerTicks = useMemo(() => {
    const ticks = [];
    const totalTicks = MAX_LBS - MIN_LBS;

    for (let i = 0; i <= totalTicks; i++) {
      const isMajorTick = i % 10 === 0;

      ticks.push(
        <View key={i} style={styles.tickColumn}>
          <View style={[styles.tick, isMajorTick ? styles.tickMajor : styles.tickMinor]} />
        </View>
      );
    }
    return ticks;
  }, []);

  // Generate kg ruler ticks - 1 tick per kg, major tick every 10 kg
  const kgRulerTicks = useMemo(() => {
    const ticks = [];
    const totalTicks = MAX_KG - MIN_KG;

    for (let i = 0; i <= totalTicks; i++) {
      const isMajorTick = i % 10 === 0;

      ticks.push(
        <View key={i} style={styles.tickColumn}>
          <View style={[styles.tick, isMajorTick ? styles.tickMajor : styles.tickMinor]} />
        </View>
      );
    }
    return ticks;
  }, []);

  // Calculate initial offset based on current unit (1 tick per whole unit)
  const initialOffset =
    unit === 'lb'
      ? (Math.round(weightLbs) - MIN_LBS) * TICK_SPACING
      : (Math.round(weightLbs * 0.453592) - MIN_KG) * TICK_SPACING;

  const getDifficultyColor = () => {
    switch (goalInfo.difficulty) {
      case 'moderate':
        return '#4A90D9'; // Blue
      case 'challenging':
        return '#F5A623'; // Orange
      case 'difficult':
        return '#D0021B'; // Red
    }
  };

  // Check if target weight differs from current weight
  const showGoalInfo = Math.round(weightLbs) !== Math.round(currentWeightLbs) && currentWeight > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '36%' }]} />
        </View>

        <Pressable
          onPress={() => {
            if (isNavigating) return;
            setIsNavigating(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            useOnboardingStore.getState().skipField('targetWeight');
            // Skip goal screens since user didn't set a target weight
            router.push('/onboarding/health-situations');
          }}
          disabled={isNavigating}
        >
          <Text style={[styles.skipText, isNavigating && styles.skipTextDisabled]}>Skip</Text>
        </Pressable>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          What is your <Text style={styles.targetText}>target</Text> weight?
        </Text>
      </View>

      {/* Unit Toggle */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggleBackground}>
          <Pressable
            style={[styles.toggleOption, unit === 'kg' && styles.toggleOptionActive]}
            onPress={() => handleUnitChange('kg')}
          >
            <Text style={[styles.toggleText, unit === 'kg' && styles.toggleTextActive]}>kg</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleOption, unit === 'lb' && styles.toggleOptionActive]}
            onPress={() => handleUnitChange('lb')}
          >
            <Text style={[styles.toggleText, unit === 'lb' && styles.toggleTextActive]}>lb</Text>
          </Pressable>
        </View>
      </View>

      {/* Weight Display */}
      <View style={styles.weightDisplayContainer}>
        <Text style={styles.weightNumber}>{displayWeight}</Text>
        <Text style={styles.weightUnit}>{unit}</Text>
      </View>

      {/* Ruler section - centered */}
      <View style={styles.rulerSection}>
        {/* Center indicator line - pointing UP */}
        <View style={styles.indicatorLine} />

        {/* Shaded area to the right */}
        <View style={styles.shadedRight} />

        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="normal"
          bounces={true}
          contentContainerStyle={{
            paddingHorizontal: SCREEN_WIDTH / 2,
          }}
          contentOffset={{ x: initialOffset, y: 0 }}
        >
          <View style={styles.rulerContainer}>{unit === 'lb' ? lbRulerTicks : kgRulerTicks}</View>
        </ScrollView>
      </View>

      {/* Goal Info Box - only shown when target differs from current */}
      {showGoalInfo && (
        <View style={styles.goalInfoBox}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalIcon}>📊</Text>
            <Text style={[styles.goalTitle, { color: getDifficultyColor() }]}>
              {goalInfo.difficulty.charAt(0).toUpperCase() + goalInfo.difficulty.slice(1)} goal:
            </Text>
          </View>
          <Text style={styles.goalMainText}>
            you will {goalInfo.isLosing ? 'lose' : 'gain'}{' '}
            <Text style={[styles.goalHighlight, { color: getDifficultyColor() }]}>
              {goalInfo.percentChange}%
            </Text>{' '}
            of your weight
          </Text>
          <Text style={styles.goalDescription}>{goalInfo.description}</Text>
        </View>
      )}

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={[styles.continueButton, isNavigating && styles.continueButtonDisabled]}
          disabled={isNavigating}
          onPress={() => {
            if (isNavigating) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setIsNavigating(true);
            // Always store weight in kg
            const weightInKg = lbsToKg(weightLbs);
            setTargetWeight(weightInKg);
            // Save to Supabase (in kg)
            useOnboardingStore.getState().setAndSave('targetWeight', weightInKg);

            // If target weight equals current weight (maintaining), skip goal screens
            const isMaintaining = Math.abs(weightLbs - currentWeightLbs) < 1;
            if (isMaintaining) {
              router.push('/onboarding/health-situations');
            } else {
              router.push('/onboarding/goal-reality');
            }
          }}
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
    backgroundColor: colors.backgroundOnboarding,
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
  skipTextDisabled: {
    opacity: 0.5,
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
  },
  targetText: {
    color: colors.primary,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  toggleBackground: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 25,
    padding: 4,
  },
  toggleOption: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  toggleOptionActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.text,
  },
  weightDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  weightNumber: {
    fontFamily: fonts.bold,
    fontSize: 72,
    color: colors.text,
  },
  weightUnit: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  rulerSection: {
    height: 80,
    position: 'relative',
  },
  indicatorLine: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2 - 1.5,
    bottom: 0,
    height: 60,
    width: 3,
    backgroundColor: colors.primary,
    borderRadius: 1.5,
    zIndex: 10,
    pointerEvents: 'none',
  },
  shadedRight: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary + '12',
    zIndex: 1,
    pointerEvents: 'none',
  },
  rulerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
  },
  tickColumn: {
    width: TICK_SPACING,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 1,
  },
  tick: {
    backgroundColor: colors.border,
  },
  tickMajor: {
    width: 2,
    height: 30,
  },
  tickMinor: {
    width: 1,
    height: 15,
  },
  goalInfoBox: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: '#E8F4FD',
    borderRadius: 16,
    padding: spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  goalIcon: {
    fontSize: 18,
  },
  goalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
  },
  goalMainText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  goalHighlight: {
    fontFamily: fonts.bold,
  },
  goalDescription: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
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
    opacity: 0.7,
  },
  continueText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
});
