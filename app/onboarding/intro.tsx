import { useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  interpolate,
  Extrapolation,
  SharedValue,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, fonts } from '@/constants/theme';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { OnboardingContinueButton } from '@/components';

// heightRatio = pixel height / pixel width; topOffset shifts image down; scale is uniform zoom
const SLIDES = [
  {
    image: require('../../assets/Onboarding Assets/Onboarding P2/2.1.png'),
    heightRatio: 2190 / 1276,
    topOffset: 0,
    scale: 1,
    boldLine: 'Visualise',
    italicPhrase: 'your workouts',
  },
  {
    image: null,
    heightRatio: null,
    topOffset: 0,
    scale: 1,
    boldLine: 'Track',
    italicPhrase: 'every session',
  },
  {
    image: require('../../assets/Onboarding Assets/Onboarding P2/2.3.png'),
    heightRatio: 2058 / 1354,
    topOffset: 100,
    scale: 1.05,
    boldLine: 'Motivate',
    italicPhrase: 'each other',
  },
];

type Slide = (typeof SLIDES)[number];

function WordItem({
  word,
  opacity,
  style,
}: {
  word: string;
  opacity: SharedValue<number>;
  style: object;
}) {
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.Text style={[style, anim]}>{word}</Animated.Text>;
}

function SlideHeading({
  index,
  slide,
  scrollX,
  width,
}: {
  index: number;
  slide: Slide;
  scrollX: SharedValue<number>;
  width: number;
}) {
  const w0 = useSharedValue(0);
  const w1 = useSharedValue(0);
  const w2 = useSharedValue(0);

  const italicWords = slide.italicPhrase.split(' ');

  function triggerHaptic() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const containerStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    return { opacity };
  });

  // Slide 0 is already active on mount — useAnimatedReaction won't fire for it
  // because the value never transitions from false→true. Use useEffect instead.
  useEffect(() => {
    if (index === 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      w0.value = withTiming(1, { duration: 675 });
      w1.value = withDelay(340, withTiming(1, { duration: 675 }));
      w2.value = withDelay(680, withTiming(1, { duration: 675 }));
    }
  }, []);

  useAnimatedReaction(
    () => Math.round(scrollX.value / width) === index,
    (isActive, wasActive) => {
      if (isActive && wasActive === false) {
        runOnJS(triggerHaptic)();
        w0.value = 0;
        w1.value = 0;
        w2.value = 0;
        w0.value = withTiming(1, { duration: 675 });
        w1.value = withDelay(340, withTiming(1, { duration: 675 }));
        w2.value = withDelay(680, withTiming(1, { duration: 675 }));
      } else if (!isActive && wasActive === true) {
        w0.value = 0;
        w1.value = 0;
        w2.value = 0;
      }
    }
  );

  return (
    <Animated.View
      style={[styles.headingWrapper, StyleSheet.absoluteFill, containerStyle]}
      pointerEvents="none"
    >
      <View style={styles.wordContainer}>
        <View style={styles.wordRow}>
          <WordItem word={slide.boldLine} opacity={w0} style={styles.boldWord} />
        </View>
        <View style={styles.wordRow}>
          <WordItem word={italicWords[0]} opacity={w1} style={styles.italicWord} />
          <WordItem word={' ' + italicWords[1]} opacity={w2} style={styles.italicWord} />
        </View>
      </View>
    </Animated.View>
  );
}

export default function IntroScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  // currentPageRef is the source of truth for navigation — updated on scroll settle,
  // not from the Reanimated shared value which can lag on the JS thread.
  const currentPageRef = useRef(0);
  const { isNavigating, withLock } = useNavigationLock();

  // Slide 1: 10px below the Dynamic Island pill.
  // edges={['bottom']} lets imageSection start at y=0; insets.top - 12 ≈ pill_height + 10px.
  const slide1TopOffset = Math.max(0, insets.top - 12);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  function handleScrollEnd(e: { nativeEvent: { contentOffset: { x: number } } }) {
    currentPageRef.current = Math.round(e.nativeEvent.contentOffset.x / width);
  }

  const handleContinue = useCallback(() => {
    const page = currentPageRef.current;
    if (page >= SLIDES.length - 1) {
      withLock(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        router.push('/onboarding/become');
      });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const nextPage = page + 1;
      currentPageRef.current = nextPage;
      scrollViewRef.current?.scrollTo({ x: nextPage * width, animated: true });
    }
  }, [width, withLock]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Image carousel with gradient overlaid on top */}
      <View style={styles.imageSection}>
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScrollEnd}
          decelerationRate="fast"
          bounces={false}
          style={StyleSheet.absoluteFill}
        >
          {SLIDES.map((slide, index) => {
            const topOffset = index === 0 ? slide1TopOffset : slide.topOffset;
            return (
              <View key={index} style={[styles.slide, { width }]}>
                {slide.image && slide.heightRatio ? (
                  <Image
                    source={slide.image}
                    style={{
                      width: width * slide.scale,
                      height: width * slide.heightRatio * slide.scale,
                      marginLeft: -(width * slide.scale - width) / 2,
                      marginTop: topOffset,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder} />
                )}
              </View>
            );
          })}
        </Animated.ScrollView>

        {/* Gradient fades white over the bottom of the images */}
        <LinearGradient
          colors={['rgba(255,255,255,0)', '#ffffff']}
          style={styles.imageGradient}
          pointerEvents="none"
        />
      </View>

      {/* Animated headings, one per slide fading in/out */}
      <View style={styles.headingArea}>
        {SLIDES.map((slide, index) => (
          <SlideHeading key={index} index={index} slide={slide} scrollX={scrollX} width={width} />
        ))}
      </View>

      {/* 50px gap between heading and button; imageSection (flex:1) absorbs this so button stays fixed at bottom */}
      <View style={styles.headingButtonSpacer} />

      {/* Continue pill button */}
      <View style={styles.bottomSection}>
        <OnboardingContinueButton onPress={handleContinue} disabled={isNavigating} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageSection: {
    flex: 1,
    overflow: 'hidden',
  },
  slide: {
    height: '100%',
    overflow: 'hidden',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    width: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  headingArea: {
    height: 100,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  headingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  wordContainer: {
    alignItems: 'center',
  },
  wordRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  boldWord: {
    fontFamily: fonts.frauncesBold,
    fontSize: 44,
    lineHeight: Math.round(44 * 1.2),
    color: '#000000',
  },
  italicWord: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 44,
    lineHeight: Math.round(44 * 1.2),
    color: '#000000',
  },
  headingButtonSpacer: {
    height: 20,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: 4,
  },
});
