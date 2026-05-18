import { View, Text, StyleSheet, Pressable, useWindowDimensions, PixelRatio } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { fonts, spacing } from '@/constants/theme';
import { OnboardingContinueButton } from '@/components';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { getPlanById } from '@/data/plans';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatToday(): string {
  const d = new Date();
  const day = d.getDate();
  const v = day % 100;
  const suffix =
    v >= 11 && v <= 13
      ? 'th'
      : day % 10 === 1
        ? 'st'
        : day % 10 === 2
          ? 'nd'
          : day % 10 === 3
            ? 'rd'
            : 'th';
  return `${day}${suffix} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function StickerScreen() {
  const stickerRef = useRef<View>(null);
  const { selectedPlanId } = useOnboardingStore();
  const { width, height } = useWindowDimensions();

  const plan = getPlanById(selectedPlanId ?? '') ?? getPlanById('summer-body')!;
  const today = formatToday();

  const cardWidth = width - 40;
  const cardHeight = Math.min(Math.round(cardWidth * 1.68), Math.round(height * 0.52));

  async function handleGetSticker() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const uri = await captureRef(stickerRef, {
        format: 'png',
        quality: 1,
        pixelRatio: PixelRatio.get() * 2,
      });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your sticker' });
    } catch (_e) {
      // user cancelled or sharing unavailable
    }
    router.push('/onboarding/personalising');
  }

  function handleLater() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/onboarding/personalising');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarBg}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>
          {'Make it '}
          <Text style={styles.titleBold}>Real</Text>
        </Text>
      </View>

      {/* Photo card */}
      <View style={[styles.photoCard, { width: cardWidth, height: cardHeight }]}>
        <Image
          source={require('../../assets/Onboarding Assets/Onboarding P18/sticker-bg.png')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />

        {/* Sticker overlay — rotated for visual, ref on inner card for clean capture */}
        <View style={styles.stickerRotateWrapper}>
          <View ref={stickerRef} style={styles.stickerCard} collapsable={false}>
            <Text style={styles.stickerPlanName} numberOfLines={2}>
              {plan.name}
            </Text>
            <Text style={styles.stickerDate}>{today}</Text>
            {plan.highlights.map((h, i) => (
              <View key={i} style={styles.stickerRow}>
                <Ionicons name="checkmark-circle" size={13} color="#000000" />
                <Text style={styles.stickerRowText}>{h}</Text>
              </View>
            ))}
            <View style={styles.stickerDivider} />
            <Text style={styles.stickerBrand}>IT Girl</Text>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <OnboardingContinueButton onPress={handleGetSticker} label="Get my sticker" autoSize />
        <Pressable
          onPress={handleLater}
          style={styles.laterButton}
          hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
        >
          <Text style={styles.laterText}>later</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  progressRow: {
    height: 52,
    paddingTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    width: 100,
    height: 4,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
  },
  progressBarFill: {
    width: 99,
    height: 4,
    backgroundColor: '#000000',
  },
  titleRow: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 52,
    color: '#000000',
    lineHeight: 60,
    textAlign: 'center',
  },
  titleBold: {
    fontFamily: fonts.frauncesBold,
    fontSize: 52,
    lineHeight: 60,
  },
  photoCard: {
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  stickerRotateWrapper: {
    position: 'absolute',
    top: '6%',
    right: 16,
    transform: [{ rotate: '3deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  stickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    width: 162,
    gap: 5,
  },
  stickerPlanName: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 18,
    color: '#000000',
    lineHeight: 22,
    marginBottom: 1,
  },
  stickerDate: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: 'rgba(0,0,0,0.65)',
    marginBottom: 2,
  },
  stickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stickerRowText: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: 'rgba(0,0,0,0.65)',
    flex: 1,
  },
  stickerDivider: {
    height: 1,
    backgroundColor: '#D9D9D9',
    marginVertical: 3,
  },
  stickerBrand: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 11,
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 2,
  },
  buttons: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  laterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  laterText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#B9B9B9',
    textDecorationLine: 'underline',
    letterSpacing: -0.44,
  },
});
