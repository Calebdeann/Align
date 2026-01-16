import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDER_WIDTH = SCREEN_WIDTH - spacing.lg * 2 - 40;
const THUMB_SIZE = 24;

const MIN_SPEED = 0.1;
const MAX_SPEED = 1.5;
const RECOMMENDED = 0.8;

// Helper functions outside component to avoid recreation
const getPositionFromSpeed = (s: number) => {
  return ((s - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * SLIDER_WIDTH;
};

const getSpeedFromPosition = (pos: number) => {
  const clampedPos = Math.max(0, Math.min(pos, SLIDER_WIDTH));
  const newSpeed = MIN_SPEED + (clampedPos / SLIDER_WIDTH) * (MAX_SPEED - MIN_SPEED);
  return Math.round(newSpeed * 10) / 10;
};

export default function GoalSpeedScreen() {
  const { targetWeight, currentWeight, setWeeklyGoal } = useOnboardingStore();
  const [speed, setSpeed] = useState(RECOMMENDED);

  const isLosing = targetWeight < currentWeight;

  // Use Animated.Value for smooth thumb position
  const animatedPosition = useRef(new Animated.Value(getPositionFromSpeed(RECOMMENDED))).current;
  // Track the starting position when drag begins
  const startPosition = useRef(getPositionFromSpeed(RECOMMENDED));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Store the current position when touch starts
        startPosition.current = (animatedPosition as any)._value;
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate new position based on start position + drag distance
        const newPos = Math.max(0, Math.min(startPosition.current + gestureState.dx, SLIDER_WIDTH));
        animatedPosition.setValue(newPos);
        const newSpeed = getSpeedFromPosition(newPos);
        setSpeed(newSpeed);
      },
      onPanResponderRelease: () => {
        // Snap to final position
        startPosition.current = (animatedPosition as any)._value;
      },
    })
  ).current;

  // Update animated position when speed is set programmatically (e.g., Recommended button)
  const setSpeedAndAnimate = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed);
      const newPos = getPositionFromSpeed(newSpeed);
      Animated.spring(animatedPosition, {
        toValue: newPos,
        useNativeDriver: false,
        friction: 7,
      }).start();
      startPosition.current = newPos;
    },
    [animatedPosition]
  );

  const fillWidth = ((speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '85%' }]} />
        </View>

        <Pressable onPress={() => router.push('/onboarding/goal-comparison')}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>How fast do you want to reach your goal?</Text>
      </View>

      {/* Speed display */}
      <View style={styles.speedContainer}>
        <Text style={styles.speedLabel}>{isLosing ? 'Lose' : 'Gain'} weight speed per week</Text>
        <Text style={styles.speedValue}>{speed.toFixed(1)} kg</Text>
      </View>

      {/* Slider section */}
      <View style={styles.sliderSection}>
        {/* Animal icons */}
        <View style={styles.animalRow}>
          <Text style={styles.slothEmoji}>🦥</Text>
          <Text style={styles.cheetahEmoji}>🐆</Text>
        </View>

        {/* Custom Slider */}
        <View style={styles.sliderContainer} {...panResponder.panHandlers}>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${fillWidth}%` }]} />
          </View>
          <Animated.View
            style={[
              styles.sliderThumb,
              {
                transform: [
                  {
                    translateX: Animated.add(animatedPosition, -THUMB_SIZE / 2 + 20),
                  },
                ],
              },
            ]}
          />
        </View>

        {/* Labels */}
        <View style={styles.labelsRow}>
          <Text style={styles.labelText}>{MIN_SPEED} kg</Text>
          <Text style={styles.labelText}>{RECOMMENDED} kg</Text>
          <Text style={styles.labelText}>{MAX_SPEED} kg</Text>
        </View>

        {/* Recommended button */}
        <Pressable style={styles.recommendedButton} onPress={() => setSpeedAndAnimate(RECOMMENDED)}>
          <Text style={styles.recommendedText}>Recommended</Text>
        </Pressable>
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={styles.continueButton}
          onPress={() => {
            setWeeklyGoal(speed);
            router.push('/onboarding/goal-comparison');
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
    lineHeight: 36,
  },
  speedContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl * 2,
  },
  speedLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  speedValue: {
    fontFamily: fonts.bold,
    fontSize: 48,
    color: colors.text,
  },
  sliderSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
  },
  animalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  slothEmoji: {
    fontSize: 32,
  },
  cheetahEmoji: {
    fontSize: 32,
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  sliderFill: {
    height: 6,
    backgroundColor: colors.text,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.md,
  },
  labelText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  recommendedButton: {
    alignSelf: 'center',
    marginTop: spacing.xl,
    paddingVertical: 14,
    paddingHorizontal: 48,
    backgroundColor: colors.surface,
    borderRadius: 30,
  },
  recommendedText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
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
