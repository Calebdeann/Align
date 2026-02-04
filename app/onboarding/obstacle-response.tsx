import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Static1 = require('../../assets/images/Static-1.png');
const Static2 = require('../../assets/images/Static-2.png');
const Static3 = require('../../assets/images/Static-3.png');
const Static4 = require('../../assets/images/Static-4.png');

interface ObstacleContent {
  title: string;
  subtitle: string;
  image: any;
}

export default function ObstacleResponseScreen() {
  const { t } = useTranslation();
  const { mainObstacle } = useOnboardingStore();
  const { isNavigating, withLock } = useNavigationLock();

  const obstacleContent: Record<string, ObstacleContent> = useMemo(
    () => ({
      schedule: {
        title: t('onboarding.obstacleResponse.scheduleTitle'),
        subtitle: t('onboarding.obstacleResponse.scheduleSubtitle'),
        image: Static1,
      },
      knowledge: {
        title: t('onboarding.obstacleResponse.knowledgeTitle'),
        subtitle: t('onboarding.obstacleResponse.knowledgeSubtitle'),
        image: Static2,
      },
      motivation: {
        title: t('onboarding.obstacleResponse.motivationTitle'),
        subtitle: t('onboarding.obstacleResponse.motivationSubtitle'),
        image: Static3,
      },
      confidence: {
        title: t('onboarding.obstacleResponse.confidenceTitle'),
        subtitle: t('onboarding.obstacleResponse.confidenceSubtitle'),
        image: Static4,
      },
    }),
    [t]
  );

  const content = (mainObstacle && obstacleContent[mainObstacle]) || obstacleContent.schedule;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Title & Subtitle */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
        </View>
      </SafeAreaView>

      {/* Phone mockup image — bottom-aligned, behind button */}
      <Image source={content.image} style={styles.mockupImage} resizeMode="contain" />

      {/* Continue button — on top of image */}
      <SafeAreaView edges={['bottom']} style={styles.buttonContainer}>
        <Pressable
          style={styles.continueButton}
          disabled={isNavigating}
          onPress={() =>
            withLock(() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.push('/onboarding/health-situations');
            })
          }
        >
          <Text style={styles.continueText}>{t('common.continue')}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundOnboarding,
  },
  safeArea: {
    zIndex: 2,
  },
  textContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 72,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  mockupImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    zIndex: 3,
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
