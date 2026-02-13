import { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Share, Linking, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { colors, fonts, fontSize, spacing, shadows } from '@/constants/theme';
import { getCompletedWorkoutCount } from '@/services/api/workouts';
import { useNavigationLock } from '@/hooks/useNavigationLock';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

type CardBackground = 'light' | 'dark' | 'white';

const COMPLIMENTS = [
  'Great Work!',
  'Well Done!',
  'Good Job!',
  'Amazing!',
  'Crushed It!',
  'Keep Going!',
  'You Did It!',
  'Incredible!',
  'Way To Go!',
  'So Proud!',
  'Strong Work!',
  'Nailed It!',
  'Power Move!',
  'On Fire!',
  'Beast Mode!',
];

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return i18n.t('saveWorkout.hourMinutes', { hours, minutes });
  }
  return `${minutes}min`;
}

const CARD_THEMES: Record<
  CardBackground,
  { bg: string; text: string; sub: string; brand: string }
> = {
  light: {
    bg: '#F5F4FA',
    text: colors.text,
    sub: colors.textSecondary,
    brand: colors.textTertiary,
  },
  dark: {
    bg: '#1A1A1A',
    text: '#FFFFFF',
    sub: 'rgba(255,255,255,0.6)',
    brand: 'rgba(255,255,255,0.35)',
  },
  white: {
    bg: '#FFFFFF',
    text: colors.text,
    sub: colors.textSecondary,
    brand: colors.textTertiary,
  },
};

