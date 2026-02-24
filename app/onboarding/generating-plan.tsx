import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useSuperwall, usePlacement } from 'expo-superwall';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

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
  const { t } = useTranslation();
  const { skipTo } = useLocalSearchParams<{ skipTo?: string }>();
  const skipToPercent = skipTo ? parseInt(skipTo, 10) : 0;
  const hasNavigated = useRef(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const paywallTriggered = useRef(false);

  const { isConfigured, configurationError } = useSuperwall();
  const { registerPlacement } = usePlacement({
    onPresent: () => {},
    onDismiss: () => {},
    onSkip: () => navigateToSignup(),
    onError: () => navigateToSignup(),
  });

  const navigateToSignup = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    router.push('/onboarding/signup');
  }, []);

  const programDetails = useMemo(
    () => [
      { id: 'fitness', label: t('onboarding.generatePlan.fitnessLevel') },
      { id: 'goals', label: t('onboarding.generatePlan.workoutGoals') },
      { id: 'templates', label: t('onboarding.generatePlan.buildingTemplates') },
      { id: 'sets', label: t('onboarding.generatePlan.setsAndReps') },
      { id: 'muscle', label: t('onboarding.generatePlan.muscleBalance') },
    ],
    [t]
  );

  const stages = useMemo(
    () => [
      { percent: 11, message: t('onboarding.generatePlan.stage1'), checksCompleted: 1 },
      { percent: 25, message: t('onboarding.generatePlan.stage2'), checksCompleted: 2 },
      { percent: 45, message: t('onboarding.generatePlan.stage3'), checksCompleted: 3 },
      { percent: 60, message: t('onboarding.generatePlan.stage4'), checksCompleted: 4 },
      { percent: 80, message: t('onboarding.generatePlan.stage5'), checksCompleted: 5 },
      { percent: 97, message: t('onboarding.generatePlan.stage6'), checksCompleted: 5 },
    ],
    [t]
  );

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
    // If skipTo param is set, jump ahead and only animate remaining segments
    const remainingSegments = skipToPercent
      ? progressSegments.filter((s) => s.toValue > skipToPercent)
      : progressSegments;

    if (skipToPercent) {
      progressAnim.setValue(skipToPercent);
    }

    const animations = remainingSegments.map((segment) =>
      Animated.timing(progressAnim, {
        toValue: segment.toValue,
        duration: segment.duration,
        easing: segment.easing,
        useNativeDriver: false,
      })
    );

    Animated.sequence(animations).start(() => {
      setIsLoading(false);
      setLoadingComplete(true);
    });

    const percentListener = progressAnim.addListener(({ value }) => {
      setDisplayPercent(Math.round(value));

      let newStage = 0;
      if (value >= 97) newStage = 5;
      else if (value >= 80) newStage = 4;
      else if (value >= 60) newStage = 3;
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

  // Trigger Superwall paywall when loading finishes and SDK is ready
  useEffect(() => {
    if (!loadingComplete || paywallTriggered.current) return;

    if (isConfigured) {
      paywallTriggered.current = true;
      registerPlacement({
        placement: 'onboarding_trigger',
        feature: () => navigateToSignup(),
      });
    }
  }, [loadingComplete, isConfigured]);

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
        <Text style={styles.title}>{t('onboarding.generatePlan.title1')}</Text>
        <Text style={styles.title}>{t('onboarding.generatePlan.title2')}</Text>

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
