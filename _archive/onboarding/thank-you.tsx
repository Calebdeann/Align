import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { OnboardingBackButton, OnboardingContinueButton } from '@/components';

const MultipleGirls = require('../../assets/images/MultipleGirls.png');

export default function ThankYouScreen() {
  const { t } = useTranslation();
  const { isNavigating, withLock } = useNavigationLock();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <OnboardingBackButton disabled={isNavigating} />

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '80%' }]} />
        </View>

        <Pressable
          onPress={() =>
            withLock(() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/onboarding/reviews');
            })
          }
          disabled={isNavigating}
        >
          <Text style={styles.skipText}>{t('common.skip')}</Text>
        </Pressable>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>{t('onboarding.thankYou.title')}</Text>
      </View>

      {/* Girls in Circle Image */}
      <View style={styles.imageContainer}>
        <Image source={MultipleGirls} style={styles.girlsImage} resizeMode="contain" />
      </View>

      {/* Percentage highlight */}
      <View style={styles.statsContainer}>
        <Text style={styles.percentageText}>
          <Text style={styles.percentageHighlight}>{t('onboarding.thankYou.percentage')}</Text>
        </Text>
        <Text style={styles.statsDescription}>{t('onboarding.thankYou.description')}</Text>
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <OnboardingContinueButton
          disabled={isNavigating}
          onPress={() =>
            withLock(() => {
              router.push('/onboarding/reviews');
            })
          }
        />
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
  imageContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  girlsImage: {
    width: 280,
    height: 200,
  },
  statsContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  percentageText: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
  },
  percentageHighlight: {
    color: colors.primary,
  },
  statsDescription: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 4,
  },
});
