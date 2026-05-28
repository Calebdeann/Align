import { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  SharedValue,
} from 'react-native-reanimated';
import { spacing, fonts } from '@/constants/theme';
import { OnboardingContinueButton } from '@/components';

const { width, height } = Dimensions.get('screen');

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

export default function BecomeScreen() {
  const w0 = useSharedValue(0);
  const w1 = useSharedValue(0);
  const w2 = useSharedValue(0);
  const w3 = useSharedValue(0);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    // VERY STRONG: one Heavy stamp per word as it fades in (Become / an / It / Girl).
    const hapticDelays = [0, 510, 1020, 1530];
    const hapticTimers = hapticDelays.map((ms) =>
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), ms)
    );
    w0.value = withTiming(1, { duration: 1013 });
    w1.value = withDelay(510, withTiming(1, { duration: 1013 }));
    w2.value = withDelay(1020, withTiming(1, { duration: 1013 }));
    w3.value = withDelay(1530, withTiming(1, { duration: 1013 }));
    const t = setTimeout(() => setAnimDone(true), 1793);
    return () => {
      clearTimeout(t);
      hapticTimers.forEach(clearTimeout);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Background image fills the true full screen */}
      <Image
        source={require('../../assets/Onboarding Assets/Onboarding P3/onboarding3-full.png')}
        style={{ position: 'absolute', width, height }}
        resizeMode="cover"
      />

      {/* Text pinned to the white-space zone of the image (~43% from top) */}
      <View style={[styles.headingArea, { top: height * 0.43 }]} pointerEvents="none">
        <View style={styles.wordContainer}>
          <View style={styles.wordRow}>
            <WordItem word="Become" opacity={w0} style={styles.boldWord} />
          </View>
          <View style={styles.wordRow}>
            <WordItem word="an" opacity={w1} style={styles.italicWord} />
            <WordItem word=' "It' opacity={w2} style={styles.italicWord} />
            <WordItem word=' Girl"' opacity={w3} style={styles.italicWord} />
          </View>
        </View>
      </View>

      {/* Button anchored to the bottom safe area */}
      <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
        <View style={styles.bottomSection}>
          <OnboardingContinueButton
            onPress={() => {
              if (!animDone) return;
              router.push('/onboarding/name');
            }}
          />
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
  headingArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
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
    fontSize: 54,
    lineHeight: 65,
    color: '#000000',
  },
  italicWord: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 54,
    lineHeight: 65,
    color: '#000000',
  },
  safeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingTop: 4,
  },
});
