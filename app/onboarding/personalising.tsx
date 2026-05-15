import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { fonts } from '@/constants/theme';

const MESSAGES = [
  {
    line1: 'Personalising',
    line2Parts: [
      { text: 'your', italic: true },
      { text: ' program', italic: false },
    ],
  },
  {
    line1: 'Setting everything',
    line2Parts: [
      { text: 'up for ', italic: false },
      { text: 'you', italic: true },
    ],
  },
  {
    line1: 'Finalizing ',
    line1Parts: [
      { text: 'Finalizing ', italic: false },
      { text: 'your', italic: true },
    ],
    line2Parts: [{ text: 'final details', italic: false }],
  },
];

export default function PersonalisingScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const barWidth = screenWidth * 0.45;
  const [messageIdx, setMessageIdx] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setMessageIdx(1), 3000);
    const t2 = setTimeout(() => setMessageIdx(2), 6000);

    Animated.sequence([
      Animated.delay(500),
      Animated.timing(progress, {
        toValue: 0.15,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(progress, {
        toValue: 0.35,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(progress, {
        toValue: 0.55,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(progress, {
        toValue: 0.72,
        duration: 1200,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(progress, {
        toValue: 0.88,
        duration: 1400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        router.replace('/onboarding/signin');
      }
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, barWidth],
  });

  const msg = MESSAGES[messageIdx];

  return (
    <View style={styles.container}>
      <View style={styles.topSpacer} />

      <View style={styles.content}>
        <Text style={styles.title}>
          {msg.line1Parts ? (
            msg.line1Parts.map((p, i) => (
              <Text key={i} style={p.italic ? styles.titleItalic : styles.titleRegular}>
                {p.text}
              </Text>
            ))
          ) : (
            <Text style={styles.titleRegular}>{msg.line1}</Text>
          )}
          {'\n'}
          {msg.line2Parts.map((p, i) => (
            <Text key={i} style={p.italic ? styles.titleItalic : styles.titleRegular}>
              {p.text}
            </Text>
          ))}
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
  },
  title: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 52,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 76,
    paddingHorizontal: 32,
  },
  titleItalic: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 52,
    lineHeight: 76,
  },
  titleRegular: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 52,
    lineHeight: 76,
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
