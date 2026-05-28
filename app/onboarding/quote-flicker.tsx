import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  PixelRatio,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { strongHaptic } from '@/utils/haptics';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { fonts, spacing } from '@/constants/theme';
import { OnboardingContinueButton } from '@/components';
import { ONBOARDING_QUOTE_POOL, ONBOARDING_QUOTE_FINALS } from '@/constants/onboardingQuotes';

const imageFill = { width: '100%' as const, height: '100%' as const };

const STACK_INITIAL = 5;
const STACK_MAX = 10;
const FLICKER_INTERVAL_MS = 194;
const FADE_DURATION_MS = 450;
const CAPTION_BASE_OPACITY = 0.5;

type Card = { id: number; idx: number; tilt: number };

// Sign alternates per card id so the deck keeps its left/right shuffle feel,
// magnitude is randomly 1–4 so no two consecutive cards lean exactly the same.
function randomTilt(id: number): number {
  const sign = id % 2 === 0 ? 1 : -1;
  const magnitude = 1 + Math.floor(Math.random() * 4);
  return magnitude * sign;
}

function randomPoolIdx(): number {
  const len = Math.max(1, ONBOARDING_QUOTE_POOL.length);
  return Math.floor(Math.random() * len);
}

function makeCard(id: number): Card {
  return { id, idx: randomPoolIdx(), tilt: randomTilt(id) };
}

export default function QuoteFlickerScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = width * 0.78;
  const cardHeight = cardWidth * 1.25;

  const stickerRef = useRef<View>(null);
  const nextIdRef = useRef(0);
  const [cards, setCards] = useState<Card[]>(() =>
    Array.from({ length: STACK_INITIAL }, () => makeCard(nextIdRef.current++))
  );

  const [locked, setLocked] = useState(false);
  const [lockedFinalIndex, setLockedFinalIndex] = useState<number | null>(null);
  const lockedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Caption sits at half opacity until tap; buttons start invisible.
  const captionOpacity = useRef(new Animated.Value(CAPTION_BASE_OPACITY)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (lockedRef.current) return;
      // Strong continuous haptics while the deck is shuffling — one Heavy
      // on the tick plus a half-tick Heavy so the buzz tracks the card swap.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => {
        if (!lockedRef.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
      }, 97);
      setCards((prev) => {
        const next = [...prev, makeCard(nextIdRef.current++)];
        return next.length > STACK_MAX ? next.slice(1) : next;
      });
    }, FLICKER_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, []);

  function onLock() {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    strongHaptic();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    const finalIdx = Math.floor(Math.random() * ONBOARDING_QUOTE_FINALS.length);
    setLockedFinalIndex(finalIdx);

    Animated.parallel([
      Animated.timing(captionOpacity, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }

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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <Pressable style={styles.body} onPress={onLock} disabled={locked}>
        <View style={[styles.stackArea, { width: cardWidth, height: cardHeight }]}>
          {cards.map((card, i) => {
            const isTop = i === cards.length - 1;
            const tilt = card.tilt;
            const source =
              isTop && lockedFinalIndex !== null
                ? ONBOARDING_QUOTE_FINALS[lockedFinalIndex]
                : ONBOARDING_QUOTE_POOL[card.idx];
            return (
              <View
                key={card.id}
                ref={isTop ? stickerRef : undefined}
                collapsable={false}
                style={[
                  styles.card,
                  {
                    width: cardWidth,
                    height: cardHeight,
                    transform: [{ rotate: `${tilt}deg` }],
                    zIndex: i,
                  },
                ]}
              >
                <Image
                  source={source}
                  style={imageFill}
                  resizeMode="cover"
                  onError={(e) => {
                    console.warn('[quote-flicker] image failed', e.nativeEvent?.error);
                  }}
                />
              </View>
            );
          })}
        </View>

        <Animated.Text style={[styles.caption, { opacity: captionOpacity }]}>
          {'Tap the screen when '}
          {'\n'}
          {'it feels '}
          <Text style={styles.captionItalic}>right</Text>
        </Animated.Text>
      </Pressable>

      <Animated.View
        style={[styles.buttonsAbsolute, { opacity: buttonsOpacity }]}
        pointerEvents={locked ? 'auto' : 'none'}
      >
        <OnboardingContinueButton onPress={handleClaim} label="Claim" autoSize labelFontSize={18} />
        <Pressable
          onPress={handleLater}
          style={styles.laterButton}
          hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
        >
          <Text style={styles.laterText}>later</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 36,
  },
  stackArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  caption: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 18,
    lineHeight: 24,
    color: '#000000',
    textAlign: 'center',
  },
  captionItalic: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 18,
    lineHeight: 24,
  },
  buttonsAbsolute: {
    position: 'absolute',
    bottom: 54,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.md,
  },
  laterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  laterText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#B9B9B9',
    textDecorationLine: 'underline',
    letterSpacing: -0.44,
  },
});
