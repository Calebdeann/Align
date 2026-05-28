import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fonts } from '@/constants/theme';

export default function FindingWorkoutScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const barWidth = screenWidth * 0.45;
  const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Phone-call style sustained buzz: one Heavy every 150ms while the bar fills.
    // Starts after the 500ms fade-in delay; cleared when the bar completes.
    const startHapticTimer = setTimeout(() => {
      hapticIntervalRef.current = setInterval(
        () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
        150
      );
    }, 500);

    function stopHaptic() {
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
        hapticIntervalRef.current = null;
      }
    }

    // 500ms buffer lets the fade transition finish before the bar starts moving
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(progress, {
        toValue: 0.18,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(progress, {
        toValue: 0.38,
        duration: 950,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(progress, {
        toValue: 0.52,
        duration: 1300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(progress, {
        toValue: 0.78,
        duration: 750,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(progress, {
        toValue: 0.91,
        duration: 850,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      stopHaptic();
      if (finished) {
        router.replace('/onboarding/select-program');
      }
    });

    return () => {
      clearTimeout(startHapticTimer);
      stopHaptic();
    };
  }, []);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, barWidth],
  });

  return (
    <View style={styles.container}>
      <View style={styles.topSpacer} />

      <View style={styles.content}>
        <Text style={styles.title}>
          {'Finding your\n'}
          <Text style={styles.titleItalic}>perfect </Text>
          <Text style={styles.titleRegular}>workout</Text>
        </Text>

        <View style={[styles.barTrack, { width: barWidth }]}>
          <Animated.View style={[styles.barFill, { width: fillWidth }]} />
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topSpacer: {
    flex: 1.1,
  },
  content: {
    alignItems: 'center',
    gap: 28,
    paddingTop: 16,
    marginTop: -30,
  },
  title: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 44,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 68,
    paddingHorizontal: 32,
  },
  titleItalic: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 44,
    lineHeight: 68,
  },
  titleRegular: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 44,
    lineHeight: 68,
  },
  barTrack: {
    height: 4,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    backgroundColor: '#000000',
  },
  bottomSpacer: {
    flex: 1,
  },
});
