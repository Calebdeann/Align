import { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { fonts, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { OnboardingBackButton, OnboardingContinueButton } from '@/components';

const LIFESTYLE_IMAGE = require('../../assets/Onboarding Assets/Onboarding P12/Onboarding 3 Full Page.png');
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

const NUM_DAYS = 31;
const TICK_SPACING = 16;
const RULER_HEIGHT = 48;
const HALF_SCREEN = SCREEN_WIDTH / 2;

const DATES = Array.from({ length: NUM_DAYS }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});

function formatLabel(index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const d = DATES[index];
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function TickMark({ index, scrollX }: { index: number; scrollX: Animated.SharedValue<number> }) {
  const isMajor = index % 5 === 0;

  const animStyle = useAnimatedStyle(() => {
    const dist = Math.abs(scrollX.value - index * TICK_SPACING);
    const height = interpolate(
      dist,
      [0, TICK_SPACING * 2, TICK_SPACING * 6],
      [isMajor ? 36 : 24, isMajor ? 20 : 14, isMajor ? 12 : 8],
      Extrapolation.CLAMP
    );
    return { height };
  });

  return (
    <View style={styles.tickSlot}>
      <Animated.View style={[styles.tickBar, animStyle, { width: isMajor ? 2 : 1 }]} />
    </View>
  );
}

export default function WhenToBeginScreen() {
  const setAndSave = useOnboardingStore((s) => s.setAndSave);
  const savedStartDate = useOnboardingStore((s) => s.programStartDate);
  const scrollX = useSharedValue(0);
  const initialIdx = (() => {
    if (!savedStartDate) return 0;
    const idx = DATES.findIndex((d) => {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      return iso === savedStartDate;
    });
    return idx >= 0 ? idx : 0;
  })();
  const [selectedIdx, setSelectedIdx] = useState(initialIdx);
  const [isSaving, setIsSaving] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  function handleScrollEnd(e: { nativeEvent: { contentOffset: { x: number } } }) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / TICK_SPACING);
    setSelectedIdx(Math.max(0, Math.min(NUM_DAYS - 1, idx)));
  }

  async function handleContinue() {
    if (isSaving) return;
    setIsSaving(true);
    // Local YYYY-MM-DD (avoid UTC drift from toISOString)
    const d = DATES[selectedIdx];
    const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    try {
      await setAndSave('programStartDate', isoDate);
    } finally {
      setIsSaving(false);
      router.push('/onboarding/reviews');
    }
  }

  const selectedDate = DATES[selectedIdx];
  const dateText = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* Full-page background image */}
      <Image
        source={LIFESTYLE_IMAGE}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <OnboardingBackButton />
          <View style={styles.progressCenter}>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {'When do you\nwant to '}
          <Text style={styles.titleItalic}>begin</Text>
          {'?'}
        </Text>

        {/* Pill label */}
        <View style={styles.pillWrapper}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{formatLabel(selectedIdx)}</Text>
          </View>
        </View>

        {/* Horizontal tick ruler */}
        <View style={styles.rulerWrapper}>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={TICK_SPACING}
            decelerationRate="fast"
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleScrollEnd}
            contentContainerStyle={styles.rulerContent}
            contentOffset={{ x: initialIdx * TICK_SPACING, y: 0 }}
          >
            {DATES.map((_, i) => (
              <TickMark key={i} index={i} scrollX={scrollX} />
            ))}
          </Animated.ScrollView>
        </View>

        {/* Date display */}
        <Text style={styles.dateText}>{dateText}</Text>

        <View style={{ flex: 1 }} />

        {/* Continue */}
        <View style={styles.bottomSection}>
          <OnboardingContinueButton onPress={handleContinue} disabled={isSaving} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  progressCenter: {
    flex: 1,
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
    width: 80,
    height: 4,
    backgroundColor: '#000000',
  },
  title: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 48,
    lineHeight: 56,
    color: '#000000',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  titleItalic: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 48,
  },
  pillWrapper: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  pill: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  pillText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#000000',
  },
  rulerWrapper: {
    height: RULER_HEIGHT,
    marginTop: 20,
    overflow: 'hidden',
  },
  rulerContent: {
    paddingHorizontal: HALF_SCREEN - TICK_SPACING / 2,
    alignItems: 'flex-end',
    height: RULER_HEIGHT,
  },
  tickSlot: {
    width: TICK_SPACING,
    height: RULER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tickBar: {
    backgroundColor: '#000000',
    borderRadius: 1,
  },
  dateText: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#000000',
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: -0.3,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
