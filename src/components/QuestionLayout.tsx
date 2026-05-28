import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  ImageSourcePropType,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { strongHaptic } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing, radius } from '@/constants/theme';
import OnboardingBackButton from './ui/OnboardingBackButton';
import OnboardingContinueButton from './ui/OnboardingContinueButton';

// Tracks the most recently rendered progress so each new screen's progress bar
// animates from the previous value instead of snapping to its own.
let lastSeenProgress = 0;

interface QuestionLayoutProps {
  question: string;
  progress: number;
  children: React.ReactNode;
  showContinue?: boolean;
  onContinue?: () => void;
  onSkip?: () => void;
  continueDisabled?: boolean;
  navigationDisabled?: boolean;
  backgroundImage?: ImageSourcePropType;
}

export default function QuestionLayout({
  question,
  progress,
  children,
  showContinue = false,
  onContinue,
  onSkip,
  continueDisabled = false,
  navigationDisabled = false,
  backgroundImage,
}: QuestionLayoutProps) {
  const { t } = useTranslation();
  const [isNavigating, setIsNavigating] = useState(false);
  const locked = isNavigating || navigationDisabled;

  const progressShared = useSharedValue(lastSeenProgress);
  const progressFillStyle = useAnimatedStyle(() => ({
    width: `${progressShared.value}%`,
  }));

  useEffect(() => {
    progressShared.value = withTiming(progress, { duration: 350 });
    lastSeenProgress = progress;
  }, [progress, progressShared]);

  // Reset navigation state when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, [])
  );

  const handleSkip = () => {
    if (locked) return;
    setIsNavigating(true);
    strongHaptic();
    onSkip?.();
  };

  const handleBack = () => {
    if (locked) return;
    setIsNavigating(true);
    strongHaptic();
    router.back();
  };

  const handleContinue = () => {
    if (locked) return;
    setIsNavigating(true);
    strongHaptic();
    onContinue?.();
  };

  const inner = (
    <SafeAreaView style={[styles.container, backgroundImage && styles.containerTransparent]}>
      {/* Header with back, progress bar, skip */}
      <View style={styles.header}>
        <OnboardingBackButton onPress={handleBack} disabled={locked} />

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <Animated.View style={[styles.progressBarFill, progressFillStyle]} />
        </View>

        {onSkip ? (
          <Pressable onPress={handleSkip} disabled={locked}>
            <Text style={[styles.skipText, locked && styles.skipTextDisabled]}>
              {t('common.skip')}
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question}</Text>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>{children}</View>

      {/* Continue button */}
      {showContinue && (
        <View style={styles.bottomSection}>
          <OnboardingContinueButton
            onPress={handleContinue}
            disabled={continueDisabled || locked}
          />
        </View>
      )}
    </SafeAreaView>
  );

  if (backgroundImage) {
    return (
      <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
        {inner}
      </ImageBackground>
    );
  }

  return inner;
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundOnboarding,
  },
  containerTransparent: {
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    flex: 1,
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
  skipTextDisabled: {
    opacity: 0.5,
  },
  questionContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  questionText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    lineHeight: 36,
    textAlign: 'center',
  },
  contentWrapper: {
    flex: 1,
    paddingTop: 80,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: 4,
  },
});

// Shared option card styles
export const optionStyles = StyleSheet.create({
  optionsContainer: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 74,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(239, 239, 239, 0.5)',
    gap: spacing.lg,
  },
  optionCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#000000',
    flex: 1,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  optionIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
