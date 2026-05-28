import { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { strongHaptic } from '@/utils/haptics';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { fonts, spacing } from '@/constants/theme';
import { OnboardingContinueButton } from '@/components';
import { ONBOARDING_QUOTE_FINALS } from '@/constants/onboardingQuotes';

const imageFill = { width: '100%' as const, height: '100%' as const };

// Approximate the vertical space the old progress bar + "Make it Real" title
// used to occupy, so the card lands in the same spot as the old sticker page.
const TOP_SPACER_HEIGHT = 130;

export default function QuoteStickerScreen() {
  const stickerRef = useRef<View>(null);
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ finalIndex?: string }>();
  const parsedIndex = Number.parseInt(params.finalIndex ?? '0', 10);
  const finalIndex =
    Number.isFinite(parsedIndex) && parsedIndex >= 0 && parsedIndex < ONBOARDING_QUOTE_FINALS.length
      ? parsedIndex
      : 0;
  const source = ONBOARDING_QUOTE_FINALS[finalIndex] ?? ONBOARDING_QUOTE_FINALS[0];

  const cardWidth = (width - 40) * 0.78;
  const cardHeight = Math.min(Math.round(cardWidth * 1.32), Math.round(height * 0.52));

  async function handleClaim() {
    strongHaptic();
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
    strongHaptic();
    router.push('/onboarding/personalising');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={{ height: TOP_SPACER_HEIGHT }} />

      <View style={styles.cardArea}>
        <View
          ref={stickerRef}
          collapsable={false}
          style={[styles.card, { width: cardWidth, height: cardHeight }]}
        >
          <Image
            source={source}
            style={imageFill}
            resizeMode="cover"
            onError={(e) => {
              console.warn('[quote-sticker] image failed', e.nativeEvent?.error);
            }}
          />
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.buttons}>
        <OnboardingContinueButton onPress={handleClaim} label="Claim" autoSize />
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
  cardArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    transform: [{ rotate: '3deg' }],
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  buttons: {
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: 24,
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
