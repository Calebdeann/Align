import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TICK_SPACING = 6;

// Weight range in lbs: 80-350
const MIN_LBS = 80;
const MAX_LBS = 350;

// kg range (converted from lbs)
const MIN_KG = Math.round(MIN_LBS * 0.453592); // ~36
const MAX_KG = Math.round(MAX_LBS * 0.453592); // ~159

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
  const [unit, setUnit] = useState<'kg' | 'lb'>('lb');
  const [weightLbs, setWeightLbs] = useState(targetWeight);
  const scrollViewRef = useRef<ScrollView>(null);

  const goalInfo = getGoalInfo(currentWeight, weightLbs);

  // Convert between units for display
  const weightKg = Math.round(weightLbs * 0.453592 * 10) / 10;
  const displayWeight = unit === 'lb' ? weightLbs.toFixed(1) : weightKg.toFixed(1);

  // When unit changes, scroll to the equivalent position
  useEffect(() => {
    if (unit === 'kg') {
      const kgValue = weightLbs * 0.453592;
      const offset = (kgValue - MIN_KG) * 10 * TICK_SPACING;
      scrollViewRef.current?.scrollTo({ x: Math.max(0, offset), animated: false });
    } else {
      const offset = (weightLbs - MIN_LBS) * 10 * TICK_SPACING;
      scrollViewRef.current?.scrollTo({ x: Math.max(0, offset), animated: false });
    }
  }, [unit]);

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    if (unit === 'lb') {
      const newWeight = MIN_LBS + x / TICK_SPACING / 10;
      const clampedWeight = Math.min(Math.max(newWeight, MIN_LBS), MAX_LBS);
      setWeightLbs(Math.round(clampedWeight * 10) / 10);
    } else {
      // kg mode - convert back to lbs for storage
      const newKg = MIN_KG + x / TICK_SPACING / 10;
      const clampedKg = Math.min(Math.max(newKg, MIN_KG), MAX_KG);
      const lbsValue = clampedKg / 0.453592;
      setWeightLbs(Math.round(lbsValue * 10) / 10);
    }
  };

  const handleScrollEnd = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    // Snap to nearest 0.1 unit
    const snappedX = Math.round(x / TICK_SPACING) * TICK_SPACING;
    scrollViewRef.current?.scrollTo({ x: snappedX, animated: true });
  };

  // Generate lb ruler ticks
  const lbRulerTicks = useMemo(() => {
    const ticks = [];
    const totalTicks = (MAX_LBS - MIN_LBS) * 10;

    for (let i = 0; i <= totalTicks; i++) {
      const lbValue = MIN_LBS + i / 10;
      const isWholeLb = i % 10 === 0;

      ticks.push(
        <View key={i} style={styles.tickColumn}>
          {isWholeLb && <Text style={styles.tickLabel}>{Math.round(lbValue)}</Text>}
          <View style={[styles.tick, isWholeLb ? styles.tickMajor : styles.tickMinor]} />
        </View>
      );
    }
    return ticks;
  }, []);

  // Generate kg ruler ticks - same structure as lbs, just with kg values
  const kgRulerTicks = useMemo(() => {
    const ticks = [];
    const totalTicks = (MAX_KG - MIN_KG) * 10;

    for (let i = 0; i <= totalTicks; i++) {
      const kgValue = MIN_KG + i / 10;
      const isWholeKg = i % 10 === 0;

      ticks.push(
        <View key={i} style={styles.tickColumn}>
          {isWholeKg && <Text style={styles.tickLabel}>{Math.round(kgValue)}</Text>}
          <View style={[styles.tick, isWholeKg ? styles.tickMajor : styles.tickMinor]} />
        </View>
      );
    }
    return ticks;
  }, []);

  // Calculate initial offset based on current unit
  const initialOffset =
    unit === 'lb'
      ? (targetWeight - MIN_LBS) * 10 * TICK_SPACING
      : (targetWeight * 0.453592 - MIN_KG) * 10 * TICK_SPACING;

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '75%' }]} />
        </View>

        <Pressable onPress={() => router.push('/onboarding/goal-reality')}>
          <Text style={styles.skipText}>Skip</Text>
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
            onPress={() => setUnit('kg')}
          >
            <Text style={[styles.toggleText, unit === 'kg' && styles.toggleTextActive]}>kg</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleOption, unit === 'lb' && styles.toggleOptionActive]}
            onPress={() => setUnit('lb')}
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
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={8}
          decelerationRate={0.992}
          contentContainerStyle={{
            paddingHorizontal: SCREEN_WIDTH / 2,
          }}
          contentOffset={{ x: initialOffset, y: 0 }}
        >
          <View style={styles.rulerContainer}>{unit === 'lb' ? lbRulerTicks : kgRulerTicks}</View>
        </ScrollView>
      </View>

      {/* Goal Info Box */}
      {weightLbs !== currentWeight && (
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

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={styles.continueButton}
          onPress={() => {
            setTargetWeight(weightLbs);
            router.push('/onboarding/goal-reality');
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
    left: SCREEN_WIDTH / 2 - 1,
    bottom: 0,
    height: 45,
    width: 2,
    backgroundColor: colors.primary,
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
  tickLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
    width: 30,
    textAlign: 'center',
  },
  goalInfoBox: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
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
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
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
  continueText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
});