export default function WorkoutCompleteScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { isNavigating, withLock } = useNavigationLock();

  const workoutTitle = (params.workoutTitle as string) || 'Workout';
  const durationSeconds = parseInt(params.durationSeconds as string, 10) || 0;
  const totalVolume = (params.totalVolume as string) || '0';
  const volumeUnit = (params.volumeUnit as string) || 'kg';
  const exerciseCount = (params.exerciseCount as string) || '0';
  const totalSets = (params.totalSets as string) || '0';
  const userId = params.userId as string;

  const [workoutNumber, setWorkoutNumber] = useState<number | null>(null);
  const [cardBg, setCardBg] = useState<CardBackground>('light');
  const [showBgPicker, setShowBgPicker] = useState(false);

  const theme = CARD_THEMES[cardBg];

  const shareText = `Just finished my workout - ${workoutTitle}! ${formatDuration(durationSeconds)} | ${Number(totalVolume).toLocaleString()} ${volumeUnit} @align_tracker`;

  const compliment = useMemo(() => COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)], []);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (userId) {
      getCompletedWorkoutCount(userId).then((count) => {
        if (count > 0) setWorkoutNumber(count);
      });
    }
  }, []);

  const shareToInstagramStories = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const canOpen = await Linking.canOpenURL('instagram://app');
    if (canOpen) {
      await Linking.openURL('instagram://app');
    } else {
      await Share.share({ message: shareText });
    }
  }, [shareText]);

  const shareToTwitter = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const twitterUrl = `twitter://post?message=${encodeURIComponent(shareText)}`;
    const webUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

    try {
      const canOpen = await Linking.canOpenURL(twitterUrl);
      if (canOpen) {
        await Linking.openURL(twitterUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Linking.openURL(webUrl);
    }
  }, [shareText]);

  const shareGeneral = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({ message: shareText });
  }, [shareText]);

  const handleDone = () => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      router.dismissAll();
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Compliment Title */}
        <Text style={styles.complimentTitle}>{compliment}</Text>

        {/* Workout Count Subtitle */}
        {workoutNumber !== null && (
          <Text style={styles.subtitle}>
            This is your {getOrdinalSuffix(workoutNumber)} workout
          </Text>
        )}

        {/* Share Card */}
        <View style={styles.cardContainer}>
          <View style={[styles.shareCard, { backgroundColor: theme.bg }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{workoutTitle}</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {formatDuration(durationSeconds)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.sub }]}>
                  {t('workoutComplete.duration')}
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {Number(totalVolume).toLocaleString()} {volumeUnit}
                </Text>
                <Text style={[styles.statLabel, { color: theme.sub }]}>
                  {t('workoutComplete.volume')}
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: theme.text }]}>{exerciseCount}</Text>
                <Text style={[styles.statLabel, { color: theme.sub }]}>
                  {parseInt(exerciseCount, 10) === 1 ? 'Exercise' : t('workoutComplete.exercises')}
                </Text>
              </View>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: theme.text }]}>{totalSets}</Text>
                <Text style={[styles.statLabel, { color: theme.sub }]}>
                  {t('workoutComplete.sets')}
                </Text>
              </View>
            </View>

            <Text style={[styles.brandText, { color: theme.brand }]}>align</Text>
          </View>
        </View>

        {/* Share CTA */}
        <Text style={styles.shareCta}>{t('workoutComplete.shareWorkout')}</Text>

        {/* Share Buttons */}
        <View style={styles.shareRow}>
          <Pressable
            style={styles.shareButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowBgPicker(true);
            }}
          >
            <View style={styles.shareIconCircle}>
              <Ionicons name="image-outline" size={24} color={colors.text} />
            </View>
            <Text style={styles.shareLabel}>Background</Text>
          </Pressable>

          <Pressable style={styles.shareButton} onPress={shareToInstagramStories}>
            <View style={styles.shareIconCircle}>
              <Ionicons name="camera-outline" size={24} color={colors.text} />
            </View>
            <Text style={styles.shareLabel}>Stories</Text>
          </Pressable>

          <Pressable style={styles.shareButton} onPress={shareGeneral}>
            <View style={styles.shareIconCircle}>
              <Ionicons name="share-outline" size={24} color={colors.text} />
            </View>
            <Text style={styles.shareLabel}>More</Text>
          </Pressable>

          <Pressable style={styles.shareButton} onPress={shareToTwitter}>
            <View style={styles.shareIconCircle}>
              <Ionicons name="logo-twitter" size={24} color={colors.text} />
            </View>
            <Text style={styles.shareLabel}>Twitter</Text>
          </Pressable>
        </View>
      </View>

      {/* Done Button */}
      <View style={styles.bottomSection}>
        <Pressable style={styles.doneButton} onPress={handleDone} disabled={isNavigating}>
          <Text style={styles.doneButtonText}>{t('workoutComplete.done')}</Text>
        </Pressable>
      </View>

      {/* Background Picker Modal */}
      <Modal
        visible={showBgPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBgPicker(false)}
      >
        <Pressable style={styles.bgPickerOverlay} onPress={() => setShowBgPicker(false)}>
          <Pressable style={styles.bgPickerSheet} onPress={() => {}}>
            <Text style={styles.bgPickerTitle}>Card Background</Text>

            <View style={styles.bgPickerOptions}>
              <Pressable
                style={styles.bgPickerOptionWrapper}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCardBg('light');
                  setShowBgPicker(false);
                }}
              >
                <View
                  style={[
                    styles.bgPickerOption,
                    { backgroundColor: '#F5F4FA' },
                    cardBg === 'light' && styles.bgPickerOptionSelected,
                  ]}
                >
                  <Text style={[styles.bgPickerOptionLabel, { color: colors.text }]}>Aa</Text>
                </View>
                <Text style={styles.bgPickerLabelText}>Default</Text>
              </Pressable>

              <Pressable
                style={styles.bgPickerOptionWrapper}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCardBg('dark');
                  setShowBgPicker(false);
                }}
              >
                <View
                  style={[
                    styles.bgPickerOption,
                    { backgroundColor: '#1A1A1A' },
                    cardBg === 'dark' && styles.bgPickerOptionSelected,
                  ]}
                >
                  <Text style={[styles.bgPickerOptionLabel, { color: '#FFFFFF' }]}>Aa</Text>
                </View>
                <Text style={styles.bgPickerLabelText}>Black</Text>
              </Pressable>

              <Pressable
                style={styles.bgPickerOptionWrapper}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCardBg('white');
                  setShowBgPicker(false);
                }}
              >
                <View
                  style={[
                    styles.bgPickerOption,
                    { backgroundColor: '#FFFFFF' },
                    cardBg === 'white' && styles.bgPickerOptionSelected,
                  ]}
                >
                  <Text style={[styles.bgPickerOptionLabel, { color: colors.text }]}>Aa</Text>
                </View>
                <Text style={styles.bgPickerLabelText}>White</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  complimentTitle: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cardContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  shareCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    ...shadows.md,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  statCell: {
    width: '50%',
    paddingVertical: spacing.sm,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xxl,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  brandText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
  },
  shareCta: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  shareButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  shareIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.textInverse,
  },

  // Background picker modal
  bgPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  bgPickerSheet: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  bgPickerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  bgPickerOptions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  bgPickerOptionWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  bgPickerOption: {
    width: 76,
    height: 76,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  bgPickerOptionSelected: {
    borderWidth: 3,
    borderColor: colors.primary,
    borderStyle: 'solid',
  },
  bgPickerOptionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
  },
  bgPickerLabelText: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
