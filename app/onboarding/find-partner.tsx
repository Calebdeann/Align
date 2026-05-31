import { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { strongHaptic } from '@/utils/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { fonts, spacing } from '@/constants/theme';
import { OnboardingContinueButton } from '@/components';

export default function FindPartnerScreen() {
  const statOpacity = useSharedValue(0);
  const line1Opacity = useSharedValue(0);
  const line2Opacity = useSharedValue(0);
  const line3Opacity = useSharedValue(0);

  const statAnim = useAnimatedStyle(() => ({ opacity: statOpacity.value }));
  const line1Anim = useAnimatedStyle(() => ({ opacity: line1Opacity.value }));
  const line2Anim = useAnimatedStyle(() => ({ opacity: line2Opacity.value }));
  const line3Anim = useAnimatedStyle(() => ({ opacity: line3Opacity.value }));

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    statOpacity.value = withTiming(1, { duration: 900 });
    line1Opacity.value = withDelay(560, withTiming(1, { duration: 675 }));
    line2Opacity.value = withDelay(1010, withTiming(1, { duration: 675 }));
    line3Opacity.value = withDelay(1460, withTiming(1, { duration: 675 }));
  }, []);

  return (
    <View style={styles.container}>
      {/* Full-screen background */}
      <Image
        source={require('../../assets/Onboarding Assets/Onboarding P15/partner-bg.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      {/* Top: progress bar only (no back button) */}
      <SafeAreaView edges={['top']} style={styles.topArea}>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        {/* Stat + body text */}
        <View style={styles.content}>
          <Animated.Text style={[styles.stat, statAnim]}>82%</Animated.Text>
          <Animated.Text style={[styles.body, line1Anim]}>
            {'of '}
            <Text style={styles.bodyItalic}>women</Text>
            {' who achieve'}
          </Animated.Text>
          <Animated.Text style={[styles.body, line2Anim]}>
            {'their '}
            <Text style={styles.bodyBold}>goals</Text>
            {' have someone'}
          </Animated.Text>
          <Animated.Text style={[styles.body, line3Anim]}>{'doing it with them!'}</Animated.Text>
        </View>
      </SafeAreaView>

      {/* Bottom: Find my Partner button */}
      <SafeAreaView edges={['bottom']} style={styles.bottomArea}>
        <View style={styles.buttonRow}>
          <OnboardingContinueButton
            onPress={() => {
              strongHaptic();
              router.push('/onboarding/gym-buddy');
            }}
            label="Find my Partner"
            widthRatio={0.46}
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
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
    width: 100,
    height: 4,
    backgroundColor: '#000000',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: 'center',
    gap: 0,
  },
  stat: {
    fontFamily: fonts.frauncesBold,
    fontSize: 85,
    color: '#000000',
    lineHeight: 94,
    textAlign: 'center',
    marginBottom: -10,
  },
  body: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 31,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 41,
  },
  bodyItalic: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 31,
    lineHeight: 41,
  },
  bodyBold: {
    fontFamily: fonts.frauncesBold,
    fontSize: 31,
    lineHeight: 41,
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  buttonRow: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
});
