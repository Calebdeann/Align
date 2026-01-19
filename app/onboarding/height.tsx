import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TICK_SPACING = 12; // Increased for better readability

// Height range: 4ft 0in (48in) to 8ft 0in (96in)
const MIN_INCHES = 48;
const MAX_INCHES = 96;
const TOTAL_INCHES = MAX_INCHES - MIN_INCHES;
const RULER_HEIGHT = TOTAL_INCHES * TICK_SPACING;

export default function HeightScreen() {
  const { measurementUnit, setMeasurementUnit } = useUserPreferencesStore();

  // Derive display unit from preferences
  const unit = measurementUnit === 'cm' ? 'cm' : 'ft';

  const [heightInches, setHeightInches] = useState(63);

  // Update preferences when user toggles unit
  const handleUnitChange = (newUnit: 'cm' | 'ft') => {
    setMeasurementUnit(newUnit === 'cm' ? 'cm' : 'in');
  };

  // Single scroll value - both units use same ruler structure
  const scrollY = useRef(new Animated.Value((63 - MIN_INCHES) * TICK_SPACING)).current;
  const lastOffset = useRef((63 - MIN_INCHES) * TICK_SPACING);

  const feet = Math.floor(heightInches / 12);
  const inches = heightInches % 12;
  const cm = Math.round(heightInches * 2.54);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          scrollY.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          const newOffset = lastOffset.current - gestureState.dy;
          const clampedOffset = Math.min(Math.max(newOffset, 0), RULER_HEIGHT);
          scrollY.setValue(clampedOffset);
          const newInches = Math.round(MIN_INCHES + clampedOffset / TICK_SPACING);
          setHeightInches(Math.min(Math.max(newInches, MIN_INCHES), MAX_INCHES));
        },
        onPanResponderRelease: (_, gestureState) => {
          const newOffset = lastOffset.current - gestureState.dy;
          const clampedOffset = Math.min(Math.max(newOffset, 0), RULER_HEIGHT);
          const snappedOffset = Math.round(clampedOffset / TICK_SPACING) * TICK_SPACING;
          lastOffset.current = snappedOffset;
          const newInches = Math.round(MIN_INCHES + snappedOffset / TICK_SPACING);
          setHeightInches(Math.min(Math.max(newInches, MIN_INCHES), MAX_INCHES));
          Animated.spring(scrollY, {
            toValue: snappedOffset,
            useNativeDriver: true,
            tension: 100,
            friction: 12,
          }).start();
        },
      }),
    []
  );

  // Generate ruler ticks for feet/inches
  const feetRulerTicks = useMemo(() => {
    const ticks = [];
    for (let i = MIN_INCHES; i <= MAX_INCHES; i++) {
      const ft = Math.floor(i / 12);
      const inch = i % 12;
      const isFoot = inch === 0;
      const isHalfFoot = inch === 6;

      ticks.push(
        <View key={i} style={styles.tickRow}>
          <View
            style={[
              styles.tick,
              isFoot ? styles.tickMajor : isHalfFoot ? styles.tickMedium : styles.tickMinor,
            ]}
          />
          {isFoot && <Text style={styles.tickLabel}>{ft}ft</Text>}
        </View>
      );
    }
    return ticks;
  }, []);

  // Generate ruler ticks for centimeters - same spacing as ft for consistency
  const cmRulerTicks = useMemo(() => {
    const ticks = [];
    // Use same number of ticks as inches but label with cm values
    for (let i = MIN_INCHES; i <= MAX_INCHES; i++) {
      const cmValue = Math.round(i * 2.54);
      const isTen = cmValue % 10 === 0;
      const isFive = cmValue % 5 === 0 && !isTen;

      ticks.push(
        <View key={i} style={styles.tickRow}>
          <View
            style={[
              styles.tick,
              isTen ? styles.tickMajor : isFive ? styles.tickMedium : styles.tickMinor,
            ]}
          />
          {isTen && <Text style={styles.tickLabel}>{cmValue}</Text>}
        </View>
      );
    }
    return ticks;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '65%' }]} />
        </View>

        <Pressable
          onPress={() => {
            useOnboardingStore.getState().skipField('heightInches');
            router.push('/onboarding/weight');
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>How tall are you?</Text>
        <Text style={styles.subtitle}>This will be used to calibrate your custom plan.</Text>
      </View>

      {/* Unit Toggle */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggleBackground}>
          <Pressable
            style={[styles.toggleOption, unit === 'cm' && styles.toggleOptionActive]}
            onPress={() => handleUnitChange('cm')}
          >
            <Text style={[styles.toggleText, unit === 'cm' && styles.toggleTextActive]}>cm</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleOption, unit === 'ft' && styles.toggleOptionActive]}
            onPress={() => handleUnitChange('ft')}
          >
            <Text style={[styles.toggleText, unit === 'ft' && styles.toggleTextActive]}>ft</Text>
          </Pressable>
        </View>
      </View>

      {/* Main draggable area */}
      <View style={styles.mainArea} {...panResponder.panHandlers}>
        {/* Left side ruler */}
        <View style={styles.rulerContainer}>
          <Animated.View
            style={[
              styles.rulerContent,
              {
                transform: [
                  {
                    translateY: Animated.subtract(new Animated.Value(120), scrollY),
                  },
                ],
              },
            ]}
          >
            {unit === 'ft' ? feetRulerTicks : cmRulerTicks}
          </Animated.View>
        </View>

        {/* Center display area */}
        <View style={styles.centerDisplay}>
          <View style={styles.heightDisplay}>
            {unit === 'ft' ? (
              <View style={styles.heightRow}>
                <Text style={styles.heightNumber}>{feet}</Text>
                <Text style={styles.heightUnit}>ft</Text>
                <Text style={styles.heightNumber}>{inches}</Text>
                <Text style={styles.heightUnit}>in</Text>
              </View>
            ) : (
              <View style={styles.heightRow}>
                <Text style={styles.heightNumber}>{cm}</Text>
                <Text style={styles.heightUnit}>cm</Text>
              </View>
            )}
          </View>

          {/* Purple indicator line - under the number */}
          <View style={styles.indicatorLine} />
        </View>
      </View>

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={styles.continueButton}
          onPress={() => {
            useOnboardingStore.getState().setAndSave('heightInches', heightInches);
            router.push('/onboarding/weight');
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
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
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
  mainArea: {
    flex: 1,
    flexDirection: 'row',
  },
  rulerContainer: {
    width: 110,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  rulerContent: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  tickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TICK_SPACING,
    paddingLeft: spacing.sm,
  },
  tick: {
    backgroundColor: colors.border,
  },
  tickMajor: {
    width: 28,
    height: 2,
  },
  tickMedium: {
    width: 18,
    height: 1.5,
  },
  tickMinor: {
    width: 10,
    height: 1,
  },
  tickLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  centerDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 80,
  },
  heightDisplay: {
    alignItems: 'center',
  },
  heightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heightNumber: {
    fontFamily: fonts.bold,
    fontSize: 64,
    color: colors.text,
  },
  heightUnit: {
    fontFamily: fonts.medium,
    fontSize: fontSize.lg,
    color: colors.text,
    marginLeft: 4,
    marginRight: spacing.md,
  },
  indicatorLine: {
    width: SCREEN_WIDTH / 2,
    height: 2,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
    marginRight: SCREEN_WIDTH / 4,
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
