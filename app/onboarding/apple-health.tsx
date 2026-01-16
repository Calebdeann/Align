import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

export default function AppleHealthScreen() {
  const handleConnect = () => {
    // TODO: Implement Apple Health connection
    router.push('/onboarding/reviews');
  };

  const handleSkip = () => {
    router.push('/onboarding/reviews');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '88%' }]} />
        </View>

        <Pressable onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Icon placeholder */}
      <View style={styles.iconContainer}>
        <View style={styles.iconPlaceholder} />
      </View>

      {/* Title and description */}
      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>Connect to Apple Health</Text>
        <Text style={styles.descriptionText}>
          Sync your daily activity between Align and the{'\n'}Health app to have the most thorough
          data
        </Text>
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Buttons */}
      <View style={styles.bottomSection}>
        <Pressable style={styles.continueButton} onPress={handleConnect}>
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>

        <Pressable style={styles.notNowButton} onPress={handleSkip}>
          <Text style={styles.notNowText}>Not now</Text>
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
  iconContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  iconPlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.border,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
  },
  titleText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  descriptionText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
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
  notNowButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  notNowText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
});
