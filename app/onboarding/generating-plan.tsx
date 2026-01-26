import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

const programDetails = [
  { id: 'fitness', label: 'Fitness level' },
  { id: 'muscle', label: 'Muscle balance' },
  { id: 'sets', label: 'Sets & reps' },
  { id: 'progression', label: 'Progression' },
  { id: 'health', label: 'Health score' },
];

const stages = [
  { percent: 11, message: 'Customizing your plan...', checksCompleted: 1 },
  { percent: 25, message: 'Picking the best exercises for you...', checksCompleted: 2 },
  { percent: 45, message: 'Creating your personal plan...', checksCompleted: 3 },
  { percent: 68, message: 'Customizing your plan...', checksCompleted: 4 },
  { percent: 97, message: 'Finalizing results...', checksCompleted: 5 },
];

// Segments with varying speeds to simulate buffering (~10s total)
const progressSegments = [
  { toValue: 11, duration: 1200, easing: Easing.out(Easing.ease) },
  { toValue: 18, duration: 900, easing: Easing.linear },
  { toValue: 25, duration: 700, easing: Easing.in(Easing.ease) },
  { toValue: 35, duration: 1400, easing: Easing.out(Easing.ease) },
  { toValue: 45, duration: 750, easing: Easing.in(Easing.ease) },
  { toValue: 52, duration: 1100, easing: Easing.linear },
  { toValue: 68, duration: 900, easing: Easing.inOut(Easing.ease) },
  { toValue: 78, duration: 1000, easing: Easing.out(Easing.ease) },
  { toValue: 97, duration: 1200, easing: Easing.in(Easing.ease) },
  { toValue: 100, duration: 350, easing: Easing.out(Easing.ease) },
];

// Animated checkmark component
function AnimatedCheck({ visible, onAppear }: { visible: boolean; onAppear?: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (visible && !hasTriggered.current) {
      hasTriggered.current = true;
      // Trigger heavy haptic when checkmark appears
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onAppear?.();

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.checkCircle,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Text style={styles.checkmark}>✓</Text>
    </Animated.View>
  );
}

export default function GeneratingPlanScreen() {
  const [currentStage, setCurrentStage] = useState(0);
  const [displayPercent, setDisplayPercent] = useState(0);
  const [checksVisible, setChecksVisible] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hapticInterval = useRef<NodeJS.Timeout | null>(null);

  // Constant light haptic feedback while loading
  useEffect(() => {
    if (isLoading) {
      hapticInterval.current = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 150);
    }

    return () => {
      if (hapticInterval.current) {
        clearInterval(hapticInterval.current);
      }
    };
  }, [isLoading]);

  useEffect(() => {
    const animations = progressSegments.map((segment) =>
      Animated.timing(progressAnim, {
        toValue: segment.toValue,
        duration: segment.duration,
        easing: segment.easing,
        useNativeDriver: false,
      })
    );

    Animated.sequence(animations).start(() => {
      setIsLoading(false);
      setTimeout(() => {
        router.push('/onboarding/plan-ready');
      }, 500);
    });

    const percentListener = progressAnim.addListener(({ value }) => {
      setDisplayPercent(Math.round(value));

      let newStage = 0;
      if (value >= 97) newStage = 4;
      else if (value >= 68) newStage = 3;
      else if (value >= 45) newStage = 2;
      else if (value >= 25) newStage = 1;
      else newStage = 0;

      setCurrentStage(newStage);

      // Update checks visibility based on stage
      const checksCompleted = stages[newStage]?.checksCompleted || 0;
      setChecksVisible((prev) => {
        const newChecks = [...prev];
        for (let i = 0; i < checksCompleted; i++) {
          newChecks[i] = true;
        }
        return newChecks;
      });
    });

    return () => {
      progressAnim.removeListener(percentListener);
    };
  }, []);

  const currentMessage = stages[currentStage]?.message || stages[0].message;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Percentage */}
        <Text style={styles.percentText}>{displayPercent}%</Text>

        {/* Title */}
        <Text style={styles.title}>We're setting</Text>
        <Text style={styles.title}>everything up for you</Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
            <LinearGradient
              colors={['#FFB5B5', '#C4A8FF', '#947AFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            />
          </Animated.View>
        </View>

        {/* Status Message */}
        <Text style={styles.statusMessage}>{currentMessage}</Text>

        {/* Program Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Program details:</Text>

          {programDetails.map((detail, index) => (
            <View key={detail.id} style={styles.detailRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <View style={styles.checkPlaceholder}>
                <AnimatedCheck visible={checksVisible[index]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundOnboarding,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  percentText: {
    fontFamily: fonts.bold,
    fontSize: 64,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 32,
  },
  progressBarContainer: {
    height: 8,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  statusMessage: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  detailsCard: {
    backgroundColor: colors.primaryLight + '15',
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  detailsTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  bullet: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.text,
    marginRight: spacing.sm,
  },
  detailLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  checkPlaceholder: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
