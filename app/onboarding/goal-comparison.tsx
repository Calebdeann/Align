import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

const BAR_HEIGHT = 180;
const GRAY_BAR_PERCENT = 0.2;
const PURPLE_BAR_PERCENT = 0.6;

export default function GoalComparisonScreen() {
  const { targetWeight, currentWeight } = useOnboardingStore();

  const isLosing = targetWeight < currentWeight;
  const actionWord = isLosing ? 'Lose' : 'Gain';

  // Animation values
  const grayBarHeight = useRef(new Animated.Value(0)).current;
  const purpleBarHeight = useRef(new Animated.Value(0)).current;
  const grayTextOpacity = useRef(new Animated.Value(0)).current;
  const purpleTextOpacity = useRef(new Animated.Value(0)).current;
  const subtextOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: bars grow up smoothly, then text fades in
    Animated.sequence([
      // Small delay before starting
      Animated.delay(50),
      // Both bars grow simultaneously with smooth easing
      Animated.parallel([
        Animated.timing(grayBarHeight, {
          toValue: BAR_HEIGHT * GRAY_BAR_PERCENT,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(purpleBarHeight, {
          toValue: BAR_HEIGHT * PURPLE_BAR_PERCENT,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      // Short delay before text appears
      Animated.delay(100),
      // All text fades in together smoothly
      Animated.parallel([
        Animated.timing(grayTextOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(purpleTextOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(subtextOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ]).start();
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
          <View style={[styles.progressBarFill, { width: '44%' }]} />
        </View>

        <View style={{ width: 32 }} />
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>
          {actionWord} twice as much{'\n'}weight with Align{'\n'}vs on your own
        </Text>
      </View>

      {/* Comparison Card */}
      <View style={styles.comparisonCard}>
        <View style={styles.barsContainer}>
          {/* Without Align */}
          <View style={styles.barColumn}>
            <Text style={styles.barLabel}>Without{'\n'}Align</Text>
            <View style={styles.barWrapper}>
              <Animated.View style={[styles.barGray, { height: grayBarHeight }]} />
              <Animated.Text style={[styles.barValue, { opacity: grayTextOpacity }]}>
                20%
              </Animated.Text>
            </View>
          </View>

          {/* With Align */}
          <View style={styles.barColumn}>
            <Text style={styles.barLabel}>With{'\n'}Align</Text>
            <View style={styles.barWrapper}>
              <Animated.View style={[styles.barPurple, { height: purpleBarHeight }]} />
              <Animated.Text style={[styles.barValuePurple, { opacity: purpleTextOpacity }]}>
                2x
              </Animated.Text>
            </View>
          </View>
        </View>

        <Animated.Text style={[styles.comparisonSubtext, { opacity: subtextOpacity }]}>
          Align makes it easy and holds{'\n'}you accountable
        </Animated.Text>
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={styles.continueButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push('/onboarding/obstacles');
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
  titleContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  titleText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  comparisonCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  barColumn: {
    alignItems: 'center',
  },
  barLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  barWrapper: {
    width: 100,
    height: 180,
    backgroundColor: colors.background,
    borderRadius: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  barGray: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: 8,
  },
  barPurple: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  barValue: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  barValuePurple: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  comparisonSubtext: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
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
  continueText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
});
