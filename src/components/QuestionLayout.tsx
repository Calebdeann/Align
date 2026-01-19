import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing, radius } from '@/constants/theme';

interface QuestionLayoutProps {
  question: string;
  progress: number;
  children: React.ReactNode;
  showContinue?: boolean;
  onContinue?: () => void;
  onSkip?: () => void;
  continueDisabled?: boolean;
}

export default function QuestionLayout({
  question,
  progress,
  children,
  showContinue = false,
  onContinue,
  onSkip,
  continueDisabled = false,
}: QuestionLayoutProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back, progress bar, skip */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>

        <Pressable onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
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
          <Pressable
            style={[styles.continueButton, continueDisabled && styles.continueButtonDisabled]}
            onPress={onContinue}
            disabled={continueDisabled}
          >
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
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
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
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
    height: 74,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
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
