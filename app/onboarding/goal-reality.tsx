import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { kgToLbs } from '@/utils/units';

const starsTopRight = require('../../assets/images/TopRightPurple.png');
const starsLeft = require('../../assets/images/MiddlePurple.png');
const starsBottomRight = require('../../assets/images/BottomRightPurple.png');
const purpleThumbsUp = require('../../assets/images/PurpleThumbsUp.png');

export default function GoalRealityScreen() {
  const { currentWeight, targetWeight } = useOnboardingStore();
  const { weightUnit } = useUserPreferencesStore();

  // Weights are stored in kg
  const diffKg = Math.abs(targetWeight - currentWeight);
  const isLosing = targetWeight < currentWeight;
  const percentChange = (diffKg / currentWeight) * 100;

  // Determine difficulty message
  let difficultyMessage: string;

  if (percentChange < 10) {
    difficultyMessage = "It's not hard at all!";
  } else if (percentChange < 20) {
    difficultyMessage = "It's a solid challenge!";
  } else {
    difficultyMessage = "It's ambitious but achievable!";
  }

  // Display weight in user's preferred unit
  const isLbs = weightUnit === 'lbs';
  const displayDiff = isLbs ? Math.round(kgToLbs(diffKg)) : Math.round(diffKg);
  const unitLabel = isLbs ? 'lb' : 'kg';
  const weightText = `${displayDiff}${unitLabel}`;

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
          <View style={[styles.progressBarFill, { width: '40%' }]} />
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/onboarding/goal-comparison');
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Stars top right */}
        <Image source={starsTopRight} style={styles.starsTopRight} />

        {/* Stars left */}
        <Image source={starsLeft} style={styles.starsLeft} />

        {/* Thumbs up icon */}
        <View style={styles.iconContainer}>
          <Image source={purpleThumbsUp} style={styles.thumbsUp} />
        </View>

        {/* Main text */}
        <Text style={styles.mainText}>
          {isLosing ? 'Losing' : 'Gaining'} <Text style={styles.highlightText}>{weightText}</Text>{' '}
          is a realistic target. {difficultyMessage}
        </Text>

        {/* Sub text */}
        <Text style={styles.subText}>
          90% of users say that the change is obvious after using Align and it is not easy to
          rebound
        </Text>

        {/* Stars bottom right */}
        <Image source={starsBottomRight} style={styles.starsBottomRight} />
      </View>

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={styles.continueButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  starsTopRight: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 100,
    height: 120,
    resizeMode: 'contain',
  },
  starsLeft: {
    position: 'absolute',
    top: 160,
    left: 10,
    width: 80,
    height: 100,
    resizeMode: 'contain',
  },
  starsBottomRight: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 100,
    height: 120,
    resizeMode: 'contain',
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  thumbsUp: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
  },
  mainText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: spacing.lg,
  },
  highlightText: {
    color: colors.primary,
  },
  subText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
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
