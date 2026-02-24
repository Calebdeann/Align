import { useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ScrollView,
  Image,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useNavigationLock } from '@/hooks/useNavigationLock';

// Carousel images
const Screen1 = require('../../assets/images/Screen1.png');
const Screen2 = require('../../assets/images/Screen2.png');
const Screen3 = require('../../assets/images/Screen3.png');
const Screen4 = require('../../assets/images/Screen4.png');

const SLIDE_IMAGES: ImageSourcePropType[] = [Screen1, Screen2, Screen3, Screen4];

// Animated dot component for pagination
function PaginationDot({
  index,
  scrollX,
  width,
}: {
  index: number;
  scrollX: Animated.SharedValue<number>;
  width: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const dotWidth = interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolation.CLAMP);

    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP);

    return {
      width: dotWidth,
      opacity,
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const isActive = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);

    return {
      backgroundColor: isActive > 0.5 ? colors.primary : colors.border,
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle, backgroundStyle]} />;
}

// Individual slide component with animated text
function Slide({
  item,
  index,
  scrollX,
  width,
}: {
  item: { title: string; subtitle: string; image: ImageSourcePropType };
  index: number;
  scrollX: Animated.SharedValue<number>;
  width: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);

    const translateY = interpolate(scrollX.value, inputRange, [20, 0, 20], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.slideContent, animatedStyle]}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.slideImage} resizeMode="contain" />
        </View>
      </Animated.View>
    </View>
  );
}

export default function IntroScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { isNavigating, withLock } = useNavigationLock();

  const slides = useMemo(
    () => [
      {
        title: t('onboarding.intro.slide1Title'),
        subtitle: t('onboarding.intro.slide1Subtitle'),
        image: SLIDE_IMAGES[0],
      },
      {
        title: t('onboarding.intro.slide2Title'),
        subtitle: t('onboarding.intro.slide2Subtitle'),
        image: SLIDE_IMAGES[1],
      },
      {
        title: t('onboarding.intro.slide3Title'),
        subtitle: t('onboarding.intro.slide3Subtitle'),
        image: SLIDE_IMAGES[2],
      },
      {
        title: t('onboarding.intro.slide4Title'),
        subtitle: t('onboarding.intro.slide4Subtitle'),
        image: SLIDE_IMAGES[3],
      },
    ],
    [t]
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleSkip = useCallback(() => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push('/onboarding/name');
    });
  }, [withLock]);

  const handleContinue = useCallback(() => {
    const currentPage = Math.round(scrollX.value / width);
    if (currentPage >= slides.length - 1) {
      withLock(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        router.push('/onboarding/name');
      });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      scrollViewRef.current?.scrollTo({ x: (currentPage + 1) * width, animated: true });
    }
  }, [scrollX, width, slides.length, withLock]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Scrollable slides */}
      <View style={styles.carouselContainer}>
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          decelerationRate="fast"
          bounces={false}
        >
          {slides.map((slide, index) => (
            <Slide key={index} item={slide} index={index} scrollX={scrollX} width={width} />
          ))}
        </Animated.ScrollView>
      </View>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <PaginationDot key={index} index={index} scrollX={scrollX} width={width} />
        ))}
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomSection}>
        <Pressable onPress={handleSkip} disabled={isNavigating}>
          <Text style={[styles.skipText, isNavigating && styles.skipTextDisabled]}>
            {t('common.skip')}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.continueButton, isNavigating && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={isNavigating}
        >
          <Text style={styles.continueText}>{t('common.continue')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  carouselContainer: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.xxl,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50,
  },
  slideImage: {
    width: SCREEN_WIDTH - spacing.lg * 2,
    height: 350,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.text,
    textAlign: 'center',
    marginTop: 50,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 0,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: -40,
    marginBottom: spacing.xl + 40,
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
  skipTextDisabled: {
    opacity: 0.5,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.textInverse,
  },
});
