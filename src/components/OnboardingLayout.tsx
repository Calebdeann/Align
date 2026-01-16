import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

interface OnboardingLayoutProps {
  title: string;
  subtitle: string;
  currentStep: number;
  totalSteps: number;
  onContinue: () => void;
  onSkip: () => void;
  onTitlePress?: () => void;
}

function AnimatedDot({ isActive, index }: { isActive: boolean; index: number }) {
  const widthAnim = useRef(new Animated.Value(isActive ? 24 : 8)).current;
  const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: isActive ? 24 : 8,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: isActive ? 1 : 0.4,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isActive, widthAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: widthAnim,
          backgroundColor: isActive ? colors.primary : colors.border,
          opacity: opacityAnim,
        },
      ]}
    />
  );
}

export default function OnboardingLayout({
  title,
  subtitle,
  currentStep,
  totalSteps,
  onContinue,
  onSkip,
  onTitlePress,
}: OnboardingLayoutProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [currentStep, fadeAnim]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header content with fade animation */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        {onTitlePress ? (
          <Pressable onPress={onTitlePress}>
            <Text style={styles.title}>{title}</Text>
          </Pressable>
        ) : (
          <Text style={styles.title}>{title}</Text>
        )}
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>

      {/* Middle space for future content */}
      <View style={styles.content} />

      {/* Animated pagination dots */}
      <View style={styles.pagination}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <AnimatedDot key={index} isActive={index === currentStep - 1} index={index} />
        ))}
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomSection}>
        <Pressable onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <Pressable style={styles.continueButton} onPress={onContinue}>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  title: {
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
  content: {
    flex: 1,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textTertiary,
    marginBottom: spacing.md,
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
    color: colors.textInverse,
  },
});
