import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { lbsToKg, kgToLbs } from '@/utils/units';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TICK_SPACING = 6;

// Weight range in lbs: 80-350
const MIN_LBS = 80;
const MAX_LBS = 350;

// kg range (converted from lbs)
const MIN_KG = Math.round(MIN_LBS * 0.453592); // ~36
const MAX_KG = Math.round(MAX_LBS * 0.453592); // ~159

export default function WeightScreen() {
  const { currentWeight, setCurrentWeight, setTargetWeight } = useOnboardingStore();
  const { weightUnit, setWeightUnit } = useUserPreferencesStore();

  // Derive display unit from preferences ('lbs' -> 'lb' for UI)
  const unit = weightUnit === 'lbs' ? 'lb' : 'kg';

  // Internal state stores weight in lbs for ruler calculations
  // currentWeight from store is in kg, convert to lbs for initial value
  const getInitialWeightLbs = () => {
    if (currentWeight > 0) {
      return kgToLbs(currentWeight);
    }
    // Default based on unit preference
    return weightUnit === 'lbs' ? 132.3 : kgToLbs(60);
  };

  const [weightLbs, setWeightLbs] = useState(getInitialWeightLbs);
  const scrollViewRef = useRef<ScrollView>(null);

  // Convert between units for display
  const weightKg = lbsToKg(weightLbs);
  const displayWeight = unit === 'lb' ? weightLbs.toFixed(1) : weightKg.toFixed(1);

  // Update preferences when user toggles unit
  const handleUnitChange = (newUnit: 'kg' | 'lb') => {
    setWeightUnit(newUnit === 'lb' ? 'lbs' : 'kg');
  };

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
      ? (currentWeight - MIN_LBS) * 10 * TICK_SPACING
      : (currentWeight * 0.453592 - MIN_KG) * 10 * TICK_SPACING;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '70%' }]} />
        </View>

        <Pressable
          onPress={() => {
            useOnboardingStore.getState().skipField('currentWeight');
            router.push('/onboarding/target-weight');
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>What is your current weight?</Text>
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

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={styles.continueButton}
          onPress={() => {
            // Always store weight in kg
            const weightInKg = lbsToKg(weightLbs);
            setCurrentWeight(weightInKg);
            setTargetWeight(weightInKg);
            // Save to Supabase (in kg)
            useOnboardingStore.getState().setAndSave('currentWeight', weightInKg);
            useOnboardingStore.getState().setAndSave('unit', unit === 'lb' ? 'lb' : 'kg');
            router.push('/onboarding/target-weight');
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
  continueText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
});
