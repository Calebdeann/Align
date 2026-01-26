import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Range: 110cm - 231cm (3'10" - 7'7")
const CM_MIN = 110;
const CM_MAX = 231;
const CM_RANGE = CM_MAX - CM_MIN;

// 20px between each tick
const TICK_SPACING = 20;
const TOTAL_RULER_HEIGHT = CM_RANGE * TICK_SPACING;

// Tick dimensions - width means horizontal length (going right)
const TICK_COLOR = '#E0E0E0';
const SHORT_TICK_WIDTH = 20; // horizontal length
const SHORT_TICK_HEIGHT = 2; // vertical thickness
const LONG_TICK_WIDTH = 40; // double horizontal length
const LONG_TICK_HEIGHT = 2; // same vertical thickness

// Default height is middle of range (110-231cm)
const DEFAULT_HEIGHT_CM = 170;

export default function HeightScreen() {
  const { measurementUnit, setMeasurementUnit } = useUserPreferencesStore();
  const unit = measurementUnit === 'cm' ? 'cm' : 'ft';

  const [heightCm, setHeightCm] = useState(DEFAULT_HEIGHT_CM);
  const lastHeightRef = useRef(DEFAULT_HEIGHT_CM);

  const scrollY = useRef(new Animated.Value((DEFAULT_HEIGHT_CM - CM_MIN) * TICK_SPACING)).current;
  const lastOffset = useRef((DEFAULT_HEIGHT_CM - CM_MIN) * TICK_SPACING);

  // Listen to scrollY changes to update height display during animations
  // Also clamp the value to prevent scrolling past bounds
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      // Clamp value to valid range
      if (value < 0) {
        scrollY.setValue(0);
        lastOffset.current = 0;
        return;
      }
      if (value > TOTAL_RULER_HEIGHT) {
        scrollY.setValue(TOTAL_RULER_HEIGHT);
        lastOffset.current = TOTAL_RULER_HEIGHT;
        return;
      }

      const newCm = Math.round(CM_MIN + value / TICK_SPACING);
      const clampedCm = Math.min(Math.max(newCm, CM_MIN), CM_MAX);
      if (clampedCm !== lastHeightRef.current) {
        setHeightCm(clampedCm);
      }
    });

    return () => {
      scrollY.removeListener(listenerId);
    };
  }, [scrollY]);

  const handleUnitChange = (newUnit: 'cm' | 'ft') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setMeasurementUnit(newUnit === 'cm' ? 'cm' : 'in');
    // Reset to default height when switching units
    const defaultOffset = (DEFAULT_HEIGHT_CM - CM_MIN) * TICK_SPACING;
    setHeightCm(DEFAULT_HEIGHT_CM);
    lastHeightRef.current = DEFAULT_HEIGHT_CM;
    lastOffset.current = defaultOffset;
    scrollY.setValue(defaultOffset);
  };

  const totalInches = Math.round(heightCm / 2.54);
  const displayFeet = Math.floor(totalInches / 12);
  const displayInches = totalInches % 12;

  useEffect(() => {
    if (heightCm !== lastHeightRef.current) {
      Haptics.selectionAsync();
      lastHeightRef.current = heightCm;
    }
  }, [heightCm]);

  // Track velocity for momentum scrolling
  const velocityRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const lastDyRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        scrollY.stopAnimation((value) => {
          lastOffset.current = value;
        });
        velocityRef.current = 0;
        lastMoveTimeRef.current = Date.now();
        lastDyRef.current = 0;
      },
      onPanResponderMove: (_, gestureState) => {
        const newOffset = lastOffset.current - gestureState.dy;
        const clampedOffset = Math.min(Math.max(newOffset, 0), TOTAL_RULER_HEIGHT);
        scrollY.setValue(clampedOffset);

        // Calculate velocity for momentum
        const now = Date.now();
        const dt = now - lastMoveTimeRef.current;
        if (dt > 0) {
          const ddy = gestureState.dy - lastDyRef.current;
          velocityRef.current = (-ddy / dt) * 1000; // pixels per second
        }
        lastMoveTimeRef.current = now;
        lastDyRef.current = gestureState.dy;
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentOffset = lastOffset.current - gestureState.dy;
        const velocity = velocityRef.current;

        // Clamp current position first
        const clampedOffset = Math.min(Math.max(currentOffset, 0), TOTAL_RULER_HEIGHT);

        // Calculate where velocity would take us (approximate decay distance)
        // decay formula: distance ≈ velocity / (1 - deceleration) * timeConstant
        // For deceleration 0.997, rough multiplier is ~300-400
        const estimatedDistance = velocity * 0.3;
        let targetOffset = clampedOffset + estimatedDistance;

        // Clamp target to bounds
        targetOffset = Math.min(Math.max(targetOffset, 0), TOTAL_RULER_HEIGHT);

        // Snap to nearest cm
        const snappedCm = Math.round(CM_MIN + targetOffset / TICK_SPACING);
        const finalCm = Math.min(Math.max(snappedCm, CM_MIN), CM_MAX);
        const finalOffset = (finalCm - CM_MIN) * TICK_SPACING;
        lastOffset.current = finalOffset;

        // Always use spring animation directly to clamped position
        // This prevents any overshoot past bounds
        Animated.spring(scrollY, {
          toValue: finalOffset,
          useNativeDriver: false,
          tension: Math.abs(velocity) > 100 ? 80 : 200,
          friction: Math.abs(velocity) > 100 ? 12 : 20,
        }).start();
      },
    })
  ).current;

  // Generate ruler ticks - 5 short, 1 long pattern (memoized for performance)
  const rulerTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= CM_RANGE; i++) {
      const isLong = i % 6 === 0;

      ticks.push(
        <View key={i} style={styles.tickRow}>
          <View
            style={[
              styles.tick,
              {
                width: isLong ? LONG_TICK_WIDTH : SHORT_TICK_WIDTH,
                height: isLong ? LONG_TICK_HEIGHT : SHORT_TICK_HEIGHT,
              },
            ]}
          />
        </View>
      );
    }
    return ticks;
  }, []);

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
          <View style={[styles.progressBarFill, { width: '28%' }]} />
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
        {/* Ruler on left - starts from x=0 */}
        <View style={styles.rulerContainer}>
          <Animated.View
            style={[
              styles.rulerContent,
              {
                transform: [
                  {
                    translateY: Animated.multiply(scrollY, -1),
                  },
                ],
              },
            ]}
          >
            {rulerTicks}
          </Animated.View>
        </View>

        {/* Purple indicator line - absolute positioned, starts from left edge */}
        <View style={styles.indicatorLine} />

        {/* Height text - absolutely centered on screen */}
        <View style={styles.textContainer}>
          {unit === 'cm' ? (
            <View style={styles.heightRow}>
              <Text style={styles.heightText}>{heightCm}</Text>
              <Text style={styles.unitLabel}>cm</Text>
            </View>
          ) : (
            <Text style={styles.heightText}>
              {displayFeet}'{displayInches}
            </Text>
          )}
        </View>
      </View>

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={styles.continueButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            useOnboardingStore.getState().setAndSave('heightInches', totalInches);
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
    position: 'relative',
  },
  rulerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: LONG_TICK_WIDTH,
    overflow: 'hidden',
  },
  rulerContent: {
    position: 'absolute',
    left: 0,
    top: '35%',
    width: LONG_TICK_WIDTH,
  },
  tickRow: {
    height: TICK_SPACING,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  tick: {
    backgroundColor: TICK_COLOR,
  },
  indicatorLine: {
    position: 'absolute',
    left: 0,
    top: '35%',
    marginTop: -1.5,
    width: SCREEN_WIDTH * 0.26,
    height: 3,
    backgroundColor: colors.primary,
  },
  textContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '35%',
    transform: [{ translateY: -40 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heightText: {
    fontFamily: fonts.bold,
    fontSize: 80,
    color: colors.text,
    textAlign: 'center',
  },
  unitLabel: {
    fontFamily: fonts.medium,
    fontSize: 24,
    color: colors.textSecondary,
    marginLeft: 4,
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
