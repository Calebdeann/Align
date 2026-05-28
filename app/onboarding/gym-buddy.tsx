import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { strongHaptic } from '@/utils/haptics';
import { fonts } from '@/constants/theme';
import { GYM_BUDDIES } from '@/data/gymBuddies';

const FIGMA_W = 642;
const CIRCLE_RATIO = 286 / FIGMA_W;
const RING_RATIO = 338 / FIGMA_W;
const STROKE_WIDTH = 1.5;

function generateDelays(): number[] {
  const delays: number[] = [];
  let total = 0;
  let delay = 50;
  while (total < 10000) {
    delays.push(Math.round(delay));
    total += delay;
    delay = Math.min(delay * 1.08, 600);
  }
  return delays;
}

export default function GymBuddyScreen() {
  const { width } = useWindowDimensions();
  const circleSize = Math.round(width * CIRCLE_RATIO);
  const ringSize = Math.round(width * RING_RATIO);
  const radius = ringSize / 2 - STROKE_WIDTH / 2;
  const circumference = 2 * Math.PI * radius;

  const [currentIndex, setCurrentIndex] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const spinAnim = useRef(new Animated.Value(0)).current;
  // Pick a random buddy once on mount
  const targetIndexRef = useRef(Math.floor(Math.random() * GYM_BUDDIES.length));

  // Spinning arc
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  // Slot-machine cycling with exponential slowdown, lands on random target
  useEffect(() => {
    timersRef.current = [];
    const delays = generateDelays();
    const targetIdx = targetIndexRef.current;
    let accumulated = 0;

    delays.forEach((delay, i) => {
      accumulated += delay;
      const isLast = i === delays.length - 1;
      const timer = setTimeout(() => {
        strongHaptic();
        if (isLast) {
          setCurrentIndex(targetIdx);
          const navTimer = setTimeout(() => {
            router.push({
              pathname: '/onboarding/partner-match',
              params: { profileIndex: String(targetIdx) },
            });
          }, 2000);
          timersRef.current.push(navTimer);
        } else {
          setCurrentIndex(i % GYM_BUDDIES.length);
        }
      }, accumulated);
      timersRef.current.push(timer);
    });

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/Onboarding Assets/Onboarding P16/Background.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Spinning 70% arc + cycling profile photo */}
          <View style={[styles.profileWrapper, { width: ringSize, height: ringSize }]}>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Svg width={ringSize} height={ringSize}>
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke="#000000"
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={[circumference * 0.7, circumference * 0.3]}
                  fill="none"
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
            <View style={[StyleSheet.absoluteFill, styles.photoCenter]}>
              <View
                style={{
                  width: circleSize,
                  height: circleSize,
                  borderRadius: circleSize / 2,
                  overflow: 'hidden',
                }}
              >
                <Image
                  source={GYM_BUDDIES[currentIndex].image}
                  style={{ flex: 1 }}
                  contentFit="cover"
                />
              </View>
            </View>
          </View>

          <Text style={styles.title}>
            {'Finding '}
            <Text style={styles.titleItalic}>your</Text>
            {'\ngym '}
            <Text style={styles.titleBold}>buddy</Text>
          </Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 90,
  },
  profileWrapper: {
    marginBottom: 12,
  },
  photoCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 52,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 62,
  },
  titleItalic: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 52,
  },
  titleBold: {
    fontFamily: fonts.frauncesBold,
    fontSize: 52,
  },
});
